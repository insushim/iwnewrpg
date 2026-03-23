/**
 * Convert Puny Characters (32x32, 24cols x 8rows) spritesheets
 * to our atlas format (128x128 frames, 512x2560 atlas PNG + JSON)
 *
 * Puny layout: 24 cols x 8 rows (32x32 each)
 *   Cols  0-2: Idle (3 frames)
 *   Cols  3-5: Walk (3 frames)
 *   Cols  6-8: Sword Attack (3 frames)
 *   Cols  9-11: Bow Attack (3 frames)
 *   Cols 12-14: Stave Attack (3 frames)
 *   Cols 15-17: Throw (3 frames)
 *   Cols 18-20: Hurt (3 frames)
 *   Cols 21-23: Death (3 frames)
 *
 * Puny direction rows: S=0, SE=1, E=2, NE=3, N=4, NW=5, W=6, SW=7
 * Our direction order:  N, NE, E, SE, S, SW, W, NW
 *
 * Our atlas: 4 cols x 20 rows (128x128 each) = 80 frames
 *   Per direction (10 frames):
 *     idle_0, idle_1, walk_0, attack_0,
 *     walk_1, attack_1, walk_2, attack_2,
 *     walk_3, attack_3
 */

import sharp from "sharp";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const PUNY_FRAME = 32;
const OUT_FRAME = 128;
const SCALE = OUT_FRAME / PUNY_FRAME; // 4x
const ATLAS_COLS = 4;
const ATLAS_ROWS = 20;
const ATLAS_W = ATLAS_COLS * OUT_FRAME; // 512
const ATLAS_H = ATLAS_ROWS * OUT_FRAME; // 2560

// Puny row → our direction
const PUNY_ROW_TO_DIR = {
  4: "n",
  3: "ne",
  2: "e",
  1: "se",
  0: "s",
  7: "sw",
  6: "w",
  5: "nw",
};

// Our direction order
const DIR_ORDER = ["n", "ne", "e", "se", "s", "sw", "w", "nw"];

// Puny column indices for each animation
// idle: cols 0,1,2 → we use 0,1
// walk: cols 3,4,5 → we need 4 frames, use 3,4,5,4 (ping-pong)
// attack: cols 6,7,8 → we need 4 frames, use 6,7,8,8 (hold last)
const IDLE_COLS = [0, 1]; // 2 frames
const WALK_COLS = [3, 4, 5, 4]; // 4 frames (ping-pong)
const ATTACK_COLS = [6, 7, 8, 8]; // 4 frames (hold last)

// For bow-using characters (Archer), use bow attack cols 9-11
const BOW_ATTACK_COLS = [9, 10, 11, 11];
// For stave-using characters (Mage), use stave attack cols 12-14
const STAVE_ATTACK_COLS = [12, 13, 14, 14];

