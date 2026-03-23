/**
 * improve-props.mjs
 * Extract and compose prop sprites from the Kenney Roguelike spritesheet.
 * Replaces the solid-color block props with actual pixel art.
 *
 * Source: Kenney Roguelike pack (CC0) - 968x526, 16x16 tiles, 1px margin (17px grid)
 */
import sharp from 'sharp';
import path from 'path';

const SPRITESHEET = 'public/game-assets/remaster/downloads/kenney_roguelike/Spritesheet/roguelikeSheet_transparent.png';
const OUTPUT_DIR = 'public/game-assets/remaster/props';
const TILE = 16;
const GRID = 17; // 16px tile + 1px margin
const OUT_SIZE = 64;

/**
 * Extract a single 16x16 tile from the spritesheet
 */
async function extractTile(srcBuffer, row, col) {
  const x = col * GRID;
  const y = row * GRID;
  return sharp(srcBuffer)
    .extract({ left: x, top: y, width: TILE, height: TILE })
    .raw()
    .toBuffer({ resolveWithObject: true });
}

/**
 * Extract a tile and return as a sharp instance (16x16)
 */
async function extractTileSharp(srcBuffer, row, col) {
  const x = col * GRID;
  const y = row * GRID;
  return sharp(srcBuffer)
    .extract({ left: x, top: y, width: TILE, height: TILE })
    .toBuffer();
}

/**
 * Compose multiple tiles vertically (top-to-bottom) into a single image,
 * then resize to OUT_SIZE x OUT_SIZE
 */
async function composeVertical(srcBuffer, tiles, outputWidth = TILE, outputHeight = null) {
  if (!outputHeight) outputHeight = tiles.length * TILE;
  const height = tiles.length * TILE;

  // Create canvas
  const canvas = Buffer.alloc(outputWidth * height * 4, 0);

  for (let i = 0; i < tiles.length; i++) {
    const [row, col] = tiles[i];
    const { data } = await extractTile(srcBuffer, row, col);
    const yOff = i * TILE;
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const srcIdx = (y * TILE + x) * 4;
        const dstIdx = ((yOff + y) * outputWidth + x) * 4;
        canvas[dstIdx] = data[srcIdx];
        canvas[dstIdx + 1] = data[srcIdx + 1];
        canvas[dstIdx + 2] = data[srcIdx + 2];
        canvas[dstIdx + 3] = data[srcIdx + 3];
      }
    }
  }

  return sharp(canvas, { raw: { width: outputWidth, height, channels: 4 } })
    .resize(OUT_SIZE, OUT_SIZE, { kernel: 'nearest' })
    .png()
    .toBuffer();
}

/**
 * Compose a 2x2 grid of tiles (32x32) then resize to 64x64
 */
async function compose2x2(srcBuffer, tiles) {
  // tiles = [[topLeft], [topRight], [bottomLeft], [bottomRight]]
  // Each is [row, col] or null for empty
  const size = TILE * 2;
  const canvas = Buffer.alloc(size * size * 4, 0);

  const positions = [
    { dx: 0, dy: 0 },           // top-left
    { dx: TILE, dy: 0 },        // top-right
    { dx: 0, dy: TILE },        // bottom-left
    { dx: TILE, dy: TILE },     // bottom-right
  ];

  for (let i = 0; i < tiles.length; i++) {
    if (!tiles[i]) continue;
    const [row, col] = tiles[i];
    const { data } = await extractTile(srcBuffer, row, col);
    const { dx, dy } = positions[i];
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const srcIdx = (y * TILE + x) * 4;
        const dstIdx = ((dy + y) * size + (dx + x)) * 4;
        canvas[dstIdx] = data[srcIdx];
        canvas[dstIdx + 1] = data[srcIdx + 1];
        canvas[dstIdx + 2] = data[srcIdx + 2];
        canvas[dstIdx + 3] = data[srcIdx + 3];
      }
    }
  }

  return sharp(canvas, { raw: { width: size, height: size, channels: 4 } })
    .resize(OUT_SIZE, OUT_SIZE, { kernel: 'nearest' })
    .png()
    .toBuffer();
}

/**
 * Extract a single tile and resize to 64x64
 */
async function singleTile(srcBuffer, row, col) {
  const x = col * GRID;
  const y = row * GRID;
  return sharp(srcBuffer)
    .extract({ left: x, top: y, width: TILE, height: TILE })
    .resize(OUT_SIZE, OUT_SIZE, { kernel: 'nearest' })
    .png()
    .toBuffer();
}

/**
 * Recolor a buffer: shift hue by remapping channels
 */
async function recolorToRed(buffer) {
  const { data, info } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.from(data);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Swap: green -> red channel mapping
    // Original green pixels become red
    out[i] = Math.min(255, Math.round(g * 1.3 + r * 0.3));     // R
    out[i + 1] = Math.min(255, Math.round(r * 0.4 + b * 0.2)); // G
    out[i + 2] = Math.min(255, Math.round(b * 0.5));            // B
    out[i + 3] = data[i + 3]; // alpha unchanged
  }

  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer();
}

