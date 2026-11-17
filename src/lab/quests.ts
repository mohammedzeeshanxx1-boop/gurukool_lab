import type {
  DnaBase,
  GamificationProgress,
  LabExperimentState,
  QuestDefinition,
  StationId,
} from "./types";

export const LAB_QUESTS: Record<StationId, QuestDefinition> = {
  pendulum: {
    id: "pendulum",
    stationNumber: "01",
    discipline: "Physics",
    title: "Pendulum Timekeeper",
    subject: "Physics · Mechanics",
    objective:
      "Start the pendulum and calibrate string length near 1.00 m (0.95–1.05 m) for a 2.0 s period.",
    hint: "Use T = 2π√(L/g). At L = 1.00 m, one full swing takes ~2.01 s.",
    xpReward: 150,
    badgeTitle: "Oscillation Calibrator",
  },
  optics: {
    id: "optics",
    stationNumber: "02",
    discipline: "Physics",
    title: "Spectral Prism Alignment",
    subject: "Physics · Ray Optics",
    objective:
      "Activate the collimated beam and rotate the prism to 44°–52° near minimum deviation.",
    hint: "Turn on the beam and sweep the prism angle toward 48° to project a balanced spectrum.",
    xpReward: 150,
    badgeTitle: "Optics Navigator",
  },
  titration: {
    id: "titration",
    stationNumber: "03",
    discipline: "Chemistry",
    title: "Neutral Equivalence",
    subject: "Chemistry · Acids & Bases",
    objective:
      "Dispense base drops into the 25 mL acid flask to reach neutral pH 6.7–7.3.",
    hint: "Equivalence occurs at 25.0 mL of base added. Use +1 mL or +0.2 mL micro-drops near 24 mL.",
    xpReward: 200,
    badgeTitle: "Titration Precision",
  },
  circuit: {
    id: "circuit",
    stationNumber: "04",
    discipline: "Physics",
    title: "Ohm's Law Calibration",
    subject: "Physics · Electricity",
    objective:
      "Close the knife switch and tune Voltage & Resistance to achieve I = 1.50 A (±0.08 A).",
    hint: "Set V = 6 V and R = 4 Ω (or V = 9 V, R = 6 Ω) with the switch closed.",
    xpReward: 175,
    badgeTitle: "Circuit Engineer",
  },
  electrolysis: {
    id: "electrolysis",
    stationNumber: "05",
    discipline: "Chemistry",
    title: "Water Electrolysis 2:1 Ratio",
    subject: "Chemistry · Electrochemistry",
    objective:
      "Run the electrolytic cell until Hydrogen gas reaches at least 16.0 mL (maintaining 2:1 H₂:O₂).",
    hint: "Keep power ON and raise Voltage (8–12 V) to accelerate H₂ and O₂ bubble collection.",
    xpReward: 175,
    badgeTitle: "Electrochemist",
  },
  photosynthesis: {
    id: "photosynthesis",
    stationNumber: "06",
    discipline: "Biology",
    title: "Photosynthetic Oxygen Rate",
    subject: "Biology · Plant Physiology",
    objective:
      "Tune Light Intensity and CO₂ levels with the lamp ON to achieve ≥ 32 O₂ bubbles/min.",
    hint: "Raise Light Intensity to ≥ 80% and CO₂ concentration to ≥ 1.2 g/L.",
    xpReward: 200,
    badgeTitle: "Botanical Analyst",
  },
  microscope: {
    id: "microscope",
    stationNumber: "07",
    discipline: "Biology",
    title: "Cellular Nucleus Resolution",
    subject: "Biology · Cell Structure",
    objective:
      "Illuminate the slide, select the 40x objective lens, and dial Focus between 46 and 54.",
    hint: "Turn the stage illuminator ON, switch magnification to 40x, and center Focus at 50.",
    xpReward: 200,
    badgeTitle: "Microscopy Fellow",
  },
  projectile: {
    id: "projectile",
    stationNumber: "08",
    discipline: "Mathematics",
    title: "Parabolic Target Range",
    subject: "Mathematics · Quadratic Trajectories",
    objective:
      "Fire the projectile launcher so it lands inside the 2.00 m (±0.15 m) target ring.",
    hint: "With R = v₀² sin(2θ) / g, try θ = 45° and v₀ = 4.4 m/s (or 30° at 4.7 m/s).",
    xpReward: 200,
    badgeTitle: "Trajectory Tactician",
  },
  boyles: {
    id: "boyles",
    stationNumber: "09",
    discipline: "Chemistry",
    title: "Boyle's Law Compression",
    subject: "Chemistry · Gas Laws",
    objective:
      "Compress the gas piston from 40 mL down to ≤ 20.0 mL so pressure rises to ≥ 200 kPa.",
    hint: "Since P₁V₁ = P₂V₂ (4,000 kPa·mL), halving volume to 20 mL doubles pressure to 200 kPa.",
    xpReward: 175,
    badgeTitle: "Gas Law Experimentalist",
  },
  wave: {
    id: "wave",
    stationNumber: "10",
    discipline: "Physics",
    title: "3rd Harmonic Resonance",
    subject: "Physics · Waves & Sound",
    objective:
      "Tune oscillator frequency and string tension to excite the 3rd standing-wave harmonic (n = 3.0 ± 0.12).",
    hint: "Set Tension = 25 N and dial Frequency near 60 Hz (or Tension = 16 N at 48 Hz) while running.",
    xpReward: 175,
    badgeTitle: "Harmonic Resonator",
  },
  dna: {
    id: "dna",
    stationNumber: "11",
    discipline: "Biology",
    title: "DNA Complementary Pairing",
    subject: "Biology · Molecular Genetics",
    objective:
      "Pair all 6 complementary DNA bases (A↔T and G↔C) along the 5' → 3' template strand.",
    hint: "Follow Chargaff's base-pairing rule: Adenine (A) pairs with Thymine (T); Cytosine (C) pairs with Guanine (G).",
    xpReward: 200,
    badgeTitle: "Molecular Geneticist",
  },
  trig: {
    id: "trig",
    stationNumber: "12",
    discipline: "Mathematics",
    title: "Unit Circle Cosine 0.50",
    subject: "Mathematics · Trigonometry",
    objective:
      "Set the goniometer phasor arm to θ = 60° (±2°) to verify cos(60°) = 0.500 and sin²θ + cos²θ = 1.",
    hint: "Stop sweep if active and slide the phasor angle θ directly to 60°.",
    xpReward: 175,
    badgeTitle: "Trigonometry Navigator",
  },
};

