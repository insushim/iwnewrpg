import * as Phaser from "phaser";
import { useGameStore } from "@/lib/gameStore";
import { CharacterClass } from "@/types/game";

const CW = 218;
const CH = 366;
const PH = 146;
const GAP = 20;
const CA = 16;

const STAT_KEYS = ["STR", "AGI", "INT", "VIT"] as const;

const JOBS = [
  {
    id: CharacterClass.SOVEREIGN,
    label: "소버린",
    sub: "SOVEREIGN",
    desc: ["폭발적인 일격과 돌파력", "왕실 검술로 전열을 지휘"],
    sym: "S",
    col: 0xd8bb6c,
    dark: 0x1a1304,
    stats: [9, 5, 4, 8],
  },
  {
    id: CharacterClass.GUARDIAN,
    label: "가디언",
    sub: "GUARDIAN",
    desc: ["압도적인 생존력과 방호", "안정적인 근접 유지력"],
    sym: "G",
    col: 0x7ec7ff,
    dark: 0x08111c,
    stats: [7, 5, 5, 9],
  },
  {
    id: CharacterClass.RANGER,
    label: "레인저",
    sub: "RANGER",
    desc: ["기동성과 원거리 화력", "연속 사격과 추적에 특화"],
    sym: "R",
    col: 0x85d79a,
    dark: 0x071309,
    stats: [6, 9, 6, 5],
  },
  {
    id: CharacterClass.ARCANIST,
    label: "아르카니스트",
    sub: "ARCANIST",
    desc: ["광역 제압과 비전 폭딜", "강력한 주문 운용"],
    sym: "A",
    col: 0xd59cff,
    dark: 0x12071b,
    stats: [4, 6, 10, 4],
  },
] as const;

type JobConfig = (typeof JOBS)[number];

export class CharacterCreateScene extends Phaser.Scene {
  private selectedServerIndex = 0;
  private selectedGrade = 3;
  private nameBuffer = "견습 모험가";
  private pendingJob: JobConfig | null = null;
  private gateOverlay?: Phaser.GameObjects.Container;
  private nameInputEl: HTMLInputElement | null = null;
  private readonly servers = ["아스카론 01"];
  private readonly grades = [
    { value: 3, label: "3학년", desc: "기초 단어 500개" },
    { value: 4, label: "4학년", desc: "기초+중급 700개" },
    { value: 5, label: "5학년", desc: "중급+고급 900개" },
    { value: 6, label: "6학년", desc: "전체 1300개" },
  ];

  constructor() {
    super("CharacterCreateScene");
  }

