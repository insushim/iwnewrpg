export interface TransformationData {
  id: string;
  form: string;
  requiredLevel: number;
  duration: number;
  cooldown: number;
  bonuses: {
    attackSpeedPercent?: number;
    ac?: number;
    moveSpeedPercent?: number;
    critRate?: number;
  };
}

export const TRANSFORMS: TransformationData[] = [
  {
    id: "orc_warrior_form",
    form: "오크 전사",
    requiredLevel: 25,
    duration: 1800,
    cooldown: 3600,
    bonuses: { attackSpeedPercent: 10, ac: -2 },
  },
  {
    id: "skeleton_form",
    form: "스켈레톤",
    requiredLevel: 15,
    duration: 1800,
    cooldown: 3600,
    bonuses: { ac: -3, attackSpeedPercent: 15 },
  },
  {
    id: "dark_elf_form",
    form: "다크엘프",
    requiredLevel: 35,
    duration: 1800,
    cooldown: 3600,
    bonuses: { ac: -4, critRate: 10, moveSpeedPercent: 15 },
  },
  {
    id: "werewolf_form",
    form: "워울프",
    requiredLevel: 40,
    duration: 1800,
    cooldown: 3600,
    bonuses: { attackSpeedPercent: 25, ac: -5, moveSpeedPercent: 10 },
  },
  {
    id: "drake_form",
    form: "드레이크",
    requiredLevel: 48,
    duration: 1200,
    cooldown: 7200,
    bonuses: { attackSpeedPercent: 30, ac: -6, moveSpeedPercent: -10 },
  },
  {
    id: "death_reaper_form",
    form: "데스 리퍼",
    requiredLevel: 52,
    duration: 1800,
    cooldown: 3600,
    bonuses: { attackSpeedPercent: 50, ac: -8, critRate: 15 },
  },
  {
    id: "ancient_dragon_form",
    form: "고대 드래곤",
    requiredLevel: 60,
    duration: 900,
    cooldown: 10800,
    bonuses: {
      attackSpeedPercent: 60,
      ac: -12,
      critRate: 20,
      moveSpeedPercent: 5,
    },
  },
];
