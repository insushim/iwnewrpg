import * as Phaser from "phaser";
import { useGameStore } from "@/lib/gameStore";
import { CharacterClass } from "@/types/game";

const CW = 210;  // card width
const CH = 340;  // card height
const PH = 120;  // portrait section height
const GAP = 18;  // gap between cards
const CA = 14;   // corner accent length

const STAT_KEYS = ["STR", "AGI", "INT", "VIT"] as const;

const JOBS = [
  {
    id: CharacterClass.SOVEREIGN,
    label: "소버린",
    sub: "SOVEREIGN",
    desc: ["전열 유지와 돌파에", "강한 지휘형 전사"],
    sym: "♛",
    col: 0xd8bb6c,
    dark: 0x130e02,
    stats: [9, 5, 4, 8],
  },
  {
    id: CharacterClass.GUARDIAN,
    label: "가디언",
    sub: "GUARDIAN",
    desc: ["높은 생존력과", "안정적인 근접 전투"],
    sym: "◈",
    col: 0x7ec7ff,
    dark: 0x02090f,
    stats: [7, 5, 5, 9],
  },
  {
    id: CharacterClass.RANGER,
    label: "레인저",
    sub: "RANGER",
    desc: ["기동성과 원거리 압박에", "특화된 사냥꾼"],
    sym: "◎",
    col: 0x85d79a,
    dark: 0x020d04,
    stats: [6, 9, 6, 5],
  },
  {
    id: CharacterClass.ARCANIST,
    label: "아르카니스트",
    sub: "ARCANIST",
    desc: ["마력 폭발과 제어에", "능한 주문 사용자"],
    sym: "✦",
    col: 0xd59cff,
    dark: 0x070210,
    stats: [4, 6, 10, 4],
  },
] as const;

export class CharacterCreateScene extends Phaser.Scene {
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

  // ── Background ─────────────────────────────────────────────────────────────

  private buildBackground(w: number, h: number) {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x040810, 0x040810, 0x07050e, 0x07050e, 1);
    bg.fillRect(0, 0, w, h);

