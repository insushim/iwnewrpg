// ─── 28-Day Monthly Attendance Reward System ───

export type AttendanceRewardTier = "normal" | "weekly_chest" | "monthly_mega";

export interface AttendanceRewardItem {
  itemId: string;
  qty: number;
}

export interface AttendanceReward {
  day: number;
  gold: number;
  exp: number;
  items: AttendanceRewardItem[];
  tier: AttendanceRewardTier;
  displayRarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  /** Display label for the day cell icon area */
  icon: string;
}

// ── Week 1: Onboarding (Common → Uncommon) ──
// ── Week 2: Growth    (Uncommon → Rare)     ──
// ── Week 3: Power     (Rare → Epic)         ──
// ── Week 4: Legendary (Epic → Legendary)    ──

export const ATTENDANCE_REWARDS: AttendanceReward[] = [
  // ─── WEEK 1 ───
  {
    day: 1,
    gold: 200,
    exp: 500,
    items: [{ itemId: "red_potion", qty: 10 }],
    tier: "normal",
    displayRarity: "common",
    icon: "HP",
  },
  {
    day: 2,
    gold: 300,
    exp: 800,
    items: [{ itemId: "blue_potion", qty: 5 }],
    tier: "normal",
    displayRarity: "common",
    icon: "MP",
  },
  {
    day: 3,
    gold: 400,
    exp: 1000,
    items: [{ itemId: "teleport_scroll", qty: 3 }],
    tier: "normal",
    displayRarity: "common",
    icon: "TP",
  },
  {
    day: 4,
    gold: 500,
    exp: 1200,
    items: [{ itemId: "haste_potion", qty: 3 }],
    tier: "normal",
    displayRarity: "uncommon",
    icon: "HS",
  },
  {
    day: 5,
    gold: 600,
    exp: 1500,
    items: [{ itemId: "teleport_scroll", qty: 5 }],
    tier: "normal",
    displayRarity: "uncommon",
    icon: "RT",
  },
  {
    day: 6,
    gold: 800,
    exp: 2000,
    items: [{ itemId: "berserk_potion", qty: 2 }],
    tier: "normal",
    displayRarity: "uncommon",
    icon: "BK",
  },
  {
    day: 7,
    gold: 2000,
    exp: 5000,
    items: [
      { itemId: "mystery_box", qty: 1 },
      { itemId: "weapon_enchant_scroll", qty: 2 },
    ],
    tier: "weekly_chest",
    displayRarity: "rare",
    icon: "W1",
  },

  // ─── WEEK 2 ───
  {
    day: 8,
    gold: 400,
    exp: 1000,
    items: [{ itemId: "red_potion", qty: 15 }],
    tier: "normal",
    displayRarity: "uncommon",
    icon: "HP",
  },
  {
    day: 9,
    gold: 500,
    exp: 1200,
    items: [{ itemId: "blue_potion", qty: 10 }],
    tier: "normal",
    displayRarity: "uncommon",
    icon: "MP",
  },
  {
    day: 10,
    gold: 600,
    exp: 1500,
    items: [{ itemId: "wind_potion", qty: 3 }],
    tier: "normal",
    displayRarity: "uncommon",
    icon: "WD",
  },
  {
    day: 11,
    gold: 800,
    exp: 2000,
    items: [{ itemId: "exp_potion", qty: 1 }],
    tier: "normal",
    displayRarity: "rare",
    icon: "EX",
  },
  {
    day: 12,
    gold: 1000,
    exp: 2500,
    items: [{ itemId: "weapon_enchant_scroll", qty: 2 }],
    tier: "normal",
    displayRarity: "rare",
    icon: "SC",
  },
  {
    day: 13,
    gold: 1200,
    exp: 3000,
    items: [{ itemId: "frenzy_elixir", qty: 2 }],
    tier: "normal",
    displayRarity: "rare",
    icon: "FZ",
  },
  {
    day: 14,
    gold: 4000,
    exp: 10000,
    items: [
      { itemId: "mystery_box", qty: 2 },
      { itemId: "blessing_scroll", qty: 1 },
    ],
    tier: "weekly_chest",
    displayRarity: "epic",
    icon: "W2",
  },

  // ─── WEEK 3 ───
  {
    day: 15,
    gold: 800,
    exp: 2000,
    items: [{ itemId: "weapon_enchant_scroll", qty: 2 }],
    tier: "normal",
    displayRarity: "rare",
    icon: "SC",
  },
  {
    day: 16,
    gold: 1000,
    exp: 2500,
    items: [{ itemId: "full_restore", qty: 3 }],
    tier: "normal",
    displayRarity: "rare",
    icon: "FR",
  },
  {
    day: 17,
    gold: 1200,
    exp: 3000,
    items: [{ itemId: "blessing_scroll", qty: 1 }],
    tier: "normal",
    displayRarity: "rare",
    icon: "BS",
  },
  {
    day: 18,
    gold: 1500,
    exp: 3500,
    items: [{ itemId: "exp_potion", qty: 2 }],
    tier: "normal",
    displayRarity: "rare",
    icon: "EX",
  },
  {
    day: 19,
    gold: 1800,
    exp: 4000,
    items: [{ itemId: "taming_stone", qty: 1 }],
    tier: "normal",
    displayRarity: "rare",
    icon: "TM",
  },
  {
    day: 20,
    gold: 2000,
    exp: 5000,
    items: [{ itemId: "blessing_scroll", qty: 1 }],
    tier: "normal",
    displayRarity: "epic",
    icon: "BS",
  },
  {
    day: 21,
    gold: 6000,
    exp: 15000,
    items: [
      { itemId: "legendary_box", qty: 1 },
      { itemId: "weapon_enchant_scroll", qty: 3 },
    ],
    tier: "weekly_chest",
    displayRarity: "epic",
    icon: "W3",
  },

  // ─── WEEK 4 ───
  {
    day: 22,
    gold: 1500,
    exp: 3500,
    items: [{ itemId: "frenzy_elixir", qty: 3 }],
    tier: "normal",
    displayRarity: "rare",
    icon: "FZ",
  },
  {
    day: 23,
    gold: 2000,
    exp: 4000,
    items: [{ itemId: "weapon_enchant_scroll", qty: 3 }],
    tier: "normal",
    displayRarity: "epic",
    icon: "SC",
  },
  {
    day: 24,
    gold: 2500,
    exp: 5000,
    items: [{ itemId: "mystery_box", qty: 1 }],
    tier: "normal",
    displayRarity: "epic",
    icon: "BX",
  },
  {
    day: 25,
    gold: 3000,
    exp: 6000,
    items: [{ itemId: "blessing_scroll", qty: 2 }],
    tier: "normal",
    displayRarity: "epic",
    icon: "BS",
  },
  {
    day: 26,
    gold: 4000,
    exp: 8000,
    items: [{ itemId: "exp_potion", qty: 3 }],
    tier: "normal",
    displayRarity: "epic",
    icon: "EX",
  },
  {
    day: 27,
    gold: 5000,
    exp: 10000,
    items: [{ itemId: "legendary_box", qty: 1 }],
    tier: "normal",
    displayRarity: "legendary",
    icon: "LB",
  },
  {
    day: 28,
    gold: 15000,
    exp: 30000,
    items: [
      { itemId: "legendary_box", qty: 2 },
      { itemId: "mystery_box", qty: 3 },
      { itemId: "weapon_enchant_scroll", qty: 5 },
    ],
    tier: "monthly_mega",
    displayRarity: "legendary",
    icon: "MG",
  },
];

