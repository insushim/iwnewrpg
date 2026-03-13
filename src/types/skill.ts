import type { CharacterClass } from "@/types/game";

export type SkillType =
  | "attack"
  | "buff"
  | "debuff"
  | "heal"
  | "summon"
  | "utility";

export type SkillTarget =
  | "single"
  | "self"
  | "party"
  | "aoe"
  | "ground";

export interface Skill {
  id: string;
  name: string;
  class: CharacterClass;
  level: number;
  mp: number;
  type: SkillType;
  target: SkillTarget;
  range?: number;
  damage?: string;
  effect?: string;
  cooldown: number;
  duration?: number;
  requireSkillBook?: boolean;
  aoeRadius?: number;
  description?: string;
}
