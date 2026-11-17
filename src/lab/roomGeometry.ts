import * as THREE from "three";
import type { LabMaterialLibrary } from "./materials";
import { createScaleDialTexture } from "./textures";
import type { StationId } from "./types";

export interface BenchPose {
  id: StationId;
  position: THREE.Vector3;
  rotationY: number;
  label: string;
  sublabel: string;
  cameraPosition: THREE.Vector3;
  cameraTarget: THREE.Vector3;
}

function makeBenchPose(
  id: StationId,
  x: number,
  z: number,
  rotationY: number,
  label: string,
  sublabel: string,
): BenchPose {
  const position = new THREE.Vector3(x, 0, z);
  const localCamOffset = new THREE.Vector3(0, 1.56, 1.85).applyAxisAngle(
    new THREE.Vector3(0, 1, 0),
    rotationY,
  );
  const cameraPosition = position.clone().add(localCamOffset);
  const cameraTarget = new THREE.Vector3(x, 1.15, z);
  return {
    id,
    position,
    rotationY,
    label,
    sublabel,
    cameraPosition,
    cameraTarget,
  };
}

export const BENCH_POSES: Record<StationId, BenchPose> = {
  // Left Wing (Physics)
  pendulum: makeBenchPose(
    "pendulum",
    -4.8,
    -3.6,
    Math.PI * 0.38,
    "01 · Simple Pendulum",
    "T = 2π√(L / g)",
  ),
  optics: makeBenchPose(
    "optics",
    -4.8,
    -1.2,
    Math.PI * 0.5,
    "02 · Ray Optics Prism",
    "n = sin((A+δm)/2)/sin(A/2)",
  ),
  circuit: makeBenchPose(
    "circuit",
    -4.8,
    1.2,
    Math.PI * 0.5,
    "04 · Ohm's Law Circuit",
    "I = V / R",
  ),
  wave: makeBenchPose(
    "wave",
    -4.8,
    3.6,
    Math.PI * 0.62,
    "10 · Standing Wave",
    "v = f · λ",
  ),

  // North Wing (Mathematics & Chemistry)
  projectile: makeBenchPose(
    "projectile",
    -3.3,
    -5.2,
    Math.PI * 0.1,
    "08 · Projectile Motion",
    "R = v₀² sin(2θ) / g",
  ),
  trig: makeBenchPose(
    "trig",
    -1.1,
    -5.2,
    0,
    "12 · Unit Circle Phasor",
    "sin²θ + cos²θ = 1",
  ),
  titration: makeBenchPose(
    "titration",
    1.1,
    -5.2,
    0,
    "03 · Acid-Base Titration",
    "HCl + NaOH → NaCl + H₂O",
  ),
  boyles: makeBenchPose(
    "boyles",
    3.3,
    -5.2,
    -Math.PI * 0.1,
    "09 · Boyle's Gas Law",
    "P₁V₁ = P₂V₂",
  ),

  // Right Wing (Chemistry & Biology)
  electrolysis: makeBenchPose(
    "electrolysis",
    4.8,
    -3.6,
    -Math.PI * 0.38,
    "05 · Water Electrolysis",
    "2H₂O → 2H₂ + O₂",
  ),
  photosynthesis: makeBenchPose(
    "photosynthesis",
    4.8,
    -1.2,
    -Math.PI * 0.5,
    "06 · Photosynthesis Rate",
    "6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂",
  ),
  microscope: makeBenchPose(
    "microscope",
    4.8,
    1.2,
    -Math.PI * 0.5,
    "07 · Cell Microscope",
    "4x · 10x · 40x Objectives",
  ),
  dna: makeBenchPose(
    "dna",
    4.8,
    3.6,
    -Math.PI * 0.62,
    "11 · DNA Double Helix",
    "A–T · G–C Base Pairing",
  ),
};