export const WEEKLY_CHEST_DAYS = new Set([7, 14, 21, 28]);
export const MONTHLY_MEGA_DAY = 28;
export const MAKEUP_COST = 2000;

/** Titles awarded at attendance milestones (within 28-day cycle) */
export const ATTENDANCE_TITLES: Record<number, string> = {
  7: "주간 출석자",
  14: "성실한 모험가",
  21: "출석의 달인",
  28: "완벽 출석 용사",
};

/** Streak multiplier — applies to gold & EXP only */
export function getStreakMultiplier(streak: number): number {
  if (streak <= 1) return 1.0;
  if (streak <= 3) return 1.1;
  if (streak <= 7) return 1.2;
  if (streak <= 14) return 1.35;
  if (streak <= 21) return 1.5;
  if (streak <= 28) return 1.75;
  return 2.0;
}

/** ISO week string "YYYY-WNN" for weekly makeup tracking */
export function getISOWeek(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum =
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7,
    );
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

/** Rarity color map for UI */
export const RARITY_COLORS: Record<string, string> = {
  common: "#9ca3af",
  uncommon: "#22c55e",
  rare: "#3b82f6",
  epic: "#a855f7",
  legendary: "#f59e0b",
  mythic: "#ef4444",
};

/** Particle counts by rarity tier */
export const RARITY_PARTICLES: Record<string, number> = {
  common: 16,
  uncommon: 20,
  rare: 24,
  epic: 32,
  legendary: 48,
};
