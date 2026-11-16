import {LiquidVapor,RaoultLines,OsmosisFlow,DecayMap,HalfLifeCurve} from './figures-supplement.jsx';
import {bidiElement} from './bidi-react.js';
import React from 'react';
import {UnitLadder,EmSpectrum,Photoelectric,BohrLevels,DeBroglie,Uncertainty,QuantumTree,RpdCurves,Aufbau,HundBoxes,Shielding,IeTrend,IeSuccessive,XpsSpectrum} from './figures-84102.jsx';
import {MatterTree,DensityCubes,MoleBridge,EmpiricalFlow,StoichMap,Limiting,Dilution,NetIonic,TitrationCurve,GasLaws,MaxwellBoltzmann,ImfLadder,PhaseDiagram,Bragg} from './figures-84101.jsx';

export const figures={
  'liquid-vapor':LiquidVapor,
  'raoult-lines':RaoultLines,
  'osmosis-flow':OsmosisFlow,
  'decay-map':DecayMap,
  'half-life-curve':HalfLifeCurve,
  'unit-ladder':UnitLadder,
  'em-spectrum':EmSpectrum,
  'photoelectric':Photoelectric,
  'bohr-levels':BohrLevels,
  'de-broglie':DeBroglie,
  'uncertainty':Uncertainty,
  'quantum-tree':QuantumTree,
  'rpd-curves':RpdCurves,
  'aufbau':Aufbau,
  'hund-boxes':HundBoxes,
  'shielding':Shielding,
  'ie-trend':IeTrend,
  'ie-successive':IeSuccessive,
  'xps-spectrum':XpsSpectrum,
  'matter-tree':MatterTree,
  'density-cubes':DensityCubes,
  'mole-bridge':MoleBridge,
  'empirical-flow':EmpiricalFlow,
  'stoich-map':StoichMap,
  'limiting':Limiting,
  'dilution':Dilution,
  'net-ionic':NetIonic,
  'titration-curve':TitrationCurve,
  'gas-laws':GasLaws,
  'maxwell-boltzmann':MaxwellBoltzmann,
  'imf-ladder':ImfLadder,
  'phase-diagram':PhaseDiagram,
  'bragg':Bragg,
};

// Plots whose shapes are didactic sketches rather than measured/to-scale data.
export const schematicFigures=new Set(['rpd-curves','ie-trend','ie-successive','xps-spectrum','titration-curve','gas-laws','maxwell-boltzmann','phase-diagram','bohr-levels','photoelectric','em-spectrum','shielding','uncertainty']);

export function Figure({id,accent}){
  const F=figures[id];
  if(!F)return null;
  return <F accent={accent||'#71e4f4'}/>;
}
