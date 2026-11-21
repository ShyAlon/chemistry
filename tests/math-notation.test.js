import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import {bidiElement} from '../src/bidi-react.js';
import {ScientificText,DisplayMath,FormulaTip} from '../src/scientific-text.js';
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

test('square roots render as a radical with a barred body, never \u221a followed by brackets',()=>{
 const html=render(React.createElement(DisplayMath,{text:'u_rms = \u221a(3RT/M)'}));
 assert.ok(html.includes('class="math-root"'),html);
 assert.ok(html.includes('<span class="math-root-body">3RT/M</span>'),html);
 assert.ok(!html.includes('\u221a('),html);
 const nested=render(React.createElement('span',null,...mathNotation('v = \u221a(8RT/(\u03c0M))')));
 assert.ok(nested.includes('<span class="math-root-body">8RT/(\u03c0M)</span>'),nested);
 const subs=render(React.createElement('span',null,...mathNotation('r_A/r_B = \u221a(M_B/M_A)')));
 assert.ok(subs.includes('<span class="math-root-body">M<sub>B</sub>/M<sub>A</sub></span>'),subs);
 for(const [bare,body] of [['a = 4r/\u221a3','3'],['1/\u221aM','M'],['\u221a265,000 \u2248 515','265,000']]){
  const h=render(React.createElement('span',null,...mathNotation(bare)));
  assert.ok(h.includes(`<span class="math-root-body">${body}</span>`),bare+' -> '+h);
 }
 const unbalanced=render(React.createElement('span',null,...mathNotation('\u221a(open')));
 assert.ok(unbalanced.includes('\u221a(open'),unbalanced);
 assert.equal(render(React.createElement('span',null,...mathNotation('\u221a'))),'<span>\u221a</span>');
});
test('caret exponents render as superscripts in the shared renderer, source unchanged',()=>{
 const text='N(t) = N₀·e^(−λt) = N₀·2^(−t/t½)';
 const html=render(React.createElement(DisplayMath,{text}));
 assert.ok(html.includes('<sup>−λt</sup>'),html);
 assert.ok(html.includes('<sup>−t/t½</sup>'),html);
 assert.ok(!html.includes('^'),html);
 assert.equal(text,'N(t) = N₀·e^(−λt) = N₀·2^(−t/t½)');
 const cube=render(React.createElement(DisplayMath,{text:'a = [zM/(Nₐρ)]^(1/3)'}));
 assert.ok(cube.includes('<sup>1/3</sup>'),cube);
});
test('mixed Hebrew-prose items render RTL, pure-math items stay LTR',()=>{
 const rtl=render(React.createElement(DisplayMath,{text:'כליאה ∝ 1/R²'}));
 assert.ok(rtl.includes('dir="rtl"'),rtl);
 const ltr=render(React.createElement(DisplayMath,{text:'PV = nRT'}));
 assert.ok(ltr.includes('dir="ltr"'),ltr);
});
test('mixed Hebrew items isolate math runs: reciprocals keep order and meaning',()=>{
 const html=render(React.createElement(DisplayMath,{text:'כליאה ∝ 1/R²'}));
 assert.ok(html.includes('dir="rtl"'),html);
 assert.ok(html.includes('⁦1/R²⁩'),html);
 assert.ok(!html.includes('R²/1'),html);
 const cube=render(React.createElement(DisplayMath,{text:'a = [zM/(Nₐρ)]^(1/3)'}));
 assert.ok(cube.includes('<sup>1/3</sup>')&&!cube.includes('^'),cube);
});
test('caret exponent boundaries: nested parens, bare tokens, unbalanced stays literal',()=>{
 const nested=render(React.createElement(DisplayMath,{text:'y = a^(f(x)+1)'}));
 assert.ok(nested.includes('<sup>f(x)+1</sup>'),nested);
 const bare=render(React.createElement(DisplayMath,{text:'x^2 + y^10'}));
 assert.ok(bare.includes('<sup>2</sup>')&&bare.includes('<sup>10</sup>'),bare);
 const braced=render(React.createElement(DisplayMath,{text:'x^{n+1}'}));
 assert.ok(braced.includes('<sup>n+1</sup>'),braced);
 const open=render(React.createElement(DisplayMath,{text:'a^( + b^'}));
 assert.ok(open.includes('^(')&&open.includes('b^'),open);
});

test('authored fractions stack recursively in the shared equation and popup renderer',()=>{
 const text='frac{ΔN}{N} ≈ 4π(frac{Mw}{2πRT})^(3/2)·v²   ·e^(−frac{Mwv²}{2RT})·Δv';
 const html=render(React.createElement(DisplayMath,{text}));
 assert.equal((html.match(/class="math-fraction"/g)||[]).length,3);
 assert.ok(html.includes('class="math-fenced"'));
 assert.ok(html.includes('<sup>−<span class="math-fraction">'));
 assert.ok(html.includes('<span class="math-denominator">2RT</span>'));
 assert.ok(!html.includes('frac{')&&!html.includes('^('));
 const nested=render(React.createElement('span',null,...mathNotation('frac{a}{frac{b}{c}}')));
 assert.equal((nested.match(/class="math-fraction"/g)||[]).length,2);
 for(const literal of ['frac{a}','frac{a}{b','x^{a'])assert.ok(render(React.createElement('span',null,...mathNotation(literal))).includes(literal));
 const escaped=render(React.createElement('span',null,...mathNotation('frac{<img>}{x}')));
 assert.ok(escaped.includes('&lt;img&gt;'));
});

test('equation and symbol popup reuse the same stacked fraction expression',()=>{
 const html=render(React.createElement(FormulaTip,{text:'frac{a}{b}·e^(−frac{x}{y})',symbols:['exp']}));
 assert.equal((html.match(/class="math-fraction"/g)||[]).length,4);
 assert.ok(html.includes('exp(x) = e<sup>x</sup>'));
});
