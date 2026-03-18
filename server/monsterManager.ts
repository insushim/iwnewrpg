import { MAPS } from "@/game/data/maps";
import { MONSTERS } from "@/game/data/monsters";

type SpawnZone = {
  mapId: keyof typeof MAPS;
  count: number;
  monsterId: keyof typeof MONSTERS;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  radius: number;
};

export type MonsterState = {
  id: string;
  templateId: string;
  mapId: string;
  name: string;
  drops: Array<{
    itemId: string;
    rate: number;
    minQuantity?: number;
    maxQuantity?: number;
  }>;
  level: number;
  hp: number;
  maxHp: number;
  atk: number;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  aggroRange: number;
  chaseRange: number;
  attackRange: number;
  moveSpeed: number;
  respawnDelay: number;
  lastAttackAt: number;
  targetId: string | null;
  deadUntil: number | null;
};

const SPAWN_LAYOUTS: SpawnZone[] = [
  {
    mapId: "speakingIsland",
    monsterId: "slime",
    count: 6,
    minX: 1320,
    maxX: 1880,
    minY: 160,
    maxY: 360,
    radius: 90,
  },
  {
    mapId: "speakingIsland",
    monsterId: "slime",
    count: 4,
    minX: 1460,
    maxX: 2040,
    minY: 980,
    maxY: 1320,
    radius: 100,
  },
  {
    mapId: "speakingIsland",
    monsterId: "goblin_child",
    count: 5,
    minX: 1320,
    maxX: 1920,
    minY: 520,
    maxY: 860,
    radius: 110,
  },
  {
    mapId: "speakingIsland",
    monsterId: "wild_boar",
    count: 4,
    minX: 1860,
    maxX: 2480,
    minY: 760,
    maxY: 1320,
    radius: 130,
  },
  {
    mapId: "speakingIsland",
    monsterId: "skeleton_warrior",
    count: 3,
    minX: 2140,
    maxX: 2860,
    minY: 260,
    maxY: 900,
    radius: 140,
  },
  {
    mapId: "speakingIsland",
    monsterId: "goblin_child",
    count: 3,
    minX: 2460,
    maxX: 3040,
    minY: 1080,
    maxY: 1520,
    radius: 120,
  },
  {
    mapId: "speakingIsland",
    monsterId: "slime_boss",
    count: 1,
    minX: 1600,
    maxX: 1900,
    minY: 300,
    maxY: 500,
    radius: 60,
  },
  {
    mapId: "speakingIsland",
    monsterId: "goblin_boss",
    count: 1,
    minX: 1700,
    maxX: 2000,
    minY: 700,
    maxY: 900,
    radius: 60,
  },
  {
    mapId: "speakingIsland",
    monsterId: "skeleton_boss",
    count: 1,
    minX: 2400,
    maxX: 2700,
    minY: 400,
    maxY: 700,
    radius: 70,
  },
  {
    mapId: "windwoodForest",
    monsterId: "poison_spider",
    count: 4,
    minX: 780,
    maxX: 1680,
    minY: 260,
    maxY: 860,
    radius: 120,
  },
  {
    mapId: "windwoodForest",
    monsterId: "forest_sprite",
    count: 3,
    minX: 1520,
    maxX: 2380,
    minY: 260,
    maxY: 920,
    radius: 120,
  },
  {
    mapId: "windwoodForest",
    monsterId: "werewolf",
    count: 3,
    minX: 1820,
    maxX: 2620,
    minY: 880,
    maxY: 1420,
    radius: 150,
  },
  // ═══ Moonlit Wetland new monsters ═══
  {
    mapId: "moonlitWetland",
    monsterId: "swamp_witch",
    count: 3,
    minX: 2200,
    maxX: 3000,
    minY: 600,
    maxY: 1100,
    radius: 120,
  },
  {
    mapId: "moonlitWetland",
    monsterId: "ice_troll",
    count: 3,
    minX: 1400,
    maxX: 2400,
    minY: 800,
    maxY: 1400,
    radius: 130,
  },
  // ═══ Ancient Cave new monsters ═══
  {
    mapId: "ancientCave",
    monsterId: "vampire_bat",
    count: 4,
    minX: 400,
    maxX: 1200,
    minY: 200,
    maxY: 800,
    radius: 100,
  },
  {
    mapId: "ancientCave",
    monsterId: "bone_archer",
    count: 3,
    minX: 600,
    maxX: 1400,
    minY: 400,
    maxY: 1000,
    radius: 110,
  },
  {
    mapId: "ancientCave",
    monsterId: "shadow_lich",
    count: 1,
    minX: 1000,
    maxX: 1300,
    minY: 600,
    maxY: 900,
    radius: 60,
  },
  // ═══ Dragon Valley new monsters ═══
  {
    mapId: "dragonValley",
    monsterId: "dark_elf_scout",
    count: 3,
    minX: 1200,
    maxX: 2200,
    minY: 400,
    maxY: 1000,
    radius: 140,
  },
  {
    mapId: "dragonValley",
    monsterId: "fire_elemental",
    count: 3,
    minX: 1800,
    maxX: 2800,
    minY: 500,
    maxY: 1200,
    radius: 150,
  },
  {
    mapId: "dragonValley",
    monsterId: "stone_giant",
    count: 2,
    minX: 2600,
    maxX: 3200,
    minY: 800,
    maxY: 1300,
    radius: 120,
  },
  {
    mapId: "dragonValley",
    monsterId: "ancient_dragon",
    count: 1,
    minX: 3300,
    maxX: 3500,
    minY: 1000,
    maxY: 1200,
    radius: 60,
  },
  // ═══ Orc Forest new monsters ═══
  {
    mapId: "orcForest",
    monsterId: "elite_orc_chief",
    count: 1,
    minX: 2400,
    maxX: 2700,
    minY: 1000,
    maxY: 1300,
    radius: 70,
  },
  {
    mapId: "orcForest",
    monsterId: "orc_archer",
    count: 4,
    minX: 980,
    maxX: 1960,
    minY: 320,
    maxY: 960,
    radius: 120,
  },
  {
    mapId: "orcForest",
    monsterId: "kobold_raider",
    count: 4,
    minX: 1380,
    maxX: 2280,
    minY: 840,
    maxY: 1320,
    radius: 120,
  },
  {
    mapId: "orcForest",
    monsterId: "orc_chief",
    count: 1,
    minX: 2300,
    maxX: 2540,
    minY: 960,
    maxY: 1220,
    radius: 80,
  },
  {
    mapId: "gludioPlain",
    monsterId: "wild_boar",
    count: 5,
    minX: 780,
    maxX: 1860,
    minY: 320,
    maxY: 980,
    radius: 130,
  },
  {
    mapId: "gludioPlain",
    monsterId: "goblin_child",
    count: 4,
    minX: 1560,
    maxX: 2480,
    minY: 620,
    maxY: 1340,
    radius: 120,
  },
  {
    mapId: "gludioPlain",
    monsterId: "lizard_scout",
    count: 3,
    minX: 2160,
    maxX: 2920,
    minY: 360,
    maxY: 980,
    radius: 140,
  },
  {
    mapId: "moonlitWetland",
    monsterId: "bog_frog",
    count: 4,
    minX: 1180,
    maxX: 2160,
    minY: 460,
    maxY: 1320,
    radius: 120,
  },
  {
    mapId: "moonlitWetland",
    monsterId: "poison_spider",
    count: 4,
    minX: 1860,
    maxX: 2820,
    minY: 280,
    maxY: 1220,
    radius: 130,
  },
  {
    mapId: "moonlitWetland",
    monsterId: "stone_golem",
    count: 2,
    minX: 2580,
    maxX: 3240,
    minY: 880,
    maxY: 1520,
    radius: 150,
  },
  {
    mapId: "dragonValley",
    monsterId: "drake",
    count: 4,
    minX: 1420,
    maxX: 2520,
    minY: 300,
    maxY: 1060,
    radius: 160,
  },
  {
    mapId: "dragonValley",
    monsterId: "ash_wyvern",
    count: 2,
    minX: 2380,
    maxX: 3240,
    minY: 720,
    maxY: 1380,
    radius: 180,
  },
  {
    mapId: "dragonValley",
    monsterId: "red_dragon",
    count: 1,
    minX: 3160,
    maxX: 3440,
    minY: 920,
    maxY: 1220,
    radius: 90,
  },
];

