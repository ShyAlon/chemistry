export const STUB_USER={uid:'stub-learner',displayName:'תלמיד בדיקה',email:'student@example.test',photoURL:null};
let current=STUB_USER;try{const raw=sessionStorage.getItem('stub-auth-user');if(raw)current=JSON.parse(raw)}catch{}
const auth={stub:true,currentUser:current},listeners=new Set();
export function getAuth(){return auth}
export function onAuthStateChanged(_auth,cb){listeners.add(cb);queueMicrotask(()=>{if(listeners.has(cb))cb(auth.currentUser)});return ()=>listeners.delete(cb)}
function change(user){auth.currentUser=user;try{sessionStorage.setItem('stub-auth-user',JSON.stringify(user))}catch{}for(const cb of listeners)cb(user)}
if(typeof window!=='undefined')window.__setStubUser=uid=>change(uid?{...STUB_USER,uid,displayName:'לומד '+uid,email:uid+'@example.test'}:null);
export function signOut(){change(null);return Promise.resolve()}
export class GoogleAuthProvider{}
const unavailable=()=>Promise.reject(Object.assign(new Error('stub build: sign-in UI is not reachable'),{code:'auth/operation-not-allowed'}));
export function signInWithPopup(){return unavailable()}
export function signInWithEmailAndPassword(){return unavailable()}
export function createUserWithEmailAndPassword(){return unavailable()}
