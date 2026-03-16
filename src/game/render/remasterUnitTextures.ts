import * as Phaser from "phaser";
import {
  REMASTER_DIRECTIONS,
  REMASTER_FRAME_SIZE,
  REMASTER_UNIT_PACKS,
  type DirectionKey,
  type FrameFamily,
  type UnitState,
  type WeaponKind,
} from "@/game/render/remasterTextureCatalog";

type FrameSpec = {
  family: FrameFamily;
  direction: DirectionKey;
  frame: number;
  state: UnitState;
  primary: number;
  secondary: number;
  tertiary: number;
  accent: number;
  weapon?: WeaponKind;
};

export function registerRemasterUnitTextures(scene: Phaser.Scene) {
  REMASTER_UNIT_PACKS.forEach((pack) => {
    REMASTER_DIRECTIONS.forEach((direction) => {
      [0, 1].forEach((frame) =>
        createFrame(scene, `${pack.base}_idle_${direction}_${frame}`, {
          ...pack,
          direction,
          frame,
          state: "idle",
        }),
      );
      [0, 1, 2, 3].forEach((frame) =>
        createFrame(scene, `${pack.base}_walk_${direction}_${frame}`, {
          ...pack,
          direction,
          frame,
          state: "walk",
        }),
      );
      [0, 1, 2, 3].forEach((frame) =>
        createFrame(scene, `${pack.base}_attack_${direction}_${frame}`, {
          ...pack,
          direction,
          frame,
          state: "attack",
        }),
      );
    });
  });
}

function createFrame(scene: Phaser.Scene, key: string, spec: FrameSpec) {
  if (scene.textures.exists(key)) {
    return;
  }

  const texture = scene.textures.createCanvas(
    key,
    REMASTER_FRAME_SIZE,
    REMASTER_FRAME_SIZE,
  );
  if (!texture) {
    return;
  }
  const ctx = texture.context;
  ctx.clearRect(0, 0, REMASTER_FRAME_SIZE, REMASTER_FRAME_SIZE);

  const dir = directionVector(spec.direction);
  const bob =
    spec.state === "walk"
      ? [0, 4, 1, 3][spec.frame % 4]
      : spec.state === "attack"
        ? [-3, -7, 1, -1][spec.frame % 4]
        : [0, -1][spec.frame % 2];
  const stride =
    spec.state === "walk"
      ? [-6, 6, -3, 3][spec.frame % 4]
      : spec.state === "attack"
        ? [0, 3, 7, 2][spec.frame % 4]
        : 0;
  const swing = spec.state === "attack" ? [0, 10, 18, 8][spec.frame % 4] : 0;
  const centerX = REMASTER_FRAME_SIZE / 2;
  const centerY = 58 + bob;

  if (spec.family === "humanoid") {
    drawHumanoid(ctx, spec, centerX, centerY, dir, stride, swing);
  } else if (spec.family === "slime") {
    drawSlime(ctx, spec, centerX, centerY, dir, stride, swing);
  } else {
    drawBeast(ctx, spec, centerX, centerY, dir, stride, swing);
  }

  texture.refresh();
}

