import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

type RemasterManifest = {
  version: number;
  textures: Array<{ key: string; src: string }>;
  spritesheets: Array<{
    key: string;
    src: string;
    frameWidth: number;
    frameHeight: number;
    entries: string[];
    margin?: number;
    spacing?: number;
    startFrame?: number;
  }>;
  atlases: Array<{
    key: string;
    textureSrc: string;
    atlasSrc: string;
    entries: Array<{ key: string; frame: string }>;
  }>;
};

async function main() {
  const manifestPath = resolve(process.cwd(), "public/game-assets/remaster/manifest.json");
  const playerBases = [
    "anim_player_guardian",
    "anim_player_ranger",
    "anim_player_arcanist",
    "anim_player_sovereign",
  ];
  const npcBases = [
    "anim_npc_weapon",
    "anim_npc_armor",
    "anim_npc_magic",
    "anim_npc_inn",
    "anim_npc_blacksmith",
    "anim_npc_default",
  ];
  const monsterBases = [
    "anim_monster_slime",
    "anim_monster_bog",
    "anim_monster_spider",
    "anim_monster_wolf",
    "anim_monster_orc",
    "anim_monster_boar",
    "anim_monster_wisp",
    "anim_monster_dragon",
    "anim_monster_rock_golem",
    "anim_monster_skeleton",
  ];
  const snippetPaths = [...playerBases, ...npcBases, ...monsterBases].map((base) =>
    resolve(
      process.cwd(),
      `public/game-assets/remaster/examples/${base}/manifest.atlas.sample.json`,
    ),
  );

  const existing = await readExistingManifest(manifestPath);
  const showcaseAtlases = (
    await Promise.all(
      snippetPaths.map(async (snippetPath) => {
        const snippet = JSON.parse(await readFile(snippetPath, "utf8")) as RemasterManifest;
        return snippet.atlases[0];
      }),
    )
  ).filter(Boolean);

  const nextManifest: RemasterManifest = {
    version: 1,
    textures: existing.textures,
    spritesheets: existing.spritesheets,
    atlases: [
      ...showcaseAtlases,
      ...existing.atlases.filter(
        (atlas) => !showcaseAtlases.some((showcaseAtlas) => showcaseAtlas.key === atlas.key),
      ),
    ],
  };

  await writeFile(manifestPath, `${JSON.stringify(nextManifest, null, 2)}\n`, "utf8");
  console.log(
    `Synced runtime manifest with ${showcaseAtlases.length} showcase atlases`,
  );
}

async function readExistingManifest(manifestPath: string): Promise<RemasterManifest> {
  try {
    const raw = await readFile(manifestPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<RemasterManifest>;
    return {
      version: typeof parsed.version === "number" ? parsed.version : 1,
      textures: Array.isArray(parsed.textures) ? parsed.textures : [],
      spritesheets: Array.isArray(parsed.spritesheets) ? parsed.spritesheets : [],
      atlases: Array.isArray(parsed.atlases) ? parsed.atlases : [],
    };
  } catch {
    return {
      version: 1,
      textures: [],
      spritesheets: [],
      atlases: [],
    };
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
