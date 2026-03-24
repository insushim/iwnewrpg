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
    const afterPhase1 = this.textures.getTextureKeys().filter((k: string) => k.includes("ranger"));
    console.log("[PRELOAD] After Phase1 ranger textures:", afterPhase1.join(","));
    // Then load atlas overrides which replace procedural textures with pixel-art
    const manifest = await fetchRemasterManifest();
    console.log("[PRELOAD] Manifest atlases:", manifest.atlases.length, "textures:", manifest.textures.length);
    await preloadRemasterOverrides(this, manifest);
    const afterOverrides = this.textures.getTextureKeys().filter((k: string) => k.includes("ranger"));
    console.log("[PRELOAD] After overrides ranger textures:", afterOverrides.join(","));

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