export class MonsterManager {
  private monsters = new Map<string, MonsterState>();

  constructor() {
    this.seed();
  }

  list(mapId: string) {
    return Array.from(this.monsters.values())
      .filter((monster) => monster.mapId === mapId)
      .map((monster) => this.ensureRespawned(monster));
  }

  listAll() {
    return Array.from(this.monsters.values()).map((monster) =>
      this.ensureRespawned(monster),
    );
  }

  get(id: string) {
    const monster = this.monsters.get(id);
    return monster ? this.ensureRespawned(monster) : null;
  }

  setTarget(id: string, targetId: string | null) {
    const monster = this.monsters.get(id);
    if (!monster) {
      return null;
    }

    monster.targetId = targetId;
    return monster;
  }

  moveTowards(id: string, targetX: number, targetY: number) {
    const monster = this.monsters.get(id);
    if (!monster || monster.deadUntil) {
      return null;
    }

    const angle = Math.atan2(targetY - monster.y, targetX - monster.x);
    const step = monster.moveSpeed * 18;
    const nextX = monster.x + Math.cos(angle) * step;
    const nextY = monster.y + Math.sin(angle) * step;

    // Don't enter village safe zone
    if (!isInSafeZone(monster.mapId, nextX, nextY)) {
      monster.x = nextX;
      monster.y = nextY;
    }
    return monster;
  }

  returnHome(id: string) {
    const monster = this.monsters.get(id);
    if (!monster || monster.deadUntil) {
      return null;
    }

    monster.targetId = null;
    const distance = Math.hypot(
      monster.homeX - monster.x,
      monster.homeY - monster.y,
    );
    if (distance < 18) {
      monster.x = monster.homeX;
      monster.y = monster.homeY;
      return monster;
    }

    const angle = Math.atan2(
      monster.homeY - monster.y,
      monster.homeX - monster.x,
    );
    const step = monster.moveSpeed * 20;
    monster.x += Math.cos(angle) * step;
    monster.y += Math.sin(angle) * step;
    return monster;
  }

