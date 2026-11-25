import {RealGasBoyle} from './figures-final-prep.jsx';
import {ElectronAffinitySigns,ExamMethodMap} from './figures-recap.jsx';
import {MaxwellSpeedBand,EffusionQuantities,HydrationOrientation} from './figures-practice.jsx';
import {LiquidVapor,RaoultLines,OsmosisFlow,DecayMap,HalfLifeCurve} from './figures-supplement.jsx';
import {RadiationPenetration,FuelCycle,PwrLoops,PhotonInteractions,NeutronFamilies,BindingCurve,FissionEnergySplit,ChainReaction,UraniumIsotopes,EnrichmentCascade,BwrLoop,ReactorTypes,ReactorGenerations,IonizingScale,DiscoveryTimeline,TechniqueChooser,TypicalDoses,DoseEffects,StabilityValley,PosterWireframe} from './figures-nuclear.jsx';
import {BornHaberNaCl,RadiusRatioLadder,NetDipole,SolidForms,BondingFamilies,IonicTransfer,IonicMelting,CoordinationSketches,ForceRanges,BondTypeScale} from './figures-solid-state.jsx';
import {bidiElement} from './bidi-react.js';
import React from 'react';
import {UnitLadder,EmSpectrum,Photoelectric,BohrLevels,DeBroglie,Uncertainty,QuantumTree,RpdCurves,Aufbau,HundBoxes,Shielding,IeTrend,IeSuccessive,XpsSpectrum} from './figures-84102.jsx';
import {MatterTree,DensityCubes,MoleBridge,EmpiricalFlow,StoichMap,Limiting,Dilution,NetIonic,TitrationCurve,GasLaws,MaxwellBoltzmann,ImfLadder,PhaseDiagram,Bragg} from './figures-84101.jsx';

export const figures={
  'born-haber-nacl':BornHaberNaCl,
  'radius-ratio-ladder':RadiusRatioLadder,
  'net-dipole':NetDipole,
  'solid-forms':SolidForms,
  'bonding-families':BondingFamilies,
  'ionic-transfer':IonicTransfer,
  'ionic-melting':IonicMelting,
  'coordination-sketches':CoordinationSketches,
  'force-ranges':ForceRanges,
  'bond-type-scale':BondTypeScale,
  'nuclear-half-life':HalfLifeCurve,
  'nuclear-decay-map':DecayMap,
  'radiation-penetration':RadiationPenetration,
  'fuel-cycle':FuelCycle,
  'pwr-loops':PwrLoops,
  'photon-interactions':PhotonInteractions,
  'neutron-energy-families':NeutronFamilies,
  'binding-energy-curve':BindingCurve,
  'fission-energy-split':FissionEnergySplit,
  'chain-reaction':ChainReaction,
  'uranium-isotopes':UraniumIsotopes,
  'enrichment-cascade':EnrichmentCascade,
  'bwr-loop':BwrLoop,
  'reactor-types':ReactorTypes,
  'reactor-generations':ReactorGenerations,
  'ionizing-scale':IonizingScale,
  'discovery-timeline':DiscoveryTimeline,
  'technique-chooser':TechniqueChooser,
  'typical-doses':TypicalDoses,
  'dose-effects':DoseEffects,
  'stability-valley':StabilityValley,
  'poster-wireframe':PosterWireframe,
  'bragg-nuclear':Bragg,
  'real-gas-boyle':RealGasBoyle,
  'electron-affinity-signs':ElectronAffinitySigns,
  'exam-method-map':ExamMethodMap,
  'maxwell-speed-band':MaxwellSpeedBand,
  'effusion-quantities':EffusionQuantities,
  'hydration-orientation':HydrationOrientation,
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
export const schematicFigures=new Set(['net-dipole','solid-forms','bonding-families','ionic-transfer','coordination-sketches','radiation-penetration','fuel-cycle','pwr-loops','photon-interactions','neutron-energy-families','binding-energy-curve','fission-energy-split','chain-reaction','uranium-isotopes','enrichment-cascade','bwr-loop','reactor-types','reactor-generations','ionizing-scale','discovery-timeline','technique-chooser','typical-doses','dose-effects','stability-valley','poster-wireframe','rpd-curves','ie-trend','ie-successive','xps-spectrum','titration-curve','gas-laws','maxwell-boltzmann','phase-diagram','bohr-levels','photoelectric','em-spectrum','shielding','uncertainty']);

export function Figure({id,accent}){
  const F=figures[id];
  if(!F)return null;
  return <F accent={accent||'#71e4f4'}/>;
}
