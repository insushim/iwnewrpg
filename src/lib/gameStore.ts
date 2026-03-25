"use client";

import { create } from "zustand";
import { ITEMS } from "@/game/data/items";
import { ACHIEVEMENTS } from "@/game/data/achievements";
import { rollEnchant } from "@/game/systems/enchant";
import { QUESTS, type QuestData } from "@/game/data/quests";
import { getSocket } from "@/lib/socket";
import { EventBus } from "@/components/game/EventBus";
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

type TransformState = {
  active: boolean;
  transformId: string | null;
  remaining: number; // seconds
  cooldownUntil: number; // timestamp
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
  pkCount: number;
  buffs: BuffState[];
};

type RandomOption = { stat: string; value: number; label: string };

type InventoryItem = {
  uid?: string;
  id: string;
  name: string;
  quantity: number;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
  type: string;
  enchantLevel?: number;
  randomOptions?: RandomOption[];
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
  achievementsOpen: boolean;
  chatOpen: boolean;
  enchantOpen: boolean;
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
  minimapOpen: boolean;
  rankingOpen: boolean;
};

type RankingEntry = {
  id: string;
  name: string;
  level: number;
  combatPower: number;
  totalKills: number;
  className: string;
};

type RankingState = {
  rankings: RankingEntry[];
  myRank: number;
  lastUpdated: number;
};

type DailyChallenge = {
  id: string;
  description: string;
  target: number;
  progress: number;
  reward: { gold: number; exp: number };
  completed: boolean;
};

type AutoNavTarget = {
  x: number;
  y: number;
  label: string;
} | null;

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

type AchievementState = {
  id: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
};

type EnchantOutcome = {
  result: "success" | "fail" | "destroy";
  newLevel: number;
  message: string;
};

