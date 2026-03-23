/**
 * Download CC0 Kenney sprite packs and extract building/structure tiles.
 * Resizes tiles to target dimensions using nearest-neighbor interpolation.
 *
 * Sources (all CC0):
 * - Kenney Tiny Town (buildings, structures)
 * - Kenney Tiny Dungeon (dungeon props, altars)
 * - Kenney 1-Bit Pack (additional buildings)
 * - Kenney Roguelike (already downloaded)
 */

import sharp from "sharp";
import {
  writeFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
} from "fs";
import { join, dirname, basename, extname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DL = join(ROOT, "public/game-assets/remaster/downloads");
const OUT = join(ROOT, "public/game-assets/remaster/structures");
const TMP = join(ROOT, "public/game-assets/remaster/downloads");

[OUT, DL].forEach((d) => {
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
});

// ════════════════════════════════════════════════════════════════════════
// STEP 1: Download and extract Kenney packs
// ════════════════════════════════════════════════════════════════════════

const PACKS = [
  {
    name: "kenney_tiny_town",
    url: "https://kenney.nl/media/pages/assets/tiny-town/5e46f9e551-1735736916/kenney_tiny-town.zip",
    zipPath: join(TMP, "kenney_tiny_town.zip"),
    extractDir: join(DL, "kenney_tiny_town"),
  },
  {
    name: "kenney_tiny_dungeon",
    url: "https://kenney.nl/media/pages/assets/tiny-dungeon/b56d7a13e3-1674742415/kenney_tiny-dungeon.zip",
    zipPath: join(TMP, "kenney_tiny_dungeon.zip"),
    extractDir: join(DL, "kenney_tiny_dungeon"),
  },
  {
    name: "kenney_1bit",
    url: "https://kenney.nl/media/pages/assets/1-bit-pack/f41b6925f0-1677578516/kenney_1-bit-pack.zip",
    zipPath: join(TMP, "kenney_1bit.zip"),
    extractDir: join(DL, "kenney_1bit"),
  },
];

async function downloadAndExtract() {
  for (const pack of PACKS) {
    if (existsSync(pack.extractDir)) {
      console.log(`  [skip] ${pack.name} already extracted`);
      continue;
    }

    // Download
    if (!existsSync(pack.zipPath)) {
      console.log(`  [dl] ${pack.name}...`);
      try {
        execSync(
          `curl -L --retry 3 --connect-timeout 30 -o "${pack.zipPath}" "${pack.url}"`,
          { stdio: "inherit", timeout: 120000 }
        );
      } catch (e) {
        console.error(`  [error] Failed to download ${pack.name}: ${e.message}`);
        continue;
      }
    }

    // Extract
    console.log(`  [extract] ${pack.name}...`);
    mkdirSync(pack.extractDir, { recursive: true });
    try {
      execSync(`unzip -o "${pack.zipPath}" -d "${pack.extractDir}"`, {
        stdio: "inherit",
        timeout: 60000,
      });
    } catch (e) {
      console.error(`  [error] Failed to extract ${pack.name}: ${e.message}`);
    }
  }
}

// ════════════════════════════════════════════════════════════════════════
// STEP 2: Find all PNG spritesheets in downloaded packs
// ════════════════════════════════════════════════════════════════════════

function findPNGs(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findPNGs(full));
    } else if (
      entry.isFile() &&
      extname(entry.name).toLowerCase() === ".png" &&
      !entry.name.startsWith(".")
    ) {
      results.push(full);
    }
  }
  return results;
}

// ════════════════════════════════════════════════════════════════════════
// STEP 3: Tile analysis — extract individual tiles and compute avg color
// ════════════════════════════════════════════════════════════════════════

async function analyzeSpritesheet(path, tileSize, margin = 0) {
  const meta = await sharp(path).metadata();
  const tiles = [];
  const cols = Math.floor((meta.width + margin) / (tileSize + margin));
  const rows = Math.floor((meta.height + margin) / (tileSize + margin));

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * (tileSize + margin);
      const y = row * (tileSize + margin);
      if (x + tileSize > meta.width || y + tileSize > meta.height) continue;

      try {
        const region = { left: x, top: y, width: tileSize, height: tileSize };
        const { data, info } = await sharp(path)
          .extract(region)
          .ensureAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });

        // Compute average color (ignoring transparent pixels)
        let rSum = 0,
          gSum = 0,
          bSum = 0,
          count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a > 128) {
            rSum += data[i];
            gSum += data[i + 1];
            bSum += data[i + 2];
            count++;
          }
        }

        if (count > 0) {
          tiles.push({
            src: path,
            col,
            row,
            x,
            y,
            w: tileSize,
            h: tileSize,
            avgR: Math.round(rSum / count),
            avgG: Math.round(gSum / count),
            avgB: Math.round(bSum / count),
            coverage: count / (tileSize * tileSize),
          });
        }
      } catch (e) {
        // Skip problematic tiles
      }
    }
  }
  return tiles;
}

