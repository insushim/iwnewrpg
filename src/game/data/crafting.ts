export interface CraftingMaterial {
  itemId: string;
  quantity: number;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  npcId: string;
  materials: CraftingMaterial[];
  resultItemId: string;
  level: number;
}

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: "recipe_leather_cap",
    name: "가죽 모자",
    npcId: "radar",
    materials: [
      { itemId: "animal_hide", quantity: 5 },
      { itemId: "iron_ore", quantity: 1 },
    ],
    resultItemId: "leather_cap",
    level: 5,
  },
  {
    id: "recipe_chain_mail",
    name: "체인 메일",
    npcId: "radar",
    materials: [
      { itemId: "iron_ore", quantity: 12 },
      { itemId: "animal_hide", quantity: 8 },
    ],
    resultItemId: "chain_mail",
    level: 10,
  },
  {
    id: "recipe_iron_sword",
    name: "철검",
    npcId: "radar",
    materials: [
      { itemId: "iron_ore", quantity: 8 },
      { itemId: "animal_hide", quantity: 2 },
    ],
    resultItemId: "iron_sword",
    level: 5,
  },
  {
    id: "recipe_mithril_longsword",
    name: "미스릴 장검",
    npcId: "karon",
    materials: [
      { itemId: "mithril_ore", quantity: 10 },
      { itemId: "iron_ore", quantity: 15 },
      { itemId: "magic_crystal", quantity: 3 },
    ],
    resultItemId: "mithril_longsword",
    level: 15,
  },
  {
    id: "recipe_hunter_bow",
    name: "사냥꾼의 활",
    npcId: "radar",
    materials: [
      { itemId: "animal_hide", quantity: 6 },
      { itemId: "iron_ore", quantity: 4 },
    ],
    resultItemId: "hunter_bow",
    level: 8,
  },
  {
    id: "recipe_arcana_staff",
    name: "아르카나 스태프",
    npcId: "karon",
    materials: [
      { itemId: "mithril_ore", quantity: 8 },
      { itemId: "magic_crystal", quantity: 10 },
      { itemId: "shadow_essence", quantity: 5 },
    ],
    resultItemId: "arcana_staff",
    level: 30,
  },
  {
    id: "recipe_guardian_ring",
    name: "가디언 링",
    npcId: "karon",
    materials: [
      { itemId: "mithril_ore", quantity: 5 },
      { itemId: "magic_crystal", quantity: 3 },
      { itemId: "dragon_bone", quantity: 1 },
    ],
    resultItemId: "guardian_ring",
    level: 25,
  },
  {
    id: "recipe_red_potion_bundle",
    name: "체력 물약 묶음 (x5)",
    npcId: "betty",
    materials: [{ itemId: "animal_hide", quantity: 3 }],
    resultItemId: "red_potion",
    level: 1,
  },
  {
    id: "recipe_blue_potion_bundle",
    name: "마력 물약 묶음 (x3)",
    npcId: "garo",
    materials: [{ itemId: "magic_crystal", quantity: 1 }],
    resultItemId: "blue_potion",
    level: 10,
  },
];