export const DNA_TEMPLATE_STRAND: DnaBase[] = ["A", "T", "G", "C", "A", "G"];

export function getComplementaryBase(base: DnaBase): DnaBase {
  switch (base) {
    case "A":
      return "T";
    case "T":
      return "A";
    case "C":
      return "G";
    case "G":
      return "C";
  }
}

export function evaluateDnaMatches(
  template: DnaBase[],
  paired: (DnaBase | null)[],
): number {
  let matches = 0;
  for (let i = 0; i < template.length; i++) {
    if (paired[i] && paired[i] === getComplementaryBase(template[i])) {
      matches += 1;
    }
  }
  return matches;
}

export function calculateTitrationPh(baseMl: number): number {
  const diff = baseMl - 25;
  if (Math.abs(diff) < 0.05) return 7.0;
  if (diff < 0) {
    const acidRatio = -diff / 25;
    return Number(
      (1.2 + (1 - acidRatio) * 4.5 * Math.pow(1 - acidRatio, 2)).toFixed(2),
    );
  }
  const baseRatio = Math.min(diff / 25, 1);
  return Number(
    (12.8 - (1 - baseRatio) * 4.5 * Math.pow(1 - baseRatio, 2)).toFixed(2),
  );
}

export function calculateOpticsDeviation(
  prismAngleDeg: number,
  refractiveIndex: number,
): number {
  return Number(
    (
      (refractiveIndex - 1) * 68 +
      Math.abs(prismAngleDeg - 48) * 0.34
    ).toFixed(1),
  );
}

export function calculatePhotosynthesisRate(
  lampOn: boolean,
  lightPct: number,
  co2Gl: number,
): number {
  if (!lampOn) return 0;
  const lightFactor = lightPct / (lightPct + 35);
  const co2Factor = co2Gl / (co2Gl + 0.55);
  return Math.round(62 * lightFactor * co2Factor);
}

export function calculateProjectileRange(
  angleDeg: number,
  speedMs: number,
): number {
  const rad = (angleDeg * Math.PI) / 180;
  const range = (speedMs * speedMs * Math.sin(2 * rad)) / 9.81;
  return Number(range.toFixed(2));
}

export function calculateBoylesPressure(volumeMl: number): number {
  return Number((4000 / Math.max(8, volumeMl)).toFixed(1));
}

export function calculateWaveHarmonic(
  frequencyHz: number,
  tensionN: number,
): number {
  // Fundamental f1 = 4 * sqrt(T), so at T=25N, f1 = 20 Hz -> 3rd harmonic at 60 Hz
  const f1 = 4 * Math.sqrt(Math.max(4, tensionN));
  return Number((frequencyHz / f1).toFixed(2));
}

