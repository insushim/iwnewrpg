import * as Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    const { width, height } = this.scale;
    const bar = this.add.rectangle(width / 2, height / 2, 320, 16, 0x2b1b0c).setOrigin(0.5);
    const fill = this.add.rectangle(width / 2 - 156, height / 2, 0, 8, 0xd6b44d).setOrigin(0, 0.5);
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
    this.scene.start("PreloadScene");
  }
}
