import { MonsterManager } from "./monsterManager";

type AttackProfile = {
  str: number;
  dex: number;
  int: number;
};

export class CombatHandler {
  constructor(private monsterManager: MonsterManager) {}

  attack(monsterId: string, stats: AttackProfile) {
    const physical = (stats.str ?? 0) + Math.floor((stats.dex ?? 0) * 0.6);
    const magical = Math.floor((stats.int ?? 0) * 1.2);
    const base = Math.max(3, Math.max(physical, magical));
    const variance = 0.85 + Math.random() * 0.3;
    const damage = Math.max(1, Math.floor(base * variance));
    return this.monsterManager.applyDamage(monsterId, damage);
  }
}