function drawHumanoid(
  ctx: CanvasRenderingContext2D,
  spec: FrameSpec,
  x: number,
  y: number,
  dir: { x: number; y: number },
  stride: number,
  swing: number,
) {
  ellipse(ctx, x, y + 36, 54, 16, color(0x04080d, 0.34));

  const cloak = ctx.createLinearGradient(x, y - 34, x, y + 28);
  cloak.addColorStop(0, color(lighten(spec.secondary, 18), 0.95));
  cloak.addColorStop(1, color(darken(spec.secondary, 22), 0.94));
  triangle(
    ctx,
    x - 24,
    y + 26,
    x,
    y - 28,
    x + 24,
    y + 26,
    cloak,
  );

  const torso = ctx.createLinearGradient(x, y - 16, x, y + 28);
  torso.addColorStop(0, color(lighten(spec.primary, 18)));
  torso.addColorStop(1, color(darken(spec.primary, 18)));
  roundRect(ctx, x - 18, y - 10, 36, 34, 12, torso);
  roundRect(ctx, x - 16, y + 7, 32, 10, 5, color(spec.primary, 0.26));
  roundRect(ctx, x - 17, y + 7, 34, 4, 4, color(0xffffff, 0.08));

  roundRect(
    ctx,
    x - 26 - dir.x * 4,
    y + 2,
    8,
    21,
    4,
    color(spec.tertiary),
  );
  roundRect(
    ctx,
    x + 18 + dir.x * 4,
    y + 2,
    8,
    21,
    4,
    color(spec.tertiary),
  );
  roundRect(
    ctx,
    x - 26 - dir.x * 4,
    y + 14,
    8,
    9,
    4,
    color(0x000000, 0.12),
  );
  roundRect(
    ctx,
    x + 18 + dir.x * 4,
    y + 14,
    8,
    9,
    4,
    color(0x000000, 0.12),
  );

  const head = ctx.createRadialGradient(x - 5, y - 29, 3, x, y - 22, 18);
  head.addColorStop(0, color(lighten(spec.tertiary, 12)));
  head.addColorStop(1, color(darken(spec.tertiary, 8)));
  circle(ctx, x, y - 24, 13, head);
  ellipse(ctx, x - 3, y - 27, 16, 7, color(0xffffff, 0.18));
  circle(ctx, x - 5 + dir.x * 1.5, y - 25, 1.8, color(0x111111, 0.5));
  circle(ctx, x + 5 + dir.x * 1.5, y - 25, 1.8, color(0x111111, 0.5));

  roundRect(ctx, x - 13 + stride, y + 23, 8, 22, 4, color(spec.accent));
  roundRect(ctx, x + 5 - stride, y + 23, 8, 22, 4, color(spec.accent));
  roundRect(
    ctx,
    x - 13 + stride,
    y + 36,
    8,
    9,
    4,
    color(0x000000, 0.14),
  );
  roundRect(
    ctx,
    x + 5 - stride,
    y + 36,
    8,
    9,
    4,
    color(0x000000, 0.14),
  );

  drawWeapon(ctx, spec.weapon ?? "none", x, y, dir, swing, spec.accent);
  strokeRoundRect(ctx, x - 18, y - 10, 36, 34, 12, color(0xffffff, 0.08), 1.5);
}

function drawSlime(
  ctx: CanvasRenderingContext2D,
  spec: FrameSpec,
  x: number,
  y: number,
  dir: { x: number; y: number },
  stride: number,
  swing: number,
) {
  const width = 46 + stride * 2 + swing * 0.6;
  const height = 38 + (spec.state === "attack" ? 8 : 0);
  ellipse(ctx, x, y + 31, width + 16, 12, color(0x081015, 0.26));

  const body = ctx.createLinearGradient(x, y - 12, x, y + 40);
  body.addColorStop(0, color(lighten(spec.primary, 22)));
  body.addColorStop(0.45, color(spec.primary));
  body.addColorStop(1, color(darken(spec.primary, 18)));
  ellipse(ctx, x, y + 10, width + 20, height + 18, body);
  ellipse(ctx, x, y + 18, width, height, color(spec.secondary, 0.95));
  ellipse(ctx, x - 10, y + 0, 24, 10, color(0xffffff, 0.15));
  ellipse(ctx, x, y + 22, width + 10, height * 0.72, color(spec.primary, 0.2));
  circle(ctx, x - 10 + dir.x * 2, y + 4, 4.3, color(spec.tertiary));
  circle(ctx, x + 10 + dir.x * 2, y + 4, 4.3, color(spec.tertiary));
  circle(ctx, x - 10 + dir.x * 2, y + 4, 2, color(spec.accent));
  circle(ctx, x + 10 + dir.x * 2, y + 4, 2, color(spec.accent));
}

