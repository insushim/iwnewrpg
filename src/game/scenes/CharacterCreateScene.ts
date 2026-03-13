import * as Phaser from "phaser";
import { CharacterClass } from "@/types/game";
import { useGameStore } from "@/lib/gameStore";

export class CharacterCreateScene extends Phaser.Scene {
  constructor() {
    super("CharacterCreateScene");
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#081019");

    this.add
      .text(width / 2, 84, "직업 선택", {
        color: "#f6e7b0",
        fontFamily: "serif",
        fontSize: "28px",
      })
      .setOrigin(0.5);

    const jobs = [
      { id: CharacterClass.SOVEREIGN, label: "소버린" },
      { id: CharacterClass.GUARDIAN, label: "가디언" },
      { id: CharacterClass.RANGER, label: "레인저" },
      { id: CharacterClass.ARCANIST, label: "아카니스트" },
    ];

    jobs.forEach((job, index) => {
      const y = 180 + index * 74;
      const button = this.add
        .rectangle(width / 2, y, 240, 52, 0x142437)
        .setStrokeStyle(1, 0xd6b44d)
        .setInteractive({ useHandCursor: true });

      this.add
        .text(width / 2, y, job.label, {
          color: "#fff9de",
          fontSize: "20px",
        })
        .setOrigin(0.5);

      button.on("pointerdown", () => {
        useGameStore.getState().setPlayer({
          className: job.label,
        });
        this.scene.start("WorldScene");
      });
    });

    this.add
      .text(width / 2, height - 72, "직업을 선택하면 이야기의 섬으로 입장합니다.", {
        color: "#c9d2dd",
        fontSize: "14px",
      })
      .setOrigin(0.5);
  }
}
