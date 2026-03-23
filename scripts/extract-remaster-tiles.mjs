/**
 * Extract tiles from downloaded CC0 spritesheets, resize to game dimensions,
 * and generate manifest.json entries for the remaster override system.
 *
 * Sources:
 * - Kenney Roguelike/RPG Pack (CC0) - 16x16+1px margin
 * - Puny World Overworld Tileset (CC0) - 16x16
 * - Dungeon Tiles by Buch (CC0) - irregular
 * - Cave Tileset by MrBeast (CC-BY 3.0) - irregular
 */

import sharp from "sharp";
import { writeFileSync, existsSync, mkdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DL = join(ROOT, "public/game-assets/remaster/downloads");
const OUT = join(ROOT, "public/game-assets/remaster");
const TILES = join(OUT, "tiles");
const PROPS = join(OUT, "props");
const DECOS = join(OUT, "decos");

[TILES, PROPS, DECOS].forEach((d) => {
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
});

// ── Source paths ──
const KENNEY = join(DL, "kenney_roguelike/Spritesheet/roguelikeSheet_transparent.png");
const PUNY = join(DL, "punyworld.png");
const DUNGEON = join(DL, "dungeon_tiles.png");
const CAVE = join(DL, "cave.png");

// ── Helpers ──
// Kenney: 16x16 tiles with 1px margin
const k = (col, row) => ({ src: KENNEY, x: col * 17, y: row * 17, w: 16, h: 16 });
// Puny World: 16x16 tiles, no margin
const p = (col, row) => ({ src: PUNY, x: col * 16, y: row * 16, w: 16, h: 16 });
// Arbitrary region
const reg = (src, x, y, w, h) => ({ src, x, y, w, h });

// ════════════════════════════════════════════════════════════════════════
// TILE MAPPING — coordinates verified via color analysis
// ════════════════════════════════════════════════════════════════════════

const GROUND = {
  // ── Verified solid tiles from uniformity analysis ──

  // Grass A: bright green (std 2.4 = textured)
  tile_grass_a:      k(5, 0),     // RGB(140,195,52) std=2.4
  tile_grass_a_var1: k(5, 1),     // RGB(141,196,53) std=1.9
  tile_grass_a_var2: k(42, 29),   // RGB(136,189,50) std=0

  // Grass B: darker yellow-green
  tile_grass_b:      k(10, 26),   // RGB(123,173,44) std=0
  tile_grass_b_var1: k(10, 29),   // RGB(123,173,44) std=0
  tile_grass_b_var2: k(0, 16),    // RGB(123,173,44) std=5.7

  // Meadow: Puny World textured green
  tile_meadow:      p(0, 0),      // RGB(133,166,67) Puny solid
  tile_meadow_var1: p(1, 5),      // same color, different pos
  tile_meadow_var2: p(12, 5),     // same color

  // Forest: dark green
  tile_forest:      k(11, 17),    // RGB(75,168,109) std=0 solid
  tile_forest_var1: k(11, 23),    // RGB(52,158,153) std=0
  tile_forest_var2: k(16, 26),    // RGB(55,170,165) std=0

  // Moss: teal-green
  tile_moss:      k(48, 29),      // RGB(68,187,182) std=0
  tile_moss_var1: k(16, 26),      // RGB(55,170,165) std=0
  tile_moss_var2: k(16, 29),      // RGB(55,170,165) std=0

  // Dirt: warm brown
  tile_dirt:      k(39, 15),      // RGB(185,139,94) std=0
  tile_dirt_var1: k(25, 22),      // RGB(197,143,92) std=0
  tile_dirt_var2: k(1, 26),       // RGB(185,139,94) std=0

  // Path: lighter brown with texture
  tile_path:      k(6, 0),        // RGB(178,130,84) textured
  tile_path_var1: k(6, 1),        // RGB(179,130,84)
  tile_path_var2: k(5, 2),        // RGB(179,135,91)

  // Cobblestone: blue-gray with texture (std 2-4)
  tile_cobble:      k(7, 0),      // RGB(169,183,184) std=2.2
  tile_cobble_var1: k(8, 16),     // RGB(169,183,184) std=2.6
  tile_cobble_var2: k(9, 0),      // RGB(171,184,185) std=3.8

  // Sand: warm tan
  tile_sand:      k(18, 22),      // RGB(230,218,191) std=0
  tile_sand_var1: k(18, 15),      // RGB(217,202,169) std=0
  tile_sand_var2: p(20, 1),       // Puny sand (201,178,102)

  // Water: Kenney teal-blue (textured)
  tile_water: k(0, 0),            // RGB(100,197,207) std=2.9

  // Wet stone: dark gray (textured)
  tile_wet_stone: k(36, 2),       // RGB(68,68,68) std=6.5

  // Marble: very light gray
  tile_marble: k(25, 15),         // RGB(204,204,204) std=0

  // Volcanic: dark gray (same as wet stone, slightly different rendering)
  tile_volcanic: k(36, 2),        // RGB(68,68,68)

  // Lava: red from cave tileset
  tile_lava: reg(CAVE, 0, 320, 32, 16),
};

const PROP = {
  // Trees: green vegetation with shapes (partial transparency)
  prop_tree:      k(49, 6),      // bright green (126,176,49) 208/256px = tree shape
  prop_tree_pine: k(55, 0),      // dark green (66,152,98) 180px = pine shape
  prop_tree_oak:  k(49, 7),      // bright green (129,180,49) 224px
  prop_tree_dead: k(44, 0),      // beige (174,135,96) 150px = bare trunk

  // Rocks: gray with shapes (partial transparency)
  prop_rock:       k(40, 8),     // dark gray (125,125,125) 138px
  prop_rock_small: k(41, 8),     // similar (125,125,125) 156px
  prop_rock_large: k(40, 7),     // light gray (187,187,187) 162px

  // Structures with shapes
  prop_fence:   k(40, 0),        // brown wood (134,106,80) 188px
  prop_banner:  k(49, 0),        // red/orange (188,96,37) 208px
  prop_ruin:    k(40, 9),        // beige ruins (127,120,107) 138px
  prop_crystal: k(49, 3),        // teal crystal (60,171,166) 208px
};

const DECO = {
  // Small decorations from Kenney (reliable 16x16 tiles)
  deco_flower:   k(46, 10),      // green vegetation (88,176,121) 136px
  deco_mushroom: k(54, 6),       // brown (138,118,96) 78px
  deco_pebble:   k(44, 8),       // gray (149,149,149) 94px
  deco_shell:    k(48, 10),      // light (223,210,183) 136px
  deco_leaf:     k(55, 2),       // green (92,141,90) 158px
  deco_twig:     k(54, 2),       // brown (177,115,44) 158px
};

// ════════════════════════════════════════════════════════════════════════
// EXTRACTION
// ════════════════════════════════════════════════════════════════════════

async function extract(spec, outPath, tw, th) {
  try {
    // Clamp to image bounds
    const meta = await sharp(spec.src).metadata();
    const x = Math.min(spec.x, meta.width - 1);
    const y = Math.min(spec.y, meta.height - 1);
    const w = Math.min(spec.w, meta.width - x);
    const h = Math.min(spec.h, meta.height - y);

    if (w < 2 || h < 2) {
      console.warn(`  ⚠ Too small: ${outPath}`);
      return false;
    }

    const buf = await sharp(spec.src)
      .extract({ left: x, top: y, width: w, height: h })
      .resize(tw, th, { kernel: sharp.kernel.nearest })
      .png()
      .toBuffer();

    // Check if mostly transparent
    const stats = await sharp(buf).stats();
    if (stats.channels.length >= 4 && stats.channels[3].mean < 5) {
      console.warn(`  ⚠ Transparent: ${outPath}`);
      return false;
    }

    writeFileSync(outPath, buf);
    return true;
  } catch (err) {
    console.error(`  ✗ ${outPath}: ${err.message}`);
    return false;
  }
}

async function main() {
  const manifest = [];
  let ok = 0, fail = 0;

  console.log("=== Ground Tiles (96x72) ===");
  for (const [key, spec] of Object.entries(GROUND)) {
    const file = `${key}.png`;
    const path = join(TILES, file);
    if (await extract(spec, path, 96, 72)) {
      manifest.push({ key, src: `/game-assets/remaster/tiles/${file}` });
      console.log(`  ✓ ${key}`);
      ok++;
    } else {
      fail++;
    }
  }

  console.log("\n=== Props (64x64) ===");
  for (const [key, spec] of Object.entries(PROP)) {
    const file = `${key}.png`;
    const path = join(PROPS, file);
    if (await extract(spec, path, 64, 64)) {
      manifest.push({ key, src: `/game-assets/remaster/props/${file}` });
      console.log(`  ✓ ${key}`);
      ok++;
    } else {
      fail++;
    }
  }

  console.log("\n=== Decorations (8x8) ===");
  for (const [key, spec] of Object.entries(DECO)) {
    const file = `${key}.png`;
    const path = join(DECOS, file);
    if (await extract(spec, path, 8, 8)) {
      manifest.push({ key, src: `/game-assets/remaster/decos/${file}` });
      console.log(`  ✓ ${key}`);
      ok++;
    } else {
      // Fallback: use Kenney tiles for decos
      console.log(`  → Trying Kenney fallback for ${key}...`);
      const fallbacks = {
        deco_flower:   k(55, 2),  // green
        deco_mushroom: k(44, 2),  // brown
        deco_pebble:   k(41, 8),  // gray
        deco_shell:    k(43, 8),  // light
        deco_leaf:     k(55, 1),  // dark green
        deco_twig:     k(40, 2),  // brown
      };
      const fb = fallbacks[key];
      if (fb && await extract(fb, path, 8, 8)) {
        manifest.push({ key, src: `/game-assets/remaster/decos/${file}` });
        console.log(`  ✓ ${key} (fallback)`);
        ok++;
      } else {
        fail++;
      }
    }
  }

  // ── Write manifest.json ──
  console.log("\n=== Updating manifest.json ===");
  const manifestPath = join(OUT, "manifest.json");
  let existing;
  try {
    existing = JSON.parse(readFileSync(manifestPath, "utf-8"));
  } catch {
    existing = { version: 1, textures: [], spritesheets: [], atlases: [] };
  }

  // Keep existing atlases/spritesheets, merge textures
  const texMap = new Map(existing.textures.map((t) => [t.key, t]));
  for (const t of manifest) {
    texMap.set(t.key, t);
  }
  existing.textures = Array.from(texMap.values());

  writeFileSync(manifestPath, JSON.stringify(existing, null, 2));

  console.log(`\n✅ Complete: ${ok} extracted, ${fail} failed`);
  console.log(`   ${existing.textures.length} textures in manifest`);
  console.log(`   ${existing.atlases.length} atlases preserved`);
}

main().catch(console.error);