function drawBeast(
  ctx: CanvasRenderingContext2D,
  spec: FrameSpec,
  x: number,
  y: number,
  dir: { x: number; y: number },
  stride: number,
  swing: number,
) {
  switch (spec.family) {
    case "spider":
      ellipse(ctx, x, y + 31, 48, 12, color(0x05080d, 0.28));
      strokeLine(ctx, x - 4, y + 10, x - 30, y - 8 + stride, color(spec.accent), 3);
      strokeLine(ctx, x - 2, y + 14, x - 22, y + 30 - stride, color(spec.accent), 3);
      strokeLine(ctx, x + 4, y + 10, x + 30, y - 8 + stride, color(spec.accent), 3);
      strokeLine(ctx, x + 2, y + 14, x + 22, y + 30 - stride, color(spec.accent), 3);
      strokeLine(ctx, x - 6, y + 8, x - 40, y + 4, color(spec.accent), 2.5);
      strokeLine(ctx, x + 6, y + 8, x + 40, y + 4, color(spec.accent), 2.5);
      ellipse(ctx, x, y + 8, 36, 26, color(spec.primary));
      ellipse(ctx, x, y + 3, 16, 10, color(spec.secondary, 0.5));
      ellipse(ctx, x - 5, y + 0, 14, 4, color(0xffffff, 0.1));
      break;
    case "wolf":
      ellipse(ctx, x - dir.x * 3, y + 34, 52, 12, color(0x071015, 0.26));
      ellipse(ctx, x - dir.x * 4, y + 16, 50, 24, color(spec.primary));
      triangle(
        ctx,
        x + 18 + dir.x * 6,
        y + 4,
        x + 32 + dir.x * 5,
        y - 8,
        x + 24 + dir.x * 2,
        y + 18,
        color(spec.secondary),
      );
      ellipse(ctx, x - 8, y + 12, 18, 6, color(0xffffff, 0.16));
      roundRect(ctx, x - 19 + stride, y + 20, 6, 18, 3, color(spec.primary));
      roundRect(ctx, x + 8 - stride, y + 20, 6, 18, 3, color(spec.primary));
      triangle(
        ctx,
        x - 24 - dir.x * 5,
        y + 10,
        x - 40 - dir.x * 9,
        y + 3,
        x - 28 - dir.x * 7,
        y + 17,
        color(spec.accent),
      );
      break;
    case "orc":
      ellipse(ctx, x, y + 31, 48, 12, color(0x05080d, 0.24));
      roundRect(ctx, x - 18, y - 2, 36, 28, 10, color(spec.primary));
      ellipse(ctx, x, y + 19, 40, 22, color(spec.secondary));
      circle(ctx, x - 8 + dir.x * 2, y + 4, 3, color(spec.secondary));
      circle(ctx, x + 8 + dir.x * 2, y + 4, 3, color(spec.secondary));
      roundRect(ctx, x - 10 + swing / 2, y + 18, 6, 5, 2, color(0xe8e4cd));
      roundRect(ctx, x + 4 + swing / 2, y + 18, 6, 5, 2, color(0xe8e4cd));
      roundRect(ctx, x - 12, y + 4, 24, 4, 2, color(0xffffff, 0.1));
      break;
    case "boar":
      ellipse(ctx, x, y + 31, 50, 12, color(0x07090c, 0.24));
      ellipse(ctx, x - 4, y + 17, 48, 24, color(spec.primary));
      ellipse(ctx, x + 22 + dir.x * 3, y + 16, 25, 16, color(spec.secondary));
      roundRect(ctx, x + 26 + dir.x * 3, y + 14, 8, 3, 2, color(0xf3dfc5));
      roundRect(ctx, x + 26 + dir.x * 3, y + 18, 8, 3, 2, color(0xf3dfc5));
      ellipse(ctx, x + 4, y + 11, 16, 6, color(0xffffff, 0.14));
      triangle(ctx, x - 18, y + 5, x - 24, y - 8, x - 10, y - 2, color(darken(spec.primary, 18)));
      break;
    case "wisp":
      circle(ctx, x, y + 4, 34 + swing * 0.5, color(spec.secondary, 0.12));
      circle(ctx, x, y, 20 + swing * 0.25, color(spec.primary, 0.9));
      circle(ctx, x, y, 31 + swing * 0.35, color(spec.secondary, 0.45));
      triangle(ctx, x - 9, y + 16, x + 9, y + 16, x, y + 40, color(spec.primary, 0.58));
      circle(ctx, x - 5, y - 7, 6, color(0xffffff, 0.32));
      break;
    case "dragon":
      ellipse(ctx, x, y + 31, 58, 13, color(0x08090e, 0.28));
      ellipse(ctx, x - 2, y + 14, 52, 28, color(spec.primary));
      triangle(ctx, x - 12, y + 0, x - 28, y - 18, x - 2, y + 6, color(spec.secondary));
      triangle(ctx, x + 14, y + 0, x + 30, y - 18, x + 2, y + 6, color(spec.secondary));
      triangle(
        ctx,
        x + 22 + dir.x * 4,
        y + 8,
        x + 36 + dir.x * 6,
        y + 16,
        x + 22 + dir.x * 4,
        y + 24,
        color(0xffb08e),
      );
      ellipse(ctx, x - 8, y + 7, 18, 6, color(0xffffff, 0.1));
      break;
    case "golem":
      ellipse(ctx, x, y + 31, 52, 12, color(0x05080d, 0.28));
      roundRect(ctx, x - 20, y - 2, 40, 30, 10, color(spec.primary));
      circle(ctx, x - 7, y + 6, 3.2, color(spec.secondary));
      circle(ctx, x + 7, y + 6, 3.2, color(spec.secondary));
      roundRect(ctx, x - 27, y + 8, 10, 20, 4, color(spec.primary));
      roundRect(ctx, x + 17, y + 8, 10, 20, 4, color(spec.primary));
      roundRect(ctx, x - 14, y + 3, 20, 6, 3, color(0xffffff, 0.08));
      break;
    case "skeleton":
      ellipse(ctx, x, y + 33, 42, 11, color(0x06080b, 0.2));
      circle(ctx, x, y - 3, 13, color(spec.primary));
      roundRect(ctx, x - 12, y + 10, 24, 22, 6, color(spec.primary));
      roundRect(ctx, x - 18, y + 10, 5, 20, 2, color(spec.primary));
      roundRect(ctx, x + 13, y + 10, 5, 20, 2, color(spec.primary));
      roundRect(ctx, x - 7 + stride, y + 31, 4, 18, 2, color(spec.primary));
      roundRect(ctx, x + 3 - stride, y + 31, 4, 18, 2, color(spec.primary));
      roundRect(ctx, x + 16 + dir.x * 3, y + 5, 16, 4, 2, color(spec.secondary));
      triangle(
        ctx,
        x + 32 + dir.x * 3,
        y + 7,
        x + 24 + dir.x * 3,
        y + 1,
        x + 24 + dir.x * 3,
        y + 13,
        color(0x603d21),
      );
      circle(ctx, x - 5, y - 5, 2.2, color(spec.accent));
      circle(ctx, x + 5, y - 5, 2.2, color(spec.accent));
      roundRect(ctx, x - 6, y + 17, 12, 3, 2, color(spec.accent, 0.2));
      break;
  }
}

