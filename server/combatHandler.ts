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

type DefenderProfile = {
  level: number;
  ac: number; // Armor Class - lower is better
  mr: number; // Magic Resistance 0-100
  hp: number;
  maxHp: number;
};

type AttackResult = {
  monster: any;
  defeated: boolean;
  missed?: boolean;
  damage?: number;
  isCrit?: boolean;
};

type PvPResult = {
  damage: number;
  missed: boolean;
  isCrit: boolean;
  remainingHp: number;
};

export class CombatHandler {
  constructor(private monsterManager: MonsterManager) {}

  attack(monsterId: string, stats: AttackProfile): AttackResult | null {
    const monster = this.monsterManager.get(monsterId);
    if (!monster) return null;

    // Hit calculation (Lineage style - lower AC = harder to hit)
    const hitChance = Math.min(
      95,
      Math.max(
        5,
        80 +
          ((stats.level ?? 1) - monster.level) * 2 +
          Math.floor((stats.dex ?? 0) * 0.4),
      ),
    );

    if (Math.random() * 100 > hitChance) {
      return {
        monster: this.monsterManager.get(monsterId)!,
        defeated: false,
        missed: true,
        damage: 0,
      };
    }

    // Damage calc
    const weaponDmg =
      stats.minAttack && stats.maxAttack
        ? randomBetween(stats.minAttack, stats.maxAttack)
        : 0;
    const strBonus = Math.floor((stats.str ?? 0) * 0.5);
    const physical = strBonus + weaponDmg;
    const magicDmg = Math.floor(
      (stats.int ?? 0) * 0.7 + (stats.spellPower ?? 0),
    );

    const baseDmg = Math.max(physical + weaponDmg, magicDmg);
    const defReduction = Math.floor(monster.atk * 0.15); // monster def

    // Critical
    const critChance = Math.min(
      35,
      (stats.critRate ?? 0) + Math.floor((stats.dex ?? 0) * 0.3),
    );
    const isCrit = Math.random() * 100 < critChance;
    const critMul = isCrit ? 1.5 : 1;

    // Variance ±10%
    const variance = 0.9 + Math.random() * 0.2;

    const damage = Math.max(
      1,
      Math.floor((baseDmg - defReduction) * critMul * variance),
    );

    const result = this.monsterManager.applyDamage(monsterId, damage);
    return result
      ? {
          ...result,
          missed: false,
          damage,
          isCrit,
        }
      : null;
  }

  attackPlayer(
    attackerStats: AttackProfile,
    defenderStats: DefenderProfile,
  ): PvPResult {
    // Hit calculation with AC
    const hitChance = Math.min(
      95,
      Math.max(
        5,
        80 +
          ((attackerStats.level ?? 1) - defenderStats.level) * 2 +
          Math.floor((attackerStats.dex ?? 0) * 0.4) -
          defenderStats.ac,
      ),
    );

    if (Math.random() * 100 > hitChance) {
      return {
        damage: 0,
        missed: true,
        isCrit: false,
        remainingHp: defenderStats.hp,
      };
    }

    // Physical damage
    const weaponDmg =
      attackerStats.minAttack && attackerStats.maxAttack
        ? randomBetween(attackerStats.minAttack, attackerStats.maxAttack)
        : 0;
    const strBonus = Math.floor((attackerStats.str ?? 0) * 0.5);
    const physicalDmg = strBonus + weaponDmg;

    // Magic damage (reduced by MR)
    const magicDmg = Math.floor(
      ((attackerStats.int ?? 0) * 0.7 + (attackerStats.spellPower ?? 0)) *
        (1 - Math.min(0.8, defenderStats.mr / 100)),
    );

    const baseDmg = Math.max(physicalDmg, magicDmg);

    // Critical
    const critChance = Math.min(
      35,
      (attackerStats.critRate ?? 0) +
        Math.floor((attackerStats.dex ?? 0) * 0.3),
    );
    const isCrit = Math.random() * 100 < critChance;
    const critMul = isCrit ? 1.5 : 1;

    // Variance ±10%
    const variance = 0.9 + Math.random() * 0.2;

    const damage = Math.max(1, Math.floor(baseDmg * critMul * variance));
    const remainingHp = Math.max(0, defenderStats.hp - damage);

    return {
      damage,
      missed: false,
      isCrit,
      remainingHp,
    };
  }
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