  create() {
    const { width, height } = this.scale;
    this.buildBackground(width, height);
    this.buildTitle(width, height);
    this.buildCards(width, height);
    this.buildFooter(width, height);
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  private buildBackground(w: number, h: number) {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x040810, 0x040810, 0x090512, 0x090512, 1);
    bg.fillRect(0, 0, w, h);
    bg.fillStyle(0xffffff, 0.02);
    for (let x = 0; x < w; x += 24) {
      for (let y = 0; y < h; y += 24) {
        bg.fillRect(x + ((y / 24) % 2) * 2, y, 1, 1);
      }
    }

    const haze = this.add.graphics();
    haze.fillStyle(0xd8bb6c, 0.08);
    haze.fillCircle(w * 0.22, h * 0.18, 220);
    haze.fillStyle(0x6a94ff, 0.08);
    haze.fillCircle(w * 0.82, h * 0.22, 240);
    haze.fillStyle(0x4fd0a5, 0.06);
    haze.fillCircle(w * 0.52, h * 0.82, 280);

    const grid = this.add.graphics();
    grid.lineStyle(1, 0x121a24, 0.65);
    for (let y = 0; y < h; y += 46) {
      grid.moveTo(0, y);
      grid.lineTo(w, y);
    }
    for (let x = 0; x < w; x += 64) {
      grid.moveTo(x, 0);
      grid.lineTo(x, h);
    }
    grid.strokePath();

    for (let i = 0; i < 70; i += 1) {
      const px = Phaser.Math.Between(0, w);
      const py = Phaser.Math.Between(0, h);
      const r = Phaser.Math.FloatBetween(0.5, 2);
      const a = Phaser.Math.FloatBetween(0.08, 0.5);
      const dot = this.add.graphics();
      dot.fillStyle(0xffffff, 1);
      dot.fillCircle(px, py, r);
      dot.setAlpha(a);
      this.tweens.add({
        targets: dot,
        alpha: { from: a, to: a * 0.12 },
        duration: Phaser.Math.Between(1800, 5200),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
        delay: Phaser.Math.Between(0, 2400),
      });
    }

    const vignetteTop = this.add.graphics();
    vignetteTop.fillGradientStyle(
      0x000000,
      0x000000,
      0x000000,
      0x000000,
      0.68,
      0.68,
      0,
      0,
    );
    vignetteTop.fillRect(0, 0, w, h * 0.24);

    const vignetteBottom = this.add.graphics();
    vignetteBottom.fillGradientStyle(
      0x000000,
      0x000000,
      0x000000,
      0x000000,
      0,
      0,
      0.6,
      0.6,
    );
    vignetteBottom.fillRect(0, h * 0.72, w, h * 0.28);

    const frame = this.add.graphics();
    frame.lineStyle(2, 0x8e7540, 0.22);
    frame.strokeRoundedRect(18, 18, w - 36, h - 36, 28);
    frame.lineStyle(1, 0xffffff, 0.06);
    frame.strokeRoundedRect(30, 30, w - 60, h - 60, 22);

    const ribbonLeft = this.add.graphics();
    ribbonLeft.fillStyle(0xd8bb6c, 0.08);
    ribbonLeft.fillTriangle(0, h * 0.16, 180, h * 0.2, 0, h * 0.24);
    const ribbonRight = this.add.graphics();
    ribbonRight.fillStyle(0x7ec7ff, 0.06);
    ribbonRight.fillTriangle(w, h * 0.12, w - 200, h * 0.18, w, h * 0.26);
  }

