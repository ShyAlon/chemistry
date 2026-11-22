import {assembleCatalogue} from './catalogue-contract.js';
// Vite loads local JSON at build time. No network requests or backend needed.
const modules=import.meta.glob('./content/**/*.json',{eager:true,import:'default'});
const documents=Object.fromEntries(Object.entries(modules).map(([path,value])=>[path.slice('./content/'.length),value]));
export default assembleCatalogue(documents);
