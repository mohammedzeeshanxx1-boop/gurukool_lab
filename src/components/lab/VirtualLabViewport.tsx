import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Award,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  Footprints,
  Glasses,
  Minimize2,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { labAudio } from "../../lab/audio";
import { createLabMaterials } from "../../lab/materials";
import {
  buildProgressSnapshot,
  calculateBoylesPressure,
  calculateOpticsDeviation,
  calculatePhotosynthesisRate,
  calculateProjectileRange,
  calculateTitrationPh,
  calculateWaveHarmonic,
  evaluateDnaMatches,
  evaluateQuests,
  getComplementaryBase,
  INITIAL_EXPERIMENT_STATE,
  LAB_QUESTS,
} from "../../lab/quests";
import { BENCH_POSES, buildLabRoom } from "../../lab/roomGeometry";
import { buildExperimentStations } from "../../lab/stations";
import type {
  DnaBase,
  LabExperimentState,
  LabViewMode,
  MicroscopeSpecimen,
  StationId,
} from "../../lab/types";

interface VirtualLabViewportProps {
  initialStation?: StationId;
  completedQuests?: Record<StationId, boolean>;
  onQuestsChange?: (completed: Record<StationId, boolean>) => void;
  onExitLab: () => void;
}

const STATION_ORDER: readonly StationId[] = [
  "pendulum",
  "optics",
  "titration",
  "circuit",
  "electrolysis",
  "photosynthesis",
  "microscope",
  "projectile",
  "boyles",
  "wave",
  "dna",
  "trig",
];

const STATION_SHORT_LABEL: Record<StationId, string> = {
  pendulum: "Pendulum",
  optics: "Ray Optics",
  titration: "Titration",
  circuit: "Ohm's Circuit",
  electrolysis: "Electrolysis",
  photosynthesis: "Photosynthesis",
  microscope: "Microscope",
  projectile: "Projectile",
  boyles: "Boyle's Law",
  wave: "Sound Wave",
  dna: "DNA Helix",
  trig: "Unit Circle",
};

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

const _walkForward = new THREE.Vector3();
const _walkRight = new THREE.Vector3();
const _rayOrigin = new THREE.Vector3();
const _rayDir = new THREE.Vector3();
const _tempMatrix = new THREE.Matrix4();

