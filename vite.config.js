import {defineConfig} from 'vite';
import {pwaBuild} from './scripts/pwa-build.mjs';
export default defineConfig({plugins:[pwaBuild()],base:'/chemistry/',esbuild:{jsxFactory:'bidiElement',jsxFragment:'React.Fragment'}});
