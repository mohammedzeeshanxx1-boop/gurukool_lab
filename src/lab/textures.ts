import * as THREE from "three";

export function createFloorTileTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.fillStyle = "#FAF8F5";
    ctx.fillRect(0, 0, 512, 512);

    // Subtle stone/terrazzo warmth
    ctx.fillStyle = "#F2EFE9";
    ctx.fillRect(4, 4, 248, 248);
    ctx.fillRect(260, 260, 248, 248);

    // Platinum grout lines
    ctx.strokeStyle = "#DEDCD8";
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, 512, 512);
    ctx.beginPath();
    ctx.moveTo(256, 0);
    ctx.lineTo(256, 512);
    ctx.moveTo(0, 256);
    ctx.lineTo(512, 256);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(9, 9);
  texture.anisotropy = maxAnisotropy;
  return texture;
}

export function createWalnutWoodTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.fillStyle = "#6F4E37";
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 64; i++) {
      const y = (i / 64) * 512;
      ctx.strokeStyle = i % 2 === 0 ? "rgba(62, 41, 27, 0.24)" : "rgba(135, 98, 72, 0.16)";
      ctx.lineWidth = 3 + (i % 5);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(160, y + ((i % 3) - 1) * 8, 340, y - ((i % 4) - 1.5) * 6, 512, y);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = maxAnisotropy;
  return texture;
}

export function createScaleDialTexture(
  label: string,
  sublabel: string,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.fillStyle = "#FAF8F5";
    ctx.fillRect(0, 0, 512, 256);

    ctx.strokeStyle = "#6F4E37";
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, 492, 236);

    ctx.fillStyle = "#231B16";
    ctx.font = "600 34px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(label, 256, 108);

    ctx.fillStyle = "#5C5149";
    ctx.font = "500 22px monospace";
    ctx.fillText(sublabel, 256, 158);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  return texture;
}
