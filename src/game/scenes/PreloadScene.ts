import * as Phaser from "phaser";
import { registerRemasterUnitTextures } from "@/game/render/remasterUnitTextures";
import {
  fetchRemasterManifest,
  preloadRemasterOverrides,
} from "@/game/render/remasterOverrides";
import { useGameStore } from "@/lib/gameStore";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  async create() {
    // Generate procedural textures FIRST as baseline fallback
    registerRemasterUnitTextures(this);
    // Then load atlas overrides which replace procedural textures with pixel-art
    const manifest = await fetchRemasterManifest();
    await preloadRemasterOverrides(this, manifest);

    const savedRaw = localStorage.getItem("iwnewrpg_save");
    if (savedRaw) {
      try {
        const { name, className, serverName, grade } = JSON.parse(savedRaw);
        const store = useGameStore.getState();
        store.setServerName(serverName ?? "아스카론 01");
        if (grade) store.setGrade(grade);
        store.setPlayer({ name, className });
        this.scene.start("WorldScene", {
          serverName: serverName ?? "아스카론 01",
        });
        return;
      } catch {
        localStorage.removeItem("iwnewrpg_save");
      }
    }

    this.scene.start("CharacterCreateScene");
  }
}