export const INITIAL_EXPERIMENT_STATE: LabExperimentState = {
  pendulum: {
    running: true,
    lengthM: 0.75,
    amplitudeDeg: 18,
    angleRad: 0.25,
    elapsedOscillations: 0,
    measuredPeriodS: 2 * Math.PI * Math.sqrt(0.75 / 9.81),
  },
  optics: {
    beamOn: true,
    prismAngleDeg: 28,
    refractiveIndex: 1.52,
    deviationDeg: calculateOpticsDeviation(28, 1.52),
  },
  titration: {
    acidVolumeMl: 25,
    baseAddedMl: 8,
    currentPh: calculateTitrationPh(8),
    dropPulse: 0,
  },
  circuit: {
    switchClosed: true,
    voltageV: 6,
    resistanceOhm: 6,
    currentA: 1.0,
  },
  electrolysis: {
    powerOn: true,
    voltageV: 6,
    h2VolumeMl: 2.0,
    o2VolumeMl: 1.0,
  },
  photosynthesis: {
    lampOn: true,
    lightIntensityPct: 55,
    co2LevelGl: 0.8,
    bubblesPerMin: calculatePhotosynthesisRate(true, 55, 0.8),
  },
  microscope: {
    illuminatorOn: true,
    magnification: 10,
    focusValue: 26,
    specimen: "onion",
  },
  projectile: {
    angleDeg: 35,
    speedMs: 3.6,
    rangeM: calculateProjectileRange(35, 3.6),
    launchPulse: 0,
    lastLandedRangeM: null,
  },
  boyles: {
    volumeMl: 40,
    pressureKpa: calculateBoylesPressure(40),
  },
  wave: {
    running: true,
    frequencyHz: 32,
    tensionN: 25,
    harmonicNumber: calculateWaveHarmonic(32, 25),
  },
  dna: {
    rotating: true,
    templateStrand: [...DNA_TEMPLATE_STRAND],
    pairedStrand: ["T", "A", null, null, null, null],
  },
  trig: {
    sweeping: false,
    angleDeg: 30,
  },
};

export function evaluateQuests(
  state: LabExperimentState,
  existing: Record<StationId, boolean>,
): {
  completed: Record<StationId, boolean>;
  newlyCompleted: StationId[];
} {
  const next: Record<StationId, boolean> = { ...existing };
  const newlyCompleted: StationId[] = [];

  if (
    !next.pendulum &&
    state.pendulum.running &&
    state.pendulum.lengthM >= 0.95 &&
    state.pendulum.lengthM <= 1.05 &&
    state.pendulum.elapsedOscillations >= 1
  ) {
    next.pendulum = true;
    newlyCompleted.push("pendulum");
  }

  if (
    !next.optics &&
    state.optics.beamOn &&
    state.optics.prismAngleDeg >= 44 &&
    state.optics.prismAngleDeg <= 52
  ) {
    next.optics = true;
    newlyCompleted.push("optics");
  }

  if (
    !next.titration &&
    state.titration.currentPh >= 6.7 &&
    state.titration.currentPh <= 7.3
  ) {
    next.titration = true;
    newlyCompleted.push("titration");
  }

  if (
    !next.circuit &&
    state.circuit.switchClosed &&
    Math.abs(state.circuit.currentA - 1.5) <= 0.08
  ) {
    next.circuit = true;
    newlyCompleted.push("circuit");
  }

  if (!next.electrolysis && state.electrolysis.h2VolumeMl >= 16) {
    next.electrolysis = true;
    newlyCompleted.push("electrolysis");
  }

  if (
    !next.photosynthesis &&
    state.photosynthesis.lampOn &&
    state.photosynthesis.bubblesPerMin >= 32
  ) {
    next.photosynthesis = true;
    newlyCompleted.push("photosynthesis");
  }

  if (
    !next.microscope &&
    state.microscope.illuminatorOn &&
    state.microscope.magnification === 40 &&
    state.microscope.focusValue >= 46 &&
    state.microscope.focusValue <= 54
  ) {
    next.microscope = true;
    newlyCompleted.push("microscope");
  }

  if (
    !next.projectile &&
    state.projectile.lastLandedRangeM !== null &&
    Math.abs(state.projectile.lastLandedRangeM - 2.0) <= 0.15
  ) {
    next.projectile = true;
    newlyCompleted.push("projectile");
  }

  if (
    !next.boyles &&
    state.boyles.volumeMl <= 20 &&
    state.boyles.pressureKpa >= 200
  ) {
    next.boyles = true;
    newlyCompleted.push("boyles");
  }

  if (
    !next.wave &&
    state.wave.running &&
    Math.abs(state.wave.harmonicNumber - 3.0) <= 0.12
  ) {
    next.wave = true;
    newlyCompleted.push("wave");
  }

  if (
    !next.dna &&
    evaluateDnaMatches(state.dna.templateStrand, state.dna.pairedStrand) ===
      state.dna.templateStrand.length
  ) {
    next.dna = true;
    newlyCompleted.push("dna");
  }

  if (!next.trig && Math.abs(state.trig.angleDeg - 60) <= 2) {
    next.trig = true;
    newlyCompleted.push("trig");
  }

  return { completed: next, newlyCompleted };
}

export function computeRankTitle(completedCount: number): string {
  if (completedCount >= 12) return "Grand STEM Laureate";
  if (completedCount >= 9) return "Master STEM Experimentalist";
  if (completedCount >= 6) return "Senior Lab Fellow";
  if (completedCount >= 4) return "Research Associate";
  if (completedCount >= 2) return "Junior Researcher";
  if (completedCount >= 1) return "Apprentice Investigator";
  return "Lab Explorer";
}

export function buildProgressSnapshot(
  completed: Record<StationId, boolean>,
): GamificationProgress {
  let xp = 0;
  let count = 0;
  (Object.keys(LAB_QUESTS) as StationId[]).forEach((id) => {
    if (completed[id]) {
      xp += LAB_QUESTS[id].xpReward;
      count += 1;
    }
  });
  return {
    xp,
    completedQuests: completed,
    rankTitle: computeRankTitle(count),
  };
}