// Character mapping: puny file → game sprite key + attack type
const CHARACTER_MAP = [
  // Players
  {
    src: "Warrior-Blue.png",
    key: "anim_player_guardian",
    attackCols: ATTACK_COLS,
  },
  {
    src: "Archer-Green.png",
    key: "anim_player_ranger",
    attackCols: BOW_ATTACK_COLS,
  },
  {
    src: "Mage-Cyan.png",
    key: "anim_player_arcanist",
    attackCols: STAVE_ATTACK_COLS,
  },
  {
    src: "Soldier-Yellow.png",
    key: "anim_player_sovereign",
    attackCols: ATTACK_COLS,
  },
  // Player weapon variants
  {
    src: "Warrior-Blue.png",
    key: "anim_player_guardian_dagger",
    attackCols: ATTACK_COLS,
  },
  {
    src: "Warrior-Blue.png",
    key: "anim_player_guardian_sword",
    attackCols: ATTACK_COLS,
  },
  {
    src: "Warrior-Blue.png",
    key: "anim_player_guardian_greatsword",
    attackCols: ATTACK_COLS,
  },
  {
    src: "Soldier-Yellow.png",
    key: "anim_player_sovereign_dagger",
    attackCols: ATTACK_COLS,
  },
  {
    src: "Soldier-Yellow.png",
    key: "anim_player_sovereign_sword",
    attackCols: ATTACK_COLS,
  },
  {
    src: "Soldier-Yellow.png",
    key: "anim_player_sovereign_greatsword",
    attackCols: ATTACK_COLS,
  },
  // NPCs
  {
    src: "Warrior-Red.png",
    key: "anim_npc_weapon",
    attackCols: ATTACK_COLS,
  },
  {
    src: "Soldier-Blue.png",
    key: "anim_npc_armor",
    attackCols: ATTACK_COLS,
  },
  {
    src: "Mage-Red.png",
    key: "anim_npc_magic",
    attackCols: STAVE_ATTACK_COLS,
  },
  {
    src: "Human-Worker-Cyan.png",
    key: "anim_npc_inn",
    attackCols: ATTACK_COLS,
  },
  {
    src: "Human-Worker-Red.png",
    key: "anim_npc_blacksmith",
    attackCols: ATTACK_COLS,
  },
  {
    src: "Soldier-Red.png",
    key: "anim_npc_default",
    attackCols: ATTACK_COLS,
  },
  // Monsters (using orc variants + recolors)
  {
    src: "Orc-Grunt.png",
    key: "anim_monster_orc",
    attackCols: ATTACK_COLS,
  },
  {
    src: "Orc-Soldier-Cyan.png",
    key: "anim_monster_skeleton",
    attackCols: ATTACK_COLS,
  },
  {
    src: "Orc-Soldier-Red.png",
    key: "anim_monster_wolf",
    attackCols: ATTACK_COLS,
  },
  {
    src: "Orc-Peon-Cyan.png",
    key: "anim_monster_bog",
    attackCols: ATTACK_COLS,
  },
  {
    src: "Orc-Peon-Red.png",
    key: "anim_monster_boar",
    attackCols: ATTACK_COLS,
  },
  {
    src: "Archer-Purple.png",
    key: "anim_monster_spider",
    attackCols: BOW_ATTACK_COLS,
  },
  {
    src: "Mage-Red.png",
    key: "anim_monster_wisp",
    attackCols: STAVE_ATTACK_COLS,
  },
  {
    src: "Warrior-Red.png",
    key: "anim_monster_dragon",
    attackCols: ATTACK_COLS,
  },
  {
    src: "Human-Soldier-Cyan.png",
    key: "anim_monster_rock_golem",
    attackCols: ATTACK_COLS,
  },
];

const REMASTER_DIR = join(
  process.cwd(),
  "public/game-assets/remaster/examples",
);
const SRC_DIR = join(process.cwd(), "public/game-assets/remaster");

async function extractFrame(srcBuf, srcW, punyRow, punyCol) {
  const x = punyCol * PUNY_FRAME;
  const y = punyRow * PUNY_FRAME;
  return sharp(srcBuf, {
    raw: { width: srcW, height: 256, channels: 4 },
  })
    .extract({ left: x, top: y, width: PUNY_FRAME, height: PUNY_FRAME })
    .resize(OUT_FRAME, OUT_FRAME, { kernel: "nearest" })
    .raw()
    .toBuffer();
}

function generateAtlasJson(key) {
  const frames = {};
  let frameIdx = 0;
  for (const dir of DIR_ORDER) {
    // idle 0,1
    for (let i = 0; i < 2; i++) {
      const name = `${key}_idle_${dir}_${i}`;
      const col = frameIdx % ATLAS_COLS;
      const row = Math.floor(frameIdx / ATLAS_COLS);
      frames[name] = {
        frame: {
          x: col * OUT_FRAME,
          y: row * OUT_FRAME,
          w: OUT_FRAME,
          h: OUT_FRAME,
        },
        rotated: false,
        trimmed: false,
        spriteSourceSize: { x: 0, y: 0, w: OUT_FRAME, h: OUT_FRAME },
        sourceSize: { w: OUT_FRAME, h: OUT_FRAME },
      };
      frameIdx++;
    }
    // walk 0-3 and attack 0-3 interleaved
    for (let i = 0; i < 4; i++) {
      // walk
      const walkName = `${key}_walk_${dir}_${i}`;
      const wCol = frameIdx % ATLAS_COLS;
      const wRow = Math.floor(frameIdx / ATLAS_COLS);
      frames[walkName] = {
        frame: {
          x: wCol * OUT_FRAME,
          y: wRow * OUT_FRAME,
          w: OUT_FRAME,
          h: OUT_FRAME,
        },
        rotated: false,
        trimmed: false,
        spriteSourceSize: { x: 0, y: 0, w: OUT_FRAME, h: OUT_FRAME },
        sourceSize: { w: OUT_FRAME, h: OUT_FRAME },
      };
      frameIdx++;
      // attack
      const atkName = `${key}_attack_${dir}_${i}`;
      const aCol = frameIdx % ATLAS_COLS;
      const aRow = Math.floor(frameIdx / ATLAS_COLS);
      frames[atkName] = {
        frame: {
          x: aCol * OUT_FRAME,
          y: aRow * OUT_FRAME,
          w: OUT_FRAME,
          h: OUT_FRAME,
        },
        rotated: false,
        trimmed: false,
        spriteSourceSize: { x: 0, y: 0, w: OUT_FRAME, h: OUT_FRAME },
        sourceSize: { w: OUT_FRAME, h: OUT_FRAME },
      };
      frameIdx++;
    }
  }
  return { frames };
}