// Analyze a larger region (multi-tile) for its average color
async function analyzeRegion(path, x, y, w, h) {
  try {
    const { data } = await sharp(path)
      .extract({ left: x, top: y, width: w, height: h })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 128) {
        rSum += data[i];
        gSum += data[i + 1];
        bSum += data[i + 2];
        count++;
      }
    }
    if (count === 0) return null;
    return {
      avgR: Math.round(rSum / count),
      avgG: Math.round(gSum / count),
      avgB: Math.round(bSum / count),
      coverage: count / (w * h),
    };
  } catch {
    return null;
  }
}

function colorDistance(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

// ════════════════════════════════════════════════════════════════════════
// STEP 4: Structure definitions with target colors and dimensions
// ════════════════════════════════════════════════════════════════════════

const STRUCTURES = {
  // Village
  house:          { w: 140, h: 110, targetR: 160, targetG: 120, targetB: 80,  category: "village", minCoverage: 0.15 },
  farmstead:      { w: 200, h: 110, targetR: 150, targetG: 125, targetB: 75,  category: "village", minCoverage: 0.15 },
  market_stalls:  { w: 160, h: 50,  targetR: 170, targetG: 130, targetB: 85,  category: "village", minCoverage: 0.10 },
  market_hall:    { w: 236, h: 150, targetR: 155, targetG: 115, targetB: 80,  category: "village", minCoverage: 0.15 },

  // Military
  keep:           { w: 268, h: 162, targetR: 140, targetG: 140, targetB: 140, category: "military", minCoverage: 0.20 },
  watch_tower:    { w: 68,  h: 128, targetR: 135, targetG: 135, targetB: 135, category: "military", minCoverage: 0.15 },
  gatehouse:      { w: 216, h: 100, targetR: 130, targetG: 130, targetB: 130, category: "military", minCoverage: 0.15 },
  barracks:       { w: 144, h: 100, targetR: 145, targetG: 130, targetB: 115, category: "military", minCoverage: 0.15 },
  war_tent:       { w: 124, h: 70,  targetR: 165, targetG: 140, targetB: 100, category: "military", minCoverage: 0.10 },
  palisade:       { w: 220, h: 70,  targetR: 130, targetG: 100, targetB: 65,  category: "military", minCoverage: 0.10 },

  // Religious/Ceremonial
  shrine_forest:   { w: 132, h: 100, targetR: 90,  targetG: 150, targetB: 70,  category: "nature", minCoverage: 0.10 },
  shrine_wetland:  { w: 132, h: 100, targetR: 80,  targetG: 120, targetB: 100, category: "nature", minCoverage: 0.10 },
  totem:           { w: 90,  h: 100, targetR: 120, targetG: 90,  targetB: 60,  category: "religious", minCoverage: 0.10 },
  crystal_obelisk: { w: 72,  h: 80,  targetR: 80,  targetG: 170, targetB: 210, category: "crystal", minCoverage: 0.08 },
  crystal_ring:    { w: 126, h: 54,  targetR: 90,  targetG: 180, targetB: 220, category: "crystal", minCoverage: 0.08 },
  crystal_altar:   { w: 126, h: 60,  targetR: 100, targetG: 160, targetB: 200, category: "crystal", minCoverage: 0.08 },

  // Maritime
  dock:           { w: 180, h: 60,  targetR: 130, targetG: 100, targetB: 70,  category: "maritime", minCoverage: 0.10 },
  lighthouse:     { w: 96,  h: 140, targetR: 180, targetG: 180, targetB: 170, category: "maritime", minCoverage: 0.12 },
  bridge:         { w: 140, h: 50,  targetR: 140, targetG: 110, targetB: 75,  category: "maritime", minCoverage: 0.10 },
  sunken_barge:   { w: 132, h: 70,  targetR: 100, targetG: 90,  targetB: 70,  category: "maritime", minCoverage: 0.08 },
  bog_platform:   { w: 126, h: 50,  targetR: 110, targetG: 100, targetB: 70,  category: "maritime", minCoverage: 0.08 },

  // Rural
  windmill:       { w: 110, h: 130, targetR: 160, targetG: 140, targetB: 110, category: "rural", minCoverage: 0.12 },
  wagon:          { w: 100, h: 50,  targetR: 140, targetG: 105, targetB: 70,  category: "rural", minCoverage: 0.10 },
  stone_circle:   { w: 120, h: 60,  targetR: 150, targetG: 150, targetB: 145, category: "rural", minCoverage: 0.08 },
  fountain:       { w: 140, h: 70,  targetR: 140, targetG: 155, targetB: 170, category: "rural", minCoverage: 0.10 },
  campfire:       { w: 76,  h: 60,  targetR: 180, targetG: 120, targetB: 50,  category: "rural", minCoverage: 0.08 },

  // Nature/Ruins
  ruined_arch:    { w: 140, h: 120, targetR: 130, targetG: 130, targetB: 120, category: "ruins", minCoverage: 0.10 },
  forest_arch:    { w: 110, h: 80,  targetR: 80,  targetG: 140, targetB: 60,  category: "nature", minCoverage: 0.10 },
  moonwell:       { w: 128, h: 50,  targetR: 100, targetG: 140, targetB: 190, category: "nature", minCoverage: 0.08 },
  reed_cluster:   { w: 40,  h: 40,  targetR: 90,  targetG: 150, targetB: 70,  category: "nature", minCoverage: 0.05 },
  caravan_canopy: { w: 92,  h: 50,  targetR: 170, targetG: 135, targetB: 90,  category: "rural", minCoverage: 0.08 },

  // Volcanic/Dark
  lava_forge:     { w: 120, h: 80,  targetR: 80,  targetG: 40,  targetB: 30,  category: "volcanic", minCoverage: 0.10 },
  obsidian_spire: { w: 96,  h: 90,  targetR: 50,  targetG: 40,  targetB: 50,  category: "volcanic", minCoverage: 0.10 },
  lava_vent:      { w: 84,  h: 40,  targetR: 200, targetG: 80,  targetB: 30,  category: "volcanic", minCoverage: 0.05 },
};

// ════════════════════════════════════════════════════════════════════════
// STEP 5: Smart tile matching with pack-specific knowledge
// ════════════════════════════════════════════════════════════════════════

// Known tile locations in Kenney packs (manually mapped from spritesheet layouts)
// Tiny Town uses 16x16 tiles, no margin
// 1-Bit Pack uses 16x16 tiles, no margin (monochrome but can be tinted)
// Kenney Roguelike uses 16x16 tiles with 1px margin

function findBestTile(tiles, targetR, targetG, targetB, minCoverage, usedTiles) {
  let bestScore = Infinity;
  let bestTile = null;

  for (const tile of tiles) {
    if (tile.coverage < minCoverage) continue;

    // Penalize already-used tiles to get variety
    const tileKey = `${tile.src}:${tile.col}:${tile.row}`;
    const usedPenalty = usedTiles.has(tileKey) ? 80 : 0;

    const dist = colorDistance(tile.avgR, tile.avgG, tile.avgB, targetR, targetG, targetB);
    const score = dist + usedPenalty;

    if (score < bestScore) {
      bestScore = score;
      bestTile = tile;
    }
  }

  return bestTile;
}

// Find multi-tile regions for larger structures
function findBestMultiTile(tiles, targetR, targetG, targetB, minCoverage, cols, rows, usedTiles) {
  // Group tiles by source
  const bySource = {};
  for (const t of tiles) {
    if (!bySource[t.src]) bySource[t.src] = {};
    bySource[t.src][`${t.col},${t.row}`] = t;
  }

  let bestScore = Infinity;
  let bestRegion = null;

  for (const [src, grid] of Object.entries(bySource)) {
    // Find max grid dimensions
    let maxCol = 0, maxRow = 0;
    for (const key of Object.keys(grid)) {
      const [c, r] = key.split(",").map(Number);
      if (c > maxCol) maxCol = c;
      if (r > maxRow) maxRow = r;
    }

    // Try all possible multi-tile regions
    for (let startRow = 0; startRow <= maxRow - rows + 1; startRow++) {
      for (let startCol = 0; startCol <= maxCol - cols + 1; startCol++) {
        let rSum = 0, gSum = 0, bSum = 0, count = 0;
        let allPresent = true;
        let totalCoverage = 0;

        for (let dr = 0; dr < rows && allPresent; dr++) {
          for (let dc = 0; dc < cols && allPresent; dc++) {
            const tile = grid[`${startCol + dc},${startRow + dr}`];
            if (!tile) {
              allPresent = false;
            } else {
              rSum += tile.avgR;
              gSum += tile.avgG;
              bSum += tile.avgB;
              totalCoverage += tile.coverage;
              count++;
            }
          }
        }

        if (!allPresent || count === 0) continue;
        if (totalCoverage / count < minCoverage) continue;

        const avgR = rSum / count;
        const avgG = gSum / count;
        const avgB = bSum / count;
        const dist = colorDistance(avgR, avgG, avgB, targetR, targetG, targetB);

        // Check if any tile in this region is already used
        let usedPenalty = 0;
        for (let dr = 0; dr < rows; dr++) {
          for (let dc = 0; dc < cols; dc++) {
            const tile = grid[`${startCol + dc},${startRow + dr}`];
            if (tile) {
              const tileKey = `${tile.src}:${tile.col}:${tile.row}`;
              if (usedTiles.has(tileKey)) usedPenalty += 30;
            }
          }
        }

        const score = dist + usedPenalty;
        if (score < bestScore) {
          bestScore = score;
          const firstTile = grid[`${startCol},${startRow}`];
          bestRegion = {
            src,
            x: firstTile.x,
            y: firstTile.y,
            w: firstTile.w * cols + (cols > 1 ? (cols - 1) * (firstTile.x / firstTile.col - firstTile.w > 0 ? 1 : 0) : 0),
            h: firstTile.w * rows,
            col: startCol,
            row: startRow,
            cols,
            rows,
          };
        }
      }
    }
  }

  return bestRegion;
}

// ════════════════════════════════════════════════════════════════════════
// STEP 6: Extract and resize tiles to structure dimensions
// ════════════════════════════════════════════════════════════════════════

async function extractAndResize(src, sx, sy, sw, sh, targetW, targetH, outPath) {
  try {
    const extracted = await sharp(src)
      .extract({ left: sx, top: sy, width: sw, height: sh })
      .toBuffer();

    await sharp(extracted)
      .resize(targetW, targetH, {
        kernel: sharp.kernel.nearest,
        fit: "fill",
      })
      .png()
      .toFile(outPath);

    return true;
  } catch (e) {
    console.error(`  [error] Failed to extract from ${basename(src)}: ${e.message}`);
    return false;
  }
}

// Extract a multi-tile region properly accounting for margins
async function extractMultiTileRegion(src, startX, startY, tileSize, margin, cols, rows, targetW, targetH, outPath) {
  try {
    // Create a composite of the tiles without margins
    const composites = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const sx = startX + c * (tileSize + margin);
        const sy = startY + r * (tileSize + margin);
        const buf = await sharp(src)
          .extract({ left: sx, top: sy, width: tileSize, height: tileSize })
          .toBuffer();
        composites.push({
          input: buf,
          left: c * tileSize,
          top: r * tileSize,
        });
      }
    }

    const assembled = await sharp({
      create: {
        width: cols * tileSize,
        height: rows * tileSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite(composites)
      .png()
      .toBuffer();

    await sharp(assembled)
      .resize(targetW, targetH, {
        kernel: sharp.kernel.nearest,
        fit: "fill",
      })
      .png()
      .toFile(outPath);

    return true;
  } catch (e) {
    console.error(`  [error] Multi-tile extract failed: ${e.message}`);
    return false;
  }
}

// ════════════════════════════════════════════════════════════════════════
// STEP 7: Generate procedural structure sprite as fallback
// ════════════════════════════════════════════════════════════════════════

async function generateProceduralStructure(name, def, outPath) {
  const { w, h, targetR: r, targetG: g, targetB: b, category } = def;

  // Create a pixel-art style structure procedurally
  const pixels = Buffer.alloc(w * h * 4, 0);

  function setPixel(px, py, pr, pg, pb, pa = 255) {
    if (px < 0 || px >= w || py < 0 || py >= h) return;
    const idx = (py * w + px) * 4;
    pixels[idx] = pr;
    pixels[idx + 1] = pg;
    pixels[idx + 2] = pb;
    pixels[idx + 3] = pa;
  }

  function fillRect(fx, fy, fw, fh, fr, fg, fb, fa = 255) {
    for (let dy = 0; dy < fh; dy++) {
      for (let dx = 0; dx < fw; dx++) {
        setPixel(fx + dx, fy + dy, fr, fg, fb, fa);
      }
    }
  }

  // Darker/lighter variants
  const dark = (v, amt = 40) => Math.max(0, v - amt);
  const light = (v, amt = 40) => Math.min(255, v + amt);

  const baseR = r, baseG = g, baseB = b;
  const darkR = dark(r), darkG = dark(g), darkB = dark(b);
  const lightR = light(r), lightG = light(g), lightB = light(b);
  const outlineR = dark(r, 80), outlineG = dark(g, 80), outlineB = dark(b, 80);

  // Draw based on category
  switch (category) {
    case "village": {
      // House-like structure: walls + roof
      const roofH = Math.floor(h * 0.4);
      const wallH = h - roofH;
      const margin = Math.floor(w * 0.08);

      // Roof (darker, triangular-ish)
      for (let ry = 0; ry < roofH; ry++) {
        const progress = ry / roofH;
        const indent = Math.floor(margin + (w / 2 - margin) * (1 - progress));
        fillRect(indent, ry, w - indent * 2, 1, dark(r, 20), dark(g, 10), dark(b, 30));
      }
      // Roof outline
      fillRect(margin, 0, w - margin * 2, 2, outlineR, outlineG, outlineB);

      // Walls
      fillRect(margin, roofH, w - margin * 2, wallH, baseR, baseG, baseB);

      // Wall outline
      fillRect(margin, roofH, 2, wallH, outlineR, outlineG, outlineB);
      fillRect(w - margin - 2, roofH, 2, wallH, outlineR, outlineG, outlineB);
      fillRect(margin, h - 2, w - margin * 2, 2, outlineR, outlineG, outlineB);

      // Door
      const doorW = Math.max(8, Math.floor(w * 0.12));
      const doorH = Math.max(12, Math.floor(wallH * 0.5));
      const doorX = Math.floor(w / 2 - doorW / 2);
      fillRect(doorX, h - doorH, doorW, doorH, darkR, darkG, darkB);

      // Windows
      const winSize = Math.max(6, Math.floor(w * 0.08));
      fillRect(margin + 10, roofH + 10, winSize, winSize, lightR, lightG, light(b, 60));
      fillRect(w - margin - 10 - winSize, roofH + 10, winSize, winSize, lightR, lightG, light(b, 60));
      break;
    }

    case "military": {
      // Fortified structure: thick walls, crenellations
      const margin = Math.floor(w * 0.05);
      const crenH = Math.max(6, Math.floor(h * 0.08));
      const crenW = Math.max(6, Math.floor(w * 0.06));

      // Main body
      fillRect(margin, crenH, w - margin * 2, h - crenH, baseR, baseG, baseB);

      // Crenellations
      const numCren = Math.floor((w - margin * 2) / (crenW * 2));
      for (let i = 0; i < numCren; i++) {
        fillRect(margin + i * crenW * 2, 0, crenW, crenH + 2, baseR, baseG, baseB);
      }

      // Outline
      fillRect(margin, crenH, w - margin * 2, 2, outlineR, outlineG, outlineB);
      fillRect(margin, h - 2, w - margin * 2, 2, outlineR, outlineG, outlineB);
      fillRect(margin, crenH, 2, h - crenH, outlineR, outlineG, outlineB);
      fillRect(w - margin - 2, crenH, 2, h - crenH, outlineR, outlineG, outlineB);

      // Gate
      const gateW = Math.max(12, Math.floor(w * 0.15));
      const gateH = Math.max(16, Math.floor(h * 0.4));
      const gateX = Math.floor(w / 2 - gateW / 2);
      fillRect(gateX, h - gateH, gateW, gateH, darkR, darkG, darkB);
      // Arch top
      for (let ax = 0; ax < gateW; ax++) {
        const arch = Math.floor(Math.sqrt(Math.max(0, (gateW / 2) ** 2 - (ax - gateW / 2) ** 2)) * 0.5);
        fillRect(gateX + ax, h - gateH - arch, 1, arch, baseR, baseG, baseB);
      }
      break;
    }

    case "crystal": {
      // Crystal structure: angular, glowing
      const cx = Math.floor(w / 2);
      const cy = Math.floor(h / 2);

      // Main crystal body (diamond shape)
      for (let dy = 0; dy < h; dy++) {
        const progress = dy < h / 2 ? dy / (h / 2) : (h - dy) / (h / 2);
        const halfW = Math.floor(w * 0.4 * progress);
        for (let dx = -halfW; dx <= halfW; dx++) {
          const glowIntensity = 1 - Math.abs(dx) / (halfW + 1);
          const pr = Math.min(255, Math.floor(r + 40 * glowIntensity));
          const pg = Math.min(255, Math.floor(g + 40 * glowIntensity));
          const pb = Math.min(255, Math.floor(b + 40 * glowIntensity));
          setPixel(cx + dx, dy, pr, pg, pb);
        }
      }

      // Glow aura
      for (let dy = -4; dy < h + 4; dy++) {
        const progress = dy < h / 2 ? dy / (h / 2) : (h - dy) / (h / 2);
        const halfW = Math.floor(w * 0.45 * Math.max(0, progress));
        for (let dx = -halfW - 3; dx <= halfW + 3; dx++) {
          const px = cx + dx, py = dy;
          if (px >= 0 && px < w && py >= 0 && py < h) {
            const idx = (py * w + px) * 4;
            if (pixels[idx + 3] === 0) {
              setPixel(px, py, lightR, lightG, lightB, 60);
            }
          }
        }
      }
      break;
    }

    case "volcanic": {
      // Dark structure with lava glow
      const margin = Math.floor(w * 0.1);

      // Base (dark)
      fillRect(margin, Math.floor(h * 0.2), w - margin * 2, Math.floor(h * 0.8), baseR, baseG, baseB);

      // Lava cracks
      const crackR = 220, crackG = 80, crackB = 20;
      for (let i = 0; i < 5; i++) {
        const cx = margin + Math.floor(Math.random() * (w - margin * 2));
        const cy = Math.floor(h * 0.3) + Math.floor(Math.random() * Math.floor(h * 0.6));
        fillRect(cx, cy, 3, 2, crackR, crackG, crackB);
      }

      // Spire/peak
      for (let dy = 0; dy < Math.floor(h * 0.4); dy++) {
        const progress = 1 - dy / (h * 0.4);
        const halfW = Math.floor((w * 0.3) * progress);
        const cx = Math.floor(w / 2);
        fillRect(cx - halfW, dy, halfW * 2, 1, darkR, darkG, darkB);
      }

      // Glow at base
      fillRect(margin + 4, h - 8, w - margin * 2 - 8, 4, 180, 60, 20, 120);
      break;
    }

    case "nature": {
      // Organic structure with foliage
      const cx = Math.floor(w / 2);

      // Tree/foliage canopy
      for (let dy = 0; dy < Math.floor(h * 0.6); dy++) {
        const progress = dy / (h * 0.6);
        const halfW = Math.floor(w * 0.45 * Math.sin(progress * Math.PI));
        for (let dx = -halfW; dx <= halfW; dx++) {
          const noise = Math.random() * 30 - 15;
          setPixel(cx + dx, dy,
            Math.max(0, Math.min(255, baseR + Math.floor(noise))),
            Math.max(0, Math.min(255, baseG + Math.floor(noise))),
            Math.max(0, Math.min(255, baseB + Math.floor(noise)))
          );
        }
      }

      // Trunk/base
      const trunkW = Math.max(6, Math.floor(w * 0.15));
      fillRect(cx - trunkW / 2, Math.floor(h * 0.5), trunkW, Math.floor(h * 0.5),
        dark(r, 30), dark(g, 30), dark(b, 20));
      break;
    }

    case "maritime": {
      // Wooden dock/water structure
      const margin = Math.floor(w * 0.05);
      const plankH = Math.max(4, Math.floor(h * 0.12));
      const numPlanks = Math.floor((h - 4) / (plankH + 2));

      // Planks
      for (let i = 0; i < numPlanks; i++) {
        const py = 2 + i * (plankH + 2);
        const shade = i % 2 === 0 ? 0 : 15;
        fillRect(margin, py, w - margin * 2, plankH,
          baseR + shade, baseG + shade, baseB + shade);
        // Plank outline
        fillRect(margin, py, w - margin * 2, 1, darkR, darkG, darkB);
      }

      // Posts
      const postW = Math.max(4, Math.floor(w * 0.04));
      fillRect(margin, 0, postW, h, darkR, darkG, darkB);
      fillRect(w - margin - postW, 0, postW, h, darkR, darkG, darkB);
      break;
    }

    case "ruins": {
      // Broken/crumbling structure
      const margin = Math.floor(w * 0.08);

      // Left pillar (taller)
      const pillarW = Math.max(8, Math.floor(w * 0.12));
      fillRect(margin, Math.floor(h * 0.1), pillarW, Math.floor(h * 0.9), baseR, baseG, baseB);
      // Break at top
      for (let i = 0; i < 5; i++) {
        const bx = margin + Math.floor(Math.random() * pillarW);
        const by = Math.floor(h * 0.1) + Math.floor(Math.random() * 10);
        setPixel(bx, by, 0, 0, 0, 0);
      }

      // Right pillar (shorter, broken)
      fillRect(w - margin - pillarW, Math.floor(h * 0.3), pillarW, Math.floor(h * 0.7), baseR, baseG, baseB);

      // Arch remnant
      for (let ax = margin + pillarW; ax < w - margin - pillarW; ax++) {
        const progress = (ax - margin - pillarW) / (w - margin * 2 - pillarW * 2);
        const archY = Math.floor(h * 0.2 + Math.sin(progress * Math.PI) * h * 0.15);
        fillRect(ax, archY, 1, 3, baseR, baseG, baseB);
        // Crumbling effect
        if (Math.random() > 0.7) {
          fillRect(ax, archY + 3, 1, 2, darkR, darkG, darkB);
        }
      }

      // Rubble at base
      for (let i = 0; i < 15; i++) {
        const rx = margin + Math.floor(Math.random() * (w - margin * 2));
        const ry = h - 4 - Math.floor(Math.random() * 8);
        const rs = 2 + Math.floor(Math.random() * 4);
        fillRect(rx, ry, rs, rs, darkR, darkG, darkB);
      }
      break;
    }

    case "religious": {
      // Totem / pole structure
      const cx = Math.floor(w / 2);
      const poleW = Math.max(8, Math.floor(w * 0.2));

      // Main pole
      fillRect(cx - poleW / 2, Math.floor(h * 0.1), poleW, Math.floor(h * 0.85), baseR, baseG, baseB);

      // Carved faces/sections
      const sections = 3;
      const sectionH = Math.floor(h * 0.85 / sections);
      for (let s = 0; s < sections; s++) {
        const sy = Math.floor(h * 0.1) + s * sectionH;
        fillRect(cx - poleW / 2, sy, poleW, 2, outlineR, outlineG, outlineB);
        // Wing extensions
        const wingW = Math.floor(poleW * 0.6);
        fillRect(cx - poleW / 2 - wingW, sy + 4, wingW, Math.floor(sectionH * 0.4), darkR, darkG, darkB);
        fillRect(cx + poleW / 2, sy + 4, wingW, Math.floor(sectionH * 0.4), darkR, darkG, darkB);
      }

      // Top ornament
      fillRect(cx - poleW, Math.floor(h * 0.05), poleW * 2, Math.floor(h * 0.08), lightR, lightG, lightB);
      break;
    }

    case "rural":
    default: {
      // Simple structure: rectangular with some detail
      const margin = Math.floor(w * 0.08);

      // Main body
      fillRect(margin, Math.floor(h * 0.15), w - margin * 2, Math.floor(h * 0.85), baseR, baseG, baseB);

      // Outline
      fillRect(margin, Math.floor(h * 0.15), w - margin * 2, 2, outlineR, outlineG, outlineB);
      fillRect(margin, h - 2, w - margin * 2, 2, outlineR, outlineG, outlineB);
      fillRect(margin, Math.floor(h * 0.15), 2, Math.floor(h * 0.85), outlineR, outlineG, outlineB);
      fillRect(w - margin - 2, Math.floor(h * 0.15), 2, Math.floor(h * 0.85), outlineR, outlineG, outlineB);

      // Some detail
      const detailW = Math.floor((w - margin * 2) * 0.3);
      const detailH = Math.floor(h * 0.2);
      fillRect(Math.floor(w / 2 - detailW / 2), h - detailH, detailW, detailH, darkR, darkG, darkB);
      break;
    }
  }

  await sharp(pixels, {
    raw: { width: w, height: h, channels: 4 },
  })
    .png()
    .toFile(outPath);
}

// ════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════

async function main() {
  console.log("=== Structure Sprite Extractor ===\n");

  // Step 1: Download packs
  console.log("[1/5] Downloading Kenney packs...");
  await downloadAndExtract();

  // Step 2: Find all PNGs
  console.log("\n[2/5] Scanning for spritesheets...");
  const searchDirs = [
    join(DL, "kenney_tiny_town"),
    join(DL, "kenney_tiny_dungeon"),
    join(DL, "kenney_1bit"),
    join(DL, "kenney_roguelike"),
  ];

  let allPNGs = [];
  for (const dir of searchDirs) {
    const pngs = findPNGs(dir);
    console.log(`  ${basename(dir)}: ${pngs.length} PNGs found`);
    allPNGs.push(...pngs);
  }

  // Step 3: Analyze tiles
  console.log("\n[3/5] Analyzing tile colors...");
  let allTiles = [];

  for (const png of allPNGs) {
    const meta = await sharp(png).metadata();
    const name = basename(png);

    // Determine tile size and margin based on pack
    let tileSize = 16;
    let margin = 0;

    if (png.includes("kenney_roguelike") && name.includes("Sheet")) {
      margin = 1;
      tileSize = 16;
    } else if (png.includes("kenney_1bit") || png.includes("1-bit")) {
      // 1-bit pack: monochrome_tilemap is 16x16, individual PNGs vary
      if (name.includes("monochrome") || name.includes("tilemap") || name.includes("colored")) {
        tileSize = 16;
        margin = 1;
      } else if (meta.width <= 64 && meta.height <= 64) {
        // Individual sprite file — treat as single tile
        allTiles.push({
          src: png,
          col: 0,
          row: 0,
          x: 0,
          y: 0,
          w: meta.width,
          h: meta.height,
          avgR: 128,
          avgG: 128,
          avgB: 128,
          coverage: 0.5,
          isSingleFile: true,
        });
        continue;
      }
    } else if (png.includes("kenney_tiny")) {
      tileSize = 16;
      margin = 0;
      // Some tiny packs have 1px margin in tilemap/sheet files
      if (name.includes("tilemap") || name.includes("sheet") || name.includes("Sheet")) {
        // Check if 16+1 margin fits better
        const cols17 = Math.floor((meta.width + 1) / 17);
        const cols16 = Math.floor(meta.width / 16);
        if (cols17 > 0 && (meta.width + 1) % 17 < meta.width % 16) {
          margin = 1;
        }
      }
    }

    // Only analyze files that are big enough to be spritesheets
    if (meta.width < tileSize || meta.height < tileSize) continue;

    // Cap analysis for huge sheets
    const maxTiles = 2000;
    const tiles = await analyzeSpritesheet(png, tileSize, margin);
    if (tiles.length > 0) {
      console.log(`  ${name}: ${tiles.length} tiles (${tileSize}px, margin=${margin})`);
      allTiles.push(...tiles.slice(0, maxTiles));
    }
  }

  console.log(`  Total analyzed tiles: ${allTiles.length}`);

  // Step 4: Match and extract
  console.log("\n[4/5] Matching tiles to structures...");
  const usedTiles = new Set();
  let extracted = 0;
  let procedural = 0;

  for (const [name, def] of Object.entries(STRUCTURES)) {
    const outPath = join(OUT, `struct_${name}.png`);
    const { w, h, targetR, targetG, targetB, minCoverage } = def;

    // Try to find best matching tile(s)
    const tile = findBestTile(allTiles, targetR, targetG, targetB, minCoverage, usedTiles);

    if (tile && tile.isSingleFile) {
      // Single file sprite — resize directly
      const ok = await extractAndResize(tile.src, 0, 0, tile.w, tile.h, w, h, outPath);
      if (ok) {
        console.log(`  [tile] struct_${name}.png (${w}x${h}) from ${basename(tile.src)}`);
        usedTiles.add(`${tile.src}:${tile.col}:${tile.row}`);
        extracted++;
        continue;
      }
    }

    if (tile) {
      // Determine how many tiles we need to cover the target aspect ratio
      const tileAspect = 1; // tiles are square
      const targetAspect = w / h;
      let tileCols = 1, tileRows = 1;

      if (w > 80 || h > 80) {
        // Use multiple tiles for larger structures
        tileCols = Math.max(1, Math.min(4, Math.round(w / 48)));
        tileRows = Math.max(1, Math.min(4, Math.round(h / 48)));
      }

      if (tileCols === 1 && tileRows === 1) {
        const ok = await extractAndResize(tile.src, tile.x, tile.y, tile.w, tile.h, w, h, outPath);
        if (ok) {
          console.log(`  [tile] struct_${name}.png (${w}x${h}) from ${basename(tile.src)} [${tile.col},${tile.row}] color=(${tile.avgR},${tile.avgG},${tile.avgB})`);
          usedTiles.add(`${tile.src}:${tile.col}:${tile.row}`);
          extracted++;
          continue;
        }
      } else {
        // Try multi-tile extraction
        // Determine margin for this source
        let margin = 0;
        if (tile.src.includes("kenney_roguelike")) margin = 1;
        else if (tile.src.includes("1-bit") || tile.src.includes("kenney_1bit")) {
          if (basename(tile.src).includes("tilemap") || basename(tile.src).includes("monochrome")) margin = 1;
        }

        const ok = await extractMultiTileRegion(
          tile.src, tile.x, tile.y, tile.w, margin,
          tileCols, tileRows, w, h, outPath
        );
        if (ok) {
          console.log(`  [multi] struct_${name}.png (${w}x${h}) ${tileCols}x${tileRows} tiles from ${basename(tile.src)}`);
          usedTiles.add(`${tile.src}:${tile.col}:${tile.row}`);
          extracted++;
          continue;
        }
      }
    }

    // Fallback: generate procedural sprite
    console.log(`  [proc] struct_${name}.png (${w}x${h}) — procedural generation`);
    await generateProceduralStructure(name, def, outPath);
    procedural++;
  }

  // Step 5: Summary
  console.log(`\n[5/5] Summary:`);
  console.log(`  Extracted from tiles: ${extracted}`);
  console.log(`  Procedural fallback:  ${procedural}`);
  console.log(`  Total structures:     ${Object.keys(STRUCTURES).length}`);
  console.log(`  Output directory:     ${OUT}`);

  // List all generated files
  const files = readdirSync(OUT).filter(f => f.startsWith("struct_") && f.endsWith(".png"));
  console.log(`\n  Generated files (${files.length}):`);
  for (const f of files.sort()) {
    const stat = statSync(join(OUT, f));
    console.log(`    ${f} (${stat.size} bytes)`);
  }
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
