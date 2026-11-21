#!/usr/bin/env python3
"""Review draft. Packages static output; verifies candidates before Pages upload.
No secret reaches PR code. prepare/recheck read GitHub, package is local.
"""
import hashlib, io, json, os, re, stat, subprocess, sys, urllib.request, urllib.error, zipfile
from pathlib import Path, PurePosixPath

class Stop(RuntimeError): pass
MAX_BYTES=100*1024*1024
MAX_FILE=25*1024*1024
SUFFIXES={'.html','.js','.css','.json','.webmanifest','.svg','.png','.jpg','.jpeg','.webp','.gif','.ico','.woff','.woff2','.ttf','.txt','.xml','.pdf','.avif','.mp3','.mp4','.ogg','.wav'}
BLOCKED={'src','tests','test-stubs','node_modules','dist-test'}
def require(ok,msg):
    if not ok: raise Stop(msg)
def sha(b):return hashlib.sha256(b).hexdigest()
def git(*args):return subprocess.check_output(['git',*args],text=True).strip()
def safe_name(name):
    p=PurePosixPath(name)
    require(name and '\\' not in name and not p.is_absolute(),'unsafe output path')
    require(all(x and x not in {'.','..'} and not x.startswith('.') and x not in BLOCKED for x in name.split('/')),'source/hidden/traversal path')
    require(p.suffix.lower() in SUFFIXES and p.name not in {'package.json','package-lock.json','credentials.json','vite.config.js'},'non-output file')
    return name

def package():
    files={}
    for p in sorted(Path('dist').rglob('*')):
        require(not p.is_symlink(),'symlink in dist')
        if p.is_file():files[safe_name(p.relative_to('dist').as_posix())]=p.read_bytes()
    require('index.html' in files and 'sw.js' in files,'missing entry/worker')
    require(len(files)<=20000 and sum(map(len,files.values()))<=MAX_BYTES,'output limit')
    require(all(len(v)<=MAX_FILE for v in files.values()),'file limit')
    meta={'tree':git('rev-parse','HEAD^{tree}'),'commit':git('rev-parse','HEAD'),
          'repository':os.environ['GITHUB_REPOSITORY'],'run_id':int(os.environ['GITHUB_RUN_ID']),
          'pr':int(os.environ.get('PR_NUMBER') or 0),'head':os.environ.get('PR_HEAD',''),
          'base':os.environ.get('PR_BASE',''),'files':{k:sha(v) for k,v in files.items()}}
    with zipfile.ZipFile('release.zip','w',zipfile.ZIP_DEFLATED) as z:
        z.writestr('release.json',json.dumps(meta,sort_keys=True))
        for k,v in files.items():z.writestr('dist/'+k,v)
    print('Packaged',len(files),'production files for tree',meta['tree'])

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs):return None

def api(path,raw=False):
    require(path.startswith('/repos/'),'unexpected API path')
    req=urllib.request.Request('https://api.github.com'+path,headers={'Authorization':'Bearer '+os.environ['GH_TOKEN'],'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'})
    try:
        response=urllib.request.build_opener(NoRedirect).open(req)
    except urllib.error.HTTPError as e:
        if raw and e.code in {301,302,303,307}:
            # Signed object storage URL gets NO account Authorization header.
            location=e.headers.get('Location','')
            require(location.startswith('https://'),'unsafe artifact redirect')
            response=urllib.request.urlopen(urllib.request.Request(location))
        else:raise Stop('GitHub API read failed with status '+str(e.code)) from None
    with response:
        b=response.read(MAX_BYTES+1)
    require(len(b)<=MAX_BYTES,'response too large')
    return b if raw else json.loads(b)

def archive_members(data):
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        infos=z.infolist()
        require(len(infos)<=20001,'too many members')
        require(len({i.filename for i in infos})==len(infos),'duplicate ZIP path')
        require(sum(i.file_size for i in infos)<=MAX_BYTES,'expanded limit')
        for i in infos:
            require(not i.is_dir() and stat.S_IFMT(i.external_attr>>16) in {0,stat.S_IFREG},'nonregular member')
            require(not(i.flag_bits&1) and i.file_size<=MAX_FILE,'encrypted or oversized member')
        return {i.filename:z.read(i) for i in infos}

