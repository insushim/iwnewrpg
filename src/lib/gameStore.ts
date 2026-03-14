"use client";

import { create } from "zustand";
import { ITEMS } from "@/game/data/items";
import { QUESTS, type QuestData } from "@/game/data/quests";
import { getSocket } from "@/lib/socket";
import { ArmorSubType, ItemType } from "@/types/item";
import type { QuizQuestion, QuizReward } from "@/types/quiz";

type ChatMessage = {
  id: string;
  channel: "system" | "normal" | "party" | "clan" | "trade";
  author: string;
  message: string;
  timestamp: number;
};

type BuffState = {
  id: string;
  name: string;
  remaining: number;
};

type PlayerSnapshot = {
  name: string;
  className: string;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  exp: number;
  expToNext: number;
  gold: number;
  alignment: number;
  buffs: BuffState[];
};

type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
  type: string;
};

type DroppedLoot = {
  lootId: string;
  itemId: string;
  name: string;
  quantity: number;
  x: number;
  y: number;
};

type EquipmentSlot =
  | "weapon"
  | "armor"
  | "helmet"
  | "shield"
  | "cloak"
  | "boots"
  | "gloves"
  | "ring1"
  | "ring2"
  | "amulet"
  | "belt";

type EquipmentState = Partial<Record<EquipmentSlot, InventoryItem>>;
type QuestStatus =
  | "available"
  | "in_progress"
  | "ready_to_turn_in"
  | "claimable"
  | "completed";

type QuestProgress = {
  questId: string;
  status: QuestStatus;
  progress: number;
};

type UiState = {
  inventoryOpen: boolean;
  chatOpen: boolean;
  shopOpen: boolean;
  activeShopId: string | null;
  selectedInventoryItemId: string | null;
  dialogueOpen: boolean;
  activeNpcId: string | null;
  activeNpcName: string | null;
  activeDialogue: string[];
  questWindowOpen: boolean;
  deathOpen: boolean;
  expLostOnDeath: number;
};

type WorldPlayer = {
  id: string;
  name: string;
  mapId: string;
  x: number;
  y: number;
};

type WorldMonster = {
  id: string;
  mapId: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  x: number;
  y: number;
};

type QuizFeedback = {
  status: "correct" | "wrong" | "timeout";
  answer: string;
  reward?: QuizReward;
};

type QuizState = {
  active: boolean;
  question: QuizQuestion | null;
  choices: string[];
  monsterId: string | null;
  monsterLevel: number;
  timeLimit: number;
  remaining: number;
  streak: number;
  bossStep: number;
  bossTotal: number;
  feedback: QuizFeedback | null;
};

type AttackProfile = {
  str: number;
  dex: number;
  int: number;
};

type DerivedStats = {
  maxHp: number;
  maxMp: number;
  ac: number;
  minAttack: number;
  maxAttack: number;
};

type NpcQuestView = QuestData & {
  status: QuestStatus;
  progress: number;
  goal: number;
};