export interface LabRoomResult {
  roomEnvelope: THREE.Group;
  benchesRoot: THREE.Group;
  benchGroups: Record<StationId, THREE.Group>;
  selectionRings: Record<StationId, THREE.Mesh>;
  hitProxies: THREE.Mesh[];
  dispose: () => void;
}

export function buildLabRoom(
  materials: LabMaterialLibrary,
  maxAnisotropy: number,
): LabRoomResult {
  const roomEnvelope = new THREE.Group();
  roomEnvelope.name = "LabRoomEnvelope";

  const disposables: { dispose: () => void }[] = [];

  // 1. Floor (16m x 16m)
  const floorGeo = new THREE.PlaneGeometry(16, 16);
  disposables.push(floorGeo);
  const floorMesh = new THREE.Mesh(floorGeo, materials.floor);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  roomEnvelope.add(floorMesh);

  // 2. Ceiling
  const ceilingGeo = new THREE.PlaneGeometry(16, 16);
  disposables.push(ceilingGeo);
  const ceilingMesh = new THREE.Mesh(ceilingGeo, materials.ceiling);
  ceilingMesh.rotation.x = Math.PI / 2;
  ceilingMesh.position.y = 4.2;
  roomEnvelope.add(ceilingMesh);

  // 3. Four Architectural Walls + Platinum Wainscot Trim
  const wallHeight = 4.2;
  const wallLength = 16;
  const wallGeo = new THREE.PlaneGeometry(wallLength, wallHeight);
  const trimGeo = new THREE.BoxGeometry(wallLength, 0.14, 0.06);
  disposables.push(wallGeo, trimGeo);

  const wallConfigs = [
    { x: 0, z: -8.0, ry: 0 },
    { x: 0, z: 8.0, ry: Math.PI },
    { x: -8.0, z: 0, ry: Math.PI / 2 },
    { x: 8.0, z: 0, ry: -Math.PI / 2 },
  ];

  wallConfigs.forEach((cfg) => {
    const wall = new THREE.Mesh(wallGeo, materials.wall);
    wall.position.set(cfg.x, wallHeight / 2, cfg.z);
    wall.rotation.y = cfg.ry;
    wall.receiveShadow = true;
    roomEnvelope.add(wall);

    const baseboard = new THREE.Mesh(trimGeo, materials.platinumMetal);
    baseboard.position.set(cfg.x, 0.07, cfg.z);
    baseboard.rotation.y = cfg.ry;
    roomEnvelope.add(baseboard);
  });

  // 4. Overhead Daylight Skylight Panels
  const skylightGeo = new THREE.BoxGeometry(3.4, 0.06, 1.5);
  const skylightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfff8ed,
    emissiveIntensity: 0.7,
    roughness: 0.2,
  });
  disposables.push(skylightGeo, skylightMat);

  [-4.0, 4.0].forEach((x) => {
    [-3.0, 2.2].forEach((z) => {
      const panel = new THREE.Mesh(skylightGeo, skylightMat);
      panel.position.set(x, 4.16, z);
      roomEnvelope.add(panel);
    });
  });

  // Central floor compass ring
  const centerRingGeo = new THREE.RingGeometry(1.15, 1.24, 56);
  const centerRingMat = new THREE.MeshStandardMaterial({
    color: 0x6f4e37,
    roughness: 0.5,
    metalness: 0.3,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  disposables.push(centerRingGeo, centerRingMat);
  const centerRing = new THREE.Mesh(centerRingGeo, centerRingMat);
  centerRing.rotation.x = -Math.PI / 2;
  centerRing.position.y = 0.015;
  roomEnvelope.add(centerRing);

  // Back wall academic plaque
  const boardFrameGeo = new THREE.BoxGeometry(5.6, 1.4, 0.08);
  const boardFaceGeo = new THREE.PlaneGeometry(5.3, 1.15);
  const boardTex = createScaleDialTexture(
    "PHYSIX AI · 12-Station STEM Virtual Lab",
    "Physics · Chemistry · Biology · Mathematics (WASD Walk + Click Benches)",
    maxAnisotropy,
  );
  const boardFaceMat = new THREE.MeshStandardMaterial({
    map: boardTex,
    roughness: 0.55,
  });
  disposables.push(boardFrameGeo, boardFaceGeo, boardTex, boardFaceMat);

  const boardFrame = new THREE.Mesh(boardFrameGeo, materials.walnutBench);
  boardFrame.position.set(0, 2.35, -7.94);
  roomEnvelope.add(boardFrame);

  const boardFace = new THREE.Mesh(boardFaceGeo, boardFaceMat);
  boardFace.position.set(0, 2.35, -7.89);
  roomEnvelope.add(boardFace);

  // 5. Twelve Grounded Laboratory Benches
  const benchesRoot = new THREE.Group();
  benchesRoot.name = "LabBenches";

  const benchTopGeo = new THREE.BoxGeometry(1.75, 0.07, 1.05);
  const benchShelfGeo = new THREE.BoxGeometry(1.55, 0.03, 0.85);
  const legGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.82, 12);
  const plaqueGeo = new THREE.PlaneGeometry(0.92, 0.34);
  const ringGeo = new THREE.RingGeometry(1.04, 1.12, 48);
  const hitProxyGeo = new THREE.BoxGeometry(1.82, 1.65, 1.12);
  const hitProxyMat = new THREE.MeshBasicMaterial({ visible: false });
  disposables.push(
    benchTopGeo,
    benchShelfGeo,
    legGeo,
    plaqueGeo,
    ringGeo,
    hitProxyGeo,
    hitProxyMat,
  );

  const benchGroups = {} as Record<StationId, THREE.Group>;
  const selectionRings = {} as Record<StationId, THREE.Mesh>;
  const hitProxies: THREE.Mesh[] = [];

  (Object.keys(BENCH_POSES) as StationId[]).forEach((id) => {
    const pose = BENCH_POSES[id];
    const group = new THREE.Group();
    group.name = `Bench_${id}`;
    group.position.copy(pose.position);
    group.rotation.y = pose.rotationY;

    const top = new THREE.Mesh(benchTopGeo, materials.walnutBench);
    top.position.y = 0.825;
    top.castShadow = true;
    top.receiveShadow = true;
    group.add(top);

    const shelf = new THREE.Mesh(benchShelfGeo, materials.platinumMetal);
    shelf.position.y = 0.28;
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    group.add(shelf);

    const legOffsets = [
      [-0.78, -0.44],
      [0.78, -0.44],
      [-0.78, 0.44],
      [0.78, 0.44],
    ];
    legOffsets.forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(legGeo, materials.platinumMetal);
      leg.position.set(lx, 0.41, lz);
      leg.castShadow = true;
      group.add(leg);
    });

    const plaqueTex = createScaleDialTexture(
      pose.label,
      pose.sublabel,
      maxAnisotropy,
    );
    const plaqueMat = new THREE.MeshStandardMaterial({
      map: plaqueTex,
      roughness: 0.4,
    });
    disposables.push(plaqueTex, plaqueMat);

    const plaque = new THREE.Mesh(plaqueGeo, plaqueMat);
    plaque.position.set(0, 0.62, 0.45);
    group.add(plaque);

    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x6f4e37,
      emissive: 0x42335c,
      emissiveIntensity: 0.0,
      transparent: true,
      opacity: 0.45,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    disposables.push(ringMat);
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.018;
    group.add(ring);
    selectionRings[id] = ring;

    const hitProxy = new THREE.Mesh(hitProxyGeo, hitProxyMat);
    hitProxy.position.y = 0.88;
    hitProxy.layers.set(1);
    hitProxy.userData.stationId = id;
    group.add(hitProxy);
    hitProxies.push(hitProxy);

    benchGroups[id] = group;
    benchesRoot.add(group);
  });

  return {
    roomEnvelope,
    benchesRoot,
    benchGroups,
    selectionRings,
    hitProxies,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
