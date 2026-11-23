// Renders every registered figure so the geometry guard can measure real SVG
// layout. Not part of the app bundle; built only by scripts/test-figures.mjs.
import React from 'react';
import {createRoot} from 'react-dom/client';
import {figures} from '../../src/figures.jsx';
window.__figureIds=Object.keys(figures);
const root=createRoot(document.getElementById('root'));
root.render(<div>{Object.entries(figures).map(([id,F])=><section key={id} data-fig={id}><F accent="#71e4f4"/></section>)}</div>);
