import {RealGasBoyle} from './figures-final-prep.jsx';
import {ElectronAffinitySigns,ExamMethodMap} from './figures-recap.jsx';
import {MaxwellSpeedBand,EffusionQuantities,HydrationOrientation} from './figures-practice.jsx';
import {LiquidVapor,RaoultLines,OsmosisFlow,DecayMap,HalfLifeCurve} from './figures-supplement.jsx';
import {SurfaceAreaCut,LaMerBurst} from './figures-nano.jsx';
import {RadiationPenetration,FuelCycle,Cs137Decay,PwrLoops,PhotonInteractions,NeutronFamilies,BindingCurve,FissionEnergySplit,ChainReaction,UraniumIsotopes,EnrichmentCascade,BwrLoop,ReactorTypes,ReactorGenerations,IonizingScale,DiscoveryTimeline,TechniqueChooser,TypicalDoses,DoseEffects,StabilityValley,PosterWireframe,BetaSpectrum,PhotonSpectrum,EmBands,XraySpectrum,DecayDirections} from './figures-nuclear.jsx';
import {AnimatedFigure} from './anim-core.jsx';
import {animations} from './anim-figures.jsx';
import {BornHaberNaCl,RadiusRatioLadder,NetDipole,SolidForms,BondingFamilies,IonicTransfer,IonicMelting,CoordinationSketches,ForceRanges,BondTypeScale,MoBonding,BandClasses,PhotonEnergyRuler,ExciteRelaxEmit,CarrierCreation,ConductivityVsT,DopantLevels,DopedConductivity} from './figures-solid-state.jsx';
import {bidiElement} from './bidi-react.js';
import {EqConcTime,EqFlaskPressure,EqKApproach,EqQStrip} from './figures-gc2.jsx';
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
  'mo-bonding':MoBonding,
  'band-classes':BandClasses,
  'photon-energy-ruler':PhotonEnergyRuler,
  'excite-relax-emit':ExciteRelaxEmit,
  'carrier-creation':CarrierCreation,
  'conductivity-vs-t':ConductivityVsT,
  'dopant-levels':DopantLevels,
  'doped-conductivity':DopedConductivity,
  'surface-area-cut':SurfaceAreaCut,
  'lamer-burst':LaMerBurst,
  'nuclear-half-life':HalfLifeCurve,
  'nuclear-decay-map':DecayMap,
  'radiation-penetration':RadiationPenetration,
  'beta-spectrum':BetaSpectrum,
  'em-bands':EmBands,
  'xray-spectrum':XraySpectrum,
  'decay-directions':DecayDirections,
  'photon-spectrum':PhotonSpectrum,
  'fuel-cycle':FuelCycle,
  'cs137-decay':Cs137Decay,
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
  'eq-conc-time':EqConcTime,
  'eq-flask-pressure':EqFlaskPressure,
  'eq-k-approach':EqKApproach,
  'eq-q-strip':EqQStrip,
};

// Plots whose shapes are didactic sketches rather than measured/to-scale data.
export const schematicFigures=new Set(['surface-area-cut','lamer-burst','eq-conc-time','eq-flask-pressure','eq-k-approach','eq-q-strip','mo-bonding','band-classes','excite-relax-emit','carrier-creation','conductivity-vs-t','dopant-levels','doped-conductivity','net-dipole','solid-forms','bonding-families','ionic-transfer','coordination-sketches','radiation-penetration','beta-spectrum','em-bands','xray-spectrum','decay-directions','photon-spectrum','fuel-cycle','cs137-decay','pwr-loops','photon-interactions','neutron-energy-families','binding-energy-curve','fission-energy-split','chain-reaction','uranium-isotopes','enrichment-cascade','bwr-loop','reactor-types','reactor-generations','ionizing-scale','discovery-timeline','technique-chooser','typical-doses','dose-effects','stability-valley','poster-wireframe','rpd-curves','ie-trend','ie-successive','xps-spectrum','titration-curve','gas-laws','maxwell-boltzmann','phase-diagram','bohr-levels','photoelectric','em-spectrum','shielding','uncertainty']);

export function Figure({id,accent}){
  const F=figures[id];
  if(!F)return null;
  const A=animations[id];
  if(A)return <AnimatedFigure spec={A} accent={accent||'#71e4f4'}/>;
  return <F accent={accent||'#71e4f4'}/>;
}
