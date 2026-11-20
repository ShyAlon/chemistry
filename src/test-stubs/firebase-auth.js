export const STUB_USER={uid:'stub-learner',displayName:'תלמיד בדיקה',email:'student@example.test',photoURL:null};
const auth={stub:true,currentUser:STUB_USER};
export function getAuth(){return auth}
export function onAuthStateChanged(_auth,cb){queueMicrotask(()=>cb(STUB_USER));return ()=>{}}
export function signOut(){return Promise.resolve()}
export class GoogleAuthProvider{}
const unavailable=()=>Promise.reject(Object.assign(new Error('stub build: sign-in UI is not reachable'),{code:'auth/operation-not-allowed'}));
export function signInWithPopup(){return unavailable()}
export function signInWithEmailAndPassword(){return unavailable()}
export function createUserWithEmailAndPassword(){return unavailable()}
