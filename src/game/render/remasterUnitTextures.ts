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
      [0, 1, 2].forEach((frame) =>
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
    case "orc":
      ellipse(ctx, x, y + 31, 48, 12, color(0x05080d, 0.24));
      roundRect(ctx, x - 18, y - 2, 36, 28, 10, color(spec.primary));
      ellipse(ctx, x, y + 19, 40, 22, color(spec.secondary));
      circle(ctx, x - 8 + dir.x * 2, y + 4, 3, color(spec.secondary));
      circle(ctx, x + 8 + dir.x * 2, y + 4, 3, color(spec.secondary));
      roundRect(ctx, x - 10 + swing / 2, y + 18, 6, 5, 2, color(0xe8e4cd));
      roundRect(ctx, x + 4 + swing / 2, y + 18, 6, 5, 2, color(0xe8e4cd));
      roundRect(ctx, x - 12, y + 4, 24, 4, 2, color(0xffffff, 0.1));
      triangle(
        ctx,
        x - 14,
        y + 9,
        x - 24,
        y + 2,
        x - 18,
        y + 16,
        color(darken(spec.secondary, 12)),
      );
      triangle(
        ctx,
        x + 14,
        y + 9,
        x + 24,
        y + 2,
        x + 18,
        y + 16,
        color(darken(spec.secondary, 12)),
      );
      break;
    case "boar":
      ellipse(ctx, x, y + 31, 50, 12, color(0x07090c, 0.24));
      ellipse(ctx, x - 4, y + 17, 48, 24, color(spec.primary));
      ellipse(ctx, x + 22 + dir.x * 3, y + 16, 25, 16, color(spec.secondary));
      roundRect(ctx, x + 26 + dir.x * 3, y + 14, 8, 3, 2, color(0xf3dfc5));
      roundRect(ctx, x + 26 + dir.x * 3, y + 18, 8, 3, 2, color(0xf3dfc5));
      ellipse(ctx, x + 4, y + 11, 16, 6, color(0xffffff, 0.14));
      triangle(
        ctx,
        x - 18,
        y + 5,
        x - 24,
        y - 8,
        x - 10,
        y - 2,
        color(darken(spec.primary, 18)),
      );
      triangle(
        ctx,
        x - 6,
        y + 2,
        x - 16,
        y - 10,
        x + 2,
        y - 4,
        color(darken(spec.primary, 10)),
      );
      break;
    case "wisp":
      circle(ctx, x, y + 4, 34 + swing * 0.5, color(spec.secondary, 0.12));
      circle(ctx, x, y, 20 + swing * 0.25, color(spec.primary, 0.9));
      circle(ctx, x, y, 31 + swing * 0.35, color(spec.secondary, 0.45));
      triangle(
        ctx,
        x - 9,
        y + 16,
        x + 9,
        y + 16,
        x,
        y + 40,
        color(spec.primary, 0.58),
      );
      circle(ctx, x - 5, y - 7, 6, color(0xffffff, 0.32));
      circle(ctx, x + 7, y - 2, 3, color(0xffffff, 0.2));
      break;
    case "dragon":
      ellipse(ctx, x, y + 31, 58, 13, color(0x08090e, 0.28));
      ellipse(ctx, x - 2, y + 14, 52, 28, color(spec.primary));
      triangle(
        ctx,
        x - 12,
        y + 0,
        x - 28,
        y - 18,
        x - 2,
        y + 6,
        color(spec.secondary),
      );
      triangle(
        ctx,
        x + 14,
        y + 0,
        x + 30,
        y - 18,
        x + 2,
        y + 6,
        color(spec.secondary),
      );
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
      triangle(
        ctx,
        x - 30,
        y + 10,
        x - 48,
        y + 2,
        x - 30,
        y + 22,
        color(darken(spec.primary, 18)),
      );
      break;
    case "golem":
      ellipse(ctx, x, y + 31, 52, 12, color(0x05080d, 0.28));
      roundRect(ctx, x - 20, y - 2, 40, 30, 10, color(spec.primary));
      circle(ctx, x - 7, y + 6, 3.2, color(spec.secondary));
      circle(ctx, x + 7, y + 6, 3.2, color(spec.secondary));
      roundRect(ctx, x - 27, y + 8, 10, 20, 4, color(spec.primary));
      roundRect(ctx, x + 17, y + 8, 10, 20, 4, color(spec.primary));
      roundRect(ctx, x - 14, y + 3, 20, 6, 3, color(0xffffff, 0.08));
      circle(ctx, x - 7, y + 6, 6, color(spec.secondary, 0.18));
      circle(ctx, x + 7, y + 6, 6, color(spec.secondary, 0.18));
      break;
    case "skeleton":
      ellipse(ctx, x, y + 33, 42, 11, color(0x06080b, 0.2));
      circle(ctx, x, y - 3, 13, color(spec.primary));
      roundRect(ctx, x - 12, y + 10, 24, 22, 6, color(spec.primary));
      roundRect(ctx, x - 18, y + 10, 5, 20, 2, color(spec.primary));
      roundRect(ctx, x + 13, y + 10, 5, 20, 2, color(spec.primary));
      roundRect(ctx, x - 7 + stride, y + 31, 4, 18, 2, color(spec.primary));
      roundRect(ctx, x + 3 - stride, y + 31, 4, 18, 2, color(spec.primary));
      roundRect(
        ctx,
        x + 16 + dir.x * 3,
        y + 5,
        16,
        4,
        2,
        color(spec.secondary),
      );
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
