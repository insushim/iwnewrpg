import { MonsterManager } from "./monsterManager";

type AttackProfile = {
  str: number;
  dex: number;
  int: number;
  con?: number;
  wis?: number;
  level?: number;
  minAttack?: number;
  maxAttack?: number;
  critRate?: number;
  spellPower?: number;
};

export class CombatHandler {
  constructor(private monsterManager: MonsterManager) {}

  attack(monsterId: string, stats: AttackProfile) {
    const monster = this.monsterManager.get(monsterId);
    if (!monster) return null;

    // Base damage calculation (Lineage-style)
    const weaponDamage =
      stats.minAttack && stats.maxAttack
        ? randomBetween(stats.minAttack, stats.maxAttack)
        : 0;

    const physical =
      Math.floor((stats.str ?? 0) * 0.5 + (stats.dex ?? 0) * 0.25) +
      weaponDamage;
    const magical = Math.floor(
      (stats.int ?? 0) * 0.7 + (stats.spellPower ?? 0) * 1.0,
    );

    const baseDamage = Math.max(physical, magical);

    // Level difference modifier
    const levelDiff = (stats.level ?? 1) - monster.level;
    const levelMod = 1 + Math.max(-0.3, Math.min(0.3, levelDiff * 0.02));

    // Defense reduction (Lineage AC system - lower AC = better defense)
    const defReduction = Math.max(0.15, 1 - (monster.atk > 0 ? 0 : 0)); // monsters don't have AC currently

    // Critical hit
    const critChance = Math.min(
      0.35,
      (stats.critRate ?? 0) / 100 + (stats.dex ?? 0) * 0.003,
    );
    const isCrit = Math.random() < critChance;
    const critMul = isCrit ? 1.3 + Math.random() * 0.3 : 1;

    // Variance (Lineage has ±15% variance)
    const variance = 0.85 + Math.random() * 0.3;

    // Final damage
    const damage = Math.max(
      1,
      Math.floor(baseDamage * levelMod * defReduction * critMul * variance),
    );

    return this.monsterManager.applyDamage(monsterId, damage);
  }
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
