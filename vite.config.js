import {defineConfig} from 'vite';
import path from 'node:path';
import {pwaBuild} from './scripts/pwa-build.mjs';
// BROWSER_TEST_STUB=1 (npm run build:test) aliases firebase/* to the hermetic
// doubles in src/test-stubs/ so the browser suites run with no network,
// accounts or live models. Production builds never set it.
const testStub=process.env.BROWSER_TEST_STUB==='1';
const stub=name=>path.resolve('src/test-stubs/'+name);
export default defineConfig({plugins:[pwaBuild()],base:'/chemistry/',esbuild:{jsxFactory:'bidiElement',jsxFragment:'React.Fragment'},resolve:testStub?{alias:{'firebase/app':stub('firebase-app.js'),'firebase/auth':stub('firebase-auth.js'),'firebase/firestore':stub('firebase-firestore.js'),'firebase/ai':stub('firebase-ai.js'),'firebase/app-check':stub('firebase-app-check.js')}}:{}});
