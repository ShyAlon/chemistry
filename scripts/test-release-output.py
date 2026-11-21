import importlib.util,io,json,os,tempfile,unittest,zipfile,hashlib,stat
from pathlib import Path
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('release_output',Path(__file__).with_name('release-output.py'));r=importlib.util.module_from_spec(spec);spec.loader.exec_module(r)
F={'index.html':b'<html>fixture</html>','sw.js':b'/* fixture */','assets/a.js':b'/* fixture */'}
def zbytes(members):
 b=io.BytesIO()
 with zipfile.ZipFile(b,'w',zipfile.ZIP_DEFLATED) as z:
  for n,v in members.items():z.writestr(n,v)
 return b.getvalue()
def release(files=None,meta=None,extra=None):
 files=F if files is None else files
 m={'repository':'ShyAlon/chemistry','tree':'tree','commit':'a'*40,'run_id':9,'pr':46,'head':'head','base':'base','files':{n:r.sha(v) for n,v in files.items()}}
 if meta:m.update(meta)
 return zbytes({'release.json':json.dumps(m).encode(),**{'dist/'+n:v for n,v in files.items()},**(extra or {})})
class ReleaseTests(unittest.TestCase):
 def test_valid(self):self.assertEqual(r.verify_release(release(),{'tree':'tree'})[1],F)
 def test_mismatch(self):
  for k in ['repository','tree','run_id','pr','head','base']:
   with self.subTest(k=k),self.assertRaises(r.Stop):r.verify_release(release(),{k:'wrong'})
 def test_unlisted(self):
  with self.assertRaises(r.Stop):r.verify_release(release(extra={'dist/extra.js':b'x'}),{})
 def test_hash(self):
  with self.assertRaises(r.Stop):r.verify_release(release(extra={'dist/assets/a.js':b'changed'}),{})
 def test_paths(self):
  for n in ['../x.js','/x.js','a\\x.js','src/a.js','.env','assets/a.js.map','package.json','a//b.js','./a.js']:
   with self.subTest(n=n),self.assertRaises(r.Stop):r.safe_name(n)
 def test_symlink(self):
  b=io.BytesIO()
  with zipfile.ZipFile(b,'w') as z:
   i=zipfile.ZipInfo('x.js');i.external_attr=(stat.S_IFLNK|0o777)<<16;z.writestr(i,b'/tmp')
  with self.assertRaises(r.Stop):r.archive_members(b.getvalue())
 def test_missing_worker(self):
  with self.assertRaises(r.Stop):r.verify_release(release(files={'index.html':b'x'}),{})
 def test_recheck_main_changed(self):
  with tempfile.TemporaryDirectory() as t:
   old=os.getcwd();os.chdir(t)
   try:
    Path('release-guard.json').write_text(json.dumps({'main_sha':'old'}))
    with patch.dict(os.environ,{'GITHUB_REPOSITORY':'ShyAlon/chemistry'}),patch.object(r,'api',return_value={'sha':'new'}),self.assertRaises(r.Stop):r.recheck()
   finally:os.chdir(old)
 def test_prepare_pr_passes(self):self.run_prepare()
 def test_prepare_pr_main_moved(self):self.run_prepare('main')
 def test_prepare_pr_failed_run(self):self.run_prepare('failed')
 def test_prepare_pr_wrong_head(self):self.run_prepare('head')
 def test_prepare_pr_wrong_repo(self):self.run_prepare('repo')
 def test_prepare_expired_artifact(self):self.run_prepare('expired')
 def test_prepare_bad_artifact_digest(self):self.run_prepare('digest')
 def test_prepare_manifest_tree_tamper(self):self.run_prepare('tree')
 def test_prepare_rejects_old_pr_event(self):self.run_prepare('event')
 def test_prepare_rejects_nonmain_ref(self):self.run_prepare('ref')
 def test_prepare_rejects_stale_push(self):self.run_prepare('stale')
 def test_prepare_rejects_direct_push(self):self.run_prepare('direct')
 def test_prepare_rejects_ambiguous_pr(self):self.run_prepare('ambiguous')
 def test_prepare_rejects_unmerged_pr(self):self.run_prepare('unmerged')
 def test_prepare_rejects_wrong_merge_commit(self):self.run_prepare('merge')
 def test_prepare_rejects_crossrepo_pr(self):self.run_prepare('fork')
 def run_prepare(self,bad=None,snapshot_failure=False):
  root='/repos/ShyAlon/chemistry';inner=release(meta={'tree':'evil'} if bad=='tree' else None);outer=zbytes({'release.zip':inner})
  run={'id':9,'status':'completed','conclusion':'failure' if bad=='failed' else 'success','path':'.github/workflows/pages.yml','repository':{'full_name':'other' if bad=='repo' else 'ShyAlon/chemistry'},'event':'pull_request','head_sha':'new' if bad=='head' else 'head'}
  def fake(path,raw=False):
   if path==root+'/commits/main':return {'sha':'e'*40,'commit':{'tree':{'sha':'changed' if bad=='main' else 'tree'}}}
   if path==root+'/commits/'+'e'*40+'/pulls?per_page=100':return [] if bad=='direct' else [{'number':46,'merged_at':'2026-11-21T12:45:37Z','merge_commit_sha':'e'*40,'base':{'ref':'main'}}]*(2 if bad=='ambiguous' else 1)
   if path==root+'/pulls/46':return {'number':46,'merged':bad!='unmerged','base':{'ref':'main','sha':'base'},'head':{'sha':'head','repo':{'full_name':'other/repo' if bad=='fork' else 'ShyAlon/chemistry'}},'merge_commit_sha':('f' if bad=='merge' else 'e')*40}
   if path==root+'/commits/'+'e'*40:return {'commit':{'tree':{'sha':'tree'}}}
   if path==root+'/actions/runs?per_page=50':return {'workflow_runs':[run]}
   if path==root+'/actions/runs/9/artifacts':return {'artifacts':[{'id':8,'name':'tested-release','expired':bad=='expired','size_in_bytes':len(outer),'digest':'sha256:'+('bad' if bad=='digest' else r.sha(outer))}]}
   if path==root+'/actions/artifacts/8/zip':return outer
   raise AssertionError(path)
  with tempfile.TemporaryDirectory() as t:
   old=os.getcwd();os.chdir(t)
   try:
    Path('event.json').write_text(json.dumps({'ref':'refs/heads/other' if bad=='ref' else 'refs/heads/main','after':('f' if bad=='stale' else 'e')*40}))
    with patch.dict(os.environ,{'GITHUB_REPOSITORY':'ShyAlon/chemistry','GITHUB_EVENT_PATH':str(Path('event.json').absolute()),'OPERATION':'','GITHUB_EVENT_NAME':'pull_request' if bad=='event' else 'push'}),patch.object(r,'api',side_effect=fake),patch.object(r,'check_snapshot',side_effect=r.Stop('snapshot mismatch') if snapshot_failure else None) as snapshot_check:
     if bad:
      reason={'main':'main moved after merge','event':'promotion requires main push','ref':'promotion requires main push','stale':'main moved after push','direct':'push must identify exactly one merged PR','ambiguous':'push must identify exactly one merged PR','unmerged':'PR not merged from same repository','merge':'PR not merged from same repository','fork':'PR not merged from same repository','digest':'artifact API digest mismatch','tree':'candidate metadata mismatch: tree'}.get(bad,'no successful matching retained candidate')
      with self.assertRaisesRegex(r.Stop,reason):r.prepare()
      self.assertFalse(Path('verified-dist').exists())
     else:
      r.prepare();snapshot_check.assert_called_once_with(F);self.assertEqual((Path('verified-dist')/'assets/a.js').read_bytes(),F['assets/a.js'])
   finally:os.chdir(old)

 def test_restore_main_candidate(self):self.restore_case()
 def test_restore_bad_lineage(self):self.restore_case('lineage')
 def test_restore_bad_head(self):self.restore_case('head')
 def test_restore_expired_artifact(self):self.restore_case('expired')
 def restore_case(self,bad=None):
  root='/repos/ShyAlon/chemistry';commit='a'*40
  inner=release(meta={'pr':0,'commit':commit});outer=zbytes({'release.zip':inner})
  def fake(path,raw=False):
   if path==root+'/commits/main':return {'sha':'b'*40,'commit':{'tree':{'sha':'latest'}}}
   if path==root+'/commits/'+commit:return {'sha':commit,'commit':{'tree':{'sha':'tree'}}}
   if path==root+'/compare/'+commit+'...'+'b'*40:return {'status':'diverged' if bad=='lineage' else 'ahead'}
   if path==root+'/actions/runs/9':return {'id':9,'status':'completed','conclusion':'success','path':'.github/workflows/pages.yml','repository':{'full_name':'ShyAlon/chemistry'},'event':'workflow_dispatch','head_sha':'wrong' if bad=='head' else commit}
   if path==root+'/actions/runs/9/artifacts':return {'artifacts':[{'id':8,'name':'tested-release','expired':bad=='expired','size_in_bytes':len(outer),'digest':'sha256:'+r.sha(outer)}]}
   if path==root+'/actions/artifacts/8/zip':return outer
   raise AssertionError(path)
  with tempfile.TemporaryDirectory() as t:
   old=os.getcwd();os.chdir(t)
   try:
    Path('event.json').write_text('{}')
    with patch.dict(os.environ,{'GITHUB_REPOSITORY':'ShyAlon/chemistry','GITHUB_EVENT_PATH':str(Path('event.json').absolute()),'OPERATION':'restore','RESTORE_RUN':'9','RESTORE_COMMIT':commit}),patch.object(r,'api',side_effect=fake),patch.object(r,'check_snapshot') as snapshot_check:
     if bad:
      with self.assertRaises(r.Stop):r.prepare()
      self.assertFalse(Path('verified-dist').exists())
     else:r.prepare();self.assertEqual(Path('verified-dist/index.html').read_bytes(),F['index.html'])
   finally:os.chdir(old)

 def test_committed_snapshot_passes(self):
  base=Path(__file__).resolve().parents[1]/'recovery'
  record=json.loads((base/'known-good.json').read_text())
  files=r.snapshot_files((base/'known-good.zip').read_bytes(),record)
  self.assertIn('sw.js',files);self.assertIn('index.html',files)
 def test_committed_snapshot_digest_fails(self):
  base=Path(__file__).resolve().parents[1]/'recovery';record=json.loads((base/'known-good.json').read_text())
  with self.assertRaises(r.Stop):r.snapshot_files((base/'known-good.zip').read_bytes()+b'changed',record)
 def test_committed_snapshot_identity_fails(self):
  base=Path(__file__).resolve().parents[1]/'recovery';record=json.loads((base/'known-good.json').read_text());record['service_worker_version']='wrong'
  with self.assertRaises(r.Stop):r.snapshot_files((base/'known-good.zip').read_bytes(),record)
 def test_restore_snapshot_prepare(self):
  base=Path(__file__).resolve().parents[1]/'recovery'
  with tempfile.TemporaryDirectory() as t:
   old=os.getcwd();os.chdir(t)
   try:
    import shutil
    shutil.copytree(base,'recovery')
    with patch.object(r,'source_identity',return_value=json.loads((base/'known-good.json').read_text())['source_identity']),patch.object(r,'git',return_value='current'):r.prepare_snapshot({'sha':'current'},'/repos/ShyAlon/chemistry')
    self.assertTrue(Path('verified-dist/index.html').exists());self.assertTrue(Path('release-guard.json').exists())
   finally:os.chdir(old)

 def test_snapshot_roundtrip_deterministic_and_stale(self):
  with tempfile.TemporaryDirectory() as t:
   old=os.getcwd();os.chdir(t)
   try:
    Path('source.txt').write_bytes(b'source')
    Path('dist/assets').mkdir(parents=True)
    for n,b in F.items():
     p=Path('dist')/n;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b)
    Path('dist/sw.js').write_bytes(b'const VERSION="1234abcd";')
    tracked='100644 blob 0\tsource.txt\0'
    with patch.object(r,'git',return_value=tracked):
     r.refresh_snapshot();first=Path('recovery/known-good.zip').read_bytes();record=Path('recovery/known-good.json').read_bytes()
     r.refresh_snapshot();self.assertEqual(Path('recovery/known-good.zip').read_bytes(),first);self.assertEqual(Path('recovery/known-good.json').read_bytes(),record)
     r.check_snapshot()
     Path('dist/assets/a.js').write_bytes(b'changed')
     with self.assertRaisesRegex(r.Stop,'differs from tested production'):r.check_snapshot()
     Path('source.txt').write_bytes(b'new source')
     with self.assertRaisesRegex(r.Stop,'source identity stale'):r.current_snapshot()
   finally:os.chdir(old)
 def test_identity_excludes_only_generated_backup(self):
  with tempfile.TemporaryDirectory() as t:
   old=os.getcwd();os.chdir(t)
   try:
    Path('source.txt').write_bytes(b'source');Path('recovery').mkdir()
    Path('recovery/known-good.json').write_bytes(b'old');Path('recovery/known-good.zip').write_bytes(b'old')
    tracked='100644 blob 0\tsource.txt\0'+'100644 blob 0\trecovery/known-good.json\0'+'100644 blob 0\trecovery/known-good.zip\0'
    with patch.object(r,'git',return_value=tracked):
     identity=r.source_identity();Path('recovery/known-good.zip').write_bytes(b'new')
     self.assertEqual(r.source_identity(),identity)
     Path('source.txt').write_bytes(b'new');self.assertNotEqual(r.source_identity(),identity)
   finally:os.chdir(old)
 def test_identity_rejects_symlink_and_unmerged_index(self):
  with tempfile.TemporaryDirectory() as t:
   old=os.getcwd();os.chdir(t)
   try:
    Path('source.txt').symlink_to('missing')
    with patch.object(r,'git',return_value='100644 blob 0\tsource.txt\0'),self.assertRaisesRegex(r.Stop,'nonregular tracked'):r.source_identity()
    with patch.object(r,'git',return_value='100644 blob 1\tsource.txt\0'),self.assertRaisesRegex(r.Stop,'unsupported tracked'):r.source_identity()
   finally:os.chdir(old)
 def test_snapshot_rejects_old_schema(self):
  with tempfile.TemporaryDirectory() as t:
   old=os.getcwd();os.chdir(t)
   try:
    Path('recovery').mkdir();Path('recovery/known-good.json').write_text('{}')
    with self.assertRaisesRegex(r.Stop,'schema/origin mismatch'):r.current_snapshot()
   finally:os.chdir(old)
 def test_snapshot_restore_rejects_old_checkout(self):
  with patch.object(r,'git',return_value='old'),self.assertRaisesRegex(r.Stop,'not current main'):r.prepare_snapshot({'sha':'new'},'/repos/ShyAlon/chemistry')
 def test_package_rejects_stale_snapshot(self):
  with patch.object(r,'production_files',return_value=F),patch.object(r,'check_snapshot',side_effect=r.Stop('stale')),self.assertRaisesRegex(r.Stop,'stale'):r.package()
 def test_real_git_identity_stable_across_snapshot_commit(self):
  import subprocess
  with tempfile.TemporaryDirectory() as t:
   old=os.getcwd();os.chdir(t)
   try:
    subprocess.run(['git','init','-q'],check=True)
    subprocess.run(['git','config','user.name','Fixture'],check=True)
    subprocess.run(['git','config','user.email','fixture@example.invalid'],check=True)
    Path('source.txt').write_bytes(b'source')
    subprocess.run(['git','add','source.txt'],check=True)
    subprocess.run(['git','commit','-qm','source'],check=True)
    identity=r.source_identity()
    Path('recovery').mkdir();Path('recovery/known-good.json').write_text('{}');Path('recovery/known-good.zip').write_bytes(b'fixture')
    subprocess.run(['git','add','recovery'],check=True)
    subprocess.run(['git','commit','-qm','same source plus backup'],check=True)
    self.assertEqual(r.source_identity(),identity)
    subprocess.run(['git','commit','--allow-empty','-qm','new commit same files'],check=True)
    self.assertEqual(r.source_identity(),identity)
    Path('new.txt').write_text('new');subprocess.run(['git','add','new.txt'],check=True)
    self.assertNotEqual(r.source_identity(),identity)
   finally:os.chdir(old)
 def test_identity_includes_executable_mode(self):
  with tempfile.TemporaryDirectory() as t:
   old=os.getcwd();os.chdir(t)
   try:
    Path('source.txt').write_bytes(b'source')
    with patch.object(r,'git',return_value='100644 blob 0\tsource.txt\0'):identity=r.source_identity()
    with patch.object(r,'git',return_value='100755 blob 0\tsource.txt\0'):self.assertNotEqual(identity,r.source_identity())
   finally:os.chdir(old)
 def test_promotion_rejects_snapshot_output_mismatch(self):
  # Existing promotion fixture exercises the call, not just the build job gate.
  with patch.object(r,'check_snapshot',side_effect=r.Stop('snapshot mismatch')):
   with self.assertRaisesRegex(r.Stop,'snapshot mismatch'):self.run_prepare(snapshot_failure=True)

