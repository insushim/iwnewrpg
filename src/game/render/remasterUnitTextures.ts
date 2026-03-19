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

/**
 * Register textures in batches to avoid blocking the main thread.
 * Only generates the "s" (south) idle frame 0 immediately for each pack
 * so sprites can appear right away. The rest are generated lazily.
 */
export function registerRemasterUnitTextures(scene: Phaser.Scene) {
  // Phase 1: Generate only the essential south-facing idle frame for each pack
  REMASTER_UNIT_PACKS.forEach((pack) => {
    createFrame(scene, `${pack.base}_idle_s_0`, {
      ...pack,
      direction: "s",
      frame: 0,
      state: "idle",
    });
    createFrame(scene, `${pack.base}_idle_s_1`, {
      ...pack,
      direction: "s",
      frame: 1,
      state: "idle",
    });
  });

  // Phase 2: Generate remaining textures in batches via setTimeout
  const queue: Array<{ key: string; spec: FrameSpec }> = [];
  REMASTER_UNIT_PACKS.forEach((pack) => {
    REMASTER_DIRECTIONS.forEach((direction) => {
      [0, 1].forEach((frame) => {
        const key = `${pack.base}_idle_${direction}_${frame}`;
        if (!scene.textures.exists(key)) {
          queue.push({ key, spec: { ...pack, direction, frame, state: "idle" } });
        }
      });
      [0, 1, 2].forEach((frame) => {
        queue.push({
          key: `${pack.base}_walk_${direction}_${frame}`,
          spec: { ...pack, direction, frame, state: "walk" },
        });
      });
      [0, 1, 2, 3].forEach((frame) => {
        queue.push({
          key: `${pack.base}_attack_${direction}_${frame}`,
          spec: { ...pack, direction, frame, state: "attack" },
        });
      });
    });
  });

  // Process in batches of 40 per frame to avoid jank
  const BATCH_SIZE = 40;
  let offset = 0;
  const processBatch = () => {
    if (!scene.scene.isActive()) return;
    const end = Math.min(offset + BATCH_SIZE, queue.length);
    for (let i = offset; i < end; i++) {
      createFrame(scene, queue[i].key, queue[i].spec);
    }
    offset = end;
    if (offset < queue.length) {
      setTimeout(processBatch, 0);
    }
  };
  setTimeout(processBatch, 100);
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
  const isBowAttack = spec.weapon === "bow" && spec.state === "attack";
  const isStaffAttack = spec.weapon === "staff" && spec.state === "attack";

  const bob =
    spec.state === "walk"
      ? [0, 4, 1][spec.frame % 3]
      : isBowAttack
        ? [-1, -4, 0, -1][spec.frame % 4] // 활: 살짝 뒤로 당기는 자세
        : spec.state === "attack"
          ? [-3, -7, 1, -1][spec.frame % 4]
          : [0, -1][spec.frame % 2];
  const stride =
    spec.state === "walk"
      ? [-6, 6, -2][spec.frame % 3]
      : isBowAttack
        ? [0, -3, 2, 0][spec.frame % 4] // 활: 뒤로 체중이동 후 release
        : spec.state === "attack"
          ? [0, 3, 7, 2][spec.frame % 4]
          : 0;
  const swing = isBowAttack
    ? [0, -14, 8, 0][spec.frame % 4] // 음수=시위 당김, 양수=발사
    : isStaffAttack
      ? [0, 6, 14, 4][spec.frame % 4] // 지팡이: 앞으로 찌르는 동작
      : spec.state === "attack"
        ? [0, 10, 18, 8][spec.frame % 4]
        : 0;
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
  const isDagger = spec.weapon === "dagger";
  const isGreatsword = spec.weapon === "greatsword";
  const facingFront = dir.y > 0;
  const facingBack = dir.y < 0;
  const sideBias = Math.abs(dir.x);
  const diagonalBias = sideBias > 0 && dir.y !== 0;
  const shoulderWidth = facingFront ? 42 : facingBack ? 36 : sideBias ? 34 : 40;
  const cloakWidth =
    (isGreatsword ? 32 : isDagger ? 24 : 28) +
    (facingBack ? 6 : sideBias ? -2 : 0);
  const torsoY = (isGreatsword ? y - 14 : y - 12) + (facingBack ? 2 : 0);
  const torsoHeight =
    (isGreatsword ? 38 : 36) + (facingFront ? 2 : facingBack ? -2 : 0);
  const torsoInset = facingBack ? 2 : 0;
  const headY = y - 26 + (facingBack ? 1 : facingFront ? -1 : 0);
  const headRadius = facingBack ? 13 : 14;

  // Dynamic tilt for more dynamic poses
  const bodyTilt =
    spec.state === "attack" ? dir.x * 2 : spec.state === "walk" ? dir.x * 1 : 0;

  const leftArmX = isDagger
    ? x - 24 - dir.x * 4 - sideBias + bodyTilt
    : isGreatsword
      ? x - 32 - dir.x * 6 - sideBias + bodyTilt
      : x - 28 - dir.x * 5 - sideBias + bodyTilt;
  const rightArmX = isDagger
    ? x + 16 + dir.x * 4 + sideBias + bodyTilt
    : isGreatsword
      ? x + 24 + dir.x * 6 + sideBias + bodyTilt
      : x + 20 + dir.x * 5 + sideBias + bodyTilt;
  const armY = (isGreatsword ? y + 0 : y + 2) + (facingBack ? 1 : 0);
  const armHeight =
    (isDagger ? 20 : isGreatsword ? 26 : 22) + (facingFront ? 1 : 0);

  // Enhanced color gradients for more depth
  const frontArmTint = facingFront
    ? color(lighten(spec.tertiary, 12))
    : color(spec.tertiary);
  const backArmTint = facingBack
    ? color(darken(spec.tertiary, 14), 0.88)
    : color(spec.tertiary, 0.84);
  const frontLegTint = facingFront
    ? color(lighten(spec.accent, 12))
    : color(spec.accent);
  const backLegTint = facingBack
    ? color(darken(spec.accent, 12), 0.84)
    : color(spec.accent, 0.86);
  const frontShadowTint = color(0x000000, facingFront ? 0.12 : 0.16);
  const backShadowTint = color(0x000000, facingBack ? 0.22 : 0.14);

  const leftInFront = dir.x >= 0;
  const leftLegX =
    x - 14 + stride + (isDagger ? 1 : isGreatsword ? -2 : 0) + bodyTilt * 0.5;
  const rightLegX =
    x + 6 - stride + (isDagger ? -1 : isGreatsword ? 2 : 0) + bodyTilt * 0.5;
  const legHeight = isGreatsword ? 26 : 24;

  // Enhanced shadow with softer edges
  ellipse(ctx, x + bodyTilt * 0.3, y + 38, 58, 18, color(0x04080d, 0.28));
  ellipse(ctx, x + bodyTilt * 0.3, y + 39, 52, 14, color(0x04080d, 0.16));

  // Flowing cloak with wind effect
  const cloakFlow = spec.state === "walk" ? Math.sin(spec.frame * 0.8) * 3 : 0;
  const cloak = ctx.createLinearGradient(x, y - 36, x + cloakFlow, y + 30);
  cloak.addColorStop(0, color(lighten(spec.secondary, 22), 0.96));
  cloak.addColorStop(0.3, color(lighten(spec.secondary, 8), 0.94));
  cloak.addColorStop(0.7, color(darken(spec.secondary, 12), 0.92));
  cloak.addColorStop(1, color(darken(spec.secondary, 28), 0.94));

  // Cloak with flowing edges
  triangle(
    ctx,
    x - cloakWidth + cloakFlow,
    y + 30,
    x,
    y - (facingBack ? 32 : 30),
    x + cloakWidth - cloakFlow,
    y + 30,
    cloak,
  );
  // Cloak collar
  if (facingBack) {
    roundRect(ctx, x - 15, y - 18, 30, 10, 5, color(spec.secondary, 0.6));
    roundRect(
      ctx,
      x - 13,
      y - 16,
      26,
      6,
      3,
      color(lighten(spec.secondary, 10), 0.4),
    );
  }

  // Detailed armor torso with multiple layers
  const torso = ctx.createLinearGradient(
    x - shoulderWidth / 4,
    y - 18,
    x + shoulderWidth / 4,
    y + 30,
  );
  torso.addColorStop(0, color(lighten(spec.primary, 24)));
  torso.addColorStop(0.2, color(lighten(spec.primary, 12)));
  torso.addColorStop(0.5, color(spec.primary));
  torso.addColorStop(0.8, color(darken(spec.primary, 12)));
  torso.addColorStop(1, color(darken(spec.primary, 24)));

  roundRect(
    ctx,
    x - shoulderWidth / 2 + bodyTilt,
    torsoY,
    shoulderWidth,
    torsoHeight,
    14,
    torso,
  );

  // Chest plate details
  roundRect(
    ctx,
    x - (shoulderWidth / 2 - torsoInset - 2) + bodyTilt,
    y + 5,
    shoulderWidth - torsoInset * 2 - 4,
    12,
    6,
    color(spec.primary, facingBack ? 0.22 : 0.32),
  );
  roundRect(
    ctx,
    x - shoulderWidth / 2 + 2 + bodyTilt,
    y + 6,
    shoulderWidth - 4,
    6,
    5,
    color(0xffffff, facingBack ? 0.06 : 0.12),
  );

  // Shoulder pads with metallic shine
  const shoulderGrad = ctx.createLinearGradient(
    x - shoulderWidth / 2,
    y - 10,
    x - shoulderWidth / 2 + 12,
    y - 5,
  );
  shoulderGrad.addColorStop(0, color(lighten(spec.primary, 18)));
  shoulderGrad.addColorStop(0.5, color(lighten(spec.primary, 8)));
  shoulderGrad.addColorStop(1, color(darken(spec.primary, 8)));

  if (!facingBack) {
    roundRect(
      ctx,
      x - shoulderWidth / 2 - 2 + bodyTilt,
      y - 8,
      14,
      16,
      7,
      shoulderGrad,
    );
    roundRect(
      ctx,
      x + shoulderWidth / 2 - 12 + bodyTilt,
      y - 8,
      14,
      16,
      7,
      shoulderGrad,
    );
    // Shoulder highlights
    roundRect(
      ctx,
      x - shoulderWidth / 2 + bodyTilt,
      y - 6,
      10,
      4,
      2,
      color(0xffffff, 0.2),
    );
    roundRect(
      ctx,
      x + shoulderWidth / 2 - 10 + bodyTilt,
      y - 6,
      10,
      4,
      2,
      color(0xffffff, 0.2),
    );
  }

  // Belt and decorative elements
  if (facingFront || diagonalBias) {
    roundRect(
      ctx,
      x - 10 + dir.x * 2 + bodyTilt,
      y + 16,
      20,
      6,
      3,
      color(darken(spec.accent, 8)),
    );
    // Belt buckle
    roundRect(
      ctx,
      x - 3 + bodyTilt,
      y + 17,
      6,
      4,
      1,
      color(lighten(spec.accent, 20)),
    );
  }

  // Enhanced arms with armor details
  const backArmX = leftInFront ? rightArmX : leftArmX;
  const frontArmX = leftInFront ? leftArmX : rightArmX;

  // Arm armor with gradient
  const armGrad = ctx.createLinearGradient(0, armY, 0, armY + armHeight);
  armGrad.addColorStop(0, color(lighten(spec.tertiary, 8)));
  armGrad.addColorStop(0.5, color(spec.tertiary));
  armGrad.addColorStop(1, color(darken(spec.tertiary, 12)));

  roundRect(
    ctx,
    backArmX,
    armY,
    9,
    armHeight - (sideBias ? 1 : 0),
    4,
    backArmTint,
  );
  roundRect(
    ctx,
    backArmX,
    y + (isGreatsword ? 17 : 15),
    9,
    10,
    4,
    backShadowTint,
  );

  roundRect(
    ctx,
    frontArmX,
    armY - (facingFront ? 1 : 0),
    9,
    armHeight,
    4,
    armGrad,
  );
  roundRect(
    ctx,
    frontArmX,
    y + (isGreatsword ? 17 : 15),
    9,
    10,
    4,
    frontShadowTint,
  );

  // Gauntlet details
  roundRect(ctx, frontArmX, y + 14, 9, 6, 3, color(darken(spec.tertiary, 16)));
  roundRect(
    ctx,
    frontArmX + 1,
    y + 15,
    7,
    3,
    2,
    color(lighten(spec.tertiary, 12), 0.6),
  );

  // Hair/helmet based on direction
  if (!facingBack) {
    // Hair strands
    const hairColor = color(darken(spec.tertiary, 20));
    if (sideBias) {
      // Side view hair
      triangle(
        ctx,
        x - 8 + dir.x * 6,
        headY - 10,
        x - 4 + dir.x * 8,
        headY - 16,
        x + 2 + dir.x * 4,
        headY - 8,
        hairColor,
      );
    } else {
      // Front view hair
      triangle(
        ctx,
        x - 12,
        headY - 12,
        x - 6,
        headY - 18,
        x,
        headY - 10,
        hairColor,
      );
      triangle(
        ctx,
        x + 12,
        headY - 12,
        x + 6,
        headY - 18,
        x,
        headY - 10,
        hairColor,
      );
    }
  }

  // Enhanced head with better lighting
  const head = ctx.createRadialGradient(
    x - 6,
    headY - 6,
    4,
    x + 2,
    headY + 3,
    20,
  );
  head.addColorStop(0, color(lighten(spec.tertiary, 18)));
  head.addColorStop(0.4, color(lighten(spec.tertiary, 8)));
  head.addColorStop(1, color(darken(spec.tertiary, 12)));

  circle(ctx, x + bodyTilt * 0.2, headY, headRadius, head);

  // Enhanced facial features
  const faceHighlight = facingBack ? 11 : 18;
  const faceHeight = facingBack ? 6 : 8;
  ellipse(
    ctx,
    x - 4 + dir.x + bodyTilt * 0.2,
    headY - 4,
    faceHighlight,
    faceHeight,
    color(0xffffff, facingBack ? 0.1 : 0.22),
  );

  if (!facingBack) {
    if (sideBias) {
      // Side view eye
      circle(
        ctx,
        x + 5 * dir.x + bodyTilt * 0.2,
        headY - 1,
        2.3,
        color(0x111111, 0.6),
      );
      circle(
        ctx,
        x + 5 * dir.x + bodyTilt * 0.2,
        headY - 1,
        1.1,
        color(0x333333, 0.4),
      );
    } else {
      // Front view eyes
      circle(
        ctx,
        x - 6 + dir.x * 1.5 + bodyTilt * 0.2,
        headY - 1,
        2,
        color(0x111111, 0.55),
      );
      circle(
        ctx,
        x + 6 + dir.x * 1.5 + bodyTilt * 0.2,
        headY - 1,
        2,
        color(0x111111, 0.55),
      );
      // Eye highlights
      circle(
        ctx,
        x - 6 + dir.x * 1.5 + bodyTilt * 0.2,
        headY - 2,
        0.8,
        color(0xffffff, 0.7),
      );
      circle(
        ctx,
        x + 6 + dir.x * 1.5 + bodyTilt * 0.2,
        headY - 2,
        0.8,
        color(0xffffff, 0.7),
      );
    }
  }

  // Enhanced legs with boot details
  const backLegX = leftInFront ? rightLegX : leftLegX;
  const frontLegX = leftInFront ? leftLegX : rightLegX;

  roundRect(
    ctx,
    backLegX,
    y + 24,
    9,
    legHeight - (sideBias ? 1 : 0),
    4,
    backLegTint,
  );
  roundRect(ctx, backLegX, y + 38, 9, 11, 4, backShadowTint);

  roundRect(ctx, frontLegX, y + 24, 9, legHeight, 4, frontLegTint);
  roundRect(ctx, frontLegX, y + 38, 9, 11, 4, frontShadowTint);

  // Boot details
  roundRect(ctx, frontLegX, y + 40, 9, 8, 3, color(darken(spec.accent, 18)));
  roundRect(
    ctx,
    frontLegX + 1,
    y + 41,
    7,
    4,
    2,
    color(lighten(spec.accent, 8), 0.4),
  );

  drawWeapon(
    ctx,
    spec.weapon ?? "none",
    x + bodyTilt * 0.3,
    y,
    dir,
    swing,
    spec.accent,
  );

  // Enhanced armor outline with metallic shine
  strokeRoundRect(
    ctx,
    x - shoulderWidth / 2 + bodyTilt,
    torsoY,
    shoulderWidth,
    torsoHeight,
    14,
    color(0xffffff, facingBack ? 0.06 : 0.12),
    2,
  );
  // Secondary highlight
  strokeRoundRect(
    ctx,
    x - shoulderWidth / 2 + 1 + bodyTilt,
    torsoY + 1,
    shoulderWidth - 2,
    torsoHeight - 2,
    12,
    color(0xffffff, facingBack ? 0.03 : 0.06),
    1,
  );
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
  const width = 48 + stride * 2.5 + swing * 0.8;
  const height = 40 + (spec.state === "attack" ? 10 : 0);
  const bounce = spec.state === "walk" ? Math.sin(spec.frame * 1.2) * 2 : 0;
  const squash = spec.state === "attack" ? 0.85 : 1.0;

  // Enhanced shadow with slime puddle effect
  ellipse(ctx, x, y + 33, width + 20, 14, color(0x081015, 0.32));
  ellipse(ctx, x, y + 34, width + 16, 10, color(0x081015, 0.18));

  // Dripping slime trails
  if (spec.state === "walk" || spec.state === "attack") {
    const dropCount = 3;
    for (let i = 0; i < dropCount; i++) {
      const dropX = x - width / 3 + (i * width) / 3;
      const dropY = y + 28 + Math.random() * 8;
      ellipse(ctx, dropX, dropY, 3, 8, color(spec.primary, 0.4));
      ellipse(ctx, dropX, dropY + 6, 2, 4, color(spec.primary, 0.6));
    }
  }

  // Main body with glossy translucent effect
  const mainBody = ctx.createRadialGradient(
    x - width / 4,
    y - 5,
    width / 4,
    x + width / 6,
    y + 15,
    width,
  );
  mainBody.addColorStop(0, color(lighten(spec.primary, 28), 0.95));
  mainBody.addColorStop(0.2, color(lighten(spec.primary, 16), 0.92));
  mainBody.addColorStop(0.5, color(spec.primary, 0.88));
  mainBody.addColorStop(0.8, color(darken(spec.primary, 12), 0.85));
  mainBody.addColorStop(1, color(darken(spec.primary, 24), 0.9));

  ellipse(
    ctx,
    x,
    y + 12 + bounce,
    width + 22,
    (height + 20) * squash,
    mainBody,
  );

  // Inner translucent layer with bubbles
  const innerGrad = ctx.createRadialGradient(x, y + 8, 8, x, y + 15, width / 2);
  innerGrad.addColorStop(0, color(lighten(spec.secondary, 20), 0.7));
  innerGrad.addColorStop(0.6, color(spec.secondary, 0.5));
  innerGrad.addColorStop(1, color(darken(spec.secondary, 10), 0.3));

  ellipse(ctx, x, y + 18 + bounce, width * 0.85, height * squash, innerGrad);

  // Bubbling surface texture - multiple bubble layers
  const bubbleColors = [
    color(0xffffff, 0.25),
    color(lighten(spec.primary, 30), 0.2),
    color(lighten(spec.secondary, 25), 0.15),
  ];

  const bubbleSizes = [
    { count: 8, minR: 2, maxR: 5 },
    { count: 12, minR: 1, maxR: 3 },
    { count: 16, minR: 0.5, maxR: 2 },
  ];

  bubbleSizes.forEach((bubbleLayer, layerIndex) => {
    for (let i = 0; i < bubbleLayer.count; i++) {
      const angle = (i / bubbleLayer.count) * Math.PI * 2 + spec.frame * 0.1;
      const distance = width * 0.3 * (0.4 + Math.sin(angle * 2) * 0.3);
      const bubbleX = x + Math.cos(angle) * distance;
      const bubbleY = y + 10 + Math.sin(angle) * distance * 0.5 + bounce;
      const bubbleR =
        bubbleLayer.minR +
        Math.sin(spec.frame * 0.2 + i) * (bubbleLayer.maxR - bubbleLayer.minR);

      circle(ctx, bubbleX, bubbleY, bubbleR, bubbleColors[layerIndex]);
    }
  });

  // Prominent light reflection on top
  const reflectionGrad = ctx.createRadialGradient(
    x - 8,
    y - 2,
    4,
    x - 4,
    y + 2,
    20,
  );
  reflectionGrad.addColorStop(0, color(0xffffff, 0.45));
  reflectionGrad.addColorStop(0.5, color(0xffffff, 0.25));
  reflectionGrad.addColorStop(1, color(0xffffff, 0.05));

  ellipse(ctx, x - 6, y + 2 + bounce, 28, 12, reflectionGrad);

  // Enhanced eyes with liquid effect
  const eyeShine = color(0xffffff, 0.3);

  // Eye base with translucent effect
  circle(
    ctx,
    x - 12 + dir.x * 3,
    y + 6 + bounce,
    5.5,
    color(spec.tertiary, 0.8),
  );
  circle(
    ctx,
    x + 12 + dir.x * 3,
    y + 6 + bounce,
    5.5,
    color(spec.tertiary, 0.8),
  );

  // Eye outline with slime coating
  circle(
    ctx,
    x - 12 + dir.x * 3,
    y + 6 + bounce,
    6.2,
    color(spec.primary, 0.3),
  );
  circle(
    ctx,
    x + 12 + dir.x * 3,
    y + 6 + bounce,
    6.2,
    color(spec.primary, 0.3),
  );

  // Pupils
  circle(ctx, x - 12 + dir.x * 3, y + 6 + bounce, 2.5, color(spec.accent));
  circle(ctx, x + 12 + dir.x * 3, y + 6 + bounce, 2.5, color(spec.accent));

  // Eye highlights
  circle(ctx, x - 13 + dir.x * 3, y + 4 + bounce, 1.5, eyeShine);
  circle(ctx, x + 11 + dir.x * 3, y + 4 + bounce, 1.5, eyeShine);

  // Slime coating drips on eyes
  ellipse(
    ctx,
    x - 12 + dir.x * 3,
    y + 11 + bounce,
    4,
    2,
    color(spec.primary, 0.4),
  );
  ellipse(
    ctx,
    x + 12 + dir.x * 3,
    y + 11 + bounce,
    4,
    2,
    color(spec.primary, 0.4),
  );

  // Internal light effects for magical slimes
  if (spec.state === "attack") {
    const coreGlow = ctx.createRadialGradient(x, y + 15, 2, x, y + 15, 18);
    coreGlow.addColorStop(0, color(lighten(spec.accent, 40), 0.3));
    coreGlow.addColorStop(0.5, color(lighten(spec.accent, 20), 0.15));
    coreGlow.addColorStop(1, color(spec.accent, 0.05));

    circle(ctx, x, y + 15 + bounce, 20, coreGlow);
  }

  // Outer slime membrane with slight transparency variation
  const membraneGrad = ctx.createLinearGradient(
    x - width / 2,
    y,
    x + width / 2,
    y + height,
  );
  membraneGrad.addColorStop(0, color(spec.primary, 0.15));
  membraneGrad.addColorStop(0.3, color(spec.primary, 0.08));
  membraneGrad.addColorStop(0.7, color(darken(spec.primary, 8), 0.12));
  membraneGrad.addColorStop(1, color(darken(spec.primary, 16), 0.18));

  ellipse(
    ctx,
    x,
    y + 18 + bounce,
    width * 0.95,
    height * squash * 0.9,
    membraneGrad,
  );
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
      // Enhanced shadow
      ellipse(ctx, x, y + 33, 52, 14, color(0x05080d, 0.32));

      // Segmented legs with joints and hair tufts
      const legSegments = [
        {
          start: { x: x - 6, y: y + 12 },
          mid: { x: x - 25, y: y + 2 },
          end: { x: x - 38, y: y - 6 + stride },
        },
        {
          start: { x: x - 4, y: y + 16 },
          mid: { x: x - 18, y: y + 25 },
          end: { x: x - 28, y: y + 35 - stride },
        },
        {
          start: { x: x + 6, y: y + 12 },
          mid: { x: x + 25, y: y + 2 },
          end: { x: x + 38, y: y - 6 + stride },
        },
        {
          start: { x: x + 4, y: y + 16 },
          mid: { x: x + 18, y: y + 25 },
          end: { x: x + 28, y: y + 35 - stride },
        },
        {
          start: { x: x - 8, y: y + 10 },
          mid: { x: x - 30, y: y + 8 },
          end: { x: x - 45, y: y + 6 },
        },
        {
          start: { x: x + 8, y: y + 10 },
          mid: { x: x + 30, y: y + 8 },
          end: { x: x + 45, y: y + 6 },
        },
      ];

      legSegments.forEach((leg, i) => {
        // Leg segments with joints
        strokeLine(
          ctx,
          leg.start.x,
          leg.start.y,
          leg.mid.x,
          leg.mid.y,
          color(darken(spec.accent, 8)),
          3.5,
        );
        strokeLine(
          ctx,
          leg.mid.x,
          leg.mid.y,
          leg.end.x,
          leg.end.y,
          color(spec.accent),
          3,
        );

        // Joint details
        circle(ctx, leg.mid.x, leg.mid.y, 2, color(darken(spec.accent, 12)));

        // Hair tufts on legs
        if (i % 2 === 0) {
          const hairX = leg.mid.x + (Math.random() - 0.5) * 4;
          const hairY = leg.mid.y + (Math.random() - 0.5) * 4;
          strokeLine(
            ctx,
            hairX,
            hairY,
            hairX + (Math.random() - 0.5) * 6,
            hairY + (Math.random() - 0.5) * 6,
            color(spec.accent, 0.6),
            1,
          );
        }
      });

      // Main abdomen with pattern
      const abdomenGrad = ctx.createRadialGradient(
        x - 8,
        y + 2,
        6,
        x + 4,
        y + 12,
        24,
      );
      abdomenGrad.addColorStop(0, color(lighten(spec.primary, 16)));
      abdomenGrad.addColorStop(0.4, color(spec.primary));
      abdomenGrad.addColorStop(1, color(darken(spec.primary, 20)));

      ellipse(ctx, x, y + 10, 38, 28, abdomenGrad);

      // Abdomen cross pattern
      const patternColor = color(darken(spec.primary, 24), 0.7);
      strokeLine(ctx, x - 12, y + 2, x + 12, y + 18, patternColor, 2);
      strokeLine(ctx, x + 12, y + 2, x - 12, y + 18, patternColor, 2);

      // Stripe patterns
      for (let i = 0; i < 3; i++) {
        const stripeY = y + 4 + i * 5;
        ellipse(
          ctx,
          x,
          stripeY,
          32 - i * 4,
          3,
          color(darken(spec.primary, 16), 0.5),
        );
      }

      // Cephalothorax (head region)
      const headGrad = ctx.createRadialGradient(x - 4, y - 2, 4, x, y + 6, 12);
      headGrad.addColorStop(0, color(lighten(spec.secondary, 12)));
      headGrad.addColorStop(1, color(darken(spec.secondary, 8)));

      ellipse(ctx, x, y + 2, 18, 12, headGrad);

      // Highlight on body
      ellipse(ctx, x - 6, y + 1, 16, 6, color(0xffffff, 0.18));

      // Enhanced eyes - multiple eyes like real spiders
      const eyePositions = [
        { x: x - 6, y: y + 4 },
        { x: x + 6, y: y + 4 }, // Main eyes
        { x: x - 3, y: y + 1 },
        { x: x + 3, y: y + 1 }, // Secondary eyes
        { x: x - 9, y: y + 2 },
        { x: x + 9, y: y + 2 }, // Side eyes
      ];

      eyePositions.forEach((eye, i) => {
        const eyeSize = i < 2 ? 2.5 : i < 4 ? 1.8 : 1.2;
        const eyeColor = i < 2 ? spec.tertiary : darken(spec.tertiary, 12);
        circle(ctx, eye.x, eye.y, eyeSize, color(eyeColor));

        if (i < 2) {
          circle(ctx, eye.x, eye.y, 1, color(0x000000, 0.8));
          circle(ctx, eye.x - 0.5, eye.y - 0.5, 0.4, color(0xffffff, 0.9));
        }
      });

      // Mandibles and fangs
      triangle(
        ctx,
        x - 4,
        y + 8,
        x - 8,
        y + 12,
        x - 2,
        y + 14,
        color(darken(spec.secondary, 20)),
      );
      triangle(
        ctx,
        x + 4,
        y + 8,
        x + 8,
        y + 12,
        x + 2,
        y + 14,
        color(darken(spec.secondary, 20)),
      );

      // Fangs with shine
      strokeLine(ctx, x - 5, y + 11, x - 6, y + 16, color(0xffffff, 0.9), 1.5);
      strokeLine(ctx, x + 5, y + 11, x + 6, y + 16, color(0xffffff, 0.9), 1.5);

      break;
    case "wolf":
      // Enhanced shadow
      ellipse(ctx, x - dir.x * 3, y + 36, 56, 14, color(0x071015, 0.3));

      // Main muscular body with fur texture
      const wolfBodyGrad = ctx.createRadialGradient(
        x - dir.x * 6,
        y + 8,
        8,
        x - dir.x * 2,
        y + 20,
        30,
      );
      wolfBodyGrad.addColorStop(0, color(lighten(spec.primary, 20)));
      wolfBodyGrad.addColorStop(0.3, color(lighten(spec.primary, 8)));
      wolfBodyGrad.addColorStop(0.7, color(spec.primary));
      wolfBodyGrad.addColorStop(1, color(darken(spec.primary, 16)));

      ellipse(ctx, x - dir.x * 4, y + 16, 52, 26, wolfBodyGrad);

      // Fur texture strokes
      for (let i = 0; i < 12; i++) {
        const furX = x - dir.x * 4 + (Math.random() - 0.5) * 40;
        const furY = y + 8 + (Math.random() - 0.5) * 20;
        const furLength = 3 + Math.random() * 4;
        const furAngle = Math.random() * Math.PI * 2;
        strokeLine(
          ctx,
          furX,
          furY,
          furX + Math.cos(furAngle) * furLength,
          furY + Math.sin(furAngle) * furLength,
          color(darken(spec.primary, 12), 0.4),
          1,
        );
      }

      // Enhanced muscular legs with paws
      const legGrad = ctx.createLinearGradient(0, y + 20, 0, y + 38);
      legGrad.addColorStop(0, color(spec.primary));
      legGrad.addColorStop(0.7, color(darken(spec.primary, 8)));
      legGrad.addColorStop(1, color(darken(spec.primary, 16)));

      // Back legs
      roundRect(ctx, x - 21 + stride, y + 20, 7, 20, 4, legGrad);
      roundRect(ctx, x + 10 - stride, y + 20, 7, 20, 4, legGrad);

      // Paws with claws
      ellipse(
        ctx,
        x - 18 + stride,
        y + 38,
        8,
        6,
        color(darken(spec.primary, 20)),
      );
      ellipse(
        ctx,
        x + 13 - stride,
        y + 38,
        8,
        6,
        color(darken(spec.primary, 20)),
      );

      // Claws
      for (let i = 0; i < 3; i++) {
        const clawOffset = (i - 1) * 2;
        strokeLine(
          ctx,
          x - 18 + stride + clawOffset,
          y + 39,
          x - 18 + stride + clawOffset,
          y + 42,
          color(0xf0f0f0),
          1,
        );
        strokeLine(
          ctx,
          x + 13 - stride + clawOffset,
          y + 39,
          x + 13 - stride + clawOffset,
          y + 42,
          color(0xf0f0f0),
          1,
        );
      }

      // Head with muzzle detail
      const wolfHeadGrad = ctx.createRadialGradient(
        x + 20 + dir.x * 4,
        y + 2,
        8,
        x + 26 + dir.x * 4,
        y + 8,
        18,
      );
      wolfHeadGrad.addColorStop(0, color(lighten(spec.secondary, 16)));
      wolfHeadGrad.addColorStop(0.5, color(spec.secondary));
      wolfHeadGrad.addColorStop(1, color(darken(spec.secondary, 12)));

      triangle(
        ctx,
        x + 18 + dir.x * 6,
        y + 4,
        x + 34 + dir.x * 5,
        y - 8,
        x + 24 + dir.x * 2,
        y + 18,
        wolfHeadGrad,
      );

      // Snout with nose detail
      ellipse(
        ctx,
        x + 28 + dir.x * 5,
        y + 8,
        12,
        8,
        color(darken(spec.secondary, 8)),
      );
      circle(ctx, x + 32 + dir.x * 4, y + 6, 2, color(0x000000, 0.8));

      // Teeth/snarl for attack frames
      if (spec.state === "attack") {
        const teethColor = color(0xffffff, 0.9);
        triangle(
          ctx,
          x + 26 + dir.x * 4,
          y + 10,
          x + 28 + dir.x * 4,
          y + 6,
          x + 30 + dir.x * 4,
          y + 12,
          teethColor,
        );
        triangle(
          ctx,
          x + 30 + dir.x * 4,
          y + 10,
          x + 32 + dir.x * 4,
          y + 6,
          x + 34 + dir.x * 4,
          y + 12,
          teethColor,
        );
      }

      // Enhanced ears with inner detail
      triangle(
        ctx,
        x + 24 + dir.x * 5,
        y + 8,
        x + 34 + dir.x * 4,
        y - 8,
        x + 18 + dir.x * 2,
        y - 2,
        color(spec.secondary),
      );
      // Inner ear
      triangle(
        ctx,
        x + 26 + dir.x * 4,
        y + 4,
        x + 30 + dir.x * 3,
        y - 2,
        x + 22 + dir.x * 2,
        y + 2,
        color(lighten(spec.secondary, 12)),
      );

      // Tail with fur texture
      const tailGrad = ctx.createLinearGradient(x - 24, y + 10, x - 40, y + 3);
      tailGrad.addColorStop(0, color(spec.primary));
      tailGrad.addColorStop(0.5, color(spec.accent));
      tailGrad.addColorStop(1, color(darken(spec.accent, 8)));

      triangle(
        ctx,
        x - 24 - dir.x * 5,
        y + 10,
        x - 42 - dir.x * 9,
        y + 3,
        x - 28 - dir.x * 7,
        y + 17,
        tailGrad,
      );

      // Tail fur strokes
      for (let i = 0; i < 6; i++) {
        const tailFurX = x - 30 - dir.x * 7 + (Math.random() - 0.5) * 8;
        const tailFurY = y + 8 + Math.random() * 8;
        const tailFurLength = 2 + Math.random() * 3;
        strokeLine(
          ctx,
          tailFurX,
          tailFurY,
          tailFurX - tailFurLength,
          tailFurY + (Math.random() - 0.5) * 4,
          color(darken(spec.accent, 16), 0.6),
          1,
        );
      }

      // Body highlight
      ellipse(ctx, x - 10, y + 10, 20, 8, color(0xffffff, 0.18));

      // Eyes with wolf intensity
      circle(ctx, x + 22 + dir.x * 3, y + 2, 3, color(spec.tertiary));
      circle(ctx, x + 22 + dir.x * 3, y + 2, 1.5, color(0x000000, 0.7));
      circle(ctx, x + 21 + dir.x * 3, y + 1, 0.8, color(0xffffff, 0.8));

      break;
    case "orc": {
      // === Lineage Remaster Orc — muscular brute with crude armor ===
      // Enhanced ground shadow
      ellipse(ctx, x, y + 36, 60, 18, color(0x05080d, 0.32));
      ellipse(ctx, x, y + 37, 54, 14, color(0x05080d, 0.16));

      // Muscular legs with leather boots
      const orcLegG = ctx.createLinearGradient(0, y + 18, 0, y + 40);
      orcLegG.addColorStop(0, color(spec.primary));
      orcLegG.addColorStop(0.6, color(darken(spec.primary, 10)));
      orcLegG.addColorStop(1, color(darken(spec.primary, 22)));
      roundRect(ctx, x - 14 + stride, y + 18, 11, 22, 5, orcLegG);
      roundRect(ctx, x + 3 - stride, y + 18, 11, 22, 5, orcLegG);
      // Leather boots with straps
      roundRect(ctx, x - 16 + stride, y + 34, 14, 8, 4, color(darken(spec.accent, 22)));
      roundRect(ctx, x + 2 - stride, y + 34, 14, 8, 4, color(darken(spec.accent, 22)));
      roundRect(ctx, x - 14 + stride, y + 32, 10, 2, 1, color(spec.accent, 0.6));
      roundRect(ctx, x + 4 - stride, y + 32, 10, 2, 1, color(spec.accent, 0.6));

      // Muscular torso with layered armor
      const orcTorsoG = ctx.createRadialGradient(x - 4, y - 6, 8, x + 2, y + 10, 30);
      orcTorsoG.addColorStop(0, color(lighten(spec.primary, 18)));
      orcTorsoG.addColorStop(0.4, color(spec.primary));
      orcTorsoG.addColorStop(0.8, color(darken(spec.primary, 10)));
      orcTorsoG.addColorStop(1, color(darken(spec.primary, 22)));
      roundRect(ctx, x - 24, y - 10, 48, 32, 14, orcTorsoG);

      // Crude chest plate
      const chestG = ctx.createLinearGradient(x - 16, y - 4, x + 16, y + 18);
      chestG.addColorStop(0, color(lighten(spec.accent, 10), 0.7));
      chestG.addColorStop(0.5, color(spec.accent, 0.6));
      chestG.addColorStop(1, color(darken(spec.accent, 14), 0.7));
      roundRect(ctx, x - 16, y - 4, 32, 22, 8, chestG);
      // Chest plate rivets
      for (let i = 0; i < 4; i++) {
        circle(ctx, x - 10 + i * 7, y + 1, 1.2, color(lighten(spec.accent, 20)));
      }

      // Belt with metal studs
      roundRect(ctx, x - 20, y + 14, 40, 7, 2, color(darken(spec.accent, 18)));
      for (let i = 0; i < 6; i++) {
        circle(ctx, x - 14 + i * 6, y + 17, 1.5, color(lighten(spec.accent, 16)));
      }
      roundRect(ctx, x - 5, y + 14, 10, 7, 1, color(lighten(spec.accent, 24)));

      // Shoulder pauldrons with spikes
      const spG = ctx.createRadialGradient(x - 26, y - 8, 3, x - 22, y - 2, 14);
      spG.addColorStop(0, color(lighten(spec.accent, 18)));
      spG.addColorStop(1, color(darken(spec.accent, 10)));
      ellipse(ctx, x - 24, y - 6, 20, 16, spG);
      ellipse(ctx, x + 24, y - 6, 20, 16, spG);
      // Pauldron spikes
      triangle(ctx, x - 30, y - 6, x - 26, y - 20, x - 22, y - 6, color(lighten(spec.accent, 14)));
      triangle(ctx, x + 30, y - 6, x + 26, y - 20, x + 22, y - 6, color(lighten(spec.accent, 14)));
      // Spike highlights
      strokeLine(ctx, x - 27, y - 16, x - 26, y - 8, color(0xffffff, 0.3), 1);
      strokeLine(ctx, x + 25, y - 16, x + 26, y - 8, color(0xffffff, 0.3), 1);

      // Muscular arms
      const orcArmG = ctx.createLinearGradient(0, y - 4, 0, y + 18);
      orcArmG.addColorStop(0, color(lighten(spec.primary, 10)));
      orcArmG.addColorStop(0.5, color(spec.primary));
      orcArmG.addColorStop(1, color(darken(spec.primary, 14)));
      roundRect(ctx, x - 34, y - 2, 14, 24, 6, orcArmG);
      roundRect(ctx, x + 20, y - 2, 14, 24, 6, orcArmG);
      // Metal bracers
      roundRect(ctx, x - 35, y + 12, 16, 8, 3, color(darken(spec.accent, 14)));
      roundRect(ctx, x + 19, y + 12, 16, 8, 3, color(darken(spec.accent, 14)));
      circle(ctx, x - 27, y + 16, 1.2, color(lighten(spec.accent, 18)));
      circle(ctx, x + 27, y + 16, 1.2, color(lighten(spec.accent, 18)));
      // Fists
      circle(ctx, x - 27 + swing * 0.3, y + 22, 6, color(spec.primary));
      circle(ctx, x + 27 + swing * 0.3, y + 22, 6, color(spec.primary));
      // Knuckle details
      circle(ctx, x - 29 + swing * 0.3, y + 21, 1, color(darken(spec.primary, 16)));
      circle(ctx, x - 25 + swing * 0.3, y + 21, 1, color(darken(spec.primary, 16)));
      circle(ctx, x + 25 + swing * 0.3, y + 21, 1, color(darken(spec.primary, 16)));
      circle(ctx, x + 29 + swing * 0.3, y + 21, 1, color(darken(spec.primary, 16)));

      // Head — large brutish skull
      const orcHeadG = ctx.createRadialGradient(x - 4, y - 20, 6, x + 2, y - 10, 18);
      orcHeadG.addColorStop(0, color(lighten(spec.primary, 16)));
      orcHeadG.addColorStop(0.5, color(spec.primary));
      orcHeadG.addColorStop(1, color(darken(spec.primary, 14)));
      circle(ctx, x, y - 18, 17, orcHeadG);
      // Brow ridge
      ellipse(ctx, x, y - 24, 30, 10, color(darken(spec.primary, 8)));
      // Face highlight
      ellipse(ctx, x - 4, y - 22, 14, 8, color(0xffffff, 0.1));

      // Eyes — angry, with glow
      circle(ctx, x - 8 + dir.x * 2, y - 18, 3.5, color(spec.tertiary));
      circle(ctx, x + 8 + dir.x * 2, y - 18, 3.5, color(spec.tertiary));
      circle(ctx, x - 8 + dir.x * 2, y - 18, 1.8, color(0x111111, 0.8));
      circle(ctx, x + 8 + dir.x * 2, y - 18, 1.8, color(0x111111, 0.8));
      circle(ctx, x - 9 + dir.x * 2, y - 19, 0.8, color(0xffffff, 0.7));
      circle(ctx, x + 7 + dir.x * 2, y - 19, 0.8, color(0xffffff, 0.7));

      // Broad nose
      triangle(ctx, x - 4, y - 14, x + 4, y - 14, x, y - 9, color(darken(spec.primary, 18)));
      circle(ctx, x - 2, y - 10, 1.2, color(darken(spec.primary, 28)));
      circle(ctx, x + 2, y - 10, 1.2, color(darken(spec.primary, 28)));

      // Prominent tusks
      triangle(ctx, x - 9, y - 6, x - 5, y - 14, x - 3, y - 6, color(0xf0e8d0));
      triangle(ctx, x + 9, y - 6, x + 5, y - 14, x + 3, y - 6, color(0xf0e8d0));
      strokeLine(ctx, x - 7, y - 12, x - 5, y - 7, color(0xffffff, 0.4), 1);
      strokeLine(ctx, x + 7, y - 12, x + 5, y - 7, color(0xffffff, 0.4), 1);

      // Pointed ears
      triangle(ctx, x - 16, y - 22, x - 26, y - 18, x - 14, y - 14, color(darken(spec.primary, 6)));
      triangle(ctx, x + 16, y - 22, x + 26, y - 18, x + 14, y - 14, color(darken(spec.primary, 6)));
      // Inner ear
      triangle(ctx, x - 18, y - 20, x - 24, y - 17, x - 15, y - 15, color(lighten(spec.primary, 10)));
      triangle(ctx, x + 18, y - 20, x + 24, y - 17, x + 15, y - 15, color(lighten(spec.primary, 10)));

      // War paint scarification
      strokeLine(ctx, x - 14, y - 12, x - 4, y, color(spec.secondary, 0.5), 2);
      strokeLine(ctx, x + 14, y - 12, x + 4, y, color(spec.secondary, 0.5), 2);
      strokeLine(ctx, x - 12, y - 10, x - 2, y + 2, color(spec.secondary, 0.3), 1);

      // Crude axe in attack state
      if (spec.state === "attack") {
        const axX = x + 32 + swing * 0.5;
        const axY = y - 14 - swing * 0.3;
        roundRect(ctx, axX - 2, axY, 4, 32, 2, color(0x6b4423));
        // Wood grain
        strokeLine(ctx, axX, axY + 4, axX, axY + 28, color(0x5a3a1c, 0.5), 1);
        // Axe head
        triangle(ctx, axX + 2, axY - 4, axX + 18, axY + 6, axX + 2, axY + 16, color(0x888888));
        // Axe edge gleam
        strokeLine(ctx, axX + 16, axY + 1, axX + 16, axY + 11, color(0xdddddd, 0.8), 1.5);
        // Blood stains
        circle(ctx, axX + 10, axY + 8, 1.5, color(0x8b0000, 0.6));
      }

      // Body muscle highlight
      ellipse(ctx, x - 8, y - 2, 18, 12, color(0xffffff, 0.08));
      break;
    }
    case "boar": {
      // === Lineage Remaster Boar — bristly wild beast ===
      // Ground shadow
      ellipse(ctx, x - dir.x * 3, y + 36, 58, 16, color(0x07090c, 0.3));
      ellipse(ctx, x - dir.x * 3, y + 37, 52, 12, color(0x07090c, 0.15));

      // Four muscular legs with hooves
      const boarLegG = ctx.createLinearGradient(0, y + 16, 0, y + 36);
      boarLegG.addColorStop(0, color(spec.primary));
      boarLegG.addColorStop(0.7, color(darken(spec.primary, 10)));
      boarLegG.addColorStop(1, color(darken(spec.primary, 22)));
      // Back legs
      roundRect(ctx, x - 20 + stride, y + 18, 9, 20, 4, boarLegG);
      roundRect(ctx, x - 10 - stride, y + 18, 9, 20, 4, boarLegG);
      // Front legs
      roundRect(ctx, x + 8 + stride, y + 16, 9, 22, 4, boarLegG);
      roundRect(ctx, x + 18 - stride, y + 16, 9, 22, 4, boarLegG);
      // Hooves
      ellipse(ctx, x - 16 + stride, y + 37, 10, 6, color(darken(spec.primary, 28)));
      ellipse(ctx, x - 6 - stride, y + 37, 10, 6, color(darken(spec.primary, 28)));
      ellipse(ctx, x + 12 + stride, y + 37, 10, 6, color(darken(spec.primary, 28)));
      ellipse(ctx, x + 22 - stride, y + 37, 10, 6, color(darken(spec.primary, 28)));

      // Main body with bristle texture
      const boarBodyG = ctx.createRadialGradient(x - 6, y + 6, 10, x + 4, y + 18, 32);
      boarBodyG.addColorStop(0, color(lighten(spec.primary, 18)));
      boarBodyG.addColorStop(0.3, color(lighten(spec.primary, 8)));
      boarBodyG.addColorStop(0.7, color(spec.primary));
      boarBodyG.addColorStop(1, color(darken(spec.primary, 16)));
      ellipse(ctx, x - 2, y + 14, 54, 28, boarBodyG);

      // Belly — lighter underside
      ellipse(ctx, x - 2, y + 20, 42, 14, color(lighten(spec.primary, 12), 0.4));

      // Bristle mane ridge along the back
      for (let i = 0; i < 10; i++) {
        const bx = x - 20 + i * 5;
        const by = y + 2 + Math.sin(i * 0.8) * 2;
        const bh = 6 + Math.sin(i * 1.2) * 3;
        strokeLine(ctx, bx, by, bx + 1, by - bh, color(darken(spec.primary, 20), 0.7), 2);
        strokeLine(ctx, bx + 2, by, bx + 3, by - bh + 1, color(darken(spec.primary, 14), 0.5), 1.5);
      }

      // Bristle fur texture on body
      for (let i = 0; i < 18; i++) {
        const fx = x - 20 + (i % 6) * 8 + (Math.sin(i) * 4);
        const fy = y + 6 + Math.floor(i / 6) * 8;
        const fl = 3 + Math.sin(i * 0.7) * 2;
        strokeLine(ctx, fx, fy, fx + fl * dir.x * 0.5, fy + fl, color(darken(spec.primary, 14), 0.3), 1);
      }

      // Head with snout
      const boarHeadG = ctx.createRadialGradient(x + 22 + dir.x * 4, y + 6, 6, x + 28 + dir.x * 4, y + 12, 16);
      boarHeadG.addColorStop(0, color(lighten(spec.secondary, 14)));
      boarHeadG.addColorStop(0.5, color(spec.secondary));
      boarHeadG.addColorStop(1, color(darken(spec.secondary, 12)));
      ellipse(ctx, x + 22 + dir.x * 3, y + 12, 28, 20, boarHeadG);

      // Snout — protruding
      const snoutG = ctx.createRadialGradient(x + 32 + dir.x * 4, y + 14, 3, x + 34 + dir.x * 4, y + 16, 10);
      snoutG.addColorStop(0, color(lighten(spec.secondary, 8)));
      snoutG.addColorStop(1, color(darken(spec.secondary, 8)));
      ellipse(ctx, x + 32 + dir.x * 4, y + 14, 16, 12, snoutG);
      // Nostrils
      circle(ctx, x + 36 + dir.x * 4, y + 12, 2, color(darken(spec.secondary, 30)));
      circle(ctx, x + 36 + dir.x * 4, y + 16, 2, color(darken(spec.secondary, 30)));
      // Snout ridge highlight
      ellipse(ctx, x + 30 + dir.x * 4, y + 10, 8, 3, color(0xffffff, 0.12));

      // Prominent tusks curving upward
      // Left tusk
      ctx.beginPath();
      ctx.moveTo(x + 30 + dir.x * 3, y + 18);
      ctx.quadraticCurveTo(x + 36 + dir.x * 3, y + 8, x + 32 + dir.x * 3, y + 2);
      ctx.strokeStyle = color(0xf3e8d0);
      ctx.lineWidth = 3;
      ctx.stroke();
      // Right tusk
      ctx.beginPath();
      ctx.moveTo(x + 34 + dir.x * 3, y + 18);
      ctx.quadraticCurveTo(x + 40 + dir.x * 3, y + 8, x + 38 + dir.x * 3, y + 2);
      ctx.strokeStyle = color(0xf3e8d0);
      ctx.lineWidth = 3;
      ctx.stroke();
      // Tusk tips
      circle(ctx, x + 32 + dir.x * 3, y + 2, 1.5, color(0xffffff, 0.8));
      circle(ctx, x + 38 + dir.x * 3, y + 2, 1.5, color(0xffffff, 0.8));

      // Small angry eye
      circle(ctx, x + 20 + dir.x * 3, y + 8, 3.5, color(spec.tertiary));
      circle(ctx, x + 20 + dir.x * 3, y + 8, 1.8, color(0x111111, 0.8));
      circle(ctx, x + 19 + dir.x * 3, y + 7, 0.8, color(0xffffff, 0.7));

      // Ears — small and pointed
      triangle(ctx, x + 14 + dir.x * 2, y + 2, x + 10 + dir.x * 2, y - 8, x + 8 + dir.x * 2, y + 4, color(darken(spec.secondary, 10)));
      triangle(ctx, x + 18 + dir.x * 2, y + 2, x + 16 + dir.x * 2, y - 6, x + 14 + dir.x * 2, y + 4, color(darken(spec.secondary, 4)));
      // Inner ear
      triangle(ctx, x + 12 + dir.x * 2, y + 1, x + 11 + dir.x * 2, y - 4, x + 10 + dir.x * 2, y + 2, color(lighten(spec.secondary, 14)));

      // Short curly tail
      const tailX = x - 24 - dir.x * 4;
      const tailY = y + 10;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.quadraticCurveTo(tailX - 6, tailY - 8, tailX - 2, tailY - 12);
      ctx.quadraticCurveTo(tailX + 4, tailY - 14, tailX + 2, tailY - 8);
      ctx.strokeStyle = color(darken(spec.primary, 12));
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Body highlight
      ellipse(ctx, x - 4, y + 10, 22, 10, color(0xffffff, 0.1));

      // Attack: charge dust cloud
      if (spec.state === "attack" && swing > 4) {
        for (let i = 0; i < 4; i++) {
          const dx = x - 28 + Math.sin(i * 2.1) * 12;
          const dy = y + 30 + Math.cos(i * 1.7) * 6;
          circle(ctx, dx, dy, 3 + Math.sin(i) * 2, color(0x8b7355, 0.3 - i * 0.05));
        }
      }
      break;
    }
    case "wisp": {
      // === Lineage Remaster Wisp — ethereal spirit orb with aurora trails ===
      const wPulse = spec.state === "attack" ? swing * 0.6 : Math.sin(spec.frame * 1.5) * 3;
      const wFloat = spec.state === "walk" ? Math.sin(spec.frame * 1.2) * 4 : 0;

      // Outer ambient glow — large soft aura
      const outerGlow = ctx.createRadialGradient(x, y + wFloat, 0, x, y + wFloat, 42 + wPulse);
      outerGlow.addColorStop(0, color(spec.primary, 0.15));
      outerGlow.addColorStop(0.4, color(spec.secondary, 0.1));
      outerGlow.addColorStop(0.7, color(spec.primary, 0.05));
      outerGlow.addColorStop(1, color(spec.primary, 0));
      circle(ctx, x, y + wFloat, 42 + wPulse, outerGlow);

      // Aurora trailing wisps — 3 ethereal trails
      const trails = [
        { angle: -0.6, length: 32, width: 8, alpha: 0.25 },
        { angle: 0, length: 38, width: 10, alpha: 0.3 },
        { angle: 0.5, length: 28, width: 6, alpha: 0.2 },
      ];
      trails.forEach((t, i) => {
        const tx = x + Math.sin(spec.frame * 0.5 + i * 2) * 6;
        const ty = y + 12 + wFloat;
        const endX = tx + Math.sin(t.angle + spec.frame * 0.3) * t.width;
        const endY = ty + t.length + wPulse * 0.3;
        const trailG = ctx.createLinearGradient(tx, ty, endX, endY);
        trailG.addColorStop(0, color(spec.primary, t.alpha));
        trailG.addColorStop(0.5, color(spec.secondary, t.alpha * 0.6));
        trailG.addColorStop(1, color(spec.primary, 0));
        triangle(ctx, tx - t.width / 2, ty, tx + t.width / 2, ty, endX, endY, trailG);
      });

      // Mid glow ring
      const midGlow = ctx.createRadialGradient(x, y + wFloat, 8, x, y + wFloat, 28 + wPulse * 0.5);
      midGlow.addColorStop(0, color(lighten(spec.secondary, 30), 0.5));
      midGlow.addColorStop(0.4, color(spec.secondary, 0.35));
      midGlow.addColorStop(0.7, color(spec.primary, 0.2));
      midGlow.addColorStop(1, color(spec.primary, 0.05));
      circle(ctx, x, y + wFloat, 28 + wPulse * 0.5, midGlow);

      // Core body — bright inner orb
      const coreG = ctx.createRadialGradient(x - 3, y - 4 + wFloat, 4, x, y + wFloat, 16);
      coreG.addColorStop(0, color(0xffffff, 0.95));
      coreG.addColorStop(0.2, color(lighten(spec.primary, 40), 0.9));
      coreG.addColorStop(0.5, color(lighten(spec.primary, 20), 0.8));
      coreG.addColorStop(0.8, color(spec.primary, 0.7));
      coreG.addColorStop(1, color(spec.secondary, 0.5));
      circle(ctx, x, y + wFloat, 16 + wPulse * 0.2, coreG);

      // Inner bright nucleus
      const nucleusG = ctx.createRadialGradient(x - 2, y - 3 + wFloat, 1, x, y + wFloat, 8);
      nucleusG.addColorStop(0, color(0xffffff, 0.9));
      nucleusG.addColorStop(0.5, color(lighten(spec.primary, 50), 0.7));
      nucleusG.addColorStop(1, color(spec.primary, 0.4));
      circle(ctx, x, y + wFloat, 8, nucleusG);

      // Sparkle particles orbiting
      for (let i = 0; i < 8; i++) {
        const pAngle = (i / 8) * Math.PI * 2 + spec.frame * 0.4;
        const pDist = 20 + Math.sin(spec.frame * 0.3 + i * 1.5) * 8;
        const px = x + Math.cos(pAngle) * pDist;
        const py = y + wFloat + Math.sin(pAngle) * pDist * 0.4;
        const pSize = 1 + Math.sin(spec.frame * 0.5 + i) * 0.8;
        circle(ctx, px, py, pSize, color(0xffffff, 0.4 + Math.sin(i + spec.frame * 0.2) * 0.2));
      }

      // Top highlight — crescent reflection
      ellipse(ctx, x - 5, y - 8 + wFloat, 14, 6, color(0xffffff, 0.35));

      // Attack: energy burst rays
      if (spec.state === "attack" && swing > 4) {
        for (let i = 0; i < 6; i++) {
          const rAngle = (i / 6) * Math.PI * 2 + swing * 0.1;
          const rLen = 18 + swing * 0.8;
          const rx = x + Math.cos(rAngle) * rLen;
          const ry = y + wFloat + Math.sin(rAngle) * rLen * 0.5;
          strokeLine(ctx, x, y + wFloat, rx, ry, color(lighten(spec.primary, 30), 0.3), 1.5);
        }
      }
      break;
    }
    case "dragon": {
      // === Lineage Remaster Dragon — fearsome wyrm with membrane wings ===
      const dFlap = spec.state === "idle" ? Math.sin(spec.frame * 1.0) * 4 : spec.state === "walk" ? Math.sin(spec.frame * 1.5) * 8 : swing * 0.3;

      // Ground shadow — large
      ellipse(ctx, x, y + 36, 68, 20, color(0x08090e, 0.32));
      ellipse(ctx, x, y + 37, 62, 16, color(0x08090e, 0.16));

      // Tail with spines — curving behind
      const tailG = ctx.createLinearGradient(x - 28, y + 14, x - 52, y + 4);
      tailG.addColorStop(0, color(spec.primary));
      tailG.addColorStop(0.5, color(darken(spec.primary, 10)));
      tailG.addColorStop(1, color(darken(spec.primary, 22)));
      // Tail body — thick to thin curve
      ctx.beginPath();
      ctx.moveTo(x - 20, y + 16);
      ctx.quadraticCurveTo(x - 36, y + 10, x - 48 - dir.x * 6, y + 4);
      ctx.quadraticCurveTo(x - 54 - dir.x * 8, y, x - 56 - dir.x * 10, y - 4);
      ctx.strokeStyle = tailG;
      ctx.lineWidth = 8;
      ctx.stroke();
      // Tail tip — thinner
      ctx.beginPath();
      ctx.moveTo(x - 56 - dir.x * 10, y - 4);
      ctx.lineTo(x - 62 - dir.x * 12, y - 10);
      ctx.strokeStyle = color(darken(spec.primary, 16));
      ctx.lineWidth = 4;
      ctx.stroke();
      // Tail spines
      for (let i = 0; i < 5; i++) {
        const tsx = x - 26 - i * 7 - dir.x * i * 1.2;
        const tsy = y + 12 - i * 3;
        triangle(ctx, tsx, tsy, tsx - 2, tsy - 8 - i, tsx + 3, tsy - 1, color(darken(spec.primary, 20)));
      }

      // Wings — membrane structure
      // Left wing
      const lwBaseX = x - 10;
      const lwBaseY = y + 2;
      const lwTipX = x - 38;
      const lwTipY = y - 22 - dFlap;
      const lwMidX = x - 30;
      const lwMidY = y - 8 - dFlap * 0.5;
      // Wing membrane gradient
      const wingG = ctx.createLinearGradient(lwBaseX, lwBaseY, lwTipX, lwTipY);
      wingG.addColorStop(0, color(spec.secondary, 0.8));
      wingG.addColorStop(0.3, color(lighten(spec.secondary, 10), 0.6));
      wingG.addColorStop(0.7, color(spec.secondary, 0.5));
      wingG.addColorStop(1, color(darken(spec.secondary, 10), 0.4));
      // Wing shape
      ctx.beginPath();
      ctx.moveTo(lwBaseX, lwBaseY);
      ctx.lineTo(lwTipX, lwTipY);
      ctx.lineTo(lwMidX - 8, lwMidY - 12 - dFlap * 0.3);
      ctx.lineTo(lwBaseX - 18, lwBaseY - 4 - dFlap * 0.2);
      ctx.lineTo(lwBaseX, lwBaseY + 10);
      ctx.closePath();
      ctx.fillStyle = wingG;
      ctx.fill();
      // Wing bone structure
      strokeLine(ctx, lwBaseX, lwBaseY, lwTipX, lwTipY, color(darken(spec.secondary, 16)), 2.5);
      strokeLine(ctx, lwBaseX, lwBaseY, lwMidX - 8, lwMidY - 12 - dFlap * 0.3, color(darken(spec.secondary, 12)), 2);
      strokeLine(ctx, lwBaseX, lwBaseY, lwBaseX - 18, lwBaseY - 4 - dFlap * 0.2, color(darken(spec.secondary, 12)), 1.5);
      // Wing membrane veins
      strokeLine(ctx, lwBaseX - 4, lwBaseY, lwTipX + 8, lwTipY + 6, color(darken(spec.secondary, 18), 0.4), 1);
      strokeLine(ctx, lwBaseX - 2, lwBaseY + 4, lwMidX - 4, lwMidY - 6 - dFlap * 0.3, color(darken(spec.secondary, 18), 0.4), 1);

      // Right wing
      const rwBaseX = x + 10;
      const rwTipX = x + 38;
      const rwTipY = y - 22 - dFlap;
      const rwMidX = x + 30;
      const rwMidY = y - 8 - dFlap * 0.5;
      ctx.beginPath();
      ctx.moveTo(rwBaseX, lwBaseY);
      ctx.lineTo(rwTipX, rwTipY);
      ctx.lineTo(rwMidX + 8, rwMidY - 12 - dFlap * 0.3);
      ctx.lineTo(rwBaseX + 18, lwBaseY - 4 - dFlap * 0.2);
      ctx.lineTo(rwBaseX, lwBaseY + 10);
      ctx.closePath();
      ctx.fillStyle = wingG;
      ctx.fill();
      strokeLine(ctx, rwBaseX, lwBaseY, rwTipX, rwTipY, color(darken(spec.secondary, 16)), 2.5);
      strokeLine(ctx, rwBaseX, lwBaseY, rwMidX + 8, rwMidY - 12 - dFlap * 0.3, color(darken(spec.secondary, 12)), 2);
      strokeLine(ctx, rwBaseX, lwBaseY, rwBaseX + 18, lwBaseY - 4 - dFlap * 0.2, color(darken(spec.secondary, 12)), 1.5);

      // Hind legs — powerful with claws
      roundRect(ctx, x - 16 + stride, y + 20, 10, 18, 4, color(darken(spec.primary, 8)));
      roundRect(ctx, x + 6 - stride, y + 20, 10, 18, 4, color(darken(spec.primary, 8)));
      // Clawed feet
      for (let ci = 0; ci < 3; ci++) {
        strokeLine(ctx, x - 14 + stride + ci * 3, y + 36, x - 16 + stride + ci * 3, y + 40, color(0xf0e8d0), 1.5);
        strokeLine(ctx, x + 8 - stride + ci * 3, y + 36, x + 6 - stride + ci * 3, y + 40, color(0xf0e8d0), 1.5);
      }

      // Main body — muscular, scaled
      const dBodyG = ctx.createRadialGradient(x - 4, y + 4, 10, x + 4, y + 16, 32);
      dBodyG.addColorStop(0, color(lighten(spec.primary, 20)));
      dBodyG.addColorStop(0.3, color(lighten(spec.primary, 8)));
      dBodyG.addColorStop(0.7, color(spec.primary));
      dBodyG.addColorStop(1, color(darken(spec.primary, 18)));
      ellipse(ctx, x, y + 14, 56, 30, dBodyG);

      // Scale pattern on body
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 6; col++) {
          const scX = x - 18 + col * 7 + (row % 2) * 3.5;
          const scY = y + 6 + row * 7;
          ellipse(ctx, scX, scY, 6, 4, color(darken(spec.primary, 8 + row * 4), 0.3));
          ellipse(ctx, scX, scY - 1, 5, 2, color(lighten(spec.primary, 6), 0.15));
        }
      }

      // Belly — lighter scaled
      ellipse(ctx, x, y + 20, 36, 14, color(lighten(spec.primary, 16), 0.4));
      // Belly scale ridges
      for (let i = 0; i < 4; i++) {
        const bsY = y + 16 + i * 3;
        ellipse(ctx, x, bsY, 28 - i * 4, 2, color(lighten(spec.primary, 20), 0.15));
      }

      // Neck — thick, muscular
      const neckG = ctx.createLinearGradient(x + 12, y, x + 26 + dir.x * 4, y - 12);
      neckG.addColorStop(0, color(spec.primary));
      neckG.addColorStop(1, color(lighten(spec.primary, 10)));
      roundRect(ctx, x + 10 + dir.x * 2, y - 6, 20, 18, 8, neckG);

      // Head — fearsome reptilian
      const dHeadG = ctx.createRadialGradient(x + 24 + dir.x * 5, y - 8, 6, x + 28 + dir.x * 5, y - 2, 16);
      dHeadG.addColorStop(0, color(lighten(spec.primary, 18)));
      dHeadG.addColorStop(0.5, color(spec.primary));
      dHeadG.addColorStop(1, color(darken(spec.primary, 14)));
      ellipse(ctx, x + 26 + dir.x * 5, y - 4, 24, 18, dHeadG);

      // Jaw
      ellipse(ctx, x + 30 + dir.x * 6, y + 2, 18, 10, color(darken(spec.primary, 8)));

      // Horns — swept back
      const hornG = ctx.createLinearGradient(0, y - 18, 0, y - 8);
      hornG.addColorStop(0, color(0xf0e8d0));
      hornG.addColorStop(1, color(darken(spec.primary, 10)));
      // Left horn
      ctx.beginPath();
      ctx.moveTo(x + 20 + dir.x * 4, y - 10);
      ctx.quadraticCurveTo(x + 14 + dir.x * 2, y - 22, x + 8, y - 28);
      ctx.strokeStyle = hornG;
      ctx.lineWidth = 3;
      ctx.stroke();
      // Right horn
      ctx.beginPath();
      ctx.moveTo(x + 28 + dir.x * 4, y - 10);
      ctx.quadraticCurveTo(x + 34 + dir.x * 6, y - 22, x + 38 + dir.x * 8, y - 28);
      ctx.strokeStyle = hornG;
      ctx.lineWidth = 3;
      ctx.stroke();
      // Horn tips
      circle(ctx, x + 8, y - 28, 1.5, color(0xffffff, 0.6));
      circle(ctx, x + 38 + dir.x * 8, y - 28, 1.5, color(0xffffff, 0.6));

      // Eyes — glowing, slit pupil
      circle(ctx, x + 22 + dir.x * 4, y - 8, 4, color(spec.tertiary));
      // Slit pupil
      ellipse(ctx, x + 22 + dir.x * 4, y - 8, 2, 6, color(0x000000, 0.8));
      // Eye glow
      circle(ctx, x + 22 + dir.x * 4, y - 8, 5.5, color(spec.tertiary, 0.2));
      circle(ctx, x + 21 + dir.x * 4, y - 9, 1, color(0xffffff, 0.7));

      // Nostrils with smoke
      circle(ctx, x + 34 + dir.x * 6, y - 4, 1.5, color(darken(spec.primary, 28)));
      circle(ctx, x + 36 + dir.x * 6, y - 2, 1.5, color(darken(spec.primary, 28)));

      // Teeth
      for (let ti = 0; ti < 4; ti++) {
        const toothX = x + 28 + dir.x * 5 + ti * 3;
        triangle(ctx, toothX, y + 5, toothX + 1.5, y + 9, toothX + 3, y + 5, color(0xf0e8d0));
      }

      // Body highlight
      ellipse(ctx, x - 8, y + 8, 20, 8, color(0xffffff, 0.1));

      // Attack: fire breath!
      if (spec.state === "attack" && swing > 4) {
        const fbX = x + 38 + dir.x * 8;
        const fbY = y - 2;
        // Fire cone gradient
        const fireG = ctx.createRadialGradient(fbX, fbY, 2, fbX + 20, fbY, 24 + swing);
        fireG.addColorStop(0, color(0xffffff, 0.7));
        fireG.addColorStop(0.2, color(0xffff44, 0.6));
        fireG.addColorStop(0.5, color(0xff6600, 0.5));
        fireG.addColorStop(0.8, color(0xff2200, 0.3));
        fireG.addColorStop(1, color(0xff0000, 0));
        // Fire shape
        ctx.beginPath();
        ctx.moveTo(fbX, fbY - 4);
        ctx.lineTo(fbX + 18 + swing, fbY - 10 - swing * 0.3);
        ctx.lineTo(fbX + 22 + swing * 1.2, fbY);
        ctx.lineTo(fbX + 18 + swing, fbY + 10 + swing * 0.3);
        ctx.lineTo(fbX, fbY + 4);
        ctx.closePath();
        ctx.fillStyle = fireG;
        ctx.fill();
        // Fire sparks
        for (let si = 0; si < 5; si++) {
          const sx2 = fbX + 10 + Math.random() * (12 + swing);
          const sy2 = fbY + (Math.random() - 0.5) * (16 + swing * 0.4);
          circle(ctx, sx2, sy2, 1 + Math.random(), color(0xffdd44, 0.5));
        }
      }

      // Front legs
      roundRect(ctx, x + 8 + stride * 0.5, y + 22, 8, 14, 3, color(spec.primary));
      roundRect(ctx, x + 18 - stride * 0.5, y + 22, 8, 14, 3, color(spec.primary));
      // Front claws
      for (let ci = 0; ci < 2; ci++) {
        strokeLine(ctx, x + 10 + stride * 0.5 + ci * 3, y + 34, x + 8 + stride * 0.5 + ci * 3, y + 38, color(0xf0e8d0), 1.5);
        strokeLine(ctx, x + 20 - stride * 0.5 + ci * 3, y + 34, x + 18 - stride * 0.5 + ci * 3, y + 38, color(0xf0e8d0), 1.5);
      }
      break;
    }
    case "golem": {
      // === Lineage Remaster Golem — massive stone construct with rune glow ===
      // Heavy ground shadow
      ellipse(ctx, x, y + 38, 64, 20, color(0x05080d, 0.35));
      ellipse(ctx, x, y + 39, 58, 16, color(0x05080d, 0.18));

      // Massive stone legs — blocky with cracks
      const gLegG = ctx.createLinearGradient(0, y + 16, 0, y + 38);
      gLegG.addColorStop(0, color(lighten(spec.primary, 8)));
      gLegG.addColorStop(0.5, color(spec.primary));
      gLegG.addColorStop(1, color(darken(spec.primary, 16)));
      roundRect(ctx, x - 18 + stride, y + 16, 14, 24, 5, gLegG);
      roundRect(ctx, x + 4 - stride, y + 16, 14, 24, 5, gLegG);
      // Leg cracks
      strokeLine(ctx, x - 14 + stride, y + 22, x - 10 + stride, y + 32, color(darken(spec.primary, 24), 0.6), 1.5);
      strokeLine(ctx, x + 8 - stride, y + 20, x + 12 - stride, y + 34, color(darken(spec.primary, 24), 0.6), 1.5);
      // Stone feet
      roundRect(ctx, x - 20 + stride, y + 36, 18, 8, 4, color(darken(spec.primary, 14)));
      roundRect(ctx, x + 2 - stride, y + 36, 18, 8, 4, color(darken(spec.primary, 14)));

      // Massive torso — layered stone blocks
      const gTorsoG = ctx.createRadialGradient(x - 6, y - 4, 10, x + 4, y + 12, 34);
      gTorsoG.addColorStop(0, color(lighten(spec.primary, 16)));
      gTorsoG.addColorStop(0.3, color(lighten(spec.primary, 6)));
      gTorsoG.addColorStop(0.7, color(spec.primary));
      gTorsoG.addColorStop(1, color(darken(spec.primary, 18)));
      roundRect(ctx, x - 24, y - 12, 48, 34, 12, gTorsoG);

      // Stone block texture
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 4; col++) {
          const bx = x - 20 + col * 11 + (row % 2) * 5;
          const by = y - 8 + row * 10;
          roundRect(ctx, bx, by, 10, 8, 2, color(darken(spec.primary, 4 + row * 3), 0.3));
          // Block highlight
          roundRect(ctx, bx, by, 10, 2, 1, color(lighten(spec.primary, 10), 0.15));
        }
      }

      // Crack patterns with ember glow
      strokeLine(ctx, x - 16, y - 6, x - 8, y + 8, color(darken(spec.primary, 28), 0.7), 2);
      strokeLine(ctx, x - 8, y + 8, x - 4, y + 16, color(darken(spec.primary, 28), 0.5), 1.5);
      strokeLine(ctx, x + 10, y - 4, x + 16, y + 12, color(darken(spec.primary, 28), 0.7), 2);
      // Ember glow in cracks
      strokeLine(ctx, x - 15, y - 5, x - 9, y + 7, color(spec.secondary, 0.3), 1);
      strokeLine(ctx, x + 11, y - 3, x + 15, y + 11, color(spec.secondary, 0.3), 1);

      // Glowing crystal core in chest
      const crystalG = ctx.createRadialGradient(x, y + 2, 2, x, y + 2, 12);
      crystalG.addColorStop(0, color(lighten(spec.secondary, 40), 0.9));
      crystalG.addColorStop(0.3, color(lighten(spec.secondary, 20), 0.7));
      crystalG.addColorStop(0.6, color(spec.secondary, 0.4));
      crystalG.addColorStop(1, color(spec.secondary, 0.1));
      circle(ctx, x, y + 2, 12, crystalG);
      // Crystal shape
      ctx.beginPath();
      ctx.moveTo(x, y - 6);
      ctx.lineTo(x + 6, y + 2);
      ctx.lineTo(x, y + 10);
      ctx.lineTo(x - 6, y + 2);
      ctx.closePath();
      ctx.fillStyle = color(lighten(spec.secondary, 30), 0.5);
      ctx.fill();
      // Crystal inner glow
      circle(ctx, x, y + 2, 3, color(0xffffff, 0.6));

      // Rune inscriptions on torso
      const runeGlow = color(spec.secondary, 0.4 + (spec.state === "attack" ? 0.3 : 0));
      // Left rune
      strokeLine(ctx, x - 16, y - 2, x - 12, y + 6, runeGlow, 1.5);
      strokeLine(ctx, x - 12, y + 6, x - 16, y + 10, runeGlow, 1.5);
      strokeLine(ctx, x - 14, y + 2, x - 10, y + 2, runeGlow, 1);
      // Right rune
      strokeLine(ctx, x + 16, y - 2, x + 12, y + 6, runeGlow, 1.5);
      strokeLine(ctx, x + 12, y + 6, x + 16, y + 10, runeGlow, 1.5);
      strokeLine(ctx, x + 14, y + 2, x + 10, y + 2, runeGlow, 1);

      // Massive arms — stone pillars
      const gArmG = ctx.createLinearGradient(0, y - 2, 0, y + 24);
      gArmG.addColorStop(0, color(lighten(spec.primary, 10)));
      gArmG.addColorStop(0.5, color(spec.primary));
      gArmG.addColorStop(1, color(darken(spec.primary, 14)));
      roundRect(ctx, x - 36, y - 2, 16, 28, 6, gArmG);
      roundRect(ctx, x + 20, y - 2, 16, 28, 6, gArmG);
      // Arm cracks
      strokeLine(ctx, x - 32, y + 4, x - 28, y + 18, color(darken(spec.primary, 22), 0.5), 1.5);
      strokeLine(ctx, x + 24, y + 6, x + 28, y + 20, color(darken(spec.primary, 22), 0.5), 1.5);
      // Rune on arm
      strokeLine(ctx, x - 30, y + 10, x - 26, y + 14, runeGlow, 1);
      strokeLine(ctx, x + 26, y + 10, x + 30, y + 14, runeGlow, 1);
      // Stone fists
      roundRect(ctx, x - 38 + swing * 0.4, y + 22, 20, 14, 6, color(darken(spec.primary, 6)));
      roundRect(ctx, x + 18 + swing * 0.4, y + 22, 20, 14, 6, color(darken(spec.primary, 6)));
      // Fist cracks
      strokeLine(ctx, x - 34 + swing * 0.4, y + 26, x - 26 + swing * 0.4, y + 30, color(darken(spec.primary, 20), 0.4), 1);

      // Shoulder boulders
      const shldrG = ctx.createRadialGradient(x - 28, y - 10, 4, x - 24, y - 4, 14);
      shldrG.addColorStop(0, color(lighten(spec.primary, 14)));
      shldrG.addColorStop(1, color(darken(spec.primary, 8)));
      circle(ctx, x - 28, y - 8, 12, shldrG);
      circle(ctx, x + 28, y - 8, 12, shldrG);
      // Moss on shoulders
      ellipse(ctx, x - 30, y - 14, 8, 4, color(0x4a6b3a, 0.4));
      ellipse(ctx, x + 26, y - 14, 6, 3, color(0x4a6b3a, 0.3));

      // Head — angular stone block
      const gHeadG = ctx.createRadialGradient(x - 4, y - 22, 6, x + 2, y - 14, 16);
      gHeadG.addColorStop(0, color(lighten(spec.primary, 14)));
      gHeadG.addColorStop(0.5, color(spec.primary));
      gHeadG.addColorStop(1, color(darken(spec.primary, 12)));
      roundRect(ctx, x - 16, y - 30, 32, 24, 8, gHeadG);

      // Glowing eyes — magical energy
      const eyeGlowG = ctx.createRadialGradient(x - 8, y - 20, 1, x - 8, y - 20, 6);
      eyeGlowG.addColorStop(0, color(lighten(spec.secondary, 40), 0.9));
      eyeGlowG.addColorStop(0.5, color(spec.secondary, 0.5));
      eyeGlowG.addColorStop(1, color(spec.secondary, 0.1));
      circle(ctx, x - 8, y - 20, 6, eyeGlowG);
      circle(ctx, x + 8, y - 20, 6, eyeGlowG);
      // Eye cores
      circle(ctx, x - 8, y - 20, 3, color(lighten(spec.secondary, 30)));
      circle(ctx, x + 8, y - 20, 3, color(lighten(spec.secondary, 30)));
      circle(ctx, x - 8, y - 20, 1.5, color(0xffffff, 0.8));
      circle(ctx, x + 8, y - 20, 1.5, color(0xffffff, 0.8));

      // Jaw line
      roundRect(ctx, x - 10, y - 12, 20, 6, 3, color(darken(spec.primary, 10)));

      // Attack: ground impact effect
      if (spec.state === "attack" && swing > 8) {
        for (let di = 0; di < 6; di++) {
          const dAngle = (di / 6) * Math.PI * 2;
          const dDist = 24 + swing * 0.6;
          const debX = x + Math.cos(dAngle) * dDist;
          const debY = y + 34 + Math.sin(dAngle) * 6;
          circle(ctx, debX, debY, 2 + Math.random() * 3, color(spec.primary, 0.4));
        }
        // Impact crack lines
        for (let ci = 0; ci < 4; ci++) {
          const cAngle = (ci / 4) * Math.PI - Math.PI / 2;
          const cLen = 12 + swing * 0.4;
          strokeLine(ctx, x, y + 38, x + Math.cos(cAngle) * cLen, y + 38 + Math.sin(cAngle) * 4, color(darken(spec.primary, 20), 0.5), 1.5);
        }
      }

      // Body highlight
      ellipse(ctx, x - 8, y + 2, 20, 10, color(0xffffff, 0.06));
      break;
    }
    case "skeleton": {
      // === Lineage Remaster Skeleton — undead warrior with soul fire ===
      // Shadow
      ellipse(ctx, x, y + 36, 48, 14, color(0x06080b, 0.25));
      ellipse(ctx, x, y + 37, 42, 10, color(0x06080b, 0.12));

      // Tattered cape remnants
      const capeG = ctx.createLinearGradient(x, y - 8, x, y + 30);
      capeG.addColorStop(0, color(darken(spec.accent, 20), 0.6));
      capeG.addColorStop(0.5, color(darken(spec.accent, 28), 0.4));
      capeG.addColorStop(1, color(darken(spec.accent, 28), 0.1));
      // Tattered edges
      triangle(ctx, x - 14, y + 28, x, y - 8, x + 2, y + 32, capeG);
      triangle(ctx, x + 14, y + 26, x, y - 8, x - 2, y + 30, capeG);
      triangle(ctx, x - 8, y + 34, x - 4, y + 6, x + 6, y + 30, capeG);

      // Leg bones with joints
      const boneColor = color(spec.primary);
      const boneShadow = color(darken(spec.primary, 14));
      const boneHighlight = color(lighten(spec.primary, 16));
      // Left leg — femur
      roundRect(ctx, x - 8 + stride, y + 24, 5, 14, 2, boneColor);
      // Left leg — tibia
      roundRect(ctx, x - 7 + stride, y + 36, 4, 12, 2, boneColor);
      // Left knee joint
      circle(ctx, x - 6 + stride, y + 37, 3, boneShadow);
      circle(ctx, x - 6 + stride, y + 37, 1.5, boneHighlight);
      // Left foot bones
      roundRect(ctx, x - 10 + stride, y + 46, 8, 3, 1, boneShadow);

      // Right leg
      roundRect(ctx, x + 3 - stride, y + 24, 5, 14, 2, boneColor);
      roundRect(ctx, x + 4 - stride, y + 36, 4, 12, 2, boneColor);
      circle(ctx, x + 5 - stride, y + 37, 3, boneShadow);
      circle(ctx, x + 5 - stride, y + 37, 1.5, boneHighlight);
      roundRect(ctx, x + 1 - stride, y + 46, 8, 3, 1, boneShadow);

      // Pelvis
      roundRect(ctx, x - 10, y + 22, 20, 6, 3, boneColor);
      ellipse(ctx, x, y + 23, 22, 8, color(spec.primary, 0.7));

      // Spine
      for (let vi = 0; vi < 6; vi++) {
        const vx = x;
        const vy = y + 20 - vi * 4;
        roundRect(ctx, vx - 3, vy, 6, 3, 1, boneColor);
        // Vertebrae detail
        circle(ctx, vx, vy + 1, 1, boneShadow);
      }

      // Rib cage
      for (let ri = 0; ri < 4; ri++) {
        const ribY = y + 6 - ri * 4;
        const ribWidth = 14 - ri * 1;
        // Left ribs
        ctx.beginPath();
        ctx.moveTo(x - 2, ribY);
        ctx.quadraticCurveTo(x - ribWidth - 2, ribY - 2, x - ribWidth, ribY + 4);
        ctx.strokeStyle = boneColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        // Right ribs
        ctx.beginPath();
        ctx.moveTo(x + 2, ribY);
        ctx.quadraticCurveTo(x + ribWidth + 2, ribY - 2, x + ribWidth, ribY + 4);
        ctx.strokeStyle = boneColor;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Shoulder bones
      roundRect(ctx, x - 18, y - 4, 36, 5, 2, boneColor);
      // Clavicle bumps
      circle(ctx, x - 16, y - 2, 3, boneShadow);
      circle(ctx, x + 16, y - 2, 3, boneShadow);

      // Arm bones
      // Left arm — humerus
      roundRect(ctx, x - 20, y + 0, 5, 16, 2, boneColor);
      // Left elbow
      circle(ctx, x - 18, y + 15, 2.5, boneShadow);
      // Left forearm — radius/ulna
      roundRect(ctx, x - 20, y + 14, 4, 14, 2, boneColor);
      roundRect(ctx, x - 18, y + 14, 4, 14, 2, color(spec.primary, 0.6));
      // Left hand bones
      for (let fi = 0; fi < 3; fi++) {
        strokeLine(ctx, x - 19 + fi * 2, y + 26, x - 20 + fi * 2, y + 32, boneColor, 1);
      }

      // Right arm
      roundRect(ctx, x + 15, y + 0, 5, 16, 2, boneColor);
      circle(ctx, x + 17, y + 15, 2.5, boneShadow);
      roundRect(ctx, x + 15, y + 14, 4, 14, 2, boneColor);
      roundRect(ctx, x + 17, y + 14, 4, 14, 2, color(spec.primary, 0.6));

      // Rusty sword in right hand
      const swordX = x + 20 + dir.x * 3 + swing * 0.6;
      const swordY = y + 2 - swing * 0.4;
      // Blade
      const rustG = ctx.createLinearGradient(swordX, swordY - 16, swordX + 4, swordY + 8);
      rustG.addColorStop(0, color(0x888070));
      rustG.addColorStop(0.3, color(0x7a6e5e));
      rustG.addColorStop(0.7, color(0x6b5f50));
      rustG.addColorStop(1, color(0x5d5346));
      roundRect(ctx, swordX, swordY - 16, 4, 24, 1, rustG);
      // Blade edge — partially rusted
      strokeLine(ctx, swordX + 4, swordY - 14, swordX + 4, swordY + 4, color(0xa09080, 0.5), 1);
      // Crossguard
      roundRect(ctx, swordX - 3, swordY + 6, 10, 3, 1, color(0x8b7355));
      // Handle
      roundRect(ctx, swordX, swordY + 8, 4, 10, 1, color(0x603d21));
      // Rust spots
      circle(ctx, swordX + 2, swordY - 8, 1.5, color(0x8b4513, 0.5));
      circle(ctx, swordX + 1, swordY - 2, 1, color(0x8b4513, 0.4));

      // Skull
      const skullG = ctx.createRadialGradient(x - 3, y - 14, 4, x + 2, y - 8, 14);
      skullG.addColorStop(0, color(lighten(spec.primary, 20)));
      skullG.addColorStop(0.5, color(spec.primary));
      skullG.addColorStop(1, color(darken(spec.primary, 14)));
      circle(ctx, x, y - 10, 14, skullG);

      // Cranium shape — slight elongation at top
      ellipse(ctx, x, y - 16, 22, 12, color(spec.primary, 0.5));

      // Eye sockets — dark with soul fire
      circle(ctx, x - 6, y - 12, 4, color(0x111111, 0.9));
      circle(ctx, x + 6, y - 12, 4, color(0x111111, 0.9));
      // Soul fire in eyes
      const eyeFireG = ctx.createRadialGradient(x - 6, y - 12, 0, x - 6, y - 12, 3.5);
      eyeFireG.addColorStop(0, color(lighten(spec.accent, 40), 0.9));
      eyeFireG.addColorStop(0.4, color(spec.accent, 0.7));
      eyeFireG.addColorStop(1, color(spec.accent, 0.2));
      circle(ctx, x - 6, y - 12, 3.5, eyeFireG);
      circle(ctx, x + 6, y - 12, 3.5, eyeFireG);
      // Eye fire flickers
      triangle(ctx, x - 7, y - 14, x - 6, y - 18 - Math.sin(spec.frame) * 2, x - 5, y - 14, color(spec.accent, 0.4));
      triangle(ctx, x + 5, y - 14, x + 6, y - 18 - Math.cos(spec.frame) * 2, x + 7, y - 14, color(spec.accent, 0.4));

      // Nose cavity
      triangle(ctx, x - 2, y - 8, x + 2, y - 8, x, y - 4, color(0x111111, 0.7));

      // Jaw with teeth
      roundRect(ctx, x - 8, y - 4, 16, 5, 2, color(darken(spec.primary, 6)));
      // Upper teeth
      for (let ti = 0; ti < 5; ti++) {
        roundRect(ctx, x - 7 + ti * 3, y - 4, 2, 3, 0.5, boneHighlight);
      }
      // Lower jaw — slightly open
      roundRect(ctx, x - 7, y + 1, 14, 4, 2, color(darken(spec.primary, 10)));
      // Lower teeth
      for (let ti = 0; ti < 4; ti++) {
        roundRect(ctx, x - 6 + ti * 3, y, 2, 2, 0.5, boneHighlight);
      }

      // Armor remnants on shoulder
      roundRect(ctx, x - 20, y - 6, 10, 8, 2, color(darken(spec.accent, 16), 0.5));
      strokeLine(ctx, x - 20, y - 6, x - 10, y - 6, color(spec.accent, 0.3), 1);

      // Overall skeleton glow in attack
      if (spec.state === "attack") {
        circle(ctx, x, y + 6, 28, color(spec.accent, 0.06));
      }
      break;
    }
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

  const depthTilt = dir.y < 0 ? -4 : dir.y > 0 ? 3 : 0;
  const sideReach = Math.abs(dir.x) > 0 ? 5 : 0;

  if (weapon === "dagger") {
    // Enhanced dagger with metallic gradient
    const daggerHandleGrad = ctx.createLinearGradient(0, y - 2, 0, y + 10);
    daggerHandleGrad.addColorStop(0, color(lighten(0xc28b47, 12)));
    daggerHandleGrad.addColorStop(0.5, color(0xc28b47));
    daggerHandleGrad.addColorStop(1, color(darken(0xc28b47, 8)));

    roundRect(
      ctx,
      x + 15 + dir.x * 4 + sideReach,
      y + 1 + depthTilt - swing * 0.55,
      4,
      12,
      2,
      daggerHandleGrad,
    );

    // Blade with metallic shine
    const bladeGrad = ctx.createLinearGradient(
      x + 19 + dir.x * 4,
      y - 6 + depthTilt - swing * 0.55,
      x + 31 + dir.x * 5,
      y - 2 + depthTilt - swing * 0.55,
    );
    bladeGrad.addColorStop(0, color(0xffffff, 0.9));
    bladeGrad.addColorStop(0.3, color(0xe4edf2));
    bladeGrad.addColorStop(0.7, color(0xd0dde5));
    bladeGrad.addColorStop(1, color(0xbcc9d3));

    triangle(
      ctx,
      x + 19 + dir.x * 4 + sideReach,
      y - 6 + depthTilt - swing * 0.55,
      x + 31 + dir.x * 5 + sideReach,
      y - 2 + depthTilt - swing * 0.55,
      x + 19 + dir.x * 4 + sideReach,
      y + 2 + depthTilt - swing * 0.55,
      bladeGrad,
    );

    // Gem-inlaid hilt
    const hiltGrad = ctx.createRadialGradient(
      x + 17 + dir.x * 4,
      y - 1 + depthTilt - swing * 0.55,
      2,
      x + 17 + dir.x * 4,
      y - 1 + depthTilt - swing * 0.55,
      6,
    );
    hiltGrad.addColorStop(0, color(lighten(accent, 20)));
    hiltGrad.addColorStop(0.7, color(accent));
    hiltGrad.addColorStop(1, color(darken(accent, 12)));

    roundRect(
      ctx,
      x + 13 + dir.x * 4 + sideReach,
      y - 1 + depthTilt - swing * 0.55,
      9,
      4,
      2,
      hiltGrad,
    );

    // Blade edge highlight
    strokeLine(
      ctx,
      x + 20 + dir.x * 4 + sideReach,
      y - 4 + depthTilt - swing * 0.55,
      x + 29 + dir.x * 5 + sideReach,
      y - 2 + depthTilt - swing * 0.55,
      color(0xffffff, 0.7),
      1,
    );
  } else if (weapon === "greatsword") {
    // Enhanced greatsword with better proportions
    const gsHandleGrad = ctx.createLinearGradient(0, y - 6, 0, y + 12);
    gsHandleGrad.addColorStop(0, color(lighten(0xb9853d, 16)));
    gsHandleGrad.addColorStop(0.5, color(0xb9853d));
    gsHandleGrad.addColorStop(1, color(darken(0xb9853d, 12)));

    roundRect(
      ctx,
      x + 12 + dir.x * 6 + sideReach,
      y - 6 + depthTilt - swing * 1.1,
      6,
      18,
      2,
      gsHandleGrad,
    );

    // Massive blade with multiple highlight layers
    const gsBladeGrad = ctx.createLinearGradient(
      x + 18 + dir.x * 6,
      y - 28 + depthTilt - swing * 1.1,
      x + 46 + dir.x * 9,
      y - 15 + depthTilt - swing * 1.1,
    );
    gsBladeGrad.addColorStop(0, color(0xffffff, 0.95));
    gsBladeGrad.addColorStop(0.2, color(0xf0f5fa));
    gsBladeGrad.addColorStop(0.5, color(0xe2ebf0));
    gsBladeGrad.addColorStop(0.8, color(0xd4dde5));
    gsBladeGrad.addColorStop(1, color(0xc6cfda));

    triangle(
      ctx,
      x + 18 + dir.x * 6 + sideReach,
      y - 28 + depthTilt - swing * 1.1,
      x + 46 + dir.x * 9 + sideReach,
      y - 15 + depthTilt - swing * 1.1,
      x + 18 + dir.x * 6 + sideReach,
      y - 2 + depthTilt - swing * 1.1,
      gsBladeGrad,
    );

    // Central ridge on blade
    strokeLine(
      ctx,
      x + 20 + dir.x * 6 + sideReach,
      y - 24 + depthTilt - swing * 1.1,
      x + 40 + dir.x * 8 + sideReach,
      y - 12 + depthTilt - swing * 1.1,
      color(0xffffff, 0.6),
      1.5,
    );

    // Enhanced crossguard with gems
    const guardGrad = ctx.createRadialGradient(
      x + 15 + dir.x * 6,
      y - 1 + depthTilt - swing * 1.1,
      3,
      x + 15 + dir.x * 6,
      y - 1 + depthTilt - swing * 1.1,
      8,
    );
    guardGrad.addColorStop(0, color(lighten(accent, 24)));
    guardGrad.addColorStop(0.5, color(accent));
    guardGrad.addColorStop(1, color(darken(accent, 16)));

    roundRect(
      ctx,
      x + 8 + dir.x * 6 + sideReach,
      y - 4 + depthTilt - swing * 1.1,
      14,
      6,
      2,
      guardGrad,
    );
  } else if (weapon === "sword" || weapon === "blade") {
    // Standard sword with metallic gradient
    const swordHandleGrad = ctx.createLinearGradient(0, y - 2, 0, y + 12);
    swordHandleGrad.addColorStop(0, color(lighten(0xc79a4e, 12)));
    swordHandleGrad.addColorStop(0.5, color(0xc79a4e));
    swordHandleGrad.addColorStop(1, color(darken(0xc79a4e, 8)));

    roundRect(
      ctx,
      x + 13 + dir.x * 5 + sideReach,
      y - 2 + depthTilt - swing,
      5,
      14,
      2,
      swordHandleGrad,
    );

    // Blade with perspective-based shine
    const swordBladeGrad = ctx.createLinearGradient(
      x + 18 + dir.x * 5,
      y - 18 + depthTilt - swing,
      x + 38 + dir.x * 7,
      y - 9 + depthTilt - swing,
    );
    swordBladeGrad.addColorStop(0, color(0xffffff, 0.9));
    swordBladeGrad.addColorStop(0.3, color(0xe2ebf0));
    swordBladeGrad.addColorStop(0.7, color(0xd4dde5));
    swordBladeGrad.addColorStop(1, color(0xc6cfda));

    triangle(
      ctx,
      x + 18 + dir.x * 5 + sideReach,
      y - 18 + depthTilt - swing,
      x + 38 + dir.x * 7 + sideReach,
      y - 9 + depthTilt - swing,
      x + 18 + dir.x * 5 + sideReach,
      y - 1 + depthTilt - swing,
      swordBladeGrad,
    );

    // Enhanced crossguard
    const swordGuardGrad = ctx.createRadialGradient(
      x + 16 + dir.x * 5,
      y - 1 + depthTilt - swing,
      2,
      x + 16 + dir.x * 5,
      y - 1 + depthTilt - swing,
      6,
    );
    swordGuardGrad.addColorStop(0, color(lighten(accent, 20)));
    swordGuardGrad.addColorStop(0.7, color(accent));
    swordGuardGrad.addColorStop(1, color(darken(accent, 12)));

    roundRect(
      ctx,
      x + 11 + dir.x * 5 + sideReach,
      y - 3 + depthTilt - swing,
      10,
      5,
      2,
      swordGuardGrad,
    );
  } else if (weapon === "bow") {
    const bx = x + 24 + dir.x * 4 + sideReach;

    // Enhanced bow with wood grain
    const bowGrad = ctx.createLinearGradient(bx - 8, y - 14, bx + 8, y + 20);
    bowGrad.addColorStop(0, color(lighten(0x7a4c1d, 8)));
    bowGrad.addColorStop(0.5, color(0x7a4c1d));
    bowGrad.addColorStop(1, color(darken(0x7a4c1d, 8)));

    // Draw bow body with gradient
    ctx.beginPath();
    ctx.ellipse(bx, y + 3, 8, 17, 0, 0, Math.PI * 2);
    ctx.strokeStyle = bowGrad;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Wood grain details
    strokeEllipse(ctx, bx, y + 3, 12, 30, color(darken(0x7a4c1d, 12), 0.5), 1);

    if (swing < -2) {
      // Enhanced arrow nocking animation
      const pull = Math.min(8, Math.abs(swing) * 0.45);
      strokeLine(ctx, bx, y - 14, bx - pull, y + 3, color(0xdac9ab, 0.9), 2);
      strokeLine(ctx, bx - pull, y + 3, bx, y + 20, color(0xdac9ab, 0.9), 2);

      // Detailed arrow with fletching
      strokeLine(
        ctx,
        x + 6 + dir.x * 2,
        y + 3,
        bx - pull,
        y + 3,
        color(0x8b7340),
        2,
      );
      // Arrow head
      triangle(
        ctx,
        bx - pull,
        y + 3,
        bx - pull + 4,
        y + 1,
        bx - pull + 4,
        y + 5,
        color(0xc0c0c0),
      );
      // Fletching
      triangle(
        ctx,
        x + 6 + dir.x * 2,
        y + 1,
        x + 2 + dir.x * 2,
        y + 3,
        x + 6 + dir.x * 2,
        y + 5,
        color(0x654321),
      );
    } else if (swing > 2) {
      // Arrow in flight with motion blur
      strokeLine(ctx, bx, y - 14, bx, y + 20, color(0xdac9ab, 0.9), 2);
      strokeLine(
        ctx,
        bx + 4,
        y + 2,
        bx + 14 + swing,
        y - 1,
        color(0x8b7340, 0.6 - swing * 0.02),
        2,
      );
    } else {
      // Relaxed bow
      strokeLine(ctx, bx, y - 14, bx, y + 20, color(0xdac9ab, 0.9), 2);
    }
  } else if (weapon === "staff") {
    const sx = x + 18 + dir.x * 4 + sideReach;

    // Enhanced staff with wood details
    const staffGrad = ctx.createLinearGradient(0, y - 16, 0, y + 18);
    staffGrad.addColorStop(0, color(lighten(0x7a4c1d, 12)));
    staffGrad.addColorStop(0.5, color(0x7a4c1d));
    staffGrad.addColorStop(1, color(darken(0x7a4c1d, 8)));

    roundRect(ctx, sx, y - 16 + depthTilt - swing * 0.4, 4, 34, 2, staffGrad);

    // Staff rings and details
    for (let i = 0; i < 3; i++) {
      const ringY = y - 8 + i * 8 + depthTilt - swing * 0.4;
      roundRect(ctx, sx - 1, ringY, 6, 2, 1, color(accent, 0.8));
    }

    // Enhanced magical orb with multiple layers
    const orbCenterY = y - 20 + depthTilt - swing * 0.4;

    // Outer glow based on swing intensity
    const glowR = 12 + swing * 0.4;
    const orbGlow = ctx.createRadialGradient(
      sx + 2,
      orbCenterY,
      0,
      sx + 2,
      orbCenterY,
      glowR,
    );
    orbGlow.addColorStop(0, color(0x8cc7ff, 0.3 + swing * 0.02));
    orbGlow.addColorStop(0.5, color(0x8cc7ff, 0.15 + swing * 0.01));
    orbGlow.addColorStop(1, color(0x8cc7ff, 0.05));

    circle(ctx, sx + 2, orbCenterY, glowR, orbGlow);

    // Main orb with magical shimmer
    const orbGrad = ctx.createRadialGradient(
      sx,
      orbCenterY - 2,
      2,
      sx + 2,
      orbCenterY,
      6,
    );
    orbGrad.addColorStop(0, color(lighten(0x8cc7ff, 40)));
    orbGrad.addColorStop(0.4, color(0x8cc7ff));
    orbGrad.addColorStop(1, color(darken(0x8cc7ff, 20)));

    circle(ctx, sx + 2, orbCenterY, 5, orbGrad);

    // Inner core
    circle(ctx, sx + 2, orbCenterY, 2.5, color(0xffffff, 0.8));

    // Magical particles for high swing values
    if (swing > 8) {
      for (let i = 0; i < 5; i++) {
        const particleAngle = (i / 5) * Math.PI * 2 + swing * 0.1;
        const particleDistance = 8 + Math.sin(swing * 0.2 + i) * 4;
        const particleX = sx + 2 + Math.cos(particleAngle) * particleDistance;
        const particleY =
          orbCenterY + Math.sin(particleAngle) * particleDistance * 0.5;
        circle(
          ctx,
          particleX,
          particleY,
          1 + Math.random(),
          color(0xffffff, 0.6),
        );
      }
    }
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
  ctx.ellipse(
    x,
    y,
    Math.max(0.1, w / 2),
    Math.max(0.1, h / 2),
    0,
    0,
    Math.PI * 2,
  );
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
  ctx.ellipse(
    x,
    y,
    Math.max(0.1, w / 2),
    Math.max(0.1, h / 2),
    0,
    0,
    Math.PI * 2,
  );
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
  ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2);
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
