import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import {bidiElement} from '../src/bidi-react.js';
import {ScientificText,DisplayMath} from '../src/scientific-text.js';
import {mathNotation} from '../src/math-notation.js';
test('scientific subscript contract is shared by inline prose, authored runs and equation blocks',()=>{
 const text='P_A = x_A·P°_A; ΔH_vap, K_f, T_b, m_{solution}, T₁, R₀/R';
 for(const node of [bidiElement('p',null,'נתון: '+text),React.createElement(ScientificText,{runs:[{math:text}]}),React.createElement(DisplayMath,{text})]){
  const html=render(node);
  for(const x of ['A','vap','f','b','solution'])assert.ok(html.includes(`<sub>${x}</sub>`),html);
  assert.ok(html.includes('T₁'));assert.ok(html.includes('R₀/R'));
 }
 assert.equal(text,'P_A = x_A·P°_A; ΔH_vap, K_f, T_b, m_{solution}, T₁, R₀/R');
});
test('subscript parsing creates escaped text, never HTML or formula rewriting',()=>{
 assert.equal(render(React.createElement('span',null,...mathNotation('P_A + <script>'))),'<span>P<sub>A</sub> + &lt;script&gt;</span>');
 assert.equal(render(bidiElement('input',{value:'x_A'})),'<input value="x_A"/>');
 const svg=render(bidiElement('svg',null,bidiElement('text',null,'Z_eff')));assert.ok(!svg.includes('<sub'));
});
test('short temperature quantities stay atomic inside a breakable long equation',()=>{
 const html=render(bidiElement('p',null,'ΔT_b=0.512·0.200=0.1024°C, ולכן ב-100.1024°C; וגם −0.372 °F'));
 for(const x of ['0.1024°C','100.1024°C','−0.372 °F'])assert.ok(html.includes(`<span class="math-unit">${x}</span>`),html);
 assert.ok(!html.includes('class="math-unit">ΔT'));
});