def verify_release(data,expected):
    members=archive_members(data)
    require('release.json' in members,'missing manifest')
    meta=json.loads(members.pop('release.json'))
    for k,v in expected.items():require(meta.get(k)==v,'candidate metadata mismatch: '+k)
    declared=meta.get('files')
    require(isinstance(declared,dict) and declared,'invalid file manifest')
    require(set(members)=={'dist/'+n for n in declared},'extra or missing file')
    files={}
    for name,digest in declared.items():
        safe_name(name);b=members['dist/'+name]
        require(sha(b)==digest,'file hash mismatch');files[name]=b
    require('index.html' in files and 'sw.js' in files,'missing entry/worker')
    return meta,files

def prepare():
    repo=os.environ['GITHUB_REPOSITORY'];root='/repos/'+repo
    event=json.loads(Path(os.environ['GITHUB_EVENT_PATH']).read_text())
    restoring=os.environ.get('OPERATION')=='restore'
    main=api(root+'/commits/main')
    if os.environ.get('OPERATION')=='restore-snapshot':
        prepare_snapshot(main,root)
        return
    if restoring:
        run_id=os.environ.get('RESTORE_RUN','');commit=os.environ.get('RESTORE_COMMIT','')
        require(re.fullmatch(r'[1-9][0-9]*',run_id) and re.fullmatch(r'[0-9a-f]{40}',commit),'restore needs exact run ID and full source commit')
        source=api(root+'/commits/'+commit)
        relation=api(root+'/compare/'+commit+'...'+main['sha'])
        require(relation['status'] in {'ahead','identical'},'restore commit not main ancestor')
        candidates=[api(root+'/actions/runs/'+run_id)]
        pr=None
    else:
        require(os.environ.get('GITHUB_EVENT_NAME')=='push' and event.get('ref')=='refs/heads/main','promotion requires main push')
        commit=event.get('after','')
        require(re.fullmatch(r'[0-9a-f]{40}',commit) and main['sha']==commit,'main moved after push')
        associated=api(root+'/commits/'+commit+'/pulls?per_page=100')
        matches=[p for p in associated if p.get('merged_at') and p.get('merge_commit_sha')==commit and p.get('base',{}).get('ref')=='main']
        require(len(matches)==1,'push must identify exactly one merged PR')
        pr=api(root+'/pulls/'+str(matches[0]['number']))
        require(pr['merged'] and pr['merge_commit_sha']==commit and pr['base']['ref']=='main' and pr['head']['repo']['full_name']==repo,'PR not merged from same repository at pushed commit')
        source=api(root+'/commits/'+commit)
        require(main['commit']['tree']['sha']==source['commit']['tree']['sha'],'main moved after merge')
        # Bounded discovery, fail closed if the exact run is not in this page.
        candidates=api(root+'/actions/runs?per_page=50')['workflow_runs']
    chosen=None
    for run in candidates:
        if run.get('status')!='completed' or run.get('conclusion')!='success':continue
        if run.get('path')!='.github/workflows/pages.yml' or run.get('repository',{}).get('full_name')!=repo:continue
        if pr and (run.get('event')!='pull_request' or run.get('head_sha')!=pr['head']['sha']):continue
        if not pr and run.get('event') not in {'pull_request','workflow_dispatch'}:continue
        arts=api(root+'/actions/runs/'+str(run['id'])+'/artifacts')['artifacts']
        for art in arts:
            if art['name']!='tested-release' or art['expired']:continue
            require(art['size_in_bytes']<=MAX_BYTES,'artifact limit')
            outer=api(root+'/actions/artifacts/'+str(art['id'])+'/zip',raw=True)
            digest=art.get('digest','')
            require(digest.startswith('sha256:') and sha(outer)==digest[7:],'artifact API digest mismatch or unavailable')
            nested=archive_members(outer)
            require(set(nested)=={'release.zip'},'unexpected artifact container')
            expected={'repository':repo,'run_id':run['id'],'tree':source['commit']['tree']['sha']}
            if pr:expected.update(pr=pr['number'],head=pr['head']['sha'],base=pr['base']['sha'])
            meta,files=verify_release(nested['release.zip'],expected)
            if not pr:
                if meta['pr']:
                    original=api(root+'/pulls/'+str(meta['pr']))
                    require(original['merged'] and original['merge_commit_sha']==commit and original['head']['sha']==meta['head'] and run['head_sha']==meta['head'],'restore candidate not merged at supplied commit')
                else:require(meta['commit']==commit and run['event']=='workflow_dispatch' and run['head_sha']==commit,'invalid main candidate')
            chosen=(run,art,meta,files);break
        if chosen:break
    require(chosen is not None,'no successful matching retained candidate; revalidate intentionally')
    run,art,meta,files=chosen
    target=Path('verified-dist');require(not target.exists(),'verified-dist already exists')
    for name,b in files.items():
        p=target/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b)
    Path('release-guard.json').write_text(json.dumps({'main_sha':main['sha'],'source_commit':commit,'artifact':art['id'],'run':run['id']}))
    print('Verified',len(files),'files; source',commit,'artifact',art['id'])

