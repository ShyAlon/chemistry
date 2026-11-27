import React from 'react';
import {Figure as BaseFigure,schematicFigures as baseSchematic} from './figures.jsx';
import {FigureX,extraSchematic} from './figures-gc1-extra.jsx';
export const schematicFigures={has:id=>baseSchematic.has(id)||extraSchematic.has(id)};
export const Figure=props=><FigureX {...props} Base={BaseFigure}/>;
