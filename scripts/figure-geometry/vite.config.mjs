import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({root:here,plugins:[react()],base:'./',build:{rollupOptions:{input:path.join(here,'probe.html')},outDir:process.env.FIG_PROBE_OUT||path.resolve(here,'../../dist-figure-probe'),emptyOutDir:true}});
