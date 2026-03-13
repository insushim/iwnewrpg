export interface QuestObjective {
  type: "talk" | "kill" | "collect" | "travel" | "quiz_streak" | "reach";
  target?: string;
  count?: number;
}

export interface QuestReward {
  exp: number;
  gold: number;
  items: string[];
}

export interface QuestData {
  id: string;
  name: string;
  level: number;
  zone: string;
  npc: string;
  description: string;
  objectives: QuestObjective[];
  rewards: QuestReward;
  repeatable?: "daily";
}

export const MAIN_QUESTS: QuestData[] = [
  {
    id: "mq_001",
    name: "모험의 시작",
    level: 1,
    zone: "speakingIsland",
    npc: "elder",
    description: "이야기의 섬에 도착한 당신. 원로에게 인사를 건네 보세요.",
    objectives: [{ type: "talk", target: "elder", count: 1 }],
    rewards: { exp: 100, gold: 50, items: ["red_potion", "red_potion"] },
  },
  {
    id: "mq_002",
    name: "첫 번째 사냥",
    level: 2,
    zone: "speakingIsland",
    npc: "elder",
    description: "슬라임 5마리를 처치하세요. 퀴즈 보상 여부와 관계없이 처치 수는 인정됩니다.",
    objectives: [{ type: "kill", target: "slime", count: 5 }],
    rewards: { exp: 200, gold: 100, items: ["trainee_dagger"] },
  },
  {
    id: "mq_003",
    name: "단어의 힘",
    level: 3,
    zone: "speakingIsland",
    npc: "elder",
    description: "퀴즈 10연속 정답을 달성하세요.",
    objectives: [{ type: "quiz_streak", count: 10 }],
    rewards: { exp: 500, gold: 200, items: ["blue_potion"] },
  },
  {
    id: "mq_004",
    name: "대륙으로",
    level: 10,
    zone: "speakingIsland",
    npc: "elder",
    description: "은기사의 마을로 이동하세요.",
    objectives: [{ type: "travel", target: "silverKnightTown", count: 1 }],
    rewards: { exp: 1000, gold: 500, items: ["teleport_scroll"] },
  },
];

export const DAILY_QUESTS: QuestData[] = [
  {
    id: "dq_word_master",
    name: "오늘의 단어왕",
    level: 10,
    zone: "global",
    npc: "elder",
    description: "퀴즈 연속 정답 기록을 50까지 올리세요.",
    objectives: [{ type: "quiz_streak", count: 50 }],
    rewards: { exp: 2000, gold: 1000, items: ["blue_potion"] },
    repeatable: "daily",
  },
  {
    id: "dq_hunter_routine",
    name: "사냥꾼의 일과",
    level: 12,
    zone: "global",
    npc: "knight_captain",
    description: "몬스터 100마리를 처치하세요.",
    objectives: [{ type: "kill", target: "any", count: 100 }],
    rewards: { exp: 3000, gold: 1500, items: ["weapon_enchant_scroll"] },
    repeatable: "daily",
  },
];

export const QUESTS = [...MAIN_QUESTS, ...DAILY_QUESTS];
