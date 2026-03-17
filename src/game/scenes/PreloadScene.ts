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
    const manifest = await fetchRemasterManifest();
    await preloadRemasterOverrides(this, manifest);
    registerRemasterUnitTextures(this);

    const savedRaw = localStorage.getItem("iwnewrpg_save");
    if (savedRaw) {
      try {
        const { name, className, serverName } = JSON.parse(savedRaw);
        const store = useGameStore.getState();
        store.setServerName(serverName ?? "아스카론 01");
        store.setPlayer({ name, className });
        this.scene.start("WorldScene", { serverName: serverName ?? "아스카론 01" });
        return;
      } catch {
        localStorage.removeItem("iwnewrpg_save");
      }
    }

    this.scene.start("CharacterCreateScene");
  }
}