type GameStore = {
  player: PlayerSnapshot;
  serverName: string;
  grade: number;
  usedWordIds: Set<string>;
  wrongWordIds: Set<string>;
  currentMapId: string;
  pendingLevelUp: boolean;
  pendingDailyBonus: boolean;
  loginStreak: number;
  lastLoginDate: string | null;
  achievements: AchievementState[];
  totalKills: number;
  bossKills: number;
  maxQuizStreak: number;
  visitedMaps: string[];
  activeTitle: string | null;
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
  transform: TransformState;
  ranking: RankingState;
  dailyChallenges: DailyChallenge[];
  autoNavTarget: AutoNavTarget;
  // 콤보/연속 킬 시스템
  comboKills: number;
  comboTimer: number;
  maxCombo: number;
  comboMultiplier: number;
  lastKillTime: number;
  // 자동 사냥 시스템
  autoHuntEnabled: boolean;
  lastAutoPotion: number;
  setPlayer: (player: Partial<PlayerSnapshot>) => void;
  setServerName: (serverName: string) => void;
  setGrade: (grade: number) => void;
  resetUsedWords: () => void;
  resetGame: () => void;
  markWordUsed: (wordId: string) => void;
  markWordWrong: (wordId: string) => void;
  setInventory: (items: InventoryItem[]) => void;
  setEquipment: (equipment: EquipmentState) => void;
  setQuests: (quests: QuestProgress[]) => void;
  setCurrentMapId: (mapId: string) => void;
  clearLevelUp: () => void;
  claimDailyBonus: () => void;
  checkDailyLogin: () => void;
  claimAchievement: (achievementId: string) => void;
  registerKill: (monsterId: string, isBoss: boolean) => void;
  updateAchievementProgress: (
    trackType: string,
    value: number,
    mode?: "add" | "max" | "set",
  ) => void;
  setTitle: (title: string) => void;
  addDroppedLoot: (items: DroppedLoot[]) => void;
  removeDroppedLoot: (lootId: string) => void;
  addChat: (message: ChatMessage) => void;
  toggleInventory: () => void;
  toggleAchievements: () => void;
  toggleShop: () => void;
  toggleEnchant: () => void;
  toggleQuestWindow: () => void;
  toggleMinimap: () => void;
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
  enchantItem: (uid: string, blessed: boolean) => EnchantOutcome;
  setConnected: (connected: boolean) => void;
  setWorld: (payload: {
    selfId: string;
    players: WorldPlayer[];
    monsters: WorldMonster[];
  }) => void;
  upsertWorldPlayer: (player: WorldPlayer) => void;
  removeWorldPlayer: (playerId: string) => void;
  upsertMonster: (monster: WorldMonster) => void;
  activateTransform: (transformId: string) => void;
  tickTransform: () => void;
  cancelTransform: () => void;
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
  inCombat: boolean;
  skillLevels: Record<string, number>;
  sp: number;
  setInCombat: (v: boolean) => void;
  upgradeSkill: (skillId: string) => void;
  activateSkill: (skillId: string) => void;
  applyOfflineReward: (reward: {
    gold: number;
    exp: number;
    items?: string[];
  }) => void;
  // 새로운 기능들
  setRankings: (rankings: RankingEntry[], myRank: number) => void;
  toggleRanking: () => void;
  requestRankings: () => void;
  generateDailyChallenges: () => void;
  updateChallengeProgress: (challengeId: string, progress: number) => void;
  setAutoNavTarget: (target: AutoNavTarget) => void;
  checkMilestoneRewards: (newLevel: number) => void;
  // 콤보/연속 킬 시스템 메서드
  incrementCombo: () => void;
  resetCombo: () => void;
  tickCombo: () => void;
  // 자동 사냥 시스템 메서드
  toggleAutoHunt: () => void;
  // 전투력 계산
  getCombatPower: () => number;
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
    uid: "uid_trainee_dagger_init",
    enchantLevel: 0,
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

const INITIAL_ACHIEVEMENTS: AchievementState[] = ACHIEVEMENTS.map(
  (achievement) => ({
    id: achievement.id,
    progress: 0,
    completed: false,
    claimed: false,
  }),
);

const INITIAL_SYSTEM_TIMESTAMP = 0;

export const useGameStore = create<GameStore>((set, get) => ({
  player: {
    name:
      (typeof window !== "undefined" && localStorage.getItem("playerName")) ||
      "견습 모험가",
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
    pkCount: 0,
    buffs: [{ id: "starter-blessing", name: "초심자의 축복", remaining: 1200 }],
  },
  serverName: "아스카론 01",
  grade: 3,
  usedWordIds: new Set<string>(
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usedWordIds") ?? "[]")
      : [],
  ),
  wrongWordIds: new Set<string>(
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("wrongWordIds") ?? "[]")
      : [],
  ),
  currentMapId: "speakingIsland",
  pendingLevelUp: false,
  pendingDailyBonus: false,
  loginStreak:
    typeof window !== "undefined"
      ? Number(localStorage.getItem("loginStreak") ?? "0")
      : 0,
  lastLoginDate:
    typeof window !== "undefined"
      ? localStorage.getItem("lastLoginDate")
      : null,
  achievements: INITIAL_ACHIEVEMENTS,
  totalKills: 0,
  bossKills: 0,
  maxQuizStreak: 0,
  visitedMaps: ["speakingIsland"],
  activeTitle: null,
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
    inventoryOpen: false,
    achievementsOpen: false,
    chatOpen: true,
    enchantOpen: false,
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
    minimapOpen: true,
    rankingOpen: false,
  },
  connected: false,
  inCombat: false,
  skillLevels: {},
  sp: 0,
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
  transform: {
    active: false,
    transformId: null,
    remaining: 0,
    cooldownUntil: 0,
  },
  ranking: {
    rankings: [],
    myRank: 0,
    lastUpdated: 0,
  },
  dailyChallenges: [],
  autoNavTarget: null,
  // 콤보/연속 킬 시스템 초기값
  comboKills: 0,
  comboTimer: 0,
  maxCombo: 0,
  comboMultiplier: 1,
  lastKillTime: 0,
  // 자동 사냥 시스템 초기값
  autoHuntEnabled: false,
  lastAutoPotion: 0,
  setPlayer: (player) => {
    if (player.name && typeof window !== "undefined") {
      localStorage.setItem("playerName", player.name);
    }
    set((state) => ({
      player: {
        ...state.player,
        ...player,
      },
    }));
  },
  setServerName: (serverName) => set(() => ({ serverName })),
  setGrade: (grade) =>
    set(() => ({ grade, usedWordIds: new Set(), wrongWordIds: new Set() })),
  resetUsedWords: () => {
    if (typeof window !== "undefined") localStorage.removeItem("usedWordIds");
    return set({ usedWordIds: new Set<string>() });
  },
  resetGame: () => {
    if (typeof window !== "undefined") {
      // Clear all game data from localStorage
      const keysToRemove = [
        "game-storage", // Zustand persist key
        "usedWordIds",
        "achievements",
        "inventory",
        "equipment",
        "quests",
      ];
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      // Reload the page to completely reset the game state
      window.location.reload();
    }
  },
  markWordUsed: (wordId) =>
    set((state) => {
      const next = new Set(state.usedWordIds);
      next.add(wordId);
      if (typeof window !== "undefined" && next.size % 5 === 0) {
        localStorage.setItem("usedWordIds", JSON.stringify([...next]));
      }
      return { usedWordIds: next };
    }),
  markWordWrong: (wordId) =>
    set((state) => {
      const next = new Set(state.wrongWordIds);
      next.add(wordId);
      if (typeof window !== "undefined") {
        localStorage.setItem("wrongWordIds", JSON.stringify([...next]));
      }
      return { wrongWordIds: next };
    }),
  setInventory: (items) => set(() => ({ inventory: items })),
  setEquipment: (equipment) => set(() => ({ equipment })),
  setQuests: (quests) => set(() => ({ quests })),
  setCurrentMapId: (mapId) =>
    set((state) => ({
      currentMapId: mapId,
      visitedMaps: state.visitedMaps.includes(mapId)
        ? state.visitedMaps
        : [...state.visitedMaps, mapId],
    })),
  clearLevelUp: () => set({ pendingLevelUp: false }),
  checkDailyLogin: () =>
    set((state) => {
      const today = new Date().toDateString();
      if (state.lastLoginDate === today) return state;
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const newStreak =
        state.lastLoginDate === yesterday ? state.loginStreak + 1 : 1;
      if (typeof window !== "undefined") {
        localStorage.setItem("lastLoginDate", today);
        localStorage.setItem("loginStreak", String(newStreak));
      }
      return {
        lastLoginDate: today,
        loginStreak: newStreak,
        pendingDailyBonus: true,
      };
    }),
  claimDailyBonus: () =>
    set((state) => {
      const DAY_REWARDS = [
        { gold: 200, exp: 500, itemId: "red_potion", qty: 5 },
        { gold: 400, exp: 1000, itemId: "blue_potion", qty: 3 },
        { gold: 600, exp: 1500, itemId: "teleport_scroll", qty: 2 },
        { gold: 800, exp: 2000, itemId: "haste_potion", qty: 2 },
        { gold: 1200, exp: 3000, itemId: "mystery_box", qty: 1 },
        { gold: 1500, exp: 4000, itemId: "weapon_enchant_scroll", qty: 1 },
        { gold: 3000, exp: 8000, itemId: "legendary_box", qty: 1 },
      ];
      const streakDay = (state.loginStreak - 1) % 7;
      const reward = DAY_REWARDS[streakDay];

      const nextInventory = [...state.inventory];
      const itemData = ITEMS[reward.itemId];
      if (itemData) {
        const existing = nextInventory.find((e) => e.id === reward.itemId);
        if (existing) {
          existing.quantity += reward.qty;
        } else {
          nextInventory.push({
            id: itemData.id,
            name: itemData.name,
            quantity: reward.qty,
            rarity: itemData.rarity,
            type: itemData.type,
          });
        }
      }

      const playerWithGold = {
        ...state.player,
        gold: state.player.gold + reward.gold,
      };
      const nextPlayer = applyExpReward(playerWithGold, reward.exp);

      const updatedAchievements = state.achievements.map((ach) => {
        const def = ACHIEVEMENTS.find((d) => d.id === ach.id);
        if (!def || ach.completed || def.trackType !== "login_streak")
          return ach;
        const newProg = Math.max(ach.progress, state.loginStreak);
        return { ...ach, progress: newProg, completed: newProg >= def.goal };
      });

      return {
        player: nextPlayer,
        inventory: nextInventory,
        pendingDailyBonus: false,
        achievements: updatedAchievements,
        chat: [
          ...state.chat.slice(-47),
          {
            id: crypto.randomUUID(),
            channel: "system" as const,
            author: "시스템",
            message: `📅 출석 보너스 수령! ${state.loginStreak}일 연속 출석 · +${reward.gold} Gold · +${reward.exp} EXP`,
            timestamp: Date.now(),
          },
        ],
      };
    }),
  claimAchievement: (achievementId) =>
    set((state) => {
      const def = ACHIEVEMENTS.find((d) => d.id === achievementId);
      const ach = state.achievements.find((a) => a.id === achievementId);
      if (!def || !ach || !ach.completed || ach.claimed) return state;

      const nextInventory = [...state.inventory];
      if (def.rewards.itemId) {
        const itemData = ITEMS[def.rewards.itemId];
        if (itemData) {
          const existing = nextInventory.find(
            (e) => e.id === def.rewards.itemId,
          );
          if (existing && itemData.stackable) {
            existing.quantity += 1;
          } else {
            nextInventory.push({
              id: itemData.id,
              name: itemData.name,
              quantity: 1,
              rarity: itemData.rarity,
              type: itemData.type,
              uid: itemData.stackable
                ? undefined
                : `uid_${crypto.randomUUID()}`,
              enchantLevel: itemData.stackable ? undefined : 0,
            });
          }
        }
      }

      const playerWithGold = {
        ...state.player,
        gold: state.player.gold + (def.rewards.gold ?? 0),
      };
      const nextPlayer = def.rewards.exp
        ? applyExpReward(playerWithGold, def.rewards.exp)
        : playerWithGold;

      const nextTitle = def.rewards.title ?? state.activeTitle;

      return {
        achievements: state.achievements.map((a) =>
          a.id === achievementId ? { ...a, claimed: true } : a,
        ),
        inventory: nextInventory,
        player: nextPlayer,
        activeTitle: nextTitle,
        chat: [
          ...state.chat.slice(-48),
          {
            id: crypto.randomUUID(),
            channel: "system" as const,
            author: "업적",
            message: `업적 [${def.name}] 보상 수령 완료!${def.rewards.title ? ` 칭호 [${def.rewards.title}] 획득!` : ""}`,
            timestamp: Date.now(),
          },
        ],
      };
    }),
  registerKill: (monsterId, isBoss) =>
    set((state) => {
      const newTotalKills = state.totalKills + 1;
      const newBossKills = isBoss ? state.bossKills + 1 : state.bossKills;

      const updatedAchievements = state.achievements.map((ach) => {
        const def = ACHIEVEMENTS.find((d) => d.id === ach.id);
        if (!def || ach.completed) return ach;
        if (def.trackType === "kill_any") {
          const newProg = ach.progress + 1;
          return { ...ach, progress: newProg, completed: newProg >= def.goal };
        }
        if (def.trackType === "kill_boss" && isBoss) {
          const newProg = ach.progress + 1;
          return { ...ach, progress: newProg, completed: newProg >= def.goal };
        }
        return ach;
      });

      const newlyCompleted = updatedAchievements.filter(
        (a, i) => a.completed && !state.achievements[i]?.completed,
      );

      const newMessages: ChatMessage[] = newlyCompleted.map((a) => {
        const def = ACHIEVEMENTS.find((d) => d.id === a.id)!;
        return {
          id: crypto.randomUUID(),
          channel: "system" as const,
          author: "업적",
          message: `🏆 업적 달성: [${def.name}]! 보상을 수령하세요.`,
          timestamp: Date.now(),
        };
      });

      return {
        totalKills: newTotalKills,
        bossKills: newBossKills,
        achievements: updatedAchievements,
        ...(newMessages.length > 0 && {
          chat: [
            ...state.chat.slice(-(50 - newMessages.length)),
            ...newMessages,
          ],
        }),
      };
    }),
  updateAchievementProgress: (trackType, value, mode = "add") =>
    set((state) => {
      const updatedAchievements = state.achievements.map((ach) => {
        const def = ACHIEVEMENTS.find((d) => d.id === ach.id);
        if (!def || ach.completed || def.trackType !== trackType) return ach;
        const newProg =
          mode === "set"
            ? value
            : mode === "max"
              ? Math.max(ach.progress, value)
              : ach.progress + value;
        return { ...ach, progress: newProg, completed: newProg >= def.goal };
      });
      return { achievements: updatedAchievements };
    }),
  setTitle: (title) => set({ activeTitle: title }),
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
  toggleAchievements: () =>
    set((state) => ({
      ui: {
        ...state.ui,
        achievementsOpen: !state.ui.achievementsOpen,
      },
    })),
  toggleShop: () =>
    set((state) => ({
      ui: {
        ...state.ui,
        shopOpen: !state.ui.shopOpen,
      },
    })),
  toggleEnchant: () =>
    set((state) => ({
      ui: {
        ...state.ui,
        enchantOpen: !state.ui.enchantOpen,
      },
    })),
  toggleQuestWindow: () =>
    set((state) => ({
      ui: {
        ...state.ui,
        questWindowOpen: !state.ui.questWindowOpen,
      },
    })),
  toggleMinimap: () =>
    set((state) => ({
      ui: { ...state.ui, minimapOpen: !state.ui.minimapOpen },
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
  closeDeath: () => {
    set((state) => {
      const derived = getDerivedStatsFromState(state.player, state.equipment);
      // Teleport player to village on respawn
      const socket = getSocket();
      if (socket?.connected) {
        socket.emit("map:travel", { to: "speakingIsland" });
      }
      return {
        player: {
          ...state.player,
          hp: derived.maxHp,
          mp: derived.maxMp,
        },
        ui: {
          ...state.ui,
          deathOpen: false,
          expLostOnDeath: 0,
        },
      };
    });
    // Emit respawn event so WorldScene teleports player to town (offline mode)
    EventBus.emit("player_respawn", {});
  },
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
      // 스크롤 아이템은 클라이언트에서도 이벤트 발생 필요
      const EvBus = (globalThis as Record<string, unknown>).__eventBus as
        | { emit?: (e: string, d: unknown) => void }
        | undefined;
      if (itemId === "teleport_scroll") {
        EvBus?.emit?.("teleport_random", {});
      } else if (itemId === "return_scroll") {
        EvBus?.emit?.("return_to_town", {});
      }
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

      let newHp = Math.min(
        derived.maxHp,
        state.player.hp + (itemData.stats.hp ?? 0),
      );
      let newMp = Math.min(
        derived.maxMp,
        state.player.mp + (itemData.stats.mp ?? 0),
      );
      let effectMsg = `${itemData.name}을(를) 사용했습니다.`;
      const newBuffs = [...state.player.buffs];

      // 순간이동 주문서 - 근처 랜덤 위치로 이동
      if (itemId === "teleport_scroll") {
        const EventBus = (globalThis as Record<string, unknown>).__eventBus as
          | { emit?: (e: string, d: unknown) => void }
          | undefined;
        EventBus?.emit?.("teleport_random", {});
        effectMsg = "순간이동 주문서를 사용했습니다! 근처로 이동합니다.";
      }

      // 귀환 주문서 - 마을로 귀환
      if (itemId === "return_scroll") {
        const EventBus = (globalThis as Record<string, unknown>).__eventBus as
          | { emit?: (e: string, d: unknown) => void }
          | undefined;
        EventBus?.emit?.("return_to_town", {});
        effectMsg = "귀환 주문서를 사용했습니다! 마을로 돌아갑니다.";
      }

      // 초록 물약 (헤이스트) - 공격/이동 속도 버프
      if (itemId === "haste_potion") {
        newBuffs.push({
          id: "haste_" + Date.now(),
          name: "신속",
          remaining: 60,
        });
        effectMsg = "초록 물약을 마셨습니다! 60초간 이동/공격 속도 증가!";
      }

      // 경험치 물약 - 30초간 경험치 50% 증가 버프
      if (itemId === "exp_potion") {
        newBuffs.push({
          id: "exp_boost_" + Date.now(),
          name: "경험치 부스트",
          remaining: 60,
        });
        effectMsg = "경험치 물약을 사용했습니다! 60초간 경험치 50% 증가!";
      }

      // 전사의 광기 물약 - 공격 속도 버프
      if (itemId === "berserk_potion") {
        newBuffs.push({
          id: "berserk_" + Date.now(),
          name: "전사의 광기",
          remaining: 60,
        });
        effectMsg = "전사의 광기 물약! 60초간 공격 속도 40% 증가!";
      }

      // 질풍의 물약 - 이동 속도 버프
      if (itemId === "wind_potion") {
        newBuffs.push({
          id: "wind_" + Date.now(),
          name: "질풍",
          remaining: 60,
        });
        effectMsg = "질풍의 물약! 60초간 이동 속도 40% 증가!";
      }

      // 광전사의 격노 - 근접 전용 공속+이속 올인 버프
      if (itemId === "frenzy_elixir") {
        const cls = state.player.className.toLowerCase();
        if (cls === "ranger" || cls === "arcanist") {
          effectMsg = "근접 클래스만 사용할 수 있습니다!";
          // 소비 취소 — 인벤토리 복원
          return {
            player: { ...state.player, hp: newHp, mp: newMp },
            chat: [
              ...state.chat.slice(-48),
              {
                id: crypto.randomUUID(),
                channel: "system",
                author: "시스템",
                message: effectMsg,
                timestamp: Date.now(),
              },
            ],
            ui: { ...state.ui, selectedInventoryItemId: null },
          };
        }
        newBuffs.push({
          id: "frenzy_" + Date.now(),
          name: "광전사의 격노",
          remaining: 50,
        });
        effectMsg = "광전사의 격노! 50초간 공격/이동 속도 대폭 증가!";
      }

      // 완전 회복약
      if (itemId === "full_restore") {
        newHp = derived.maxHp;
        newMp = derived.maxMp;
        effectMsg = "완전 회복약을 사용했습니다! HP/MP 완전 회복!";
      }

      return {
        inventory: nextInventory,
        player: {
          ...state.player,
          hp: newHp,
          mp: newMp,
          buffs: newBuffs,
        },
        chat: [
          ...state.chat.slice(-48),
          {
            id: crypto.randomUUID(),
            channel: "system",
            author: "시스템",
            message: effectMsg,
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
    // Level scaling: +2 attack per 2 levels (was +1 per 4)
    const lvBonus = Math.floor(player.level / 2) * 2;
    const baseStr = 6 + lvBonus;

    if (weapon?.subtype === "staff" || player.className === "Arcanist") {
      return {
        str: 2,
        dex: 2,
        int: 8 + derived.maxAttack + (weapon?.stats.spellPower ?? 0) + lvBonus,
      };
    }

    if (weapon?.subtype === "bow" || player.className === "Ranger") {
      return {
        str: 3,
        dex:
          8 + derived.maxAttack + (weapon?.stats.rangedDamage ?? 0) + lvBonus,
        int: 2,
      };
    }

    return { str: baseStr + derived.maxAttack, dex: 4, int: 2 };
  },
  // 콤보/연속 킬 시스템
  incrementCombo: () =>
    set((state) => {
      const now = Date.now();
      const newComboKills = state.comboKills + 1;
      const newMaxCombo = Math.max(state.maxCombo, newComboKills);

      let newMultiplier = 1;
      if (newComboKills <= 2) newMultiplier = 1;
      else if (newComboKills <= 5) newMultiplier = 1.5;
      else if (newComboKills <= 10) newMultiplier = 2;
      else if (newComboKills <= 20) newMultiplier = 3;
      else newMultiplier = 5;

      return {
        comboKills: newComboKills,
        comboTimer: 15000, // 15초
        maxCombo: newMaxCombo,
        comboMultiplier: newMultiplier,
        lastKillTime: now,
      };
    }),
  resetCombo: () =>
    set(() => ({
      comboKills: 0,
      comboTimer: 0,
      comboMultiplier: 1,
    })),
  tickCombo: () =>
    set((state) => {
      if (state.comboTimer <= 0) {
        return {
          comboKills: 0,
          comboTimer: 0,
          comboMultiplier: 1,
        };
      }
      return {
        comboTimer: Math.max(0, state.comboTimer - 100), // 100ms tick
      };
    }),
  // 자동 사냥 시스템
  toggleAutoHunt: () =>
    set((state) => ({
      autoHuntEnabled: !state.autoHuntEnabled,
    })),
  // 전투력 계산
  getCombatPower: () => {
    const { player, equipment } = get();
    const derived = getDerivedStatsFromState(player, equipment);
    const weapon = equipment.weapon ? ITEMS[equipment.weapon.id] : null;
    const lvBonus = Math.floor(player.level / 2) * 2;

    // 기본 스탯 계산 (기존 로직 기반)
    let baseStr = 6 + lvBonus + derived.maxAttack;
    let baseDex = 4;
    let baseInt = 2;

    if (weapon?.subtype === "staff" || player.className === "Arcanist") {
      baseStr = 2;
      baseDex = 2;
      baseInt =
        8 + derived.maxAttack + (weapon?.stats.spellPower ?? 0) + lvBonus;
    } else if (weapon?.subtype === "bow" || player.className === "Ranger") {
      baseStr = 3;
      baseDex =
        8 + derived.maxAttack + (weapon?.stats.rangedDamage ?? 0) + lvBonus;
      baseInt = 2;
    }

    // 기본 스탯 합계 * 레벨 + 장비 보너스 + 인챈트 보너스
    const baseStats = baseStr + baseDex + baseInt + 10 + 10; // CON, WIS 기본값
    const equipBonus =
      derived.maxAttack + derived.ac + derived.maxHp + derived.maxMp;

    // 인챈트 보너스 계산
    const enchantBonus = Object.values(equipment).reduce((sum, item) => {
      if (!item?.enchantLevel) return sum;
      return sum + item.enchantLevel * 100; // +1당 100 전투력
    }, 0);

    return baseStats * player.level + equipBonus + enchantBonus;
  },
  getDerivedStats: () => {
    const { player, equipment } = get();
    return getDerivedStatsFromState(player, equipment);
  },
  enchantItem: (uid, blessed) => {
    let outcome: EnchantOutcome = { result: "fail", newLevel: 0, message: "" };
    set((state) => {
      const itemIdx = state.inventory.findIndex((i) => (i.uid ?? i.id) === uid);
      if (itemIdx === -1) return state;

      const item = state.inventory[itemIdx];
      const currentLevel = item.enchantLevel ?? 0;
      const result = rollEnchant(currentLevel, blessed);
      outcome = result;

      const scrollId =
        (ITEMS[item.id]?.type ?? "") === "weapon"
          ? "weapon_enchant_scroll"
          : "armor_enchant_scroll";
      const blessingId = "blessing_scroll";

      const nextInventoryBase = state.inventory
        .map((inv, idx) => {
          if (idx === itemIdx) {
            if (result.result === "destroy") return null;
            return { ...inv, enchantLevel: result.newLevel };
          }
          return inv;
        })
        .filter(Boolean) as InventoryItem[];

      const nextInventory = (
        blessed
          ? nextInventoryBase.map((inv) => {
              if (inv.id === blessingId && inv.quantity > 0) {
                return { ...inv, quantity: inv.quantity - 1 };
              }
              return inv;
            })
          : nextInventoryBase
      )
        .map((inv) => {
          if (inv.id === scrollId && inv.quantity > 0) {
            return { ...inv, quantity: inv.quantity - 1 };
          }
          return inv;
        })
        .filter((inv) => inv.quantity > 0 || !ITEMS[inv.id]?.stackable);

      let updatedAchievements = state.achievements;
      if (result.result === "success") {
        updatedAchievements = state.achievements.map((ach) => {
          const def = ACHIEVEMENTS.find((d) => d.id === ach.id);
          if (!def || ach.completed || def.trackType !== "enchant_level")
            return ach;
          const newProg = Math.max(ach.progress, result.newLevel);
          return { ...ach, progress: newProg, completed: newProg >= def.goal };
        });
      }

      const resultIcon =
        result.result === "success"
          ? "✨"
          : result.result === "destroy"
            ? "💥"
            : "❌";
      return {
        inventory: nextInventory,
        achievements: updatedAchievements,
        chat: [
          ...state.chat.slice(-49),
          {
            id: crypto.randomUUID(),
            channel: "system" as const,
            author: "강화",
            message: `${resultIcon} ${result.message}`,
            timestamp: Date.now(),
          },
        ],
      };
    });
    return outcome;
  },
  setConnected: (connected) => set(() => ({ connected })),
  setInCombat: (v) => set({ inCombat: v }),
  upgradeSkill: (skillId) =>
    set((state) => {
      if (state.sp <= 0) return state;
      const currentLv = state.skillLevels[skillId] ?? 0;
      if (currentLv >= 5) return state;
      return {
        sp: state.sp - 1,
        skillLevels: { ...state.skillLevels, [skillId]: currentLv + 1 },
        chat: [
          ...state.chat.slice(-49),
          {
            id: crypto.randomUUID(),
            channel: "system" as const,
            author: "시스템",
            message: `스킬이 Lv ${currentLv + 1}로 강화되었습니다!`,
            timestamp: Date.now(),
          },
        ],
      };
    }),
  activateSkill: (skillId) =>
    set((state) => {
      const lv = state.skillLevels[skillId] ?? 0;
      if (lv <= 0) return state;
      return {
        chat: [
          ...state.chat.slice(-49),
          {
            id: crypto.randomUUID(),
            channel: "system" as const,
            author: "스킬",
            message: `스킬 발동!`,
            timestamp: Date.now(),
          },
        ],
      };
    }),
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
  activateTransform: (transformId) => {
    const socket = getSocket();
    if (!socket.connected) return;
    socket.emit("player:transform", { transformId });
  },
  tickTransform: () =>
    set((state) => {
      if (!state.transform.active || state.transform.remaining <= 0) {
        return {
          transform: {
            ...state.transform,
            active: false,
            transformId: null,
            remaining: 0,
          },
        };
      }
      return {
        transform: {
          ...state.transform,
          remaining: state.transform.remaining - 1,
        },
      };
    }),
  cancelTransform: () =>
    set(() => ({
      transform: {
        active: false,
        transformId: null,
        remaining: 0,
        cooldownUntil: 0,
      },
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
      const levelsGained = nextPlayer.level - prevLevel;

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

      const messages: ChatMessage[] = [];

      // Only show gold/exp message if there are actual rewards
      if (gold > 0 || exp > 0) {
        let rewardMessage = "";
        if (gold > 0 && exp > 0) {
          rewardMessage = `+${gold} Gold, +${exp} EXP 획득!`;
        } else if (gold > 0) {
          rewardMessage = `+${gold} Gold 획득!`;
        } else if (exp > 0) {
          rewardMessage = `+${exp} EXP 획득!`;
        }

        messages.push({
          id: crypto.randomUUID(),
          channel: "system",
          author: "시스템",
          message: rewardMessage,
          timestamp: Date.now(),
        });
      }
      if (leveled) {
        messages.push({
          id: crypto.randomUUID(),
          channel: "system",
          author: "시스템",
          message: `레벨 업! Lv.${nextPlayer.level} 달성!`,
          timestamp: Date.now() + 1,
        });
      }

      const updatedAchievements = state.achievements.map((ach) => {
        const def = ACHIEVEMENTS.find((d) => d.id === ach.id);
        if (!def || ach.completed) return ach;
        if (def.trackType === "level") {
          const newProg = Math.max(ach.progress, nextPlayer.level);
          return { ...ach, progress: newProg, completed: newProg >= def.goal };
        }
        if (def.trackType === "gold") {
          const newProg = Math.max(ach.progress, nextPlayer.gold);
          return { ...ach, progress: newProg, completed: newProg >= def.goal };
        }
        return ach;
      });

      const updatedMapAchievements = updatedAchievements.map((ach) => {
        const def = ACHIEVEMENTS.find((d) => d.id === ach.id);
        if (!def || ach.completed || def.trackType !== "map_visit") return ach;
        const newProg = state.visitedMaps.length;
        return { ...ach, progress: newProg, completed: newProg >= def.goal };
      });

      return {
        player: nextPlayer,
        inventory: nextInventory,
        sp: state.sp + (leveled ? levelsGained * 2 : 0),
        pendingLevelUp: leveled,
        achievements: updatedMapAchievements,
        chat: [...state.chat.slice(-(50 - messages.length)), ...messages],
      };
    });
  },

  // 새로운 기능들
  setRankings: (rankings, myRank) =>
    set(() => ({
      ranking: {
        rankings,
        myRank,
        lastUpdated: Date.now(),
      },
    })),

  toggleRanking: () =>
    set((state) => ({
      ui: {
        ...state.ui,
        rankingOpen: !state.ui.rankingOpen,
      },
    })),

  requestRankings: () => {
    // Socket event to request rankings from server
    const socket = (globalThis as any).__socket;
    if (socket?.connected) {
      socket.emit("ranking:request");
    }
  },

  generateDailyChallenges: () =>
    set((state) => {
      const challenges: DailyChallenge[] = [
        {
          id: "daily_kills",
          description: "몬스터 20마리 처치",
          target: 20,
          progress: 0,
          reward: { gold: 1000, exp: 500 },
          completed: false,
        },
        {
          id: "daily_combos",
          description: "콤보 10회 달성",
          target: 10,
          progress: 0,
          reward: { gold: 800, exp: 300 },
          completed: false,
        },
        {
          id: "daily_boss",
          description: "보스 1마리 처치",
          target: 1,
          progress: 0,
          reward: { gold: 2000, exp: 1000 },
          completed: false,
        },
      ];

      return {
        dailyChallenges: challenges,
      };
    }),

  updateChallengeProgress: (challengeId, progress) =>
    set((state) => ({
      dailyChallenges: state.dailyChallenges.map((challenge) =>
        challenge.id === challengeId
          ? {
              ...challenge,
              progress: Math.min(progress, challenge.target),
              completed: progress >= challenge.target,
            }
          : challenge,
      ),
    })),

  setAutoNavTarget: (target) =>
    set(() => ({
      autoNavTarget: target,
    })),

  checkMilestoneRewards: (newLevel) => {
    const MILESTONE_REWARDS: Record<
      number,
      { gold: number; items: string[]; title?: string }
    > = {
      5: { gold: 500, items: ["red_potion"], title: "초보 모험가" },
      10: { gold: 2000, items: ["iron_sword"], title: "숙련 전사" },
      15: { gold: 5000, items: ["weapon_enchant_scroll"], title: "베테랑" },
      20: { gold: 10000, items: ["blue_potion"], title: "영웅의 자질" },
      25: { gold: 20000, items: ["haste_potion"], title: "전설의 시작" },
      30: { gold: 50000, items: ["mystery_box"], title: "마스터" },
    };

    const milestone = MILESTONE_REWARDS[newLevel];
    if (!milestone) return;

    set((state) => {
      const nextInventory = [...state.inventory];

      // Add milestone items
      milestone.items.forEach((itemId) => {
        const existing = nextInventory.find((item) => item.id === itemId);
        if (existing) {
          existing.quantity += 1;
        } else {
          const itemData = ITEMS[itemId];
          if (itemData) {
            nextInventory.push({
              id: itemId,
              name: itemData.name,
              quantity: 1,
              rarity: itemData.rarity,
              type: itemData.type,
            });
          }
        }
      });

      const milestoneMessage: ChatMessage = {
        id: crypto.randomUUID(),
        channel: "system",
        author: "시스템",
        message: `🎉 레벨 ${newLevel} 달성! 마일스톤 보상: +${milestone.gold} Gold${milestone.title ? `, 칭호 '${milestone.title}' 획득!` : ""}`,
        timestamp: Date.now() + 2,
      };

      return {
        player: {
          ...state.player,
          gold: state.player.gold + milestone.gold,
        },
        inventory: nextInventory,
        activeTitle: milestone.title || state.activeTitle,
        chat: [...state.chat, milestoneMessage],
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

  // Level scaling: +1 AC per 6 levels
  const lvAcBonus = Math.floor(player.level / 6);

  return {
    maxHp: player.maxHp + hpBonus,
    maxMp: player.maxMp + mpBonus,
    ac: 10 + acBonus + lvAcBonus,
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
  AchievementState,
  EnchantOutcome,
  EquipmentSlot,
  EquipmentState,
  InventoryItem,
  PlayerSnapshot,
  DroppedLoot,
  QuestProgress,
  QuestStatus,
  RandomOption,
  TransformState,
};
