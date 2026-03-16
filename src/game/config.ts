import * as Phaser from "phaser";
import { BootScene } from "@/game/scenes/BootScene";
import { PreloadScene } from "@/game/scenes/PreloadScene";
import { CharacterCreateScene } from "@/game/scenes/CharacterCreateScene";
import { WorldScene } from "@/game/scenes/WorldScene";

export function createGameConfig(parent: string): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent,
    backgroundColor: "#090a0e",
    pixelArt: false,
    roundPixels: false,
    antialias: true,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: [BootScene, PreloadScene, CharacterCreateScene, WorldScene],
  };
}
