import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Compass,
  Dna,
  Droplets,
  FlaskConical,
  Gauge,
  Maximize2,
  Microscope,
  Pause,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
  Sun,
  Target,
  Zap,
} from "lucide-react";
import { labAudio } from "../../lab/audio";
import {
  calculateBoylesPressure,
  calculateOpticsDeviation,
  calculatePhotosynthesisRate,
  calculateProjectileRange,
  calculateTitrationPh,
  calculateWaveHarmonic,
  DNA_TEMPLATE_STRAND,
  evaluateDnaMatches,
  getComplementaryBase,
  LAB_QUESTS,
} from "../../lab/quests";
import type {
  DnaBase,
  MicroscopeSpecimen,
  StationId,
} from "../../lab/types";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

export interface VirtualLaboratoryProps {
  completedQuests?: Record<StationId, boolean>;
  onQuestsChange?: (completed: Record<StationId, boolean>) => void;
  onLaunchImmersiveLab?: (initialStation: StationId) => void;
}

type StagePerspective = "isometric" | "front" | "overhead";

const EQUIPMENT_LIST: readonly {
  id: StationId;
  code: string;
  name: string;
  category: string;
  discipline: "Physics" | "Chemistry" | "Biology" | "Mathematics";
}[] = [
  { id: "pendulum", code: "EQ-01", name: "Brass Pendulum Rig", category: "Pendulum", discipline: "Physics" },
  { id: "optics", code: "EQ-02", name: "Optical Glass Prism", category: "Ray Optics", discipline: "Physics" },
  { id: "titration", code: "EQ-03", name: "Burette & Titration Flask", category: "Titration", discipline: "Chemistry" },
  { id: "circuit", code: "EQ-04", name: "Ohm's Law Circuit Deck", category: "Ohm's Law", discipline: "Physics" },
  { id: "electrolysis", code: "EQ-05", name: "Water Electrolysis Cell", category: "Electrolysis", discipline: "Chemistry" },
  { id: "photosynthesis", code: "EQ-06", name: "Aquatic Photosynthesis Rig", category: "Photosynthesis", discipline: "Biology" },
  { id: "microscope", code: "EQ-07", name: "Compound Optical Microscope", category: "Microscope", discipline: "Biology" },
  { id: "projectile", code: "EQ-08", name: "Parabolic Trajectory Launcher", category: "Projectile", discipline: "Mathematics" },
  { id: "boyles", code: "EQ-09", name: "Boyle's Law Gas Piston", category: "Gas Piston", discipline: "Chemistry" },
  { id: "wave", code: "EQ-10", name: "Standing Wave Oscillator", category: "Sound Wave", discipline: "Physics" },
  { id: "dna", code: "EQ-11", name: "DNA Double Helix Model", category: "DNA Helix", discipline: "Biology" },
  { id: "trig", code: "EQ-12", name: "Trigonometric Unit Circle", category: "Unit Circle", discipline: "Mathematics" },
];

const EMPTY_COMPLETED: Record<StationId, boolean> = {
  pendulum: false,
  optics: false,
  titration: false,
  circuit: false,
  electrolysis: false,
  photosynthesis: false,
  microscope: false,
  projectile: false,
  boyles: false,
  wave: false,
  dna: false,
  trig: false,
};

const PERSPECTIVE_TRANSFORMS: Record<StagePerspective, string> = {
  isometric: "rotateX(11deg) rotateY(-8deg)",
  front: "rotateX(0deg) rotateY(0deg)",
  overhead: "rotateX(22deg) rotateY(0deg)",
};

const DNA_COLORS: Record<DnaBase, string> = {
  A: "#6F4E37",
  T: "#6C4AB6",
  C: "#2D6A4F",
  G: "#E6A119",
};

function sampleCircuitLoop(progress01: number): { x: number; y: number } {
  const p = ((progress01 % 1) + 1) % 1;
  const w = 248;
  const h = 70;
  const perim = 2 * (w + h);
  let d = p * perim;

  if (d <= w) return { x: 116 + d, y: 118 };
  d -= w;
  if (d <= h) return { x: 364, y: 118 + d };
  d -= h;
  if (d <= w) return { x: 364 - d, y: 188 };
  d -= w;
  return { x: 116, y: 188 - d };
}

