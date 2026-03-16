import * as Phaser from "phaser";
import { registerRemasterUnitTextures } from "@/game/render/remasterUnitTextures";
import {
  fetchRemasterManifest,
  preloadRemasterOverrides,
} from "@/game/render/remasterOverrides";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  async create() {
    const manifest = await fetchRemasterManifest();
    await preloadRemasterOverrides(this, manifest);
    registerRemasterUnitTextures(this);
    this.scene.start("CharacterCreateScene");
  }
}