export function VirtualLabViewport({
  initialStation = "pendulum",
  completedQuests: externalCompleted,
  onQuestsChange,
  onExitLab,
}: VirtualLabViewportProps) {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const [activeStation, setActiveStation] = useState<StationId>(initialStation);
  const [viewMode, setViewMode] = useState<LabViewMode>("orbit");
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [contextLost, setContextLost] = useState(false);

  const [xrSupport, setXrSupport] = useState<{ vr: boolean; ar: boolean }>({
    vr: false,
    ar: false,
  });

  const [experimentState, setExperimentState] = useState<LabExperimentState>(
    INITIAL_EXPERIMENT_STATE,
  );
  const [completedQuests, setCompletedQuests] = useState<
    Record<StationId, boolean>
  >(() => externalCompleted ?? { ...EMPTY_COMPLETED });
  const [questBanner, setQuestBanner] = useState<string | null>(null);

  const activeStationRef = useRef<StationId>(activeStation);
  const viewModeRef = useRef<LabViewMode>(viewMode);
  const experimentStateRef = useRef<LabExperimentState>(experimentState);
  const completedQuestsRef = useRef(completedQuests);
  const keysPressedRef = useRef<Record<string, boolean>>({});
  const walkPadRef = useRef({ forward: 0, strafe: 0 });

  const cameraTransitionRef = useRef<{
    active: boolean;
    targetPos: THREE.Vector3;
    targetLook: THREE.Vector3;
  }>({
    active: false,
    targetPos: BENCH_POSES[initialStation].cameraPosition.clone(),
    targetLook: BENCH_POSES[initialStation].cameraTarget.clone(),
  });

  const xrControllerRef = useRef<{
    startXr: (mode: "immersive-vr" | "immersive-ar") => Promise<void>;
    endXr: () => Promise<void>;
    setRoomVisible: (visible: boolean) => void;
    setTransparentBackground: (transparent: boolean) => void;
    focusStation: (station: StationId) => void;
  } | null>(null);

  useEffect(() => {
    activeStationRef.current = activeStation;
  }, [activeStation]);

  useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);

  useEffect(() => {
    experimentStateRef.current = experimentState;
  }, [experimentState]);

  useEffect(() => {
    completedQuestsRef.current = completedQuests;
  }, [completedQuests]);

  useEffect(() => {
    const { completed, newlyCompleted } = evaluateQuests(
      experimentState,
      completedQuestsRef.current,
    );
    if (newlyCompleted.length > 0) {
      completedQuestsRef.current = completed;
      setCompletedQuests(completed);
      onQuestsChange?.(completed);
      labAudio.playQuestComplete();
      const firstQuest = LAB_QUESTS[newlyCompleted[0]];
      setQuestBanner(
        `Quest Completed: ${firstQuest.title} (+${firstQuest.xpReward} XP · ${firstQuest.badgeTitle})`,
      );
    }
  }, [experimentState, onQuestsChange]);

  useEffect(() => {
    if (!questBanner) return;
    const timer = window.setTimeout(() => setQuestBanner(null), 4500);
    return () => window.clearTimeout(timer);
  }, [questBanner]);

  useEffect(() => {
    const xr = (
      navigator as unknown as {
        xr?: { isSessionSupported?: (mode: string) => Promise<boolean> };
      }
    ).xr;
    if (!xr?.isSessionSupported) return;

    Promise.all([
      xr.isSessionSupported("immersive-vr").catch(() => false),
      xr.isSessionSupported("immersive-ar").catch(() => false),
    ]).then(([vr, ar]) => {
      setXrSupport({ vr: Boolean(vr), ar: Boolean(ar) });
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }
      keysPressedRef.current[e.code] = true;
      if (e.code === "KeyH") {
        setDockCollapsed((prev) => !prev);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.code] = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const stopCameraFeed = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement("canvas").getContext("webgl2");
      if (!gl) return true;
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2),
    );
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.xr.enabled = true;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    renderer.setSize(width, height);
    renderer.setClearColor(0xfaf8f5, 1);

    const canvas = renderer.domElement;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    container.appendChild(canvas);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => {
      setContextLost(false);
    };
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);

    const scene = new THREE.Scene();
    const ivoryBg = new THREE.Color(0xfaf8f5);
    scene.background = ivoryBg;
    scene.fog = new THREE.Fog(0xfaf8f5, 11, 24);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnvTexture = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04,
    ).texture;
    scene.environment = roomEnvTexture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(58, width / height, 0.08, 45);
    const initialPose = BENCH_POSES[activeStationRef.current];
    camera.position.copy(initialPose.cameraPosition);

    const xrRig = new THREE.Group();
    xrRig.name = "XRPlayerRig";
    scene.add(xrRig);

    const hemiLight = new THREE.HemisphereLight(0xf3eff9, 0x8a7566, 0.85);
    hemiLight.position.set(0, 4, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff4e2, 1.45);
    keyLight.position.set(4.0, 5.8, 3.8);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 22;
    const d = 8.0;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xe6e0f0, 0.65);
    rimLight.position.set(-4, 3.4, -3.5);
    scene.add(rimLight);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const materials = createLabMaterials(isSoftwareGl, maxAnisotropy);
    const room = buildLabRoom(materials, maxAnisotropy);
    const stations = buildExperimentStations(room.benchGroups, materials);
    scene.add(room.roomEnvelope);
    scene.add(room.benchesRoot);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.minDistance = 0.9;
    controls.maxDistance = 9.0;
    controls.target.copy(initialPose.cameraTarget);
    controls.update();

    controls.addEventListener("start", () => {
      cameraTransitionRef.current.active = false;
    });

    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointerNdc = new THREE.Vector2();
    let isDraggingLook = false;
    let downX = 0;
    let downY = 0;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let walkYaw = 0;
    let walkPitch = -0.12;
    const walkPos = new THREE.Vector3(0, 1.65, 4.2);

    const focusStation = (station: StationId) => {
      const pose = BENCH_POSES[station];
      if (viewModeRef.current === "walk") {
        walkPos.copy(pose.cameraPosition);
        walkPos.y = 1.65;
        const dx = pose.cameraTarget.x - walkPos.x;
        const dz = pose.cameraTarget.z - walkPos.z;
        walkYaw = Math.atan2(-dx, -dz);
        walkPitch = -0.22;
      } else {
        cameraTransitionRef.current.targetPos.copy(pose.cameraPosition);
        cameraTransitionRef.current.targetLook.copy(pose.cameraTarget);
        cameraTransitionRef.current.active = true;
      }
    };

    const triggerStationQuickAction = (station: StationId) => {
      if (station === "pendulum") {
        labAudio.playClick(560);
        setExperimentState((prev) => ({
          ...prev,
          pendulum: { ...prev.pendulum, running: !prev.pendulum.running },
        }));
      } else if (station === "optics") {
        labAudio.playClick(600);
        setExperimentState((prev) => {
          const nextAngle =
            prev.optics.prismAngleDeg >= 72
              ? 20
              : prev.optics.prismAngleDeg + 4;
          return {
            ...prev,
            optics: {
              ...prev.optics,
              beamOn: true,
              prismAngleDeg: nextAngle,
              deviationDeg: calculateOpticsDeviation(
                nextAngle,
                prev.optics.refractiveIndex,
              ),
            },
          };
        });
      } else if (station === "titration") {
        labAudio.playDrop();
        setExperimentState((prev) => {
          const nextBase = Math.min(50, Number((prev.titration.baseAddedMl + 1).toFixed(1)));
          return {
            ...prev,
            titration: {
              ...prev.titration,
              baseAddedMl: nextBase,
              currentPh: calculateTitrationPh(nextBase),
              dropPulse: prev.titration.dropPulse + 1,
            },
          };
        });
      } else if (station === "circuit") {
        labAudio.playClick(680);
        setExperimentState((prev) => {
          const nextClosed = !prev.circuit.switchClosed;
          return {
            ...prev,
            circuit: {
              ...prev.circuit,
              switchClosed: nextClosed,
              currentA: nextClosed
                ? prev.circuit.voltageV / prev.circuit.resistanceOhm
                : 0,
            },
          };
        });
      } else if (station === "electrolysis") {
        labAudio.playClick(600);
        setExperimentState((prev) => ({
          ...prev,
          electrolysis: {
            ...prev.electrolysis,
            powerOn: !prev.electrolysis.powerOn,
          },
        }));
      } else if (station === "photosynthesis") {
        labAudio.playClick(600);
        setExperimentState((prev) => {
          const nextOn = !prev.photosynthesis.lampOn;
          return {
            ...prev,
            photosynthesis: {
              ...prev.photosynthesis,
              lampOn: nextOn,
              bubblesPerMin: calculatePhotosynthesisRate(
                nextOn,
                prev.photosynthesis.lightIntensityPct,
                prev.photosynthesis.co2LevelGl,
              ),
            },
          };
        });
      } else if (station === "microscope") {
        labAudio.playClick(540);
        setExperimentState((prev) => {
          const nextMag: 4 | 10 | 40 =
            prev.microscope.magnification === 4
              ? 10
              : prev.microscope.magnification === 10
                ? 40
                : 4;
          return {
            ...prev,
            microscope: { ...prev.microscope, magnification: nextMag },
          };
        });
      } else if (station === "projectile") {
        labAudio.playClick(720);
        setExperimentState((prev) => ({
          ...prev,
          projectile: {
            ...prev.projectile,
            launchPulse: prev.projectile.launchPulse + 1,
          },
        }));
      } else if (station === "boyles") {
        labAudio.playClick(580);
        setExperimentState((prev) => {
          const nextVol =
            prev.boyles.volumeMl <= 15 ? 45 : prev.boyles.volumeMl - 5;
          return {
            ...prev,
            boyles: {
              volumeMl: nextVol,
              pressureKpa: calculateBoylesPressure(nextVol),
            },
          };
        });
      } else if (station === "wave") {
        labAudio.playClick(610);
        setExperimentState((prev) => ({
          ...prev,
          wave: { ...prev.wave, running: !prev.wave.running },
        }));
      } else if (station === "dna") {
        labAudio.playClick(630);
        setExperimentState((prev) => ({
          ...prev,
          dna: { ...prev.dna, rotating: !prev.dna.rotating },
        }));
      } else if (station === "trig") {
        labAudio.playClick(600);
        setExperimentState((prev) => ({
          ...prev,
          trig: { ...prev.trig, sweeping: !prev.trig.sweeping },
        }));
      }
    };

    const selectStationFromRay = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(room.hitProxies, false);
      if (hits.length > 0) {
        const hitStation = hits[0].object.userData.stationId as
          | StationId
          | undefined;
        if (hitStation) {
          if (hitStation === activeStationRef.current) {
            triggerStationQuickAction(hitStation);
          } else {
            labAudio.playClick(580);
            setActiveStation(hitStation);
            focusStation(hitStation);
          }
        }
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      if (viewModeRef.current === "walk") {
        isDraggingLook = true;
      }
    };

    let lastHoverCheck = 0;
    const onPointerMove = (e: PointerEvent) => {
      const dx = e.clientX - lastPointerX;
      const dy = e.clientY - lastPointerY;
      if (isDraggingLook && viewModeRef.current === "walk") {
        walkYaw -= dx * 0.0045;
        walkPitch = THREE.MathUtils.clamp(
          walkPitch - dy * 0.0045,
          -0.85,
          0.65,
        );
      } else {
        const now = performance.now();
        if (now - lastHoverCheck > 80) {
          lastHoverCheck = now;
          const rect = canvas.getBoundingClientRect();
          pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera(pointerNdc, camera);
          const hits = raycaster.intersectObjects(room.hitProxies, false);
          canvas.style.cursor = hits.length > 0 ? "pointer" : "grab";
        }
      }
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
    };

    const onPointerUp = (e: PointerEvent) => {
      isDraggingLook = false;
      const dist = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (dist < 8) {
        selectStationFromRay(e.clientX, e.clientY);
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    const xrRayGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -4),
    ]);
    const xrRayMat = new THREE.LineBasicMaterial({ color: 0x6f4e37 });
    const controller0 = renderer.xr.getController(0);
    const controller1 = renderer.xr.getController(1);
    controller0.add(new THREE.Line(xrRayGeo, xrRayMat));
    controller1.add(new THREE.Line(xrRayGeo, xrRayMat));
    xrRig.add(controller0, controller1);

    const onXrSelect = (event: { target: THREE.Object3D }) => {
      _tempMatrix.identity().extractRotation(event.target.matrixWorld);
      _rayOrigin.setFromMatrixPosition(event.target.matrixWorld);
      _rayDir.set(0, 0, -1).applyMatrix4(_tempMatrix);
      raycaster.set(_rayOrigin, _rayDir);
      const hits = raycaster.intersectObjects(room.hitProxies, false);
      if (hits.length > 0) {
        const hitStation = hits[0].object.userData.stationId as
          | StationId
          | undefined;
        if (hitStation) {
          labAudio.playClick(620);
          setActiveStation(hitStation);
        }
      }
    };
    controller0.addEventListener("selectstart", onXrSelect);
    controller1.addEventListener("selectstart", onXrSelect);

    const handleResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;
    let pendingElectroH2 = 0;
    let electroSyncTimer = 0;
    let trigSyncTimer = 0;
    let pendingTrigDelta = 0;

    const stepSimulation = (delta: number, elapsed: number) => {
      STATION_ORDER.forEach((id) => {
        const ringMat = room.selectionRings[id]
          .material as THREE.MeshStandardMaterial;
        const isCurrent = id === activeStationRef.current;
        ringMat.emissiveIntensity = isCurrent ? 0.95 : 0.0;
        ringMat.opacity = isCurrent ? 0.85 : 0.35;
      });

      const currentMode = viewModeRef.current;
      if (currentMode === "walk") {
        controls.enabled = false;
        const keys = keysPressedRef.current;
        const moveForward =
          (keys["KeyW"] || keys["ArrowUp"] ? 1 : 0) -
          (keys["KeyS"] || keys["ArrowDown"] ? 1 : 0) +
          walkPadRef.current.forward;
        const moveStrafe =
          (keys["KeyD"] || keys["ArrowRight"] ? 1 : 0) -
          (keys["KeyA"] || keys["ArrowLeft"] ? 1 : 0) +
          walkPadRef.current.strafe;

        if (moveForward !== 0 || moveStrafe !== 0) {
          const speed = 3.0 * delta;
          _walkForward.set(-Math.sin(walkYaw), 0, -Math.cos(walkYaw));
          _walkRight.set(Math.cos(walkYaw), 0, -Math.sin(walkYaw));
          walkPos.addScaledVector(_walkForward, moveForward * speed);
          walkPos.addScaledVector(_walkRight, moveStrafe * speed);
          walkPos.x = THREE.MathUtils.clamp(walkPos.x, -6.6, 6.6);
          walkPos.z = THREE.MathUtils.clamp(walkPos.z, -6.6, 6.6);
        }

        camera.position.lerp(walkPos, 1 - Math.exp(-14 * delta));
        camera.rotation.order = "YXZ";
        camera.rotation.y = walkYaw;
        camera.rotation.x = walkPitch;
      } else if (currentMode === "orbit" || currentMode === "ar-camera") {
        controls.enabled = true;
        if (cameraTransitionRef.current.active) {
          const alpha = 1 - Math.exp(-7 * delta);
          camera.position.lerp(cameraTransitionRef.current.targetPos, alpha);
          controls.target.lerp(cameraTransitionRef.current.targetLook, alpha);
          if (
            camera.position.distanceTo(cameraTransitionRef.current.targetPos) <
            0.02
          ) {
            cameraTransitionRef.current.active = false;
          }
        }
        controls.update();
      }

      const {
        oscillationCompleted,
        electrolysisH2Delta,
        projectileLandedRange,
      } = stations.update(
        experimentStateRef.current,
        delta,
        elapsed,
        activeStationRef.current,
      );

      pendingElectroH2 += electrolysisH2Delta;
      electroSyncTimer += delta;

      if (
        experimentStateRef.current.trig.sweeping &&
        activeStationRef.current === "trig"
      ) {
        pendingTrigDelta += delta * 28;
        trigSyncTimer += delta;
      }

      const shouldSyncElectro = electroSyncTimer >= 0.4 && pendingElectroH2 > 0;
      const shouldSyncTrig = trigSyncTimer >= 0.08 && pendingTrigDelta > 0;

      if (
        oscillationCompleted ||
        projectileLandedRange !== null ||
        shouldSyncElectro ||
        shouldSyncTrig
      ) {
        const addH2 = shouldSyncElectro ? pendingElectroH2 : 0;
        const addTrig = shouldSyncTrig ? pendingTrigDelta : 0;
        if (shouldSyncElectro) {
          pendingElectroH2 = 0;
          electroSyncTimer = 0;
        }
        if (shouldSyncTrig) {
          pendingTrigDelta = 0;
          trigSyncTimer = 0;
        }
        setExperimentState((prev) => {
          const nextH2 = Math.min(
            30,
            Number((prev.electrolysis.h2VolumeMl + addH2).toFixed(1)),
          );
          return {
            ...prev,
            pendulum: oscillationCompleted
              ? {
                  ...prev.pendulum,
                  elapsedOscillations: prev.pendulum.elapsedOscillations + 1,
                }
              : prev.pendulum,
            electrolysis:
              addH2 > 0
                ? {
                    ...prev.electrolysis,
                    h2VolumeMl: nextH2,
                    o2VolumeMl: Number((nextH2 / 2).toFixed(1)),
                  }
                : prev.electrolysis,
            projectile:
              projectileLandedRange !== null
                ? {
                    ...prev.projectile,
                    lastLandedRangeM: projectileLandedRange,
                  }
                : prev.projectile,
            trig:
              addTrig > 0
                ? {
                    ...prev.trig,
                    angleDeg: Math.round((prev.trig.angleDeg + addTrig) % 360),
                  }
                : prev.trig,
          };
        });
      }
    };

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = () => {
      if (disposed || renderer.xr.isPresenting) return;
      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();
      stepSimulation(delta, elapsed);
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);

    let activeXrSession: XRSession | null = null;
    xrControllerRef.current = {
      focusStation,
      setRoomVisible: (visible: boolean) => {
        room.roomEnvelope.visible = visible;
      },
      setTransparentBackground: (transparent: boolean) => {
        if (transparent) {
          scene.background = null;
          scene.fog = null;
          renderer.setClearColor(0x000000, 0);
        } else {
          scene.background = ivoryBg;
          scene.fog = new THREE.Fog(0xfaf8f5, 11, 24);
          renderer.setClearColor(0xfaf8f5, 1);
        }
      },
      startXr: async (mode: "immersive-vr" | "immersive-ar") => {
        const xr = (
          navigator as unknown as {
            xr?: {
              requestSession: (
                m: string,
                opts?: Record<string, unknown>,
              ) => Promise<XRSession>;
            };
          }
        ).xr;
        if (!xr) {
          throw new Error("WebXR is not available in this browser.");
        }
        const session = await xr.requestSession(mode, {
          optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"],
        });
        activeXrSession = session;

        const isAr = mode === "immersive-ar";
        room.roomEnvelope.visible = !isAr;
        if (isAr) {
          scene.background = null;
          scene.fog = null;
          renderer.setClearColor(0x000000, 0);
        }

        xrRig.position.set(0, 0, 3.6);
        xrRig.add(camera);

        renderer.xr.setReferenceSpaceType("local-floor");
        await renderer.xr.setSession(session);
        setViewMode(isAr ? "ar-xr" : "vr-xr");

        session.addEventListener("end", () => {
          activeXrSession = null;
          renderer.setAnimationLoop(null);
          xrRig.remove(camera);
          scene.add(camera);
          room.roomEnvelope.visible = true;
          scene.background = ivoryBg;
          scene.fog = new THREE.Fog(0xfaf8f5, 11, 24);
          renderer.setClearColor(0xfaf8f5, 1);
          setViewMode("orbit");
          focusStation(activeStationRef.current);
          frameId = requestAnimationFrame(tick);
        });

        renderer.setAnimationLoop(() => {
          const delta = Math.min(clock.getDelta(), 0.05);
          const elapsed = clock.getElapsedTime();
          stepSimulation(delta, elapsed);
          renderer.render(scene, camera);
        });
      },
      endXr: async () => {
        if (activeXrSession) {
          await activeXrSession.end();
        }
      },
    };

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      renderer.setAnimationLoop(null);
      if (activeXrSession) {
        void activeXrSession.end().catch(() => {});
      }
      stopCameraFeed();

      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);

      controls.dispose();
      stations.dispose();
      room.dispose();
      materials.dispose();
      roomEnvTexture.dispose();
      xrRayGeo.dispose();
      xrRayMat.dispose();
      renderer.dispose();

      if (canvas.parentNode === container) {
        container.removeChild(canvas);
      }
      xrControllerRef.current = null;
    };
  }, [stopCameraFeed]);

  const switchStation = (station: StationId) => {
    labAudio.playClick(560);
    setActiveStation(station);
    setShowHint(false);
    xrControllerRef.current?.focusStation(station);
  };

  const toggleWalkMode = () => {
    labAudio.playClick(500);
    stopCameraFeed();
    xrControllerRef.current?.setRoomVisible(true);
    xrControllerRef.current?.setTransparentBackground(false);

    if (viewMode === "walk") {
      setViewMode("orbit");
      xrControllerRef.current?.focusStation(activeStation);
      setStatusNotice("Switched to Bench Orbit view.");
    } else {
      setViewMode("walk");
      xrControllerRef.current?.focusStation(activeStation);
      setStatusNotice(
        "Walk Mode: Use WASD / Arrow keys (or touch pad) & drag to look.",
      );
    }
  };

  const handleEnterVr = async () => {
    labAudio.playClick(640);
    if (!xrSupport.vr) {
      setStatusNotice(
        "WebXR headset not detected in this browser. Use Walk Mode or AR Tabletop to explore all 12 STEM benches.",
      );
      return;
    }
    try {
      stopCameraFeed();
      await xrControllerRef.current?.startXr("immersive-vr");
    } catch (err) {
      setStatusNotice(
        err instanceof Error ? err.message : "Could not start WebXR VR session.",
      );
    }
  };

  const handleToggleAr = async () => {
    labAudio.playClick(640);
    if (viewMode === "ar-camera") {
      stopCameraFeed();
      xrControllerRef.current?.setRoomVisible(true);
      xrControllerRef.current?.setTransparentBackground(false);
      setViewMode("orbit");
      setStatusNotice("Exited Camera AR passthrough.");
      return;
    }

    if (xrSupport.ar) {
      try {
        await xrControllerRef.current?.startXr("immersive-ar");
        return;
      } catch {
        // Fallback to live camera passthrough
      }
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatusNotice(
        "Camera AR requires browser camera access. Continuing in 3D Virtual Lab mode.",
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      xrControllerRef.current?.setRoomVisible(false);
      xrControllerRef.current?.setTransparentBackground(true);
      setViewMode("ar-camera");
      xrControllerRef.current?.focusStation(activeStation);
      setStatusNotice(
        "Camera AR Tabletop active: Experiment bench projected onto your camera feed.",
      );
    } catch {
      setStatusNotice(
        "Camera access was declined or unavailable. Staying in 3D Virtual Lab mode.",
      );
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    labAudio.muted = next;
    setIsMuted(next);
    if (!next) labAudio.playClick(600);
  };

  const progress = buildProgressSnapshot(completedQuests);
  const completedCount = STATION_ORDER.filter((id) => completedQuests[id]).length;
  const activeQuest = LAB_QUESTS[activeStation];

  const microBlurPx = Math.abs(experimentState.microscope.focusValue - 50) * 0.14;
  const microZoom =
    experimentState.microscope.magnification === 4
      ? 0.68
      : experimentState.microscope.magnification === 10
        ? 1.0
        : 1.52;

  const trigRad = (experimentState.trig.angleDeg * Math.PI) / 180;
  const trigCos = Math.cos(trigRad);
  const trigSin = Math.sin(trigRad);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#FAF8F5] select-none">
      <video
        ref={videoRef}
        playsInline
        muted
        className={[
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-200",
          viewMode === "ar-camera"
            ? "opacity-100"
            : "opacity-0 pointer-events-none",
        ].join(" ")}
      />

      <div ref={canvasMountRef} className="absolute inset-0 h-full w-full" />

      {contextLost ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#FAF8F5] p-6 text-center">
          <div className="max-w-md rounded-xl border border-[#E5E4E2] bg-white p-6 space-y-3">
            <p className="font-display text-lg font-semibold text-[#231B16]">
              3D Graphics Context Interrupted
            </p>
            <p className="text-sm text-[#5C5149]">
              Your browser paused WebGL rendering. Return to the lab overview or reload to restore the 3D workbench.
            </p>
            <button
              type="button"
              onClick={onExitLab}
              className="rounded-lg bg-[#6F4E37] px-4 py-2 text-sm font-medium text-white cursor-pointer"
            >
              Exit to Lab Overview
            </button>
          </div>
        </div>
      ) : null}

      {/* Top HUD */}
      <div className="pointer-events-none absolute top-4 left-4 right-4 z-20 flex flex-wrap items-start justify-between gap-3">
        <div className="pointer-events-auto rounded-xl border border-[#E5E4E2] bg-[#FAF8F5]/95 px-4 py-3 shadow-sm max-w-md space-y-1.5">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#5C5149]">
            <span className="font-display font-semibold text-sm text-[#6F4E37]">
              PHYSIX AI Lab
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-[#231B16]">
              {progress.rankTitle}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-[#42335C] font-medium">
              {progress.xp} XP
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {completedCount}/{STATION_ORDER.length} Quests
            </span>
          </div>

          <div className="flex items-start justify-between gap-3 pt-1 border-t border-[#E5E4E2]">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-[#231B16] flex items-center gap-1.5">
                {completedQuests[activeStation] ? (
                  <CheckCircle2
                    className="h-3.5 w-3.5 text-[#2D6A4F] shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <Award
                    className="h-3.5 w-3.5 text-[#6F4E37] shrink-0"
                    aria-hidden="true"
                  />
                )}
                <span>
                  Quest {activeQuest.stationNumber}: {activeQuest.title}
                </span>
              </p>
              <p className="text-xs text-[#5C5149] leading-snug">
                {showHint ? activeQuest.hint : activeQuest.objective}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowHint((p) => !p)}
              className="text-xs font-medium text-[#6F4E37] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              {showHint ? "Objective" : "Hint"}
            </button>
          </div>
        </div>

        <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-xl border border-[#E5E4E2] bg-[#FAF8F5]/95 p-1.5 shadow-sm">
          <button
            type="button"
            onClick={toggleWalkMode}
            className={[
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors",
              viewMode === "walk"
                ? "bg-[#6F4E37] text-white"
                : "bg-white text-[#231B16] border border-[#E5E4E2] hover:bg-[#F4F1EC]",
            ].join(" ")}
          >
            {viewMode === "walk" ? (
              <Footprints className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{viewMode === "walk" ? "Walking Inside" : "Walk Lab"}</span>
          </button>

          <button
            type="button"
            onClick={() => void handleEnterVr()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#E6E0F0] px-3 py-2 text-xs font-medium text-[#42335C] hover:bg-[#DBD2EB] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Glasses className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{xrSupport.vr ? "Enter VR" : "VR Headset"}</span>
          </button>

          <button
            type="button"
            onClick={() => void handleToggleAr()}
            className={[
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors",
              viewMode === "ar-camera"
                ? "bg-[#6F4E37] text-white"
                : "bg-white text-[#231B16] border border-[#E5E4E2] hover:bg-[#F4F1EC]",
            ].join(" ")}
          >
            <Camera className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{viewMode === "ar-camera" ? "Exit AR" : "AR Tabletop"}</span>
          </button>

          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute lab audio" : "Mute lab audio"}
            className="inline-flex items-center justify-center rounded-lg border border-[#E5E4E2] bg-white h-8 w-8 text-[#231B16] hover:bg-[#F4F1EC] cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              stopCameraFeed();
              onExitLab();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E4E2] bg-white px-3 py-2 text-xs font-medium text-[#231B16] hover:bg-[#F4F1EC] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Exit Lab</span>
          </button>
        </div>
      </div>

      {/* Live Eyepiece Specimen Field when Inspecting Microscope in 3D */}
      {activeStation === "microscope" ? (
        <div className="pointer-events-auto absolute top-28 right-4 z-20 rounded-xl border border-[#E5E4E2] bg-[#FAF8F5]/95 p-3 shadow-md w-48 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#231B16]">Eyepiece Feed</span>
            <span className="font-mono tabular-nums text-[#42335C]">
              {experimentState.microscope.magnification}x
            </span>
          </div>
          <svg viewBox="0 0 160 160" className="w-full h-auto rounded-lg">
            <defs>
              <clipPath id="vp-eyepiece-clip">
                <circle cx="80" cy="80" r="72" />
              </clipPath>
              <filter id="vp-specimen-blur">
                <feGaussianBlur stdDeviation={microBlurPx} />
              </filter>
            </defs>
            <circle cx="80" cy="80" r="78" fill="#231B16" />
            <circle
              cx="80"
              cy="80"
              r="72"
              fill={
                experimentState.microscope.illuminatorOn ? "#F8F5FC" : "#2E2621"
              }
            />
            {experimentState.microscope.illuminatorOn ? (
              <g clipPath="url(#vp-eyepiece-clip)">
                <g
                  transform={`translate(80, 80) scale(${microZoom}) translate(-80, -80)`}
                  filter={microBlurPx > 0.2 ? "url(#vp-specimen-blur)" : undefined}
                >
                  {experimentState.microscope.specimen === "onion" ? (
                    <g>
                      <rect x="20" y="30" width="58" height="44" fill="#E6E0F0" stroke="#42335C" strokeWidth="2" />
                      <circle cx="48" cy="52" r="8" fill="#6C4AB6" />
                      <rect x="78" y="30" width="60" height="44" fill="#EFEAF7" stroke="#42335C" strokeWidth="2" />
                      <circle cx="108" cy="54" r="8" fill="#6C4AB6" />
                      <rect x="20" y="74" width="58" height="46" fill="#EFEAF7" stroke="#42335C" strokeWidth="2" />
                      <circle cx="52" cy="96" r="8" fill="#6C4AB6" />
                      <rect x="78" y="74" width="60" height="46" fill="#E6E0F0" stroke="#42335C" strokeWidth="2" />
                      <circle cx="106" cy="94" r="8" fill="#6C4AB6" />
                    </g>
                  ) : experimentState.microscope.specimen === "stomata" ? (
                    <g>
                      <ellipse cx="80" cy="80" rx="58" ry="48" fill="#D4ECE4" stroke="#2D6A4F" strokeWidth="2" />
                      <path d="M 62 80 Q 80 54 98 80 Q 80 106 62 80 Z" fill="#40916C" stroke="#1B4332" strokeWidth="2" />
                      <ellipse cx="80" cy="80" rx="10" ry="4" fill="#FAF8F5" />
                      <circle cx="71" cy="70" r="3" fill="#1B4332" />
                      <circle cx="89" cy="90" r="3" fill="#1B4332" />
                    </g>
                  ) : (
                    <g>
                      <path d="M 35 60 Q 65 25 110 48 Q 130 85 95 118 Q 48 128 35 60 Z" fill="#F6E5EE" stroke="#9E2A5C" strokeWidth="2" />
                      <circle cx="78" cy="76" r="11" fill="#8C2754" />
                    </g>
                  )}
                </g>
              </g>
            ) : null}
          </svg>
        </div>
      ) : null}

      {/* Transient Quest / Status Banner */}
      {questBanner || statusNotice ? (
        <div className="pointer-events-none absolute top-28 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 max-w-[92vw]">
          {questBanner ? (
            <div className="pointer-events-auto rounded-lg border border-[#2D6A4F]/30 bg-[#ECF5F0] px-4 py-2 text-xs sm:text-sm font-medium text-[#2D6A4F] shadow-sm">
              {questBanner}
            </div>
          ) : null}
          {statusNotice ? (
            <div className="pointer-events-auto flex items-center gap-3 rounded-lg border border-[#E5E4E2] bg-[#FAF8F5]/95 px-3.5 py-1.5 text-xs text-[#5C5149] shadow-sm">
              <span>{statusNotice}</span>
              <button
                type="button"
                onClick={() => setStatusNotice(null)}
                className="font-medium text-[#6F4E37] cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Walk-Mode Touch D-Pad */}
      {viewMode === "walk" ? (
        <div className="pointer-events-auto absolute bottom-36 right-4 z-20 grid grid-cols-3 gap-1 rounded-xl border border-[#E5E4E2] bg-[#FAF8F5]/95 p-1.5 shadow-sm">
          <div />
          <button
            type="button"
            aria-label="Walk forward"
            onPointerDown={() => (walkPadRef.current.forward = 1)}
            onPointerUp={() => (walkPadRef.current.forward = 0)}
            onPointerLeave={() => (walkPadRef.current.forward = 0)}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-[#E5E4E2] active:bg-[#E6E0F0] cursor-pointer"
          >
            <ArrowUp className="h-4 w-4" aria-hidden="true" />
          </button>
          <div />
          <button
            type="button"
            aria-label="Walk left"
            onPointerDown={() => (walkPadRef.current.strafe = -1)}
            onPointerUp={() => (walkPadRef.current.strafe = 0)}
            onPointerLeave={() => (walkPadRef.current.strafe = 0)}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-[#E5E4E2] active:bg-[#E6E0F0] cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Walk backward"
            onPointerDown={() => (walkPadRef.current.forward = -1)}
            onPointerUp={() => (walkPadRef.current.forward = 0)}
            onPointerLeave={() => (walkPadRef.current.forward = 0)}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-[#E5E4E2] active:bg-[#E6E0F0] cursor-pointer"
          >
            <ArrowDown className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Walk right"
            onPointerDown={() => (walkPadRef.current.strafe = 1)}
            onPointerUp={() => (walkPadRef.current.strafe = 0)}
            onPointerLeave={() => (walkPadRef.current.strafe = 0)}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-[#E5E4E2] active:bg-[#E6E0F0] cursor-pointer"
          >
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {/* Unified Collapsible Bottom Control Dock */}
      <div
        className={[
          "pointer-events-none fixed bottom-4 left-1/2 -translate-x-1/2 z-20 w-[min(1040px,96vw)] transition-transform duration-200 ease-out",
          dockCollapsed ? "translate-y-[calc(100%-36px)]" : "translate-y-0",
        ].join(" ")}
      >
        <div className="flex justify-center mb-1.5">
          <button
            type="button"
            onClick={() => setDockCollapsed((prev) => !prev)}
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-t-lg border border-b-0 border-[#E5E4E2] bg-[#FAF8F5]/95 px-3.5 py-1.5 text-xs font-medium text-[#5C5149] hover:text-[#231B16] cursor-pointer"
          >
            {dockCollapsed ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Show Experiment Controls (H)</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Hide Controls (H)</span>
              </>
            )}
          </button>
        </div>

        <div className="pointer-events-auto rounded-xl border border-[#E5E4E2] bg-[#FAF8F5]/95 p-3 sm:p-4 shadow-md space-y-3">
          {/* 12-Station Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto border-b border-[#E5E4E2] pb-2.5">
            {STATION_ORDER.map((id) => {
              const quest = LAB_QUESTS[id];
              const isActive = id === activeStation;
              const isDone = completedQuests[id];
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => switchStation(id)}
                  className={[
                    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors border",
                    isActive
                      ? "bg-[#6F4E37] text-white border-[#6F4E37]"
                      : "bg-white text-[#231B16] border-[#E5E4E2] hover:bg-[#F4F1EC]",
                  ].join(" ")}
                >
                  <span className="font-mono tabular-nums">
                    {quest.stationNumber}
                  </span>
                  <span>{STATION_SHORT_LABEL[id]}</span>
                  {isDone ? (
                    <CheckCircle2
                      className={[
                        "h-3.5 w-3.5",
                        isActive ? "text-white" : "text-[#2D6A4F]",
                      ].join(" ")}
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* 01: Pendulum Controls */}
          {activeStation === "pendulum" ? (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                <label className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="font-medium text-[#231B16]">
                      String Length (L)
                    </span>
                    <span className="font-mono tabular-nums text-[#6F4E37]">
                      {experimentState.pendulum.lengthM.toFixed(2)} m
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.4}
                    max={1.6}
                    step={0.05}
                    value={experimentState.pendulum.lengthM}
                    onChange={(e) => {
                      const lengthM = Number(e.target.value);
                      setExperimentState((prev) => ({
                        ...prev,
                        pendulum: {
                          ...prev.pendulum,
                          lengthM,
                          measuredPeriodS: 2 * Math.PI * Math.sqrt(lengthM / 9.81),
                        },
                      }));
                    }}
                    className="w-full accent-[#6F4E37]"
                  />
                </label>

                <label className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="font-medium text-[#231B16]">
                      Release Angle (θ)
                    </span>
                    <span className="font-mono tabular-nums text-[#6F4E37]">
                      {experimentState.pendulum.amplitudeDeg}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min={6}
                    max={30}
                    step={1}
                    value={experimentState.pendulum.amplitudeDeg}
                    onChange={(e) => {
                      const amplitudeDeg = Number(e.target.value);
                      setExperimentState((prev) => ({
                        ...prev,
                        pendulum: { ...prev.pendulum, amplitudeDeg },
                      }));
                    }}
                    className="w-full accent-[#6F4E37]"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div className="rounded-lg border border-[#E5E4E2] bg-white px-3 py-1.5 text-xs font-mono tabular-nums text-[#231B16]">
                  T = {experimentState.pendulum.measuredPeriodS.toFixed(2)} s ·{" "}
                  {experimentState.pendulum.elapsedOscillations} swings
                </div>
                <button
                  type="button"
                  onClick={() => {
                    labAudio.playClick();
                    setExperimentState((prev) => ({
                      ...prev,
                      pendulum: {
                        ...prev.pendulum,
                        running: !prev.pendulum.running,
                      },
                    }));
                  }}
                  className="rounded-lg bg-[#6F4E37] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#5A3E2B] whitespace-nowrap cursor-pointer"
                >
                  {experimentState.pendulum.running
                    ? "Pause Swing"
                    : "Start Swing"}
                </button>
              </div>
            </div>
          ) : null}

          {/* 02: Ray Optics Controls */}
          {activeStation === "optics" ? (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                <label className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="font-medium text-[#231B16]">
                      Prism Rotation
                    </span>
                    <span className="font-mono tabular-nums text-[#6F4E37]">
                      {experimentState.optics.prismAngleDeg}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={75}
                    step={1}
                    value={experimentState.optics.prismAngleDeg}
                    onChange={(e) => {
                      const prismAngleDeg = Number(e.target.value);
                      setExperimentState((prev) => ({
                        ...prev,
                        optics: {
                          ...prev.optics,
                          prismAngleDeg,
                          deviationDeg: calculateOpticsDeviation(
                            prismAngleDeg,
                            prev.optics.refractiveIndex,
                          ),
                        },
                      }));
                    }}
                    className="w-full accent-[#6F4E37]"
                  />
                </label>

                <label className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="font-medium text-[#231B16]">
                      Refractive Index (n)
                    </span>
                    <span className="font-mono tabular-nums text-[#6F4E37]">
                      {experimentState.optics.refractiveIndex.toFixed(2)} · δ{" "}
                      {experimentState.optics.deviationDeg.toFixed(1)}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1.45}
                    max={1.7}
                    step={0.01}
                    value={experimentState.optics.refractiveIndex}
                    onChange={(e) => {
                      const refractiveIndex = Number(e.target.value);
                      setExperimentState((prev) => ({
                        ...prev,
                        optics: {
                          ...prev.optics,
                          refractiveIndex,
                          deviationDeg: calculateOpticsDeviation(
                            prev.optics.prismAngleDeg,
                            refractiveIndex,
                          ),
                        },
                      }));
                    }}
                    className="w-full accent-[#6F4E37]"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={() => {
                  labAudio.playClick();
                  setExperimentState((prev) => ({
                    ...prev,
                    optics: { ...prev.optics, beamOn: !prev.optics.beamOn },
                  }));
                }}
                className="rounded-lg bg-[#6F4E37] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#5A3E2B] whitespace-nowrap cursor-pointer shrink-0"
              >
                {experimentState.optics.beamOn
                  ? "Turn Beam Off"
                  : "Turn Beam On"}
              </button>
            </div>
          ) : null}

          {/* 03: Titration Controls */}
          {activeStation === "titration" ? (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="rounded-lg border border-[#E5E4E2] bg-white px-3 py-1.5 font-mono tabular-nums text-[#231B16]">
                  Acid: 25.0 mL · Base:{" "}
                  {experimentState.titration.baseAddedMl.toFixed(1)} mL
                </div>
                <div className="rounded-lg border border-[#DCD3EB] bg-[#F3EFF9] px-3 py-1.5 font-mono tabular-nums text-[#42335C] font-medium">
                  pH {experimentState.titration.currentPh.toFixed(2)}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    labAudio.playDrop();
                    setExperimentState((prev) => {
                      const nextBase = Math.min(
                        50,
                        Number((prev.titration.baseAddedMl + 0.2).toFixed(1)),
                      );
                      return {
                        ...prev,
                        titration: {
                          ...prev.titration,
                          baseAddedMl: nextBase,
                          currentPh: calculateTitrationPh(nextBase),
                          dropPulse: prev.titration.dropPulse + 1,
                        },
                      };
                    });
                  }}
                  className="rounded-lg border border-[#6F4E37] bg-white px-3 py-2 text-xs font-medium text-[#6F4E37] hover:bg-[#FAF8F5] whitespace-nowrap cursor-pointer"
                >
                  +0.2 mL Micro
                </button>
                <button
                  type="button"
                  onClick={() => {
                    labAudio.playDrop();
                    setExperimentState((prev) => {
                      const nextBase = Math.min(
                        50,
                        Number((prev.titration.baseAddedMl + 1).toFixed(1)),
                      );
                      return {
                        ...prev,
                        titration: {
                          ...prev.titration,
                          baseAddedMl: nextBase,
                          currentPh: calculateTitrationPh(nextBase),
                          dropPulse: prev.titration.dropPulse + 1,
                        },
                      };
                    });
                  }}
                  className="rounded-lg bg-[#6F4E37] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#5A3E2B] whitespace-nowrap cursor-pointer"
                >
                  +1 mL Drop
                </button>
                <button
                  type="button"
                  onClick={() => {
                    labAudio.playDrop();
                    setExperimentState((prev) => {
                      const nextBase = Math.min(
                        50,
                        Number((prev.titration.baseAddedMl + 5).toFixed(1)),
                      );
                      return {
                        ...prev,
                        titration: {
                          ...prev.titration,
                          baseAddedMl: nextBase,
                          currentPh: calculateTitrationPh(nextBase),
                          dropPulse: prev.titration.dropPulse + 1,
                        },
                      };
                    });
                  }}
                  className="rounded-lg bg-[#E6E0F0] px-3.5 py-2 text-xs font-medium text-[#42335C] hover:bg-[#DBD2EB] whitespace-nowrap cursor-pointer"
                >
                  +5 mL Pour
                </button>
                <button
                  type="button"
                  onClick={() => {
                    labAudio.playClick(440);
                    setExperimentState((prev) => ({
                      ...prev,
                      titration: {
                        ...prev.titration,
                        baseAddedMl: 0,
                        currentPh: calculateTitrationPh(0),
                        dropPulse: 0,
                      },
                    }));
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#E5E4E2] bg-white px-3 py-2 text-xs font-medium text-[#231B16] hover:bg-[#F4F1EC] cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          ) : null}

          {/* 04: Ohm's Law Circuit Controls */}
          {activeStation === "circuit" ? (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                <label className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="font-medium text-[#231B16]">Voltage (V)</span>
                    <span className="font-mono tabular-nums text-[#6F4E37]">
                      {experimentState.circuit.voltageV.toFixed(1)} V
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={12}
                    step={0.5}
                    value={experimentState.circuit.voltageV}
                    onChange={(e) => {
                      const voltageV = Number(e.target.value);
                      setExperimentState((prev) => ({
                        ...prev,
                        circuit: {
                          ...prev.circuit,
                          voltageV,
                          currentA: prev.circuit.switchClosed
                            ? voltageV / prev.circuit.resistanceOhm
                            : 0,
                        },
                      }));
                    }}
                    className="w-full accent-[#6F4E37]"
                  />
                </label>

                <label className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="font-medium text-[#231B16]">
                      Resistance (R)
                    </span>
                    <span className="font-mono tabular-nums text-[#6F4E37]">
                      {experimentState.circuit.resistanceOhm.toFixed(1)} Ω
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={10}
                    step={0.5}
                    value={experimentState.circuit.resistanceOhm}
                    onChange={(e) => {
                      const resistanceOhm = Number(e.target.value);
                      setExperimentState((prev) => ({
                        ...prev,
                        circuit: {
                          ...prev.circuit,
                          resistanceOhm,
                          currentA: prev.circuit.switchClosed
                            ? prev.circuit.voltageV / resistanceOhm
                            : 0,
                        },
                      }));
                    }}
                    className="w-full accent-[#6F4E37]"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div className="rounded-lg border border-[#E5E4E2] bg-white px-3 py-1.5 text-xs font-mono tabular-nums text-[#231B16]">
                  I = {experimentState.circuit.currentA.toFixed(2)} A
                </div>
                <button
                  type="button"
                  onClick={() => {
                    labAudio.playClick(680);
                    setExperimentState((prev) => {
                      const nextClosed = !prev.circuit.switchClosed;
                      return {
                        ...prev,
                        circuit: {
                          ...prev.circuit,
                          switchClosed: nextClosed,
                          currentA: nextClosed
                            ? prev.circuit.voltageV / prev.circuit.resistanceOhm
                            : 0,
                        },
                      };
                    });
                  }}
                  className="rounded-lg bg-[#6F4E37] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#5A3E2B] whitespace-nowrap cursor-pointer"
                >
                  {experimentState.circuit.switchClosed
                    ? "Open Switch"
                    : "Close Switch"}
                </button>
              </div>
            </div>
          ) : null}

          {/* 05: Electrolysis Controls */}
          {activeStation === "electrolysis" ? (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4 flex-1">
                <label className="space-y-1 text-xs min-w-[180px] flex-1">
                  <div className="flex justify-between">
                    <span className="font-medium text-[#231B16]">
                      Cell Voltage
                    </span>
                    <span className="font-mono tabular-nums text-[#6F4E37]">
                      {experimentState.electrolysis.voltageV.toFixed(1)} V
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={12}
                    step={1}
                    value={experimentState.electrolysis.voltageV}
                    onChange={(e) => {
                      const voltageV = Number(e.target.value);
                      setExperimentState((prev) => ({
                        ...prev,
                        electrolysis: { ...prev.electrolysis, voltageV },
                      }));
                    }}
                    className="w-full accent-[#6F4E37]"
                  />
                </label>

                <div className="rounded-lg border border-[#E5E4E2] bg-white px-3 py-1.5 text-xs font-mono tabular-nums text-[#231B16]">
                  H₂: {experimentState.electrolysis.h2VolumeMl.toFixed(1)} mL · O₂:{" "}
                  {experimentState.electrolysis.o2VolumeMl.toFixed(1)} mL
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    labAudio.playClick(600);
                    setExperimentState((prev) => ({
                      ...prev,
                      electrolysis: {
                        ...prev.electrolysis,
                        powerOn: !prev.electrolysis.powerOn,
                      },
                    }));
                  }}
                  className="rounded-lg bg-[#6F4E37] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#5A3E2B] whitespace-nowrap cursor-pointer"
                >
                  {experimentState.electrolysis.powerOn
                    ? "Power Off"
                    : "Power On"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    labAudio.playClick(440);
                    setExperimentState((prev) => ({
                      ...prev,
                      electrolysis: {
                        ...prev.electrolysis,
                        h2VolumeMl: 0,
                        o2VolumeMl: 0,
                      },
                    }));
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#E5E4E2] bg-white px-3 py-2 text-xs font-medium text-[#231B16] hover:bg-[#F4F1EC] cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          ) : null}

          {/* 06: Photosynthesis Controls */}
          {activeStation === "photosynthesis" ? (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                <label className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="font-medium text-[#231B16]">
                      Light Intensity
                    </span>
                    <span className="font-mono tabular-nums text-[#6F4E37]">
                      {experimentState.photosynthesis.lightIntensityPct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={experimentState.photosynthesis.lightIntensityPct}
                    onChange={(e) => {
                      const lightIntensityPct = Number(e.target.value);
                      setExperimentState((prev) => ({
                        ...prev,
                        photosynthesis: {
                          ...prev.photosynthesis,
                          lightIntensityPct,
                          bubblesPerMin: calculatePhotosynthesisRate(
                            prev.photosynthesis.lampOn,
                            lightIntensityPct,
                            prev.photosynthesis.co2LevelGl,
                          ),
                        },
                      }));
                    }}
                    className="w-full accent-[#6F4E37]"
                  />
                </label>

                <label className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="font-medium text-[#231B16]">
                      Dissolved CO₂
                    </span>
                    <span className="font-mono tabular-nums text-[#6F4E37]">
                      {experimentState.photosynthesis.co2LevelGl.toFixed(1)} g/L
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.2}
                    max={2.0}
                    step={0.1}
                    value={experimentState.photosynthesis.co2LevelGl}
                    onChange={(e) => {
                      const co2LevelGl = Number(e.target.value);
                      setExperimentState((prev) => ({
                        ...prev,
                        photosynthesis: {
                          ...prev.photosynthesis,
                          co2LevelGl,
                          bubblesPerMin: calculatePhotosynthesisRate(
                            prev.photosynthesis.lampOn,
                            prev.photosynthesis.lightIntensityPct,
                            co2LevelGl,
                          ),
                        },
                      }));
                    }}
                    className="w-full accent-[#6F4E37]"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div className="rounded-lg border border-[#E5E4E2] bg-white px-3 py-1.5 text-xs font-mono tabular-nums text-[#231B16]">
                  {experimentState.photosynthesis.bubblesPerMin} O₂/min
                </div>
                <button
                  type="button"
                  onClick={() => {
                    labAudio.playClick(580);
                    setExperimentState((prev) => {
                      const lampOn = !prev.photosynthesis.lampOn;
                      return {
                        ...prev,
                        photosynthesis: {
                          ...prev.photosynthesis,
                          lampOn,
                          bubblesPerMin: calculatePhotosynthesisRate(
                            lampOn,
                            prev.photosynthesis.lightIntensityPct,
                            prev.photosynthesis.co2LevelGl,
                          ),
                        },
                      };
                    });
                  }}
                  className="rounded-lg bg-[#6F4E37] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#5A3E2B] whitespace-nowrap cursor-pointer"
                >
                  {experimentState.photosynthesis.lampOn
                    ? "Lamp Off"
                    : "Lamp On"}
                </button>
              </div>
            </div>
          ) : null}

          {/* 07: Microscope Controls */}
          {activeStation === "microscope" ? (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <div className="inline-flex items-center gap-1 rounded-lg border border-[#E5E4E2] bg-white p-1">
                  {([4, 10, 40] as const).map((mag) => {
                    const active = experimentState.microscope.magnification === mag;
                    return (
                      <button
                        key={mag}
                        type="button"
                        onClick={() => {
                          labAudio.playClick(540);
                          setExperimentState((prev) => ({
                            ...prev,
                            microscope: {
                              ...prev.microscope,
                              magnification: mag,
                            },
                          }));
                        }}
                        className={[
                          "px-2.5 py-1 rounded text-xs font-mono cursor-pointer",
                          active
                            ? "bg-[#6F4E37] text-white"
                            : "text-[#5C5149] hover:bg-[#F4F1EC]",
                        ].join(" ")}
                      >
                        {mag}x
                      </button>
                    );
                  })}
                </div>

                <div className="inline-flex items-center gap-1 rounded-lg border border-[#E5E4E2] bg-white p-1">
                  {(
                    [
                      { id: "onion", label: "Onion" },
                      { id: "stomata", label: "Stomata" },
                      { id: "cheek", label: "Cheek" },
                    ] as const
                  ).map((spec) => {
                    const active = experimentState.microscope.specimen === spec.id;
                    return (
                      <button
                        key={spec.id}
                        type="button"
                        onClick={() => {
                          labAudio.playClick(520);
                          setExperimentState((prev) => ({
                            ...prev,
                            microscope: {
                              ...prev.microscope,
                              specimen: spec.id as MicroscopeSpecimen,
                            },
                          }));
                        }}
                        className={[
                          "px-2 py-1 rounded text-xs cursor-pointer",
                          active
                            ? "bg-[#E6E0F0] text-[#42335C] font-medium"
                            : "text-[#5C5149] hover:bg-[#F4F1EC]",
                        ].join(" ")}
                      >
                        {spec.label}
                      </button>
                    );
                  })}
                </div>

                <label className="space-y-1 text-xs min-w-[160px] flex-1">
                  <div className="flex justify-between">
                    <span className="font-medium text-[#231B16]">
                      Fine Focus
                    </span>
                    <span className="font-mono tabular-nums text-[#6F4E37]">
                      {experimentState.microscope.focusValue} (50 = Sharp)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={experimentState.microscope.focusValue}
                    onChange={(e) => {
                      const focusValue = Number(e.target.value);
                      setExperimentState((prev) => ({
                        ...prev,
                        microscope: { ...prev.microscope, focusValue },
                      }));
                    }}
                    className="w-full accent-[#6F4E37]"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={() => {
                  labAudio.playClick(560);
                  setExperimentState((prev) => ({
                    ...prev,
                    microscope: {
                      ...prev.microscope,
                      illuminatorOn: !prev.microscope.illuminatorOn,
                    },
                  }));
                }}
                className="rounded-lg bg-[#6F4E37] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#5A3E2B] whitespace-nowrap cursor-pointer shrink-0"
              >
                {experimentState.microscope.illuminatorOn
                  ? "Stage Lamp Off"
                  : "Stage Lamp On"}
              </button>
            </div>
          ) : null}

          {/* 08: Projectile Motion Controls */}
          {activeStation === "projectile" ? (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                <label className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="font-medium text-[#231B16]">
                      Launch Angle (θ)
                    </span>
                    <span className="font-mono tabular-nums text-[#6F4E37]">
                      {experimentState.projectile.angleDeg}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={75}
                    step={1}
                    value={experimentState.projectile.angleDeg}
                    onChange={(e) => {
                      const angleDeg = Number(e.target.value);
                      setExperimentState((prev) => ({
                        ...prev,
                        projectile: {
                          ...prev.projectile,
                          angleDeg,
                          rangeM: calculateProjectileRange(
                            angleDeg,
                            prev.projectile.speedMs,
                          ),
                        },
                      }));
                    }}
                    className="w-full accent-[#6F4E37]"
                  />
                </label>

                <label className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="font-medium text-[#231B16]">
                      Launch Speed (v₀)
                    </span>
                    <span className="font-mono tabular-nums text-[#6F4E37]">
                      {experimentState.projectile.speedMs.toFixed(1)} m/s
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2.0}
                    max={5.0}
                    step={0.1}
                    value={experimentState.projectile.speedMs}
                    onChange={(e) => {
                      const speedMs = Number(e.target.value);
                      setExperimentState((prev) => ({
                        ...prev,
                        projectile: {
                          ...prev.projectile,
                          speedMs,
                          rangeM: calculateProjectileRange(
                            prev.projectile.angleDeg,
                            speedMs,
                          ),
                        },
                      }));
                    }}
                    className="w-full accent-[#6F4E37]"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <div className="rounded-lg border border-[#E5E4E2] bg-white px-3 py-1.5 text-xs font-mono tabular-nums text-[#231B16]">
                  R = {experimentState.projectile.rangeM.toFixed(2)} m
                  {experimentState.projectile.lastLandedRangeM !== null
                    ? ` · Hit ${experimentState.projectile.lastLandedRangeM.toFixed(2)} m`
                    : ""}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    labAudio.playClick(720);
                    setExperimentState((prev) => ({
                      ...prev,
                      projectile: {
                        ...prev.projectile,
                        launchPulse: prev.projectile.launchPulse + 1,
                      },
                    }));
                  }}
                  className="rounded-lg bg-[#6F4E37] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#5A3E2B] whitespace-nowrap cursor-pointer"
                >
                  Fire Projectile
                </button>
              </div>
            </div>
          ) : null}

          {/* 09: Boyle's Law Controls */}
          {activeStation === "boyles" ? (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <label className="space-y-1 text-xs flex-1">
                <div className="flex justify-between">
                  <span className="font-medium text-[#231B16]">
                    Syringe Chamber Volume (V)
                  </span>
                  <span className="font-mono tabular-nums text-[#6F4E37]">
                    {experimentState.boyles.volumeMl.toFixed(1)} mL
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={50}
                  step={1}
                  value={experimentState.boyles.volumeMl}
                  onChange={(e) => {
                    const volumeMl = Number(e.target.value);
                    setExperimentState((prev) => ({
                      ...prev,
                      boyles: {
                        volumeMl,
                        pressureKpa: calculateBoylesPressure(volumeMl),
                      },
                    }));
                  }}
                  className="w-full accent-[#6F4E37]"
                />
              </label>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div className="rounded-lg border border-[#DCD3EB] bg-[#F3EFF9] px-3 py-1.5 text-xs font-mono tabular-nums text-[#42335C] font-medium">
                  P = {experimentState.boyles.pressureKpa.toFixed(1)} kPa · P×V ={" "}
                  {Math.round(
                    experimentState.boyles.pressureKpa *
                      experimentState.boyles.volumeMl,
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    labAudio.playClick(460);
                    setExperimentState((prev) => ({
                      ...prev,
                      boyles: {
                        volumeMl: 40,
                        pressureKpa: calculateBoylesPressure(40),
                      },
                    }));
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#E5E4E2] bg-white px-3 py-2 text-xs font-medium text-[#231B16] hover:bg-[#F4F1EC] cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Reset 40 mL</span>
                </button>
              </div>
            </div>
          ) : null}

          {/* 10: Standing Wave Controls */}
          {activeStation === "wave" ? (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                <label className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="font-medium text-[#231B16]">
                      Oscillator Frequency (f)
                    </span>
                    <span className="font-mono tabular-nums text-[#6F4E37]">
                      {experimentState.wave.frequencyHz} Hz
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={90}
                    step={2}
                    value={experimentState.wave.frequencyHz}
                    onChange={(e) => {
                      const frequencyHz = Number(e.target.value);
                      setExperimentState((prev) => ({
                        ...prev,
                        wave: {
                          ...prev.wave,
                          frequencyHz,
                          harmonicNumber: calculateWaveHarmonic(
                            frequencyHz,
                            prev.wave.tensionN,
                          ),
                        },
                      }));
                    }}
                    className="w-full accent-[#6F4E37]"
                  />
                </label>

                <label className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="font-medium text-[#231B16]">
                      String Tension (T)
                    </span>
                    <span className="font-mono tabular-nums text-[#6F4E37]">
                      {experimentState.wave.tensionN} N
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={40}
                    step={1}
                    value={experimentState.wave.tensionN}
                    onChange={(e) => {
                      const tensionN = Number(e.target.value);
                      setExperimentState((prev) => ({
                        ...prev,
                        wave: {
                          ...prev.wave,
                          tensionN,
                          harmonicNumber: calculateWaveHarmonic(
                            prev.wave.frequencyHz,
                            tensionN,
                          ),
                        },
                      }));
                    }}
                    className="w-full accent-[#6F4E37]"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div className="rounded-lg border border-[#E5E4E2] bg-white px-3 py-1.5 text-xs font-mono tabular-nums text-[#231B16]">
                  Harmonic n = {experimentState.wave.harmonicNumber.toFixed(2)}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    labAudio.playClick(610);
                    setExperimentState((prev) => ({
                      ...prev,
                      wave: { ...prev.wave, running: !prev.wave.running },
                    }));
                  }}
                  className="rounded-lg bg-[#6F4E37] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#5A3E2B] whitespace-nowrap cursor-pointer"
                >
                  {experimentState.wave.running ? "Stop Wave" : "Start Wave"}
                </button>
              </div>
            </div>
          ) : null}

          {/* 11: DNA Double Helix Pairing Controls */}
          {activeStation === "dna" ? (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                {experimentState.dna.templateStrand.map((tmpl, idx) => {
                  const current = experimentState.dna.pairedStrand[idx];
                  const isMatch = current === getComplementaryBase(tmpl);
                  const order: DnaBase[] = ["A", "T", "C", "G"];
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        labAudio.playClick(isMatch ? 700 : 540);
                        setExperimentState((prev) => {
                          const prevVal = prev.dna.pairedStrand[idx];
                          const nextVal =
                            prevVal === null
                              ? "A"
                              : order[(order.indexOf(prevVal) + 1) % order.length];
                          const nextPaired = [...prev.dna.pairedStrand];
                          nextPaired[idx] = nextVal;
                          return {
                            ...prev,
                            dna: { ...prev.dna, pairedStrand: nextPaired },
                          };
                        });
                      }}
                      className={[
                        "rounded-lg border px-2.5 py-1.5 text-xs font-mono cursor-pointer transition-colors",
                        isMatch
                          ? "border-[#2D6A4F] bg-[#ECF5F0] text-[#2D6A4F]"
                          : "border-[#E5E4E2] bg-white text-[#231B16] hover:bg-[#F3EFF9]",
                      ].join(" ")}
                    >
                      {tmpl} ↔ {current ?? "?"}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div className="rounded-lg border border-[#E5E4E2] bg-white px-3 py-1.5 text-xs font-mono tabular-nums text-[#231B16]">
                  {evaluateDnaMatches(
                    experimentState.dna.templateStrand,
                    experimentState.dna.pairedStrand,
                  )}
                  /6 Paired
                </div>
                <button
                  type="button"
                  onClick={() => {
                    labAudio.playClick(620);
                    setExperimentState((prev) => ({
                      ...prev,
                      dna: { ...prev.dna, rotating: !prev.dna.rotating },
                    }));
                  }}
                  className="rounded-lg bg-[#6F4E37] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#5A3E2B] whitespace-nowrap cursor-pointer"
                >
                  {experimentState.dna.rotating ? "Pause Spin" : "Spin Helix"}
                </button>
              </div>
            </div>
          ) : null}

          {/* 12: Trigonometric Unit Circle Controls */}
          {activeStation === "trig" ? (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <label className="space-y-1 text-xs flex-1">
                <div className="flex justify-between">
                  <span className="font-medium text-[#231B16]">
                    Phasor Angle (θ)
                  </span>
                  <span className="font-mono tabular-nums text-[#6F4E37]">
                    {experimentState.trig.angleDeg}° ({(trigRad / Math.PI).toFixed(2)}π rad)
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={1}
                  value={experimentState.trig.angleDeg}
                  onChange={(e) => {
                    const angleDeg = Number(e.target.value);
                    setExperimentState((prev) => ({
                      ...prev,
                      trig: { ...prev.trig, sweeping: false, angleDeg },
                    }));
                  }}
                  className="w-full accent-[#6F4E37]"
                />
              </label>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div className="rounded-lg border border-[#E5E4E2] bg-white px-3 py-1.5 text-xs font-mono tabular-nums text-[#231B16]">
                  cos={trigCos.toFixed(3)} · sin={trigSin.toFixed(3)}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    labAudio.playClick(600);
                    setExperimentState((prev) => ({
                      ...prev,
                      trig: { ...prev.trig, sweeping: !prev.trig.sweeping },
                    }));
                  }}
                  className="rounded-lg bg-[#6F4E37] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#5A3E2B] whitespace-nowrap cursor-pointer"
                >
                  {experimentState.trig.sweeping ? "Stop Sweep" : "Auto-Sweep"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
