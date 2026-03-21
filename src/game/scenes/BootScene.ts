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
    // Enhanced tile system with variations
    this.createTileTexture("tile_grass_a", 0x335f39, 0x15301a, 0x5b9a56);
    this.createTileTexture("tile_grass_a_var1", 0x2f5435, 0x132c18, 0x578f52);
    this.createTileTexture("tile_grass_a_var2", 0x37653d, 0x17321c, 0x5fa35a);

    this.createTileTexture("tile_grass_b", 0x2b5130, 0x142a17, 0x4d8649);
    this.createTileTexture("tile_grass_b_var1", 0x27492c, 0x122617, 0x497a45);
    this.createTileTexture("tile_grass_b_var2", 0x2f5934, 0x162e19, 0x51924d);

    this.createTileTexture("tile_meadow", 0x5b7d3f, 0x2e421d, 0x8fbe62);
    this.createTileTexture("tile_meadow_var1", 0x57773b, 0x2c3e1b, 0x8bb25e);
    this.createTileTexture("tile_meadow_var2", 0x5f8343, 0x304621, 0x93ca66);

    this.createTileTexture("tile_forest", 0x28462d, 0x102118, 0x52704d);
    this.createTileTexture("tile_forest_var1", 0x244029, 0x0e1d16, 0x4e6849);
    this.createTileTexture("tile_forest_var2", 0x2c4e31, 0x122519, 0x567851);

    this.createTileTexture("tile_moss", 0x42583a, 0x1f2d1e, 0x779566);
    this.createTileTexture("tile_moss_var1", 0x3e5236, 0x1d2b1c, 0x738962);
    this.createTileTexture("tile_moss_var2", 0x465e3e, 0x21311f, 0x7ba16a);

    this.createTileTexture("tile_dirt", 0x69533a, 0x342518, 0xa48761);
    this.createTileTexture("tile_dirt_var1", 0x654f36, 0x322318, 0xa0835d);
    this.createTileTexture("tile_dirt_var2", 0x6d573e, 0x36271a, 0xa88b65);

    this.createTileTexture("tile_path", 0x8f7c58, 0x463622, 0xb8a27c);
    this.createTileTexture("tile_path_var1", 0x8b7854, 0x443420, 0xb49e78);
    this.createTileTexture("tile_path_var2", 0x93805c, 0x483824, 0xbca680);

    this.createTileTexture("tile_cobble", 0x667071, 0x343a3b, 0xaab4b5);
    this.createTileTexture("tile_cobble_var1", 0x626c6d, 0x323839, 0xa6b0b1);
    this.createTileTexture("tile_cobble_var2", 0x6a7475, 0x363c3d, 0xaeb8b9);

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
    // Multi-layer grass blades with natural variation
    g.fillGradientStyle(highlight, highlight, base, shadow, 0.12);
    g.fillRect(0, 0, 96, 72);

    // Grass blade patterns - multiple sizes and orientations
    for (let layer = 0; layer < 3; layer++) {
      const opacity = 0.08 - layer * 0.02;
      const size = 4 + layer * 2;

      g.fillStyle(highlight, opacity);
      for (let x = 2 + layer * 3; x < 96; x += 12 + layer * 2) {
        for (let y = 2 + layer * 2; y < 72; y += 8 + layer) {
          const variation = Math.sin((x + y) * 0.1) * 2;
          g.fillEllipse(x + variation, y, size, size * 2);
        }
      }
    }

    // Natural color variation patches
    const patches = [
      { x: 20, y: 15, w: 25, h: 12 },
      { x: 65, y: 35, w: 18, h: 20 },
      { x: 10, y: 50, w: 30, h: 15 },
      { x: 75, y: 8, w: 15, h: 25 },
    ];

    patches.forEach((patch, i) => {
      const patchColor = i % 2 === 0 ? highlight : shadow;
      g.fillStyle(patchColor, 0.06);
      g.fillEllipse(patch.x, patch.y, patch.w, patch.h);
    });

    // Subtle directional wind effect
    g.lineStyle(1, highlight, 0.04);
    for (let i = 0; i < 8; i++) {
      const x = 10 + i * 12;
      const y = 10 + (i % 3) * 20;
      g.strokeLineShape(new Phaser.Geom.Line(x, y, x + 8, y - 3));
    }
  }

  private createMeadowTexture(
    g: Phaser.GameObjects.Graphics,
    base: number,
    shadow: number,
    highlight: number,
  ) {
    this.createGrassTexture(g, base, shadow, highlight);

    // Flower accents in meadow
    const flowerColors = [0xffe4e1, 0xe6e6fa, 0xf0e68c, 0xffc0cb];
    for (let i = 0; i < 12; i++) {
      const x = 8 + ((i * 17) % 88);
      const y = 8 + ((i * 23) % 56);
      const color = flowerColors[i % flowerColors.length];

      g.fillStyle(color, 0.6);
      g.fillCircle(x, y, 2);
      g.fillStyle(0xffffff, 0.8);
      g.fillCircle(x, y, 1);
    }
  }

  private createForestTexture(
    g: Phaser.GameObjects.Graphics,
    base: number,
    shadow: number,
    highlight: number,
  ) {
    // Dark forest floor with leaf litter
    g.fillGradientStyle(shadow, shadow, base, shadow, 0.3);
    g.fillRect(0, 0, 96, 72);

    // Leaf litter patterns
    const leafShapes = [];
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 96;
      const y = Math.random() * 72;
      const rotation = Math.random() * Math.PI * 2;

      g.fillStyle(highlight, 0.1 + Math.random() * 0.05);
      g.fillEllipse(x, y, 6, 3);
    }

    // Decomposing organic matter
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * 96;
      const y = Math.random() * 72;
      g.fillStyle(shadow, 0.15);
      g.fillCircle(x, y, 2 + Math.random() * 3);
    }

    // Subtle root patterns
    g.lineStyle(2, shadow, 0.08);
    for (let i = 0; i < 6; i++) {
      const startX = Math.random() * 96;
      const startY = Math.random() * 72;
      const endX = startX + (Math.random() - 0.5) * 30;
      const endY = startY + (Math.random() - 0.5) * 20;
      g.strokeLineShape(new Phaser.Geom.Line(startX, startY, endX, endY));
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
    // Worn dirt path with natural variation
    g.fillGradientStyle(base, base, shadow, highlight, 0.15);
    g.fillRect(0, 0, 96, 72);

    // Pebbles and small stones
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * 96;
      const y = Math.random() * 72;
      const size = 1 + Math.random() * 3;
      const brightness = Math.random() > 0.5 ? highlight : shadow;

      g.fillStyle(brightness, 0.3 + Math.random() * 0.2);
      g.fillCircle(x, y, size);
    }

    // Erosion patterns and ruts
    for (let i = 0; i < 8; i++) {
      const startX = Math.random() * 96;
      const startY = Math.random() * 72;
      const length = 15 + Math.random() * 25;
      const angle = (Math.random() - 0.5) * 0.5; // Mostly horizontal ruts

      g.lineStyle(3, shadow, 0.1);
      g.strokeLineShape(
        new Phaser.Geom.Line(
          startX,
          startY,
          startX + Math.cos(angle) * length,
          startY + Math.sin(angle) * length,
        ),
      );
    }

    // Compressed earth texture
    for (let x = 0; x < 96; x += 8) {
      for (let y = 0; y < 72; y += 6) {
        if (Math.random() < 0.3) {
          g.fillStyle(shadow, 0.05);
          g.fillRect(x, y, 6, 4);
        }
      }
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
    // Cobblestone base with mortar
    g.fillStyle(shadow, 1).fillRect(0, 0, 96, 72);

    // Individual cobblestones in grid pattern
    const cobbleSize = 12;
    const mortarWidth = 2;

    for (let x = 0; x < 96; x += cobbleSize + mortarWidth) {
      for (let y = 0; y < 72; y += cobbleSize + mortarWidth) {
        const offsetX =
          (y / (cobbleSize + mortarWidth)) % 2 === 0
            ? 0
            : (cobbleSize + mortarWidth) / 2;
        const cobbleX = x + offsetX;

        if (cobbleX + cobbleSize <= 96) {
          // Main cobblestone
          g.fillStyle(base, 1);
          g.fillRoundedRect(cobbleX, y, cobbleSize, cobbleSize, 2);

          // Cobblestone highlight
          g.fillStyle(highlight, 0.3);
          g.fillRoundedRect(
            cobbleX + 1,
            y + 1,
            cobbleSize - 3,
            cobbleSize - 3,
            1,
          );

          // Wear patterns
          g.fillStyle(shadow, 0.2);
          g.fillCircle(
            cobbleX + cobbleSize / 2,
            y + cobbleSize / 2,
            cobbleSize / 4,
          );

          // Individual stone character
          if (Math.random() < 0.4) {
            g.fillStyle(highlight, 0.15);
            g.fillRect(cobbleX + 2, y + 2, 3, cobbleSize - 4);
          }
        }
      }
    }
  }

  private createWaterTexture(
    g: Phaser.GameObjects.Graphics,
    base: number,
    shadow: number,
    highlight: number,
  ) {
    // Water base with depth gradients
    g.fillGradientStyle(shadow, base, highlight, base, 0.8);
    g.fillRect(0, 0, 96, 72);

    // Caustic light patterns
    const causticRings = [
      { x: 20, y: 18, r: 8, intensity: 0.3 },
      { x: 45, y: 35, r: 12, intensity: 0.25 },
      { x: 70, y: 20, r: 6, intensity: 0.35 },
      { x: 25, y: 55, r: 10, intensity: 0.2 },
      { x: 65, y: 50, r: 7, intensity: 0.4 },
    ];

    causticRings.forEach((ring) => {
      // Outer caustic ring
      g.lineStyle(2, highlight, ring.intensity * 0.6);
      g.strokeCircle(ring.x, ring.y, ring.r);

      // Inner bright spot
      g.fillStyle(highlight, ring.intensity);
      g.fillCircle(ring.x, ring.y, ring.r * 0.3);

      // Ripple effects
      g.lineStyle(1, highlight, ring.intensity * 0.3);
      g.strokeCircle(ring.x, ring.y, ring.r * 1.5);
    });

    // Flowing water streaks
    for (let i = 0; i < 6; i++) {
      const startX = Math.random() * 96;
      const startY = Math.random() * 72;
      const flow = 20 + Math.random() * 30;

      g.lineStyle(2, highlight, 0.1 + Math.random() * 0.1);
      g.strokeLineShape(
        new Phaser.Geom.Line(
          startX,
          startY,
          startX + flow * 0.3,
          startY + flow * 0.7,
        ),
      );
    }

    // Surface reflections
    for (let x = 10; x < 96; x += 15) {
      for (let y = 10; y < 72; y += 12) {
        if (Math.random() < 0.4) {
          g.fillStyle(highlight, 0.15);
          g.fillEllipse(x, y, 8, 3);
        }
      }
    }
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
    _leafColor?: number,
    _trunkColor?: number,
  ) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    // Enhanced shadow with depth
    g.fillGradientStyle(0x0a0f10, 0x1a1f20, 0x0a0f10, 0x0a0f10, 0.3);
    g.fillEllipse(32, 52, 40, 12);

    // Enhanced trunk with bark texture
    g.fillGradientStyle(0x4b2f18, 0x5c3a21, 0x3a2412, 0x4b2f18, 1);
    g.fillRect(26, 30, 12, 24);

    // Bark texture details
    for (let i = 0; i < 8; i++) {
      const y = 32 + i * 3;
      g.lineStyle(1, 0x3a2412, 0.8);
      g.strokeLineShape(new Phaser.Geom.Line(27, y, 37, y + 1));
    }

    // Vertical bark lines
    g.lineStyle(1, 0x5c3a21, 0.6);
    g.strokeLineShape(new Phaser.Geom.Line(29, 30, 29, 54));
    g.strokeLineShape(new Phaser.Geom.Line(35, 30, 35, 54));

    // Tree roots
    g.fillStyle(0x3a2412, 0.8);
    g.fillEllipse(22, 52, 8, 4);
    g.fillEllipse(42, 52, 8, 4);
    g.fillEllipse(32, 54, 6, 3);

    // Enhanced multi-layer canopy
    // Base canopy layer - darkest
    g.fillGradientStyle(0x173a25, 0x1f4a2d, 0x0f2b1a, 0x173a25, 1);
    g.fillEllipse(32, 24, 42, 28);

    // Secondary canopy layers with varying opacity
    g.fillStyle(0x234b30, 0.96);
    g.fillEllipse(20, 26, 24, 22);
    g.fillStyle(0x295736, 0.92);
    g.fillEllipse(42, 24, 28, 22);

    // Upper canopy layers
    g.fillStyle(0x3d704a, 0.88);
    g.fillEllipse(28, 16, 26, 18);
    g.fillStyle(0x4e8758, 0.78);
    g.fillEllipse(40, 14, 18, 10);

    // Highlight clusters - sunlight through leaves
    g.fillStyle(0x6ba366, 0.35);
    g.fillEllipse(25, 20, 8, 6);
    g.fillEllipse(38, 18, 6, 4);
    g.fillEllipse(32, 22, 10, 7);

    // Bright leaf highlights
    g.fillStyle(0x93ca91, 0.25);
    g.fillEllipse(28, 14, 12, 6);
    g.fillEllipse(36, 16, 8, 5);

    // Individual leaf details
    for (let i = 0; i < 15; i++) {
      const angle = (i / 15) * Math.PI * 2;
      const distance = 12 + Math.random() * 8;
      const x = 32 + Math.cos(angle) * distance;
      const y = 24 + Math.sin(angle) * distance * 0.6;

      g.fillStyle(0x4e8758, 0.3 + Math.random() * 0.2);
      g.fillEllipse(x, y, 3, 5);
    }

    g.generateTexture(key, 64, 64);
    g.destroy();
  }

  private createRockTexture(key: string, _scale?: number) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    // Enhanced shadow with multiple layers
    g.fillGradientStyle(0x0a0f10, 0x1a1f20, 0x0a0f10, 0x0a0f10, 0.25);
    g.fillEllipse(32, 42, 28, 10);

    // Main rock with layered stone appearance
    g.fillGradientStyle(0x6d766a, 0x7e8775, 0x5c655a, 0x6d766a, 1);
    g.fillEllipse(32, 36, 28, 18);

    // Rock stratification layers
    g.fillStyle(0x5c655a, 0.8);
    g.fillEllipse(32, 38, 24, 3);
    g.fillEllipse(32, 42, 20, 3);

    // Weathering highlights
    g.fillStyle(0x868f82, 0.84);
    g.fillEllipse(28, 33, 12, 7);
    g.fillEllipse(36, 35, 10, 5);

    // Moss patches on rock
    g.fillStyle(0x4a6b3a, 0.6);
    g.fillEllipse(24, 34, 6, 4);
    g.fillEllipse(38, 37, 4, 3);
    g.fillEllipse(30, 40, 5, 3);

    // Rock texture details - cracks and weathering
    g.lineStyle(1, 0x5c655a, 0.7);
    g.strokeLineShape(new Phaser.Geom.Line(22, 32, 30, 38));
    g.strokeLineShape(new Phaser.Geom.Line(34, 30, 40, 36));
    g.strokeLineShape(new Phaser.Geom.Line(26, 40, 35, 42));

    // Bright mineral veins
    g.lineStyle(1, 0xaeb7ab, 0.4);
    g.strokeLineShape(new Phaser.Geom.Line(25, 35, 32, 33));
    g.strokeLineShape(new Phaser.Geom.Line(36, 34, 42, 37));

    // Small pebbles around base
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x = 32 + Math.cos(angle) * 18;
      const y = 42 + Math.sin(angle) * 6;

      g.fillStyle(0x6d766a, 0.7);
      g.fillCircle(x, y, 1 + Math.random() * 2);
    }

    // Bright highlight on top
    g.fillStyle(0xaeb7ab, 0.3);
    g.fillEllipse(30, 29, 8, 4);

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