/**
 * Create a rock sprite by painting pixels procedurally on a 16x16 canvas
 * using colors sampled from the spritesheet's gray tones
 */
function createRockPixels(size, variant) {
  const canvas = Buffer.alloc(size * size * 4, 0);

  // Rock colors from Kenney palette
  const colors = {
    dark: [100, 100, 100],
    mid: [140, 140, 140],
    light: [170, 170, 170],
    highlight: [190, 190, 190],
  };

  function setPixel(x, y, color, alpha = 255) {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const idx = (y * size + x) * 4;
    canvas[idx] = color[0];
    canvas[idx + 1] = color[1];
    canvas[idx + 2] = color[2];
    canvas[idx + 3] = alpha;
  }

  if (variant === 'medium') {
    // Medium rock - roughly oval, bottom-heavy
    // Row-by-row pixel pattern for a 16x16 rock
    const rows = [
      //        startX, endX
      [6, 10],   // y=4
      [5, 11],   // y=5
      [4, 12],   // y=6
      [3, 13],   // y=7
      [2, 14],   // y=8
      [2, 14],   // y=9
      [2, 14],   // y=10
      [3, 13],   // y=11
      [3, 13],   // y=12
      [4, 12],   // y=13
      [5, 11],   // y=14
    ];
    for (let ri = 0; ri < rows.length; ri++) {
      const y = ri + 4;
      const [sx, ex] = rows[ri];
      for (let x = sx; x < ex; x++) {
        let c;
        if (ri < 2) c = colors.highlight;
        else if (x === sx || x === ex - 1) c = colors.dark;
        else if (ri < 4) c = colors.light;
        else if (ri < 7) c = colors.mid;
        else c = colors.dark;
        setPixel(x, y, c);
      }
    }
    // Add highlight crack
    setPixel(7, 7, colors.highlight);
    setPixel(8, 8, colors.highlight);
    setPixel(9, 7, colors.light);
  } else if (variant === 'small') {
    // Small rock - just a few pixels
    const rows = [
      [6, 10],  // y=8
      [5, 11],  // y=9
      [5, 11],  // y=10
      [5, 11],  // y=11
      [6, 10],  // y=12
    ];
    for (let ri = 0; ri < rows.length; ri++) {
      const y = ri + 8;
      const [sx, ex] = rows[ri];
      for (let x = sx; x < ex; x++) {
        let c = ri === 0 ? colors.highlight : ri < 3 ? colors.mid : colors.dark;
        if (x === sx || x === ex - 1) c = colors.dark;
        setPixel(x, y, c);
      }
    }
  } else if (variant === 'large') {
    // Large rock - big boulder filling most of 16x16
    const rows = [
      [5, 11],   // y=2
      [4, 12],   // y=3
      [3, 13],   // y=4
      [2, 14],   // y=5
      [1, 15],   // y=6
      [1, 15],   // y=7
      [1, 15],   // y=8
      [1, 15],   // y=9
      [1, 15],   // y=10
      [2, 14],   // y=11
      [2, 14],   // y=12
      [3, 13],   // y=13
      [4, 12],   // y=14
    ];
    for (let ri = 0; ri < rows.length; ri++) {
      const y = ri + 2;
      const [sx, ex] = rows[ri];
      for (let x = sx; x < ex; x++) {
        let c;
        if (x === sx || x === ex - 1) c = colors.dark;
        else if (ri < 3) c = colors.highlight;
        else if (ri < 6) c = colors.light;
        else if (ri < 9) c = colors.mid;
        else c = colors.dark;
        setPixel(x, y, c);
      }
    }
    // Highlight details
    setPixel(6, 5, colors.highlight);
    setPixel(7, 5, colors.highlight);
    setPixel(10, 7, colors.highlight);
    // Shadow crack
    setPixel(8, 9, colors.dark);
    setPixel(9, 10, colors.dark);
  }

  return canvas;
}

/**
 * Create a crystal sprite with a diamond/gem shape
 */
function createCrystalPixels(size) {
  const canvas = Buffer.alloc(size * size * 4, 0);

  const colors = {
    dark: [30, 80, 160],
    mid: [60, 140, 220],
    light: [100, 180, 255],
    highlight: [180, 220, 255],
    glow: [140, 200, 255],
  };

  function setPixel(x, y, color, alpha = 255) {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const idx = (y * size + x) * 4;
    canvas[idx] = color[0];
    canvas[idx + 1] = color[1];
    canvas[idx + 2] = color[2];
    canvas[idx + 3] = alpha;
  }

  // Diamond/crystal shape - pointed top, faceted
  // Top crystal spike
  const spike = [
    [7, 8],     // y=1
    [6, 9],     // y=2
    [6, 10],    // y=3
    [5, 10],    // y=4
    [5, 11],    // y=5
    [5, 11],    // y=6
    [4, 12],    // y=7
    [4, 12],    // y=8
    [4, 12],    // y=9
    [5, 11],    // y=10
    [5, 11],    // y=11
    [6, 10],    // y=12
    [7, 9],     // y=13
  ];

  for (let ri = 0; ri < spike.length; ri++) {
    const y = ri + 1;
    const [sx, ex] = spike[ri];
    for (let x = sx; x < ex; x++) {
      let c;
      const mid = (sx + ex) / 2;
      if (x === sx || x === ex - 1) c = colors.dark;
      else if (ri < 3) c = colors.highlight;
      else if (x < mid) c = colors.light;
      else c = colors.mid;
      setPixel(x, y, c);
    }
  }

  // Inner highlight facet
  setPixel(7, 4, colors.highlight);
  setPixel(7, 5, colors.highlight);
  setPixel(8, 3, colors.highlight);

  // Glow pixels around base
  setPixel(4, 10, colors.glow, 128);
  setPixel(12, 10, colors.glow, 128);
  setPixel(3, 8, colors.glow, 80);
  setPixel(13, 8, colors.glow, 80);

  return canvas;
}

