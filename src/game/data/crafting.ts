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
];
