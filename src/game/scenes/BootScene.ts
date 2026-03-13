import * as Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    const { width, height } = this.scale;
    const bar = this.add.rectangle(width / 2, height / 2, 320, 16, 0x2b1b0c).setOrigin(0.5);
    const fill = this.add.rectangle(width / 2 - 156, height / 2, 0, 8, 0xd6b44d).setOrigin(0, 0.5);
    const label = this.add.text(width / 2, height / 2 - 48, "RuneWord Chronicle", {
      fontFamily: "serif",
      fontSize: "28px",
      color: "#f6e7b0",
    }).setOrigin(0.5);

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

    this.createAnimatedHumanoidSet("anim_player_guardian", 0x809eff, 0x243f8a, 0xd6e6ff, 0x2d3960, "blade");
    this.createAnimatedHumanoidSet("anim_player_ranger", 0x86d497, 0x264f2d, 0xe7f8c2, 0x6a5631, "bow");
    this.createAnimatedHumanoidSet("anim_player_arcanist", 0xd6a4ff, 0x4c2878, 0xf2dfff, 0x362046, "staff");
    this.createAnimatedHumanoidSet("anim_player_sovereign", 0xd8bb6c, 0x5d3d19, 0xffefb5, 0x5a4421, "blade");
    this.createAnimatedHumanoidSet("anim_npc_weapon", 0x69b4ff, 0x21466f, 0xd8f1ff, 0x12263f, "blade");
    this.createAnimatedHumanoidSet("anim_npc_armor", 0x7ed7c2, 0x1f6457, 0xdffff7, 0x16302d, "none");
    this.createAnimatedHumanoidSet("anim_npc_magic", 0xd889ff, 0x5b2e7d, 0xffd7ff, 0x2b1939, "staff");
    this.createAnimatedHumanoidSet("anim_npc_inn", 0xffb17f, 0x7b4827, 0xffedd3, 0x452514, "none");
    this.createAnimatedHumanoidSet("anim_npc_blacksmith", 0xff8568, 0x733b2c, 0xffd9ce, 0x321412, "blade");
    this.createAnimatedHumanoidSet("anim_npc_default", 0xe6db97, 0x665925, 0xfff4ba, 0x332e17, "none");

    this.createAnimatedSlimeSet("anim_monster_slime", 0xd65b4b, 0xffc1b6, 0xf48a74);
    this.createAnimatedSlimeSet("anim_monster_bog", 0x6f9d56, 0xd7ffd0, 0x8fc772);
    this.createAnimatedBeastSet("anim_monster_spider", 0x46654b, 0x172012, "spider");
    this.createAnimatedBeastSet("anim_monster_wolf", 0x8b8f96, 0xcfd6dc, "wolf");
    this.createAnimatedBeastSet("anim_monster_orc", 0x7da04e, 0xc6d98b, "orc");
    this.createAnimatedBeastSet("anim_monster_boar", 0x7e5638, 0xf3dfc5, "boar");
    this.createAnimatedBeastSet("anim_monster_wisp", 0x7bd6ff, 0xdff8ff, "wisp");
    this.createAnimatedBeastSet("anim_monster_dragon", 0xb84b40, 0xffd8b8, "dragon");
    this.createAnimatedBeastSet("anim_monster_rock_golem", 0x747b72, 0xaad8e2, "golem");
    this.createAnimatedBeastSet("anim_monster_skeleton", 0xe6e2d7, 0x8d6f49, "skeleton");
  }

  private createAnimatedHumanoidSet(
    base: string,
    torso: number,
    cloak: number,
    skin: number,
    accent: number,
    weapon: "blade" | "bow" | "staff" | "none",
  ) {
    const directions = ["n", "ne", "e", "se", "s", "sw", "w", "nw"] as const;
    directions.forEach((direction) => {
      [0, 1].forEach((frame) => {
        this.createUnitFrame(`${base}_idle_${direction}_${frame}`, {
          family: "humanoid",
          direction,
          frame,
          state: "idle",
          primary: torso,
          secondary: cloak,
          tertiary: skin,
          accent,
          weapon,
        });
      });
      [0, 1, 2, 3].forEach((frame) => {
        this.createUnitFrame(`${base}_walk_${direction}_${frame}`, {
          family: "humanoid",
          direction,
          frame,
          state: "walk",
          primary: torso,
          secondary: cloak,
          tertiary: skin,
          accent,
          weapon,
        });
      });
      [0, 1, 2].forEach((frame) => {
        this.createUnitFrame(`${base}_attack_${direction}_${frame}`, {
          family: "humanoid",
          direction,
          frame,
          state: "attack",
          primary: torso,
          secondary: cloak,
          tertiary: skin,
          accent,
          weapon,
        });
      });
    });
  }

  private createAnimatedSlimeSet(base: string, body: number, eye: number, belly: number) {
    const directions = ["n", "ne", "e", "se", "s", "sw", "w", "nw"] as const;
    directions.forEach((direction) => {
      [0, 1].forEach((frame) => {
        this.createUnitFrame(`${base}_idle_${direction}_${frame}`, {
          family: "slime",
          direction,
          frame,
          state: "idle",
          primary: body,
          secondary: belly,
          tertiary: eye,
          accent: 0x111111,
        });
      });
      [0, 1, 2, 3].forEach((frame) => {
        this.createUnitFrame(`${base}_walk_${direction}_${frame}`, {
          family: "slime",
          direction,
          frame,
          state: "walk",
          primary: body,
          secondary: belly,
          tertiary: eye,
          accent: 0x111111,
        });
      });
      [0, 1, 2].forEach((frame) => {
        this.createUnitFrame(`${base}_attack_${direction}_${frame}`, {
          family: "slime",
          direction,
          frame,
          state: "attack",
          primary: body,
          secondary: belly,
          tertiary: eye,
          accent: 0x111111,
        });
      });
    });
  }

  private createAnimatedBeastSet(base: string, primary: number, accent: number, family: FrameFamily) {
    const directions = ["n", "ne", "e", "se", "s", "sw", "w", "nw"] as const;
    directions.forEach((direction) => {
      [0, 1].forEach((frame) => {
        this.createUnitFrame(`${base}_idle_${direction}_${frame}`, {
          family,
          direction,
          frame,
          state: "idle",
          primary,
          secondary: accent,
          tertiary: 0xffffff,
          accent: 0x1b1210,
        });
      });
      [0, 1, 2, 3].forEach((frame) => {
        this.createUnitFrame(`${base}_walk_${direction}_${frame}`, {
          family,
          direction,
          frame,
          state: "walk",
          primary,
          secondary: accent,
          tertiary: 0xffffff,
          accent: 0x1b1210,
        });
      });
      [0, 1, 2].forEach((frame) => {
        this.createUnitFrame(`${base}_attack_${direction}_${frame}`, {
          family,
          direction,
          frame,
          state: "attack",
          primary,
          secondary: accent,
          tertiary: 0xffffff,
          accent: 0x1b1210,
        });
      });
    });
  }

  private createUnitFrame(key: string, spec: FrameSpec) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const frameSize = 56;
    const dir = this.getDirectionVector(spec.direction);
    const bob = spec.state === "walk" ? [0, 2, 0, 1][spec.frame % 4] : spec.state === "attack" ? -2 + spec.frame : 0;
    const stride = spec.state === "walk" ? [-2, 2, -1, 1][spec.frame % 4] : 0;
    const swing = spec.state === "attack" ? [0, 4, 8][spec.frame % 3] : 0;
    const centerX = frameSize / 2;
    const centerY = 30 + bob;

    if (spec.family === "humanoid") {
      g.fillStyle(0x05080d, 0.22).fillEllipse(centerX, centerY + 22, 28, 10);
      g.fillStyle(spec.secondary, 1).fillTriangle(centerX - 14, centerY + 18, centerX, centerY - 10, centerX + 14, centerY + 18);
      g.fillStyle(spec.primary, 1).fillRoundedRect(centerX - 10, centerY - 4, 20, 18, 6);
      g.fillStyle(spec.primary, 0.24).fillRoundedRect(centerX - 10, centerY + 6, 20, 8, 5);
      g.fillStyle(spec.tertiary, 1).fillCircle(centerX, centerY - 14, 8);
      g.fillStyle(spec.accent, 1).fillRect(centerX - 8 + stride, centerY + 14, 4, 12).fillRect(centerX + 4 - stride, centerY + 14, 4, 12);
      g.fillStyle(spec.tertiary, 1).fillRect(centerX - 15 - dir.x * 2, centerY + 1, 4, 14).fillRect(centerX + 11 + dir.x * 2, centerY + 1, 4, 14);
      g.fillStyle(0x1a1412, 0.22).fillRect(centerX - 15 - dir.x * 2, centerY + 8, 4, 7).fillRect(centerX + 11 + dir.x * 2, centerY + 8, 4, 7);
      this.drawWeapon(g, spec.weapon ?? "none", centerX, centerY, dir, swing, spec.accent);
      g.fillStyle(0xffffff, 0.18).fillRect(centerX - 6, centerY - 1, 12, 3);
      g.fillStyle(0xffffff, 0.16).fillEllipse(centerX - 2, centerY - 15, 8, 4);
    } else if (spec.family === "slime") {
      const width = 28 + (spec.state === "walk" ? stride * 2 : 0) + (spec.state === "attack" ? swing : 0);
      const height = 20 + (spec.state === "attack" ? 4 : 0);
      g.fillStyle(0x081015, 0.2).fillEllipse(centerX, centerY + 18, width + 8, 8);
      g.fillStyle(spec.primary, 1).fillEllipse(centerX, centerY + 6, width + 16, height + 12);
      g.fillStyle(spec.secondary, 0.95).fillEllipse(centerX, centerY + 10, width, height);
      g.fillStyle(spec.primary, 0.24).fillEllipse(centerX, centerY + 13, width + 8, height * 0.7);
      g.fillStyle(spec.tertiary, 1).fillCircle(centerX - 6 + dir.x * 2, centerY + 1, 3).fillCircle(centerX + 6 + dir.x * 2, centerY + 1, 3);
      g.fillStyle(spec.accent, 1).fillCircle(centerX - 6 + dir.x * 2, centerY + 1, 1.4).fillCircle(centerX + 6 + dir.x * 2, centerY + 1, 1.4);
      g.fillStyle(0xffffff, 0.14).fillEllipse(centerX - 6, centerY - 1, 10, 4);
    } else {
      this.drawBeast(g, spec, centerX, centerY, dir, stride, swing);
    }

    g.generateTexture(key, frameSize, frameSize);
    g.destroy();
  }

  private drawWeapon(
    g: Phaser.GameObjects.Graphics,
    weapon: "blade" | "bow" | "staff" | "none",
    x: number,
    y: number,
    dir: { x: number; y: number },
    swing: number,
    accent: number,
  ) {
    if (weapon === "none") return;
    if (weapon === "blade") {
      g.fillStyle(0xdfe6eb, 1).fillRect(x + 10 + dir.x * 3, y - 2 - swing, 10, 2);
      g.fillStyle(accent, 1).fillRect(x + 8 + dir.x * 3, y - 1 - swing, 3, 4);
    } else if (weapon === "bow") {
      g.lineStyle(2, 0x7a4c1d, 1);
      g.strokeEllipse(x + 14 + dir.x * 2, y + 2, 8, 18);
      g.lineBetween(x + 14 + dir.x * 2, y - 7, x + 14 + dir.x * 2, y + 11);
    } else if (weapon === "staff") {
      g.fillStyle(0x7a4c1d, 1).fillRect(x + 12 + dir.x * 3, y - 8, 3, 22);
      g.fillStyle(0x8cc7ff, 1).fillCircle(x + 13 + dir.x * 3, y - 10, 3);
    }
  }

  private drawBeast(
    g: Phaser.GameObjects.Graphics,
    spec: FrameSpec,
    x: number,
    y: number,
    dir: { x: number; y: number },
    stride: number,
    swing: number,
  ) {
    switch (spec.family) {
      case "spider":
        g.fillStyle(0x05080d, 0.2).fillEllipse(x, y + 16, 26, 8);
        g.lineStyle(2, spec.accent, 1);
        [-12, -4, 4, 12].forEach((offset) => {
          g.lineBetween(x, y + 4, x + offset, y - 6 + stride);
          g.lineBetween(x, y + 8, x + offset, y + 18 - stride);
        });
        g.fillStyle(spec.primary, 1).fillEllipse(x, y + 6, 24, 18);
        g.fillStyle(spec.secondary, 0.4).fillEllipse(x, y + 2, 10, 6);
        break;
      case "wolf":
        g.fillStyle(0x071015, 0.2).fillEllipse(x - dir.x * 2, y + 18, 28, 8);
        g.fillStyle(spec.primary, 1).fillEllipse(x - dir.x * 3, y + 8, 28, 14);
        g.fillStyle(spec.secondary, 1).fillTriangle(x + 10 + dir.x * 4, y + 2, x + 18 + dir.x * 3, y - 2, x + 14 + dir.x * 2, y + 10);
        g.fillStyle(0xffffff, 0.18).fillEllipse(x - 4, y + 5, 10, 4);
        g.fillRect(x - 10 + stride, y + 12, 4, 10);
        g.fillRect(x + 4 - stride, y + 12, 4, 10);
        break;
      case "orc":
        g.fillStyle(0x05080d, 0.18).fillEllipse(x, y + 18, 26, 8);
        g.fillStyle(spec.primary, 1).fillRoundedRect(x - 11, y - 4, 22, 18, 6);
        g.fillStyle(spec.secondary, 1).fillEllipse(x, y + 10, 26, 16);
        g.fillStyle(spec.secondary, 1).fillCircle(x - 5 + dir.x * 2, y, 2).fillCircle(x + 5 + dir.x * 2, y, 2);
        g.fillStyle(0xe8e4cd, 1).fillRect(x - 8 + swing / 2, y + 10, 4, 3).fillRect(x + 4 + swing / 2, y + 10, 4, 3);
        g.fillStyle(0xffffff, 0.12).fillRect(x - 6, y, 12, 3);
        break;
      case "boar":
        g.fillStyle(0x07090c, 0.18).fillEllipse(x, y + 18, 28, 8);
        g.fillStyle(spec.primary, 1).fillEllipse(x - 2, y + 10, 30, 16);
        g.fillStyle(spec.secondary, 1).fillEllipse(x + 12 + dir.x * 2, y + 9, 16, 10);
        g.fillStyle(0xf3dfc5, 1).fillRect(x + 18 + dir.x * 2, y + 8, 5, 2);
        g.fillStyle(0xffffff, 0.16).fillEllipse(x + 2, y + 7, 9, 4);
        break;
      case "wisp":
        g.fillStyle(spec.primary, 0.88).fillCircle(x, y, 10 + swing / 4);
        g.fillStyle(spec.secondary, 0.5).fillCircle(x, y, 17 + swing / 3);
        g.fillStyle(spec.primary, 0.6).fillTriangle(x - 6, y + 8, x + 6, y + 8, x, y + 22);
        g.fillStyle(0xffffff, 0.3).fillCircle(x - 3, y - 3, 4);
        break;
      case "dragon":
        g.fillStyle(0x08090e, 0.2).fillEllipse(x, y + 19, 34, 10);
        g.fillStyle(spec.primary, 1).fillEllipse(x - 2, y + 8, 30, 18);
        g.fillStyle(spec.secondary, 1).fillTriangle(x - 6, y - 2, x - 16, y - 10, x - 2, y + 2);
        g.fillStyle(spec.secondary, 1).fillTriangle(x + 8, y - 2, x + 18, y - 10, x + 2, y + 2);
        g.fillStyle(0xffb08e, 1).fillTriangle(x + 12 + dir.x * 2, y + 3, x + 22 + dir.x * 3, y + 8, x + 12 + dir.x * 2, y + 12);
        g.fillStyle(0xffffff, 0.12).fillEllipse(x - 4, y + 3, 12, 4);
        break;
      case "golem":
        g.fillStyle(0x05080d, 0.18).fillEllipse(x, y + 18, 28, 8);
        g.fillStyle(spec.primary, 1).fillRoundedRect(x - 12, y - 4, 24, 18, 6);
        g.fillStyle(spec.secondary, 1).fillCircle(x - 4, y + 1, 2).fillCircle(x + 4, y + 1, 2);
        g.fillStyle(spec.primary, 1).fillRect(x - 16, y + 2, 6, 14).fillRect(x + 10, y + 2, 6, 14);
        g.fillStyle(0xffffff, 0.09).fillRoundedRect(x - 8, y - 1, 12, 5, 2);
        break;
      case "skeleton":
        g.fillStyle(0x06080b, 0.14).fillEllipse(x, y + 20, 22, 8);
        g.fillStyle(spec.primary, 1).fillCircle(x, y - 6, 8);
        g.fillStyle(spec.primary, 1).fillRoundedRect(x - 8, y + 2, 16, 15, 5);
        g.fillStyle(spec.primary, 1).fillRect(x - 11, y + 2, 3, 13).fillRect(x + 8, y + 2, 3, 13);
        g.fillStyle(spec.primary, 1).fillRect(x - 5 + stride, y + 16, 3, 11).fillRect(x + 2 - stride, y + 16, 3, 11);
        g.fillStyle(spec.secondary, 1).fillRect(x + 9 + dir.x * 2, y - 1, 9, 3);
        g.fillStyle(0x603d21, 1).fillTriangle(x + 18 + dir.x * 2, y, x + 14 + dir.x * 2, y - 4, x + 14 + dir.x * 2, y + 4);
        g.fillStyle(0x171717, 0.22).fillRect(x - 4, y + 7, 8, 2);
        break;
    }
  }

  private getDirectionVector(direction: string) {
    const map: Record<string, { x: number; y: number }> = {
      n: { x: 0, y: -1 },
      ne: { x: 1, y: -1 },
      e: { x: 1, y: 0 },
      se: { x: 1, y: 1 },
      s: { x: 0, y: 1 },
      sw: { x: -1, y: 1 },
      w: { x: -1, y: 0 },
      nw: { x: -1, y: -1 },
    };
    return map[direction] ?? map.s;
  }

  private createTileTexture(key: string, base: number, shadow: number, highlight: number) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(base, 1).fillRect(0, 0, 96, 72);
    g.fillStyle(highlight, 0.07);
    [10, 28, 48, 68, 84].forEach((x, index) => {
      g.fillRect(x, 8 + (index % 2) * 6, 2, 14 + (index % 3) * 4);
    });
    g.fillStyle(highlight, 0.11).fillEllipse(30, 18, 42, 14);
    g.fillStyle(highlight, 0.08).fillEllipse(70, 26, 28, 10);
    g.fillStyle(shadow, 0.08).fillEllipse(74, 56, 34, 12);
    g.fillStyle(shadow, 0.06).fillEllipse(18, 52, 20, 8);
    g.lineStyle(2, shadow, 0.18).strokeRoundedRect(1, 1, 94, 70, 12);
    g.lineStyle(1, highlight, 0.12).strokeRoundedRect(4, 4, 88, 64, 10);
    g.generateTexture(key, 96, 72);
    g.destroy();
  }

  private createCharacterTexture(key: string, torso: number, cloak: number, skin: number, accent: number) {
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

  private createBlobMonsterTexture(key: string, body: number, eye: number, belly: number) {
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
    g.fillStyle(0x4b2f18, 1).fillRect(28, 32, 8, 18);
    g.fillStyle(0x173a25, 1).fillEllipse(32, 24, 34, 22);
    g.fillStyle(0x295736, 0.9).fillEllipse(24, 18, 26, 20);
    g.fillStyle(0x3d704a, 0.9).fillEllipse(38, 16, 24, 18);
    g.generateTexture(key, 64, 64);
    g.destroy();
  }

  private createRockTexture(key: string) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x6d766a, 1).fillEllipse(32, 36, 28, 18);
    g.fillStyle(0xaeb7ab, 0.2).fillEllipse(26, 31, 10, 6);
    g.generateTexture(key, 64, 64);
    g.destroy();
  }

  private createFenceTexture(key: string) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x7d5d32, 1).fillRect(4, 18, 8, 18).fillRect(20, 18, 8, 18).fillRect(36, 18, 8, 18);
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
    g.generateTexture(key, 48, 64);
    g.destroy();
  }

  private createRuinTexture(key: string) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
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

type FrameFamily = "humanoid" | "slime" | "spider" | "wolf" | "orc" | "boar" | "wisp" | "dragon" | "golem" | "skeleton";

type FrameSpec = {
  family: FrameFamily;
  direction: string;
  frame: number;
  state: "idle" | "walk" | "attack";
  primary: number;
  secondary: number;
  tertiary: number;
  accent: number;
  weapon?: "blade" | "bow" | "staff" | "none";
};