  private buildTitle(w: number, h: number) {
    const ty = h * 0.11;

    const deco = this.add.graphics();
    deco.lineStyle(1, 0x8e7540, 0.9);
    deco.lineBetween(w / 2 - 320, ty, w / 2 - 112, ty);
    deco.lineBetween(w / 2 + 112, ty, w / 2 + 320, ty);
    deco.lineStyle(1, 0x4b3915, 0.45);
    deco.lineBetween(w / 2 - 338, ty + 9, w / 2 - 112, ty + 9);
    deco.lineBetween(w / 2 + 112, ty + 9, w / 2 + 338, ty + 9);

    const diamonds = this.add.graphics();
    diamonds.fillStyle(0xd8bb6c, 1);
    diamonds.fillRect(w / 2 - 102, ty - 4, 8, 8);
    diamonds.fillRect(w / 2 + 94, ty - 4, 8, 8);
    diamonds.fillStyle(0x6a94ff, 0.85);
    diamonds.fillCircle(w / 2, ty - 2, 3);

    this.add
      .text(w / 2, ty - 24, "CHRONICLE GATE", {
        color: "#9f8253",
        fontSize: "11px",
      })
      .setOrigin(0.5);

    this.add
      .text(w / 2, ty + 4, "직업 선택", {
        color: "#f2d98a",
        fontFamily: "serif",
        fontSize: "40px",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setShadow(0, 0, "#c0860a", 18, false, true);

    this.add
      .text(
        w / 2,
        ty + 40,
        "실제 클래스 atlas를 확인하고 전장으로 진입하십시오",
        {
          color: "#6f8195",
          fontSize: "13px",
        },
      )
      .setOrigin(0.5);

    const underline = this.add.graphics();
    underline.fillStyle(0xf2d98a, 0.18);
    underline.fillRoundedRect(w / 2 - 140, ty + 58, 280, 4, 3);
  }

  private buildCards(w: number, h: number) {
    const totalW = JOBS.length * CW + (JOBS.length - 1) * GAP;
    const x0 = (w - totalW) / 2 + CW / 2;
    const cy = h * 0.53;

    JOBS.forEach((job, index) => {
      this.buildCard(x0 + index * (CW + GAP), cy, job, index);
    });
  }

  private buildCard(cx: number, finalY: number, job: JobConfig, idx: number) {
    const card = this.add.container(cx, finalY + 34).setAlpha(0);
    const hex = `#${job.col.toString(16).padStart(6, "0")}`;

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.55);
    shadow.fillRoundedRect(-CW / 2 + 8, -CH / 2 + 8, CW, CH, 18);
    card.add(shadow);

    const base = this.add.graphics();
    base.fillStyle(0x090d15, 1);
    base.fillRoundedRect(-CW / 2, -CH / 2, CW, CH, 18);
    base.fillStyle(job.dark, 1);
    base.fillRoundedRect(-CW / 2, -CH / 2, CW, PH, 18);
    base.fillRect(-CW / 2, -CH / 2 + PH - 14, CW, 14);
    base.lineStyle(1, job.col, 0.28);
    base.strokeRoundedRect(-CW / 2, -CH / 2, CW, CH, 18);
    base.lineBetween(-CW / 2 + 12, -CH / 2 + PH, CW / 2 - 12, -CH / 2 + PH);
    card.add(base);

    const corners = this.add.graphics();
    corners.lineStyle(2, job.col, 1);
    corners.lineBetween(-CW / 2 + 2, -CH / 2 + CA, -CW / 2 + 2, -CH / 2 + 2);
    corners.lineBetween(-CW / 2 + 2, -CH / 2 + 2, -CW / 2 + CA, -CH / 2 + 2);
    corners.lineBetween(CW / 2 - CA, -CH / 2 + 2, CW / 2 - 2, -CH / 2 + 2);
    corners.lineBetween(CW / 2 - 2, -CH / 2 + 2, CW / 2 - 2, -CH / 2 + CA);
    corners.lineBetween(-CW / 2 + 2, CH / 2 - CA, -CW / 2 + 2, CH / 2 - 2);
    corners.lineBetween(-CW / 2 + 2, CH / 2 - 2, -CW / 2 + CA, CH / 2 - 2);
    corners.lineBetween(CW / 2 - CA, CH / 2 - 2, CW / 2 - 2, CH / 2 - 2);
    corners.lineBetween(CW / 2 - 2, CH / 2 - CA, CW / 2 - 2, CH / 2 - 2);
    card.add(corners);

    const glowBorder = this.add.graphics().setAlpha(0);
    glowBorder.lineStyle(2, job.col, 0.9);
    glowBorder.strokeRoundedRect(-CW / 2, -CH / 2, CW, CH, 18);
    card.add(glowBorder);

    const portraitGlow = this.add.graphics().setAlpha(0);
    portraitGlow.fillStyle(job.col, 0.09);
    portraitGlow.fillRoundedRect(-CW / 2 + 4, -CH / 2 + 4, CW - 8, PH - 8, 16);
    card.add(portraitGlow);

    const portraitAura = this.add.graphics();
    portraitAura.fillStyle(job.col, 0.1);
    portraitAura.fillCircle(0, -CH / 2 + PH / 2 + 2, 50);
    card.add(portraitAura);

    const portraitHalo = this.add.graphics();
    portraitHalo.lineStyle(2, job.col, 0.18);
    portraitHalo.strokeEllipse(0, -CH / 2 + PH / 2 + 6, 126, 126);
    portraitHalo.lineStyle(1, 0xffffff, 0.08);
    portraitHalo.strokeEllipse(0, -CH / 2 + PH / 2 + 6, 96, 96);
    card.add(portraitHalo);

    const sym = this.add
      .text(0, -CH / 2 + 28, job.sym, {
        color: hex,
        fontFamily: "serif",
        fontSize: "56px",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setAlpha(0.34);
    card.add(sym);

    const preview = this.buildAnimatedPreview(job, 0, -CH / 2 + PH / 2 + 22);
    card.add(preview);

    const nameY = -CH / 2 + PH + 24;
    const nameText = this.add
      .text(0, nameY, job.label, {
        color: "#f1e6cf",
        fontFamily: "serif",
        fontSize: "20px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    card.add(nameText);

    card.add(
      this.add
        .text(0, nameY + 22, job.sub, {
          color: hex,
          fontSize: "9px",
        })
        .setOrigin(0.5)
        .setAlpha(0.72),
    );

    const statX0 = -CW / 2 + 15;
    const barX0 = statX0 + 30;
    const barW = CW - 62;
    const statY0 = nameY + 56;
    const statGap = 18;

    STAT_KEYS.forEach((key, statIndex) => {
      const sy = statY0 + statIndex * statGap;
      const pct = job.stats[statIndex] / 10;

      card.add(
        this.add
          .text(statX0, sy, key, {
            color: "#5f7388",
            fontSize: "9px",
          })
          .setOrigin(0, 0.5),
      );

      const track = this.add.graphics();
      track.fillStyle(0x141c28, 1);
      track.fillRoundedRect(barX0, sy - 4, barW, 7, 4);
      card.add(track);

      const fill = this.add.graphics();
      fill.fillStyle(job.col, 0.72);
      fill.fillRoundedRect(barX0, sy - 4, barW * pct, 7, 4);
      fill.fillStyle(0xffffff, 0.14);
      fill.fillRoundedRect(
        barX0 + 1,
        sy - 3,
        Math.max(8, barW * pct - 2),
        2,
        2,
      );
      card.add(fill);
    });

    const descY = statY0 + 4 * statGap + 18;
    const rule = this.add.graphics();
    rule.lineStyle(1, job.col, 0.16);
    rule.lineBetween(-CW / 2 + 20, descY - 10, CW / 2 - 20, descY - 10);
    card.add(rule);

    job.desc.forEach((line, lineIndex) => {
      card.add(
        this.add
          .text(0, descY + lineIndex * 16, line, {
            color: "#748397",
            fontSize: "11px",
          })
          .setOrigin(0.5),
      );
    });

    const prompt = this.add
      .text(0, CH / 2 - 24, "클릭하여 전장으로 진입", {
        color: "#9f845a",
        fontSize: "10px",
      })
      .setOrigin(0.5)
      .setAlpha(0.78);
    card.add(prompt);

    const hit = this.add
      .rectangle(0, 0, CW, CH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    card.add(hit);

    this.tweens.add({
      targets: card,
      alpha: 1,
      y: finalY,
      duration: 520,
      ease: "Back.easeOut",
      delay: 80 + idx * 90,
    });

    hit.on("pointerover", () => {
      this.tweens.killTweensOf(card);
      this.tweens.add({
        targets: card,
        scaleX: 1.045,
        scaleY: 1.045,
        y: finalY - 8,
        duration: 160,
        ease: "Sine.easeOut",
      });
      glowBorder.setAlpha(1);
      portraitGlow.setAlpha(1);
      sym.setAlpha(0.5);
      nameText.setStyle({ color: "#ffffff" });
      prompt.setColor("#f3d18b");
      preview.setScale(1.08);
    });

    hit.on("pointerout", () => {
      this.tweens.killTweensOf(card);
      this.tweens.add({
        targets: card,
        scaleX: 1,
        scaleY: 1,
        y: finalY,
        duration: 200,
        ease: "Sine.easeOut",
      });
      glowBorder.setAlpha(0);
      portraitGlow.setAlpha(0);
      sym.setAlpha(0.34);
      nameText.setStyle({ color: "#f1e6cf" });
      prompt.setColor("#9f845a");
      preview.setScale(1);
    });

    hit.on("pointerdown", () => {
      this.openGateOverlay(job);
    });
  }

  private buildAnimatedPreview(job: JobConfig, x: number, y: number) {
    const container = this.add.container(x, y);
    const baseKey = this.resolveClassBase(job.id);
    const frames = [
      `${baseKey}_idle_s_0`,
      `${baseKey}_idle_s_1`,
      `${baseKey}_walk_s_0`,
      `${baseKey}_walk_s_1`,
      `${baseKey}_walk_s_2`,
      `${baseKey}_walk_s_3`,
      `${baseKey}_attack_s_1`,
      `${baseKey}_attack_s_2`,
    ].filter((key) => this.textures.exists(key));

    const glow = this.add.graphics();
    glow.fillStyle(job.col, 0.18);
    glow.fillEllipse(0, 4, 76, 46);
    container.add(glow);

    const pedestal = this.add.graphics();
    pedestal.fillStyle(0x000000, 0.32);
    pedestal.fillEllipse(0, 42, 46, 12);
    pedestal.lineStyle(1, job.col, 0.24);
    pedestal.strokeEllipse(0, 42, 46, 12);
    container.add(pedestal);

    if (frames.length === 0) {
      const fallback = this.add
        .text(0, 6, job.sym, {
          color: `#${job.col.toString(16).padStart(6, "0")}`,
          fontFamily: "serif",
          fontSize: "54px",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      container.add(fallback);
      return container;
    }

    const sprite = this.add.image(0, 8, frames[0]).setScale(0.86);
    container.add(sprite);

    const shine = this.add.graphics();
    shine.fillStyle(0xffffff, 0.12);
    shine.fillEllipse(0, -14, 30, 12);
    container.add(shine);

    let frameIndex = 0;
    this.time.addEvent({
      delay: 180,
      loop: true,
      callback: () => {
        if (!sprite.active) return;
        frameIndex = (frameIndex + 1) % frames.length;
        sprite.setTexture(frames[frameIndex]);
      },
    });

    this.tweens.add({
      targets: container,
      y: y - 2,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    return container;
  }

  private resolveClassBase(characterClass: CharacterClass) {
    if (characterClass === CharacterClass.RANGER) {
      return "anim_player_ranger";
    }
    if (characterClass === CharacterClass.ARCANIST) {
      return "anim_player_arcanist";
    }
    if (characterClass === CharacterClass.SOVEREIGN) {
      return "anim_player_sovereign";
    }
    return "anim_player_guardian";
  }

  private buildFooter(w: number, h: number) {
    const fy = h * 0.92;
    const dots = this.add.graphics();
    dots.fillStyle(0x324255, 0.72);
    [-2, -1, 0, 1, 2].forEach((n) =>
      dots.fillCircle(w / 2 + n * 14, fy - 16, 1.5),
    );

    this.add
      .text(
        w / 2,
        fy,
        "선택한 클래스는 장비 성향과 전투 감각에 직접적인 영향을 줍니다",
        {
          color: "#415468",
          fontSize: "12px",
        },
      )
      .setOrigin(0.5);
  }

  private openGateOverlay(job: JobConfig) {
    this.pendingJob = job;
    this.gateOverlay?.destroy();

    const { width, height } = this.scale;
    const overlay = this.add.container(0, 0);
    overlay.setDepth(2000);

    const backdrop = this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.64)
      .setInteractive();
    overlay.add(backdrop);

    const panelWidth = 460;
    const panelHeight = 480;
    const px = width / 2;
    const py = height / 2;

    const panel = this.add.graphics();
    panel.fillStyle(0x0a0f17, 0.96);
    panel.fillRoundedRect(
      px - panelWidth / 2,
      py - panelHeight / 2,
      panelWidth,
      panelHeight,
      24,
    );
    panel.lineStyle(2, 0xb48a46, 0.52);
    panel.strokeRoundedRect(
      px - panelWidth / 2,
      py - panelHeight / 2,
      panelWidth,
      panelHeight,
      24,
    );
    panel.lineStyle(1, job.col, 0.22);
    panel.strokeRoundedRect(
      px - panelWidth / 2 + 8,
      py - panelHeight / 2 + 8,
      panelWidth - 16,
      panelHeight - 16,
      20,
    );
    overlay.add(panel);

    const shimmer = this.add.graphics();
    shimmer.fillStyle(0xf4d184, 0.06);
    shimmer.fillEllipse(px, py - panelHeight / 2 + 48, panelWidth - 60, 72);
    overlay.add(shimmer);

    overlay.add(
      this.add
        .text(px, py - 134, "ENTRY PROTOCOL", {
          color: "#a48558",
          fontSize: "11px",
        })
        .setOrigin(0.5),
    );
    overlay.add(
      this.add
        .text(px, py - 102, "전장 진입 준비", {
          color: "#f2e4c2",
          fontFamily: "serif",
          fontSize: "30px",
          fontStyle: "bold",
        })
        .setOrigin(0.5),
    );
    overlay.add(
      this.add
        .text(px, py - 72, `${job.label} 클래스로 전장에 입장합니다`, {
          color: "#8392a6",
          fontSize: "13px",
        })
        .setOrigin(0.5),
    );

    const preview = this.buildAnimatedPreview(job, px - 150, py - 8);
    preview.setScale(1.12);
    overlay.add(preview);

    const classBadge = this.add
      .text(px - 150, py + 58, job.sub, {
        color: `#${job.col.toString(16).padStart(6, "0")}`,
        fontSize: "10px",
      })
      .setOrigin(0.5);
    overlay.add(classBadge);

    const serverLabel = this.add
      .text(px - 26, py - 34, "서버 선택", {
        color: "#b79660",
        fontSize: "12px",
      })
      .setOrigin(0, 0.5);
    overlay.add(serverLabel);

    const serverButtons: Phaser.GameObjects.Text[] = [];
    this.servers.forEach((server, index) => {
      const button = this.add
        .text(px - 26, py - 2 + index * 34, server, {
          color: index === this.selectedServerIndex ? "#140d04" : "#f2e4c2",
          fontSize: "13px",
          backgroundColor:
            index === this.selectedServerIndex
              ? "#dfbe73"
              : "rgba(255,255,255,0.04)",
          padding: { left: 12, right: 12, top: 8, bottom: 8 },
        })
        .setOrigin(0, 0.5)
        .setInteractive({ useHandCursor: true });
      button.on("pointerdown", () => {
        this.selectedServerIndex = index;
        serverButtons.forEach((entry, entryIndex) => {
          entry.setColor(
            entryIndex === this.selectedServerIndex ? "#140d04" : "#f2e4c2",
          );
          entry.setBackgroundColor(
            entryIndex === this.selectedServerIndex
              ? "#dfbe73"
              : "rgba(255,255,255,0.04)",
          );
        });
      });
      serverButtons.push(button);
      overlay.add(button);
    });

    // ── 학년 선택 ──
    const gradeLabel = this.add
      .text(px - 26, py + 38, "학년 선택 (영어 단어 난이도)", {
        color: "#b79660",
        fontSize: "12px",
      })
      .setOrigin(0, 0.5);
    overlay.add(gradeLabel);

    const gradeButtons: Phaser.GameObjects.Text[] = [];
    this.grades.forEach((g, index) => {
      const bx = px - 26 + index * 90;
      const isSelected = g.value === this.selectedGrade;
      const btn = this.add
        .text(bx, py + 68, `${g.label}`, {
          color: isSelected ? "#140d04" : "#f2e4c2",
          fontSize: "13px",
          backgroundColor: isSelected ? "#dfbe73" : "rgba(255,255,255,0.04)",
          padding: { left: 8, right: 8, top: 6, bottom: 6 },
        })
        .setOrigin(0, 0.5)
        .setInteractive({ useHandCursor: true });
      btn.on("pointerdown", () => {
        this.selectedGrade = g.value;
        gradeButtons.forEach((entry, entryIndex) => {
          const sel = this.grades[entryIndex].value === this.selectedGrade;
          entry.setColor(sel ? "#140d04" : "#f2e4c2");
          entry.setBackgroundColor(sel ? "#dfbe73" : "rgba(255,255,255,0.04)");
        });
      });
      gradeButtons.push(btn);
      overlay.add(btn);
    });

    const gradeDesc = this.add
      .text(
        px - 26,
        py + 94,
        "학년이 높을수록 더 많은 영어 단어가 출제됩니다",
        {
          color: "#5a6a7d",
          fontSize: "10px",
        },
      )
      .setOrigin(0, 0.5);
    overlay.add(gradeDesc);

    const nameLabel = this.add
      .text(px - 26, py + 120, "닉네임", {
        color: "#b79660",
        fontSize: "12px",
      })
      .setOrigin(0, 0.5);
    overlay.add(nameLabel);

    const inputBg = this.add.graphics();
    inputBg.fillStyle(0x05070b, 0.86);
    inputBg.fillRoundedRect(px - 26, py + 134, 184, 46, 14);
    inputBg.lineStyle(1, 0xffffff, 0.1);
    inputBg.strokeRoundedRect(px - 26, py + 134, 184, 46, 14);
    overlay.add(inputBg);

    // nameText는 DOM input 뒤에 숨어 있으므로 placeholder 역할만 함
    const nameText = this.add
      .text(px - 12, py + 157, "", { color: "#f2e4c2", fontSize: "18px" })
      .setOrigin(0, 0.5)
      .setAlpha(0);
    overlay.add(nameText);

    const guideText = this.add
      .text(px - 26, py + 190, "한글, 영문, 숫자 2-12자", {
        color: "#708196",
        fontSize: "11px",
      })
      .setOrigin(0, 0.5);
    overlay.add(guideText);

    const cancelButton = this.add
      .text(px - 26, py + 216, "취소", {
        color: "#f2e4c2",
        fontSize: "14px",
        backgroundColor: "rgba(255,255,255,0.06)",
        padding: { left: 18, right: 18, top: 10, bottom: 10 },
      })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    cancelButton.on("pointerdown", () => this.closeGateOverlay());
    overlay.add(cancelButton);

    const enterButton = this.add
      .text(px + 56, py + 216, "입장", {
        color: "#140d04",
        fontSize: "14px",
        fontStyle: "bold",
        backgroundColor: "#dfbe73",
        padding: { left: 22, right: 22, top: 10, bottom: 10 },
      })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    enterButton.on("pointerdown", () => this.confirmEntry());
    overlay.add(enterButton);

    // ── DOM input: Phaser inputBg 위에 투명하게 띄워 커서·IME 모두 정상 동작 ──
    const canvas = this.game.canvas;
    const cr = canvas.getBoundingClientRect();
    const sx = cr.width / this.scale.width;
    const sy = cr.height / this.scale.height;

    const inputEl = document.createElement("input");
    inputEl.type = "text";
    inputEl.value = this.nameBuffer;
    inputEl.maxLength = 12;
    inputEl.placeholder = "닉네임 입력";
    Object.assign(inputEl.style, {
      position: "fixed",
      left: `${cr.left + (px - 26 + 10) * sx}px`,
      top: `${cr.top + (py + 134 + 11) * sy}px`,
      width: `${164 * sx}px`,
      height: `${26 * sy}px`,
      fontSize: `${Math.max(12, Math.round(15 * sy))}px`,
      color: "#f2e4c2",
      caretColor: "#dfbe73",
      background: "transparent",
      border: "none",
      outline: "none",
      padding: "0",
      margin: "0",
      fontFamily: "sans-serif",
      zIndex: "10000",
      boxSizing: "border-box",
    });
    document.body.appendChild(inputEl);
    this.nameInputEl = inputEl;
    setTimeout(() => inputEl.focus(), 50);

    // 한글 IME 조합 중에는 value를 건드리지 않아야 조합이 끊기지 않음
    let isComposing = false;
    inputEl.addEventListener("compositionstart", () => {
      isComposing = true;
    });
    inputEl.addEventListener("compositionend", () => {
      isComposing = false;
      const filtered = inputEl.value
        .replace(/[^0-9A-Za-z가-힣 ]/g, "")
        .slice(0, 12);
      inputEl.value = filtered;
      this.nameBuffer = filtered;
    });
    inputEl.addEventListener("input", () => {
      if (isComposing) return;
      const filtered = inputEl.value
        .replace(/[^0-9A-Za-z가-힣 ]/g, "")
        .slice(0, 12);
      inputEl.value = filtered;
      this.nameBuffer = filtered;
    });
    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.confirmEntry();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        this.closeGateOverlay();
      }
    });

    overlay.once(Phaser.GameObjects.Events.DESTROY, () => {
      inputEl.remove();
      this.nameInputEl = null;
    });

    this.gateOverlay = overlay;
  }

  private closeGateOverlay() {
    this.pendingJob = null;
    this.nameInputEl?.remove();
    this.nameInputEl = null;
    this.gateOverlay?.destroy();
    this.gateOverlay = undefined;
  }

  private confirmEntry() {
    if (!this.pendingJob) {
      return;
    }

    const trimmedName = this.nameBuffer.trim();
    if (trimmedName.length < 2) {
      return;
    }

    const store = useGameStore.getState();
    const serverName = this.servers[this.selectedServerIndex];

    localStorage.setItem(
      "iwnewrpg_save",
      JSON.stringify({
        name: trimmedName,
        className: String(this.pendingJob.id),
        serverName,
        grade: this.selectedGrade,
      }),
    );

    store.setServerName(serverName);
    store.setGrade(this.selectedGrade);
    store.setPlayer({
      name: trimmedName,
      className: String(this.pendingJob.id),
    });

    this.closeGateOverlay();
    this.cameras.main.fadeOut(280, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("WorldScene", {
        serverName,
      });
    });
  }
}