type GameStore = {
  player: PlayerSnapshot;
  currentMapId: string;
  inventory: InventoryItem[];
  equipment: EquipmentState;
  droppedLoot: DroppedLoot[];
  chat: ChatMessage[];
  quests: QuestProgress[];
  ui: UiState;
  connected: boolean;
  selfId: string | null;
  worldPlayers: WorldPlayer[];
  worldMonsters: WorldMonster[];
  quiz: QuizState;
  setPlayer: (player: Partial<PlayerSnapshot>) => void;
  setInventory: (items: InventoryItem[]) => void;
  setEquipment: (equipment: EquipmentState) => void;
  setQuests: (quests: QuestProgress[]) => void;
  setCurrentMapId: (mapId: string) => void;
  addDroppedLoot: (items: DroppedLoot[]) => void;
  removeDroppedLoot: (lootId: string) => void;
  addChat: (message: ChatMessage) => void;
  toggleInventory: () => void;
  toggleShop: () => void;
  toggleQuestWindow: () => void;
  setActiveShop: (shopId: string | null) => void;
  openDialogue: (payload: {
    npcId: string;
    npcName: string;
    dialogue: string[];
  }) => void;
  closeDialogue: () => void;
  openDeath: (expLost: number) => void;
  closeDeath: () => void;
  acceptQuest: (questId: string) => void;
  claimQuestReward: (questId: string) => void;
  updateQuestProgress: (questId: string, progress: number) => void;
  getNpcQuests: (npcId: string | null) => NpcQuestView[];
  selectInventoryItem: (itemId: string | null) => void;
  consumeItem: (itemId: string) => void;
  equipItem: (itemId: string) => void;
  unequipItem: (slot: EquipmentSlot) => void;
  getAttackProfile: () => AttackProfile;
  getDerivedStats: () => DerivedStats;
  setConnected: (connected: boolean) => void;
  setWorld: (payload: {
    selfId: string;
    players: WorldPlayer[];
    monsters: WorldMonster[];
  }) => void;
  upsertWorldPlayer: (player: WorldPlayer) => void;
  removeWorldPlayer: (playerId: string) => void;
  upsertMonster: (monster: WorldMonster) => void;
  openQuiz: (payload: {
    question: QuizQuestion;
    choices: string[];
    monsterId?: string;
    monsterLevel?: number;
    timeLimit?: number;
    streak?: number;
    bossStep?: number;
    bossTotal?: number;
  }) => void;
  tickQuiz: () => void;
  resolveQuiz: (payload: QuizFeedback) => void;
  closeQuiz: () => void;
  applyOfflineReward: (reward: {
    gold: number;
    exp: number;
    items?: string[];
  }) => void;
};

const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: "red_potion",
    name: "붉은 물약",
    quantity: 10,
    rarity: "common",
    type: "consumable",
  },
  {
    id: "trainee_dagger",
    name: "수련생의 단검",
    quantity: 1,
    rarity: "common",
    type: "weapon",
  },
  {
    id: "teleport_scroll",
    name: "순간이동 주문서",
    quantity: 3,
    rarity: "common",
    type: "scroll",
  },
];

const INITIAL_QUESTS: QuestProgress[] = QUESTS.map((quest) => ({
  questId: quest.id,
  status: "available",
  progress: 0,
}));

const INITIAL_SYSTEM_TIMESTAMP = 0;