class PublicationGuardTests(unittest.TestCase):
 def test_passes(self):self.case()
 def test_bad_handoff(self):self.case('handoff','invalid publication handoff')
 def test_wrong_ref(self):self.case('ref','trusted main event')
 def test_pr_event(self):self.case('event','trusted main event')
 def test_wrong_checkout(self):self.case('checkout','checkout mismatch')
 def test_wrong_id(self):self.case('id','artifact identity mismatch')
 def test_wrong_name(self):self.case('name','artifact identity mismatch')
 def test_expired(self):self.case('expired','artifact identity mismatch')
 def test_other_run(self):self.case('run','not from this exact run')
 def test_other_head(self):self.case('head','not from this exact run')
 def test_missing_listing(self):self.case('missing','ambiguous or missing')
 def test_duplicate_listing(self):self.case('duplicate','ambiguous or missing')
 def test_changed_main(self):self.case('main','main changed before publication')
 def case(self,bad=None,error=None):
  commit='a'*40;root='/repos/ShyAlon/chemistry';calls=[]
  meta={'id':11 if bad=='id' else 10,'name':'other' if bad=='name' else 'github-pages','expired':bad=='expired','workflow_run':{'id':8 if bad=='run' else 9,'head_sha':'other' if bad=='head' else commit}}
  def fake(path):
   calls.append(path)
   if path==root+'/actions/artifacts/10':return meta
   if path==root+'/actions/runs/9/artifacts?per_page=100':return {'artifacts':[] if bad=='missing' else [meta]*(2 if bad=='duplicate' else 1)}
   if path==root+'/commits/main':return {'sha':'b'*40 if bad=='main' else commit}
   raise AssertionError(path)
  env={'EXPECTED_MAIN':'bad' if bad=='handoff' else commit,'EXPECTED_ARTIFACT':'10','GITHUB_REF':'refs/heads/other' if bad=='ref' else 'refs/heads/main','GITHUB_EVENT_NAME':'pull_request' if bad=='event' else 'push','GITHUB_RUN_ID':'9','GITHUB_SHA':commit,'GITHUB_REPOSITORY':'ShyAlon/chemistry'}
  with patch.dict(os.environ,env),patch.object(r,'git',return_value='b'*40 if bad=='checkout' else commit),patch.object(r,'api',side_effect=fake):
   if error:
    with self.assertRaisesRegex(r.Stop,error):r.publish_guard()
   else:
    r.publish_guard();self.assertEqual(calls[-1],root+'/commits/main')
 def test_export_checked_exact_sha(self):self.export_case()
 def test_export_changed_main(self):self.export_case('main')
 def test_export_wrong_checkout(self):self.export_case('checkout')
 def export_case(self,bad=None):
  with tempfile.TemporaryDirectory() as t:
   old=os.getcwd();os.chdir(t)
   try:
    Path('release-guard.json').write_text(json.dumps({'main_sha':'a'*40}))
    with patch.dict(os.environ,{'GITHUB_OUTPUT':'output.txt','GITHUB_REPOSITORY':'ShyAlon/chemistry'}),patch.object(r,'api',return_value={'sha':('b' if bad=='main' else 'a')*40}),patch.object(r,'git',return_value=('b' if bad=='checkout' else 'a')*40):
     if bad:
      with self.assertRaises(r.Stop):r.export_guard()
      self.assertFalse(Path('output.txt').exists())
     else:
      r.export_guard();self.assertEqual(Path('output.txt').read_text(),'main_sha='+'a'*40+'\n')
   finally:os.chdir(old)

if __name__=='__main__':unittest.main(verbosity=2)
