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
    id: "werewolf_form",
    form: "워울프",
    requiredLevel: 40,
    duration: 1800,
    cooldown: 3600,
    bonuses: { attackSpeedPercent: 25, ac: -5, moveSpeedPercent: 10 },
  },
  {
    id: "death_reaper_form",
    form: "데스 리퍼",
    requiredLevel: 52,
    duration: 1800,
    cooldown: 3600,
    bonuses: { attackSpeedPercent: 50, ac: -8, critRate: 15 },
  },
];