export const useGameStore = create<GameStore>((set, get) => ({
  player: {
    name: "견습 모험가",
    className: "Guardian",
    level: 1,
    hp: 52,
    maxHp: 52,
    mp: 18,
    maxMp: 18,
    exp: 0,
    expToNext: 100,
    gold: 75,
    alignment: 0,
    buffs: [{ id: "starter-blessing", name: "초심자의 축복", remaining: 1200 }],
  },
  currentMapId: "speakingIsland",
  inventory: INITIAL_INVENTORY,
  equipment: {},
  droppedLoot: [],
  chat: [
    {
      id: "system-welcome",
      channel: "system",
      author: "시스템",
      message: "이야기의 섬에 오신 것을 환영합니다.",
      timestamp: INITIAL_SYSTEM_TIMESTAMP,
    },
  ],
  quests: INITIAL_QUESTS,
  ui: {
    inventoryOpen: true,
    chatOpen: true,
    shopOpen: false,
    activeShopId: "radar",
    selectedInventoryItemId: null,
    dialogueOpen: false,
    activeNpcId: null,
    activeNpcName: null,
    activeDialogue: [],
    questWindowOpen: false,
    deathOpen: false,
    expLostOnDeath: 0,
  },
  connected: false,
  selfId: null,
  worldPlayers: [],
  worldMonsters: [],
  quiz: {
    active: false,
    question: null,
    choices: [],
    monsterId: null,
    monsterLevel: 1,
    timeLimit: 10,
    remaining: 10,
    streak: 0,
    bossStep: 1,
    bossTotal: 1,
    feedback: null,
  },
  setPlayer: (player) =>
    set((state) => ({
      player: {
        ...state.player,
        ...player,
      },
    })),
  setInventory: (items) => set(() => ({ inventory: items })),
  setEquipment: (equipment) => set(() => ({ equipment })),
  setQuests: (quests) => set(() => ({ quests })),
  setCurrentMapId: (mapId) => set(() => ({ currentMapId: mapId })),
  addDroppedLoot: (items) =>
    set((state) => ({
      droppedLoot: [
        ...state.droppedLoot.filter(
          (current) => !items.some((next) => next.lootId === current.lootId),
        ),
        ...items,
      ],
    })),
  removeDroppedLoot: (lootId) =>
    set((state) => ({
      droppedLoot: state.droppedLoot.filter((entry) => entry.lootId !== lootId),
    })),
  addChat: (message) =>
    set((state) => ({
      chat: [...state.chat.slice(-49), message],
    })),
  toggleInventory: () =>
    set((state) => ({
      ui: {
        ...state.ui,
        inventoryOpen: !state.ui.inventoryOpen,
      },
    })),
  toggleShop: () =>
    set((state) => ({
      ui: {
        ...state.ui,
        shopOpen: !state.ui.shopOpen,
      },
    })),
  toggleQuestWindow: () =>
    set((state) => ({
      ui: {
        ...state.ui,
        questWindowOpen: !state.ui.questWindowOpen,
      },
    })),
  setActiveShop: (shopId) =>
    set((state) => ({
      ui: {
        ...state.ui,
        activeShopId: shopId,
      },
    })),
  openDialogue: ({ npcId, npcName, dialogue }) =>
    set((state) => ({
      ui: {
        ...state.ui,
        dialogueOpen: true,
        activeNpcId: npcId,
        activeNpcName: npcName,
        activeDialogue: dialogue,
      },
    })),
  closeDialogue: () =>
    set((state) => ({
      ui: {
        ...state.ui,
        dialogueOpen: false,
        activeNpcId: null,
        activeNpcName: null,
        activeDialogue: [],
      },
    })),
  openDeath: (expLost) =>
    set((state) => ({
      ui: {
        ...state.ui,
        deathOpen: true,
        expLostOnDeath: expLost,
      },
    })),
  closeDeath: () =>
    set((state) => ({
      ui: {
        ...state.ui,
        deathOpen: false,
        expLostOnDeath: 0,
      },
    })),
  acceptQuest: (questId) => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit("quest:accept", { questId });
      return;
    }

    set((state) => ({
      quests: state.quests.map((quest) =>
        quest.questId === questId
          ? { ...quest, status: "in_progress", progress: 0 }
          : quest,
      ),
      ui: {
        ...state.ui,
        questWindowOpen: true,
      },
      chat: [
        ...state.chat.slice(-48),
        {
          id: crypto.randomUUID(),
          channel: "system",
          author: "시스템",
          message: `${QUESTS.find((quest) => quest.id === questId)?.name ?? "퀘스트"}를 수락했습니다.`,
          timestamp: Date.now(),
        },
      ],
    }));
  },
  claimQuestReward: (questId) => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit("quest:claim", { questId });
      return;
    }

    set((state) => {
      const quest = QUESTS.find((entry) => entry.id === questId);
      const progress = state.quests.find((entry) => entry.questId === questId);
      if (!quest || progress?.status !== "claimable") {
        return state;
      }

      const nextInventory = [...state.inventory];
      quest.rewards.items.forEach((itemId) => {
        const itemData = ITEMS[itemId];
        if (!itemData) return;
        const existing = nextInventory.find((entry) => entry.id === itemId);
        if (existing) {
          existing.quantity += 1;
        } else {
          nextInventory.push({
            id: itemData.id,
            name: itemData.name,
            quantity: 1,
            rarity: itemData.rarity,
            type: itemData.type,
          });
        }
      });

      const nextPlayer = applyExpReward(
        {
          ...state.player,
          gold: state.player.gold + quest.rewards.gold,
        },
        quest.rewards.exp,
      );

      return {
        inventory: nextInventory,
        player: nextPlayer,
        quests: state.quests.map((entry) =>
          entry.questId === questId ? { ...entry, status: "completed" } : entry,
        ),
        chat: [
          ...state.chat.slice(-48),
          {
            id: crypto.randomUUID(),
            channel: "system",
            author: "시스템",
            message: `${quest.name} 보상을 수령했습니다.`,
            timestamp: Date.now(),
          },
        ],
      };
    });
  },
  updateQuestProgress: (questId, progress) =>
    set((state) => {
      const questData = QUESTS.find((quest) => quest.id === questId);
      const goal = questData?.objectives[0]?.count ?? 1;

      return {
        quests: state.quests.map((quest) =>
          quest.questId === questId
            ? {
                ...quest,
                progress,
                status:
                  progress >= goal && quest.status === "in_progress"
                    ? "ready_to_turn_in"
                    : quest.status,
              }
            : quest,
        ),
      };
    }),
  getNpcQuests: (npcId) => {
    if (!npcId) return [];

    const { quests } = get();
    return QUESTS.filter((quest) => quest.npc === npcId).map((quest) => {
      const progress = quests.find((entry) => entry.questId === quest.id);
      return {
        ...quest,
        status: progress?.status ?? "available",
        progress: progress?.progress ?? 0,
        goal: quest.objectives[0]?.count ?? 1,
      };
    });
  },
  selectInventoryItem: (itemId) =>
    set((state) => ({
      ui: {
        ...state.ui,
        selectedInventoryItemId: itemId,
      },
    })),
  consumeItem: (itemId) => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit("inventory:consume", { itemId });
      set((state) => ({
        ui: { ...state.ui, selectedInventoryItemId: null },
      }));
      return;
    }

    set((state) => {
      const itemData = ITEMS[itemId];
      if (!itemData) {
        return state;
      }

      const derived = getDerivedStatsFromState(state.player, state.equipment);
      const nextInventory = state.inventory
        .map((entry) =>
          entry.id === itemId
            ? { ...entry, quantity: entry.quantity - 1 }
            : entry,
        )
        .filter((entry) => entry.quantity > 0);

      return {
        inventory: nextInventory,
        player: {
          ...state.player,
          hp: Math.min(
            derived.maxHp,
            state.player.hp + (itemData.stats.hp ?? 0),
          ),
          mp: Math.min(
            derived.maxMp,
            state.player.mp + (itemData.stats.mp ?? 0),
          ),
        },
        chat: [
          ...state.chat.slice(-48),
          {
            id: crypto.randomUUID(),
            channel: "system",
            author: "시스템",
            message: `${itemData.name}을 사용했습니다.`,
            timestamp: Date.now(),
          },
        ],
        ui: {
          ...state.ui,
          selectedInventoryItemId: null,
        },
      };
    });
  },
  equipItem: (itemId) => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit("inventory:equip", { itemId });
      set((state) => ({
        ui: { ...state.ui, selectedInventoryItemId: null },
      }));
      return;
    }

    set((state) => {
      const inventoryItem = state.inventory.find(
        (entry) => entry.id === itemId,
      );
      const slot = getEquipSlot(itemId, state.equipment);
      if (!inventoryItem || !slot) {
        return state;
      }

      const nextEquipment = { ...state.equipment };
      const previouslyEquipped = nextEquipment[slot];
      nextEquipment[slot] = inventoryItem;
      const nextInventory = state.inventory.filter(
        (entry) => entry.id !== itemId,
      );
      if (previouslyEquipped) {
        nextInventory.push(previouslyEquipped);
      }

      const derived = getDerivedStatsFromState(state.player, nextEquipment);
      return {
        equipment: nextEquipment,
        inventory: nextInventory,
        player: {
          ...state.player,
          hp: Math.min(derived.maxHp, state.player.hp),
          mp: Math.min(derived.maxMp, state.player.mp),
        },
        ui: {
          ...state.ui,
          selectedInventoryItemId: null,
        },
      };
    });
  },
  unequipItem: (slot) => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit("inventory:unequip", { slot });
      return;
    }

    set((state) => {
      const equipped = state.equipment[slot];
      if (!equipped) {
        return state;
      }

      const nextEquipment = { ...state.equipment };
      delete nextEquipment[slot];
      const derived = getDerivedStatsFromState(state.player, nextEquipment);

      return {
        equipment: nextEquipment,
        inventory: [...state.inventory, equipped],
        player: {
          ...state.player,
          hp: Math.min(derived.maxHp, state.player.hp),
          mp: Math.min(derived.maxMp, state.player.mp),
        },
      };
    });
  },
  getAttackProfile: () => {
    const { player, equipment } = get();
    const derived = getDerivedStatsFromState(player, equipment);
    const weapon = equipment.weapon ? ITEMS[equipment.weapon.id] : null;

    if (weapon?.subtype === "staff" || player.className === "Arcanist") {
      return {
        str: 2,
        dex: 1,
        int: 8 + derived.maxAttack + (weapon?.stats.spellPower ?? 0),
      };
    }

    if (weapon?.subtype === "bow" || player.className === "Ranger") {
      return {
        str: 3,
        dex: 6 + derived.maxAttack + (weapon?.stats.rangedDamage ?? 0),
        int: 1,
      };
    }

    return { str: 6 + derived.maxAttack, dex: 2, int: 1 };
  },
  getDerivedStats: () => {
    const { player, equipment } = get();
    return getDerivedStatsFromState(player, equipment);
  },
  setConnected: (connected) => set(() => ({ connected })),
  setWorld: (payload) =>
    set(() => ({
      selfId: payload.selfId,
      currentMapId:
        payload.players.find((entry) => entry.id === payload.selfId)?.mapId ??
        "speakingIsland",
      droppedLoot: [],
      worldPlayers: payload.players,
      worldMonsters: payload.monsters,
    })),
  upsertWorldPlayer: (player) =>
    set((state) => ({
      worldPlayers: state.worldPlayers.some((entry) => entry.id === player.id)
        ? state.worldPlayers.map((entry) =>
            entry.id === player.id ? player : entry,
          )
        : [...state.worldPlayers, player],
    })),
  removeWorldPlayer: (playerId) =>
    set((state) => ({
      worldPlayers: state.worldPlayers.filter((entry) => entry.id !== playerId),
    })),
  upsertMonster: (monster) =>
    set((state) => ({
      worldMonsters: state.worldMonsters.some(
        (entry) => entry.id === monster.id,
      )
        ? state.worldMonsters.map((entry) =>
            entry.id === monster.id ? monster : entry,
          )
        : [...state.worldMonsters, monster],
    })),
  openQuiz: (payload) =>
    set(() => ({
      quiz: {
        active: true,
        question: payload.question,
        choices: payload.choices,
        monsterId: payload.monsterId ?? null,
        monsterLevel: payload.monsterLevel ?? 1,
        timeLimit: payload.timeLimit ?? 10,
        remaining: payload.timeLimit ?? 10,
        streak: payload.streak ?? 0,
        bossStep: payload.bossStep ?? 1,
        bossTotal: payload.bossTotal ?? 1,
        feedback: null,
      },
    })),
  tickQuiz: () =>
    set((state) => ({
      quiz: {
        ...state.quiz,
        remaining: Math.max(0, state.quiz.remaining - 1),
      },
    })),
  resolveQuiz: (feedback) =>
    set((state) => ({
      quiz: {
        ...state.quiz,
        feedback,
      },
    })),
  closeQuiz: () =>
    set((state) => ({
      quiz: {
        ...state.quiz,
        active: false,
        question: null,
        choices: [],
        monsterId: null,
        monsterLevel: 1,
        feedback: null,
        remaining: state.quiz.timeLimit,
      },
    })),
  applyOfflineReward: ({ gold, exp, items = [] }) => {
    set((state) => {
      const prevLevel = state.player.level;
      const playerWithGold = {
        ...state.player,
        gold: state.player.gold + gold,
      };
      const nextPlayer = applyExpReward(playerWithGold, exp);
      const leveled = nextPlayer.level > prevLevel;

      const nextInventory = [...state.inventory];
      items.forEach((itemId) => {
        const itemData = ITEMS[itemId];
        if (!itemData) return;
        const existing = nextInventory.find((entry) => entry.id === itemId);
        if (existing) {
          existing.quantity += 1;
        } else {
          nextInventory.push({
            id: itemData.id,
            name: itemData.name,
            quantity: 1,
            rarity: itemData.rarity,
            type: itemData.type,
          });
        }
      });

      const messages: ChatMessage[] = [
        {
          id: crypto.randomUUID(),
          channel: "system",
          author: "시스템",
          message: `+${gold} Gold, +${exp} EXP 획득!`,
          timestamp: Date.now(),
        },
      ];
      if (leveled) {
        messages.push({
          id: crypto.randomUUID(),
          channel: "system",
          author: "시스템",
          message: `레벨 업! Lv.${nextPlayer.level} 달성!`,
          timestamp: Date.now() + 1,
        });
      }

      return {
        player: nextPlayer,
        inventory: nextInventory,
        chat: [...state.chat.slice(-(50 - messages.length)), ...messages],
      };
    });
  },
}));

