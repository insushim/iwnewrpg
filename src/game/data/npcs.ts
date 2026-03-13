export interface NpcShopEntry {
  itemId: string;
  price?: number;
}

export interface NpcData {
  id: string;
  name: string;
  mapId: string;
  role:
    | "quest"
    | "weapon"
    | "armor"
    | "magic"
    | "inn"
    | "blacksmith"
    | "storage"
    | "teleport"
    | "enchant"
    | "misc";
  position: { x: number; y: number };
  dialogue: string[];
  shopInventory?: NpcShopEntry[];
}

export const NPCS: Record<string, NpcData> = {
  elder: {
    id: "elder",
    name: "원로",
    mapId: "speakingIsland",
    role: "quest",
    position: { x: 12, y: 10 },
    dialogue: [
      "이야기의 섬에 온 것을 환영하네.",
      "사냥과 퀴즈를 함께 익히면 단어의 힘을 빠르게 익힐 수 있을 걸세.",
    ],
  },
  radar: {
    id: "radar",
    name: "무기상인 라다르",
    mapId: "speakingIsland",
    role: "weapon",
    position: { x: 8, y: 14 },
    dialogue: ["좋은 무기는 생존을 돕지. 실전에 맞는 장비를 골라 보게."],
    shopInventory: [{ itemId: "trainee_dagger" }, { itemId: "iron_sword" }, { itemId: "hunter_bow" }],
  },
  eirin: {
    id: "eirin",
    name: "방어구상인 에이린",
    mapId: "speakingIsland",
    role: "armor",
    position: { x: 10, y: 14 },
    dialogue: ["갑옷은 공격을 막아 주는 마지막 방패야."],
    shopInventory: [{ itemId: "leather_cap" }, { itemId: "chain_mail" }, { itemId: "guardian_ring" }],
  },
  garo: {
    id: "garo",
    name: "마법상인 가로",
    mapId: "speakingIsland",
    role: "magic",
    position: { x: 13, y: 14 },
    dialogue: ["마나는 아껴 쓰되, 필요한 순간에는 망설이지 마."],
    shopInventory: [{ itemId: "blue_potion" }, { itemId: "teleport_scroll" }],
  },
  betty: {
    id: "betty",
    name: "여관주인 베티",
    mapId: "speakingIsland",
    role: "inn",
    position: { x: 15, y: 12 },
    dialogue: ["피로를 풀고 다음 모험을 준비해 봐."],
  },
  julie: {
    id: "julie",
    name: "무기상인 줄리",
    mapId: "silverKnightTown",
    role: "weapon",
    position: { x: 14, y: 11 },
    dialogue: ["은기사단 장비는 균형이 중요하지."],
    shopInventory: [{ itemId: "iron_sword" }, { itemId: "mithril_longsword" }],
  },
  knight_captain: {
    id: "knight_captain",
    name: "기사단장",
    mapId: "silverKnightTown",
    role: "quest",
    position: { x: 18, y: 9 },
    dialogue: ["바람숲은 생각보다 더 위험하다.", "준비가 끝났다면 실전 의뢰를 맡기겠다."],
  },
  giran_market: {
    id: "giran_market",
    name: "기란 시장",
    mapId: "giranTown",
    role: "quest",
    position: { x: 20, y: 16 },
    dialogue: ["이 도시에는 거래와 정보가 끊이지 않는다."],
  },
  karon: {
    id: "karon",
    name: "대장장이 카론",
    mapId: "giranTown",
    role: "blacksmith",
    position: { x: 23, y: 18 },
    dialogue: ["재료만 있다면 무기든 갑옷이든 만들어 주지."],
    shopInventory: [{ itemId: "weapon_enchant_scroll" }, { itemId: "mithril_ore" }, { itemId: "magic_crystal" }],
  },
};

export const NPC_LIST = Object.values(NPCS);