function drawWeapon(
  ctx: CanvasRenderingContext2D,
  weapon: WeaponKind,
  x: number,
  y: number,
  dir: { x: number; y: number },
  swing: number,
  accent: number,
) {
  if (weapon === "none") {
    return;
  }

  if (weapon === "blade") {
    roundRect(ctx, x + 13 + dir.x * 5, y - 2 - swing, 5, 14, 2, color(0xc79a4e));
    triangle(
      ctx,
      x + 18 + dir.x * 5,
      y - 18 - swing,
      x + 38 + dir.x * 7,
      y - 9 - swing,
      x + 18 + dir.x * 5,
      y - 1 - swing,
      color(0xe2ebf0),
    );
    roundRect(ctx, x + 11 + dir.x * 5, y - 3 - swing, 10, 5, 2, color(accent));
  } else if (weapon === "bow") {
    strokeEllipse(ctx, x + 24 + dir.x * 4, y + 3, 16, 34, color(0x7a4c1d), 3);
    strokeLine(ctx, x + 24 + dir.x * 4, y - 14, x + 24 + dir.x * 4, y + 20, color(0xdac9ab, 0.9), 1.6);
  } else if (weapon === "staff") {
    roundRect(ctx, x + 18 + dir.x * 4, y - 16, 4, 34, 2, color(0x7a4c1d));
    circle(ctx, x + 20 + dir.x * 4, y - 20, 9, color(0x8cc7ff, 0.22));
    circle(ctx, x + 20 + dir.x * 4, y - 20, 4.5, color(0x8cc7ff));
  }
}

function directionVector(direction: DirectionKey) {
  const map: Record<DirectionKey, { x: number; y: number }> = {
    n: { x: 0, y: -1 },
    ne: { x: 1, y: -1 },
    e: { x: 1, y: 0 },
    se: { x: 1, y: 1 },
    s: { x: 0, y: 1 },
    sw: { x: -1, y: 1 },
    w: { x: -1, y: 0 },
    nw: { x: -1, y: -1 },
  };
  return map[direction];
}

function color(value: number, alpha = 1) {
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function lighten(value: number, amount: number) {
  const r = Math.min(255, ((value >> 16) & 255) + amount);
  const g = Math.min(255, ((value >> 8) & 255) + amount);
  const b = Math.min(255, (value & 255) + amount);
  return (r << 16) | (g << 8) | b;
}

function darken(value: number, amount: number) {
  const r = Math.max(0, ((value >> 16) & 255) - amount);
  const g = Math.max(0, ((value >> 8) & 255) - amount);
  const b = Math.max(0, (value & 255) - amount);
  return (r << 16) | (g << 8) | b;
}

function ellipse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string | CanvasGradient,
) {
  ctx.beginPath();
  ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function strokeEllipse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  stroke: string,
  lineWidth: number,
) {
  ctx.beginPath();
  ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function circle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  fill: string | CanvasGradient,
) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function triangle(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  fill: string | CanvasGradient,
) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string | CanvasGradient,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

function strokeRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  stroke: string,
  lineWidth: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function strokeLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  stroke: string,
  lineWidth: number,
) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.stroke();
}
