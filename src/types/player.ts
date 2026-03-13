import type { CharacterClass, CharacterStats, Position } from "@/types/game";
import type { Item } from "@/types/item";
import type { Skill } from "@/types/skill";

export enum EquipSlot {
  WEAPON = "weapon",
  ARMOR = "armor",
  HELMET = "helmet",
  SHIELD = "shield",
  CLOAK = "cloak",
  BOOTS = "boots",
  GLOVES = "gloves",
  RING1 = "ring1",
  RING2 = "ring2",
  AMULET = "amulet",
  BELT = "belt",
}

export interface Equipment {
  weapon?: Item | null;
  armor?: Item | null;
  helmet?: Item | null;
  shield?: Item | null;
  cloak?: Item | null;
  boots?: Item | null;
  gloves?: Item | null;
  ring1?: Item | null;
  ring2?: Item | null;
  amulet?: Item | null;
  belt?: Item | null;
}

export interface InventoryEntry {
  slot: number;
  item: Item;
  quantity: number;
  enchantLevel?: number;
}

export interface PlayerSkillState {
  skillId: Skill["id"];
  unlocked: boolean;
  hotkeySlot?: number;
  cooldownEndsAt?: number;
}

export interface QuizStats {
  total: number;
  correct: number;
  currentStreak: number;
  bestStreak: number;
}

export interface Player {
  id: string;
  name: string;
  class: CharacterClass;
  level: number;
  exp: number;
  stats: CharacterStats;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  gold: number;
  alignment: number;
  position: Position;
  equipment: Equipment;
  inventory: InventoryEntry[];
  skills: PlayerSkillState[];
  clan?: string | null;
  party?: string | null;
  transform?: string | null;
  quizStats: QuizStats;
}