def snapshot_files(data,record):
    require(sha(data)==record['archive_sha256'],'snapshot archive digest mismatch')
    members=archive_members(data)
    require('snapshot-evidence.json' in members,'missing snapshot evidence')
    evidence=json.loads(members.pop('snapshot-evidence.json'))
    require(evidence.get('origin')==record['origin'] and evidence.get('service_worker_version')==record['service_worker_version'],'snapshot identity mismatch')
    declared=evidence.get('files')
    require(isinstance(declared,dict) and declared,'invalid snapshot file list')
    require(set(members)=={'dist/'+n for n in declared},'unlisted snapshot file')
    files={}
    for name,info in declared.items():
        safe_name(name);b=members['dist/'+name]
        require(sha(b)==info['sha256'] and len(b)==info['bytes'],'snapshot file mismatch')
        files[name]=b
    require('index.html' in files and 'sw.js' in files,'missing snapshot entry/worker')
    return files

def prepare_snapshot(main,root):
    # Both record and fixed archive path are reviewed in the trusted main checkout.
    # No user URL, arbitrary artifact or uploaded script is accepted at run time.
    record=json.loads(Path('recovery/known-good.json').read_text())
    commit=record['source_commit']
    require(re.fullmatch(r'[0-9a-f]{40}',commit),'invalid snapshot source commit')
    relation=api(root+'/compare/'+commit+'...'+main['sha'])
    require(relation['status'] in {'ahead','identical'},'snapshot source not main ancestor')
    files=snapshot_files(Path('recovery/known-good.zip').read_bytes(),record)
    target=Path('verified-dist');require(not target.exists(),'verified-dist already exists')
    for name,b in files.items():
        p=target/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b)
    Path('release-guard.json').write_text(json.dumps({'main_sha':main['sha'],'source_commit':commit,'snapshot_sha256':record['archive_sha256']}))
    print('Verified saved snapshot',record['service_worker_version'],'with',len(files),'files')


def import_snapshot(archive_path,source_commit,run_url):
    # Local preparation only. The owner reviews the claimed deployment provenance
    # and the resulting diff; importing a ZIP is not proof of a prior CI run.
    require(re.fullmatch(r'[0-9a-f]{40}',source_commit),'full source commit required')
    require(re.fullmatch(r'https://github\.com/ShyAlon/chemistry/actions/runs/[1-9][0-9]*',run_url),'exact chemistry deployment run URL required')
    data=Path(archive_path).read_bytes();require(len(data)<=MAX_BYTES,'snapshot too large')
    members=archive_members(data)
    require('snapshot-evidence.json' in members,'snapshot evidence missing')
    evidence=json.loads(members['snapshot-evidence.json'])
    require(evidence.get('origin')=='https://shyalon.github.io/chemistry/','unexpected snapshot origin')
    record={'archive_sha256':sha(data),'source_commit':source_commit,'source_run_url':run_url,
            'origin':evidence['origin'],'service_worker_version':evidence['service_worker_version'],
            'captured_at':evidence['captured_at'],'status':'Observed production snapshot; review deployment provenance before committing'}
    files=snapshot_files(data,record)
    target=Path('recovery');target.mkdir(exist_ok=True)
    require(not (target/'known-good.zip').is_symlink() and not (target/'known-good.json').is_symlink(),'symlink recovery target')
    (target/'known-good.zip').write_bytes(data)
    (target/'known-good.json').write_text(json.dumps(record,indent=2)+'\n')
    print('Imported',len(files),'static files locally; review and commit explicitly')


def recheck():
    guard=json.loads(Path('release-guard.json').read_text())
    main=api('/repos/'+os.environ['GITHUB_REPOSITORY']+'/commits/main')
    require(main['sha']==guard['main_sha'],'main changed before publication; stop')
    print('Main unchanged before publication')

if __name__=='__main__':
    try:
        if len(sys.argv)==5 and sys.argv[1]=='import-snapshot':
            import_snapshot(*sys.argv[2:])
        else:
            require(len(sys.argv)==2 and sys.argv[1] in {'package','prepare','recheck'},'invalid operation')
            globals()[sys.argv[1]]()
    except (Stop,ValueError,KeyError,zipfile.BadZipFile) as e:
        print('STOP:',e,file=sys.stderr);sys.exit(1)
