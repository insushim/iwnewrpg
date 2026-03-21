/**
 * LPC Spritesheet → Game Format Converter
 *
 * LPC format: 832x1344 (13 cols x 21 rows of 64x64 frames)
 * LPC rows:
 *   0:  spellcast up     (7 frames)
 *   1:  spellcast left   (7)
 *   2:  spellcast down   (7)
 *   3:  spellcast right  (7)
 *   4:  thrust up        (8)
 *   5:  thrust left      (8)
 *   6:  thrust down      (8)
 *   7:  thrust right     (8)
 *   8:  walk up          (9)
 *   9:  walk left        (9)
 *   10: walk down        (9)
 *   11: walk right       (9)
 *   12: slash up         (6)
 *   13: slash left       (6)
 *   14: slash down       (6)
 *   15: slash right      (6)
 *   16: shoot up         (13)
 *   17: shoot left       (13)
 *   18: shoot down       (13)
 *   19: shoot right      (13)
 *   20: hurt/die         (6)
 *
 * Game format: 128x128 per frame
 * Directions: n, ne, e, se, s, sw, w, nw
 * States: idle (2 frames), walk (4 frames), attack (4 frames)
 *
 * Mapping LPC 4-dir → Game 8-dir:
 *   n  = up      (LPC rows 8,12)
 *   s  = down    (LPC rows 10,14)
 *   e  = right   (LPC rows 11,15)
 *   w  = left    (LPC rows 9,13)
 *   ne = up (mirrored from right)
 *   nw = up (mirrored from left)
 *   se = down (from right)
 *   sw = down (from left)
 */

import sharp from 'sharp';
import { readdir, mkdir, writeFile } from 'fs/promises';
import path from 'path';

const SPRITE_DIR = 'public/game-assets/remaster/sprites';
const OUT_DIR = 'public/game-assets/remaster/characters';
const LPC_FRAME = 64;
const GAME_FRAME = 128;

// LPC direction → row offsets for walk and slash
const LPC_WALK = { up: 8, left: 9, down: 10, right: 11 };
const LPC_SLASH = { up: 12, left: 13, down: 14, right: 15 };

// Game direction → LPC direction mapping
const DIR_MAP = {
  n:  'up',
  ne: 'right', // use right, slightly different
  e:  'right',
  se: 'right',
  s:  'down',
  sw: 'left',
  w:  'left',
  nw: 'left',
};

// Which walk frames to use for idle (standing frames)
const IDLE_FRAMES = [0, 0]; // first walk frame = standing
const WALK_FRAMES = [1, 3, 5, 7]; // every other walk frame for 4-frame walk
const ATTACK_FRAMES = [0, 1, 3, 5]; // slash frames

async function extractFrame(inputPng, row, col) {
  const left = col * LPC_FRAME;
  const top = row * LPC_FRAME;

  // Extract 64x64 frame, then resize to 128x128
  return sharp(inputPng)
    .extract({ left, top, width: LPC_FRAME, height: LPC_FRAME })
    .resize(GAME_FRAME, GAME_FRAME, { kernel: 'nearest' }) // pixel art scaling
    .png()
    .toBuffer();
}

async function compositeFrames(layers, row, col) {
  // Start with first layer
  let result = await extractFrame(layers[0], row, col);

  // Composite remaining layers on top
  for (let i = 1; i < layers.length; i++) {
    const overlay = await extractFrame(layers[i], row, col);
    result = await sharp(result)
      .composite([{ input: overlay, blend: 'over' }])
      .png()
      .toBuffer();
  }

  return result;
}