    // Subtle horizontal scan lines
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x111822, 0.6);
    for (let y = 0; y < h; y += 48) {
      grid.moveTo(0, y);
      grid.lineTo(w, y);
    }
    grid.strokePath();

    // Star field
    for (let i = 0; i < 70; i++) {
      const px = Phaser.Math.Between(0, w);
      const py = Phaser.Math.Between(0, h);
      const r  = Phaser.Math.FloatBetween(0.5, 2);
      const a  = Phaser.Math.FloatBetween(0.1, 0.6);
      const dot = this.add.graphics();
      dot.fillStyle(0xffffff, 1);
      dot.fillCircle(px, py, r);
      dot.setAlpha(a);
      this.tweens.add({
        targets: dot,
        alpha: { from: a, to: a * 0.08 },
        duration: Phaser.Math.Between(1500, 5000),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
        delay: Phaser.Math.Between(0, 3000),
      });
    }

    // Top & bottom vignette
    const vTop = this.add.graphics();
    vTop.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.75, 0.75, 0, 0);
    vTop.fillRect(0, 0, w, h * 0.22);

    const vBot = this.add.graphics();
    vBot.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.55, 0.55);
    vBot.fillRect(0, h * 0.78, w, h * 0.22);
  }

  // ── Title ──────────────────────────────────────────────────────────────────

  private buildTitle(w: number, h: number) {
    const ty = h * 0.11;

    // Decorative lines flanking the title
    const d = this.add.graphics();
    d.lineStyle(1, 0x7a6624, 0.9);
    d.lineBetween(w / 2 - 290, ty, w / 2 - 100, ty);
    d.lineBetween(w / 2 + 100, ty, w / 2 + 290, ty);
    d.lineStyle(1, 0x4a3c14, 0.5);
    d.lineBetween(w / 2 - 310, ty + 9, w / 2 - 100, ty + 9);
    d.lineBetween(w / 2 + 100, ty + 9, w / 2 + 310, ty + 9);

    // Diamond end-markers
    const dm = this.add.graphics();
    dm.fillStyle(0xd8bb6c, 1);
    dm.fillRect(w / 2 - 95, ty - 3, 7, 7);
    dm.fillRect(w / 2 + 89, ty - 3, 7, 7);

    this.add
      .text(w / 2, ty + 3, "직업 선택", {
        color: "#f2d98a",
        fontFamily: "serif",
        fontSize: "38px",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setShadow(0, 0, "#c0860a", 18, false, true);

    this.add
      .text(w / 2, ty + 36, "전투 성향에 맞는 클래스를 고르고 이야기를 시작하세요", {
        color: "#4e5e70",
        fontSize: "12px",
      })
      .setOrigin(0.5);
  }

  // ── Cards ──────────────────────────────────────────────────────────────────

  private buildCards(w: number, h: number) {
    const totalW = JOBS.length * CW + (JOBS.length - 1) * GAP;
    const x0 = (w - totalW) / 2 + CW / 2;
    const cy = h * 0.52;

    JOBS.forEach((job, i) => this.buildCard(x0 + i * (CW + GAP), cy, job, i));
  }

  private buildCard(cx: number, finalY: number, job: typeof JOBS[number], idx: number) {
    const c = this.add.container(cx, finalY + 30);
    c.setAlpha(0);

    const hex = "#" + job.col.toString(16).padStart(6, "0");

    // ── Layers (in draw order) ──────────────────────────────────────────────

    // Drop shadow
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.55);
    shadow.fillRect(-CW / 2 + 6, -CH / 2 + 6, CW, CH);
    c.add(shadow);

    // Card base + portrait tint
    const base = this.add.graphics();
    base.fillStyle(0x080b13, 1);
    base.fillRect(-CW / 2, -CH / 2, CW, CH);
    base.fillStyle(job.dark, 1);
    base.fillRect(-CW / 2, -CH / 2, CW, PH);
    // Separator
    base.lineStyle(1, job.col, 0.3);
    base.lineBetween(-CW / 2 + 10, -CH / 2 + PH, CW / 2 - 10, -CH / 2 + PH);
    c.add(base);

    // Outer border (dim)
    const border = this.add.graphics();
    border.lineStyle(1, job.col, 0.28);
    border.strokeRect(-CW / 2, -CH / 2, CW, CH);
    c.add(border);

    // Corner accents
    const corners = this.add.graphics();
    corners.lineStyle(2, job.col, 1);
    // TL
    corners.lineBetween(-CW / 2, -CH / 2 + CA, -CW / 2, -CH / 2);
    corners.lineBetween(-CW / 2, -CH / 2, -CW / 2 + CA, -CH / 2);
    // TR
    corners.lineBetween(CW / 2 - CA, -CH / 2, CW / 2, -CH / 2);
    corners.lineBetween(CW / 2, -CH / 2, CW / 2, -CH / 2 + CA);
    // BL
    corners.lineBetween(-CW / 2, CH / 2 - CA, -CW / 2, CH / 2);
    corners.lineBetween(-CW / 2, CH / 2, -CW / 2 + CA, CH / 2);
    // BR
    corners.lineBetween(CW / 2 - CA, CH / 2, CW / 2, CH / 2);
    corners.lineBetween(CW / 2, CH / 2 - CA, CW / 2, CH / 2);
    c.add(corners);

    // Hover glow border (hidden by default)
    const glowBorder = this.add.graphics();
    glowBorder.lineStyle(2, job.col, 1);
    glowBorder.strokeRect(-CW / 2, -CH / 2, CW, CH);
    glowBorder.setAlpha(0);
    c.add(glowBorder);

    // Portrait hover overlay (hidden)
    const portraitGlow = this.add.graphics();
    portraitGlow.fillStyle(job.col, 0.09);
    portraitGlow.fillRect(-CW / 2, -CH / 2, CW, PH);
    portraitGlow.setAlpha(0);
    c.add(portraitGlow);

    // Symbol radial hint
    const symBg = this.add.graphics();
    symBg.fillStyle(job.col, 0.07);
    symBg.fillCircle(0, -CH / 2 + PH / 2, 42);
    c.add(symBg);

    // Class symbol
    const sym = this.add.text(0, -CH / 2 + PH / 2, job.sym, {
      color: hex,
      fontSize: "54px",
    }).setOrigin(0.5).setAlpha(0.9);
    c.add(sym);

    // ── Text block ─────────────────────────────────────────────────────────

    const nameY = -CH / 2 + PH + 22;

    const nameText = this.add
      .text(0, nameY, job.label, {
        color: "#ede4ce",
        fontFamily: "serif",
        fontSize: "19px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    c.add(nameText);

    c.add(
      this.add
        .text(0, nameY + 21, job.sub, {
          color: hex,
          fontSize: "9px",
        })
        .setOrigin(0.5)
        .setAlpha(0.65)
    );

    // ── Stat bars ──────────────────────────────────────────────────────────

    const statX0 = -CW / 2 + 14;
    const barX0  = statX0 + 28;
    const barW   = CW - 56;
    const statY0 = nameY + 52;
    const statGap = 17;

    STAT_KEYS.forEach((key, si) => {
      const sy = statY0 + si * statGap;
      const pct = job.stats[si] / 10;

      c.add(
        this.add
          .text(statX0, sy, key, { color: "#3a4a5a", fontSize: "9px" })
          .setOrigin(0, 0.5)
      );

      const track = this.add.graphics();
      track.fillStyle(0x141c28, 1);
      track.fillRect(barX0, sy - 3, barW, 5);
      c.add(track);

      const fill = this.add.graphics();
      fill.fillStyle(job.col, 0.65);
      fill.fillRect(barX0, sy - 3, barW * pct, 5);
      // Small pip at end of fill
      if (pct < 1) {
        fill.fillStyle(job.col, 0.9);
        fill.fillRect(barX0 + barW * pct - 2, sy - 4, 2, 7);
      }
      c.add(fill);
    });

    // ── Description ────────────────────────────────────────────────────────

    const descY = statY0 + 4 * statGap + 16;

    // Thin rule above description
    const rule = this.add.graphics();
    rule.lineStyle(1, job.col, 0.15);
    rule.lineBetween(-CW / 2 + 18, descY - 8, CW / 2 - 18, descY - 8);
    c.add(rule);

    job.desc.forEach((line, li) => {
      c.add(
        this.add
          .text(0, descY + li * 15, line, { color: "#566578", fontSize: "11px" })
          .setOrigin(0.5)
      );
    });

    // ── Interactive hit area ────────────────────────────────────────────────

    const hit = this.add
      .rectangle(0, 0, CW, CH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    c.add(hit);

    // ── Entry animation (staggered slide-up + fade) ─────────────────────────

    this.tweens.add({
      targets: c,
      alpha: 1,
      y: finalY,
      duration: 480,
      ease: "Back.easeOut",
      delay: 80 + idx * 90,
    });

    // ── Hover ───────────────────────────────────────────────────────────────

    hit.on("pointerover", () => {
      this.tweens.killTweensOf(c);
      this.tweens.add({
        targets: c,
        scaleX: 1.045,
        scaleY: 1.045,
        y: finalY - 7,
        duration: 160,
        ease: "Sine.easeOut",
      });
      glowBorder.setAlpha(1);
      portraitGlow.setAlpha(1);
      sym.setAlpha(1);
      nameText.setStyle({ color: "#ffffff" });
    });

    hit.on("pointerout", () => {
      this.tweens.killTweensOf(c);
      this.tweens.add({
        targets: c,
        scaleX: 1,
        scaleY: 1,
        y: finalY,
        duration: 200,
        ease: "Sine.easeOut",
      });
      glowBorder.setAlpha(0);
      portraitGlow.setAlpha(0);
      sym.setAlpha(0.9);
      nameText.setStyle({ color: "#ede4ce" });
    });

    hit.on("pointerdown", () => {
      useGameStore.getState().setPlayer({ className: String(job.id) });
      this.cameras.main.fadeOut(280, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("WorldScene");
      });
    });
  }

  // ── Footer ─────────────────────────────────────────────────────────────────

  private buildFooter(w: number, h: number) {
    const fy = h * 0.92;

    // Decorative dots
    const dots = this.add.graphics();
    dots.fillStyle(0x2a3a4a, 0.7);
    [-2, -1, 0, 1, 2].forEach(n => dots.fillCircle(w / 2 + n * 14, fy - 16, 1.5));

    this.add
      .text(w / 2, fy, "선택한 클래스는 이후 장비와 전투 감각에 영향을 줍니다", {
        color: "#2e3e4e",
        fontSize: "12px",
      })
      .setOrigin(0.5);
  }
}
