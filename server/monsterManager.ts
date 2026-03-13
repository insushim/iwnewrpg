type MonsterDrop = {
  itemId: string;
  rate: number;
  minQuantity?: number;
  maxQuantity?: number;
};

type MonsterState = {
  id: string;
  mapId: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  atk: number;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  drops: MonsterDrop[];
  moveSpeed: number;
  aggroRange: number;
  attackRange: number;
  chaseRange: number;
  targetId: string | null;
  lastAttackAt: number;
};

const baseMonsters: MonsterState[] = [
  {
    id: "slime-1",
    mapId: "speakingIsland",
    name: "슬라임",
    level: 1,
    hp: 20,
    maxHp: 20,
    atk: 4,
    x: 640,
    y: 320,
    homeX: 640,
    homeY: 320,
    moveSpeed: 10,
    aggroRange: 110,
    attackRange: 44,
    chaseRange: 180,
    targetId: null,
    lastAttackAt: 0,
    drops: [
      { itemId: "red_potion", rate: 0.15 },
      { itemId: "animal_hide", rate: 0.08 },
    ],
  },
  {
    id: "goblin-1",
    mapId: "speakingIsland",
    name: "꼬마 고블린",
    level: 2,
    hp: 35,
    maxHp: 35,
    atk: 7,
    x: 720,
    y: 360,
    homeX: 720,
    homeY: 360,
    moveSpeed: 14,
    aggroRange: 170,
    attackRange: 52,
    chaseRange: 240,
    targetId: null,
    lastAttackAt: 0,
    drops: [
      { itemId: "animal_hide", rate: 0.22, minQuantity: 1, maxQuantity: 2 },
      { itemId: "trainee_dagger", rate: 0.03 },
      { itemId: "teleport_scroll", rate: 0.02 },
    ],
  },
];

export class MonsterManager {
  private monsters = new Map(baseMonsters.map((monster) => [monster.id, { ...monster }]));

  list(mapId: string) {
    return Array.from(this.monsters.values()).filter((monster) => monster.mapId === mapId);
  }

  listAll() {
    return Array.from(this.monsters.values());
  }

  get(monsterId: string) {
    return this.monsters.get(monsterId) ?? null;
  }

  setTarget(monsterId: string, targetId: string | null) {
    const monster = this.monsters.get(monsterId);
    if (!monster || monster.hp <= 0) {
      return null;
    }

    monster.targetId = targetId;
    return { ...monster };
  }

  moveTowards(monsterId: string, x: number, y: number) {
    const monster = this.monsters.get(monsterId);
    if (!monster || monster.hp <= 0) {
      return null;
    }

    const dx = x - monster.x;
    const dy = y - monster.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= 1) {
      return { ...monster };
    }

    const step = Math.min(monster.moveSpeed, distance);
    monster.x += (dx / distance) * step;
    monster.y += (dy / distance) * step;
    return { ...monster };
  }

  returnHome(monsterId: string) {
    const monster = this.monsters.get(monsterId);
    if (!monster) {
      return null;
    }

    monster.targetId = null;
    monster.x = monster.homeX;
    monster.y = monster.homeY;
    return { ...monster };
  }

  markAttack(monsterId: string, now: number) {
    const monster = this.monsters.get(monsterId);
    if (!monster) {
      return null;
    }

    monster.lastAttackAt = now;
    return { ...monster };
  }

  applyDamage(monsterId: string, damage: number) {
    const monster = this.monsters.get(monsterId);
    if (!monster) {
      return null;
    }

    monster.hp = Math.max(0, monster.hp - damage);
    const defeated = monster.hp === 0;

    if (defeated) {
      monster.targetId = null;
      setTimeout(() => {
        const current = this.monsters.get(monsterId);
        if (current) {
          current.hp = current.maxHp;
          current.x = current.homeX;
          current.y = current.homeY;
          current.targetId = null;
          current.lastAttackAt = 0;
        }
      }, 5000);
    }

    return { monster: { ...monster }, defeated };
  }
}

export type { MonsterState, MonsterDrop };