  markAttack(id: string, timestamp: number) {
    const monster = this.monsters.get(id);
    if (!monster) {
      return null;
    }

    monster.lastAttackAt = timestamp;
    return monster;
  }

  applyDamage(id: string, damage: number) {
    const monster = this.monsters.get(id);
    if (!monster || monster.deadUntil) {
      return null;
    }

    monster.hp = Math.max(0, monster.hp - damage);

    if (monster.hp > 0) {
      return { monster, defeated: false as const };
    }

    monster.targetId = null;
    monster.deadUntil = Date.now() + monster.respawnDelay;
    return { monster, defeated: true as const };
  }

  respawn(id: string) {
    const monster = this.monsters.get(id);
    if (!monster) {
      return null;
    }

    const next = this.reseedMonster(monster);
    this.monsters.set(id, next);
    return next;
  }

  getRespawnDelay(id: string) {
    return this.monsters.get(id)?.respawnDelay ?? 5000;
  }

  private ensureRespawned(monster: MonsterState) {
    if (!monster.deadUntil || Date.now() < monster.deadUntil) {
      return monster;
    }

    const next = this.reseedMonster(monster);
    this.monsters.set(monster.id, next);
    return next;
  }

  private seed() {
    SPAWN_LAYOUTS.forEach((zone) => {
      const template = MONSTERS[zone.monsterId];
      for (let index = 0; index < zone.count; index += 1) {
        const id = `${zone.monsterId}-${index + 1}`;
        const home = this.randomPoint(zone);

        this.monsters.set(id, {
          id,
          templateId: template.id,
          mapId: zone.mapId,
          name: template.name,
          drops: template.drops,
          level: template.level,
          hp: template.maxHp,
          maxHp: template.maxHp,
          atk: template.atk,
          x: home.x,
          y: home.y,
          homeX: home.x,
          homeY: home.y,
          aggroRange: template.aggressive ? 260 : 0,
          chaseRange: 360 + template.level * 8,
          attackRange: template.special?.includes("ranged") ? 220 : 72,
          moveSpeed: 0.7 + template.moveSpeed * 0.22,
          respawnDelay: Math.max(5000, template.respawnTime * 1000),
          lastAttackAt: 0,
          targetId: null,
          deadUntil: null,
        });
      }
    });
  }

  private reseedMonster(monster: MonsterState) {
    const zone = SPAWN_LAYOUTS.find(
      (entry) =>
        entry.mapId === monster.mapId && entry.monsterId === monster.templateId,
    ) ?? {
      mapId: monster.mapId as keyof typeof MAPS,
      count: 1,
      monsterId: monster.templateId as keyof typeof MONSTERS,
      minX: monster.homeX - 120,
      maxX: monster.homeX + 120,
      minY: monster.homeY - 120,
      maxY: monster.homeY + 120,
      radius: 100,
    };
    const template = MONSTERS[monster.templateId];
    const home = this.randomPoint(zone);

    return {
      ...monster,
      name: template.name,
      drops: template.drops,
      level: template.level,
      hp: template.maxHp,
      maxHp: template.maxHp,
      atk: template.atk,
      x: home.x,
      y: home.y,
      homeX: home.x,
      homeY: home.y,
      targetId: null,
      deadUntil: null,
      lastAttackAt: 0,
    };
  }

  private randomPoint(
    zone: Pick<
      SpawnZone,
      "mapId" | "minX" | "maxX" | "minY" | "maxY" | "radius"
    >,
  ) {
    const map = MAPS[zone.mapId] ?? MAPS.speakingIsland;
    for (let attempt = 0; attempt < 16; attempt += 1) {
      const x =
        randomBetween(zone.minX, zone.maxX) +
        randomBetween(-zone.radius, zone.radius);
      const y =
        randomBetween(zone.minY, zone.maxY) +
        randomBetween(-zone.radius, zone.radius);
      const point = {
        x: clamp(x, 120, map.width * 72 + 140),
        y: clamp(y, 120, map.height * 52 + 140),
      };

      if (!isBlockedSpawn(zone.mapId, point.x, point.y)) {
        return point;
      }
    }

    return {
      x: clamp(zone.maxX, 120, map.width * 72 + 140),
      y: clamp(zone.maxY, 120, map.height * 52 + 140),
    };
  }
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function isBlockedSpawn(mapId: keyof typeof MAPS, x: number, y: number) {
  if (mapId !== "speakingIsland") {
    return false;
  }

  return x >= 220 && x <= 980 && y >= 180 && y <= 610;
}

function isInSafeZone(mapId: string, x: number, y: number) {
  if (mapId !== "speakingIsland") {
    return false;
  }
  // Village safe zone: STARTER_TOWN_RECT equivalent (x:220-980, y:180-610)
  return x >= 220 && x <= 980 && y >= 180 && y <= 610;
}
