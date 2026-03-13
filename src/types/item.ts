import type { CharacterClass, CharacterStats } from "@/types/game";

export enum ItemType {
  WEAPON = "weapon",
  ARMOR = "armor",
  CONSUMABLE = "consumable",
  MATERIAL = "material",
  QUEST = "quest",
  SCROLL = "scroll",
  GOLD = "gold",
}

export enum ItemRarity {
  COMMON = "common",
  UNCOMMON = "uncommon",
  RARE = "rare",
  EPIC = "epic",
  LEGENDARY = "legendary",
  MYTHIC = "mythic",
}

export enum WeaponSubType {
  DAGGER = "dagger",
  ONE_HAND_SWORD = "oneHandSword",
  TWO_HAND_SWORD = "twoHandSword",
  BOW = "bow",
  STAFF = "staff",
  SPEAR = "spear",
  MACE = "mace",
}

export enum ArmorSubType {
  HELMET = "helmet",
  ARMOR = "armor",
  SHIELD = "shield",
  CLOAK = "cloak",
  BOOTS = "boots",
  GLOVES = "gloves",
  RING = "ring",
  AMULET = "amulet",
  BELT = "belt",
}

export interface ItemRequirements {
  level?: number;
  classes?: CharacterClass[];
  stats?: Partial<CharacterStats>;
}

export interface ItemStats {
  minAttack?: number;
  maxAttack?: number;
  ac?: number;
  weightLimit?: number;
  hp?: number;
  mp?: number;
  hit?: number;
  critRate?: number;
  moveSpeedPercent?: number;
  attackSpeedTier?: number;
  rangedDamage?: number;
  spellPower?: number;
  magicResistance?: number;
  healPower?: number;
  bonusStats?: Partial<CharacterStats>;
}

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  subtype?: WeaponSubType | ArmorSubType | string;
  rarity: ItemRarity;
  stats: ItemStats;
  requirements?: ItemRequirements;
  weight: number;
  stackable: boolean;
  description: string;
  icon: string;
  price?: number;
  maxStack?: number;
  tags?: string[];
}
