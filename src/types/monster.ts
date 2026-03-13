import type { Position } from "@/types/game";

export interface MonsterDrop {
  itemId: string;
  rate: number;
  minQuantity?: number;
  maxQuantity?: number;
}

export interface Monster {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  exp: number;
  goldRange: [number, number];
  drops: MonsterDrop[];
  position?: Position;
  aggressive: boolean;
  respawnTime: number;
  moveSpeed: number;
  special?: string[];
  sprite: string;
  isBoss: boolean;
  isRaidBoss: boolean;
  isUndead: boolean;
  isFlying: boolean;
  isMagic: boolean;
  spawnMapIds?: string[];
}
