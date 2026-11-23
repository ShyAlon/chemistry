import {isLocalHebrew} from './narrator.js';
// Shared read-aloud chrome state: the active narration session (one theory
// reader at a time) plus the voice/rate preferences edited from the avatar
// menu. Preferences persist on this device only.
const KEY='spectra-read-aloud-prefs-v1';
export const RATES=[0.75,1,1.25,1.5];
let prefs={voiceURI:null,rate:1};
try{const raw=localStorage.getItem(KEY);if(raw){const p=JSON.parse(raw);if(typeof p.voiceURI==='string')prefs.voiceURI=p.voiceURI||null;if(RATES.includes(p.rate))prefs.rate=p.rate;}}catch{}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(prefs))}catch{}};
const prefListeners=new Set(),sessionListeners=new Set();
let session=null;
export const getPrefs=()=>({...prefs});
export function subscribePrefs(fn){prefListeners.add(fn);return()=>prefListeners.delete(fn)}
function applyToSession(){if(!session)return;const p=session.player;if(p.rate!==prefs.rate)p.setRate(prefs.rate);if(prefs.voiceURI&&p.voice?.voiceURI!==prefs.voiceURI&&p.voices.some(v=>v.voiceURI===prefs.voiceURI))p.selectVoice(prefs.voiceURI)}
function emitPrefs(){applyToSession();prefListeners.forEach(f=>f(getPrefs()))}
export function setVoice(uri){prefs={...prefs,voiceURI:uri||null};save();emitPrefs()}
export function setRate(rate){if(!RATES.includes(rate))return;prefs={...prefs,rate};save();emitPrefs()}
export const getSession=()=>session?{player:session.player,state:session.state,chunks:session.chunks}:null;
export function subscribeSession(fn){sessionListeners.add(fn);return()=>sessionListeners.delete(fn)}
function emitSession(){sessionListeners.forEach(f=>f(getSession()))}
// Registers the active reader's Narrator; returns the state updater the
// reader wires into onChange. Preferences apply before the first snapshot so
// the strip never shows a stale rate or voice.
export function register(player,chunks){session={player,chunks,state:null};applyToSession();session.state=player.snapshot();emitSession();return state=>{if(session?.player===player){session.state=state;emitSession()}}}
export function unregister(player){if(session?.player===player){session=null;emitSession()}}
export function localHebrewVoices(engine){try{return(engine?.getVoices()||[]).filter(isLocalHebrew)}catch{return[]}}
