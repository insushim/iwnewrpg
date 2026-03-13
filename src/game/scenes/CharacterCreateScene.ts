import * as Phaser from "phaser";
import { useGameStore } from "@/lib/gameStore";
import { CharacterClass } from "@/types/game";

const JOBS = [
  {
    id: CharacterClass.SOVEREIGN,
    label: "소버린",
    description: "전열 유지와 돌파에 강한 지휘형 전사",
    primary: 0xd8bb6c,
    glow: 0xffdf96,
  },
  {
    id: CharacterClass.GUARDIAN,
    label: "가디언",
    description: "높은 생존력과 안정적인 근접 전투",
    primary: 0x7ec7ff,
    glow: 0xc9ebff,
  },
  {
    id: CharacterClass.RANGER,
    label: "레인저",
    description: "기동성과 원거리 압박에 특화된 사냥꾼",
    primary: 0x85d79a,
    glow: 0xd7ffe0,
  },
  {
    id: CharacterClass.ARCANIST,
    label: "아르카니스트",
    description: "마력 폭발과 제어에 능한 주문 사용자",
    primary: 0xd59cff,
    glow: 0xf1dcff,
  },
] as const;

export class CharacterCreateScene extends Phaser.Scene {
  constructor() {
    super("CharacterCreateScene");
  }

  create() {
    const { width, height } = this.scale;
    const background = this.add.graphics();
    background.fillGradientStyle(0x11263a, 0x11263a, 0x050810, 0x050810, 1);
    background.fillRect(0, 0, width, height);
    this.add.ellipse(width * 0.5, 120, 520, 140, 0xf6d98b, 0.08);

    this.add
      .text(width / 2, 84, "직업 선택", {
        color: "#f6e7b0",
        fontFamily: "serif",
        fontSize: "34px",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setShadow(0, 3, "#000000", 10, false, true);

    this.add
      .text(width / 2, 122, "전투 성향에 맞는 클래스를 고르고 이야기를 시작하세요", {
        color: "#c8d0da",
        fontSize: "15px",
      })
      .setOrigin(0.5);

    JOBS.forEach((job, index) => {
      const x = width / 2;
      const y = 210 + index * 92;

      const glow = this.add.rectangle(x, y, 360, 72, job.glow, 0.06).setOrigin(0.5);
      const button = this.add.rectangle(x, y, 340, 64, 0x112032).setStrokeStyle(2, job.primary, 0.8).setInteractive({ useHandCursor: true });
      this.add.circle(x - 132, y, 16, job.primary, 0.95);
      const ring = this.add.circle(x - 132, y, 24, job.glow, 0.14).setStrokeStyle(1, job.glow, 0.35);

      this.add.text(x - 98, y - 10, job.label, { color: "#fff8e2", fontSize: "22px", fontStyle: "bold" }).setOrigin(0, 0.5);
      this.add.text(x - 98, y + 14, job.description, { color: "#b4c0ce", fontSize: "13px" }).setOrigin(0, 0.5);

      button.on("pointerover", () => {
        glow.setAlpha(0.12);
        button.setFillStyle(0x16283d, 1);
        ring.setScale(1.08);
      });

      button.on("pointerout", () => {
        glow.setAlpha(0.06);
        button.setFillStyle(0x112032, 1);
        ring.setScale(1);
      });

      button.on("pointerdown", () => {
        useGameStore.getState().setPlayer({
          className: String(job.id),
        });
        this.scene.start("WorldScene");
      });
    });

    this.add
      .text(width / 2, height - 72, "선택한 클래스는 이후 장비와 전투 감각에 영향을 줍니다", {
        color: "#c9d2dd",
        fontSize: "14px",
      })
      .setOrigin(0.5);
  }
}
