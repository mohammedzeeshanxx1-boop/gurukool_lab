import * as THREE from "three";
import {
  createFloorTileTexture,
  createWalnutWoodTexture,
} from "./textures";

export interface LabMaterialLibrary {
  floor: THREE.MeshStandardMaterial;
  wall: THREE.MeshStandardMaterial;
  ceiling: THREE.MeshStandardMaterial;
  walnutBench: THREE.MeshStandardMaterial;
  platinumMetal: THREE.MeshPhysicalMaterial;
  brassMetal: THREE.MeshPhysicalMaterial;
  darkIron: THREE.MeshStandardMaterial;
  copperWire: THREE.MeshStandardMaterial;
  opticalGlass: THREE.MeshPhysicalMaterial;
  lavenderAccent: THREE.MeshStandardMaterial;
  warmIvoryTrim: THREE.MeshStandardMaterial;
  textures: THREE.Texture[];
  dispose: () => void;
}

export function createLabMaterials(
  isSoftwareGl: boolean,
  maxAnisotropy: number,
): LabMaterialLibrary {
  const floorTex = createFloorTileTexture(maxAnisotropy);
  const walnutTex = createWalnutWoodTexture(maxAnisotropy);

  const floor = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: 0.72,
    metalness: 0.04,
  });

  const wall = new THREE.MeshStandardMaterial({
    color: 0xf5f2ec,
    roughness: 0.88,
    metalness: 0.02,
  });

  const ceiling = new THREE.MeshStandardMaterial({
    color: 0xfaf8f5,
    roughness: 0.9,
    metalness: 0.0,
  });

  const walnutBench = new THREE.MeshStandardMaterial({
    map: walnutTex,
    roughness: 0.45,
    metalness: 0.06,
  });

  const platinumMetal = new THREE.MeshPhysicalMaterial({
    color: 0xe5e4e2,
    roughness: 0.22,
    metalness: 0.92,
    anisotropy: isSoftwareGl ? 0 : 0.65,
  });

  const brassMetal = new THREE.MeshPhysicalMaterial({
    color: 0xc59b57,
    roughness: 0.2,
    metalness: 0.95,
    anisotropy: isSoftwareGl ? 0 : 0.7,
  });

  const darkIron = new THREE.MeshStandardMaterial({
    color: 0x2e2621,
    roughness: 0.52,
    metalness: 0.65,
  });

  const copperWire = new THREE.MeshStandardMaterial({
    color: 0xb86b35,
    roughness: 0.25,
    metalness: 0.9,
  });

  const opticalGlass = new THREE.MeshPhysicalMaterial({
    color: 0xf4f0fb,
    roughness: 0.06,
    metalness: 0.0,
    transmission: isSoftwareGl ? 0 : 0.92,
    transparent: true,
    opacity: isSoftwareGl ? 0.38 : 1.0,
    ior: 1.52,
    thickness: 0.4,
    clearcoat: 1.0,
    depthWrite: isSoftwareGl ? false : true,
  });

  const lavenderAccent = new THREE.MeshStandardMaterial({
    color: 0xe6e0f0,
    roughness: 0.48,
    metalness: 0.08,
  });

  const warmIvoryTrim = new THREE.MeshStandardMaterial({
    color: 0xfaf8f5,
    roughness: 0.62,
    metalness: 0.05,
  });

  const textures = [floorTex, walnutTex];
  const allMaterials = [
    floor,
    wall,
    ceiling,
    walnutBench,
    platinumMetal,
    brassMetal,
    darkIron,
    copperWire,
    opticalGlass,
    lavenderAccent,
    warmIvoryTrim,
  ];

  return {
    floor,
    wall,
    ceiling,
    walnutBench,
    platinumMetal,
    brassMetal,
    darkIron,
    copperWire,
    opticalGlass,
    lavenderAccent,
    warmIvoryTrim,
    textures,
    dispose: () => {
      allMaterials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
    },
  };
}
