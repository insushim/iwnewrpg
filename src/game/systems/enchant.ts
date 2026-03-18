import type { ItemStats } from '@/types/item';

export type EnchantResult = 'success' | 'fail' | 'destroy';

export interface EnchantOutcome {
  result: EnchantResult;
  newLevel: number;
  message: string;
}

interface EnchantRateEntry {
  successRate: number;  // probability 0-1
  destroyRate: number;  // probability of destroy on fail
}

export function getEnchantRate(level: number): EnchantRateEntry {
  if (level <= 2) return { successRate: 1.0,  destroyRate: 0 };
  if (level <= 4) return { successRate: 0.75, destroyRate: 0 };
  if (level <= 6) return { successRate: 0.60, destroyRate: 0.05 };
  if (level <= 8) return { successRate: 0.45, destroyRate: 0.10 };
  if (level <= 10) return { successRate: 0.30, destroyRate: 0.20 };
  if (level <= 12) return { successRate: 0.18, destroyRate: 0.35 };
  if (level <= 14) return { successRate: 0.10, destroyRate: 0.50 };
  if (level <= 16) return { successRate: 0.06, destroyRate: 0.60 };
  if (level <= 18) return { successRate: 0.04, destroyRate: 0.70 };
  return { successRate: 0.02, destroyRate: 0.80 };
}

export function rollEnchant(currentLevel: number, blessed: boolean): EnchantOutcome {
  if (currentLevel >= 20) {
    return { result: 'fail', newLevel: 20, message: '이미 최대 강화입니다.' };
  }

  const { successRate, destroyRate } = getEnchantRate(currentLevel);
  const roll = Math.random();

  if (roll < successRate) {
    return {
      result: 'success',
      newLevel: currentLevel + 1,
      message: `강화 성공! +${currentLevel + 1} 달성!`,
    };
  }

  // Failed — check for destruction
  const failRoll = Math.random();
  if (!blessed && failRoll < destroyRate) {
    return {
      result: 'destroy',
      newLevel: 0,
      message: '강화에 실패하여 아이템이 파괴되었습니다!',
    };
  }

  if (blessed) {
    return {
      result: 'fail',
      newLevel: 0,
      message: '강화 실패. 블레싱 효과로 파괴를 막았습니다.',
    };
  }

  const newLevel = Math.max(0, currentLevel - 1);
  return {
    result: 'fail',
    newLevel,
    message: newLevel < currentLevel
      ? `강화 실패! +${currentLevel} → +${newLevel}`
      : '강화에 실패했습니다.',
  };
}

/** Bonus stats added on top of base stats from enchant level */
export function getEnchantStatBonus(baseStats: ItemStats, enchantLevel: number): Partial<ItemStats> {
  if (enchantLevel <= 0) return {};
  const bonus: Partial<ItemStats> = {};

  if (baseStats.minAttack !== undefined) {
    bonus.minAttack = Math.max(1, Math.round(baseStats.minAttack * enchantLevel * 0.12));
  }
  if (baseStats.maxAttack !== undefined) {
    bonus.maxAttack = Math.max(1, Math.round(baseStats.maxAttack * enchantLevel * 0.12));
  }
  if (baseStats.ac !== undefined) {
    bonus.ac = Math.round(baseStats.ac * enchantLevel * 0.12);
  }
  if (baseStats.hp !== undefined) {
    bonus.hp = Math.round(baseStats.hp * enchantLevel * 0.15);
  }
  if (baseStats.mp !== undefined) {
    bonus.mp = Math.round(baseStats.mp * enchantLevel * 0.15);
  }

  return bonus;
}

/** Display name for enchant level e.g. "+7 미스릴 장검" */
export function getEnchantedName(baseName: string, level: number): string {
  if (level <= 0) return baseName;
  if (level >= 15) return `★+${level} ${baseName}`;
  if (level >= 10) return `+${level} ${baseName}`;
  return `+${level} ${baseName}`;
}

/** Color for enchant level display */
export function getEnchantColor(level: number): string {
  if (level <= 0) return '#d4d4d4';
  if (level <= 3) return '#ffffff';
  if (level <= 6) return '#6ee7b7';
  if (level <= 9) return '#60a5fa';
  if (level <= 12) return '#c084fc';
  if (level <= 15) return '#fbbf24';
  if (level <= 17) return '#f97316';
  return '#ef4444';
}