async function generateCharacter(name, layers, outBase) {
  await mkdir(path.join(OUT_DIR, outBase), { recursive: true });

  const directions = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
  const manifest = [];

  for (const dir of directions) {
    const lpcDir = DIR_MAP[dir];
    const walkRow = LPC_WALK[lpcDir];
    const slashRow = LPC_SLASH[lpcDir];
    const needsFlip = false; // LPC already has left/right

    // Idle frames (2)
    for (let i = 0; i < 2; i++) {
      const key = `${outBase}_idle_${dir}_${i}`;
      const frame = await compositeFrames(layers, walkRow, IDLE_FRAMES[i]);
      const outPath = path.join(OUT_DIR, outBase, `${key}.png`);
      await sharp(frame).toFile(outPath);
      manifest.push({ key, src: `/game-assets/remaster/characters/${outBase}/${key}.png` });
    }

    // Walk frames (4)
    for (let i = 0; i < 4; i++) {
      const key = `${outBase}_walk_${dir}_${i}`;
      const col = WALK_FRAMES[i] < 9 ? WALK_FRAMES[i] : 0;
      const frame = await compositeFrames(layers, walkRow, col);
      const outPath = path.join(OUT_DIR, outBase, `${key}.png`);
      await sharp(frame).toFile(outPath);
      manifest.push({ key, src: `/game-assets/remaster/characters/${outBase}/${key}.png` });
    }

    // Attack frames (4)
    for (let i = 0; i < 4; i++) {
      const key = `${outBase}_attack_${dir}_${i}`;
      const col = ATTACK_FRAMES[i] < 6 ? ATTACK_FRAMES[i] : 0;
      const frame = await compositeFrames(layers, slashRow, col);
      const outPath = path.join(OUT_DIR, outBase, `${key}.png`);
      await sharp(frame).toFile(outPath);
      manifest.push({ key, src: `/game-assets/remaster/characters/${outBase}/${key}.png` });
    }
  }

  console.log(`  ✅ ${name}: ${manifest.length} frames generated`);
  return manifest;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const sp = (name) => path.join(SPRITE_DIR, name);

  const allTextures = [];

  // Guardian (plate armor + body)
  console.log('Generating characters...');
  allTextures.push(...await generateCharacter(
    'Guardian', [sp('body.png'), sp('legs_pants.png'), sp('shoes.png'), sp('armor_plate.png')],
    'anim_player_guardian'
  ));
  allTextures.push(...await generateCharacter(
    'Guardian (dagger)', [sp('body.png'), sp('legs_pants.png'), sp('shoes.png'), sp('armor_plate.png')],
    'anim_player_guardian_dagger'
  ));
  allTextures.push(...await generateCharacter(
    'Guardian (sword)', [sp('body.png'), sp('legs_pants.png'), sp('shoes.png'), sp('armor_plate.png')],
    'anim_player_guardian_sword'
  ));
  allTextures.push(...await generateCharacter(
    'Guardian (greatsword)', [sp('body.png'), sp('legs_pants.png'), sp('shoes.png'), sp('armor_plate.png')],
    'anim_player_guardian_greatsword'
  ));

  // Ranger (body + pants, no heavy armor)
  allTextures.push(...await generateCharacter(
    'Ranger', [sp('body.png'), sp('legs_pants.png'), sp('shoes.png')],
    'anim_player_ranger'
  ));
  allTextures.push(...await generateCharacter(
    'Ranger (bow)', [sp('body.png'), sp('legs_pants.png'), sp('shoes.png')],
    'anim_player_ranger_bow'
  ));

  // Arcanist (dark elf body for mage look)
  allTextures.push(...await generateCharacter(
    'Arcanist', [sp('darkelf.png'), sp('legs_pants.png'), sp('shoes.png')],
    'anim_player_arcanist'
  ));
  allTextures.push(...await generateCharacter(
    'Arcanist (staff)', [sp('darkelf.png'), sp('legs_pants.png'), sp('shoes.png')],
    'anim_player_arcanist_staff'
  ));

  // Sovereign (body + armor)
  allTextures.push(...await generateCharacter(
    'Sovereign', [sp('body.png'), sp('legs_pants.png'), sp('shoes.png'), sp('armor_plate.png'), sp('hair_brown.png')],
    'anim_player_sovereign'
  ));
  allTextures.push(...await generateCharacter(
    'Sovereign (dagger)', [sp('body.png'), sp('legs_pants.png'), sp('shoes.png'), sp('armor_plate.png'), sp('hair_brown.png')],
    'anim_player_sovereign_dagger'
  ));
  allTextures.push(...await generateCharacter(
    'Sovereign (sword)', [sp('body.png'), sp('legs_pants.png'), sp('shoes.png'), sp('armor_plate.png'), sp('hair_brown.png')],
    'anim_player_sovereign_sword'
  ));
  allTextures.push(...await generateCharacter(
    'Sovereign (greatsword)', [sp('body.png'), sp('legs_pants.png'), sp('shoes.png'), sp('armor_plate.png'), sp('hair_brown.png')],
    'anim_player_sovereign_greatsword'
  ));

  // Skeleton monster
  allTextures.push(...await generateCharacter(
    'Skeleton', [sp('skeleton.png')],
    'anim_monster_skeleton'
  ));

  // Orc monster
  allTextures.push(...await generateCharacter(
    'Orc', [sp('orc.png'), sp('legs_pants.png')],
    'anim_monster_orc'
  ));

  // NPCs
  allTextures.push(...await generateCharacter(
    'NPC Weapon', [sp('body.png'), sp('legs_pants.png'), sp('shoes.png'), sp('armor_plate.png')],
    'anim_npc_weapon'
  ));
  allTextures.push(...await generateCharacter(
    'NPC Armor', [sp('body.png'), sp('legs_pants.png'), sp('shoes.png'), sp('armor_plate.png')],
    'anim_npc_armor'
  ));
  allTextures.push(...await generateCharacter(
    'NPC Magic', [sp('darkelf.png'), sp('legs_pants.png'), sp('shoes.png')],
    'anim_npc_magic'
  ));
  allTextures.push(...await generateCharacter(
    'NPC Inn', [sp('body_female.png'), sp('legs_pants.png'), sp('shoes.png')],
    'anim_npc_inn'
  ));
  allTextures.push(...await generateCharacter(
    'NPC Blacksmith', [sp('body.png'), sp('legs_pants.png'), sp('shoes.png'), sp('armor_plate.png')],
    'anim_npc_blacksmith'
  ));
  allTextures.push(...await generateCharacter(
    'NPC Default', [sp('body.png'), sp('legs_pants.png'), sp('shoes.png'), sp('hair_brown.png')],
    'anim_npc_default'
  ));

  // Write manifest
  const manifest = {
    version: 2,
    textures: allTextures,
    spritesheets: [],
    atlases: [],
  };

  await writeFile(
    'public/game-assets/remaster/manifest.json',
    JSON.stringify(manifest, null, 2)
  );

  console.log(`\n🎉 Total: ${allTextures.length} textures generated`);
  console.log('📄 manifest.json updated');
}

main().catch(console.error);