function generateManifestEntries(key) {
  const entries = [];
  for (const dir of DIR_ORDER) {
    for (let i = 0; i < 2; i++) {
      const name = `${key}_idle_${dir}_${i}`;
      entries.push({ key: name, frame: name });
    }
    for (let i = 0; i < 4; i++) {
      entries.push({
        key: `${key}_walk_${dir}_${i}`,
        frame: `${key}_walk_${dir}_${i}`,
      });
      entries.push({
        key: `${key}_attack_${dir}_${i}`,
        frame: `${key}_attack_${dir}_${i}`,
      });
    }
  }
  return entries;
}

async function processCharacter(charDef) {
  const srcPath = join(SRC_DIR, charDef.src);
  const srcRaw = await sharp(srcPath).raw().ensureAlpha().toBuffer();
  const srcMeta = await sharp(srcPath).metadata();
  const srcW = srcMeta.width;

  // Build frame list: for each direction, extract idle(2) + walk(4) + attack(4)
  // in the interleaved order: idle0, idle1, walk0, atk0, walk1, atk1, walk2, atk2, walk3, atk3
  const frameBuffers = [];

  for (const dir of DIR_ORDER) {
    // Find the puny row for this direction
    const punyRow = Object.entries(PUNY_ROW_TO_DIR).find(
      ([, d]) => d === dir,
    )?.[0];
    if (punyRow === undefined) throw new Error(`No puny row for dir ${dir}`);
    const row = parseInt(punyRow);

    // idle frames
    for (const col of IDLE_COLS) {
      frameBuffers.push(await extractFrame(srcRaw, srcW, row, col));
    }
    // interleaved walk + attack
    for (let i = 0; i < 4; i++) {
      frameBuffers.push(
        await extractFrame(srcRaw, srcW, row, WALK_COLS[i]),
      );
      frameBuffers.push(
        await extractFrame(srcRaw, srcW, row, charDef.attackCols[i]),
      );
    }
  }

  // Compose into atlas (512x2560)
  const atlasBuffer = Buffer.alloc(ATLAS_W * ATLAS_H * 4);
  for (let i = 0; i < frameBuffers.length; i++) {
    const col = i % ATLAS_COLS;
    const row = Math.floor(i / ATLAS_COLS);
    const fb = frameBuffers[i];
    for (let y = 0; y < OUT_FRAME; y++) {
      const srcOffset = y * OUT_FRAME * 4;
      const dstOffset =
        ((row * OUT_FRAME + y) * ATLAS_W + col * OUT_FRAME) * 4;
      fb.copy(atlasBuffer, dstOffset, srcOffset, srcOffset + OUT_FRAME * 4);
    }
  }

  // Save atlas PNG
  const outDir = join(REMASTER_DIR, charDef.key);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const atlasPng = join(outDir, "atlas.png");
  await sharp(atlasBuffer, {
    raw: { width: ATLAS_W, height: ATLAS_H, channels: 4 },
  })
    .png()
    .toFile(atlasPng);

  // Save atlas JSON
  const atlasJson = generateAtlasJson(charDef.key);
  writeFileSync(
    join(outDir, "atlas.sample.json"),
    JSON.stringify(atlasJson, null, 2),
  );

  console.log(`  ✓ ${charDef.key} (from ${charDef.src})`);
  return {
    key: `${charDef.key}_atlas`,
    textureSrc: `/game-assets/remaster/examples/${charDef.key}/atlas.png`,
    atlasSrc: `/game-assets/remaster/examples/${charDef.key}/atlas.sample.json`,
    entries: generateManifestEntries(charDef.key),
  };
}

