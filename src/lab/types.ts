export type StationId =
  | "pendulum"
  | "optics"
  | "titration"
  | "circuit"
  | "electrolysis"
  | "photosynthesis"
  | "microscope"
  | "projectile"
  | "boyles"
  | "wave"
  | "dna"
  | "trig";

export type LabViewMode = "orbit" | "walk" | "ar-camera" | "vr-xr" | "ar-xr";

export type MicroscopeSpecimen = "onion" | "stomata" | "cheek";

export type DnaBase = "A" | "T" | "C" | "G";

export interface PendulumState {
  running: boolean;
  lengthM: number;
  amplitudeDeg: number;
  angleRad: number;
  elapsedOscillations: number;
  measuredPeriodS: number;
}

export interface OpticsState {
  beamOn: boolean;
  prismAngleDeg: number;
  refractiveIndex: number;
  deviationDeg: number;
}

export interface TitrationState {
  acidVolumeMl: number;
  baseAddedMl: number;
  currentPh: number;
  dropPulse: number;
}

export interface CircuitState {
  switchClosed: boolean;
  voltageV: number;
  resistanceOhm: number;
  currentA: number;
}

export interface ElectrolysisState {
  powerOn: boolean;
  voltageV: number; // 2 to 12 V
  h2VolumeMl: number; // 0 to 30 mL
  o2VolumeMl: number; // h2 / 2
}

export interface PhotosynthesisState {
  lampOn: boolean;
  lightIntensityPct: number; // 10 to 100
  co2LevelGl: number; // 0.2 to 2.0
  bubblesPerMin: number;
}

export interface MicroscopeState {
  illuminatorOn: boolean;
  magnification: 4 | 10 | 40;
  focusValue: number; // 0 to 100 (sharpest at 50)
  specimen: MicroscopeSpecimen;
}

export interface ProjectileState {
  angleDeg: number; // 15 to 75
  speedMs: number; // 2.0 to 5.0
  rangeM: number;
  launchPulse: number;
  lastLandedRangeM: number | null;
}

export interface BoylesState {
  volumeMl: number; // 10 to 50 mL, P*V = 4000 kPa*mL
  pressureKpa: number;
}

export interface WaveState {
  running: boolean;
  frequencyHz: number; // 10 to 90 Hz
  tensionN: number; // 10 to 40 N
  harmonicNumber: number; // continuous harmonic mode
}

export interface DnaState {
  rotating: boolean;
  templateStrand: DnaBase[];
  pairedStrand: (DnaBase | null)[];
}

export interface TrigState {
  sweeping: boolean;
  angleDeg: number; // 0 to 360
}

export interface LabExperimentState {
  pendulum: PendulumState;
  optics: OpticsState;
  titration: TitrationState;
  circuit: CircuitState;
  electrolysis: ElectrolysisState;
  photosynthesis: PhotosynthesisState;
  microscope: MicroscopeState;
  projectile: ProjectileState;
  boyles: BoylesState;
  wave: WaveState;
  dna: DnaState;
  trig: TrigState;
}

export interface QuestDefinition {
  id: StationId;
  stationNumber: string;
  discipline: "Physics" | "Chemistry" | "Biology" | "Mathematics";
  title: string;
  subject: string;
  objective: string;
  hint: string;
  xpReward: number;
  badgeTitle: string;
}

export interface GamificationProgress {
  xp: number;
  completedQuests: Record<StationId, boolean>;
  rankTitle: string;
}