function getEquipSlot(
  itemId: string,
  equipment: EquipmentState,
): EquipmentSlot | null {
  const item = ITEMS[itemId];
  if (!item) return null;
  if (item.type === ItemType.WEAPON) return "weapon";
  if (item.subtype === ArmorSubType.ARMOR) return "armor";
  if (item.subtype === ArmorSubType.HELMET) return "helmet";
  if (item.subtype === ArmorSubType.SHIELD) return "shield";
  if (item.subtype === ArmorSubType.CLOAK) return "cloak";
  if (item.subtype === ArmorSubType.BOOTS) return "boots";
  if (item.subtype === ArmorSubType.GLOVES) return "gloves";
  if (item.subtype === ArmorSubType.RING)
    return equipment.ring1 ? "ring2" : "ring1";
  if (item.subtype === ArmorSubType.AMULET) return "amulet";
  if (item.subtype === ArmorSubType.BELT) return "belt";
  return null;
}

function getDerivedStatsFromState(
  player: PlayerSnapshot,
  equipment: EquipmentState,
): DerivedStats {
  const equippedItems = Object.values(equipment)
    .map((item) => (item ? ITEMS[item.id] : null))
    .filter(Boolean);

  const hpBonus = equippedItems.reduce(
    (sum, item) => sum + (item?.stats.hp ?? 0),
    0,
  );
  const mpBonus = equippedItems.reduce(
    (sum, item) => sum + (item?.stats.mp ?? 0),
    0,
  );
  const acBonus = equippedItems.reduce(
    (sum, item) => sum + (item?.stats.ac ?? 0),
    0,
  );
  const weapon = equipment.weapon ? ITEMS[equipment.weapon.id] : null;

  return {
    maxHp: player.maxHp + hpBonus,
    maxMp: player.maxMp + mpBonus,
    ac: 10 + acBonus,
    minAttack: weapon?.stats.minAttack ?? 1,
    maxAttack: weapon?.stats.maxAttack ?? 2,
  };
}

function applyExpReward(player: PlayerSnapshot, expReward: number) {
  const nextPlayer = { ...player, exp: player.exp + expReward };

  while (nextPlayer.exp >= nextPlayer.expToNext) {
    nextPlayer.exp -= nextPlayer.expToNext;
    nextPlayer.level += 1;
    nextPlayer.expToNext = 100 + (nextPlayer.level - 1) * 50;
    nextPlayer.maxHp += 6;
    nextPlayer.maxMp += 3;
    nextPlayer.hp = nextPlayer.maxHp;
    nextPlayer.mp = nextPlayer.maxMp;
  }

  return nextPlayer;
}

export type {
  EquipmentSlot,
  EquipmentState,
  InventoryItem,
  PlayerSnapshot,
  DroppedLoot,
  QuestProgress,
  QuestStatus,
};