export function VirtualLaboratory({
  completedQuests: externalCompleted,
  onQuestsChange,
  onLaunchImmersiveLab,
}: VirtualLaboratoryProps) {
  const [selectedEquipment, setSelectedEquipment] =
    useState<StationId>("pendulum");
  const [perspective, setPerspective] =
    useState<StagePerspective>("isometric");

  // 01: Pendulum (initial 0.75 m so student actively calibrates to 1.00 m)
  const [pendulumRunning, setPendulumRunning] = useState(true);
  const [pendulumLength, setPendulumLength] = useState(0.75);
  const [pendulumAngleDeg, setPendulumAngleDeg] = useState(18);
  const [pendulumPhase, setPendulumPhase] = useState(0);
  const pendulumPhaseRadRef = useRef(0);

  // 02: Optics
  const [beamActive, setBeamActive] = useState(true);
  const [prismAngle, setPrismAngle] = useState(32);
  const [refractiveIndex, setRefractiveIndex] = useState(1.52);
  const [beamPulseOffset, setBeamPulseOffset] = useState(0);

  // 03: Titration
  const [baseAddedMl, setBaseAddedMl] = useState(12);
  const [stopcockOpen, setStopcockOpen] = useState(false);
  const [dropProgress, setDropProgress] = useState<number | null>(null);
  const [splashProgress, setSplashProgress] = useState<number | null>(null);
  const dropTimerRef = useRef<number | null>(null);

  // 04: Circuit
  const [switchClosed, setSwitchClosed] = useState(true);
  const [voltage, setVoltage] = useState(6.0);
  const [resistance, setResistance] = useState(6.0);
  const [electronPhase, setElectronPhase] = useState(0);

  // 05: Electrolysis
  const [electroPower, setElectroPower] = useState(true);
  const [electroVoltage, setElectroVoltage] = useState(8);
  const [h2Ml, setH2Ml] = useState(4.0);
  const [bubblePhase, setBubblePhase] = useState(0);

  // 06: Photosynthesis
  const [lampOn, setLampOn] = useState(true);
  const [lightPct, setLightPct] = useState(60);
  const [co2Gl, setCo2Gl] = useState(0.9);
  const [photoBubblePhase, setPhotoBubblePhase] = useState(0);

  // 07: Microscope
  const [stageLampOn, setStageLampOn] = useState(true);
  const [magnification, setMagnification] = useState<4 | 10 | 40>(10);
  const [focusValue, setFocusValue] = useState(28);
  const [specimen, setSpecimen] = useState<MicroscopeSpecimen>("onion");

  // 08: Projectile Motion
  const [projAngleDeg, setProjAngleDeg] = useState(35);
  const [projSpeedMs, setProjSpeedMs] = useState(3.8);
  const [projFlightFrac, setProjFlightFrac] = useState<number | null>(null);
  const [lastLandedRange, setLastLandedRange] = useState<number | null>(null);
  const projAnimRef = useRef<number | null>(null);

  // 09: Boyle's Law
  const [boylesVolumeMl, setBoylesVolumeMl] = useState(40);
  const [gasTime, setGasTime] = useState(0);

  // 10: Standing Wave
  const [waveRunning, setWaveRunning] = useState(true);
  const [waveFreqHz, setWaveFreqHz] = useState(32);
  const [waveTensionN, setWaveTensionN] = useState(25);
  const [wavePhase, setWavePhase] = useState(0);
  const wavePhaseRef = useRef(0);

  // 11: DNA Helix
  const [dnaPaired, setDnaPaired] = useState<(DnaBase | null)[]>([
    "T",
    "A",
    null,
    null,
    null,
    null,
  ]);
  const [dnaRotating, setDnaRotating] = useState(true);
  const [dnaSpinPhase, setDnaSpinPhase] = useState(0);

  // 12: Trig Unit Circle
  const [trigAngleDeg, setTrigAngleDeg] = useState(30);
  const [trigSweeping, setTrigSweeping] = useState(false);

  // Gamified Badges across all 12 STEM experiments
  const [localCalibrated, setLocalCalibrated] = useState<
    Record<StationId, boolean>
  >(() => externalCompleted ?? { ...EMPTY_COMPLETED });

  const calibratedSet = externalCompleted ?? localCalibrated;

  const currentPh = useMemo(
    () => calculateTitrationPh(baseAddedMl),
    [baseAddedMl],
  );
  const currentAmps = useMemo(
    () => (switchClosed ? voltage / resistance : 0),
    [switchClosed, voltage, resistance],
  );
  const circuitPowerWatts = useMemo(
    () => voltage * currentAmps,
    [voltage, currentAmps],
  );
  const pendulumPeriod = useMemo(
    () => 2 * Math.PI * Math.sqrt(pendulumLength / 9.81),
    [pendulumLength],
  );
  const opticsDeviation = useMemo(
    () => calculateOpticsDeviation(prismAngle, refractiveIndex),
    [prismAngle, refractiveIndex],
  );
  const o2Ml = useMemo(() => Number((h2Ml / 2).toFixed(1)), [h2Ml]);
  const photoBubblesPerMin = useMemo(
    () => calculatePhotosynthesisRate(lampOn, lightPct, co2Gl),
    [lampOn, lightPct, co2Gl],
  );
  const projRangeM = useMemo(
    () => calculateProjectileRange(projAngleDeg, projSpeedMs),
    [projAngleDeg, projSpeedMs],
  );
  const boylesPressureKpa = useMemo(
    () => calculateBoylesPressure(boylesVolumeMl),
    [boylesVolumeMl],
  );
  const waveHarmonic = useMemo(
    () => calculateWaveHarmonic(waveFreqHz, waveTensionN),
    [waveFreqHz, waveTensionN],
  );
  const dnaMatches = useMemo(
    () => evaluateDnaMatches(DNA_TEMPLATE_STRAND, dnaPaired),
    [dnaPaired],
  );

  // Unified real-time animation loop for active workbench equipment
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (selectedEquipment === "pendulum" && pendulumRunning) {
        const omega = Math.sqrt(9.81 / pendulumLength);
        pendulumPhaseRadRef.current += omega * dt;
        setPendulumPhase(
          Math.sin(pendulumPhaseRadRef.current) * pendulumAngleDeg,
        );
      }

      if (selectedEquipment === "optics" && beamActive) {
        setBeamPulseOffset((prev) => (prev - dt * 28) % 24);
      }

      if (selectedEquipment === "circuit" && switchClosed && currentAmps > 0) {
        const speed = 0.06 + (currentAmps / 6) * 0.34;
        setElectronPhase((prev) => (prev + dt * speed) % 1);
      }

      if (selectedEquipment === "electrolysis" && electroPower) {
        const rate = (electroVoltage / 12) * 1.9;
        setBubblePhase((prev) => (prev + dt * (0.45 + rate * 0.25)) % 1);
        setH2Ml((prev) =>
          prev < 30 ? Math.min(30, prev + rate * dt) : prev,
        );
      }

      if (
        selectedEquipment === "photosynthesis" &&
        lampOn &&
        photoBubblesPerMin > 0
      ) {
        const speed = 0.25 + (photoBubblesPerMin / 50) * 0.85;
        setPhotoBubblePhase((prev) => (prev + dt * speed) % 1);
      }

      if (selectedEquipment === "boyles") {
        const pFactor = 1 + (boylesPressureKpa - 80) / 140;
        setGasTime((prev) => prev + dt * pFactor);
      }

      if (selectedEquipment === "wave" && waveRunning) {
        wavePhaseRef.current += dt * (waveFreqHz / 8) * 2.4;
        setWavePhase(Math.cos(wavePhaseRef.current));
      }

      if (selectedEquipment === "dna" && dnaRotating) {
        setDnaSpinPhase((prev) => prev + dt * 1.4);
      }

      if (selectedEquipment === "trig" && trigSweeping) {
        setTrigAngleDeg((prev) => (prev + dt * 36) % 360);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [
    selectedEquipment,
    pendulumRunning,
    pendulumLength,
    pendulumAngleDeg,
    beamActive,
    switchClosed,
    currentAmps,
    electroPower,
    electroVoltage,
    lampOn,
    photoBubblesPerMin,
    boylesPressureKpa,
    waveRunning,
    waveFreqHz,
    dnaRotating,
    trigSweeping,
  ]);

  const triggerTitrationDrop = useCallback((amountMl: number) => {
    labAudio.playDrop();
    setBaseAddedMl((prev) => {
      const next = Math.min(50, Number((prev + amountMl).toFixed(1)));
      if (next >= 50) setStopcockOpen(false);
      return next;
    });

    if (dropTimerRef.current) cancelAnimationFrame(dropTimerRef.current);

    const animStart = performance.now();
    const runDrop = (now: number) => {
      const p = (now - animStart) / 260;
      if (p < 1) {
        setDropProgress(p);
        dropTimerRef.current = requestAnimationFrame(runDrop);
      } else {
        setDropProgress(null);
        setSplashProgress(0);
        const splashStart = performance.now();
        const runSplash = (sNow: number) => {
          const sp = (sNow - splashStart) / 300;
          if (sp < 1) {
            setSplashProgress(sp);
            dropTimerRef.current = requestAnimationFrame(runSplash);
          } else {
            setSplashProgress(null);
          }
        };
        dropTimerRef.current = requestAnimationFrame(runSplash);
      }
    };
    dropTimerRef.current = requestAnimationFrame(runDrop);
  }, []);

  useEffect(() => {
    if (!stopcockOpen) return;
    const interval = window.setInterval(() => {
      triggerTitrationDrop(0.5);
    }, 520);
    return () => window.clearInterval(interval);
  }, [stopcockOpen, triggerTitrationDrop]);

  const fireProjectile = useCallback(() => {
    labAudio.playClick(720);
    if (projAnimRef.current) cancelAnimationFrame(projAnimRef.current);

    const start = performance.now();
    const durationMs = 740;
    const step = (now: number) => {
      const p = (now - start) / durationMs;
      if (p < 1) {
        setProjFlightFrac(p);
        projAnimRef.current = requestAnimationFrame(step);
      } else {
        setProjFlightFrac(1);
        setLastLandedRange(calculateProjectileRange(projAngleDeg, projSpeedMs));
      }
    };
    projAnimRef.current = requestAnimationFrame(step);
  }, [projAngleDeg, projSpeedMs]);

  useEffect(() => {
    return () => {
      if (dropTimerRef.current) cancelAnimationFrame(dropTimerRef.current);
      if (projAnimRef.current) cancelAnimationFrame(projAnimRef.current);
    };
  }, []);

  const isCurrentCalibrated = useMemo(() => {
    switch (selectedEquipment) {
      case "pendulum":
        return (
          pendulumRunning &&
          pendulumLength >= 0.95 &&
          pendulumLength <= 1.05
        );
      case "optics":
        return beamActive && prismAngle >= 44 && prismAngle <= 52;
      case "titration":
        return currentPh >= 6.7 && currentPh <= 7.3;
      case "circuit":
        return switchClosed && Math.abs(currentAmps - 1.5) <= 0.08;
      case "electrolysis":
        return h2Ml >= 16;
      case "photosynthesis":
        return lampOn && photoBubblesPerMin >= 32;
      case "microscope":
        return (
          stageLampOn &&
          magnification === 40 &&
          focusValue >= 46 &&
          focusValue <= 54
        );
      case "projectile":
        return lastLandedRange !== null && Math.abs(lastLandedRange - 2.0) <= 0.15;
      case "boyles":
        return boylesVolumeMl <= 20 && boylesPressureKpa >= 200;
      case "wave":
        return waveRunning && Math.abs(waveHarmonic - 3.0) <= 0.12;
      case "dna":
        return dnaMatches === DNA_TEMPLATE_STRAND.length;
      case "trig":
        return Math.abs(trigAngleDeg - 60) <= 2;
    }
  }, [
    selectedEquipment,
    pendulumRunning,
    pendulumLength,
    beamActive,
    prismAngle,
    currentPh,
    switchClosed,
    currentAmps,
    h2Ml,
    lampOn,
    photoBubblesPerMin,
    stageLampOn,
    magnification,
    focusValue,
    lastLandedRange,
    boylesVolumeMl,
    boylesPressureKpa,
    waveRunning,
    waveHarmonic,
    dnaMatches,
    trigAngleDeg,
  ]);

  useEffect(() => {
    if (isCurrentCalibrated && !calibratedSet[selectedEquipment]) {
      labAudio.playQuestComplete();
      const updated = { ...calibratedSet, [selectedEquipment]: true };
      setLocalCalibrated(updated);
      onQuestsChange?.(updated);
    }
  }, [isCurrentCalibrated, selectedEquipment, calibratedSet, onQuestsChange]);

  const completedCount = useMemo(
    () => EQUIPMENT_LIST.filter((e) => calibratedSet[e.id]).length,
    [calibratedSet],
  );

  // Titration geometry
  const flaskLiquidColor = useMemo(() => {
    if (currentPh < 6.4) return "#D94F4F";
    if (currentPh <= 7.4) return "#E6E0F0";
    return "#6C4AB6";
  }, [currentPh]);
  const titrationFillFraction = Math.min(1, (25 + baseAddedMl) / 75);
  const liquidTopY = 196 - titrationFillFraction * 36;
  const liquidHalfWidth = 22 + (205 - liquidTopY) * 0.44;
  const buretteLiquidHeight = Math.max(4, (1 - baseAddedMl / 50) * 84);
  const buretteLiquidY = 24 + (84 - buretteLiquidHeight);

  // Optics geometry (actual rotated triangle face intersection)
  const prismRotRad = ((prismAngle - 48) * Math.PI) / 180;
  const entryX = 240 - Math.cos(prismRotRad) * 20;
  const entryY = 131;
  const exitX = 240 + Math.cos(prismRotRad) * 20;
  const exitY = 132 + Math.sin(prismRotRad) * 14;
  const screenBeamCenterY =
    132 + (prismAngle - 48) * 1.45 + (refractiveIndex - 1.52) * 85;
  const spread = 12 + (refractiveIndex - 1.4) * 48;
  const redEndY = Math.max(76, Math.min(196, screenBeamCenterY - spread));
  const goldEndY = Math.max(82, Math.min(202, screenBeamCenterY));
  const violetEndY = Math.max(88, Math.min(208, screenBeamCenterY + spread));

  // Circuit electrons
  const electronDots = useMemo(() => {
    if (!switchClosed || currentAmps <= 0) return [];
    const dots: { x: number; y: number }[] = [];
    for (let i = 0; i < 8; i++) {
      dots.push(sampleCircuitLoop(electronPhase + i / 8));
    }
    return dots;
  }, [switchClosed, currentAmps, electronPhase]);

  // Projectile parabola coordinates (origin x=96, y=194; 1.0 m = 115 px; target at 2.00m => x=326)
  const projRad = (projAngleDeg * Math.PI) / 180;
  const projVx = projSpeedMs * Math.cos(projRad);
  const projVy = projSpeedMs * Math.sin(projRad);
  const projTotalT = (2 * projVy) / 9.81;
  const projScalePx = 115;

  const projPathD = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 20; i++) {
      const t = (i / 20) * projTotalT;
      const px = 96 + projVx * t * projScalePx;
      const py = 194 - (projVy * t - 0.5 * 9.81 * t * t) * projScalePx;
      pts.push(`${i === 0 ? "M" : "L"} ${px.toFixed(1)} ${py.toFixed(1)}`);
    }
    return pts.join(" ");
  }, [projTotalT, projVx, projVy]);

  const currentBallPos = useMemo(() => {
    const f = projFlightFrac ?? 0;
    const t = f * projTotalT;
    return {
      x: 96 + projVx * t * projScalePx,
      y: 194 - (projVy * t - 0.5 * 9.81 * t * t) * projScalePx,
    };
  }, [projFlightFrac, projTotalT, projVx, projVy]);

  // Microscope blur & magnification
  const focusBlurPx = Math.abs(focusValue - 50) * 0.14;
  const cellZoom = magnification === 4 ? 0.65 : magnification === 10 ? 1.0 : 1.55;

  // Standing Wave SVG curve
  const wavePathD = useMemo(() => {
    const pts: string[] = [];
    const amp = waveRunning ? wavePhase * 34 : 0;
    for (let i = 0; i <= 48; i++) {
      const u = i / 48;
      const px = 112 + u * 276;
      const py = 128 - amp * Math.sin(waveHarmonic * Math.PI * u);
      pts.push(`${i === 0 ? "M" : "L"} ${px.toFixed(1)} ${py.toFixed(1)}`);
    }
    return pts.join(" ");
  }, [waveRunning, wavePhase, waveHarmonic]);

  // Boyle's Law piston Y
  const chamberHeightPx = (boylesVolumeMl / 50) * 124;
  const pistonY = 204 - chamberHeightPx;

  // Trig Unit Circle values
  const trigRad = (trigAngleDeg * Math.PI) / 180;
  const trigCos = Math.cos(trigRad);
  const trigSin = Math.sin(trigRad);
  const trigPtX = 240 + trigCos * 74;
  const trigPtY = 122 - trigSin * 74;

  const activeQuest = LAB_QUESTS[selectedEquipment];

  return (
    <section
      aria-label="Virtual Laboratory Interactive Bench"
      className="rounded-xl border border-[#E5E4E2] bg-white overflow-hidden"
    >
      {/* Top Bench Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-5 py-4 border-b border-[#E5E4E2] bg-[#FAF8F5]">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-x-2 text-xs text-[#786D65]">
            <span className="font-mono text-[#6F4E37] font-medium">
              Virtual Laboratory
            </span>
            <span aria-hidden="true">·</span>
            <span>12 STEM Benches (Physics, Chemistry, Biology, Mathematics)</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-[#42335C] font-medium">
              {completedCount}/{EQUIPMENT_LIST.length} Completed
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-[#231B16]">
            {EQUIPMENT_LIST.find((e) => e.id === selectedEquipment)?.name}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Container perspective angle"
            className="inline-flex items-center gap-1 rounded-lg border border-[#E5E4E2] bg-white p-1"
          >
            {(
              [
                { id: "isometric", label: "Isometric 3D" },
                { id: "front", label: "Front View" },
                { id: "overhead", label: "Bench Top" },
              ] as const
            ).map((view) => {
              const active = perspective === view.id;
              return (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => {
                    labAudio.playClick(500);
                    setPerspective(view.id);
                  }}
                  className={[
                    "px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap cursor-pointer transition-colors",
                    active
                      ? "bg-[#6F4E37] text-white"
                      : "text-[#5C5149] hover:text-[#231B16] hover:bg-[#F4F1EC]",
                  ].join(" ")}
                >
                  {view.label}
                </button>
              );
            })}
          </div>

          {onLaunchImmersiveLab ? (
            <Button
              variant="secondary"
              size="md"
              onClick={() => onLaunchImmersiveLab(selectedEquipment)}
            >
              <Maximize2
                className="h-3.5 w-3.5 inline mr-1.5"
                aria-hidden="true"
              />
              Enter 3D / AR / VR
            </Button>
          ) : null}
        </div>
      </div>

      {/* Two-Zone Sandbox Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left Zone: 3D-Inspired Spatial Stage */}
        <div className="lg:col-span-7 relative min-h-[450px] sm:min-h-[500px] bg-gradient-to-b from-[#FAF8F5] via-[#F4F1EC] to-[#EAE5DC] p-5 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#E5E4E2] overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[62%] opacity-60"
            style={{
              backgroundImage:
                "linear-gradient(to right, #E5E4E2 1px, transparent 1px), linear-gradient(to bottom, #E5E4E2 1px, transparent 1px)",
              backgroundSize: "36px 36px",
            }}
          />

          {/* 12-Experiment Selector Bar */}
          <div className="relative z-10 flex flex-wrap items-center gap-1.5">
            {EQUIPMENT_LIST.map((item) => {
              const active = item.id === selectedEquipment;
              const done = calibratedSet[item.id];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    labAudio.playClick(560);
                    setSelectedEquipment(item.id);
                  }}
                  className={[
                    "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium whitespace-nowrap cursor-pointer transition-colors",
                    active
                      ? "bg-[#6F4E37] text-white border-[#6F4E37]"
                      : "bg-white/95 text-[#231B16] border-[#E5E4E2] hover:bg-[#F3EFF9]",
                  ].join(" ")}
                >
                  <span className="font-mono tabular-nums">{item.code}</span>
                  <span>{item.category}</span>
                  {done ? (
                    <CheckCircle2
                      className={[
                        "h-3.5 w-3.5",
                        active ? "text-white" : "text-[#2D6A4F]",
                      ].join(" ")}
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* 3D Perspective Stage */}
          <div
            className="relative z-10 my-4 flex-1 flex items-center justify-center"
            style={{ perspective: "1100px" }}
          >
            <div
              className="relative w-full max-w-[540px] transition-transform duration-300 ease-out"
              style={{
                transformStyle: "preserve-3d",
                transform: PERSPECTIVE_TRANSFORMS[perspective],
              }}
            >
              <div className="relative rounded-xl border border-[#D7D4CE] bg-white/95 px-4 pt-6 pb-4 shadow-[0_18px_36px_-18px_rgba(35,27,22,0.22)]">
                <svg
                  viewBox="0 0 480 264"
                  className="w-full h-auto"
                  role="img"
                  aria-label={`Interactive apparatus view for ${activeQuest.title}`}
                >
                  {/* Platinum Bench Surface & Mocha Walnut Front Apron */}
                  <polygon
                    points="24,218 456,218 476,248 4,248"
                    fill="#E5E4E2"
                    stroke="#CFCBC4"
                    strokeWidth="1.2"
                  />
                  <rect
                    x="4"
                    y="248"
                    width="472"
                    height="12"
                    rx="2"
                    fill="#6F4E37"
                  />

                  {/* EQ-01: PENDULUM */}
                  {selectedEquipment === "pendulum" ? (
                    <g>
                      <rect x="140" y="206" width="120" height="16" rx="3" fill="#3B312B" />
                      <rect x="160" y="26" width="10" height="180" fill="#D4D2CE" stroke="#8A837C" strokeWidth="1" />
                      <rect x="156" y="26" width="116" height="10" rx="2" fill="#6F4E37" />
                      <rect x="244" y="196" width="44" height="16" rx="3" fill="#E6E0F0" stroke="#42335C" strokeWidth="1" />
                      <path d="M 192 184 A 110 110 0 0 0 340 184" fill="none" stroke="#CFCBC4" strokeWidth="1.2" strokeDasharray="4 4" />
                      <g
                        transform={`translate(266, 36) rotate(${pendulumPhase})`}
                        onClick={() => {
                          labAudio.playClick();
                          setPendulumRunning((r) => !r);
                        }}
                        className="cursor-pointer"
                      >
                        <line x1="0" y1="0" x2="0" y2={75 + pendulumLength * 58} stroke="#5C5149" strokeWidth="2" />
                        <circle cx="0" cy={75 + pendulumLength * 58} r="16" fill="#6F4E37" stroke="#FAF8F5" strokeWidth="2" />
                      </g>
                    </g>
                  ) : null}

                  {/* EQ-02: RAY OPTICS */}
                  {selectedEquipment === "optics" ? (
                    <g>
                      <rect x="40" y="206" width="400" height="14" rx="2" fill="#D4D2CE" stroke="#9B9690" strokeWidth="1" />
                      <g
                        className="cursor-pointer"
                        onClick={() => {
                          labAudio.playClick(600);
                          setBeamActive((b) => !b);
                        }}
                      >
                        <rect x="54" y="112" width="72" height="38" rx="5" fill="#6F4E37" />
                        <rect x="84" y="150" width="12" height="56" fill="#3B312B" />
                        <circle cx="126" cy="131" r="9" fill={beamActive ? "#FFE49E" : "#5C5149"} />
                      </g>
                      <rect x="402" y="64" width="16" height="142" rx="2" fill="#FAF8F5" stroke="#6F4E37" strokeWidth="1.5" />
                      {beamActive ? (
                        <g>
                          <rect x="398" y={redEndY - 5} width="6" height={Math.max(16, violetEndY - redEndY + 10)} rx="2" fill="#E6E0F0" />
                          <circle cx="401" cy={redEndY} r="3.5" fill="#D9483B" />
                          <circle cx="401" cy={goldEndY} r="3.5" fill="#E6A119" />
                          <circle cx="401" cy={violetEndY} r="3.5" fill="#6C4AB6" />
                        </g>
                      ) : null}
                      <rect x="206" y="194" width="68" height="12" rx="2" fill="#3B312B" />
                      <rect x="234" y="166" width="12" height="28" fill="#9B9690" />
                      <g
                        transform={`translate(240, 134) rotate(${prismAngle - 48})`}
                        onClick={() => {
                          labAudio.playClick(620);
                          setBeamActive(true);
                          setPrismAngle((a) => (a >= 70 ? 20 : a + 5));
                        }}
                        className="cursor-pointer"
                      >
                        <polygon points="0,-46 -42,32 42,32" fill="#E6E0F0" fillOpacity="0.72" stroke="#42335C" strokeWidth="2.2" />
                      </g>
                      {beamActive ? (
                        <g>
                          <line x1="130" y1="131" x2={entryX} y2={entryY} stroke="#F5B041" strokeWidth="3.5" strokeDasharray="10 6" strokeDashoffset={beamPulseOffset} />
                          <line x1={entryX} y1={entryY} x2={exitX} y2={exitY} stroke="#FFE49E" strokeWidth="2.5" />
                          <line x1={exitX} y1={exitY} x2="401" y2={redEndY} stroke="#D9483B" strokeWidth="2.6" strokeDasharray="8 5" strokeDashoffset={beamPulseOffset} />
                          <line x1={exitX} y1={exitY} x2="401" y2={goldEndY} stroke="#E6A119" strokeWidth="2.6" strokeDasharray="8 5" strokeDashoffset={beamPulseOffset} />
                          <line x1={exitX} y1={exitY} x2="401" y2={violetEndY} stroke="#6C4AB6" strokeWidth="2.6" strokeDasharray="8 5" strokeDashoffset={beamPulseOffset} />
                        </g>
                      ) : null}
                    </g>
                  ) : null}

                  {/* EQ-03: TITRATION */}
                  {selectedEquipment === "titration" ? (
                    <g>
                      <rect x="130" y="206" width="180" height="16" rx="3" fill="#D4D2CE" stroke="#9B9690" strokeWidth="1" />
                      <rect x="150" y="20" width="8" height="186" fill="#3B312B" />
                      <rect x="158" y="56" width="76" height="7" fill="#6F4E37" />
                      <rect x="230" y="20" width="16" height="92" rx="2" fill="#FAF8F5" stroke="#5C5149" strokeWidth="1.5" />
                      <rect x="232" y={buretteLiquidY} width="12" height={buretteLiquidHeight} fill="#D5C8EB" />
                      <g className="cursor-pointer" onClick={() => triggerTitrationDrop(1)}>
                        <rect x="221" y="112" width="34" height="9" rx="2" fill="#6F4E37" />
                        <polygon points="235,121 241,121 238,131" fill="#5C5149" />
                      </g>
                      {dropProgress !== null ? (
                        <circle cx="238" cy={132 + dropProgress * (liquidTopY - 132)} r="4.5" fill="#6C4AB6" />
                      ) : null}
                      <polygon
                        points={`${238 - liquidHalfWidth},${liquidTopY} ${238 + liquidHalfWidth},${liquidTopY} 274,204 202,204`}
                        fill={flaskLiquidColor}
                        fillOpacity="0.9"
                      />
                      {splashProgress !== null ? (
                        <ellipse
                          cx="238"
                          cy={liquidTopY}
                          rx={6 + splashProgress * 18}
                          ry={2 + splashProgress * 3}
                          fill="none"
                          stroke="#FFFFFF"
                          strokeOpacity={1 - splashProgress}
                          strokeWidth="1.5"
                        />
                      ) : null}
                      <polygon
                        points="226,146 250,146 276,205 200,205"
                        fill="none"
                        stroke="#5C5149"
                        strokeWidth="2"
                        className="cursor-pointer"
                        onClick={() => triggerTitrationDrop(1)}
                      />
                      <rect x="332" y="148" width="76" height="58" rx="5" fill="#3B312B" />
                      <rect x="340" y="156" width="60" height="26" rx="3" fill="#FAF8F5" />
                      <text x="370" y="174" textAnchor="middle" fill="#231B16" fontSize="13" fontWeight="600" fontFamily="IBM Plex Mono, monospace">
                        pH {currentPh.toFixed(1)}
                      </text>
                      <text x="370" y="196" textAnchor="middle" fill="#E6E0F0" fontSize="9" fontFamily="IBM Plex Mono, monospace">
                        {currentPh < 6.7 ? "ACIDIC" : currentPh <= 7.3 ? "NEUTRAL" : "BASIC"}
                      </text>
                    </g>
                  ) : null}

                  {/* EQ-04: CIRCUIT (0-6A scale) */}
                  {selectedEquipment === "circuit" ? (
                    <g>
                      <rect x="76" y="188" width="328" height="32" rx="4" fill="#6F4E37" />
                      <rect x="116" y="118" width="248" height="70" rx="12" fill="none" stroke="#B86B35" strokeWidth="5.5" />
                      {electronDots.map((dot, idx) => (
                        <circle key={idx} cx={dot.x} cy={dot.y} r="4.2" fill="#FFE08A" stroke="#6F4E37" strokeWidth="1" />
                      ))}
                      <g
                        className="cursor-pointer"
                        onClick={() => {
                          labAudio.playClick(540);
                          setVoltage((v) => (v >= 12 ? 2 : v + 2));
                        }}
                      >
                        <rect x="88" y="92" width="72" height="72" rx="5" fill="#3B312B" />
                        <circle cx="146" cy="106" r="4.5" fill={switchClosed ? "#FFB703" : "#786D65"} />
                        <text x="124" y="134" textAnchor="middle" fill="#FAF8F5" fontSize="14" fontWeight="600" fontFamily="IBM Plex Mono, monospace">
                          {voltage.toFixed(1)}V
                        </text>
                      </g>
                      <g
                        className="cursor-pointer"
                        onClick={() => {
                          labAudio.playClick(500);
                          setResistance((r) => (r >= 10 ? 2 : r + 2));
                        }}
                      >
                        <rect
                          x="200"
                          y="102"
                          width="80"
                          height="32"
                          rx="6"
                          fill={
                            switchClosed && currentAmps > 0
                              ? `rgba(217, 72, 59, ${Math.min(0.95, 0.35 + circuitPowerWatts / 36)})`
                              : "#786D65"
                          }
                          stroke="#231B16"
                          strokeWidth="1.5"
                        />
                        <text x="240" y="123" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="600" fontFamily="IBM Plex Mono, monospace">
                          {resistance.toFixed(1)} Ω
                        </text>
                      </g>
                      <rect x="322" y="94" width="72" height="68" rx="6" fill="#FAF8F5" stroke="#6F4E37" strokeWidth="2" />
                      <path d="M 336 134 A 22 22 0 0 1 380 134" fill="none" stroke="#C7C4BE" strokeWidth="2" />
                      <line
                        x1="358"
                        y1="138"
                        x2={358 + Math.sin((Math.min(currentAmps, 6) / 6 - 0.5) * 1.5) * 24}
                        y2={138 - Math.cos((Math.min(currentAmps, 6) / 6 - 0.5) * 1.5) * 24}
                        stroke="#6F4E37"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <text x="358" y="154" textAnchor="middle" fill="#231B16" fontSize="10" fontWeight="600" fontFamily="IBM Plex Mono, monospace">
                        {currentAmps.toFixed(2)} A
                      </text>
                      <g
                        className="cursor-pointer"
                        onClick={() => {
                          labAudio.playClick(680);
                          setSwitchClosed((s) => !s);
                        }}
                      >
                        <rect x="206" y="174" width="68" height="16" rx="3" fill="#E6E0F0" stroke="#42335C" strokeWidth="1" />
                        <line x1="218" y1="178" x2={switchClosed ? 262 : 250} y2={switchClosed ? 178 : 152} stroke="#6F4E37" strokeWidth="4.5" strokeLinecap="round" />
                      </g>
                    </g>
                  ) : null}

                  {/* EQ-05: ELECTROLYSIS OF WATER */}
                  {selectedEquipment === "electrolysis" ? (
                    <g>
                      <rect x="88" y="122" width="188" height="96" rx="6" fill="#E6EFF6" fillOpacity="0.82" stroke="#5C5149" strokeWidth="2" />
                      <rect x="92" y="146" width="180" height="70" fill="#CFE2F3" fillOpacity="0.7" />
                      <rect x="136" y="148" width="10" height="58" fill="#2E2621" />
                      <rect x="216" y="148" width="10" height="58" fill="#6F4E37" />
                      <rect x="122" y="42" width="38" height="122" rx="10" fill="#FAF8F5" fillOpacity="0.85" stroke="#5C5149" strokeWidth="1.6" />
                      <rect x="202" y="42" width="38" height="122" rx="10" fill="#FAF8F5" fillOpacity="0.85" stroke="#5C5149" strokeWidth="1.6" />
                      <rect x="124" y="44" width="34" height={Math.max(6, (h2Ml / 30) * 114)} rx="8" fill="#E6E0F0" />
                      <rect x="204" y="44" width="34" height={Math.max(3, (o2Ml / 30) * 114)} rx="8" fill="#FBEAEA" />
                      <text x="141" y="34" textAnchor="middle" fill="#42335C" fontSize="11" fontWeight="600" fontFamily="IBM Plex Mono, monospace">
                        H₂ {h2Ml.toFixed(1)}mL
                      </text>
                      <text x="221" y="34" textAnchor="middle" fill="#9E2A2B" fontSize="11" fontWeight="600" fontFamily="IBM Plex Mono, monospace">
                        O₂ {o2Ml.toFixed(1)}mL
                      </text>
                      {electroPower && h2Ml < 30 ? (
                        <g>
                          {[0, 0.33, 0.66].map((offset, idx) => {
                            const pH2 = (bubblePhase + offset) % 1;
                            const pO2 = (bubblePhase + offset * 0.7) % 1;
                            return (
                              <g key={idx}>
                                <circle cx={141 + (idx - 1) * 5} cy={180 - pH2 * 105} r="3.2" fill="#FFFFFF" stroke="#6C4AB6" strokeWidth="0.8" />
                                <circle cx={221 + (idx - 1) * 4} cy={180 - pO2 * 105} r="2.6" fill="#FFFFFF" stroke="#D9483B" strokeWidth="0.8" />
                              </g>
                            );
                          })}
                        </g>
                      ) : null}
                      <g
                        className="cursor-pointer"
                        onClick={() => {
                          labAudio.playClick(600);
                          setElectroPower((p) => !p);
                        }}
                      >
                        <rect x="314" y="138" width="94" height="78" rx="6" fill="#3B312B" />
                        <circle cx="390" cy="154" r="5" fill={electroPower ? "#FFB703" : "#786D65"} />
                        <text x="361" y="182" textAnchor="middle" fill="#FAF8F5" fontSize="14" fontWeight="600" fontFamily="IBM Plex Mono, monospace">
                          {electroVoltage}V DC
                        </text>
                        <text x="361" y="202" textAnchor="middle" fill="#E6E0F0" fontSize="9" fontFamily="IBM Plex Mono, monospace">
                          {electroPower ? "CELL ACTIVE" : "PAUSED"}
                        </text>
                      </g>
                    </g>
                  ) : null}

                  {/* EQ-06: PHOTOSYNTHESIS (with O2 Gas Pocket in Tube) */}
                  {selectedEquipment === "photosynthesis" ? (
                    <g>
                      <g
                        className="cursor-pointer"
                        onClick={() => {
                          labAudio.playClick(580);
                          setLampOn((l) => !l);
                        }}
                      >
                        <rect x="66" y="204" width="60" height="12" rx="2" fill="#3B312B" />
                        <rect x="92" y="64" width="8" height="140" fill="#5C5149" />
                        <polygon points="100,66 138,48 138,94" fill="#6F4E37" />
                        <circle cx="142" cy="71" r="10" fill={lampOn ? "#FFE08A" : "#786D65"} />
                        {lampOn ? (
                          <polygon
                            points="146,66 254,104 254,196 146,78"
                            fill="#FFE49E"
                            fillOpacity={0.12 + (lightPct / 100) * 0.28}
                          />
                        ) : null}
                      </g>
                      <rect x="234" y="88" width="128" height="130" rx="6" fill="#D4ECE4" fillOpacity="0.6" stroke="#5C5149" strokeWidth="2" />
                      <polygon points="262,188 334,188 308,136 288,136" fill="#FFFFFF" fillOpacity="0.55" stroke="#5C5149" strokeWidth="1.5" />
                      <rect x="288" y="48" width="20" height="88" rx="8" fill="#FFFFFF" fillOpacity="0.7" stroke="#5C5149" strokeWidth="1.5" />
                      <rect
                        x="290"
                        y="50"
                        width="16"
                        height={lampOn ? Math.max(8, (photoBubblesPerMin / 55) * 52) : 6}
                        rx="6"
                        fill="#EAF6F0"
                      />
                      <path d="M 298 206 Q 290 178 300 156" fill="none" stroke="#2D6A4F" strokeWidth="4" strokeLinecap="round" />
                      <ellipse cx="288" cy="176" rx="11" ry="4.5" transform="rotate(-25 288 176)" fill="#2D6A4F" />
                      <ellipse cx="309" cy="168" rx="11" ry="4.5" transform="rotate(20 309 168)" fill="#2D6A4F" />
                      <ellipse cx="290" cy="160" rx="10" ry="4" transform="rotate(-15 290 160)" fill="#40916C" />
                      {lampOn && photoBubblesPerMin > 0 ? (
                        <g>
                          {[0, 0.25, 0.5, 0.75].map((off, idx) => {
                            const p = (photoBubblePhase + off) % 1;
                            return (
                              <circle
                                key={idx}
                                cx={298 + Math.sin(p * 9 + idx) * 3}
                                cy={150 - p * 86}
                                r="3.4"
                                fill="#FFFFFF"
                                stroke="#2D6A4F"
                                strokeWidth="1"
                              />
                            );
                          })}
                        </g>
                      ) : null}
                      <rect x="380" y="148" width="76" height="62" rx="5" fill="#FAF8F5" stroke="#6F4E37" strokeWidth="1.6" />
                      <text x="418" y="176" textAnchor="middle" fill="#231B16" fontSize="14" fontWeight="600" fontFamily="IBM Plex Mono, monospace">
                        {photoBubblesPerMin}
                      </text>
                      <text x="418" y="194" textAnchor="middle" fill="#5C5149" fontSize="9" fontFamily="IBM Plex Mono, monospace">
                        O₂ / min
                      </text>
                    </g>
                  ) : null}

                  {/* EQ-07: OPTICAL MICROSCOPE + 3 BIOLOGICAL SPECIMENS */}
                  {selectedEquipment === "microscope" ? (
                    <g>
                      <rect x="64" y="204" width="136" height="16" rx="3" fill="#3B312B" />
                      <path d="M 96 204 L 96 106 Q 96 76 130 76 L 146 76" fill="none" stroke="#D4D2CE" strokeWidth="14" strokeLinecap="round" />
                      <rect x="108" y="148" width="84" height="10" rx="2" fill="#3B312B" />
                      <rect x="128" y="142" width="44" height="5" fill="#E6E0F0" stroke="#42335C" strokeWidth="1" />
                      <circle
                        cx="150"
                        cy="184"
                        r="12"
                        fill={stageLampOn ? "#FFE08A" : "#786D65"}
                        className="cursor-pointer"
                        onClick={() => {
                          labAudio.playClick(560);
                          setStageLampOn((s) => !s);
                        }}
                      />
                      <g
                        transform={`translate(0, ${((focusValue - 50) / 50) * 8})`}
                        className="cursor-pointer"
                        onClick={() => {
                          labAudio.playClick(540);
                          setMagnification((m) => (m === 4 ? 10 : m === 10 ? 40 : 4));
                        }}
                      >
                        <rect x="138" y="42" width="24" height="68" rx="3" fill="#6F4E37" />
                        <rect x="142" y="26" width="16" height="18" rx="2" fill="#3B312B" />
                        <rect x="132" y="110" width="36" height="10" rx="2" fill="#D4D2CE" />
                        <rect x="145" y="120" width="10" height={magnification === 40 ? 20 : magnification === 10 ? 15 : 10} fill="#6F4E37" />
                      </g>

                      <defs>
                        <clipPath id="eyepiece-clip">
                          <circle cx="342" cy="126" r="76" />
                        </clipPath>
                        <filter id="specimen-blur">
                          <feGaussianBlur stdDeviation={focusBlurPx} />
                        </filter>
                      </defs>
                      <circle cx="342" cy="126" r="82" fill="#3B312B" />
                      <circle cx="342" cy="126" r="76" fill={stageLampOn ? "#F8F5FC" : "#2E2621"} />
                      {stageLampOn ? (
                        <g clipPath="url(#eyepiece-clip)">
                          <g
                            transform={`translate(342, 126) scale(${cellZoom}) translate(-342, -126)`}
                            filter={focusBlurPx > 0.2 ? "url(#specimen-blur)" : undefined}
                          >
                            {specimen === "onion" ? (
                              <g>
                                <rect x="276" y="70" width="64" height="44" fill="#E6E0F0" stroke="#42335C" strokeWidth="2" />
                                <circle cx="308" cy="92" r="9" fill="#6C4AB6" />
                                <rect x="340" y="70" width="68" height="44" fill="#EFEAF7" stroke="#42335C" strokeWidth="2" />
                                <circle cx="372" cy="94" r="9" fill="#6C4AB6" />
                                <rect x="276" y="114" width="64" height="46" fill="#EFEAF7" stroke="#42335C" strokeWidth="2" />
                                <circle cx="312" cy="138" r="9" fill="#6C4AB6" />
                                <rect x="340" y="114" width="68" height="46" fill="#E6E0F0" stroke="#42335C" strokeWidth="2" />
                                <circle cx="368" cy="136" r="9" fill="#6C4AB6" />
                              </g>
                            ) : specimen === "stomata" ? (
                              <g>
                                <ellipse cx="342" cy="126" rx="58" ry="48" fill="#D4ECE4" stroke="#2D6A4F" strokeWidth="2" />
                                <path d="M 322 126 Q 342 96 362 126 Q 342 156 322 126 Z" fill="#40916C" stroke="#1B4332" strokeWidth="2" />
                                <ellipse cx="342" cy="126" rx="11" ry="4.5" fill="#FAF8F5" />
                                <circle cx="332" cy="115" r="3" fill="#1B4332" />
                                <circle cx="352" cy="137" r="3" fill="#1B4332" />
                              </g>
                            ) : (
                              <g>
                                <path d="M 294 102 Q 332 68 380 94 Q 402 132 364 166 Q 312 174 294 102 Z" fill="#F6E5EE" stroke="#9E2A5C" strokeWidth="2" />
                                <circle cx="342" cy="126" r="11" fill="#8C2754" />
                              </g>
                            )}
                          </g>
                        </g>
                      ) : null}
                      <text x="342" y="216" textAnchor="middle" fill="#231B16" fontSize="11" fontFamily="IBM Plex Mono, monospace">
                        Eyepiece · {magnification}x ({specimen})
                      </text>
                    </g>
                  ) : null}

                  {/* EQ-08: PROJECTILE MOTION PARABOLA */}
                  {selectedEquipment === "projectile" ? (
                    <g>
                      <rect x="66" y="200" width="368" height="16" rx="3" fill="#D4D2CE" stroke="#9B9690" strokeWidth="1" />
                      <ellipse cx="326" cy="204" rx="22" ry="6" fill="#ECF5F0" stroke="#2D6A4F" strokeWidth="2" />
                      <text x="326" y="232" textAnchor="middle" fill="#2D6A4F" fontSize="10" fontWeight="600" fontFamily="IBM Plex Mono, monospace">
                        Target 2.00 m
                      </text>
                      <path
                        d={projPathD}
                        fill="none"
                        stroke="#6C4AB6"
                        strokeWidth="2"
                        strokeDasharray="5 4"
                      />
                      <g
                        transform={`translate(96, 194) rotate(${-projAngleDeg})`}
                        onClick={fireProjectile}
                        className="cursor-pointer"
                      >
                        <rect x="-8" y="-10" width="44" height="20" rx="4" fill="#6F4E37" />
                        <circle cx="0" cy="0" r="8" fill="#3B312B" />
                      </g>
                      <circle
                        cx={currentBallPos.x}
                        cy={Math.min(198, currentBallPos.y)}
                        r="7.5"
                        fill="#6F4E37"
                        stroke="#FAF8F5"
                        strokeWidth="1.5"
                      />
                    </g>
                  ) : null}

                  {/* EQ-09: BOYLE'S LAW GAS PISTON */}
                  {selectedEquipment === "boyles" ? (
                    <g>
                      <rect x="108" y="206" width="224" height="14" rx="3" fill="#3B312B" />
                      {/* Graduated Glass Cylinder */}
                      <rect x="138" y="72" width="96" height="134" rx="6" fill="#FAF8F5" fillOpacity="0.8" stroke="#5C5149" strokeWidth="2" />
                      {/* Compressed Gas Volume */}
                      <rect x="140" y={pistonY} width="92" height={204 - pistonY} fill="#E6E0F0" fillOpacity="0.78" />
                      {/* Bouncing Gas Molecules */}
                      {[0, 1, 2, 3, 4, 5].map((i) => {
                        const gx = 152 + ((Math.sin(gasTime * 2.1 + i * 1.4) + 1) * 0.5) * 68;
                        const gy =
                          pistonY +
                          10 +
                          ((Math.cos(gasTime * 2.5 + i * 1.9) + 1) * 0.5) *
                            Math.max(10, 190 - pistonY);
                        return <circle key={i} cx={gx} cy={gy} r="3.5" fill="#6C4AB6" />;
                      })}
                      {/* Clickable Piston Plunger */}
                      <g
                        className="cursor-pointer"
                        onClick={() => {
                          labAudio.playClick(580);
                          setBoylesVolumeMl((v) => (v <= 15 ? 45 : v - 5));
                        }}
                      >
                        <rect x="140" y={pistonY - 10} width="92" height="10" rx="2" fill="#6F4E37" />
                        <rect x="182" y={pistonY - 46} width="8" height="36" fill="#9B9690" />
                        <rect x="164" y={pistonY - 52} width="44" height="8" rx="3" fill="#3B312B" />
                      </g>
                      {/* Bourdon Pressure Gauge */}
                      <circle cx="316" cy="144" r="38" fill="#FAF8F5" stroke="#6F4E37" strokeWidth="3" />
                      <path d="M 290 154 A 28 28 0 0 1 342 154" fill="none" stroke="#C7C4BE" strokeWidth="2" />
                      <line
                        x1="316"
                        y1="148"
                        x2={316 + Math.sin(((Math.min(boylesPressureKpa, 400) - 80) / 320 - 0.5) * 1.6) * 26}
                        y2={148 - Math.cos(((Math.min(boylesPressureKpa, 400) - 80) / 320 - 0.5) * 1.6) * 26}
                        stroke="#42335C"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                      />
                      <text x="316" y="168" textAnchor="middle" fill="#231B16" fontSize="10" fontWeight="600" fontFamily="IBM Plex Mono, monospace">
                        {boylesPressureKpa.toFixed(0)} kPa
                      </text>
                    </g>
                  ) : null}

                  {/* EQ-10: STANDING WAVE OSCILLATOR */}
                  {selectedEquipment === "wave" ? (
                    <g>
                      <rect x="64" y="198" width="352" height="18" rx="3" fill="#D4D2CE" stroke="#9B9690" strokeWidth="1" />
                      {/* Frequency Driver */}
                      <g
                        className="cursor-pointer"
                        onClick={() => {
                          labAudio.playClick(610);
                          setWaveRunning((r) => !r);
                        }}
                      >
                        <rect x="52" y="114" width="60" height="84" rx="5" fill="#3B312B" />
                        <text x="82" y="152" textAnchor="middle" fill="#FAF8F5" fontSize="11" fontWeight="600" fontFamily="IBM Plex Mono, monospace">
                          {waveFreqHz}Hz
                        </text>
                        <circle cx="82" cy="176" r="5" fill={waveRunning ? "#FFB703" : "#786D65"} />
                      </g>
                      {/* Pulley & Tension Weight */}
                      <rect x="384" y="124" width="10" height="74" fill="#6F4E37" />
                      <circle cx="389" cy="128" r="10" fill="#E5E4E2" stroke="#5C5149" strokeWidth="2" />
                      <line x1="398" y1="128" x2="398" y2={160 + (waveTensionN - 10) * 0.6} stroke="#5C5149" strokeWidth="2" />
                      <rect x="386" y={160 + (waveTensionN - 10) * 0.6} width="24" height="22" rx="3" fill="#6F4E37" />
                      {/* Vibrating String Envelope */}
                      <line x1="112" y1="128" x2="388" y2="128" stroke="#CFCBC4" strokeDasharray="4 4" strokeWidth="1.2" />
                      <path d={wavePathD} fill="none" stroke="#6C4AB6" strokeWidth="3.2" strokeLinecap="round" />
                      <text x="250" y="70" textAnchor="middle" fill="#42335C" fontSize="12" fontWeight="600" fontFamily="IBM Plex Mono, monospace">
                        Harmonic Mode n = {waveHarmonic.toFixed(2)}
                      </text>
                    </g>
                  ) : null}

                  {/* EQ-11: DNA DOUBLE HELIX BASE PAIRING */}
                  {selectedEquipment === "dna" ? (
                    <g>
                      <rect x="148" y="204" width="184" height="14" rx="4" fill="#3B312B" />
                      <line x1="240" y1="24" x2="240" y2="204" stroke="#D4D2CE" strokeWidth="3" />
                      {DNA_TEMPLATE_STRAND.map((tmpl, idx) => {
                        const y = 46 + idx * 27;
                        const sway = Math.sin(dnaSpinPhase + idx * 0.75) * 32;
                        const xLeft = 240 - 44 + sway * 0.25;
                        const xRight = 240 + 44 - sway * 0.25;
                        const paired = dnaPaired[idx];
                        const isMatch = paired === getComplementaryBase(tmpl);
                        return (
                          <g key={idx}>
                            <line x1={xLeft} y1={y} x2={240} y2={y} stroke={DNA_COLORS[tmpl]} strokeWidth="6" strokeLinecap="round" />
                            <line
                              x1={240}
                              y1={y}
                              x2={xRight}
                              y2={y}
                              stroke={paired ? (isMatch ? DNA_COLORS[paired] : "#D9483B") : "#D4D2CE"}
                              strokeWidth="6"
                              strokeDasharray={paired ? undefined : "4 3"}
                              strokeLinecap="round"
                            />
                            <circle cx={xLeft} cy={y} r="9" fill={DNA_COLORS[tmpl]} />
                            <text x={xLeft} y={y + 3.5} textAnchor="middle" fill="#FFFFFF" fontSize="9.5" fontWeight="600" fontFamily="IBM Plex Mono, monospace">
                              {tmpl}
                            </text>
                            <circle
                              cx={xRight}
                              cy={y}
                              r="9"
                              fill={paired ? (isMatch ? DNA_COLORS[paired] : "#D9483B") : "#FAF8F5"}
                              stroke="#5C5149"
                              strokeWidth="1.2"
                            />
                            <text
                              x={xRight}
                              y={y + 3.5}
                              textAnchor="middle"
                              fill={paired ? "#FFFFFF" : "#5C5149"}
                              fontSize="9.5"
                              fontWeight="600"
                              fontFamily="IBM Plex Mono, monospace"
                            >
                              {paired ?? "?"}
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  ) : null}

                  {/* EQ-12: TRIGONOMETRIC UNIT CIRCLE & PHASOR */}
                  {selectedEquipment === "trig" ? (
                    <g>
                      <rect x="114" y="204" width="252" height="14" rx="3" fill="#3B312B" />
                      <circle cx="240" cy="122" r="74" fill="#FAF8F5" stroke="#6F4E37" strokeWidth="3" />
                      <line x1="154" y1="122" x2="326" y2="122" stroke="#C7C4BE" strokeWidth="1.4" />
                      <line x1="240" y1="36" x2="240" y2="202" stroke="#C7C4BE" strokeWidth="1.4" />
                      {/* cos θ horizontal leg */}
                      <line x1="240" y1="122" x2={trigPtX} y2="122" stroke="#6F4E37" strokeWidth="4" />
                      {/* sin θ vertical leg */}
                      <line x1={trigPtX} y1="122" x2={trigPtX} y2={trigPtY} stroke="#6C4AB6" strokeWidth="4" />
                      {/* Rotating Phasor Arm */}
                      <line x1="240" y1="122" x2={trigPtX} y2={trigPtY} stroke="#231B16" strokeWidth="2.8" />
                      <circle cx={trigPtX} cy={trigPtY} r="6.5" fill="#6C4AB6" stroke="#FFFFFF" strokeWidth="1.5" />
                      <text x="382" y="106" textAnchor="middle" fill="#6F4E37" fontSize="11" fontWeight="600" fontFamily="IBM Plex Mono, monospace">
                        cos {trigAngleDeg.toFixed(0)}°={trigCos.toFixed(2)}
                      </text>
                      <text x="382" y="128" textAnchor="middle" fill="#42335C" fontSize="11" fontWeight="600" fontFamily="IBM Plex Mono, monospace">
                        sin {trigAngleDeg.toFixed(0)}°={trigSin.toFixed(2)}
                      </text>
                    </g>
                  ) : null}
                </svg>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 text-xs text-[#5C5149]">
            <span>
              Click equipment directly on the bench or adjust parameters on the right.
            </span>
            <span className="font-mono tabular-nums text-[#6F4E37]">
              {perspective.toUpperCase()} VIEW
            </span>
          </div>
        </div>

        {/* Right Zone: Parameter & Quest Control Deck */}
        <div className="lg:col-span-5 p-5 sm:p-6 flex flex-col justify-between gap-6 bg-white">
          <div className="space-y-5">
            <Card
              tone={isCurrentCalibrated ? "lavender" : "muted"}
              padding="sm"
              className="space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#231B16]">
                  {isCurrentCalibrated ? (
                    <CheckCircle2
                      className="h-4 w-4 text-[#2D6A4F]"
                      aria-hidden="true"
                    />
                  ) : (
                    <Compass
                      className="h-4 w-4 text-[#6F4E37]"
                      aria-hidden="true"
                    />
                  )}
                  <span>
                    {isCurrentCalibrated
                      ? `Completed: ${activeQuest.badgeTitle}`
                      : activeQuest.title}
                  </span>
                </span>
                <span className="font-mono tabular-nums text-[#42335C] font-medium">
                  +{activeQuest.xpReward} XP
                </span>
              </div>
              <p className="text-xs text-[#5C5149] leading-relaxed">
                {activeQuest.objective}
              </p>
            </Card>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#6F4E37]">
                <Sliders className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Apparatus Controls</span>
              </div>

              {/* 01: Pendulum */}
              {selectedEquipment === "pendulum" ? (
                <div className="space-y-4">
                  <label className="block space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#231B16] font-medium">
                        String Length (L)
                      </span>
                      <span className="font-mono tabular-nums text-[#6F4E37]">
                        {pendulumLength.toFixed(2)} m
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.4}
                      max={1.6}
                      step={0.05}
                      value={pendulumLength}
                      onChange={(e) => setPendulumLength(Number(e.target.value))}
                      className="w-full accent-[#6F4E37]"
                    />
                  </label>
                  <label className="block space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#231B16] font-medium">
                        Release Angle (θ)
                      </span>
                      <span className="font-mono tabular-nums text-[#6F4E37]">
                        {pendulumAngleDeg}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min={6}
                      max={30}
                      step={1}
                      value={pendulumAngleDeg}
                      onChange={(e) =>
                        setPendulumAngleDeg(Number(e.target.value))
                      }
                      className="w-full accent-[#6F4E37]"
                    />
                  </label>
                  <div className="rounded-lg border border-[#E5E4E2] bg-[#FAF8F5] px-4 py-3 flex items-center justify-between text-sm">
                    <span className="text-[#5C5149]">Time Period (T)</span>
                    <span className="font-mono tabular-nums font-semibold text-[#231B16]">
                      {pendulumPeriod.toFixed(2)} s
                    </span>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      labAudio.playClick();
                      setPendulumRunning((r) => !r);
                    }}
                    className="w-full"
                  >
                    {pendulumRunning ? (
                      <>
                        <Pause className="h-4 w-4 inline mr-1.5" aria-hidden="true" />
                        Pause Oscillation
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 inline mr-1.5" aria-hidden="true" />
                        Start Oscillation
                      </>
                    )}
                  </Button>
                </div>
              ) : null}

              {/* 02: Optics */}
              {selectedEquipment === "optics" ? (
                <div className="space-y-4">
                  <label className="block space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#231B16] font-medium">
                        Prism Rotation Angle
                      </span>
                      <span className="font-mono tabular-nums text-[#6F4E37]">
                        {prismAngle}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min={15}
                      max={75}
                      step={1}
                      value={prismAngle}
                      onChange={(e) => setPrismAngle(Number(e.target.value))}
                      className="w-full accent-[#6F4E37]"
                    />
                  </label>
                  <label className="block space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#231B16] font-medium">
                        Glass Refractive Index (n)
                      </span>
                      <span className="font-mono tabular-nums text-[#6F4E37]">
                        {refractiveIndex.toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1.45}
                      max={1.7}
                      step={0.01}
                      value={refractiveIndex}
                      onChange={(e) =>
                        setRefractiveIndex(Number(e.target.value))
                      }
                      className="w-full accent-[#6F4E37]"
                    />
                  </label>
                  <div className="rounded-lg border border-[#E5E4E2] bg-[#FAF8F5] px-4 py-3 flex items-center justify-between text-sm">
                    <span className="text-[#5C5149]">Deviation Angle (δ)</span>
                    <span className="font-mono tabular-nums font-semibold text-[#231B16]">
                      {opticsDeviation.toFixed(1)}°
                    </span>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      labAudio.playClick();
                      setBeamActive((b) => !b);
                    }}
                    className="w-full"
                  >
                    <Sun className="h-4 w-4 inline mr-1.5" aria-hidden="true" />
                    {beamActive ? "Turn Collimator Off" : "Turn Collimator On"}
                  </Button>
                </div>
              ) : null}

              {/* 03: Titration */}
              {selectedEquipment === "titration" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-[#E5E4E2] bg-[#FAF8F5] px-3.5 py-2.5">
                      <p className="text-xs text-[#786D65]">Base Dispensed</p>
                      <p className="font-mono text-base font-semibold tabular-nums text-[#231B16]">
                        {baseAddedMl.toFixed(1)} mL
                      </p>
                    </div>
                    <div className="rounded-lg border border-[#DCD3EB] bg-[#F3EFF9] px-3.5 py-2.5">
                      <p className="text-xs text-[#42335C]">Solution pH</p>
                      <p className="font-mono text-base font-semibold tabular-nums text-[#42335C]">
                        {currentPh.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="ghost"
                      size="md"
                      onClick={() => triggerTitrationDrop(0.2)}
                    >
                      +0.2 mL
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => triggerTitrationDrop(1)}
                    >
                      <FlaskConical className="h-3.5 w-3.5 inline mr-1" aria-hidden="true" />
                      +1 mL
                    </Button>
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => triggerTitrationDrop(5)}
                    >
                      +5 mL
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={stopcockOpen ? "primary" : "ghost"}
                      size="md"
                      onClick={() => {
                        labAudio.playClick(620);
                        setStopcockOpen((o) => !o);
                      }}
                      className="flex-1"
                    >
                      <Droplets className="h-4 w-4 inline mr-1.5" aria-hidden="true" />
                      {stopcockOpen ? "Close Stopcock" : "Auto-Drip Stopcock"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="md"
                      onClick={() => {
                        labAudio.playClick(440);
                        setStopcockOpen(false);
                        setBaseAddedMl(0);
                      }}
                      aria-label="Reset titration flask"
                    >
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              ) : null}

              {/* 04: Circuit */}
              {selectedEquipment === "circuit" ? (
                <div className="space-y-4">
                  <label className="block space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#231B16] font-medium">Voltage (V)</span>
                      <span className="font-mono tabular-nums text-[#6F4E37]">
                        {voltage.toFixed(1)} V
                      </span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={12}
                      step={0.5}
                      value={voltage}
                      onChange={(e) => setVoltage(Number(e.target.value))}
                      className="w-full accent-[#6F4E37]"
                    />
                  </label>
                  <label className="block space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#231B16] font-medium">
                        Resistance (R)
                      </span>
                      <span className="font-mono tabular-nums text-[#6F4E37]">
                        {resistance.toFixed(1)} Ω
                      </span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={10}
                      step={0.5}
                      value={resistance}
                      onChange={(e) => setResistance(Number(e.target.value))}
                      className="w-full accent-[#6F4E37]"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-[#E5E4E2] bg-[#FAF8F5] px-3.5 py-2.5">
                      <p className="text-xs text-[#786D65]">Current (I)</p>
                      <p className="font-mono text-base font-semibold tabular-nums text-[#231B16]">
                        {currentAmps.toFixed(2)} A
                      </p>
                    </div>
                    <div className="rounded-lg border border-[#E5E4E2] bg-[#FAF8F5] px-3.5 py-2.5">
                      <p className="text-xs text-[#786D65]">Power (P)</p>
                      <p className="font-mono text-base font-semibold tabular-nums text-[#6F4E37]">
                        {circuitPowerWatts.toFixed(1)} W
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      labAudio.playClick(680);
                      setSwitchClosed((s) => !s);
                    }}
                    className="w-full"
                  >
                    <Zap className="h-4 w-4 inline mr-1.5" aria-hidden="true" />
                    {switchClosed ? "Open Knife Switch" : "Close Knife Switch"}
                  </Button>
                </div>
              ) : null}

              {/* 05: Electrolysis */}
              {selectedEquipment === "electrolysis" ? (
                <div className="space-y-4">
                  <label className="block space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#231B16] font-medium">
                        DC Cell Voltage
                      </span>
                      <span className="font-mono tabular-nums text-[#6F4E37]">
                        {electroVoltage.toFixed(1)} V
                      </span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={12}
                      step={1}
                      value={electroVoltage}
                      onChange={(e) => setElectroVoltage(Number(e.target.value))}
                      className="w-full accent-[#6F4E37]"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-[#DCD3EB] bg-[#F3EFF9] px-3.5 py-2.5">
                      <p className="text-xs text-[#42335C]">Hydrogen (H₂)</p>
                      <p className="font-mono text-base font-semibold tabular-nums text-[#42335C]">
                        {h2Ml.toFixed(1)} mL
                      </p>
                    </div>
                    <div className="rounded-lg border border-[#E5E4E2] bg-[#FAF8F5] px-3.5 py-2.5">
                      <p className="text-xs text-[#786D65]">Oxygen (O₂)</p>
                      <p className="font-mono text-base font-semibold tabular-nums text-[#231B16]">
                        {o2Ml.toFixed(1)} mL
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => {
                        labAudio.playClick(600);
                        setElectroPower((p) => !p);
                      }}
                      className="flex-1"
                    >
                      <Sparkles className="h-4 w-4 inline mr-1.5" aria-hidden="true" />
                      {electroPower ? "Pause Cell" : "Run Electrolysis"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="md"
                      onClick={() => {
                        labAudio.playClick(440);
                        setH2Ml(0);
                      }}
                      aria-label="Reset gas tubes"
                    >
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              ) : null}

              {/* 06: Photosynthesis */}
              {selectedEquipment === "photosynthesis" ? (
                <div className="space-y-4">
                  <label className="block space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#231B16] font-medium">
                        Light Intensity
                      </span>
                      <span className="font-mono tabular-nums text-[#6F4E37]">
                        {lightPct}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={5}
                      value={lightPct}
                      onChange={(e) => setLightPct(Number(e.target.value))}
                      className="w-full accent-[#6F4E37]"
                    />
                  </label>
                  <label className="block space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#231B16] font-medium">
                        Dissolved CO₂
                      </span>
                      <span className="font-mono tabular-nums text-[#6F4E37]">
                        {co2Gl.toFixed(1)} g/L
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.2}
                      max={2.0}
                      step={0.1}
                      value={co2Gl}
                      onChange={(e) => setCo2Gl(Number(e.target.value))}
                      className="w-full accent-[#6F4E37]"
                    />
                  </label>
                  <div className="rounded-lg border border-[#E5E4E2] bg-[#FAF8F5] px-4 py-3 flex items-center justify-between text-sm">
                    <span className="text-[#5C5149]">O₂ Bubble Rate</span>
                    <span className="font-mono tabular-nums font-semibold text-[#2D6A4F]">
                      {photoBubblesPerMin} bubbles/min
                    </span>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      labAudio.playClick(580);
                      setLampOn((l) => !l);
                    }}
                    className="w-full"
                  >
                    <Sun className="h-4 w-4 inline mr-1.5" aria-hidden="true" />
                    {lampOn ? "Turn Growth Lamp Off" : "Turn Growth Lamp On"}
                  </Button>
                </div>
              ) : null}

              {/* 07: Microscope */}
              {selectedEquipment === "microscope" ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <span className="text-sm font-medium text-[#231B16]">
                      Specimen Slide
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { id: "onion", label: "Onion Cell" },
                          { id: "stomata", label: "Stomata" },
                          { id: "cheek", label: "Cheek Cell" },
                        ] as const
                      ).map((spec) => {
                        const active = specimen === spec.id;
                        return (
                          <button
                            key={spec.id}
                            type="button"
                            onClick={() => {
                              labAudio.playClick(520);
                              setSpecimen(spec.id);
                            }}
                            className={[
                              "min-h-[36px] rounded-lg border text-xs font-medium cursor-pointer transition-colors",
                              active
                                ? "bg-[#E6E0F0] text-[#42335C] border-[#42335C]/30"
                                : "bg-[#FAF8F5] text-[#231B16] border-[#E5E4E2] hover:bg-[#F3EFF9]",
                            ].join(" ")}
                          >
                            {spec.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-sm font-medium text-[#231B16]">
                      Objective Turret
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {([4, 10, 40] as const).map((mag) => {
                        const active = magnification === mag;
                        return (
                          <button
                            key={mag}
                            type="button"
                            onClick={() => {
                              labAudio.playClick(540);
                              setMagnification(mag);
                            }}
                            className={[
                              "min-h-[38px] rounded-lg border text-xs font-mono font-medium cursor-pointer transition-colors",
                              active
                                ? "bg-[#6F4E37] text-white border-[#6F4E37]"
                                : "bg-[#FAF8F5] text-[#231B16] border-[#E5E4E2] hover:bg-[#F3EFF9]",
                            ].join(" ")}
                          >
                            {mag}x Lens
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <label className="block space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#231B16] font-medium">
                        Fine Focus Knob
                      </span>
                      <span className="font-mono tabular-nums text-[#6F4E37]">
                        {focusValue} / 100
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={focusValue}
                      onChange={(e) => setFocusValue(Number(e.target.value))}
                      className="w-full accent-[#6F4E37]"
                    />
                  </label>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      labAudio.playClick(560);
                      setStageLampOn((s) => !s);
                    }}
                    className="w-full"
                  >
                    <Microscope className="h-4 w-4 inline mr-1.5" aria-hidden="true" />
                    {stageLampOn
                      ? "Turn Stage Illuminator Off"
                      : "Turn Stage Illuminator On"}
                  </Button>
                </div>
              ) : null}

              {/* 08: Projectile */}
              {selectedEquipment === "projectile" ? (
                <div className="space-y-4">
                  <label className="block space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#231B16] font-medium">
                        Launch Angle (θ)
                      </span>
                      <span className="font-mono tabular-nums text-[#6F4E37]">
                        {projAngleDeg}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min={15}
                      max={75}
                      step={1}
                      value={projAngleDeg}
                      onChange={(e) => {
                        setProjAngleDeg(Number(e.target.value));
                        setProjFlightFrac(null);
                      }}
                      className="w-full accent-[#6F4E37]"
                    />
                  </label>
                  <label className="block space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#231B16] font-medium">
                        Launch Speed (v₀)
                      </span>
                      <span className="font-mono tabular-nums text-[#6F4E37]">
                        {projSpeedMs.toFixed(1)} m/s
                      </span>
                    </div>
                    <input
                      type="range"
                      min={2.0}
                      max={5.0}
                      step={0.1}
                      value={projSpeedMs}
                      onChange={(e) => {
                        setProjSpeedMs(Number(e.target.value));
                        setProjFlightFrac(null);
                      }}
                      className="w-full accent-[#6F4E37]"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-[#E5E4E2] bg-[#FAF8F5] px-3.5 py-2.5">
                      <p className="text-xs text-[#786D65]">Predicted Range</p>
                      <p className="font-mono text-base font-semibold tabular-nums text-[#231B16]">
                        {projRangeM.toFixed(2)} m
                      </p>
                    </div>
                    <div className="rounded-lg border border-[#DCD3EB] bg-[#F3EFF9] px-3.5 py-2.5">
                      <p className="text-xs text-[#42335C]">Last Shot</p>
                      <p className="font-mono text-base font-semibold tabular-nums text-[#42335C]">
                        {lastLandedRange !== null
                          ? `${lastLandedRange.toFixed(2)} m`
                          : "—"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={fireProjectile}
                    className="w-full"
                  >
                    <Target className="h-4 w-4 inline mr-1.5" aria-hidden="true" />
                    Fire Projectile
                  </Button>
                </div>
              ) : null}

              {/* 09: Boyle's Law */}
              {selectedEquipment === "boyles" ? (
                <div className="space-y-4">
                  <label className="block space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#231B16] font-medium">
                        Cylinder Volume (V)
                      </span>
                      <span className="font-mono tabular-nums text-[#6F4E37]">
                        {boylesVolumeMl.toFixed(1)} mL
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={50}
                      step={1}
                      value={boylesVolumeMl}
                      onChange={(e) =>
                        setBoylesVolumeMl(Number(e.target.value))
                      }
                      className="w-full accent-[#6F4E37]"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-[#DCD3EB] bg-[#F3EFF9] px-3.5 py-2.5">
                      <p className="text-xs text-[#42335C]">Pressure (P)</p>
                      <p className="font-mono text-base font-semibold tabular-nums text-[#42335C]">
                        {boylesPressureKpa.toFixed(1)} kPa
                      </p>
                    </div>
                    <div className="rounded-lg border border-[#E5E4E2] bg-[#FAF8F5] px-3.5 py-2.5">
                      <p className="text-xs text-[#786D65]">Constant (P × V)</p>
                      <p className="font-mono text-base font-semibold tabular-nums text-[#231B16]">
                        {Math.round(boylesPressureKpa * boylesVolumeMl)} kPa·mL
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      labAudio.playClick(460);
                      setBoylesVolumeMl(40);
                    }}
                    className="w-full"
                  >
                    <Gauge className="h-4 w-4 inline mr-1.5" aria-hidden="true" />
                    Reset Piston to 40 mL
                  </Button>
                </div>
              ) : null}

              {/* 10: Standing Wave */}
              {selectedEquipment === "wave" ? (
                <div className="space-y-4">
                  <label className="block space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#231B16] font-medium">
                        Oscillator Frequency (f)
                      </span>
                      <span className="font-mono tabular-nums text-[#6F4E37]">
                        {waveFreqHz} Hz
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={90}
                      step={2}
                      value={waveFreqHz}
                      onChange={(e) => setWaveFreqHz(Number(e.target.value))}
                      className="w-full accent-[#6F4E37]"
                    />
                  </label>
                  <label className="block space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#231B16] font-medium">
                        String Tension (T)
                      </span>
                      <span className="font-mono tabular-nums text-[#6F4E37]">
                        {waveTensionN} N
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={40}
                      step={1}
                      value={waveTensionN}
                      onChange={(e) => setWaveTensionN(Number(e.target.value))}
                      className="w-full accent-[#6F4E37]"
                    />
                  </label>
                  <div className="rounded-lg border border-[#E5E4E2] bg-[#FAF8F5] px-4 py-3 flex items-center justify-between text-sm">
                    <span className="text-[#5C5149]">Harmonic Mode (n)</span>
                    <span className="font-mono tabular-nums font-semibold text-[#42335C]">
                      n = {waveHarmonic.toFixed(2)}
                    </span>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      labAudio.playClick(610);
                      setWaveRunning((r) => !r);
                    }}
                    className="w-full"
                  >
                    <Activity className="h-4 w-4 inline mr-1.5" aria-hidden="true" />
                    {waveRunning ? "Stop Wave Oscillator" : "Start Wave Oscillator"}
                  </Button>
                </div>
              ) : null}

              {/* 11: DNA Helix */}
              {selectedEquipment === "dna" ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <span className="text-sm font-medium text-[#231B16]">
                      Pair Complementary Bases (Click to Cycle A / T / C / G)
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {DNA_TEMPLATE_STRAND.map((tmpl, idx) => {
                        const current = dnaPaired[idx];
                        const isMatch =
                          current === getComplementaryBase(tmpl);
                        const order: DnaBase[] = ["A", "T", "C", "G"];
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              labAudio.playClick(isMatch ? 700 : 540);
                              setDnaPaired((prev) => {
                                const cur = prev[idx];
                                const nextVal =
                                  cur === null
                                    ? "A"
                                    : order[
                                        (order.indexOf(cur) + 1) % order.length
                                      ];
                                const next = [...prev];
                                next[idx] = nextVal;
                                return next;
                              });
                            }}
                            className={[
                              "min-h-[38px] rounded-lg border text-xs font-mono font-medium cursor-pointer transition-colors",
                              isMatch
                                ? "bg-[#ECF5F0] text-[#2D6A4F] border-[#2D6A4F]/40"
                                : "bg-[#FAF8F5] text-[#231B16] border-[#E5E4E2] hover:bg-[#F3EFF9]",
                            ].join(" ")}
                          >
                            {tmpl} ↔ {current ?? "?"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="rounded-lg border border-[#E5E4E2] bg-[#FAF8F5] px-4 py-3 flex items-center justify-between text-sm">
                    <span className="text-[#5C5149]">Chargaff Pairs Validated</span>
                    <span className="font-mono tabular-nums font-semibold text-[#231B16]">
                      {dnaMatches} / 6
                    </span>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      labAudio.playClick(620);
                      setDnaRotating((r) => !r);
                    }}
                    className="w-full"
                  >
                    <Dna className="h-4 w-4 inline mr-1.5" aria-hidden="true" />
                    {dnaRotating ? "Pause Helix Rotation" : "Rotate DNA Helix"}
                  </Button>
                </div>
              ) : null}

              {/* 12: Trig Unit Circle */}
              {selectedEquipment === "trig" ? (
                <div className="space-y-4">
                  <label className="block space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#231B16] font-medium">
                        Phasor Angle (θ)
                      </span>
                      <span className="font-mono tabular-nums text-[#6F4E37]">
                        {Math.round(trigAngleDeg)}° ({(trigRad / Math.PI).toFixed(2)}π rad)
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={360}
                      step={1}
                      value={Math.round(trigAngleDeg)}
                      onChange={(e) => {
                        setTrigSweeping(false);
                        setTrigAngleDeg(Number(e.target.value));
                      }}
                      className="w-full accent-[#6F4E37]"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-[#E5E4E2] bg-[#FAF8F5] px-3.5 py-2.5">
                      <p className="text-xs text-[#786D65]">cos(θ) Horizontal</p>
                      <p className="font-mono text-base font-semibold tabular-nums text-[#6F4E37]">
                        {trigCos.toFixed(3)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-[#DCD3EB] bg-[#F3EFF9] px-3.5 py-2.5">
                      <p className="text-xs text-[#42335C]">sin(θ) Vertical</p>
                      <p className="font-mono text-base font-semibold tabular-nums text-[#42335C]">
                        {trigSin.toFixed(3)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      labAudio.playClick(600);
                      setTrigSweeping((s) => !s);
                    }}
                    className="w-full"
                  >
                    {trigSweeping ? (
                      <>
                        <Pause className="h-4 w-4 inline mr-1.5" aria-hidden="true" />
                        Stop Phasor Sweep
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 inline mr-1.5" aria-hidden="true" />
                        Auto-Sweep 0°–360°
                      </>
                    )}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>

          <p className="text-xs text-[#786D65] pt-4 border-t border-[#E5E4E2]">
            {activeQuest.hint}
          </p>
        </div>
      </div>
    </section>
  );
}