async function main() {
  console.log('Loading spritesheet...');
  const srcBuffer = await sharp(SPRITESHEET).toBuffer();

  const outputs = {};

  // ============================================
  // TREES - Using vertical composition (canopy + trunk)
  // ============================================

  // prop_tree (generic deciduous) - vertical: canopy on top of trunk
  console.log('Creating prop_tree...');
  outputs['prop_tree'] = await composeVertical(srcBuffer, [
    [9, 26], // green bush/canopy (cactus-like but reads as treetop)
    [10, 27], // trunk with branches
  ]);

  // prop_tree_pine - triangular pine tree
  // Compose vertically: pine top + pine body for tall pine
  console.log('Creating prop_tree_pine...');
  outputs['prop_tree_pine'] = await composeVertical(srcBuffer, [
    [9, 16], // green pine tree (top portion)
    [7, 16], // bare trunk (bottom portion)
  ]);

  // prop_tree_oak - big round oak (single tile, nicely detailed)
  console.log('Creating prop_tree_oak...');
  outputs['prop_tree_oak'] = await singleTile(srcBuffer, 9, 15);

  // prop_tree_dead - dead/bare tree
  // row 9, col 27 is bare branching tree top, row 10 col 27 is trunk with branches
  console.log('Creating prop_tree_dead...');
  outputs['prop_tree_dead'] = await composeVertical(srcBuffer, [
    [9, 27], // bare branching tree top
    [10, 27], // trunk with branches
  ]);

  // ============================================
  // ROCKS - Procedural pixel art in Kenney style
  // ============================================
  console.log('Creating prop_rock...');
  const rockMedium = createRockPixels(TILE, 'medium');
  outputs['prop_rock'] = await sharp(rockMedium, { raw: { width: TILE, height: TILE, channels: 4 } })
    .resize(OUT_SIZE, OUT_SIZE, { kernel: 'nearest' })
    .png()
    .toBuffer();

  console.log('Creating prop_rock_small...');
  const rockSmall = createRockPixels(TILE, 'small');
  outputs['prop_rock_small'] = await sharp(rockSmall, { raw: { width: TILE, height: TILE, channels: 4 } })
    .resize(OUT_SIZE, OUT_SIZE, { kernel: 'nearest' })
    .png()
    .toBuffer();

  console.log('Creating prop_rock_large...');
  const rockLarge = createRockPixels(TILE, 'large');
  outputs['prop_rock_large'] = await sharp(rockLarge, { raw: { width: TILE, height: TILE, channels: 4 } })
    .resize(OUT_SIZE, OUT_SIZE, { kernel: 'nearest' })
    .png()
    .toBuffer();

  // ============================================
  // FENCE - row 19 col 45 has a nice fence section
  // ============================================
  console.log('Creating prop_fence...');
  outputs['prop_fence'] = await singleTile(srcBuffer, 19, 45);

  // ============================================
  // BANNER - row 8 col 50 (green pennant), recolor to red
  // ============================================
  console.log('Creating prop_banner...');
  const bannerGreen = await singleTile(srcBuffer, 8, 50);
  outputs['prop_banner'] = await recolorToRed(bannerGreen);

  // ============================================
  // RUIN - row 10 col 42 (gray broken structure)
  // ============================================
  console.log('Creating prop_ruin...');
  outputs['prop_ruin'] = await singleTile(srcBuffer, 10, 42);

  // ============================================
  // CRYSTAL - Procedural pixel art crystal
  // ============================================
  console.log('Creating prop_crystal...');
  const crystalPixels = createCrystalPixels(TILE);
  outputs['prop_crystal'] = await sharp(crystalPixels, { raw: { width: TILE, height: TILE, channels: 4 } })
    .resize(OUT_SIZE, OUT_SIZE, { kernel: 'nearest' })
    .png()
    .toBuffer();

  // ============================================
  // Save all outputs
  // ============================================
  console.log('\nSaving props...');
  for (const [name, buffer] of Object.entries(outputs)) {
    const outPath = path.join(OUTPUT_DIR, `${name}.png`);
    await sharp(buffer).toFile(outPath);
    const meta = await sharp(buffer).metadata();
    console.log(`  ${name}.png - ${meta.width}x${meta.height}`);
  }

  console.log('\nDone! All props updated.');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
