import * as THREE from "three";
import type { LabMaterialLibrary } from "./materials";
import { getComplementaryBase } from "./quests";
import { createScaleDialTexture } from "./textures";
import type { DnaBase, LabExperimentState, StationId } from "./types";

export interface StationsController {
  update: (
    state: LabExperimentState,
    delta: number,
    elapsed: number,
    activeStation: StationId,
  ) => {
    oscillationCompleted: boolean;
    electrolysisH2Delta: number;
    projectileLandedRange: number | null;
  };
  dispose: () => void;
}

const BENCH_SURFACE_Y = 0.86;

function createAmmeterDialTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#FAF8F5";
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = "#6F4E37";
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, 240, 240);

    ctx.beginPath();
    ctx.arc(128, 178, 92, Math.PI * 1.15, Math.PI * 1.85);
    ctx.strokeStyle = "#5C5149";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = "#231B16";
    ctx.font = "600 22px monospace";
    ctx.textAlign = "center";
    ctx.fillText("AMMETER (A)", 128, 52);
    ctx.font = "500 18px monospace";
    ctx.fillText("0    3    6", 128, 118);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createPressureDialTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#FAF8F5";
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = "#42335C";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(128, 128, 116, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(128, 148, 84, Math.PI * 1.15, Math.PI * 1.85);
    ctx.strokeStyle = "#6F4E37";
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.fillStyle = "#231B16";
    ctx.font = "600 20px monospace";
    ctx.textAlign = "center";
    ctx.fillText("kPa GAUGE", 128, 56);
    ctx.font = "500 16px monospace";
    ctx.fillText("50  200  400", 128, 108);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const DNA_BASE_COLORS: Record<DnaBase, number> = {
  A: 0x6f4e37, // Mocha
  T: 0x6c4ab6, // Lavender Ink
  C: 0x2d6a4f, // Emerald Green
  G: 0xe6a119, // Amber Gold
};

export function buildExperimentStations(
  benchGroups: Record<StationId, THREE.Group>,
  materials: LabMaterialLibrary,
): StationsController {
  const disposables: { dispose: () => void }[] = [];

  const vesselGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0xf4f0fb,
    roughness: 0.08,
    metalness: 0.0,
    transparent: true,
    opacity: 0.34,
    clearcoat: 1.0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  disposables.push(vesselGlassMat);

  // =========================================================================
  // STATION 01: SIMPLE PENDULUM & PHOTOGATE RIG
  // =========================================================================
  const pendulumRoot = new THREE.Group();
  pendulumRoot.position.set(0, BENCH_SURFACE_Y, 0);
  benchGroups.pendulum.add(pendulumRoot);

  const pBaseGeo = new THREE.BoxGeometry(0.56, 0.04, 0.36);
  const pPostGeo = new THREE.CylinderGeometry(0.018, 0.022, 0.92, 16);
  const pArmGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.34, 14);
  const pClampGeo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
  const pArcGeo = new THREE.TorusGeometry(0.16, 0.008, 10, 28, Math.PI);
  const pGateGeo = new THREE.BoxGeometry(0.18, 0.05, 0.08);
  const pStringGeo = new THREE.CylinderGeometry(0.004, 0.004, 1, 8);
  const pBobGeo = new THREE.SphereGeometry(0.055, 24, 24);
  disposables.push(
    pBaseGeo,
    pPostGeo,
    pArmGeo,
    pClampGeo,
    pArcGeo,
    pGateGeo,
    pStringGeo,
    pBobGeo,
  );

  const pBase = new THREE.Mesh(pBaseGeo, materials.darkIron);
  pBase.position.set(0, 0.02, -0.08);
  pBase.castShadow = true;
  pendulumRoot.add(pBase);

  const pPost = new THREE.Mesh(pPostGeo, materials.platinumMetal);
  pPost.position.set(-0.2, 0.48, -0.14);
  pPost.castShadow = true;
  pendulumRoot.add(pPost);

  const pArm = new THREE.Mesh(pArmGeo, materials.brassMetal);
  pArm.rotation.z = Math.PI / 2;
  pArm.position.set(-0.04, 0.92, -0.14);
  pArm.castShadow = true;
  pendulumRoot.add(pArm);

  const pClamp = new THREE.Mesh(pClampGeo, materials.darkIron);
  pClamp.position.set(-0.2, 0.92, -0.14);
  pendulumRoot.add(pClamp);

  const pPhotogate = new THREE.Mesh(pGateGeo, materials.lavenderAccent);
  pPhotogate.position.set(0.12, 0.065, -0.02);
  pendulumRoot.add(pPhotogate);

  const pendulumPivot = new THREE.Group();
  pendulumPivot.position.set(0.12, 0.91, -0.02);
  pendulumRoot.add(pendulumPivot);

  const pArc = new THREE.Mesh(pArcGeo, materials.brassMetal);
  pArc.rotation.z = Math.PI;
  pendulumPivot.add(pArc);

  const pString = new THREE.Mesh(pStringGeo, materials.platinumMetal);
  pendulumPivot.add(pString);

  const pBob = new THREE.Mesh(pBobGeo, materials.brassMetal);
  pBob.castShadow = true;
  pendulumPivot.add(pBob);

  // =========================================================================
  // STATION 02: RAY OPTICS & PRISM DISPERSION BENCH
  // =========================================================================
  const opticsRoot = new THREE.Group();
  opticsRoot.position.set(0, BENCH_SURFACE_Y, 0);
  benchGroups.optics.add(opticsRoot);

  const railGeo = new THREE.BoxGeometry(1.36, 0.04, 0.14);
  const emitterHousingGeo = new THREE.CylinderGeometry(0.055, 0.065, 0.24, 20);
  const emitterStandGeo = new THREE.CylinderGeometry(0.02, 0.025, 0.18, 12);
  const apertureMat = new THREE.MeshStandardMaterial({
    color: 0xfff2cc,
    emissive: 0xffd275,
    emissiveIntensity: 1.6,
  });
  const apertureGeo = new THREE.CircleGeometry(0.026, 16);
  const turntableGeo = new THREE.CylinderGeometry(0.14, 0.15, 0.04, 24);
  const prismGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.2, 3);
  const screenGeo = new THREE.BoxGeometry(0.03, 0.4, 0.74);
  const beamGeo = new THREE.CylinderGeometry(0.011, 0.011, 1, 8);
  const spectrumSpotGeo = new THREE.PlaneGeometry(0.08, 0.26);
  const incidentBeamMat = new THREE.MeshBasicMaterial({
    color: 0xffe9a3,
    transparent: true,
    opacity: 0.95,
  });
  const rayRedMat = new THREE.MeshBasicMaterial({
    color: 0xd9483b,
    transparent: true,
    opacity: 0.92,
  });
  const rayGoldMat = new THREE.MeshBasicMaterial({
    color: 0xe6a119,
    transparent: true,
    opacity: 0.92,
  });
  const rayVioletMat = new THREE.MeshBasicMaterial({
    color: 0x6c4ab6,
    transparent: true,
    opacity: 0.95,
  });
  const spectrumSpotMat = new THREE.MeshBasicMaterial({
    color: 0xe6a119,
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide,
  });
  disposables.push(
    railGeo,
    emitterHousingGeo,
    emitterStandGeo,
    apertureMat,
    apertureGeo,
    turntableGeo,
    prismGeo,
    screenGeo,
    beamGeo,
    spectrumSpotGeo,
    incidentBeamMat,
    rayRedMat,
    rayGoldMat,
    rayVioletMat,
    spectrumSpotMat,
  );

  const rail = new THREE.Mesh(railGeo, materials.platinumMetal);
  rail.position.set(0, 0.02, 0);
  rail.castShadow = true;
  opticsRoot.add(rail);

  const emitterStand = new THREE.Mesh(emitterStandGeo, materials.darkIron);
  emitterStand.position.set(-0.5, 0.13, 0);
  opticsRoot.add(emitterStand);

  const emitterHousing = new THREE.Mesh(emitterHousingGeo, materials.brassMetal);
  emitterHousing.rotation.z = Math.PI / 2;
  emitterHousing.position.set(-0.48, 0.23, 0);
  emitterHousing.castShadow = true;
  opticsRoot.add(emitterHousing);

  const emitterAperture = new THREE.Mesh(apertureGeo, apertureMat);
  emitterAperture.rotation.y = Math.PI / 2;
  emitterAperture.position.set(-0.358, 0.23, 0);
  opticsRoot.add(emitterAperture);

  const turntable = new THREE.Mesh(turntableGeo, materials.darkIron);
  turntable.position.set(0, 0.06, 0);
  opticsRoot.add(turntable);

  const prismMesh = new THREE.Mesh(prismGeo, materials.opticalGlass);
  prismMesh.position.set(0, 0.18, 0);
  prismMesh.castShadow = true;
  opticsRoot.add(prismMesh);

  const screenStand = new THREE.Mesh(screenGeo, materials.warmIvoryTrim);
  screenStand.position.set(0.56, 0.22, 0.14);
  screenStand.castShadow = true;
  opticsRoot.add(screenStand);

  const spectrumSpot = new THREE.Mesh(spectrumSpotGeo, spectrumSpotMat);
  spectrumSpot.rotation.y = -Math.PI / 2;
  spectrumSpot.position.set(0.542, 0.2, 0.14);
  opticsRoot.add(spectrumSpot);

  const incidentBeam = new THREE.Mesh(beamGeo, incidentBeamMat);
  incidentBeam.rotation.z = Math.PI / 2;
  incidentBeam.scale.set(1, 0.36, 1);
  incidentBeam.position.set(-0.18, 0.23, 0);
  opticsRoot.add(incidentBeam);

  const rayRed = new THREE.Mesh(beamGeo, rayRedMat);
  const rayGold = new THREE.Mesh(beamGeo, rayGoldMat);
  const rayViolet = new THREE.Mesh(beamGeo, rayVioletMat);
  opticsRoot.add(rayRed, rayGold, rayViolet);

  // =========================================================================
  // STATION 03: ACID-BASE TITRATION BENCH
  // =========================================================================
  const titrationRoot = new THREE.Group();
  titrationRoot.position.set(0, BENCH_SURFACE_Y, 0);
  benchGroups.titration.add(titrationRoot);

  const tStirPlateGeo = new THREE.BoxGeometry(0.44, 0.06, 0.38);
  const tRodGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.86, 12);
  const tClampArmGeo = new THREE.BoxGeometry(0.24, 0.03, 0.04);
  const tBuretteGeo = new THREE.CylinderGeometry(
    0.024,
    0.024,
    0.46,
    18,
    1,
    true,
  );
  const tBuretteLiquidGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.42, 14);
  const tBuretteLiquidMat = new THREE.MeshStandardMaterial({
    color: 0xd0c4e8,
    roughness: 0.2,
    transparent: true,
    opacity: 0.85,
  });
  const tStopcockGeo = new THREE.BoxGeometry(0.075, 0.024, 0.024);
  const tFlaskBodyGeo = new THREE.ConeGeometry(0.135, 0.22, 24, 1, true);
  const tFlaskNeckGeo = new THREE.CylinderGeometry(
    0.036,
    0.046,
    0.08,
    18,
    1,
    true,
  );
  const tLiquidGeo = new THREE.ConeGeometry(0.118, 0.14, 24);
  tLiquidGeo.translate(0, 0.07, 0);
  const tLiquidMat = new THREE.MeshPhysicalMaterial({
    color: 0xd94f4f,
    roughness: 0.18,
    metalness: 0.0,
    transparent: true,
    opacity: 0.9,
  });
  const tDropGeo = new THREE.SphereGeometry(0.018, 12, 12);
  const tDropMat = new THREE.MeshStandardMaterial({
    color: 0x6c4ab6,
    emissive: 0x6c4ab6,
    emissiveIntensity: 0.45,
  });
  const tReagentGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.16, 16);
  disposables.push(
    tStirPlateGeo,
    tRodGeo,
    tClampArmGeo,
    tBuretteGeo,
    tBuretteLiquidGeo,
    tBuretteLiquidMat,
    tStopcockGeo,
    tFlaskBodyGeo,
    tFlaskNeckGeo,
    tLiquidGeo,
    tLiquidMat,
    tDropGeo,
    tDropMat,
    tReagentGeo,
  );

  const tStirPlate = new THREE.Mesh(tStirPlateGeo, materials.platinumMetal);
  tStirPlate.position.set(0.04, 0.03, 0);
  tStirPlate.castShadow = true;
  titrationRoot.add(tStirPlate);

  const tRod = new THREE.Mesh(tRodGeo, materials.darkIron);
  tRod.position.set(-0.18, 0.45, -0.1);
  titrationRoot.add(tRod);

  const tClampArm = new THREE.Mesh(tClampArmGeo, materials.brassMetal);
  tClampArm.position.set(-0.07, 0.64, -0.05);
  titrationRoot.add(tClampArm);

  const tBuretteLiquid = new THREE.Mesh(tBuretteLiquidGeo, tBuretteLiquidMat);
  tBuretteLiquid.position.set(0.04, 0.64, 0);
  titrationRoot.add(tBuretteLiquid);

  const tBurette = new THREE.Mesh(tBuretteGeo, vesselGlassMat);
  tBurette.position.set(0.04, 0.64, 0);
  tBurette.renderOrder = 3;
  titrationRoot.add(tBurette);

  const tStopcock = new THREE.Mesh(tStopcockGeo, materials.brassMetal);
  tStopcock.position.set(0.04, 0.43, 0);
  titrationRoot.add(tStopcock);

  const tLiquid = new THREE.Mesh(tLiquidGeo, tLiquidMat);
  tLiquid.position.set(0.04, 0.062, 0);
  tLiquid.renderOrder = 1;
  titrationRoot.add(tLiquid);

  const tFlaskBody = new THREE.Mesh(tFlaskBodyGeo, vesselGlassMat);
  tFlaskBody.position.set(0.04, 0.17, 0);
  tFlaskBody.renderOrder = 3;
  titrationRoot.add(tFlaskBody);

  const tFlaskNeck = new THREE.Mesh(tFlaskNeckGeo, vesselGlassMat);
  tFlaskNeck.position.set(0.04, 0.3, 0);
  tFlaskNeck.renderOrder = 3;
  titrationRoot.add(tFlaskNeck);

  const tDrop = new THREE.Mesh(tDropGeo, tDropMat);
  tDrop.position.set(0.04, 0.4, 0);
  tDrop.visible = false;
  titrationRoot.add(tDrop);

  const tReagent = new THREE.Mesh(tReagentGeo, materials.lavenderAccent);
  tReagent.position.set(0.42, 0.08, -0.08);
  tReagent.castShadow = true;
  titrationRoot.add(tReagent);

  // =========================================================================
  // STATION 04: OHM'S LAW CIRCUIT WORKBENCH
  // =========================================================================
  const circuitRoot = new THREE.Group();
  circuitRoot.position.set(0, BENCH_SURFACE_Y, 0);
  benchGroups.circuit.add(circuitRoot);

  const cDeckGeo = new THREE.BoxGeometry(1.24, 0.04, 0.72);
  const cBatteryGeo = new THREE.BoxGeometry(0.24, 0.18, 0.22);
  const cBatteryFaceTex = createScaleDialTexture("DC SOURCE", "2 V – 12 V", 2);
  const cBatteryFaceMat = new THREE.MeshStandardMaterial({
    map: cBatteryFaceTex,
    roughness: 0.45,
  });
  const cBatteryFaceGeo = new THREE.PlaneGeometry(0.2, 0.14);
  const cMeterGeo = new THREE.BoxGeometry(0.24, 0.2, 0.14);
  const cMeterDialTex = createAmmeterDialTexture();
  const cMeterDialMat = new THREE.MeshStandardMaterial({
    map: cMeterDialTex,
    roughness: 0.4,
  });
  const cMeterDialGeo = new THREE.PlaneGeometry(0.21, 0.17);
  const cNeedleGeo = new THREE.BoxGeometry(0.01, 0.095, 0.01);
  const cResistorGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.26, 16);
  const cSwitchBaseGeo = new THREE.BoxGeometry(0.2, 0.03, 0.12);
  const cSwitchBladeGeo = new THREE.BoxGeometry(0.15, 0.018, 0.025);
  const cLampGeo = new THREE.SphereGeometry(0.026, 16, 16);
  const cLampMat = new THREE.MeshStandardMaterial({
    color: 0x5c5149,
    emissive: 0xffb703,
    emissiveIntensity: 0,
  });
  const cWireCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.38, 0.06, 0.14),
    new THREE.Vector3(-0.38, 0.06, -0.18),
    new THREE.Vector3(0.0, 0.06, -0.2),
    new THREE.Vector3(0.38, 0.06, -0.18),
    new THREE.Vector3(0.38, 0.06, 0.14),
    new THREE.Vector3(-0.38, 0.06, 0.14),
  ]);
  const cWireGeo = new THREE.TubeGeometry(cWireCurve, 48, 0.012, 8, false);
  const cElectronGeo = new THREE.SphereGeometry(0.022, 12, 12);
  const cElectronMat = new THREE.MeshStandardMaterial({
    color: 0xffe08a,
    emissive: 0xffb703,
    emissiveIntensity: 1.5,
  });
  const cResistorMat = new THREE.MeshStandardMaterial({
    color: 0x6f4e37,
    emissive: 0xd9483b,
    emissiveIntensity: 0,
    roughness: 0.4,
  });
  disposables.push(
    cDeckGeo,
    cBatteryGeo,
    cBatteryFaceTex,
    cBatteryFaceMat,
    cBatteryFaceGeo,
    cMeterGeo,
    cMeterDialTex,
    cMeterDialMat,
    cMeterDialGeo,
    cNeedleGeo,
    cResistorGeo,
    cSwitchBaseGeo,
    cSwitchBladeGeo,
    cLampGeo,
    cLampMat,
    cWireGeo,
    cElectronGeo,
    cElectronMat,
    cResistorMat,
  );

  const cDeck = new THREE.Mesh(cDeckGeo, materials.warmIvoryTrim);
  cDeck.position.set(0, 0.02, 0);
  cDeck.receiveShadow = true;
  circuitRoot.add(cDeck);

  const cPowerUnit = new THREE.Mesh(cBatteryGeo, materials.darkIron);
  cPowerUnit.position.set(-0.38, 0.13, 0.14);
  cPowerUnit.castShadow = true;
  circuitRoot.add(cPowerUnit);

  const cBatteryFace = new THREE.Mesh(cBatteryFaceGeo, cBatteryFaceMat);
  cBatteryFace.position.set(-0.38, 0.13, 0.252);
  circuitRoot.add(cBatteryFace);

  const cPowerLamp = new THREE.Mesh(cLampGeo, cLampMat);
  cPowerLamp.position.set(-0.38, 0.23, 0.14);
  circuitRoot.add(cPowerLamp);

  const cAmmeter = new THREE.Mesh(cMeterGeo, materials.platinumMetal);
  cAmmeter.position.set(0.38, 0.14, -0.16);
  cAmmeter.castShadow = true;
  circuitRoot.add(cAmmeter);

  const cMeterDial = new THREE.Mesh(cMeterDialGeo, cMeterDialMat);
  cMeterDial.position.set(0.38, 0.14, -0.088);
  circuitRoot.add(cMeterDial);

  const cNeedlePivot = new THREE.Group();
  cNeedlePivot.position.set(0.38, 0.11, -0.082);
  circuitRoot.add(cNeedlePivot);
  const cNeedle = new THREE.Mesh(cNeedleGeo, materials.darkIron);
  cNeedle.position.y = 0.042;
  cNeedlePivot.add(cNeedle);

  const cResistor = new THREE.Mesh(cResistorGeo, cResistorMat);
  cResistor.rotation.z = Math.PI / 2;
  cResistor.position.set(0, 0.08, -0.2);
  cResistor.castShadow = true;
  circuitRoot.add(cResistor);

  const cSwitchBase = new THREE.Mesh(cSwitchBaseGeo, materials.lavenderAccent);
  cSwitchBase.position.set(0.04, 0.055, 0.14);
  circuitRoot.add(cSwitchBase);

  const cSwitchPivot = new THREE.Group();
  cSwitchPivot.position.set(-0.03, 0.075, 0.14);
  circuitRoot.add(cSwitchPivot);
  const cSwitchBlade = new THREE.Mesh(cSwitchBladeGeo, materials.brassMetal);
  cSwitchBlade.position.x = 0.075;
  cSwitchPivot.add(cSwitchBlade);

  const cWire = new THREE.Mesh(cWireGeo, materials.copperWire);
  circuitRoot.add(cWire);

  const electrons: THREE.Mesh[] = [];
  for (let i = 0; i < 10; i++) {
    const bead = new THREE.Mesh(cElectronGeo, cElectronMat);
    circuitRoot.add(bead);
    electrons.push(bead);
  }

  // =========================================================================
  // STATION 05: ELECTROLYSIS OF WATER CELL (CHEMISTRY)
  // =========================================================================
  const electroRoot = new THREE.Group();
  electroRoot.position.set(0, BENCH_SURFACE_Y, 0);
  benchGroups.electrolysis.add(electroRoot);

  const eBaseGeo = new THREE.BoxGeometry(0.84, 0.05, 0.48);
  const eTankGeo = new THREE.BoxGeometry(0.46, 0.24, 0.28);
  const eWaterGeo = new THREE.BoxGeometry(0.43, 0.18, 0.25);
  const eWaterMat = new THREE.MeshPhysicalMaterial({
    color: 0xcfe2f3,
    roughness: 0.12,
    transparent: true,
    opacity: 0.65,
  });
  const eRodGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.22, 12);
  const eTubeGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.34, 18, 1, true);
  const eGasGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.3, 14);
  eGasGeo.translate(0, -0.15, 0);
  const eH2Mat = new THREE.MeshStandardMaterial({
    color: 0xe6e0f0,
    transparent: true,
    opacity: 0.82,
  });
  const eO2Mat = new THREE.MeshStandardMaterial({
    color: 0xfbeaea,
    transparent: true,
    opacity: 0.82,
  });
  const eBubbleGeo = new THREE.SphereGeometry(0.012, 8, 8);
  const eBubbleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  disposables.push(
    eBaseGeo,
    eTankGeo,
    eWaterGeo,
    eWaterMat,
    eRodGeo,
    eTubeGeo,
    eGasGeo,
    eH2Mat,
    eO2Mat,
    eBubbleGeo,
    eBubbleMat,
  );

  const eBase = new THREE.Mesh(eBaseGeo, materials.platinumMetal);
  eBase.position.set(0, 0.025, 0);
  electroRoot.add(eBase);

  const eWater = new THREE.Mesh(eWaterGeo, eWaterMat);
  eWater.position.set(-0.08, 0.14, 0);
  electroRoot.add(eWater);

  const eTank = new THREE.Mesh(eTankGeo, vesselGlassMat);
  eTank.position.set(-0.08, 0.17, 0);
  eTank.renderOrder = 3;
  electroRoot.add(eTank);

  const eCathode = new THREE.Mesh(eRodGeo, materials.darkIron);
  eCathode.position.set(-0.18, 0.18, 0);
  electroRoot.add(eCathode);

  const eAnode = new THREE.Mesh(eRodGeo, materials.brassMetal);
  eAnode.position.set(0.02, 0.18, 0);
  electroRoot.add(eAnode);

  const eTubeH2 = new THREE.Mesh(eTubeGeo, vesselGlassMat);
  eTubeH2.position.set(-0.18, 0.34, 0);
  eTubeH2.renderOrder = 3;
  electroRoot.add(eTubeH2);

  const eTubeO2 = new THREE.Mesh(eTubeGeo, vesselGlassMat);
  eTubeO2.position.set(0.02, 0.34, 0);
  eTubeO2.renderOrder = 3;
  electroRoot.add(eTubeO2);

  const eGasH2 = new THREE.Mesh(eGasGeo, eH2Mat);
  eGasH2.position.set(-0.18, 0.5, 0);
  electroRoot.add(eGasH2);

  const eGasO2 = new THREE.Mesh(eGasGeo, eO2Mat);
  eGasO2.position.set(0.02, 0.5, 0);
  electroRoot.add(eGasO2);

  const ePowerBox = new THREE.Mesh(cBatteryGeo, materials.darkIron);
  ePowerBox.position.set(0.28, 0.14, 0);
  electroRoot.add(ePowerBox);

  const ePowerLed = new THREE.Mesh(cLampGeo, cLampMat);
  ePowerLed.position.set(0.28, 0.24, 0);
  electroRoot.add(ePowerLed);

  const eBubblesH2: THREE.Mesh[] = [];
  const eBubblesO2: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i++) {
    const bh = new THREE.Mesh(eBubbleGeo, eBubbleMat);
    bh.position.set(-0.18, 0.12, 0);
    electroRoot.add(bh);
    eBubblesH2.push(bh);

    if (i < 3) {
      const bo = new THREE.Mesh(eBubbleGeo, eBubbleMat);
      bo.position.set(0.02, 0.12, 0);
      electroRoot.add(bo);
      eBubblesO2.push(bo);
    }
  }

  // =========================================================================
  // STATION 06: PHOTOSYNTHESIS LIGHT & O2 BUBBLES (BIOLOGY)
  // =========================================================================
  const photoRoot = new THREE.Group();
  photoRoot.position.set(0, BENCH_SURFACE_Y, 0);
  benchGroups.photosynthesis.add(photoRoot);

  const phBeakerGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.34, 24, 1, true);
  const phWaterGeo = new THREE.CylinderGeometry(0.145, 0.145, 0.28, 22);
  const phWaterMat = new THREE.MeshPhysicalMaterial({
    color: 0xd4ece4,
    roughness: 0.12,
    transparent: true,
    opacity: 0.55,
  });
  const phStemGeo = new THREE.CylinderGeometry(0.01, 0.014, 0.18, 8);
  const phLeafGeo = new THREE.SphereGeometry(0.025, 10, 8);
  const phLeafMat = new THREE.MeshStandardMaterial({
    color: 0x2d6a4f,
    roughness: 0.65,
  });
  const phFunnelGeo = new THREE.ConeGeometry(0.11, 0.14, 20, 1, true);
  const phTubeGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.24, 14, 1, true);
  const phO2Geo = new THREE.CylinderGeometry(0.02, 0.02, 0.14, 12);
  phO2Geo.translate(0, -0.07, 0);
  const phO2Mat = new THREE.MeshStandardMaterial({
    color: 0xeaf6f0,
    transparent: true,
    opacity: 0.85,
  });
  const phLampStandGeo = new THREE.CylinderGeometry(0.014, 0.018, 0.42, 12);
  const phLampHeadGeo = new THREE.ConeGeometry(0.075, 0.11, 18);
  const phBulbGeo = new THREE.SphereGeometry(0.036, 16, 16);
  const phBulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff2cc,
    emissive: 0xffd166,
    emissiveIntensity: 1.5,
  });
  const phLightConeGeo = new THREE.ConeGeometry(0.16, 0.36, 18, 1, true);
  const phLightConeMat = new THREE.MeshBasicMaterial({
    color: 0xffe49e,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  disposables.push(
    phBeakerGeo,
    phWaterGeo,
    phWaterMat,
    phStemGeo,
    phLeafGeo,
    phLeafMat,
    phFunnelGeo,
    phTubeGeo,
    phO2Geo,
    phO2Mat,
    phLampStandGeo,
    phLampHeadGeo,
    phBulbGeo,
    phBulbMat,
    phLightConeGeo,
    phLightConeMat,
  );

  const phWater = new THREE.Mesh(phWaterGeo, phWaterMat);
  phWater.position.set(0.12, 0.15, 0);
  photoRoot.add(phWater);

  const phBeaker = new THREE.Mesh(phBeakerGeo, vesselGlassMat);
  phBeaker.position.set(0.12, 0.17, 0);
  phBeaker.renderOrder = 3;
  photoRoot.add(phBeaker);

  const phPlantGroup = new THREE.Group();
  phPlantGroup.position.set(0.12, 0.04, 0);
  photoRoot.add(phPlantGroup);

  const phStem = new THREE.Mesh(phStemGeo, phLeafMat);
  phStem.position.y = 0.09;
  phPlantGroup.add(phStem);
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(phLeafGeo, phLeafMat);
    const angle = i * 1.1;
    leaf.scale.set(1.6, 0.45, 0.7);
    leaf.position.set(
      Math.cos(angle) * 0.032,
      0.04 + i * 0.022,
      Math.sin(angle) * 0.032,
    );
    leaf.rotation.y = angle;
    phPlantGroup.add(leaf);
  }

  const phFunnel = new THREE.Mesh(phFunnelGeo, vesselGlassMat);
  phFunnel.position.set(0.12, 0.17, 0);
  phFunnel.renderOrder = 3;
  photoRoot.add(phFunnel);

  const phTube = new THREE.Mesh(phTubeGeo, vesselGlassMat);
  phTube.position.set(0.12, 0.34, 0);
  phTube.renderOrder = 3;
  photoRoot.add(phTube);

  const phO2Pocket = new THREE.Mesh(phO2Geo, phO2Mat);
  phO2Pocket.position.set(0.12, 0.455, 0);
  photoRoot.add(phO2Pocket);

  const phLampStand = new THREE.Mesh(phLampStandGeo, materials.darkIron);
  phLampStand.position.set(-0.32, 0.21, 0);
  photoRoot.add(phLampStand);

  const phLampHead = new THREE.Mesh(phLampHeadGeo, materials.brassMetal);
  phLampHead.rotation.z = -Math.PI / 2.6;
  phLampHead.position.set(-0.24, 0.36, 0);
  photoRoot.add(phLampHead);

  const phBulb = new THREE.Mesh(phBulbGeo, phBulbMat);
  phBulb.position.set(-0.19, 0.33, 0);
  photoRoot.add(phBulb);

  const phLightCone = new THREE.Mesh(phLightConeGeo, phLightConeMat);
  phLightCone.rotation.z = Math.PI / 2.3;
  phLightCone.position.set(-0.04, 0.26, 0);
  photoRoot.add(phLightCone);

  const phBubbles: THREE.Mesh[] = [];
  for (let i = 0; i < 7; i++) {
    const b = new THREE.Mesh(eBubbleGeo, eBubbleMat);
    b.position.set(0.12, 0.2, 0);
    photoRoot.add(b);
    phBubbles.push(b);
  }

  // =========================================================================
  // STATION 07: OPTICAL COMPOUND MICROSCOPE (BIOLOGY)
  // =========================================================================
  const microRoot = new THREE.Group();
  microRoot.position.set(0, BENCH_SURFACE_Y, 0);
  benchGroups.microscope.add(microRoot);

  const mBaseGeo = new THREE.BoxGeometry(0.32, 0.04, 0.42);
  const mArmGeo = new THREE.BoxGeometry(0.06, 0.38, 0.08);
  const mStageGeo = new THREE.BoxGeometry(0.24, 0.025, 0.24);
  const mSlideGeo = new THREE.BoxGeometry(0.14, 0.008, 0.05);
  const mSpecimenGeo = new THREE.CircleGeometry(0.018, 16);
  const mSpecimenMat = new THREE.MeshStandardMaterial({
    color: 0x6c4ab6,
    emissive: 0xe6e0f0,
    emissiveIntensity: 0.4,
  });
  const mTubeGeo = new THREE.CylinderGeometry(0.032, 0.036, 0.24, 18);
  const mEyepieceGeo = new THREE.CylinderGeometry(0.026, 0.028, 0.08, 16);
  const mTurretGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.024, 20);
  const mLensGeo = new THREE.CylinderGeometry(0.012, 0.01, 0.06, 12);
  const mBandGeo = new THREE.CylinderGeometry(0.013, 0.013, 0.012, 12);
  const mLampGeo = new THREE.CylinderGeometry(0.045, 0.05, 0.03, 18);
  const mLampMat = new THREE.MeshStandardMaterial({
    color: 0xfff4d2,
    emissive: 0xffd166,
    emissiveIntensity: 1.4,
  });
  const mRedRingMat = new THREE.MeshStandardMaterial({ color: 0xd9483b });
  const mYellowRingMat = new THREE.MeshStandardMaterial({ color: 0xe6a119 });
  const mBlueRingMat = new THREE.MeshStandardMaterial({ color: 0x2563eb });
  disposables.push(
    mBaseGeo,
    mArmGeo,
    mStageGeo,
    mSlideGeo,
    mSpecimenGeo,
    mSpecimenMat,
    mTubeGeo,
    mEyepieceGeo,
    mTurretGeo,
    mLensGeo,
    mBandGeo,
    mLampGeo,
    mLampMat,
    mRedRingMat,
    mYellowRingMat,
    mBlueRingMat,
  );

  const mBase = new THREE.Mesh(mBaseGeo, materials.darkIron);
  mBase.position.set(0, 0.02, 0);
  mBase.castShadow = true;
  microRoot.add(mBase);

  const mLamp = new THREE.Mesh(mLampGeo, mLampMat);
  mLamp.position.set(0, 0.055, 0.06);
  microRoot.add(mLamp);

  const mArm = new THREE.Mesh(mArmGeo, materials.platinumMetal);
  mArm.position.set(0, 0.22, -0.14);
  mArm.castShadow = true;
  microRoot.add(mArm);

  const mStage = new THREE.Mesh(mStageGeo, materials.darkIron);
  mStage.position.set(0, 0.2, 0.02);
  microRoot.add(mStage);

  const mSlide = new THREE.Mesh(mSlideGeo, vesselGlassMat);
  mSlide.position.set(0, 0.218, 0.05);
  microRoot.add(mSlide);

  const mSpecimen = new THREE.Mesh(mSpecimenGeo, mSpecimenMat);
  mSpecimen.rotation.x = -Math.PI / 2;
  mSpecimen.position.set(0, 0.223, 0.05);
  microRoot.add(mSpecimen);

  const mHeadGroup = new THREE.Group();
  mHeadGroup.position.set(0, 0.36, 0.04);
  microRoot.add(mHeadGroup);

  const mTube = new THREE.Mesh(mTubeGeo, materials.brassMetal);
  mTube.position.set(0, 0.14, 0);
  mTube.rotation.x = 0.2;
  mHeadGroup.add(mTube);

  const mEyepiece = new THREE.Mesh(mEyepieceGeo, materials.darkIron);
  mEyepiece.position.set(0, 0.28, -0.028);
  mEyepiece.rotation.x = 0.2;
  mHeadGroup.add(mEyepiece);

  const mTurret = new THREE.Group();
  mTurret.position.set(0, 0.02, 0.01);
  mHeadGroup.add(mTurret);
  const turretDisk = new THREE.Mesh(mTurretGeo, materials.platinumMetal);
  mTurret.add(turretDisk);

  const lensRingMats = [mRedRingMat, mYellowRingMat, mBlueRingMat];
  [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].forEach((ang, idx) => {
    const lx = Math.sin(ang) * 0.032;
    const lz = Math.cos(ang) * 0.032;
    const lens = new THREE.Mesh(
      mLensGeo,
      idx === 2 ? materials.brassMetal : materials.platinumMetal,
    );
    lens.position.set(lx, -0.035, lz);
    mTurret.add(lens);

    const band = new THREE.Mesh(mBandGeo, lensRingMats[idx]);
    band.position.set(lx, -0.048, lz);
    mTurret.add(band);
  });

  // =========================================================================
  // STATION 08: PROJECTILE MOTION & PARABOLA LAUNCHER (MATHEMATICS)
  // =========================================================================
  const projRoot = new THREE.Group();
  projRoot.position.set(0, BENCH_SURFACE_Y, 0);
  benchGroups.projectile.add(projRoot);

  const prRailGeo = new THREE.BoxGeometry(1.42, 0.035, 0.36);
  const prMountGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
  const prBarrelGeo = new THREE.CylinderGeometry(0.032, 0.038, 0.28, 16);
  const prTargetGeo = new THREE.RingGeometry(0.06, 0.095, 28);
  const prTargetMat = new THREE.MeshStandardMaterial({
    color: 0x2d6a4f,
    emissive: 0x2d6a4f,
    emissiveIntensity: 0.25,
    side: THREE.DoubleSide,
  });
  const prBallGeo = new THREE.SphereGeometry(0.034, 18, 18);
  const prBallMat = new THREE.MeshStandardMaterial({
    color: 0x6f4e37,
    roughness: 0.25,
    metalness: 0.8,
  });
  const prDotGeo = new THREE.SphereGeometry(0.012, 8, 8);
  const prDotMat = new THREE.MeshBasicMaterial({ color: 0x42335c });
  disposables.push(
    prRailGeo,
    prMountGeo,
    prBarrelGeo,
    prTargetGeo,
    prTargetMat,
    prBallGeo,
    prBallMat,
    prDotGeo,
    prDotMat,
  );

  const prRail = new THREE.Mesh(prRailGeo, materials.platinumMetal);
  prRail.position.set(0, 0.018, 0);
  prRail.receiveShadow = true;
  projRoot.add(prRail);

  const prMount = new THREE.Mesh(prMountGeo, materials.darkIron);
  prMount.position.set(-0.56, 0.09, 0);
  projRoot.add(prMount);

  const prBarrelPivot = new THREE.Group();
  prBarrelPivot.position.set(-0.56, 0.14, 0);
  projRoot.add(prBarrelPivot);

  const prBarrel = new THREE.Mesh(prBarrelGeo, materials.brassMetal);
  prBarrel.rotation.z = -Math.PI / 2;
  prBarrel.position.x = 0.1;
  prBarrelPivot.add(prBarrel);

  // Target ring at x = 2.00m mapped onto bench (0.80m from -0.56)
  const prTarget = new THREE.Mesh(prTargetGeo, prTargetMat);
  prTarget.rotation.x = -Math.PI / 2;
  prTarget.position.set(0.24, 0.04, 0);
  projRoot.add(prTarget);

  const prBall = new THREE.Mesh(prBallGeo, prBallMat);
  prBall.position.set(-0.42, 0.16, 0);
  projRoot.add(prBall);

  const prArcDots: THREE.Mesh[] = [];
  for (let i = 0; i < 14; i++) {
    const dot = new THREE.Mesh(prDotGeo, prDotMat);
    projRoot.add(dot);
    prArcDots.push(dot);
  }

  // =========================================================================
  // STATION 09: BOYLE'S LAW GAS PISTON (CHEMISTRY)
  // =========================================================================
  const boylesRoot = new THREE.Group();
  boylesRoot.position.set(0, BENCH_SURFACE_Y, 0);
  benchGroups.boyles.add(boylesRoot);

  const bBaseGeo = new THREE.BoxGeometry(0.68, 0.05, 0.42);
  const bCylGeo = new THREE.CylinderGeometry(0.125, 0.125, 0.56, 24, 1, true);
  const bChamberGeo = new THREE.CylinderGeometry(0.115, 0.115, 0.54, 20);
  bChamberGeo.translate(0, 0.27, 0);
  const bChamberMat = new THREE.MeshStandardMaterial({
    color: 0xe6e0f0,
    transparent: true,
    opacity: 0.42,
  });
  const bPistonHeadGeo = new THREE.CylinderGeometry(0.118, 0.118, 0.036, 22);
  const bPistonRodGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.34, 12);
  const bHandleGeo = new THREE.BoxGeometry(0.18, 0.028, 0.05);
  const bGaugeBodyGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.04, 24);
  const bGaugeFaceGeo = new THREE.CircleGeometry(0.09, 24);
  const bGaugeTex = createPressureDialTexture();
  const bGaugeMat = new THREE.MeshStandardMaterial({
    map: bGaugeTex,
    roughness: 0.35,
  });
  const bGaugeNeedleGeo = new THREE.BoxGeometry(0.008, 0.068, 0.008);
  const bParticleGeo = new THREE.SphereGeometry(0.014, 10, 10);
  const bParticleMat = new THREE.MeshStandardMaterial({
    color: 0x6c4ab6,
    emissive: 0x42335c,
    emissiveIntensity: 0.4,
  });
  disposables.push(
    bBaseGeo,
    bCylGeo,
    bChamberGeo,
    bChamberMat,
    bPistonHeadGeo,
    bPistonRodGeo,
    bHandleGeo,
    bGaugeBodyGeo,
    bGaugeFaceGeo,
    bGaugeTex,
    bGaugeMat,
    bGaugeNeedleGeo,
    bParticleGeo,
    bParticleMat,
  );

  const bBase = new THREE.Mesh(bBaseGeo, materials.darkIron);
  bBase.position.set(0, 0.025, 0);
  bBase.castShadow = true;
  boylesRoot.add(bBase);

  const bChamber = new THREE.Mesh(bChamberGeo, bChamberMat);
  bChamber.position.set(-0.1, 0.05, 0);
  boylesRoot.add(bChamber);

  const bCyl = new THREE.Mesh(bCylGeo, vesselGlassMat);
  bCyl.position.set(-0.1, 0.33, 0);
  bCyl.renderOrder = 3;
  boylesRoot.add(bCyl);

  const bPistonGroup = new THREE.Group();
  bPistonGroup.position.set(-0.1, 0.45, 0);
  boylesRoot.add(bPistonGroup);

  const bPistonHead = new THREE.Mesh(bPistonHeadGeo, materials.brassMetal);
  bPistonGroup.add(bPistonHead);
  const bPistonRod = new THREE.Mesh(bPistonRodGeo, materials.platinumMetal);
  bPistonRod.position.y = 0.18;
  bPistonGroup.add(bPistonRod);
  const bHandle = new THREE.Mesh(bHandleGeo, materials.walnutBench);
  bHandle.position.y = 0.36;
  bPistonGroup.add(bHandle);

  const bGaugeBody = new THREE.Mesh(bGaugeBodyGeo, materials.platinumMetal);
  bGaugeBody.rotation.x = Math.PI / 2;
  bGaugeBody.position.set(0.18, 0.24, 0);
  boylesRoot.add(bGaugeBody);

  const bGaugeFace = new THREE.Mesh(bGaugeFaceGeo, bGaugeMat);
  bGaugeFace.position.set(0.18, 0.24, 0.022);
  boylesRoot.add(bGaugeFace);

  const bGaugePivot = new THREE.Group();
  bGaugePivot.position.set(0.18, 0.22, 0.026);
  boylesRoot.add(bGaugePivot);
  const bGaugeNeedle = new THREE.Mesh(bGaugeNeedleGeo, materials.darkIron);
  bGaugeNeedle.position.y = 0.032;
  bGaugePivot.add(bGaugeNeedle);

  const bParticles: THREE.Mesh[] = [];
  for (let i = 0; i < 8; i++) {
    const p = new THREE.Mesh(bParticleGeo, bParticleMat);
    boylesRoot.add(p);
    bParticles.push(p);
  }

  // =========================================================================
  // STATION 10: STANDING WAVE & RESONANCE BENCH (PHYSICS)
  // =========================================================================
  const waveRoot = new THREE.Group();
  waveRoot.position.set(0, BENCH_SURFACE_Y, 0);
  benchGroups.wave.add(waveRoot);

  const wBaseGeo = new THREE.BoxGeometry(1.32, 0.04, 0.36);
  const wGenGeo = new THREE.BoxGeometry(0.2, 0.24, 0.22);
  const wPostGeo = new THREE.CylinderGeometry(0.016, 0.02, 0.24, 12);
  const wPulleyGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 18);
  const wWeightGeo = new THREE.CylinderGeometry(0.045, 0.05, 0.09, 16);
  const wBeadGeo = new THREE.SphereGeometry(0.014, 10, 10);
  const wBeadMat = new THREE.MeshStandardMaterial({
    color: 0x6c4ab6,
    emissive: 0x42335c,
    emissiveIntensity: 0.45,
  });
  disposables.push(
    wBaseGeo,
    wGenGeo,
    wPostGeo,
    wPulleyGeo,
    wWeightGeo,
    wBeadGeo,
    wBeadMat,
  );

  const wBase = new THREE.Mesh(wBaseGeo, materials.platinumMetal);
  wBase.position.set(0, 0.02, 0);
  wBase.receiveShadow = true;
  waveRoot.add(wBase);

  const wGen = new THREE.Mesh(wGenGeo, materials.darkIron);
  wGen.position.set(-0.52, 0.14, 0);
  wGen.castShadow = true;
  waveRoot.add(wGen);

  const wPost = new THREE.Mesh(wPostGeo, materials.brassMetal);
  wPost.position.set(0.52, 0.14, 0);
  waveRoot.add(wPost);

  const wPulley = new THREE.Mesh(wPulleyGeo, materials.platinumMetal);
  wPulley.rotation.x = Math.PI / 2;
  wPulley.position.set(0.54, 0.24, 0);
  waveRoot.add(wPulley);

  const wWeight = new THREE.Mesh(wWeightGeo, materials.brassMetal);
  wWeight.position.set(0.58, 0.11, 0);
  waveRoot.add(wWeight);

  const wStringBeads: THREE.Mesh[] = [];
  for (let i = 0; i < 25; i++) {
    const bead = new THREE.Mesh(wBeadGeo, wBeadMat);
    waveRoot.add(bead);
    wStringBeads.push(bead);
  }

  // =========================================================================
  // STATION 11: DNA DOUBLE HELIX MODEL (BIOLOGY)
  // =========================================================================
  const dnaRoot = new THREE.Group();
  dnaRoot.position.set(0, BENCH_SURFACE_Y, 0);
  benchGroups.dna.add(dnaRoot);

  const dBaseGeo = new THREE.CylinderGeometry(0.24, 0.27, 0.045, 28);
  const dRodGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.72, 10);
  const dBackboneGeo = new THREE.SphereGeometry(0.022, 12, 12);
  const dHalfRungGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.13, 10);
  dHalfRungGeo.rotateZ(Math.PI / 2);

  const dBaseMats: Record<DnaBase, THREE.MeshStandardMaterial> = {
    A: new THREE.MeshStandardMaterial({ color: DNA_BASE_COLORS.A, roughness: 0.35 }),
    T: new THREE.MeshStandardMaterial({ color: DNA_BASE_COLORS.T, roughness: 0.35 }),
    C: new THREE.MeshStandardMaterial({ color: DNA_BASE_COLORS.C, roughness: 0.35 }),
    G: new THREE.MeshStandardMaterial({ color: DNA_BASE_COLORS.G, roughness: 0.35 }),
  };
  const dUnpairedMat = new THREE.MeshStandardMaterial({
    color: 0xcfcac4,
    transparent: true,
    opacity: 0.35,
  });
  disposables.push(
    dBaseGeo,
    dRodGeo,
    dBackboneGeo,
    dHalfRungGeo,
    dBaseMats.A,
    dBaseMats.T,
    dBaseMats.C,
    dBaseMats.G,
    dUnpairedMat,
  );

  const dBase = new THREE.Mesh(dBaseGeo, materials.darkIron);
  dBase.position.set(0, 0.022, 0);
  dnaRoot.add(dBase);

  const dHelixGroup = new THREE.Group();
  dHelixGroup.position.set(0, 0.05, 0);
  dnaRoot.add(dHelixGroup);

  const dSpine = new THREE.Mesh(dRodGeo, materials.platinumMetal);
  dSpine.position.y = 0.36;
  dHelixGroup.add(dSpine);

  const dnaPairMeshes: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i++) {
    const y = 0.1 + i * 0.1;
    const twist = i * 0.65;
    const r = 0.14;
    const cos = Math.cos(twist);
    const sin = Math.sin(twist);

    const b1 = new THREE.Mesh(dBackboneGeo, materials.brassMetal);
    b1.position.set(cos * r, y, sin * r);
    dHelixGroup.add(b1);

    const b2 = new THREE.Mesh(dBackboneGeo, materials.brassMetal);
    b2.position.set(-cos * r, y, -sin * r);
    dHelixGroup.add(b2);

    const rungGroup = new THREE.Group();
    rungGroup.position.set(0, y, 0);
    rungGroup.rotation.y = -twist;
    dHelixGroup.add(rungGroup);

    const leftHalf = new THREE.Mesh(dHalfRungGeo, dBaseMats.A);
    leftHalf.position.x = 0.068;
    rungGroup.add(leftHalf);

    const rightHalf = new THREE.Mesh(dHalfRungGeo, dUnpairedMat);
    rightHalf.position.x = -0.068;
    rungGroup.add(rightHalf);

    dnaPairMeshes.push(leftHalf, rightHalf);
  }

  // =========================================================================
  // STATION 12: TRIGONOMETRIC UNIT CIRCLE & PHASOR (MATHEMATICS)
  // =========================================================================
  const trigRoot = new THREE.Group();
  trigRoot.position.set(0, BENCH_SURFACE_Y, 0);
  benchGroups.trig.add(trigRoot);

  const trBaseGeo = new THREE.BoxGeometry(0.84, 0.04, 0.36);
  const trStandGeo = new THREE.CylinderGeometry(0.015, 0.018, 0.34, 12);
  const trRingGeo = new THREE.TorusGeometry(0.26, 0.012, 12, 48);
  const trAxisGeo = new THREE.BoxGeometry(0.56, 0.008, 0.008);
  const trArmGeo = new THREE.BoxGeometry(0.26, 0.016, 0.016);
  trArmGeo.translate(0.13, 0, 0);
  const trDotGeo = new THREE.SphereGeometry(0.024, 14, 14);
  const trProjGeo = new THREE.CylinderGeometry(0.008, 0.008, 1, 8);
  const trSinMat = new THREE.MeshStandardMaterial({
    color: 0x6c4ab6,
    emissive: 0x42335c,
    emissiveIntensity: 0.4,
  });
  const trCosMat = new THREE.MeshStandardMaterial({
    color: 0x6f4e37,
    emissive: 0x6f4e37,
    emissiveIntensity: 0.25,
  });
  disposables.push(
    trBaseGeo,
    trStandGeo,
    trRingGeo,
    trAxisGeo,
    trArmGeo,
    trDotGeo,
    trProjGeo,
    trSinMat,
    trCosMat,
  );

  const trBase = new THREE.Mesh(trBaseGeo, materials.darkIron);
  trBase.position.set(0, 0.02, 0);
  trigRoot.add(trBase);

  const trStand = new THREE.Mesh(trStandGeo, materials.platinumMetal);
  trStand.position.set(0, 0.19, -0.04);
  trigRoot.add(trStand);

  const trWheelCenter = new THREE.Group();
  trWheelCenter.position.set(0, 0.38, 0);
  trigRoot.add(trWheelCenter);

  const trRing = new THREE.Mesh(trRingGeo, materials.brassMetal);
  trWheelCenter.add(trRing);

  const trAxisX = new THREE.Mesh(trAxisGeo, materials.platinumMetal);
  trWheelCenter.add(trAxisX);
  const trAxisY = new THREE.Mesh(trAxisGeo, materials.platinumMetal);
  trAxisY.rotation.z = Math.PI / 2;
  trWheelCenter.add(trAxisY);

  const trArmPivot = new THREE.Group();
  trArmPivot.position.z = 0.018;
  trWheelCenter.add(trArmPivot);

  const trArm = new THREE.Mesh(trArmGeo, materials.walnutBench);
  trArmPivot.add(trArm);

  const trTipDot = new THREE.Mesh(trDotGeo, trSinMat);
  trTipDot.position.x = 0.26;
  trArmPivot.add(trTipDot);

  const trSinBar = new THREE.Mesh(trProjGeo, trSinMat);
  trSinBar.position.z = 0.015;
  trWheelCenter.add(trSinBar);

  const trCosBar = new THREE.Mesh(trProjGeo, trCosMat);
  trCosBar.rotation.z = Math.PI / 2;
  trCosBar.position.z = 0.015;
  trWheelCenter.add(trCosBar);

  // =========================================================================
  // RUNTIME STATE TRACKING (ZERO PER-FRAME ALLOCATIONS)
  // =========================================================================
  let pendulumPhaseRad = 0;
  let prevSign = 1;
  let electronProgress = 0;
  let dropAnim = 0;
  let lastDropPulse = 0;
  let lastLaunchPulse = 0;
  let lastProjAngle = -1;
  let lastProjSpeed = -1;
  let projFlightT = -1;
  let projFlightTotalT = 1;
  let wavePhaseRad = 0;
  const _tempPos = new THREE.Vector3();

  const acidColor = new THREE.Color(0xd94f4f);
  const neutralColor = new THREE.Color(0xe6e0f0);
  const basicColor = new THREE.Color(0x6c4ab6);
  const currentLiquidColor = new THREE.Color();

  const UP_AXIS = new THREE.Vector3(0, 1, 0);
  const _rayDir = new THREE.Vector3();

  function positionRaySegment(
    mesh: THREE.Mesh,
    start: THREE.Vector3,
    end: THREE.Vector3,
  ) {
    _rayDir.subVectors(end, start);
    const length = _rayDir.length();
    mesh.position.copy(start).addScaledVector(_rayDir, 0.5);
    mesh.scale.set(1, length, 1);
    mesh.quaternion.setFromUnitVectors(UP_AXIS, _rayDir.normalize());
  }

  const rayOrigin = new THREE.Vector3(0, 0.23, 0);
  const rayEndRed = new THREE.Vector3();
  const rayEndGold = new THREE.Vector3();
  const rayEndViolet = new THREE.Vector3();

  return {
    update: (
      state: LabExperimentState,
      delta: number,
      elapsed: number,
      activeStation: StationId,
    ) => {
      let oscillationCompleted = false;
      let electrolysisH2Delta = 0;
      let projectileLandedRange: number | null = null;

      // 1. Pendulum (continuous phase accumulation)
      const visualLen = THREE.MathUtils.mapLinear(
        state.pendulum.lengthM,
        0.4,
        1.6,
        0.42,
        0.78,
      );
      pString.scale.set(1, visualLen, 1);
      pString.position.set(0, -visualLen / 2, 0);
      pBob.position.set(0, -visualLen, 0);

      if (state.pendulum.running) {
        const omega = Math.sqrt(9.81 / state.pendulum.lengthM);
        pendulumPhaseRad += omega * delta;
        const ampRad = THREE.MathUtils.degToRad(state.pendulum.amplitudeDeg);
        const angle = ampRad * Math.cos(pendulumPhaseRad);
        pendulumPivot.rotation.z = angle;

        const sign = angle >= 0 ? 1 : -1;
        if (prevSign < 0 && sign > 0) {
          oscillationCompleted = true;
        }
        prevSign = sign;
      }

      // 2. Optics (clamped onto screen + refractive index dispersion)
      prismMesh.rotation.y = THREE.MathUtils.degToRad(
        state.optics.prismAngleDeg,
      );
      const beamVisible = state.optics.beamOn;
      incidentBeam.visible = beamVisible;
      rayRed.visible = beamVisible;
      rayGold.visible = beamVisible;
      rayViolet.visible = beamVisible;
      spectrumSpot.visible = beamVisible;
      apertureMat.emissiveIntensity = beamVisible ? 1.8 : 0.08;

      if (beamVisible) {
        const angleOffset = (state.optics.prismAngleDeg - 48) * 0.008;
        const zCenter = THREE.MathUtils.clamp(0.14 + angleOffset * 0.9, -0.14, 0.42);
        const spread = 0.05 + (state.optics.refractiveIndex - 1.45) * 0.28;
        rayEndRed.set(0.54, 0.25 - angleOffset * 0.25, zCenter - spread);
        rayEndGold.set(0.54, 0.2 - angleOffset * 0.25, zCenter);
        rayEndViolet.set(0.54, 0.15 - angleOffset * 0.25, zCenter + spread);
        positionRaySegment(rayRed, rayOrigin, rayEndRed);
        positionRaySegment(rayGold, rayOrigin, rayEndGold);
        positionRaySegment(rayViolet, rayOrigin, rayEndViolet);
        spectrumSpot.position.set(0.542, 0.2 - angleOffset * 0.25, zCenter);
      }

      // 3. Titration (dynamic drop splash target Y)
      const ph = state.titration.currentPh;
      if (ph < 6.8) {
        const t = THREE.MathUtils.clamp((ph - 1.2) / 5.6, 0, 1);
        currentLiquidColor.copy(acidColor).lerp(neutralColor, t);
      } else {
        const t = THREE.MathUtils.clamp((ph - 6.8) / 5.5, 0, 1);
        currentLiquidColor.copy(neutralColor).lerp(basicColor, t);
      }
      tLiquidMat.color.copy(currentLiquidColor);

      const flaskFillScale = THREE.MathUtils.clamp(
        0.55 + (state.titration.baseAddedMl / 50) * 0.65,
        0.55,
        1.2,
      );
      tLiquid.scale.set(1, flaskFillScale, 1);
      const liquidSurfaceY = 0.062 + 0.14 * flaskFillScale;

      const buretteFill = THREE.MathUtils.clamp(
        1 - state.titration.baseAddedMl / 50,
        0.06,
        1,
      );
      tBuretteLiquid.scale.set(1, buretteFill, 1);
      tBuretteLiquid.position.y = 0.43 + buretteFill * 0.21;

      if (state.titration.dropPulse !== lastDropPulse) {
        lastDropPulse = state.titration.dropPulse;
        if (state.titration.dropPulse > 0) {
          dropAnim = 1.0;
        }
      }
      if (dropAnim > 0) {
        tDrop.visible = true;
        tDrop.position.y = THREE.MathUtils.lerp(liquidSurfaceY, 0.41, dropAnim);
        dropAnim = Math.max(0, dropAnim - delta * 2.8);
      } else {
        tDrop.visible = false;
      }

      // 4. Circuit (0-6A scale)
      const targetBladeAngle = state.circuit.switchClosed ? 0 : 0.72;
      cSwitchPivot.rotation.z = THREE.MathUtils.damp(
        cSwitchPivot.rotation.z,
        targetBladeAngle,
        12,
        delta,
      );
      const currentNorm = THREE.MathUtils.clamp(
        state.circuit.currentA / 6.0,
        0,
        1,
      );
      const targetNeedleAngle = THREE.MathUtils.lerp(0.62, -0.62, currentNorm);
      cNeedlePivot.rotation.z = THREE.MathUtils.damp(
        cNeedlePivot.rotation.z,
        targetNeedleAngle,
        8,
        delta,
      );
      cResistorMat.emissiveIntensity = state.circuit.switchClosed
        ? 0.25 + currentNorm * 1.4
        : 0;
      cLampMat.emissiveIntensity = state.circuit.switchClosed ? 1.8 : 0;

      if (state.circuit.switchClosed && state.circuit.currentA > 0) {
        electronProgress =
          (electronProgress + delta * (0.16 + currentNorm * 0.5)) % 1;
        electrons.forEach((bead, idx) => {
          bead.visible = true;
          const u = (electronProgress + idx / electrons.length) % 1;
          cWireCurve.getPointAt(u, _tempPos);
          bead.position.copy(_tempPos);
        });
      } else {
        electrons.forEach((bead) => {
          bead.visible = false;
        });
      }

      // 5. Electrolysis (only accumulate H2 when student is at Station 05!)
      const h2Frac = THREE.MathUtils.clamp(
        state.electrolysis.h2VolumeMl / 30,
        0.04,
        0.95,
      );
      const o2Frac = THREE.MathUtils.clamp(
        state.electrolysis.o2VolumeMl / 30,
        0.02,
        0.95,
      );
      eGasH2.scale.set(1, h2Frac, 1);
      eGasO2.scale.set(1, o2Frac, 1);
      ePowerLed.visible = state.electrolysis.powerOn;

      if (state.electrolysis.powerOn && state.electrolysis.h2VolumeMl < 30) {
        const rate = (state.electrolysis.voltageV / 12) * 1.8;
        if (activeStation === "electrolysis") {
          electrolysisH2Delta = rate * delta;
        }
        eBubblesH2.forEach((b, idx) => {
          b.visible = true;
          const yProg = (elapsed * (0.9 + rate * 0.4) + idx * 0.17) % 1;
          b.position.y = 0.1 + yProg * 0.34;
        });
        eBubblesO2.forEach((b, idx) => {
          b.visible = true;
          const yProg = (elapsed * (0.65 + rate * 0.3) + idx * 0.33) % 1;
          b.position.y = 0.1 + yProg * 0.34;
        });
      } else {
        eBubblesH2.forEach((b) => (b.visible = false));
        eBubblesO2.forEach((b) => (b.visible = false));
      }

      // 6. Photosynthesis Light Cone, O2 Pocket & Bubbles
      phBulbMat.emissiveIntensity = state.photosynthesis.lampOn
        ? 0.4 + (state.photosynthesis.lightIntensityPct / 100) * 2.0
        : 0.05;
      phLightCone.visible = state.photosynthesis.lampOn;
      phLightConeMat.opacity =
        0.08 + (state.photosynthesis.lightIntensityPct / 100) * 0.25;
      const o2PocketScale = state.photosynthesis.lampOn
        ? THREE.MathUtils.clamp(0.15 + state.photosynthesis.bubblesPerMin / 50, 0.15, 0.95)
        : 0.12;
      phO2Pocket.scale.set(1, o2PocketScale, 1);

      if (state.photosynthesis.lampOn && state.photosynthesis.bubblesPerMin > 0) {
        const speed = 0.25 + (state.photosynthesis.bubblesPerMin / 50) * 1.1;
        phBubbles.forEach((b, idx) => {
          b.visible = true;
          const prog = (elapsed * speed + idx / phBubbles.length) % 1;
          b.position.set(
            0.12 + Math.sin(elapsed * 3 + idx) * 0.008,
            0.14 + prog * 0.24,
            0,
          );
        });
      } else {
        phBubbles.forEach((b) => (b.visible = false));
      }

      // 7. Microscope
      mLampMat.emissiveIntensity = state.microscope.illuminatorOn ? 1.8 : 0.05;
      mSpecimenMat.emissiveIntensity = state.microscope.illuminatorOn
        ? 0.85
        : 0.05;
      const targetTurretY =
        state.microscope.magnification === 4
          ? 0
          : state.microscope.magnification === 10
            ? (Math.PI * 2) / 3
            : (Math.PI * 4) / 3;
      mTurret.rotation.y = THREE.MathUtils.damp(
        mTurret.rotation.y,
        targetTurretY,
        10,
        delta,
      );
      const targetHeadY =
        0.34 + ((state.microscope.focusValue - 50) / 50) * 0.06;
      mHeadGroup.position.y = THREE.MathUtils.damp(
        mHeadGroup.position.y,
        targetHeadY,
        12,
        delta,
      );

      // 8. Projectile Motion & Parabolic Trajectory
      const rad = THREE.MathUtils.degToRad(state.projectile.angleDeg);
      prBarrelPivot.rotation.z = rad;

      const v0 = state.projectile.speedMs;
      const vx = v0 * Math.cos(rad);
      const vy = v0 * Math.sin(rad);
      const totalT = (2 * vy) / 9.81;
      const benchScale = 0.4;

      if (
        lastProjAngle !== state.projectile.angleDeg ||
        lastProjSpeed !== state.projectile.speedMs
      ) {
        lastProjAngle = state.projectile.angleDeg;
        lastProjSpeed = state.projectile.speedMs;
        if (projFlightT < 0) {
          prBall.position.set(
            -0.56 + Math.cos(rad) * 0.18,
            0.14 + Math.sin(rad) * 0.18,
            0,
          );
        }
      }

      prArcDots.forEach((dot, idx) => {
        const frac = (idx + 1) / (prArcDots.length + 1);
        const t = frac * totalT;
        const x = vx * t * benchScale;
        const yBase = (vy * t - 0.5 * 9.81 * t * t) * benchScale;
        const yDrop = THREE.MathUtils.lerp(0.14, 0.045, frac * frac);
        dot.position.set(-0.56 + x, Math.max(0.045, yDrop + yBase), 0);
      });

      if (state.projectile.launchPulse !== lastLaunchPulse) {
        lastLaunchPulse = state.projectile.launchPulse;
        if (state.projectile.launchPulse > 0) {
          projFlightT = 0;
          projFlightTotalT = totalT;
        }
      }

      if (projFlightT >= 0) {
        projFlightT += delta * 1.1;
        if (projFlightT >= projFlightTotalT) {
          const finalX = vx * projFlightTotalT * benchScale;
          prBall.position.set(-0.56 + finalX, 0.052, 0);
          projFlightT = -1;
          projectileLandedRange = state.projectile.rangeM;
        } else {
          const frac = projFlightT / projFlightTotalT;
          const x = vx * projFlightT * benchScale;
          const yBase =
            (vy * projFlightT - 0.5 * 9.81 * projFlightT * projFlightT) *
            benchScale;
          const yDrop = THREE.MathUtils.lerp(0.14, 0.052, frac * frac);
          prBall.position.set(-0.56 + x, Math.max(0.052, yDrop + yBase), 0);
        }
      }

      // 9. Boyle's Law Piston & Bouncing Gas Molecules
      const volFrac = THREE.MathUtils.clamp(state.boyles.volumeMl / 50, 0.2, 1.0);
      const chamberHeight = volFrac * 0.54;
      bChamber.scale.set(1, volFrac, 1);
      bPistonGroup.position.y = THREE.MathUtils.damp(
        bPistonGroup.position.y,
        0.068 + chamberHeight,
        12,
        delta,
      );
      const pNorm = THREE.MathUtils.clamp((state.boyles.pressureKpa - 80) / 320, 0, 1);
      bGaugePivot.rotation.z = THREE.MathUtils.damp(
        bGaugePivot.rotation.z,
        THREE.MathUtils.lerp(0.65, -0.65, pNorm),
        10,
        delta,
      );
      const particleSpeed = 1.8 + pNorm * 4.5;
      bParticles.forEach((p, idx) => {
        const px = -0.1 + Math.sin(elapsed * particleSpeed + idx * 1.7) * 0.075;
        const pz = Math.cos(elapsed * (particleSpeed * 0.85) + idx * 2.1) * 0.075;
        const py =
          0.08 +
          Math.abs(Math.sin(elapsed * (particleSpeed * 1.1) + idx * 0.9)) *
            Math.max(0.05, chamberHeight - 0.06);
        p.position.set(px, py, pz);
      });

      // 10. Standing Wave Oscillator
      const harmonic = state.wave.harmonicNumber;
      const tensionOffset = THREE.MathUtils.mapLinear(
        state.wave.tensionN,
        10,
        40,
        0.13,
        0.08,
      );
      wWeight.position.y = tensionOffset;
      if (state.wave.running) {
        wavePhaseRad += (state.wave.frequencyHz / 8) * delta * 2.2;
      }
      const waveAmp = state.wave.running
        ? Math.cos(wavePhaseRad) * 0.065
        : 0;
      wStringBeads.forEach((bead, idx) => {
        const u = idx / (wStringBeads.length - 1);
        const x = THREE.MathUtils.lerp(-0.42, 0.5, u);
        const y = 0.24 + waveAmp * Math.sin(harmonic * Math.PI * u);
        bead.position.set(x, y, 0);
      });

      // 11. DNA Double Helix
      if (state.dna.rotating) {
        dHelixGroup.rotation.y += delta * 0.65;
      }
      for (let i = 0; i < 6; i++) {
        const tmpl = state.dna.templateStrand[i];
        const paired = state.dna.pairedStrand[i];
        const leftMesh = dnaPairMeshes[i * 2];
        const rightMesh = dnaPairMeshes[i * 2 + 1];
        leftMesh.material = dBaseMats[tmpl];
        if (paired) {
          const isValid = paired === getComplementaryBase(tmpl);
          rightMesh.material = isValid ? dBaseMats[paired] : dUnpairedMat;
        } else {
          rightMesh.material = dUnpairedMat;
        }
      }

      // 12. Trig Unit Circle Phasor
      const trigRad = THREE.MathUtils.degToRad(state.trig.angleDeg);
      trArmPivot.rotation.z = trigRad;
      const cx = Math.cos(trigRad) * 0.26;
      const sy = Math.sin(trigRad) * 0.26;
      const sinLen = Math.max(0.008, Math.abs(sy));
      trSinBar.scale.set(1, sinLen, 1);
      trSinBar.position.set(cx, sy * 0.5, 0.015);
      const cosLen = Math.max(0.008, Math.abs(cx));
      trCosBar.scale.set(1, cosLen, 1);
      trCosBar.position.set(cx * 0.5, 0, 0.015);

      return {
        oscillationCompleted,
        electrolysisH2Delta,
        projectileLandedRange,
      };
    },
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