// Special handler for Slime (single row, 15 cols, 32x32)
async function processSlime() {
  const key = "anim_monster_slime";
  const srcPath = join(SRC_DIR, "Slime.png");
  const srcMeta = await sharp(srcPath).metadata();
  const srcW = srcMeta.width;
  const srcH = srcMeta.height;
  const maxCol = Math.floor(srcW / PUNY_FRAME) - 1;

  // Slime: 15 cols x 1 row, 32x32
  // We'll use: idle=cols 0,1; walk=cols 2,3,4,3; attack=cols 5,6,7,7
  // Same frames for all 8 directions (slime looks same from all angles)
  const slimeIdleCols = [0, 1];
  const slimeWalkCols = [2, 3, 4, 3];
  const slimeAtkCols = [5, 6, 7, 7];

  // Read with actual height, not hardcoded 256
  const srcRaw = await sharp(srcPath).raw().ensureAlpha().toBuffer();

  const frameBuffers = [];
  for (const dir of DIR_ORDER) {
    // idle
    for (const col of slimeIdleCols) {
      const safeCol = Math.min(col, maxCol);
      const x = safeCol * PUNY_FRAME;
      const frame = await sharp(srcRaw, {
        raw: { width: srcW, height: srcH, channels: 4 },
      })
        .extract({ left: x, top: 0, width: PUNY_FRAME, height: PUNY_FRAME })
        .resize(OUT_FRAME, OUT_FRAME, { kernel: "nearest" })
        .raw()
        .toBuffer();
      frameBuffers.push(frame);
    }
    // interleaved walk + attack
    for (let i = 0; i < 4; i++) {
      const wCol = Math.min(slimeWalkCols[i], maxCol);
      const aCol = Math.min(slimeAtkCols[i], maxCol);
      const wFrame = await sharp(srcRaw, {
        raw: { width: srcW, height: srcH, channels: 4 },
      })
        .extract({
          left: wCol * PUNY_FRAME,
          top: 0,
          width: PUNY_FRAME,
          height: PUNY_FRAME,
        })
        .resize(OUT_FRAME, OUT_FRAME, { kernel: "nearest" })
        .raw()
        .toBuffer();
      const aFrame = await sharp(srcRaw, {
        raw: { width: srcW, height: srcH, channels: 4 },
      })
        .extract({
          left: aCol * PUNY_FRAME,
          top: 0,
          width: PUNY_FRAME,
          height: PUNY_FRAME,
        })
        .resize(OUT_FRAME, OUT_FRAME, { kernel: "nearest" })
        .raw()
        .toBuffer();
      frameBuffers.push(wFrame);
      frameBuffers.push(aFrame);
    }
  }

  const atlasBuffer = Buffer.alloc(ATLAS_W * ATLAS_H * 4);
  for (let i = 0; i < frameBuffers.length; i++) {
    const col = i % ATLAS_COLS;
    const row = Math.floor(i / ATLAS_COLS);
    const fb = frameBuffers[i];
    for (let y = 0; y < OUT_FRAME; y++) {
      const srcOffset = y * OUT_FRAME * 4;
      const dstOffset =
        ((row * OUT_FRAME + y) * ATLAS_W + col * OUT_FRAME) * 4;
      fb.copy(atlasBuffer, dstOffset, srcOffset, srcOffset + OUT_FRAME * 4);
    }
  }

  const outDir = join(REMASTER_DIR, key);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  await sharp(atlasBuffer, {
    raw: { width: ATLAS_W, height: ATLAS_H, channels: 4 },
  })
    .png()
    .toFile(join(outDir, "atlas.png"));

  const atlasJson = generateAtlasJson(key);
  writeFileSync(
    join(outDir, "atlas.sample.json"),
    JSON.stringify(atlasJson, null, 2),
  );

  console.log(`  ✓ ${key} (from Slime.png)`);
  return {
    key: `${key}_atlas`,
    textureSrc: `/game-assets/remaster/examples/${key}/atlas.png`,
    atlasSrc: `/game-assets/remaster/examples/${key}/atlas.sample.json`,
    entries: generateManifestEntries(key),
  };
}

async function main() {
  console.log("Converting Puny Characters to atlas format...\n");

  const atlases = [];

  // Process all standard characters (768x256)
  for (const charDef of CHARACTER_MAP) {
    try {
      const entry = await processCharacter(charDef);
      atlases.push(entry);
    } catch (err) {
      console.error(`  ✗ ${charDef.key}: ${err.message}`);
    }
  }

  // Process slime separately
  try {
    const slimeEntry = await processSlime();
    atlases.push(slimeEntry);
  } catch (err) {
    console.error(`  ✗ slime: ${err.message}`);
  }

  // Write manifest.json
  const manifest = {
    version: 1,
    textures: [],
    spritesheets: [],
    atlases,
  };

  const manifestPath = join(
    process.cwd(),
    "public/game-assets/remaster/manifest.json",
  );
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest written with ${atlases.length} atlases.`);
  console.log("Done!");
}

main().catch(console.error);
