export type DirectionKey = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";
export type UnitState = "idle" | "walk" | "attack";
export type FrameFamily =
  | "humanoid"
  | "slime"
  | "spider"
  | "wolf"
  | "orc"
  | "boar"
  | "wisp"
  | "dragon"
  | "golem"
  | "skeleton";

export type WeaponKind =
  | "blade"
  | "dagger"
  | "sword"
  | "greatsword"
  | "bow"
  | "staff"
  | "none";

export type PalettePack = {
  base: string;
  family: FrameFamily;
  primary: number;
  secondary: number;
  tertiary: number;
  accent: number;
  weapon?: WeaponKind;
};

export type RemasterFrameDefinition = {
  key: string;
  base: string;
  direction: DirectionKey;
  state: UnitState;
  frame: number;
};

export const REMASTER_FRAME_SIZE = 128;
export const REMASTER_DIRECTIONS: DirectionKey[] = [
  "n",
  "ne",
  "e",
  "se",
  "s",
  "sw",
  "w",
  "nw",
];

export const REMASTER_UNIT_PACKS: PalettePack[] = [
  {
    base: "anim_player_guardian",
    family: "humanoid",
    primary: 0x809eff,
    secondary: 0x243f8a,
    tertiary: 0xd6e6ff,
    accent: 0x2d3960,
    weapon: "sword",
  },
  {
    base: "anim_player_guardian_dagger",
    family: "humanoid",
    primary: 0x8aa6ff,
    secondary: 0x1e356f,
    tertiary: 0xdeebff,
    accent: 0x23304f,
    weapon: "dagger",
  },
  {
    base: "anim_player_guardian_sword",
    family: "humanoid",
    primary: 0x809eff,
    secondary: 0x243f8a,
    tertiary: 0xd6e6ff,
    accent: 0x2d3960,
    weapon: "sword",
  },
  {
    base: "anim_player_guardian_greatsword",
    family: "humanoid",
    primary: 0x7895f1,
    secondary: 0x1e326a,
    tertiary: 0xd9e6ff,
    accent: 0x213151,
    weapon: "greatsword",
  },
  {
    base: "anim_player_ranger",
    family: "humanoid",
    primary: 0x86d497,
    secondary: 0x264f2d,
    tertiary: 0xe7f8c2,
    accent: 0x6a5631,
    weapon: "bow",
  },
  {
    base: "anim_player_ranger_bow",
    family: "humanoid",
    primary: 0x86d497,
    secondary: 0x264f2d,
    tertiary: 0xe7f8c2,
    accent: 0x6a5631,
    weapon: "bow",
  },
  {
    base: "anim_player_arcanist",
    family: "humanoid",
    primary: 0xd6a4ff,
    secondary: 0x4c2878,
    tertiary: 0xf2dfff,
    accent: 0x362046,
    weapon: "staff",
  },
  {
    base: "anim_player_arcanist_staff",
    family: "humanoid",
    primary: 0xd6a4ff,
    secondary: 0x4c2878,
    tertiary: 0xf2dfff,
    accent: 0x362046,
    weapon: "staff",
  },
  {
    base: "anim_player_sovereign",
    family: "humanoid",
    primary: 0xd8bb6c,
    secondary: 0x5d3d19,
    tertiary: 0xffefb5,
    accent: 0x5a4421,
    weapon: "sword",
  },
  {
    base: "anim_player_sovereign_dagger",
    family: "humanoid",
    primary: 0xdcbe72,
    secondary: 0x5d3116,
    tertiary: 0xfff0bc,
    accent: 0x4e331a,
    weapon: "dagger",
  },
  {
    base: "anim_player_sovereign_sword",
    family: "humanoid",
    primary: 0xd8bb6c,
    secondary: 0x5d3d19,
    tertiary: 0xffefb5,
    accent: 0x5a4421,
    weapon: "sword",
  },
  {
    base: "anim_player_sovereign_greatsword",
    family: "humanoid",
    primary: 0xd4b25b,
    secondary: 0x533412,
    tertiary: 0xffeab3,
    accent: 0x4a3317,
    weapon: "greatsword",
  },
  {
    base: "anim_npc_weapon",
    family: "humanoid",
    primary: 0x69b4ff,
    secondary: 0x21466f,
    tertiary: 0xd8f1ff,
    accent: 0x12263f,
    weapon: "blade",
  },
  {
    base: "anim_npc_armor",
    family: "humanoid",
    primary: 0x7ed7c2,
    secondary: 0x1f6457,
    tertiary: 0xdffff7,
    accent: 0x16302d,
    weapon: "none",
  },
  {
    base: "anim_npc_magic",
    family: "humanoid",
    primary: 0xd889ff,
    secondary: 0x5b2e7d,
    tertiary: 0xffd7ff,
    accent: 0x2b1939,
    weapon: "staff",
  },
  {
    base: "anim_npc_inn",
    family: "humanoid",
    primary: 0xffb17f,
    secondary: 0x7b4827,
    tertiary: 0xffedd3,
    accent: 0x452514,
    weapon: "none",
  },
  {
    base: "anim_npc_blacksmith",
    family: "humanoid",
    primary: 0xff8568,
    secondary: 0x733b2c,
    tertiary: 0xffd9ce,
    accent: 0x321412,
    weapon: "blade",
  },
  {
    base: "anim_npc_default",
    family: "humanoid",
    primary: 0xe6db97,
    secondary: 0x665925,
    tertiary: 0xfff4ba,
    accent: 0x332e17,
    weapon: "none",
  },
  {
    base: "anim_monster_slime",
    family: "slime",
    primary: 0xd65b4b,
    secondary: 0xf48a74,
    tertiary: 0xffc1b6,
    accent: 0x111111,
  },
  {
    base: "anim_monster_bog",
    family: "slime",
    primary: 0x6f9d56,
    secondary: 0x8fc772,
    tertiary: 0xd7ffd0,
    accent: 0x111111,
  },
  {
    base: "anim_monster_spider",
    family: "spider",
    primary: 0x46654b,
    secondary: 0x9ac48c,
    tertiary: 0xf7f5ec,
    accent: 0x172012,
  },
  {
    base: "anim_monster_wolf",
    family: "wolf",
    primary: 0x8b8f96,
    secondary: 0xcfd6dc,
    tertiary: 0xf7f5ec,
    accent: 0x171a1f,
  },
  {
    base: "anim_monster_orc",
    family: "orc",
    primary: 0x7da04e,
    secondary: 0xc6d98b,
    tertiary: 0xf3ebdc,
    accent: 0x1b1210,
  },
  {
    base: "anim_monster_boar",
    family: "boar",
    primary: 0x7e5638,
    secondary: 0xf3dfc5,
    tertiary: 0xfff5ec,
    accent: 0x241511,
  },
  {
    base: "anim_monster_wisp",
    family: "wisp",
    primary: 0x7bd6ff,
    secondary: 0xdff8ff,
    tertiary: 0xffffff,
    accent: 0x69ddff,
  },
  {
    base: "anim_monster_dragon",
    family: "dragon",
    primary: 0xb84b40,
    secondary: 0xffd8b8,
    tertiary: 0xfff3e4,
    accent: 0x280f11,
  },
  {
    base: "anim_monster_rock_golem",
    family: "golem",
    primary: 0x747b72,
    secondary: 0xaad8e2,
    tertiary: 0xe9f8ff,
    accent: 0x1c1d1b,
  },
  {
    base: "anim_monster_skeleton",
    family: "skeleton",
    primary: 0xe6e2d7,
    secondary: 0x8d6f49,
    tertiary: 0xfffaf0,
    accent: 0x171717,
  },
  // === Missing Monster Packs ===
  {
    base: "anim_monster_goblin_child",
    family: "orc",
    primary: 0x6e8f42,
    secondary: 0xadc272,
    tertiary: 0xf0e8d3,
    accent: 0x2a4518,
  },
  {
    base: "anim_monster_goblin_boss",
    family: "orc",
    primary: 0x628233,
    secondary: 0x97b95f,
    tertiary: 0xe8ddc6,
    accent: 0x1f2912,
    weapon: "sword",
  },
  {
    base: "anim_monster_werewolf",
    family: "wolf",
    primary: 0x4a3e36,
    secondary: 0x716053,
    tertiary: 0xd4c7b7,
    accent: 0x1f1b18,
  },
  {
    base: "anim_monster_forest_sprite",
    family: "wisp",
    primary: 0x45c463,
    secondary: 0x78e094,
    tertiary: 0xd9ffdc,
    accent: 0x2d8540,
  },
  {
    base: "anim_monster_orc_archer",
    family: "orc",
    primary: 0x5c7336,
    secondary: 0x8ba05e,
    tertiary: 0xe2dbc4,
    accent: 0x1a2010,
    weapon: "bow",
  },
  {
    base: "anim_monster_kobold_raider",
    family: "orc",
    primary: 0x7a5d3e,
    secondary: 0xb08b66,
    tertiary: 0xf2e6d7,
    accent: 0x2d1e14,
  },
  {
    base: "anim_monster_orc_chief",
    family: "orc",
    primary: 0x5a6b35,
    secondary: 0x879058,
    tertiary: 0xded5c0,
    accent: 0x181d0f,
    weapon: "sword",
  },
  {
    base: "anim_monster_lizard_scout",
    family: "orc",
    primary: 0x4d6b3a,
    secondary: 0x7a9b5c,
    tertiary: 0xe6f1dc,
    accent: 0x1b2513,
  },
  {
    base: "anim_monster_bog_frog",
    family: "slime",
    primary: 0x3d5c2a,
    secondary: 0x658844,
    tertiary: 0xd8e8cc,
    accent: 0x151f10,
  },
  {
    base: "anim_monster_stone_golem",
    family: "golem",
    primary: 0x6d5c4a,
    secondary: 0xa08968,
    tertiary: 0xe8ddc8,
    accent: 0x231e18,
  },
  {
    base: "anim_monster_drake",
    family: "dragon",
    primary: 0x4a6b3e,
    secondary: 0x7a9f6b,
    tertiary: 0xe0f0d8,
    accent: 0x1c2818,
  },
  {
    base: "anim_monster_ash_wyvern",
    family: "dragon",
    primary: 0x6a6359,
    secondary: 0x9e9488,
    tertiary: 0xe8e2d8,
    accent: 0x252018,
  },
  {
    base: "anim_monster_red_dragon",
    family: "dragon",
    primary: 0xc42a1c,
    secondary: 0xe85d48,
    tertiary: 0xffd2c6,
    accent: 0x4a1009,
  },
  {
    base: "anim_monster_slime_boss",
    family: "slime",
    primary: 0x8b4a9c,
    secondary: 0xd178e6,
    tertiary: 0xf2d4ff,
    accent: 0x3d1f46,
  },
  {
    base: "anim_monster_skeleton_boss",
    family: "skeleton",
    primary: 0xe0d8cc,
    secondary: 0xb85c4c,
    tertiary: 0xfff1e8,
    accent: 0x2d1913,
  },
  {
    base: "anim_monster_dark_elf_scout",
    family: "humanoid",
    primary: 0x4a3659,
    secondary: 0x7a5e8c,
    tertiary: 0xe8dff2,
    accent: 0x1f1626,
    weapon: "dagger",
  },
  {
    base: "anim_monster_fire_elemental",
    family: "wisp",
    primary: 0xff5722,
    secondary: 0xff8a65,
    tertiary: 0xffe0d6,
    accent: 0xbf2c00,
  },
  {
    base: "anim_monster_ice_troll",
    family: "orc",
    primary: 0x5e8fb3,
    secondary: 0x87bdd9,
    tertiary: 0xdcf2ff,
    accent: 0x2a4a5e,
  },
  {
    base: "anim_monster_vampire_bat",
    family: "wisp",
    primary: 0x7a3a5c,
    secondary: 0xb85c8b,
    tertiary: 0xf0d4e8,
    accent: 0x3d1d2e,
  },
  {
    base: "anim_monster_bone_archer",
    family: "skeleton",
    primary: 0xe8e0d4,
    secondary: 0xa08660,
    tertiary: 0xfff4e8,
    accent: 0x1f1a14,
    weapon: "bow",
  },
  {
    base: "anim_monster_swamp_witch",
    family: "humanoid",
    primary: 0x5c663a,
    secondary: 0x8f9f60,
    tertiary: 0xe8f2dc,
    accent: 0x232816,
    weapon: "staff",
  },
  {
    base: "anim_monster_stone_giant",
    family: "golem",
    primary: 0x5a483a,
    secondary: 0x8c6f5c,
    tertiary: 0xe8ddd2,
    accent: 0x201614,
  },
  {
    base: "anim_monster_elite_orc_chief",
    family: "orc",
    primary: 0x4a2626,
    secondary: 0x803030,
    tertiary: 0xd8c0c0,
    accent: 0x1a0a0a,
    weapon: "sword",
  },
  {
    base: "anim_monster_ancient_dragon",
    family: "dragon",
    primary: 0x2a1a18,
    secondary: 0x4a3a38,
    tertiary: 0xc8b8b8,
    accent: 0x0f0808,
  },
  {
    base: "anim_monster_shadow_lich",
    family: "skeleton",
    primary: 0x3a2a4a,
    secondary: 0x6a5a8a,
    tertiary: 0xe8dff8,
    accent: 0x1a1026,
    weapon: "staff",
  },
];

export function getRemasterFrameDefinitions(): RemasterFrameDefinition[] {
  const definitions: RemasterFrameDefinition[] = [];

  REMASTER_UNIT_PACKS.forEach((pack) => {
    REMASTER_DIRECTIONS.forEach((direction) => {
      [0, 1].forEach((frame) => {
        definitions.push({
          key: `${pack.base}_idle_${direction}_${frame}`,
          base: pack.base,
          direction,
          state: "idle",
          frame,
        });
      });

      [0, 1, 2, 3].forEach((frame) => {
        definitions.push({
          key: `${pack.base}_walk_${direction}_${frame}`,
          base: pack.base,
          direction,
          state: "walk",
          frame,
        });
        definitions.push({
          key: `${pack.base}_attack_${direction}_${frame}`,
          base: pack.base,
          direction,
          state: "attack",
          frame,
        });
      });
    });
  });

  return definitions;
}
