# Scientific text and responsive reference layouts

## Separate failures, separate protections

- Mixed Hebrew/electron prose: the inferred LTR run absorbed `4s²3d⁴; Cu`, making the copper label look attached to the preceding chromium comparison. A top-level semicolon before a Latin/Greek label now ends that run. Bracketed expressions, decimal points, comma enumerations and unit strings retain their existing handling.
- Authored ASCII subscripts: `_A`, `_vap`, `_f`, `_b` and `_{solution}` suffixes render as semantic subscript text inside inferred scientific runs, explicit ScientificText math runs, DisplayMath and formula chips. Native Unicode subscripts remain unchanged. This is display-only, not a formula parser. SVG labels still use native Unicode/tspan notation. Machine values, original source strings, questions, answers and storage are not rewritten.
- Phone header: below 521 CSS pixels, navigation has its own row. All links remain visible with 18px text. Wider layouts, including short landscape, retain the existing shared bars.
- Periodic table: the former fixed 1060px grid plus 340px sidebar exceeded the available content width. The sidebar is now 240px, and the 18 columns grow from a 44px minimum without shrinking atomic numbers (18px) or symbols (22px). Side-by-side placement starts at 1280px. Smaller screens put the panel above the table; narrow screens have a labelled horizontal scroller. F-block range markers use two lines rather than spilling into adjacent cells.

## Run the gates

```
npm ci
npm test
npm run build
npm run test:browser
```

The browser gate uses a local production build, a temporary Chrome profile and built-in Node APIs. Set CHROME_BIN if Chrome is not named google-chrome. External requests are blocked. It checks 10 screen sizes across six routes (course picker, P7, formula sheet, periodic table, diagrams and Aufbau), plus 10 notation fixtures. Assertions cover actual visible navigation bounds, page width, footer placement, full group-18/Og visibility on fitting screens, phone scroll access and electron removal/reset. Optional SCREENSHOTS=/path saves review images. The build command runs the same gate, so the existing CI build step blocks deployment on a browser regression without changing workflow permissions.

The exact reported paragraph has a regression test. It failed against the original boundary rule. The browser gate also failed against the original header CSS. Both pass with these fixes. The existing original-content hash and progress/answer tests remain unchanged and pass.

These checks target known failure classes. They do not guarantee every possible chemistry expression or every browser font is correct. Review new notation and representative desktop, phone and landscape pixels when expanding this renderer contract.
