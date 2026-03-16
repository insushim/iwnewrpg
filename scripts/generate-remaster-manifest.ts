import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  REMASTER_FRAME_SIZE,
  REMASTER_UNIT_PACKS,
  getRemasterFrameDefinitions,
} from "../src/game/render/remasterTextureCatalog";

async function main() {
  const outputPath = resolve(
    process.cwd(),
    "public/game-assets/remaster/manifest.template.json",
  );

  const textures = getRemasterFrameDefinitions().map((definition) => ({
    key: definition.key,
    src: `/game-assets/remaster/${definition.base}/${definition.state}_${definition.direction}_${definition.frame}.png`,
  }));
  const definitions = getRemasterFrameDefinitions();
  const spritesheets = REMASTER_UNIT_PACKS.map((pack) => ({
    key: `${pack.base}_sheet`,
    src: `/game-assets/remaster/${pack.base}/sheet.png`,
    frameWidth: REMASTER_FRAME_SIZE,
    frameHeight: REMASTER_FRAME_SIZE,
    entries: definitions
      .filter((definition) => definition.base === pack.base)
      .map((definition) => definition.key),
  }));
  const atlases = REMASTER_UNIT_PACKS.map((pack) => ({
    key: `${pack.base}_atlas`,
    textureSrc: `/game-assets/remaster/${pack.base}/atlas.png`,
    atlasSrc: `/game-assets/remaster/${pack.base}/atlas.json`,
    entries: definitions
      .filter((definition) => definition.base === pack.base)
      .map((definition) => ({
        key: definition.key,
        frame: definition.key,
      })),
  }));

  const payload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    textures,
    spritesheets,
    atlases,
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(
    `Generated ${textures.length} remaster texture entries, ${spritesheets.length} spritesheet groups, and ${atlases.length} atlas groups at ${outputPath}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
