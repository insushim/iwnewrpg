import type { Monster } from "@/types/monster";
import type { TileType } from "@/types/game";

export interface MapTile {
  x: number;
  y: number;
  type: TileType;
  walkable: boolean;
  elevation: number;
}

export interface MapConnection {
  to: string;
  fromPortalName: string;
  spawn: { x: number; y: number };
}

export interface MapNpc {
  id: string;
  x: number;
  y: number;
}

export interface GameMap {
  id: string;
  name: string;
  level: string;
  type: "starter" | "town" | "hunting" | "castle" | "dungeon";
  width: number;
  height: number;
  tiles: TileType[];
  monsters: Monster["id"][];
  npcs: MapNpc[];
  safeZone: boolean;
  bgm: string;
  connections: MapConnection[];
  description?: string;
}
