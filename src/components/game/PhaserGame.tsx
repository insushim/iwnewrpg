"use client";

import { useEffect, useRef } from "react";
import * as Phaser from "phaser";
import { createGameConfig } from "@/game/config";

export function PhaserGame() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!hostRef.current || gameRef.current) {
      return;
    }

    const host = hostRef.current;
    const preventContextMenu = (event: MouseEvent) => event.preventDefault();
    host.addEventListener("contextmenu", preventContextMenu);

    gameRef.current = new Phaser.Game(createGameConfig("game-root"));

    return () => {
      host.removeEventListener("contextmenu", preventContextMenu);
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div id="game-root" ref={hostRef} className="h-full w-full" />;
}
