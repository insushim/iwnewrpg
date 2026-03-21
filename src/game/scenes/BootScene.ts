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
    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2 + 40, "텍스처 생성 중...", {
        fontFamily: "serif",
        fontSize: "16px",
        color: "#f6e7b0",
      })
      .setOrigin(0.5);

    this.time.delayedCall(50, () => {
      this.createSpriteTextures();
      this.scene.start("PreloadScene");
    });
  }

  private createSpriteTextures() {
    // Enhanced tile system with variations
    this.createTileTexture("tile_grass_a", 0x5da65e, 0x3a7a3a, 0x8cd88c);
    this.createTileTexture("tile_grass_a_var1", 0x58a058, 0x377637, 0x88d288);
    this.createTileTexture("tile_grass_a_var2", 0x62ac62, 0x3d7e3d, 0x90de90);

    this.createTileTexture("tile_grass_b", 0x4e9050, 0x357035, 0x7cc87c);
    this.createTileTexture("tile_grass_b_var1", 0x4a8a4c, 0x336c33, 0x78c278);
    this.createTileTexture("tile_grass_b_var2", 0x529654, 0x377437, 0x80ce80);

    this.createTileTexture("tile_meadow", 0x7aa855, 0x4e7a30, 0xb0e880);
    this.createTileTexture("tile_meadow_var1", 0x76a451, 0x4c782e, 0xace47c);
    this.createTileTexture("tile_meadow_var2", 0x7eac59, 0x507c32, 0xb4ec84);

    this.createTileTexture("tile_forest", 0x468a4e, 0x2a5e30, 0x72b870);
    this.createTileTexture("tile_forest_var1", 0x42864a, 0x285c2e, 0x6eb46c);
    this.createTileTexture("tile_forest_var2", 0x4a8e52, 0x2c6032, 0x76bc74);

    this.createTileTexture("tile_moss", 0x629070, 0x3a6040, 0x90c898);
    this.createTileTexture("tile_moss_var1", 0x5e8c6c, 0x385e3e, 0x8cc494);
    this.createTileTexture("tile_moss_var2", 0x669474, 0x3c6242, 0x94cc9c);

    this.createTileTexture("tile_dirt", 0x9a7e55, 0x6a5030, 0xccb488);
    this.createTileTexture("tile_dirt_var1", 0x967a51, 0x684e2e, 0xc8b084);
    this.createTileTexture("tile_dirt_var2", 0x9e8259, 0x6c5232, 0xd0b88c);

    this.createTileTexture("tile_path", 0xb8a270, 0x786040, 0xe0cc9a);
    this.createTileTexture("tile_path_var1", 0xb49e6c, 0x765e3e, 0xdcc896);
    this.createTileTexture("tile_path_var2", 0xbca674, 0x7a6242, 0xe4d09e);

    this.createTileTexture("tile_cobble", 0x8a9495, 0x5a6465, 0xc4ced0);
    this.createTileTexture("tile_cobble_var1", 0x869091, 0x586263, 0xc0cacc);
    this.createTileTexture("tile_cobble_var2", 0x6a7475, 0x363c3d, 0xaeb8b9);

    this.createTileTexture("tile_sand", 0xc19a6b, 0x8b6f42, 0xe6c299);
    this.createTileTexture("tile_sand_var1", 0xbd9667, 0x876b3e, 0xe2be95);
    this.createTileTexture("tile_sand_var2", 0xc59e6f, 0x8f7346, 0xeac69d);

    this.createTileTexture("tile_water", 0x2e7e9a, 0x124d63, 0x77d4e5);
    this.createTileTexture("tile_wet_stone", 0x506167, 0x243139, 0x8db5bb);
    this.createTileTexture("tile_marble", 0xc5c0b3, 0x676358, 0xf8f1dc);
    this.createTileTexture("tile_volcanic", 0x4f4746, 0x241a19, 0x88766b);
    this.createTileTexture("tile_lava", 0x9b3319, 0x3e0c07, 0xffb35a);

    // Enhanced decorations
    this.createArrowTexture("projectile_arrow");
    this.createGemTexture("loot_gem");

    // Enhanced environment props
    this.createTreeTexture("prop_tree");
    this.createTreeTexture("prop_tree_pine", 0x2d4a2f, 0x1e3220);
    this.createTreeTexture("prop_tree_oak", 0x4a6b3d, 0x32472a);
    this.createTreeTexture("prop_tree_dead", 0x5d4a3a, 0x3e3225);

    this.createRockTexture("prop_rock");
    this.createRockTexture("prop_rock_small", 0.6);
    this.createRockTexture("prop_rock_large", 1.4);

    this.createFenceTexture("prop_fence");
    this.createBannerTexture("prop_banner");
    this.createRuinTexture("prop_ruin");
    this.createCrystalTexture("prop_crystal");

    // New decorative elements
    this.createSmallDecoTexture("deco_flower", 0xffc0e0, 0xffffe0);
    this.createSmallDecoTexture("deco_mushroom", 0x8b4513, 0xffffff);
    this.createSmallDecoTexture("deco_pebble", 0x888888, 0xcccccc);
    this.createSmallDecoTexture("deco_shell", 0xffefd5, 0xffffff);
    this.createSmallDecoTexture("deco_leaf", 0x228b22, 0x90ee90);
    this.createSmallDecoTexture("deco_twig", 0x8b4513, 0xdaa520);

    // Portal effect
    this.createPortalTexture("portal_effect");

    this.createParticleTextures();
  }

  private createTileTexture(
    key: string,
    base: number,
    shadow: number,
    highlight: number,
  ) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    // Base foundation with subtle color variation
    g.fillStyle(base, 1).fillRect(0, 0, 96, 72);

    // Apply tile-specific enhancement
    switch (key) {
      case "tile_grass_a":
      case "tile_grass_b":
        this.createGrassTexture(g, base, shadow, highlight);
        break;
      case "tile_meadow":
        this.createMeadowTexture(g, base, shadow, highlight);
        break;
      case "tile_forest":
        this.createForestTexture(g, base, shadow, highlight);
        break;
      case "tile_moss":
        this.createMossTexture(g, base, shadow, highlight);
        break;
      case "tile_dirt":
        this.createDirtTexture(g, base, shadow, highlight);
        break;
      case "tile_path":
        this.createPathTexture(g, base, shadow, highlight);
        break;
      case "tile_cobble":
        this.createCobbleTexture(g, base, shadow, highlight);
        break;
      case "tile_sand":
        this.createSandTexture(g, base, shadow, highlight);
        break;
      case "tile_water":
        this.createWaterTexture(g, base, shadow, highlight);
        break;
      case "tile_wet_stone":
        this.createWetStoneTexture(g, base, shadow, highlight);
        break;
      case "tile_marble":
        this.createMarbleTexture(g, base, shadow, highlight);
        break;
      case "tile_volcanic":
        this.createVolcanicTexture(g, base, shadow, highlight);
        break;
      case "tile_lava":
        this.createLavaTexture(g, base, shadow, highlight);
        break;
    }

    g.generateTexture(key, 96, 72);
    g.destroy();
  }

  private createGrassTexture(
    g: Phaser.GameObjects.Graphics,
    base: number,
    shadow: number,
    highlight: number,
  ) {
    // Enhanced Lineage Classic-style grass base
    g.fillGradientStyle(highlight, highlight, base, shadow, 0.15);
    g.fillRect(0, 0, 96, 72);

    // Detailed grass blade patterns with multiple density layers
    for (let layer = 0; layer < 4; layer++) {
      const opacity = 0.12 - layer * 0.025;
      const bladeWidth = 1 + layer * 0.5;
      const bladeHeight = 3 + layer * 2;

      g.fillStyle(highlight, opacity);
      for (let x = 1 + layer * 2; x < 95; x += 4 + layer) {
        for (let y = 1 + layer; y < 71; y += 3 + layer) {
          const randomOffset = (Math.random() - 0.5) * 3;
          const windSway = Math.sin(x * 0.1 + y * 0.05) * 1.5;

          // Individual grass blade as small rectangle
          g.fillRect(x + randomOffset + windSway, y, bladeWidth, bladeHeight);
        }
      }
    }

    // Brown soil patches showing through grass
    const soilPatches = [
      { x: 18, y: 12, w: 8, h: 6 },
      { x: 42, y: 28, w: 12, h: 8 },
      { x: 68, y: 45, w: 10, h: 7 },
      { x: 15, y: 58, w: 14, h: 9 },
      { x: 78, y: 15, w: 6, h: 12 },
    ];

    soilPatches.forEach((patch) => {
      g.fillStyle(shadow, 0.25);
      g.fillEllipse(patch.x, patch.y, patch.w, patch.h);

      // Small dirt clumps within patch
      g.fillStyle(shadow, 0.4);
      for (let i = 0; i < 3; i++) {
        const clumpX = patch.x + (Math.random() - 0.5) * patch.w * 0.6;
        const clumpY = patch.y + (Math.random() - 0.5) * patch.h * 0.6;
        g.fillRect(clumpX, clumpY, 1, 1);
      }
    });

    // Tiny flower dots (classic RPG style)
    const flowerColors = [0xffe4e1, 0xe6e6fa, 0xffb6c1, 0xf0e68c];
    for (let i = 0; i < 8; i++) {
      const x = 8 + Math.random() * 80;
      const y = 6 + Math.random() * 60;
      const color =
        flowerColors[Math.floor(Math.random() * flowerColors.length)];

      g.fillStyle(color, 0.8);
      g.fillRect(x, y, 2, 2);
      g.fillStyle(0xffffff, 0.9);
      g.fillRect(x, y, 1, 1);
    }

    // Grass texture lines for detail
    g.lineStyle(1, highlight, 0.08);
    for (let i = 0; i < 15; i++) {
      const x = 5 + Math.random() * 86;
      const y = 5 + Math.random() * 62;
      const length = 2 + Math.random() * 4;
      const angle = (Math.random() - 0.5) * 0.8;

      g.strokeLineShape(
        new Phaser.Geom.Line(
          x,
          y,
          x + Math.cos(angle) * length,
          y + Math.sin(angle) * length,
        ),
      );
    }
  }

  private createMeadowTexture(
    g: Phaser.GameObjects.Graphics,
    base: number,
    shadow: number,
    highlight: number,
  ) {
    this.createGrassTexture(g, base, shadow, highlight);

    // Enhanced flower accents in meadow (classic pixel style)
    const flowers = [
      { x: 15, y: 18, color: 0xffe4e1, type: "daisy" },
      { x: 32, y: 12, color: 0xe6e6fa, type: "violet" },
      { x: 48, y: 25, color: 0xf0e68c, type: "buttercup" },
      { x: 65, y: 15, color: 0xffc0cb, type: "rose" },
      { x: 22, y: 38, color: 0xffe4e1, type: "daisy" },
      { x: 78, y: 35, color: 0xe6e6fa, type: "violet" },
      { x: 35, y: 48, color: 0xffa500, type: "marigold" },
      { x: 58, y: 42, color: 0xffc0cb, type: "rose" },
      { x: 18, y: 58, color: 0xf0e68c, type: "buttercup" },
      { x: 72, y: 55, color: 0xffe4e1, type: "daisy" },
    ];

    flowers.forEach((flower) => {
      if (flower.type === "daisy") {
        // White petals
        g.fillStyle(flower.color, 0.8);
        g.fillRect(flower.x - 1, flower.y, 3, 1); // Horizontal petals
        g.fillRect(flower.x, flower.y - 1, 1, 3); // Vertical petals

        // Yellow center
        g.fillStyle(0xffd700, 0.9);
        g.fillRect(flower.x, flower.y, 1, 1);
      } else if (flower.type === "violet") {
        // Purple flower
        g.fillStyle(flower.color, 0.8);
        g.fillRect(flower.x, flower.y, 2, 2);

        // Darker center
        g.fillStyle(0x9370db, 0.8);
        g.fillRect(flower.x, flower.y, 1, 1);
      } else if (flower.type === "buttercup") {
        // Yellow flower
        g.fillStyle(flower.color, 0.8);
        g.fillRect(flower.x - 1, flower.y - 1, 3, 3);

        // Bright center
        g.fillStyle(0xffff00, 0.9);
        g.fillRect(flower.x, flower.y, 1, 1);
      } else if (flower.type === "rose") {
        // Pink/red rose
        g.fillStyle(flower.color, 0.8);
        g.fillRect(flower.x, flower.y, 2, 2);

        // Dark center
        g.fillStyle(0xdc143c, 0.7);
        g.fillRect(flower.x, flower.y, 1, 1);
      } else if (flower.type === "marigold") {
        // Orange flower
        g.fillStyle(flower.color, 0.8);
        g.fillRect(flower.x - 1, flower.y, 3, 1);
        g.fillRect(flower.x, flower.y - 1, 1, 3);

        // Bright center
        g.fillStyle(0xff8c00, 0.9);
        g.fillRect(flower.x, flower.y, 1, 1);
      }

      // Tiny green stem
      g.fillStyle(base, 0.6);
      g.fillRect(flower.x, flower.y + 2, 1, 2);
    });

    // Small butterflies (optional detail)
    if (Math.random() < 0.4) {
      const butterflyX = 25 + Math.random() * 46;
      const butterflyY = 20 + Math.random() * 32;

      g.fillStyle(0xffff00, 0.7);
      g.fillRect(butterflyX, butterflyY, 2, 1);
      g.fillStyle(0xffa500, 0.6);
      g.fillRect(butterflyX, butterflyY + 1, 2, 1);
    }
  }

  private createForestTexture(
    g: Phaser.GameObjects.Graphics,
    base: number,
    shadow: number,
    highlight: number,
  ) {
    // Darker forest grass base (similar to grass but darker)
    g.fillGradientStyle(shadow, shadow, base, shadow, 0.4);
    g.fillRect(0, 0, 96, 72);

    // Darker, denser grass blades
    for (let layer = 0; layer < 3; layer++) {
      const opacity = 0.08 - layer * 0.02;
      const bladeWidth = 1;
      const bladeHeight = 2 + layer;

      g.fillStyle(base, opacity);
      for (let x = 2 + layer; x < 94; x += 3 + layer) {
        for (let y = 2 + layer; y < 70; y += 3 + layer) {
          const randomOffset = (Math.random() - 0.5) * 2;
          g.fillRect(x + randomOffset, y, bladeWidth, bladeHeight);
        }
      }
    }

    // Fallen leaf dots (orange/brown autumn colors)
    const leafColors = [0xd2691e, 0xcd853f, 0xa0522d, 0x8b4513, 0xff8c00];
    for (let i = 0; i < 25; i++) {
      const x = 3 + Math.random() * 90;
      const y = 3 + Math.random() * 66;
      const color = leafColors[Math.floor(Math.random() * leafColors.length)];

      g.fillStyle(color, 0.6 + Math.random() * 0.3);
      g.fillRect(x, y, 2, 2);

      // Small leaf detail
      g.fillStyle(color, 0.4);
      g.fillRect(x + 1, y + 1, 1, 1);
    }

    // Dense vegetation clumps
    for (let i = 0; i < 12; i++) {
      const clumpX = 8 + Math.random() * 80;
      const clumpY = 6 + Math.random() * 60;

      g.fillStyle(shadow, 0.3);
      g.fillEllipse(clumpX, clumpY, 6, 4);

      // Small vegetation details within clump
      g.fillStyle(highlight, 0.15);
      for (let j = 0; j < 4; j++) {
        const detailX = clumpX + (Math.random() - 0.5) * 4;
        const detailY = clumpY + (Math.random() - 0.5) * 3;
        g.fillRect(detailX, detailY, 1, 2);
      }
    }

    // Mushroom spots (tiny brown dots)
    for (let i = 0; i < 6; i++) {
      const x = 10 + Math.random() * 76;
      const y = 8 + Math.random() * 56;

      g.fillStyle(0x8b4513, 0.8);
      g.fillRect(x, y, 2, 1);
      g.fillStyle(0xf5deb3, 0.7);
      g.fillRect(x, y - 1, 2, 1);
    }

    // Root and branch patterns
    g.lineStyle(1, shadow, 0.2);
    for (let i = 0; i < 8; i++) {
      const startX = Math.random() * 96;
      const startY = Math.random() * 72;
      const length = 8 + Math.random() * 15;
      const angle = Math.random() * Math.PI * 2;

      g.strokeLineShape(
        new Phaser.Geom.Line(
          startX,
          startY,
          startX + Math.cos(angle) * length,
          startY + Math.sin(angle) * length,
        ),
      );
    }
  }

  private createMossTexture(
    g: Phaser.GameObjects.Graphics,
    base: number,
    shadow: number,
    highlight: number,
  ) {
    // Thick moss base
    g.fillGradientStyle(base, highlight, shadow, base, 0.2);
    g.fillRect(0, 0, 96, 72);

    // Organic moss clusters
    for (let cluster = 0; cluster < 8; cluster++) {
      const centerX = 12 + cluster * 12;
      const centerY = 12 + (cluster % 3) * 24;

      for (let blob = 0; blob < 6; blob++) {
        const blobX = centerX + (Math.random() - 0.5) * 20;
        const blobY = centerY + (Math.random() - 0.5) * 15;
        const size = 3 + Math.random() * 4;

        g.fillStyle(highlight, 0.1 + Math.random() * 0.08);
        g.fillEllipse(blobX, blobY, size, size * 0.8);
      }
    }

    // Moss tendrils and texture
    for (let i = 0; i < 25; i++) {
      const x = Math.random() * 96;
      const y = Math.random() * 72;
      const length = 4 + Math.random() * 8;
      const angle = Math.random() * Math.PI * 2;

      g.lineStyle(1, highlight, 0.06);
      g.strokeLineShape(
        new Phaser.Geom.Line(
          x,
          y,
          x + Math.cos(angle) * length,
          y + Math.sin(angle) * length,
        ),
      );
    }
  }

  private createDirtTexture(
    g: Phaser.GameObjects.Graphics,
    base: number,
    shadow: number,
    highlight: number,
  ) {
    // Rich brown earth base with natural variation
    g.fillGradientStyle(base, base, shadow, highlight, 0.2);
    g.fillRect(0, 0, 96, 72);

    // Footprint/hoof print tracks
    const trackPatterns = [
      { x: 15, y: 12, w: 8, h: 6 },
      { x: 35, y: 25, w: 7, h: 5 },
      { x: 55, y: 18, w: 9, h: 7 },
      { x: 25, y: 45, w: 8, h: 6 },
      { x: 70, y: 42, w: 6, h: 5 },
      { x: 45, y: 58, w: 7, h: 6 },
    ];

    trackPatterns.forEach((track) => {
      g.fillStyle(shadow, 0.4);
      g.fillEllipse(track.x, track.y, track.w, track.h);

      // Track detail (heel mark)
      g.fillStyle(shadow, 0.6);
      g.fillEllipse(track.x - 1, track.y + 1, track.w * 0.3, track.h * 0.4);
    });

    // Small stone details scattered around
    for (let i = 0; i < 40; i++) {
      const x = 2 + Math.random() * 92;
      const y = 2 + Math.random() * 68;
      const size = 1 + Math.random() * 2;
      const brightness = Math.random() > 0.4 ? highlight : shadow;

      g.fillStyle(brightness, 0.4 + Math.random() * 0.3);
      g.fillRect(x, y, size, size);

      // Small shadow for 3D effect
      if (brightness === highlight) {
        g.fillStyle(shadow, 0.3);
        g.fillRect(x + 1, y + 1, size * 0.5, size * 0.5);
      }
    }

    // Wheel ruts and erosion lines
    for (let i = 0; i < 5; i++) {
      const startX = 5 + Math.random() * 10;
      const startY = 10 + i * 12;
      const length = 60 + Math.random() * 25;

      g.lineStyle(2, shadow, 0.15);
      g.strokeLineShape(
        new Phaser.Geom.Line(
          startX,
          startY,
          startX + length,
          startY + (Math.random() - 0.5) * 8,
        ),
      );
    }

    // Cracked earth texture
    for (let x = 4; x < 92; x += 6) {
      for (let y = 4; y < 68; y += 5) {
        if (Math.random() < 0.4) {
          const crackLength = 3 + Math.random() * 4;
          const angle = Math.random() * Math.PI;

          g.lineStyle(1, shadow, 0.2);
          g.strokeLineShape(
            new Phaser.Geom.Line(
              x,
              y,
              x + Math.cos(angle) * crackLength,
              y + Math.sin(angle) * crackLength,
            ),
          );
        }
      }
    }

    // Dust/loose dirt particles
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 96;
      const y = Math.random() * 72;

      g.fillStyle(highlight, 0.1 + Math.random() * 0.1);
      g.fillRect(x, y, 1, 1);
    }
  }

  private createPathTexture(
    g: Phaser.GameObjects.Graphics,
    base: number,
    shadow: number,
    highlight: number,
  ) {
    // Stone path base
    g.fillGradientStyle(base, highlight, shadow, base, 0.2);
    g.fillRect(0, 0, 96, 72);

    // Individual stone patterns
    const stonePatterns = [
      { x: 8, y: 8, w: 18, h: 14 },
      { x: 30, y: 6, w: 22, h: 16 },
      { x: 58, y: 10, w: 20, h: 12 },
      { x: 6, y: 28, w: 24, h: 18 },
      { x: 34, y: 30, w: 16, h: 20 },
      { x: 56, y: 32, w: 26, h: 14 },
      { x: 10, y: 52, w: 20, h: 16 },
      { x: 36, y: 54, w: 18, h: 14 },
      { x: 60, y: 50, w: 22, h: 18 },
    ];

    stonePatterns.forEach((stone) => {
      // Stone base
      g.fillStyle(base, 0.8);
      g.fillRoundedRect(stone.x, stone.y, stone.w, stone.h, 2);

      // Stone highlight edge
      g.lineStyle(1, highlight, 0.4);
      g.strokeRoundedRect(stone.x, stone.y, stone.w, stone.h, 2);

      // Stone texture
      g.fillStyle(shadow, 0.1);
      g.fillRect(stone.x + 2, stone.y + 2, stone.w - 4, stone.h - 4);
    });

    // Mortar/gaps between stones
    g.lineStyle(2, shadow, 0.3);
    stonePatterns.forEach((stone, i) => {
      if (i < stonePatterns.length - 1) {
        const nextStone = stonePatterns[i + 1];
        if (Math.abs(stone.x - nextStone.x) < 30) {
          g.strokeLineShape(
            new Phaser.Geom.Line(
              stone.x + stone.w,
              stone.y + stone.h / 2,
              nextStone.x,
              nextStone.y + nextStone.h / 2,
            ),
          );
        }
      }
    });
  }

  private createCobbleTexture(
    g: Phaser.GameObjects.Graphics,
    base: number,
    shadow: number,
    highlight: number,
  ) {
    // Dark mortar base (classic cobblestone look)
    g.fillStyle(shadow, 1).fillRect(0, 0, 96, 72);

    // Individual cobblestones with irregular sizes and placement
    const stones = [
      { x: 2, y: 2, w: 12, h: 10 },
      { x: 16, y: 3, w: 11, h: 12 },
      { x: 29, y: 1, w: 13, h: 11 },
      { x: 44, y: 2, w: 10, h: 13 },
      { x: 56, y: 1, w: 14, h: 10 },
      { x: 72, y: 3, w: 12, h: 11 },
      { x: 86, y: 2, w: 8, h: 12 },

      { x: 1, y: 15, w: 14, h: 12 },
      { x: 17, y: 17, w: 12, h: 10 },
      { x: 31, y: 16, w: 11, h: 13 },
      { x: 44, y: 17, w: 13, h: 11 },
      { x: 59, y: 15, w: 10, h: 12 },
      { x: 71, y: 16, w: 12, h: 13 },
      { x: 85, y: 17, w: 9, h: 10 },

      { x: 2, y: 30, w: 13, h: 11 },
      { x: 17, y: 32, w: 10, h: 12 },
      { x: 29, y: 31, w: 12, h: 10 },
      { x: 43, y: 32, w: 14, h: 13 },
      { x: 59, y: 30, w: 11, h: 11 },
      { x: 72, y: 31, w: 13, h: 12 },
      { x: 87, y: 32, w: 8, h: 10 },

      { x: 1, y: 45, w: 12, h: 13 },
      { x: 15, y: 47, w: 13, h: 10 },
      { x: 30, y: 46, w: 11, h: 12 },
      { x: 43, y: 47, w: 12, h: 11 },
      { x: 57, y: 45, w: 14, h: 13 },
      { x: 73, y: 46, w: 10, h: 12 },
      { x: 85, y: 47, w: 9, h: 11 },

      { x: 2, y: 60, w: 11, h: 10 },
      { x: 15, y: 62, w: 12, h: 9 },
      { x: 29, y: 61, w: 14, h: 10 },
      { x: 45, y: 62, w: 10, h: 9 },
      { x: 57, y: 60, w: 13, h: 11 },
      { x: 72, y: 61, w: 12, h: 10 },
      { x: 86, y: 62, w: 8, h: 9 },
    ];

    stones.forEach((stone, index) => {
      // Slight random variation in stone color
      const stoneVariation = (index * 17) % 3; // Deterministic but varied
      let stoneBase = base;
      if (stoneVariation === 1) stoneBase = highlight;
      else if (stoneVariation === 2) stoneBase = (base + shadow) / 2;

      // Main stone body
      g.fillStyle(stoneBase, 1);
      g.fillRect(stone.x, stone.y, stone.w, stone.h);

      // Top/left highlight (isometric lighting)
      g.fillStyle(highlight, 0.6);
      g.fillRect(stone.x, stone.y, stone.w, 1); // Top edge
      g.fillRect(stone.x, stone.y, 1, stone.h); // Left edge

      // Bottom/right shadow (isometric lighting)
      g.fillStyle(shadow, 0.8);
      g.fillRect(stone.x, stone.y + stone.h - 1, stone.w, 1); // Bottom edge
      g.fillRect(stone.x + stone.w - 1, stone.y, 1, stone.h); // Right edge

      // Stone texture and weathering
      g.fillStyle(shadow, 0.15);
      for (let i = 0; i < 3; i++) {
        const textureX = stone.x + 2 + i * 3;
        const textureY = stone.y + 2 + i * 2;
        if (
          textureX < stone.x + stone.w - 2 &&
          textureY < stone.y + stone.h - 2
        ) {
          g.fillRect(textureX, textureY, 1, 1);
        }
      }

      // Cracks in some stones
      if (index % 4 === 0) {
        g.lineStyle(1, shadow, 0.4);
        g.strokeLineShape(
          new Phaser.Geom.Line(
            stone.x + 2,
            stone.y + 3,
            stone.x + stone.w - 3,
            stone.y + stone.h - 4,
          ),
        );
      }

      // Worn smooth areas on frequently stepped stones
      if (index % 3 === 0) {
        g.fillStyle(highlight, 0.2);
        g.fillEllipse(
          stone.x + stone.w / 2,
          stone.y + stone.h / 2,
          stone.w * 0.4,
          stone.h * 0.4,
        );
      }
    });

    // Moss in mortar joints (classic detail)
    g.fillStyle(0x4a6b3a, 0.3);
    for (let i = 0; i < 15; i++) {
      const x = 1 + Math.random() * 94;
      const y = 1 + Math.random() * 70;

      // Only draw moss in mortar areas (darker pixels)
      g.fillRect(x, y, 1, 1);
    }
  }

  private createSandTexture(
    g: Phaser.GameObjects.Graphics,
    base: number,
    shadow: number,
    highlight: number,
  ) {
    // Warm golden sand base
    g.fillGradientStyle(highlight, base, shadow, base, 0.9);
    g.fillRect(0, 0, 96, 72);

    // Sand grain texture (fine detail)
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * 96;
      const y = Math.random() * 72;
      const brightness = Math.random() > 0.5 ? highlight : shadow;
      const opacity = 0.1 + Math.random() * 0.2;

      g.fillStyle(brightness, opacity);
      g.fillRect(x, y, 1, 1);
    }

    // Wave patterns (subtle ridges in sand)
    for (let y = 10; y < 72; y += 15) {
      const waveY = y + Math.sin(y * 0.3) * 3;

      g.lineStyle(1, shadow, 0.15);
      g.strokeLineShape(new Phaser.Geom.Line(0, waveY, 96, waveY + 2));

      g.lineStyle(1, highlight, 0.1);
      g.strokeLineShape(new Phaser.Geom.Line(0, waveY + 1, 96, waveY + 3));
    }

    // Small pebble dots scattered in sand
    for (let i = 0; i < 25; i++) {
      const x = 3 + Math.random() * 90;
      const y = 3 + Math.random() * 66;
      const size = Math.random() * 2;

      // Pebble colors (darker than sand)
      const pebbleColors = [shadow, (shadow + base) / 2, 0x8b7355, 0x967a5a];
      const color =
        pebbleColors[Math.floor(Math.random() * pebbleColors.length)];

      g.fillStyle(color, 0.6 + Math.random() * 0.3);
      g.fillCircle(x, y, size);

      // Tiny highlight on pebble
      g.fillStyle(highlight, 0.4);
      g.fillRect(x - 0.5, y - 0.5, 1, 1);
    }

    // Darker border edges (where sand meets other terrain)
    g.fillStyle(shadow, 0.2);
    g.fillRect(0, 0, 96, 2); // Top edge
    g.fillRect(0, 70, 96, 2); // Bottom edge
    g.fillRect(0, 0, 2, 72); // Left edge
    g.fillRect(94, 0, 2, 72); // Right edge

    // Wind-blown sand patterns (diagonal streaks)
    g.lineStyle(1, highlight, 0.08);
    for (let i = 0; i < 8; i++) {
      const startX = Math.random() * 96;
      const startY = Math.random() * 72;
      const length = 8 + Math.random() * 15;
      const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.5; // Mostly 45-degree angle

      g.strokeLineShape(
        new Phaser.Geom.Line(
          startX,
          startY,
          startX + Math.cos(angle) * length,
          startY + Math.sin(angle) * length,
        ),
      );
    }

    // Occasional larger stones partially buried
    if (Math.random() < 0.3) {
      const stoneX = 20 + Math.random() * 56;
      const stoneY = 15 + Math.random() * 42;

      g.fillStyle(shadow, 0.7);
      g.fillEllipse(stoneX, stoneY, 6, 4);

      g.fillStyle(highlight, 0.3);
      g.fillEllipse(stoneX - 1, stoneY - 1, 3, 2);
    }
  }

  private createWaterTexture(
    g: Phaser.GameObjects.Graphics,
    base: number,
    shadow: number,
    highlight: number,
  ) {
    // Deep blue water base with classic RPG depth
    g.fillGradientStyle(shadow, shadow, base, highlight, 0.9);
    g.fillRect(0, 0, 96, 72);

    // Wave patterns (horizontal bands)
    for (let y = 8; y < 72; y += 12) {
      const waveIntensity = 0.15 + Math.sin(y * 0.2) * 0.05;

      g.fillStyle(highlight, waveIntensity);
      g.fillRect(0, y, 96, 2);

      g.fillStyle(base, waveIntensity * 0.8);
      g.fillRect(0, y + 2, 96, 1);

      g.fillStyle(shadow, waveIntensity * 0.6);
      g.fillRect(0, y + 3, 96, 1);
    }

    // Shimmer reflection streaks (vertical)
    for (let x = 12; x < 96; x += 16) {
      const shimmerHeight = 15 + Math.random() * 20;
      const shimmerY = Math.random() * (72 - shimmerHeight);

      g.fillStyle(highlight, 0.3 + Math.random() * 0.2);
      g.fillRect(x, shimmerY, 1, shimmerHeight);

      g.fillStyle(highlight, 0.15);
      g.fillRect(x + 1, shimmerY + 2, 1, shimmerHeight - 4);
    }

    // Water edge foam/bubbles where water meets land
    const foamAreas = [
      { x: 2, y: 5, w: 12, h: 4 },
      { x: 18, y: 2, w: 8, h: 3 },
      { x: 85, y: 8, w: 9, h: 5 },
      { x: 3, y: 65, w: 15, h: 6 },
      { x: 82, y: 62, w: 11, h: 8 },
    ];

    foamAreas.forEach((foam) => {
      g.fillStyle(highlight, 0.4);
      g.fillEllipse(foam.x, foam.y, foam.w, foam.h);

      // Small bubble details
      g.fillStyle(highlight, 0.8);
      for (let i = 0; i < 3; i++) {
        const bubbleX = foam.x + Math.random() * foam.w;
        const bubbleY = foam.y + Math.random() * foam.h;
        g.fillCircle(bubbleX, bubbleY, 1);
      }
    });

    // Depth variation spots (darker areas)
    for (let i = 0; i < 8; i++) {
      const x = 15 + Math.random() * 66;
      const y = 15 + Math.random() * 42;
      const size = 6 + Math.random() * 10;

      g.fillStyle(shadow, 0.3);
      g.fillEllipse(x, y, size, size * 0.7);
    }

    // Light caustics (underwater light patterns)
    const causticPatterns = [
      { x: 25, y: 20, size: 8 },
      { x: 50, y: 35, size: 12 },
      { x: 70, y: 25, size: 6 },
      { x: 30, y: 50, size: 10 },
    ];

    causticPatterns.forEach((caustic) => {
      // Wavy caustic light
      g.lineStyle(1, highlight, 0.4);
      const points = [];
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
        const distance = caustic.size + Math.sin(angle * 3) * 2;
        const x = caustic.x + Math.cos(angle) * distance;
        const y = caustic.y + Math.sin(angle) * distance;
        points.push(new Phaser.Geom.Point(x, y));
      }

      for (let i = 0; i < points.length; i++) {
        const next = points[(i + 1) % points.length];
        g.strokeLineShape(
          new Phaser.Geom.Line(points[i].x, points[i].y, next.x, next.y),
        );
      }

      g.fillStyle(highlight, 0.2);
      g.fillCircle(caustic.x, caustic.y, caustic.size * 0.3);
    });
  }

  private createWetStoneTexture(
    g: Phaser.GameObjects.Graphics,
    base: number,
    shadow: number,
    highlight: number,
  ) {
    // Stone base texture
    g.fillGradientStyle(base, base, shadow, highlight, 0.3);
    g.fillRect(0, 0, 96, 72);

    // Stone blocks and joints
    const stoneBlocks = [
      { x: 0, y: 0, w: 32, h: 24 },
      { x: 32, y: 0, w: 30, h: 20 },
      { x: 62, y: 0, w: 34, h: 26 },
      { x: 0, y: 24, w: 28, h: 22 },
      { x: 28, y: 20, w: 35, h: 24 },
      { x: 63, y: 26, w: 33, h: 20 },
      { x: 0, y: 46, w: 31, h: 26 },
      { x: 31, y: 44, w: 32, h: 28 },
      { x: 63, y: 46, w: 33, h: 26 },
    ];

    stoneBlocks.forEach((block) => {
      // Block base
      g.fillStyle(base, 0.9);
      g.fillRect(block.x, block.y, block.w, block.h);

      // Wet sheen effect
      g.fillGradientStyle(highlight, highlight, base, shadow, 0.4);
      g.fillRect(block.x, block.y, block.w, block.h);

      // Water pooling in corners
      g.fillStyle(shadow, 0.6);
      g.fillRect(block.x, block.y + block.h - 3, block.w, 3);

      // Reflection highlights
      g.fillStyle(highlight, 0.5);
      g.fillRect(block.x + 2, block.y + 2, block.w - 4, 3);
    });

    // Water droplets and moisture
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * 96;
      const y = Math.random() * 72;

      g.fillStyle(highlight, 0.7);
      g.fillCircle(x, y, 1 + Math.random() * 2);
    }
  }

  private createMarbleTexture(
    g: Phaser.GameObjects.Graphics,
    base: number,
    shadow: number,
    highlight: number,
  ) {
    // Marble base with subtle color variation
    g.fillGradientStyle(highlight, base, base, shadow, 0.2);
    g.fillRect(0, 0, 96, 72);

    // Marble veining patterns
    const veinPaths = [
      [
        { x: 0, y: 20 },
        { x: 25, y: 18 },
        { x: 50, y: 25 },
        { x: 75, y: 22 },
        { x: 96, y: 28 },
      ],
      [
        { x: 10, y: 45 },
        { x: 30, y: 40 },
        { x: 55, y: 48 },
        { x: 80, y: 45 },
        { x: 96, y: 50 },
      ],
      [
        { x: 0, y: 65 },
        { x: 20, y: 60 },
        { x: 45, y: 65 },
        { x: 70, y: 62 },
        { x: 96, y: 68 },
      ],
    ];

    veinPaths.forEach((path, pathIndex) => {
      const veinColor = pathIndex % 2 === 0 ? shadow : highlight;

      // Main vein
      g.lineStyle(2, veinColor, 0.4);
      for (let i = 0; i < path.length - 1; i++) {
        g.strokeLineShape(
          new Phaser.Geom.Line(
            path[i].x,
            path[i].y,
            path[i + 1].x,
            path[i + 1].y,
          ),
        );
      }

      // Secondary veining
      path.forEach((point, i) => {
        if (i % 2 === 0) {
          g.lineStyle(1, veinColor, 0.2);
          const branchLength = 8 + Math.random() * 12;
          const angle = (Math.random() - 0.5) * Math.PI;
          g.strokeLineShape(
            new Phaser.Geom.Line(
              point.x,
              point.y,
              point.x + Math.cos(angle) * branchLength,
              point.y + Math.sin(angle) * branchLength,
            ),
          );
        }
      });
    });

    // Polished surface highlights
    g.fillStyle(highlight, 0.3);
    g.fillEllipse(30, 25, 20, 8);
    g.fillEllipse(65, 50, 15, 6);

    // Subtle crystalline structure
    for (let i = 0; i < 8; i++) {
      const x = 10 + i * 12;
      const y = 10 + (i % 3) * 20;
      g.fillStyle(highlight, 0.1);
      g.fillRect(x, y, 3, 3);
    }
  }

  private createVolcanicTexture(
    g: Phaser.GameObjects.Graphics,
    base: number,
    shadow: number,
    highlight: number,
  ) {
    // Dark volcanic rock base
    g.fillStyle(shadow, 1).fillRect(0, 0, 96, 72);
    g.fillGradientStyle(base, shadow, base, shadow, 0.6);
    g.fillRect(0, 0, 96, 72);

    // Volcanic cracks with ember glow
    const crackPatterns = [
      [
        { x: 10, y: 10 },
        { x: 25, y: 25 },
        { x: 40, y: 20 },
        { x: 55, y: 35 },
        { x: 70, y: 30 },
      ],
      [
        { x: 15, y: 50 },
        { x: 30, y: 45 },
        { x: 50, y: 55 },
        { x: 75, y: 50 },
      ],
      [
        { x: 20, y: 70 },
        { x: 35, y: 65 },
        { x: 55, y: 72 },
      ],
    ];

    crackPatterns.forEach((crack) => {
      // Bright ember core
      g.lineStyle(3, 0xff6b35, 0.8);
      for (let i = 0; i < crack.length - 1; i++) {
        g.strokeLineShape(
          new Phaser.Geom.Line(
            crack[i].x,
            crack[i].y,
            crack[i + 1].x,
            crack[i + 1].y,
          ),
        );
      }

      // Glowing edge
      g.lineStyle(5, highlight, 0.3);
      for (let i = 0; i < crack.length - 1; i++) {
        g.strokeLineShape(
          new Phaser.Geom.Line(
            crack[i].x,
            crack[i].y,
            crack[i + 1].x,
            crack[i + 1].y,
          ),
        );
      }

      // Heat distortion points
      crack.forEach((point) => {
        g.fillStyle(0xff8c42, 0.6);
        g.fillCircle(point.x, point.y, 3);
        g.fillStyle(0xffd662, 0.8);
        g.fillCircle(point.x, point.y, 1);
      });
    });

    // Rough volcanic texture
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * 96;
      const y = Math.random() * 72;
      const size = 2 + Math.random() * 4;

      g.fillStyle(base, 0.6 + Math.random() * 0.4);
      g.fillEllipse(x, y, size, size * 0.7);
    }

    // Cooled lava patches
    for (let i = 0; i < 6; i++) {
      const x = 15 + i * 15;
      const y = 15 + (i % 3) * 20;

      g.fillStyle(highlight, 0.4);
      g.fillEllipse(x, y, 8, 12);
      g.fillStyle(0x333333, 0.7);
      g.fillEllipse(x, y, 6, 8);
    }
  }

  private createLavaTexture(
    g: Phaser.GameObjects.Graphics,
    base: number,
    shadow: number,
    highlight: number,
  ) {
    // Molten lava base with intense heat
    g.fillGradientStyle(0xff4500, 0xdc143c, 0xff6347, 0xff8c00, 1);
    g.fillRect(0, 0, 96, 72);

    // Flowing lava streams
    const lavaFlows = [
      [
        { x: 0, y: 20 },
        { x: 30, y: 25 },
        { x: 60, y: 18 },
        { x: 96, y: 22 },
      ],
      [
        { x: 15, y: 45 },
        { x: 45, y: 40 },
        { x: 75, y: 48 },
      ],
      [
        { x: 5, y: 65 },
        { x: 35, y: 60 },
        { x: 70, y: 65 },
        { x: 96, y: 62 },
      ],
    ];

    lavaFlows.forEach((flow, flowIndex) => {
      const intensity = 0.8 + flowIndex * 0.1;

      // Bright molten core
      g.lineStyle(6, 0xffff00, intensity);
      for (let i = 0; i < flow.length - 1; i++) {
        g.strokeLineShape(
          new Phaser.Geom.Line(
            flow[i].x,
            flow[i].y,
            flow[i + 1].x,
            flow[i + 1].y,
          ),
        );
      }

      // Orange outer flow
      g.lineStyle(10, 0xff6500, intensity * 0.7);
      for (let i = 0; i < flow.length - 1; i++) {
        g.strokeLineShape(
          new Phaser.Geom.Line(
            flow[i].x,
            flow[i].y,
            flow[i + 1].x,
            flow[i + 1].y,
          ),
        );
      }

      // Dark cooled edges
      g.lineStyle(14, 0x8b0000, intensity * 0.4);
      for (let i = 0; i < flow.length - 1; i++) {
        g.strokeLineShape(
          new Phaser.Geom.Line(
            flow[i].x,
            flow[i].y,
            flow[i + 1].x,
            flow[i + 1].y,
          ),
        );
      }
    });

    // Bubbling lava pockets
    const bubbles = [
      { x: 25, y: 35, r: 5 },
      { x: 55, y: 25, r: 7 },
      { x: 40, y: 55, r: 4 },
      { x: 75, y: 40, r: 6 },
      { x: 20, y: 60, r: 3 },
    ];

    bubbles.forEach((bubble) => {
      // Bubble highlight
      g.fillStyle(0xffff88, 0.9);
      g.fillCircle(bubble.x, bubble.y, bubble.r);

      // Bubble core
      g.fillStyle(0xffffff, 0.7);
      g.fillCircle(bubble.x, bubble.y, bubble.r * 0.6);

      // Heat shimmer
      g.fillStyle(0xff9999, 0.3);
      g.fillCircle(bubble.x, bubble.y, bubble.r * 1.5);
    });

    // Ember particles
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 96;
      const y = Math.random() * 72;
      const brightness = Math.random();

      if (brightness > 0.7) {
        g.fillStyle(0xffff00, brightness);
        g.fillCircle(x, y, 1);
      } else if (brightness > 0.4) {
        g.fillStyle(0xff8800, brightness);
        g.fillCircle(x, y, 1);
      } else {
        g.fillStyle(0xff4400, brightness);
        g.fillCircle(x, y, 1);
      }
    }
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

    // Enhanced cloak with folds and shading
    g.fillGradientStyle(cloak, cloak * 0.7, cloak * 0.5, cloak, 1);
    g.fillTriangle(16, 48, 32, 16, 48, 48);

    // Cloak highlights and shadows
    g.fillStyle(cloak * 1.2, 0.3);
    g.fillTriangle(20, 45, 32, 20, 35, 45);
    g.fillStyle(cloak * 0.6, 0.4);
    g.fillTriangle(35, 45, 32, 20, 44, 45);

    // Detailed torso with armor plating
    g.fillGradientStyle(torso, torso * 1.1, torso * 0.8, torso, 1);
    g.fillRoundedRect(20, 18, 24, 24, 8);

    // Armor details
    g.fillStyle(accent, 0.8);
    g.fillRect(22, 20, 20, 2); // Chest plate
    g.fillRect(24, 24, 16, 1); // Detail line
    g.fillRect(26, 26, 12, 1); // Detail line

    // Enhanced legs with armor
    g.fillGradientStyle(accent, accent * 1.1, accent * 0.8, accent, 1);
    g.fillRect(23, 44, 6, 12);
    g.fillRect(35, 44, 6, 12);

    // Leg armor details
    g.fillStyle(accent * 1.3, 0.6);
    g.fillRect(24, 45, 4, 2);
    g.fillRect(36, 45, 4, 2);

    // Enhanced head with facial features
    g.fillGradientStyle(skin, skin * 1.2, skin * 0.9, skin, 1);
    g.fillCircle(32, 12, 9);

    // Facial features
    g.fillStyle(skin * 0.7, 0.6);
    g.fillEllipse(29, 11, 2, 1); // Eye
    g.fillEllipse(35, 11, 2, 1); // Eye
    g.fillStyle(skin * 0.8, 0.4);
    g.fillEllipse(32, 14, 1, 0.5); // Nose

    // Enhanced chest detail with depth
    g.fillGradientStyle(0xffffff, 0xcccccc, 0x888888, 0xffffff, 0.4);
    g.fillRect(24, 22, 16, 4);

    // Armor outline and definition
    g.lineStyle(1, accent * 0.7, 0.6);
    g.strokeRoundedRect(20, 18, 24, 24, 8);

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

    // Enhanced blob with volumetric shading
    g.fillGradientStyle(body * 0.6, body, body * 1.2, body * 0.8, 1);
    g.fillEllipse(32, 34, 42, 28);

    // Gelatinous highlights
    g.fillStyle(body * 1.5, 0.3);
    g.fillEllipse(28, 30, 15, 8);
    g.fillStyle(body * 1.8, 0.2);
    g.fillEllipse(26, 28, 8, 4);

    // Enhanced belly with depth
    g.fillGradientStyle(belly, belly * 1.1, belly * 0.7, belly, 0.9);
    g.fillEllipse(32, 39, 24, 14);

    // More detailed eyes with depth
    g.fillStyle(eye, 1);
    g.fillEllipse(24, 30, 6, 5);
    g.fillEllipse(40, 30, 6, 5);

    // Eye highlights
    g.fillStyle(eye * 1.3, 0.8);
    g.fillEllipse(24, 29, 4, 3);
    g.fillEllipse(40, 29, 4, 3);

    // Pupils with reflection
    g.fillStyle(0x151515, 1);
    g.fillCircle(24, 30, 2);
    g.fillCircle(40, 30, 2);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(23, 29, 0.8);
    g.fillCircle(39, 29, 0.8);

    // Blob texture and slime effects
    for (let i = 0; i < 8; i++) {
      const x = 20 + Math.random() * 24;
      const y = 28 + Math.random() * 12;
      g.fillStyle(body * 1.4, 0.1 + Math.random() * 0.1);
      g.fillCircle(x, y, 1 + Math.random() * 2);
    }

    g.generateTexture(key, 64, 64);
    g.destroy();
  }

  private createSpiderTexture(key: string) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    // Enhanced spider legs with segments
    const legColor = 0x172012;
    const legHighlight = 0x2d3420;

    g.lineStyle(4, legColor * 0.8, 1);
    [14, 22, 42, 50].forEach((x) => {
      // Upper legs with joints
      g.beginPath();
      g.moveTo(32, 30);
      g.lineTo(x, 20);
      g.lineTo(x - 6, 10);
      g.strokePath();

      // Leg segments
      g.lineStyle(2, legHighlight, 0.8);
      g.strokeCircle(x - 2, 16, 2);

      g.lineStyle(4, legColor * 0.8, 1);
      // Lower legs with joints
      g.beginPath();
      g.moveTo(32, 34);
      g.lineTo(x, 44);
      g.lineTo(x - 6, 54);
      g.strokePath();

      // Lower leg segments
      g.lineStyle(2, legHighlight, 0.8);
      g.strokeCircle(x - 2, 48, 2);
    });

    // Enhanced spider body with pattern
    g.fillGradientStyle(0x46654b, 0x5a7a5f, 0x364539, 0x46654b, 1);
    g.fillEllipse(32, 32, 26, 22);

    // Spider markings
    g.fillStyle(0xa7d39f, 0.6);
    g.fillEllipse(32, 29, 10, 6);

    // Additional body pattern
    g.fillStyle(0x2d3d32, 0.7);
    g.fillEllipse(28, 32, 6, 8);
    g.fillEllipse(36, 32, 6, 8);

    // Cephalothorax definition
    g.fillStyle(0x5a7a5f, 0.8);
    g.fillEllipse(32, 28, 14, 10);

    // Multiple eyes
    g.fillStyle(0x000000, 1);
    g.fillCircle(30, 27, 1.5);
    g.fillCircle(34, 27, 1.5);
    g.fillCircle(28, 29, 1);
    g.fillCircle(36, 29, 1);
    g.fillStyle(0x666666, 0.8);
    g.fillCircle(30, 26.5, 0.8);
    g.fillCircle(34, 26.5, 0.8);

    g.generateTexture(key, 64, 64);
    g.destroy();
  }

  private createWolfTexture(key: string) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    // Enhanced wolf body with fur texture
    g.fillGradientStyle(0x8b8f96, 0xa5a9b0, 0x707479, 0x8b8f96, 1);
    g.fillEllipse(30, 34, 34, 18);

    // Fur pattern details
    for (let i = 0; i < 12; i++) {
      const x = 15 + i * 3;
      const y = 28 + (i % 3) * 3;
      g.fillStyle(0xa5a9b0, 0.4);
      g.fillEllipse(x, y, 2, 4);
    }

    // Enhanced legs with paws
    g.fillGradientStyle(0x7a8087, 0x8b8f96, 0x696d74, 0x7a8087, 1);
    g.fillRect(18, 38, 4, 12);
    g.fillRect(36, 38, 4, 12);

    // Paws
    g.fillStyle(0x555559, 1);
    g.fillEllipse(20, 51, 6, 4);
    g.fillEllipse(38, 51, 6, 4);

    // Enhanced snout and facial features
    g.fillGradientStyle(0xaab0b8, 0xc1c7cf, 0x999faa, 0xaab0b8, 1);
    g.fillTriangle(40, 28, 52, 24, 46, 38);

    // Nose and mouth details
    g.fillStyle(0x333333, 1);
    g.fillEllipse(50, 26, 3, 2);
    g.lineStyle(1, 0x444444, 0.8);
    g.strokeLineShape(new Phaser.Geom.Line(48, 28, 46, 32));

    // Enhanced eye with reflection
    g.fillStyle(0x444448, 1);
    g.fillEllipse(46, 30, 4, 3);
    g.fillStyle(0xf4f6f7, 1);
    g.fillCircle(46, 30, 2);
    g.fillStyle(0x111111, 1);
    g.fillCircle(46, 30, 1.2);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(45.5, 29.5, 0.5);

    // Ears
    g.fillStyle(0x8b8f96, 1);
    g.fillTriangle(24, 26, 20, 18, 28, 22);
    g.fillStyle(0xd4d8e0, 0.6);
    g.fillTriangle(25, 24, 22, 20, 26, 22);

    g.generateTexture(key, 64, 64);
    g.destroy();
  }

  private createOrcTexture(key: string) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    // Enhanced orc body with muscular definition
    g.fillGradientStyle(0x7da04e, 0x8fb158, 0x6a8d41, 0x7da04e, 1);
    g.fillEllipse(32, 34, 34, 22);

    // Muscle definition
    g.fillStyle(0x6a8d41, 0.6);
    g.fillEllipse(26, 32, 8, 12);
    g.fillEllipse(38, 32, 8, 12);

    // Enhanced armor/clothing with details
    g.fillGradientStyle(0x4f6a2d, 0x5d7a35, 0x425a26, 0x4f6a2d, 1);
    g.fillRoundedRect(20, 16, 24, 18, 6);

    // Armor straps and details
    g.fillStyle(0x6a8d41, 0.8);
    g.fillRect(22, 18, 20, 2);
    g.fillRect(24, 22, 16, 1);
    g.fillStyle(0x3d5222, 1);
    g.fillRect(30, 16, 4, 18);

    // Enhanced eyes with menacing look
    g.fillStyle(0xd4b337, 1);
    g.fillEllipse(26, 22, 4, 3);
    g.fillEllipse(38, 22, 4, 3);
    g.fillStyle(0x8b0000, 1);
    g.fillCircle(26, 22, 1.5);
    g.fillCircle(38, 22, 1.5);

    // Tusks and mouth
    g.fillStyle(0xe9e2cc, 1);
    g.fillRect(22, 30, 4, 4);
    g.fillRect(38, 30, 4, 4);
    g.fillTriangle(24, 30, 22, 26, 26, 28);
    g.fillTriangle(40, 30, 38, 26, 42, 28);

    // Scars and battle damage
    g.lineStyle(1, 0x5a7341, 0.8);
    g.strokeLineShape(new Phaser.Geom.Line(30, 25, 35, 28));
    g.strokeLineShape(new Phaser.Geom.Line(28, 35, 32, 38));

    g.generateTexture(key, 64, 64);
    g.destroy();
  }

  private createBoarTexture(key: string) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    // Enhanced boar body with bristled fur
    g.fillGradientStyle(0x7e5638, 0x8f6445, 0x6d4929, 0x7e5638, 1);
    g.fillEllipse(30, 36, 36, 20);

    // Fur bristles texture
    for (let i = 0; i < 15; i++) {
      const x = 15 + Math.random() * 30;
      const y = 28 + Math.random() * 16;
      const angle = Math.random() * Math.PI;

      g.lineStyle(1, 0x9d6f46, 0.6);
      g.strokeLineShape(
        new Phaser.Geom.Line(
          x,
          y,
          x + Math.cos(angle) * 4,
          y + Math.sin(angle) * 4,
        ),
      );
    }

    // Enhanced snout with detail
    g.fillGradientStyle(0x9d6f46, 0xae7f57, 0x8c5e35, 0x9d6f46, 1);
    g.fillEllipse(40, 34, 18, 12);

    // Snout details
    g.fillStyle(0x6d4929, 0.8);
    g.fillEllipse(42, 36, 8, 6);

    // Enhanced tusks
    g.fillStyle(0xf3dfc5, 1);
    g.fillRect(46, 34, 6, 2);
    g.fillTriangle(46, 32, 44, 30, 48, 30);
    g.fillTriangle(50, 32, 48, 30, 52, 30);

    // Enhanced ears with inner detail
    g.fillGradientStyle(0x6b4327, 0x7e5638, 0x5a3820, 0x6b4327, 1);
    g.fillTriangle(18, 26, 14, 18, 24, 22);
    g.fillStyle(0x9d6f46, 0.7);
    g.fillTriangle(19, 24, 16, 20, 22, 21);

    // Eye with fierce look
    g.fillStyle(0x000000, 1);
    g.fillEllipse(35, 32, 3, 2);
    g.fillStyle(0x8b0000, 0.8);
    g.fillCircle(35, 32, 1);

    g.generateTexture(key, 64, 64);
    g.destroy();
  }

  private createWispTexture(key: string) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    // Enhanced wisp with multiple energy layers
    g.fillStyle(0x7bd6ff, 0.4);
    g.fillCircle(32, 26, 20);
    g.fillStyle(0x7bd6ff, 0.6);
    g.fillCircle(32, 26, 15);
    g.fillStyle(0x7bd6ff, 0.85);
    g.fillCircle(32, 26, 10);

    // Bright core
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(32, 26, 5);
    g.fillStyle(0xdff8ff, 0.7);
    g.fillCircle(32, 26, 3);

    // Energy swirls around core
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const distance = 8;
      const x = 32 + Math.cos(angle) * distance;
      const y = 26 + Math.sin(angle) * distance;

      g.fillStyle(0x9fe8ff, 0.5);
      g.fillCircle(x, y, 2);
    }

    // Outer energy field
    g.fillStyle(0xdff8ff, 0.3);
    g.fillCircle(32, 26, 25);

    // Enhanced wisp tail with energy particles
    g.fillGradientStyle(0x9fe8ff, 0x7bd6ff, 0x5ac3e0, 0x4db8db, 0.8);
    g.fillTriangle(26, 34, 38, 34, 32, 54);

    // Energy trail particles
    for (let i = 0; i < 8; i++) {
      const x = 28 + Math.random() * 8;
      const y = 40 + i * 2;
      const size = 2 - i * 0.2;

      g.fillStyle(0xdff8ff, 0.7 - i * 0.08);
      g.fillCircle(x, y, size);
    }

    g.generateTexture(key, 64, 64);
    g.destroy();
  }

  private createDragonTexture(key: string) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    // Enhanced dragon body with scales
    g.fillGradientStyle(0xb84b40, 0xd05f54, 0xa03c31, 0xb84b40, 1);
    g.fillEllipse(30, 34, 34, 22);

    // Scale pattern
    for (let x = 18; x < 42; x += 4) {
      for (let y = 26; y < 42; y += 3) {
        g.fillStyle(0xd05f54, 0.6);
        g.fillEllipse(x, y, 3, 2);
        g.fillStyle(0xa03c31, 0.4);
        g.fillEllipse(x, y + 1, 2, 1);
      }
    }

    // Enhanced wings with membrane details
    g.fillGradientStyle(0xdf7d62, 0xf2947b, 0xcc6a49, 0xdf7d62, 1);
    g.fillTriangle(20, 24, 12, 12, 28, 18);
    g.fillTriangle(40, 24, 52, 14, 44, 30);

    // Wing membrane details
    g.lineStyle(1, 0xcc6a49, 0.6);
    g.strokeLineShape(new Phaser.Geom.Line(16, 18, 24, 20));
    g.strokeLineShape(new Phaser.Geom.Line(20, 14, 26, 22));
    g.strokeLineShape(new Phaser.Geom.Line(44, 18, 48, 20));
    g.strokeLineShape(new Phaser.Geom.Line(46, 14, 42, 22));

    // Enhanced head with horns and details
    g.fillGradientStyle(0xffd8b8, 0xffe5c5, 0xffcba1, 0xffd8b8, 1);
    g.fillTriangle(30, 18, 24, 8, 36, 10);

    // Horns
    g.fillStyle(0x8b4513, 1);
    g.fillTriangle(26, 10, 24, 4, 28, 8);
    g.fillTriangle(34, 10, 32, 4, 36, 8);

    // Enhanced eyes with dragon pupils
    g.fillStyle(0x8b0000, 1);
    g.fillEllipse(24, 30, 4, 3);
    g.fillEllipse(38, 30, 4, 3);
    g.fillStyle(0xffd700, 1);
    g.fillEllipse(24, 30, 3, 2);
    g.fillEllipse(38, 30, 3, 2);
    g.fillStyle(0x2b0f10, 1);
    g.fillRect(23, 29, 2, 2);
    g.fillRect(37, 29, 2, 2);

    // Nostril smoke
    g.fillStyle(0x666666, 0.6);
    g.fillCircle(32, 16, 2);
    g.fillCircle(34, 14, 1);

    g.generateTexture(key, 72, 72);
    g.destroy();
  }

  private createRockGolemTexture(key: string) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    // Enhanced golem body with rock texture
    g.fillGradientStyle(0x747b72, 0x85928a, 0x636a61, 0x747b72, 1);
    g.fillRoundedRect(16, 22, 30, 24, 8);

    // Rock texture and cracks
    for (let i = 0; i < 10; i++) {
      const x = 18 + Math.random() * 26;
      const y = 24 + Math.random() * 20;
      g.fillStyle(0x636a61, 0.8);
      g.fillEllipse(x, y, 2 + Math.random() * 3, 1 + Math.random() * 2);
    }

    // Major cracks
    g.lineStyle(1, 0x5b6159, 0.8);
    g.strokeLineShape(new Phaser.Geom.Line(20, 25, 30, 35));
    g.strokeLineShape(new Phaser.Geom.Line(35, 28, 42, 40));

    // Enhanced arms with rocky details
    g.fillGradientStyle(0x8f988d, 0xa5aea2, 0x7a8378, 0x8f988d, 1);
    g.fillRoundedRect(10, 28, 14, 18, 5);
    g.fillRoundedRect(40, 28, 14, 18, 5);

    // Arm joint details
    g.fillStyle(0x636a61, 0.9);
    g.fillCircle(17, 37, 3);
    g.fillCircle(47, 37, 3);

    // Enhanced legs with stability
    g.fillGradientStyle(0x5b6159, 0x6d736b, 0x4d534d, 0x5b6159, 1);
    g.fillRect(22, 44, 8, 12);
    g.fillRect(34, 44, 8, 12);

    // Foot details
    g.fillStyle(0x747b72, 1);
    g.fillRect(20, 54, 12, 4);
    g.fillRect(32, 54, 12, 4);

    // Enhanced glowing eyes
    g.fillStyle(0x4dc3e5, 1);
    g.fillCircle(26, 32, 3);
    g.fillCircle(38, 32, 3);
    g.fillStyle(0xaad8e2, 0.9);
    g.fillCircle(26, 32, 2);
    g.fillCircle(38, 32, 2);
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(26, 31, 1);
    g.fillCircle(38, 31, 1);

    // Chest crystal/rune
    g.fillStyle(0xc3cec1, 0.6);
    g.fillEllipse(32, 32, 8, 6);
    g.fillStyle(0x4dc3e5, 0.8);
    g.fillEllipse(32, 32, 6, 4);

    // Shoulder highlights
    g.fillStyle(0xc3cec1, 0.25);
    g.fillEllipse(22, 26, 8, 4);
    g.fillEllipse(42, 26, 8, 4);

    g.generateTexture(key, 64, 64);
    g.destroy();
  }

  private createSkeletonTexture(key: string) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    // Enhanced skull with bone texture
    g.fillGradientStyle(0xe6e2d7, 0xf5f1e6, 0xd4cfc2, 0xe6e2d7, 1);
    g.fillCircle(32, 16, 10);

    // Skull details and cracks
    g.lineStyle(1, 0xd4cfc2, 0.6);
    g.strokeLineShape(new Phaser.Geom.Line(25, 12, 30, 18));
    g.strokeLineShape(new Phaser.Geom.Line(35, 12, 40, 18));

    // Enhanced eye sockets with depth
    g.fillStyle(0x171717, 1);
    g.fillCircle(28, 14, 3);
    g.fillCircle(36, 14, 3);
    g.fillStyle(0x8b0000, 0.8);
    g.fillCircle(28, 14, 1.5);
    g.fillCircle(36, 14, 1.5);

    // Enhanced ribcage with individual ribs
    g.fillGradientStyle(0xd4cfc2, 0xe6e2d7, 0xc1bbb0, 0xd4cfc2, 1);
    g.fillRoundedRect(24, 28, 16, 18, 5);

    // Individual ribs
    for (let i = 0; i < 5; i++) {
      const y = 30 + i * 3;
      g.lineStyle(2, 0xe6e2d7, 0.8);
      g.strokeLineShape(new Phaser.Geom.Line(26, y, 38, y));
    }

    // Enhanced arm bones with joints
    g.fillGradientStyle(0xe6e2d7, 0xf5f1e6, 0xd4cfc2, 0xe6e2d7, 1);
    g.fillRect(21, 28, 4, 18);
    g.fillRect(39, 28, 4, 18);

    // Elbow joints
    g.fillStyle(0xd4cfc2, 1);
    g.fillCircle(23, 37, 2);
    g.fillCircle(41, 37, 2);

    // Enhanced leg bones with knee joints
    g.fillGradientStyle(0xe6e2d7, 0xf5f1e6, 0xd4cfc2, 0xe6e2d7, 1);
    g.fillRect(27, 44, 4, 14);
    g.fillRect(33, 44, 4, 14);

    // Knee joints
    g.fillStyle(0xd4cfc2, 1);
    g.fillCircle(29, 51, 2);
    g.fillCircle(35, 51, 2);

    // Enhanced weapon with weathered details
    g.fillGradientStyle(0x8d6f49, 0xa5835d, 0x755a38, 0x8d6f49, 1);
    g.fillRect(41, 22, 10, 3);

    // Weapon handle wrapping
    g.fillStyle(0x5a4228, 0.8);
    for (let i = 0; i < 3; i++) {
      g.fillRect(42 + i * 3, 21, 1, 5);
    }

    // Enhanced blade with nicks and wear
    g.fillGradientStyle(0x603d21, 0x7a4f2b, 0x4d2f18, 0x603d21, 1);
    g.fillTriangle(51, 23, 47, 19, 47, 27);

    // Blade edge highlight
    g.lineStyle(1, 0x8d6f49, 0.6);
    g.strokeLineShape(new Phaser.Geom.Line(51, 23, 47, 19));

    g.generateTexture(key, 64, 64);
    g.destroy();
  }

  private createTreeTexture(
    key: string,
    leafColor?: number,
    trunkColor?: number,
  ) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    // Tree shadow (more realistic)
    g.fillGradientStyle(0x0a0f10, 0x1a1f20, 0x0a0f10, 0x0a0f10, 0.4);
    g.fillEllipse(32, 56, 24, 8);

    // Determine tree type and colors based on key
    let mainTrunkColor = trunkColor || 0x4b2f18;
    let darkTrunkColor = 0x3a2412;
    let lightTrunkColor = 0x5c3a21;
    let mainLeafColor = leafColor || 0x2d4a2f;
    let leafShape = "round"; // "round", "pine", "dead"

    if (key.includes("pine")) {
      mainLeafColor = 0x1e3220;
      leafShape = "pine";
    } else if (key.includes("oak")) {
      mainLeafColor = 0x4a6b3d;
      leafShape = "round";
    } else if (key.includes("dead")) {
      mainTrunkColor = 0x5d4a3a;
      darkTrunkColor = 0x3e3225;
      lightTrunkColor = 0x6e5b4b;
      leafShape = "dead";
    }

    // Thick trunk with pronounced bark texture
    g.fillGradientStyle(
      lightTrunkColor,
      mainTrunkColor,
      darkTrunkColor,
      mainTrunkColor,
      1,
    );
    g.fillRect(28, 32, 8, 20);

    // Bark texture - horizontal ridges
    for (let i = 0; i < 12; i++) {
      const y = 34 + i * 1.5;
      g.lineStyle(1, darkTrunkColor, 0.9);
      g.strokeLineShape(new Phaser.Geom.Line(28, y, 36, y));
    }

    // Vertical bark cracks
    g.lineStyle(1, darkTrunkColor, 0.7);
    g.strokeLineShape(new Phaser.Geom.Line(30, 32, 30, 52));
    g.strokeLineShape(new Phaser.Geom.Line(34, 32, 34, 52));

    // Bark knots and texture details
    g.fillStyle(darkTrunkColor, 0.8);
    g.fillEllipse(29, 38, 2, 3);
    g.fillEllipse(34, 45, 3, 2);

    // Tree roots visible above ground
    g.fillStyle(darkTrunkColor, 0.9);
    g.fillEllipse(24, 52, 6, 3);
    g.fillEllipse(38, 52, 6, 3);
    g.fillEllipse(32, 53, 4, 2);

    // Branch structure
    if (leafShape !== "dead") {
      g.lineStyle(2, mainTrunkColor, 1);
      // Main branches
      g.strokeLineShape(new Phaser.Geom.Line(32, 32, 25, 26));
      g.strokeLineShape(new Phaser.Geom.Line(32, 32, 39, 26));
      g.strokeLineShape(new Phaser.Geom.Line(32, 34, 22, 30));
      g.strokeLineShape(new Phaser.Geom.Line(32, 34, 42, 30));

      // Smaller branches
      g.lineStyle(1, mainTrunkColor, 0.8);
      g.strokeLineShape(new Phaser.Geom.Line(25, 26, 20, 22));
      g.strokeLineShape(new Phaser.Geom.Line(39, 26, 44, 22));
    }

    // Canopy based on tree type
    if (leafShape === "pine") {
      // Pine tree - triangular canopy
      g.fillStyle(mainLeafColor, 1);
      g.fillTriangle(32, 12, 18, 35, 46, 35);

      g.fillStyle(mainLeafColor, 0.8);
      g.fillTriangle(32, 16, 22, 32, 42, 32);

      g.fillStyle(mainLeafColor, 0.9);
      g.fillTriangle(32, 14, 20, 33, 44, 33);

      // Pine needle texture
      g.lineStyle(1, mainLeafColor, 0.6);
      for (let i = 0; i < 20; i++) {
        const x = 20 + Math.random() * 24;
        const y = 15 + Math.random() * 18;
        g.strokeLineShape(new Phaser.Geom.Line(x, y, x + 2, y - 1));
      }
    } else if (leafShape === "dead") {
      // Dead tree - bare branches only
      g.lineStyle(2, mainTrunkColor, 0.8);
      // Gnarled branches
      g.strokeLineShape(new Phaser.Geom.Line(32, 32, 20, 20));
      g.strokeLineShape(new Phaser.Geom.Line(32, 32, 44, 18));
      g.strokeLineShape(new Phaser.Geom.Line(32, 34, 18, 25));
      g.strokeLineShape(new Phaser.Geom.Line(32, 34, 46, 28));

      g.lineStyle(1, mainTrunkColor, 0.6);
      // Smaller dead branches
      g.strokeLineShape(new Phaser.Geom.Line(20, 20, 15, 15));
      g.strokeLineShape(new Phaser.Geom.Line(44, 18, 50, 12));
      g.strokeLineShape(new Phaser.Geom.Line(18, 25, 12, 22));
    } else {
      // Round canopy (oak, regular trees)
      // Base canopy - darker layer
      g.fillStyle(mainLeafColor, 1);
      g.fillEllipse(32, 24, 32, 24);

      // Secondary layers for depth
      g.fillStyle(mainLeafColor, 0.85);
      g.fillEllipse(26, 22, 20, 16);
      g.fillEllipse(38, 26, 18, 14);

      // Top layer highlights
      g.fillStyle(mainLeafColor, 0.7);
      g.fillEllipse(32, 20, 24, 18);

      // Sunlight patches
      const lightLeafColor = mainLeafColor + 0x202020; // Lighten the leaf color
      g.fillStyle(lightLeafColor, 0.6);
      g.fillEllipse(28, 18, 8, 6);
      g.fillEllipse(36, 22, 6, 5);
      g.fillEllipse(32, 25, 10, 8);

      // Individual leaf cluster details
      g.fillStyle(mainLeafColor, 0.4);
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const distance = 10 + Math.random() * 6;
        const x = 32 + Math.cos(angle) * distance;
        const y = 24 + Math.sin(angle) * distance * 0.7;

        g.fillEllipse(x, y, 3 + Math.random() * 2, 2 + Math.random() * 2);
      }
    }

    g.generateTexture(key, 64, 64);
    g.destroy();
  }

  private createRockTexture(key: string, scale?: number) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    const rockScale = scale || 1.0;

    // Rock shadow (more realistic for isometric view)
    g.fillGradientStyle(0x0a0f10, 0x1a1f20, 0x0a0f10, 0x0a0f10, 0.4);
    g.fillEllipse(32, 48, 20 * rockScale, 8 * rockScale);

    // Main rock body with 3D isometric appearance
    const rockBase = 0x6d766a;
    const rockLight = 0x8a9487;
    const rockDark = 0x5c655a;

    // Main rock shape (slightly irregular)
    g.fillGradientStyle(rockLight, rockBase, rockDark, rockBase, 1);
    g.fillEllipse(32, 38, 24 * rockScale, 16 * rockScale);

    // Top face (brightest - isometric lighting)
    g.fillStyle(rockLight, 0.9);
    g.fillEllipse(32, 32, 20 * rockScale, 12 * rockScale);

    // Left face (medium light)
    g.fillStyle(rockBase, 0.8);
    g.fillEllipse(26, 36, 16 * rockScale, 10 * rockScale);

    // Right face (darker shadow side)
    g.fillStyle(rockDark, 0.7);
    g.fillEllipse(38, 36, 14 * rockScale, 8 * rockScale);

    // Rock texture details and cracks
    g.lineStyle(1, rockDark, 0.8);
    // Major crack across the rock
    g.strokeLineShape(
      new Phaser.Geom.Line(
        22 * rockScale,
        34 * rockScale,
        42 * rockScale,
        38 * rockScale,
      ),
    );

    // Secondary cracks
    g.lineStyle(1, rockDark, 0.6);
    g.strokeLineShape(
      new Phaser.Geom.Line(
        28 * rockScale,
        30 * rockScale,
        36 * rockScale,
        34 * rockScale,
      ),
    );
    g.strokeLineShape(
      new Phaser.Geom.Line(
        30 * rockScale,
        40 * rockScale,
        38 * rockScale,
        42 * rockScale,
      ),
    );

    // Rock surface texture (weathered areas)
    g.fillStyle(rockDark, 0.3);
    for (let i = 0; i < 8; i++) {
      const x = 26 + Math.random() * 12;
      const y = 30 + Math.random() * 12;
      g.fillRect(x * rockScale, y * rockScale, 1, 1);
    }

    // Bright mineral highlights
    g.fillStyle(rockLight, 0.6);
    g.fillRect(28 * rockScale, 32 * rockScale, 2, 1);
    g.fillRect(35 * rockScale, 34 * rockScale, 2, 1);
    g.fillRect(31 * rockScale, 36 * rockScale, 1, 2);

    // Moss patches (classic RPG detail)
    g.fillStyle(0x4a6b3a, 0.7);
    g.fillEllipse(25 * rockScale, 35 * rockScale, 4 * rockScale, 3 * rockScale);
    g.fillEllipse(37 * rockScale, 39 * rockScale, 3 * rockScale, 2 * rockScale);

    // Small moss details
    g.fillStyle(0x5a7a4a, 0.5);
    g.fillRect(24 * rockScale, 36 * rockScale, 1, 1);
    g.fillRect(38 * rockScale, 40 * rockScale, 1, 1);

    // Scattered pebbles around base
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const distance = 12 + Math.random() * 8;
      const x = 32 + Math.cos(angle) * distance * rockScale;
      const y = 42 + Math.sin(angle) * 4 * rockScale;

      g.fillStyle(rockBase, 0.6 + Math.random() * 0.3);
      g.fillCircle(x, y, (1 + Math.random()) * rockScale);

      // Pebble highlight
      g.fillStyle(rockLight, 0.4);
      g.fillRect(x - 0.5, y - 0.5, 1, 1);
    }

    // Top highlight (sun reflection)
    g.fillStyle(rockLight, 0.4);
    g.fillEllipse(30 * rockScale, 29 * rockScale, 6 * rockScale, 3 * rockScale);

    g.generateTexture(key, 64, 64);
    g.destroy();
  }

  private createFenceTexture(key: string) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    // Enhanced fence posts with wood grain
    const posts = [
      { x: 4, y: 18, w: 8, h: 18 },
      { x: 20, y: 18, w: 8, h: 18 },
      { x: 36, y: 18, w: 8, h: 18 },
    ];

    posts.forEach((post) => {
      // Post base with gradient
      g.fillGradientStyle(0x7d5d32, 0x8f6b3e, 0x6b4d28, 0x7d5d32, 1);
      g.fillRect(post.x, post.y, post.w, post.h);

      // Wood grain texture
      for (let i = 0; i < 5; i++) {
        const y = post.y + 2 + i * 3;
        g.lineStyle(1, 0x6b4d28, 0.6);
        g.strokeLineShape(
          new Phaser.Geom.Line(post.x + 1, y, post.x + post.w - 1, y),
        );
      }

      // Vertical grain
      g.lineStyle(1, 0x8f6b3e, 0.4);
      g.strokeLineShape(
        new Phaser.Geom.Line(post.x + 2, post.y, post.x + 2, post.y + post.h),
      );
      g.strokeLineShape(
        new Phaser.Geom.Line(post.x + 6, post.y, post.x + 6, post.y + post.h),
      );

      // Post weathering
      g.fillStyle(0x6b4d28, 0.3);
      g.fillRect(post.x, post.y + post.h - 3, post.w, 3);
    });

    // Enhanced horizontal rails with depth
    const rails = [
      { x: 0, y: 12, w: 48, h: 4 },
      { x: 0, y: 24, w: 48, h: 4 },
    ];

    rails.forEach((rail) => {
      // Rail base
      g.fillGradientStyle(0x9a7541, 0xb0875b, 0x866235, 0x9a7541, 1);
      g.fillRect(rail.x, rail.y, rail.w, rail.h);

      // Rail wood grain
      g.lineStyle(1, 0x866235, 0.5);
      g.strokeLineShape(
        new Phaser.Geom.Line(rail.x, rail.y + 1, rail.x + rail.w, rail.y + 1),
      );
      g.strokeLineShape(
        new Phaser.Geom.Line(rail.x, rail.y + 3, rail.x + rail.w, rail.y + 3),
      );

      // Rail highlight
      g.fillStyle(0xb0875b, 0.8);
      g.fillRect(rail.x, rail.y, rail.w, 1);

      // Rail shadow
      g.fillStyle(0x6b4d28, 0.6);
      g.fillRect(rail.x, rail.y + rail.h - 1, rail.w, 1);
    });

    // Nail details
    posts.forEach((post) => {
      rails.forEach((rail) => {
        if (post.x < rail.x + rail.w && post.x + post.w > rail.x) {
          const nailX = post.x + post.w / 2;
          const nailY = rail.y + rail.h / 2;

          g.fillStyle(0x4a4a4a, 1);
          g.fillCircle(nailX, nailY, 1);
          g.fillStyle(0x666666, 0.8);
          g.fillCircle(nailX - 0.3, nailY - 0.3, 0.5);
        }
      });
    });

    g.generateTexture(key, 48, 40);
    g.destroy();
  }

  private createBannerTexture(key: string) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    // Enhanced banner pole with wood detail
    g.fillGradientStyle(0x5d4527, 0x6e5230, 0x4c3820, 0x5d4527, 1);
    g.fillRect(22, 6, 4, 52);

    // Pole wood grain
    for (let i = 0; i < 10; i++) {
      const y = 8 + i * 5;
      g.lineStyle(0.5, 0x4c3820, 0.6);
      g.strokeLineShape(new Phaser.Geom.Line(22.5, y, 25.5, y));
    }

    // Banner mounting hardware
    g.fillGradientStyle(0xc79339, 0xd4a144, 0xb8822e, 0xc79339, 1);
    g.fillRect(10, 10, 24, 4);

    // Hardware details
    g.fillStyle(0x8b5a2b, 1);
    g.fillRect(12, 11, 2, 2);
    g.fillRect(30, 11, 2, 2);
    g.fillStyle(0xd4a144, 0.8);
    g.fillRect(10, 10, 24, 1);

    // Enhanced banner fabric with detailed emblem
    g.fillGradientStyle(0x852b22, 0x9a3326, 0x6f1f18, 0x852b22, 1);
    g.fillRoundedRect(12, 14, 20, 24, 4);

    // Fabric texture
    for (let y = 16; y < 36; y += 2) {
      g.lineStyle(0.5, 0x6f1f18, 0.3);
      g.strokeLineShape(new Phaser.Geom.Line(13, y, 31, y));
    }

    // Enhanced heraldic emblem
    g.fillGradientStyle(0xe8cf8e, 0xf5dc9b, 0xdbc281, 0xe8cf8e, 0.9);
    g.fillTriangle(22, 18, 18, 30, 26, 30);

    // Emblem details - crown
    g.fillStyle(0xf5dc9b, 1);
    g.fillRect(20, 18, 4, 2);
    g.fillTriangle(19, 18, 21, 16, 23, 16);
    g.fillTriangle(23, 16, 25, 18, 25, 18);

    // Emblem border
    g.lineStyle(1, 0xdbc281, 0.8);
    g.strokeTriangle(22, 18, 18, 30, 26, 30);

    // Fabric wear and highlights
    g.fillStyle(0xf7e6b1, 0.25);
    g.fillRect(14, 16, 4, 18);
    g.fillStyle(0x6f1f18, 0.4);
    g.fillRect(28, 20, 2, 14);

    // Banner edge wear
    g.fillStyle(0x6f1f18, 0.6);
    g.fillRect(12, 36, 20, 2);

    // Fabric shine
    g.fillStyle(0xffffff, 0.15);
    g.fillRect(13, 15, 2, 20);

    g.generateTexture(key, 48, 64);
    g.destroy();
  }

  private createRuinTexture(key: string) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    // Enhanced ruin shadow
    g.fillGradientStyle(0x07090b, 0x15181a, 0x07090b, 0x07090b, 0.2);
    g.fillEllipse(26, 48, 34, 10);

    // Main ruined structure with weathered stone
    g.fillGradientStyle(0x63675f, 0x737769, 0x535749, 0x63675f, 1);
    g.fillRoundedRect(8, 20, 34, 26, 6);

    // Stone block definition
    const blocks = [
      { x: 8, y: 20, w: 16, h: 8 },
      { x: 24, y: 20, w: 18, h: 8 },
      { x: 8, y: 28, w: 12, h: 9 },
      { x: 20, y: 28, w: 22, h: 9 },
      { x: 8, y: 37, w: 18, h: 9 },
      { x: 26, y: 37, w: 16, h: 9 },
    ];

    blocks.forEach((block) => {
      // Individual stone block
      g.fillStyle(0x63675f, 0.9);
      g.fillRoundedRect(block.x, block.y, block.w, block.h, 2);

      // Block weathering
      g.fillStyle(0x535749, 0.6);
      g.fillRect(block.x, block.y + block.h - 2, block.w, 2);

      // Mortar lines
      g.lineStyle(1, 0x535749, 0.8);
      g.strokeRoundedRect(block.x, block.y, block.w, block.h, 2);
    });

    // Taller broken column
    g.fillGradientStyle(0x889184, 0x9aa399, 0x777f74, 0x889184, 1);
    g.fillRoundedRect(14, 8, 10, 38, 5);

    // Column fluting and details
    for (let i = 0; i < 8; i++) {
      const y = 10 + i * 4;
      g.lineStyle(1, 0x777f74, 0.5);
      g.strokeLineShape(new Phaser.Geom.Line(16, y, 22, y));
    }

    // Column damage
    g.fillStyle(0x535749, 0.8);
    g.fillRect(15, 12, 3, 6);
    g.fillRect(19, 25, 4, 8);

    // Broken edges
    g.lineStyle(2, 0x777f74, 0.7);
    g.strokeLineShape(new Phaser.Geom.Line(14, 8, 18, 6));
    g.strokeLineShape(new Phaser.Geom.Line(20, 6, 24, 8));

    // Moss and vegetation growth
    g.fillStyle(0x4d5c3d, 0.7);
    g.fillEllipse(16, 40, 6, 4);
    g.fillEllipse(32, 35, 4, 3);
    g.fillEllipse(20, 18, 3, 2);

    // Ivy tendrils
    for (let i = 0; i < 6; i++) {
      const startX = 12 + i * 5;
      const startY = 15 + i * 6;
      g.lineStyle(1, 0x4d5c3d, 0.6);
      g.strokeLineShape(
        new Phaser.Geom.Line(
          startX,
          startY,
          startX + Math.random() * 8 - 4,
          startY + Math.random() * 10 + 5,
        ),
      );
    }

    // Rubble and debris at base
    g.fillStyle(0x4d534d, 0.7);
    g.fillRect(10, 42, 4, 3);
    g.fillRect(18, 44, 3, 2);
    g.fillRect(35, 43, 5, 3);

    // Ancient carved details still visible
    g.fillStyle(0xa8b09f, 0.35);
    g.fillRect(16, 12, 6, 6);
    g.fillRect(28, 24, 8, 4);

    // Carved pattern remnants
    g.lineStyle(1, 0xa8b09f, 0.25);
    g.strokeRect(17, 13, 4, 4);
    g.strokeLineShape(new Phaser.Geom.Line(19, 15, 19, 15));

    g.generateTexture(key, 52, 56);
    g.destroy();
  }

  private createCrystalTexture(key: string) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    // Enhanced crystal base glow
    g.fillGradientStyle(0x6fe2ff, 0x7fe8ff, 0x5fd6ee, 0x6fe2ff, 0.3);
    g.fillEllipse(28, 38, 30, 12);

    // Outer glow rings
    g.fillStyle(0x6fe2ff, 0.15);
    g.fillEllipse(28, 38, 35, 15);
    g.fillStyle(0x6fe2ff, 0.08);
    g.fillEllipse(28, 38, 40, 18);

    // Main crystal with enhanced faceting
    g.fillGradientStyle(0x61e7ff, 0x7ff1ff, 0x4dd9ff, 0x61e7ff, 0.95);
    g.fillPoints(
      [
        { x: 28, y: 6 },
        { x: 40, y: 22 },
        { x: 34, y: 42 },
        { x: 22, y: 42 },
        { x: 16, y: 22 },
      ],
      true,
    );

    // Crystal facet planes
    const facets = [
      [
        { x: 28, y: 6 },
        { x: 40, y: 22 },
        { x: 34, y: 42 },
      ], // Right face
      [
        { x: 28, y: 6 },
        { x: 16, y: 22 },
        { x: 22, y: 42 },
      ], // Left face
      [
        { x: 28, y: 6 },
        { x: 16, y: 22 },
        { x: 40, y: 22 },
      ], // Top face
    ];

    facets.forEach((facet, index) => {
      const opacity = 0.2 + index * 0.15;
      g.fillStyle(0xcfffff, opacity);
      g.fillPoints(facet, true);
    });

    // Inner crystal core with enhanced brightness
    g.fillGradientStyle(0xcfffff, 0xffffff, 0xa9f9ff, 0xcfffff, 0.8);
    g.fillPoints(
      [
        { x: 28, y: 10 },
        { x: 35, y: 22 },
        { x: 28, y: 34 },
        { x: 22, y: 22 },
      ],
      true,
    );

    // Bright crystal highlights and reflections
    g.fillStyle(0xffffff, 0.6);
    g.fillEllipse(25, 18, 8, 18);
    g.fillStyle(0xffffff, 0.8);
    g.fillEllipse(30, 14, 5, 12);
    g.fillStyle(0xffffff, 0.9);
    g.fillEllipse(26, 16, 3, 8);

    // Crystal edge highlighting
    g.lineStyle(1, 0xffffff, 0.6);
    g.strokePoints([
      { x: 28, y: 6 },
      { x: 40, y: 22 },
      { x: 34, y: 42 },
      { x: 22, y: 42 },
      { x: 16, y: 22 },
      { x: 28, y: 6 },
    ]);

    // Internal light rays
    const rays = [
      { start: { x: 28, y: 12 }, end: { x: 32, y: 36 } },
      { start: { x: 24, y: 18 }, end: { x: 30, y: 30 } },
      { start: { x: 32, y: 16 }, end: { x: 26, y: 32 } },
    ];

    rays.forEach((ray) => {
      g.lineStyle(1, 0xffffff, 0.4);
      g.strokeLineShape(
        new Phaser.Geom.Line(ray.start.x, ray.start.y, ray.end.x, ray.end.y),
      );
    });

    // Magical energy particles around crystal
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const distance = 22 + Math.random() * 8;
      const x = 28 + Math.cos(angle) * distance;
      const y = 24 + Math.sin(angle) * distance * 0.6;

      g.fillStyle(0x7ff1ff, 0.6 + Math.random() * 0.4);
      g.fillCircle(x, y, 1 + Math.random() * 2);
    }

    g.generateTexture(key, 56, 56);
    g.destroy();
  }

  private createGemTexture(key: string) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    // Enhanced gem with detailed faceting
    g.fillGradientStyle(0xffe178, 0xffea88, 0xffd865, 0xffe178, 1);
    g.fillPoints(
      [
        { x: 16, y: 6 },
        { x: 26, y: 16 },
        { x: 16, y: 26 },
        { x: 6, y: 16 },
      ],
      true,
    );

    // Gem facet highlights
    g.fillStyle(0xffea88, 0.8);
    g.fillTriangle(16, 6, 26, 16, 21, 11);
    g.fillTriangle(6, 16, 16, 26, 11, 21);

    // Bright facet reflections
    g.fillStyle(0xfff7d0, 1);
    g.fillRect(15, 4, 2, 6);
    g.fillTriangle(14, 12, 18, 12, 16, 8);

    // Additional facet lines for depth
    g.lineStyle(1, 0xffd865, 0.6);
    g.strokeLineShape(new Phaser.Geom.Line(11, 11, 21, 21));
    g.strokeLineShape(new Phaser.Geom.Line(21, 11, 11, 21));

    // Gem inner glow
    g.fillStyle(0xffffff, 0.3);
    g.fillCircle(16, 16, 4);

    g.generateTexture(key, 32, 32);
    g.destroy();
  }

  private createArrowTexture(key: string) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    // Enhanced arrow shaft with wood grain
    g.fillGradientStyle(0x8b5a2b, 0x9d6733, 0x7a4d23, 0x8b5a2b, 1);
    g.fillRect(0, 6, 22, 2);

    // Wood grain detail
    g.lineStyle(0.5, 0x7a4d23, 0.6);
    g.strokeLineShape(new Phaser.Geom.Line(1, 6.5, 21, 6.5));
    g.strokeLineShape(new Phaser.Geom.Line(2, 7.5, 20, 7.5));

    // Enhanced arrowhead with metallic shine
    g.fillGradientStyle(0xcfdc9e, 0xdfe8ae, 0xbfcc8e, 0xcfdc9e, 1);
    g.fillTriangle(22, 7, 16, 3, 16, 11);

    // Arrowhead edge highlight
    g.lineStyle(1, 0xdfe8ae, 0.8);
    g.strokeLineShape(new Phaser.Geom.Line(22, 7, 16, 3));
    g.strokeLineShape(new Phaser.Geom.Line(22, 7, 16, 11));

    // Arrowhead point shine
    g.fillStyle(0xf5f0d7, 0.9);
    g.fillTriangle(22, 7, 19, 5, 19, 9);

    // Enhanced fletching with feather detail
    g.fillGradientStyle(0xf5f0d7, 0xffffff, 0xe5e0c7, 0xf5f0d7, 1);
    g.fillTriangle(0, 7, 4, 3, 4, 11);

    // Feather texture
    g.lineStyle(0.5, 0xe5e0c7, 0.7);
    for (let i = 1; i < 4; i++) {
      g.strokeLineShape(new Phaser.Geom.Line(i, 4 + i, i, 10 - i));
    }

    // Fletching binding
    g.fillStyle(0x8b5a2b, 1);
    g.fillRect(3, 6.5, 2, 1);

    g.generateTexture(key, 24, 14);
    g.destroy();
  }

  private createParticleTextures() {
    // Create small particle textures for combat and spell effects
    this.createParticleTexture("particle_spark", 0xffff00, 8);
    this.createParticleTexture("particle_ember", 0xff4500, 6);
    this.createParticleTexture("particle_ice", 0x87ceeb, 8);
    this.createParticleTexture("particle_magic", 0xff69b4, 6);
    this.createParticleTexture("particle_heal", 0x00ff7f, 8);
    this.createParticleTexture("particle_poison", 0x8b008b, 6);
    this.createParticleTexture("particle_blood", 0x8b0000, 4);
    this.createParticleTexture("particle_dust", 0xd2b48c, 4);
  }

  private createParticleTexture(key: string, color: number, size: number) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    const center = size / 2;

    // Outer glow
    g.fillStyle(color, 0.3);
    g.fillCircle(center, center, center);

    // Main particle
    g.fillStyle(color, 0.8);
    g.fillCircle(center, center, center * 0.7);

    // Bright core
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(center, center, center * 0.4);

    // Highlight
    g.fillStyle(0xffffff, 1);
    g.fillCircle(center - 1, center - 1, center * 0.2);

    g.generateTexture(key, size, size);
    g.destroy();
  }

  // Enhanced texture creation methods for Lineage Classic-style visuals

  private createSmallDecoTexture(
    key: string,
    primary: number,
    secondary: number,
  ) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const size = 8;

    if (key.includes("flower")) {
      // Small flower decoration
      g.fillStyle(0x228b22, 1);
      g.fillCircle(4, 6, 1); // stem
      g.fillRect(3.5, 5, 1, 2);

      g.fillStyle(primary, 1);
      g.fillCircle(4, 4, 2); // petals
      g.fillStyle(secondary, 1);
      g.fillCircle(4, 4, 1); // center
    } else if (key.includes("mushroom")) {
      // Small mushroom
      g.fillStyle(0xf5deb3, 1);
      g.fillRect(3.5, 4, 1, 3); // stem
      g.fillStyle(primary, 1);
      g.fillEllipse(4, 3, 4, 3); // cap
      g.fillStyle(secondary, 0.8);
      g.fillCircle(3, 2.5, 0.5); // spots
      g.fillCircle(5, 2.5, 0.5);
    } else if (key.includes("pebble")) {
      // Small stone
      g.fillStyle(primary, 1);
      g.fillCircle(4, 4, 2);
      g.fillStyle(secondary, 0.6);
      g.fillCircle(3.5, 3.5, 1);
    } else if (key.includes("shell")) {
      // Seashell
      g.fillStyle(primary, 1);
      g.fillEllipse(4, 4, 3, 2);
      g.lineStyle(0.5, secondary);
      g.strokeEllipse(4, 4, 3, 2);
      g.strokeLineShape(new Phaser.Geom.Line(4, 3, 4, 5));
    } else if (key.includes("leaf")) {
      // Fallen leaf
      g.fillStyle(primary, 1);
      g.fillEllipse(4, 4, 3, 5);
      g.lineStyle(0.5, secondary);
      g.strokeLineShape(new Phaser.Geom.Line(4, 1.5, 4, 6.5));
    } else if (key.includes("twig")) {
      // Small twig
      g.lineStyle(1, primary);
      g.strokeLineShape(new Phaser.Geom.Line(1, 5, 6, 3));
      g.strokeLineShape(new Phaser.Geom.Line(3, 4, 2, 2));
    }

    g.generateTexture(key, size, size);
    g.destroy();
  }

  private createPortalTexture(key: string) {
    if (this.textures.exists(key)) return;
    const size = 64;
    const center = size / 2;
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    // Outer swirl
    g.fillStyle(0x4b0082, 0.3);
    g.fillCircle(center, center, center * 0.9);

    // Middle swirl with gradient effect
    g.fillStyle(0x8a2be2, 0.6);
    g.fillCircle(center, center, center * 0.7);

    // Inner core
    g.fillStyle(0xda70d6, 0.8);
    g.fillCircle(center, center, center * 0.5);

    // Bright center
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(center, center, center * 0.2);

    // Sparkle effects
    const sparkles = [
      { x: center - 10, y: center - 8, size: 2 },
      { x: center + 8, y: center - 12, size: 1.5 },
      { x: center - 6, y: center + 10, size: 1 },
      { x: center + 12, y: center + 6, size: 2.5 },
    ];

    sparkles.forEach((sparkle) => {
      g.fillStyle(0xffffff, 0.8);
      g.fillCircle(sparkle.x, sparkle.y, sparkle.size);
    });

    g.generateTexture(key, size, size);
    g.destroy();
  }
}
