export enum CharacterClass {
  SOVEREIGN = "sovereign",
  GUARDIAN = "guardian",
  RANGER = "ranger",
  ARCANIST = "arcanist",
}

export interface CharacterStats {
  STR: number;
  DEX: number;
  CON: number;
  INT: number;
  WIS: number;
  CHA: number;
}

export interface Position {
  x: number;
  y: number;
  mapId: string;
}

export enum Direction {
  N = "N",
  NE = "NE",
  E = "E",
  SE = "SE",
  S = "S",
  SW = "SW",
  W = "W",
  NW = "NW",
}

export enum TileType {
  GRASS = "grass",
  SAND = "sand",
  WATER = "water",
  STONE_PATH = "stone_path",
  COBBLESTONE = "cobblestone",
  BRICK = "brick",
  FOREST_GRASS = "forest_grass",
  DIRT = "dirt",
  VOLCANIC_ROCK = "volcanic_rock",
  LAVA = "lava",
  DARK_STONE = "dark_stone",
  MARBLE = "marble",
  DARK_CAVE = "dark_cave",
  WET_STONE = "wet_stone",
  MOSS = "moss",
}

export interface GameState {
  currentMapId: string;
  isConnected: boolean;
  serverTick: number;
  activePlayers: string[];
  activeMonsterIds: string[];
}

export type DifficultyTier =
  | "elementary"
  | "middle"
  | "high"
  | "advanced";
