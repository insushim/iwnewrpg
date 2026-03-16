import * as Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    const { width, height } = this.scale;
    const bar = this.add
      .rectangle(width / 2, height / 2, 320, 16, 0x2b1b0c)
      .setOrigin(0.5);
    const fill = this.add
      .rectangle(width / 2 - 156, height / 2, 0, 8, 0xd6b44d)
      .setOrigin(0, 0.5);
    const label = this.add
      .text(width / 2, height / 2 - 48, "RuneWord Chronicle", {
        fontFamily: "serif",
        fontSize: "28px",
        color: "#f6e7b0",
      })
      .setOrigin(0.5);

    this.load.on("progress", (value: number) => {
      fill.width = 312 * value;
    });

    this.load.on("complete", () => {
      bar.destroy();
      fill.destroy();
      label.destroy();
    });
  }

  create() {
    this.createSpriteTextures();
    this.scene.start("PreloadScene");
  }

  private createSpriteTextures() {
    this.createTileTexture("tile_grass_a", 0x335f39, 0x15301a, 0x5b9a56);
    this.createTileTexture("tile_grass_b", 0x2b5130, 0x142a17, 0x4d8649);
    this.createTileTexture("tile_path", 0x8f7c58, 0x463622, 0xb8a27c);
    this.createTileTexture("tile_cobble", 0x667071, 0x343a3b, 0xaab4b5);
    this.createTileTexture("tile_water", 0x2e7e9a, 0x124d63, 0x77d4e5);
    this.createArrowTexture("projectile_arrow");
    this.createGemTexture("loot_gem");
    this.createTreeTexture("prop_tree");
    this.createRockTexture("prop_rock");
    this.createFenceTexture("prop_fence");
    this.createBannerTexture("prop_banner");
    this.createRuinTexture("prop_ruin");
    this.createCrystalTexture("prop_crystal");
  }

  private createTileTexture(
    key: string,
    base: number,
    shadow: number,
    highlight: number,
  ) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(base, 1).fillRect(0, 0, 96, 72);
    g.fillStyle(highlight, 0.05);
    for (let x = 6; x < 96; x += 18) {
      for (let y = 6; y < 72; y += 16) {
        g.fillRect(x, y, 4, 10);
      }
    }
    g.fillStyle(shadow, 0.05);
    for (let x = 0; x < 96; x += 12) {
      g.fillRect(x, ((x / 12) % 2) * 6, 6, 72);
    }
    g.fillStyle(highlight, 0.13).fillEllipse(28, 18, 48, 16);
    g.fillStyle(highlight, 0.09).fillEllipse(70, 24, 32, 12);
    g.fillStyle(highlight, 0.06).fillEllipse(56, 48, 26, 10);
    g.fillStyle(shadow, 0.1).fillEllipse(76, 58, 38, 14);
    g.fillStyle(shadow, 0.08).fillEllipse(16, 54, 26, 10);
    g.lineStyle(2, shadow, 0.18).strokeRoundedRect(1, 1, 94, 70, 12);
    g.lineStyle(1, highlight, 0.16).strokeRoundedRect(4, 4, 88, 64, 10);
    g.lineStyle(1, shadow, 0.08);
    g.strokeLineShape(new Phaser.Geom.Line(12, 12, 84, 56));
    g.strokeLineShape(new Phaser.Geom.Line(6, 58, 90, 18));
    g.generateTexture(key, 96, 72);
    g.destroy();
  }

  private createCharacterTexture(
    key: string,
    torso: number,
    cloak: number,
    skin: number,
    accent: number,
  ) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(cloak, 1).fillTriangle(16, 48, 32, 16, 48, 48);
    g.fillStyle(torso, 1).fillRoundedRect(20, 18, 24, 24, 8);
    g.fillStyle(accent, 1).fillRect(23, 44, 6, 12).fillRect(35, 44, 6, 12);
    g.fillStyle(skin, 1).fillCircle(32, 12, 9);
    g.fillStyle(0xffffff, 0.24).fillRect(24, 22, 16, 4);
    g.lineStyle(2, skin, 0.2).strokeRoundedRect(20, 18, 24, 24, 8);
    g.generateTexture(key, 64, 64);
    g.destroy();
  }

  private createBlobMonsterTexture(
    key: string,
    body: number,
    eye: number,
    belly: number,
  ) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(body, 1).fillEllipse(32, 34, 42, 28);
    g.fillStyle(belly, 0.9).fillEllipse(32, 39, 24, 14);
    g.fillStyle(eye, 1).fillCircle(24, 30, 3).fillCircle(40, 30, 3);
    g.fillStyle(0x151515, 1).fillCircle(24, 30, 1.3).fillCircle(40, 30, 1.3);
    g.generateTexture(key, 64, 64);
    g.destroy();
  }

  private createSpiderTexture(key: string) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.lineStyle(3, 0x172012, 1);
    [14, 22, 42, 50].forEach((x) => {
      g.beginPath();
      g.moveTo(32, 30);
      g.lineTo(x, 20);
      g.lineTo(x - 6, 10);
      g.strokePath();
      g.beginPath();
      g.moveTo(32, 34);
      g.lineTo(x, 44);
      g.lineTo(x - 6, 54);
      g.strokePath();
    });
    g.fillStyle(0x46654b, 1).fillEllipse(32, 32, 26, 22);
    g.fillStyle(0xa7d39f, 0.3).fillEllipse(32, 29, 10, 6);
    g.generateTexture(key, 64, 64);
    g.destroy();
  }

  private createWolfTexture(key: string) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x8b8f96, 1).fillEllipse(30, 34, 34, 18);
    g.fillStyle(0x7a8087, 1).fillRect(18, 38, 4, 12).fillRect(36, 38, 4, 12);
    g.fillStyle(0xaab0b8, 1).fillTriangle(40, 28, 52, 24, 46, 38);
    g.fillStyle(0xf4f6f7, 1).fillCircle(46, 30, 2);
    g.generateTexture(key, 64, 64);
    g.destroy();
  }

  private createOrcTexture(key: string) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x7da04e, 1).fillEllipse(32, 34, 34, 22);
    g.fillStyle(0x4f6a2d, 1).fillRoundedRect(20, 16, 24, 18, 6);
    g.fillStyle(0xc6d98b, 1).fillCircle(26, 22, 2).fillCircle(38, 22, 2);
    g.fillStyle(0xe9e2cc, 1).fillRect(22, 30, 4, 4).fillRect(38, 30, 4, 4);
    g.generateTexture(key, 64, 64);
    g.destroy();
  }

  private createBoarTexture(key: string) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x7e5638, 1).fillEllipse(30, 36, 36, 20);
    g.fillStyle(0x9d6f46, 1).fillEllipse(40, 34, 18, 12);
    g.fillStyle(0xf3dfc5, 1).fillRect(46, 34, 6, 2);
    g.fillStyle(0x6b4327, 1).fillTriangle(18, 26, 14, 18, 24, 22);
    g.generateTexture(key, 64, 64);
    g.destroy();
  }

  private createWispTexture(key: string) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x7bd6ff, 0.85).fillCircle(32, 26, 10);
    g.fillStyle(0xdff8ff, 0.5).fillCircle(32, 26, 18);
    g.fillStyle(0x9fe8ff, 0.6).fillTriangle(26, 34, 38, 34, 32, 54);
    g.generateTexture(key, 64, 64);
    g.destroy();
  }

  private createDragonTexture(key: string) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xb84b40, 1).fillEllipse(30, 34, 34, 22);
    g.fillStyle(0xdf7d62, 1).fillTriangle(20, 24, 12, 12, 28, 18);
    g.fillStyle(0xdf7d62, 1).fillTriangle(40, 24, 52, 14, 44, 30);
    g.fillStyle(0xffd8b8, 1).fillTriangle(30, 18, 24, 8, 36, 10);
    g.fillStyle(0x2b0f10, 1).fillCircle(24, 30, 2).fillCircle(38, 30, 2);
    g.generateTexture(key, 72, 72);
    g.destroy();
  }

  private createRockGolemTexture(key: string) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x747b72, 1).fillRoundedRect(16, 22, 30, 24, 8);
    g.fillStyle(0x8f988d, 1).fillRoundedRect(10, 28, 14, 18, 5);
    g.fillStyle(0x8f988d, 1).fillRoundedRect(40, 28, 14, 18, 5);
    g.fillStyle(0x5b6159, 1).fillRect(22, 44, 8, 12).fillRect(34, 44, 8, 12);
    g.fillStyle(0xaad8e2, 0.9).fillCircle(26, 32, 2).fillCircle(38, 32, 2);
    g.fillStyle(0xc3cec1, 0.25).fillEllipse(32, 24, 16, 8);
    g.generateTexture(key, 64, 64);
    g.destroy();
  }

  private createSkeletonTexture(key: string) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xe6e2d7, 1).fillCircle(32, 16, 10);
    g.fillStyle(0x171717, 1).fillCircle(28, 14, 2).fillCircle(36, 14, 2);
    g.fillStyle(0xd4cfc2, 1).fillRoundedRect(24, 28, 16, 18, 5);
    g.fillStyle(0xe6e2d7, 1).fillRect(21, 28, 4, 18).fillRect(39, 28, 4, 18);
    g.fillStyle(0xe6e2d7, 1).fillRect(27, 44, 4, 14).fillRect(33, 44, 4, 14);
    g.fillStyle(0x8d6f49, 1).fillRect(41, 22, 10, 3);
    g.fillStyle(0x603d21, 1).fillTriangle(51, 23, 47, 19, 47, 27);
    g.generateTexture(key, 64, 64);
    g.destroy();
  }

  private createTreeTexture(key: string) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x0a0f10, 0.22).fillEllipse(32, 50, 34, 10);
    g.fillStyle(0x4b2f18, 1).fillRect(27, 30, 10, 22);
    g.fillStyle(0x173a25, 1).fillEllipse(32, 24, 36, 24);
    g.fillStyle(0x295736, 0.92).fillEllipse(22, 22, 24, 20);
    g.fillStyle(0x3d704a, 0.92).fillEllipse(42, 18, 24, 18);
    g.fillStyle(0x4e8758, 0.68).fillEllipse(31, 16, 18, 10);
    g.generateTexture(key, 64, 64);
    g.destroy();
  }

  private createRockTexture(key: string) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x0a0f10, 0.18).fillEllipse(32, 42, 28, 10);
    g.fillStyle(0x6d766a, 1).fillEllipse(32, 36, 28, 18);
    g.fillStyle(0x868f82, 0.84).fillEllipse(28, 33, 12, 7);
    g.fillStyle(0xaeb7ab, 0.2).fillEllipse(26, 31, 10, 6);
    g.generateTexture(key, 64, 64);
    g.destroy();
  }

  private createFenceTexture(key: string) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x7d5d32, 1)
      .fillRect(4, 18, 8, 18)
      .fillRect(20, 18, 8, 18)
      .fillRect(36, 18, 8, 18);
    g.fillStyle(0x9a7541, 1).fillRect(0, 12, 48, 4).fillRect(0, 24, 48, 4);
    g.generateTexture(key, 48, 40);
    g.destroy();
  }

  private createBannerTexture(key: string) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x5d4527, 1).fillRect(22, 6, 4, 52);
    g.fillStyle(0xc79339, 1).fillRect(10, 10, 24, 4);
    g.fillStyle(0x852b22, 1).fillRoundedRect(12, 14, 20, 24, 4);
    g.fillStyle(0xe8cf8e, 0.85).fillTriangle(22, 18, 18, 30, 26, 30);
    g.fillStyle(0xf7e6b1, 0.18).fillRect(14, 16, 4, 18);
    g.fillStyle(0xffffff, 0.12).fillRect(12, 14, 6, 22);
    g.generateTexture(key, 48, 64);
    g.destroy();
  }

  private createRuinTexture(key: string) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x07090b, 0.16).fillEllipse(26, 48, 34, 10);
    g.fillStyle(0x63675f, 1).fillRoundedRect(8, 20, 34, 26, 6);
    g.fillStyle(0x889184, 1).fillRoundedRect(14, 8, 10, 38, 5);
    g.fillStyle(0x4d534d, 0.5).fillRect(10, 34, 28, 8);
    g.fillStyle(0xa8b09f, 0.22).fillRect(14, 12, 8, 8).fillRect(26, 24, 10, 6);
    g.generateTexture(key, 52, 56);
    g.destroy();
  }

  private createCrystalTexture(key: string) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x6fe2ff, 0.26).fillEllipse(28, 38, 30, 12);
    g.fillStyle(0x61e7ff, 0.95).fillPoints(
      [
        { x: 28, y: 6 },
        { x: 40, y: 22 },
        { x: 34, y: 42 },
        { x: 22, y: 42 },
        { x: 16, y: 22 },
      ],
      true,
    );
    g.fillStyle(0xcfffff, 0.7).fillPoints(
      [
        { x: 28, y: 10 },
        { x: 35, y: 22 },
        { x: 28, y: 34 },
        { x: 22, y: 22 },
      ],
      true,
    );
    g.fillStyle(0xffffff, 0.18).fillEllipse(25, 18, 8, 18);
    g.generateTexture(key, 56, 56);
    g.destroy();
  }

  private createGemTexture(key: string) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffe178, 1).fillPoints(
      [
        { x: 16, y: 6 },
        { x: 26, y: 16 },
        { x: 16, y: 26 },
        { x: 6, y: 16 },
      ],
      true,
    );
    g.fillStyle(0xfff7d0, 1).fillRect(15, 4, 2, 6);
    g.generateTexture(key, 32, 32);
    g.destroy();
  }

  private createArrowTexture(key: string) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x8b5a2b, 1).fillRect(0, 6, 22, 2);
    g.fillStyle(0xcfdc9e, 1).fillTriangle(22, 7, 16, 3, 16, 11);
    g.fillStyle(0xf5f0d7, 1).fillTriangle(0, 7, 4, 3, 4, 11);
    g.generateTexture(key, 24, 14);
    g.destroy();
  }
}
