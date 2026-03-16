"use client";

import { useEffect, useRef, useState } from "react";
import { MAPS } from "@/game/data/maps";
import { useGameStore } from "@/lib/gameStore";
import { getSocket } from "@/lib/socket";

export function MiniMap() {
  const [visible, setVisible] = useState(true);
  const [showTravel, setShowTravel] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentMapId = useGameStore((state) => state.currentMapId);
  const worldPlayers = useGameStore((state) => state.worldPlayers);
  const selfId = useGameStore((state) => state.selfId);
  const setCurrentMapId = useGameStore((state) => state.setCurrentMapId);
  const updateQuestProgress = useGameStore((state) => state.updateQuestProgress);

  const map = MAPS[currentMapId] ?? MAPS.speakingIsland;
  const selfPlayer = worldPlayers.find((player) => player.id === selfId);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;
      if (event.key === "m" || event.key === "M") setVisible((value) => !value);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !visible) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const tileWidth = 72;
    const tileHeight = 52;
    const worldWidth = map.width * tileWidth + 320;
    const worldHeight = map.height * tileHeight + 260;
    const toMapX = (worldX: number) => (worldX / worldWidth) * width;
    const toMapY = (worldY: number) => (worldY / worldHeight) * height;

    const bgColor =
      currentMapId === "moonlitWetland"
        ? "#1a2e1a"
        : currentMapId === "dragonValley"
          ? "#2a1a0a"
          : currentMapId === "undergroundDungeon"
            ? "#0a0a1a"
            : "#1a2a1a";
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    if (
      ["speakingIsland", "moonlitWetland", "windwoodForest"].includes(currentMapId)
    ) {
      ctx.fillStyle = "rgba(43,131,170,0.55)";
      if (currentMapId === "speakingIsland") {
        ctx.beginPath();
        ctx.ellipse(
          toMapX(1480),
          toMapY(480),
          toMapX(260),
          toMapY(360),
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      } else if (currentMapId === "moonlitWetland") {
        ctx.beginPath();
        ctx.ellipse(
          toMapX(1440),
          toMapY(560),
          toMapX(380),
          toMapY(410),
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }

    if (currentMapId === "speakingIsland") {
      ctx.fillStyle = "rgba(180,150,100,0.22)";
      ctx.beginPath();
      ctx.roundRect(toMapX(220), toMapY(180), toMapX(760), toMapY(430), 4);
      ctx.fill();
      ctx.strokeStyle = "rgba(246,223,149,0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(200,180,130,0.45)";
    ctx.lineWidth = 1.5;
    if (currentMapId === "speakingIsland") {
      ctx.beginPath();
      ctx.moveTo(0, toMapY(400));
      ctx.lineTo(width, toMapY(400));
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(toMapX(530), 0);
      ctx.lineTo(toMapX(530), toMapY(610));
      ctx.stroke();

      ctx.strokeStyle = "rgba(200,180,130,0.25)";
      ctx.beginPath();
      ctx.moveTo(toMapX(530), toMapY(610));
      ctx.lineTo(toMapX(530), height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(toMapX(980), toMapY(400));
      ctx.lineTo(width, toMapY(400));
      ctx.stroke();
    }

    worldPlayers.forEach((player) => {
      if (player.id === selfId) return;
      ctx.beginPath();
      ctx.arc(toMapX(player.x), toMapY(player.y), 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "#89cffd";
      ctx.fill();
    });

    if (selfPlayer) {
      ctx.shadowColor = "#fff4ba";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(toMapX(selfPlayer.x), toMapY(selfPlayer.y), 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "#fff4ba";
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.strokeStyle = "rgba(246,223,149,0.25)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);
  }, [visible, worldPlayers, selfPlayer, currentMapId, map, selfId]);

  const travel = (nextMapId: string) => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit("map:travel", { to: nextMapId });
      setShowTravel(false);
      return;
    }

    setCurrentMapId(nextMapId);
    const travelQuest = useGameStore
      .getState()
      .getNpcQuests("elder")
      .find(
        (quest) =>
          (quest.objectives[0]?.type === "travel" ||
            quest.objectives[0]?.type === "reach") &&
          quest.objectives[0]?.target === nextMapId,
      );

    if (travelQuest?.status === "in_progress") {
      updateQuestProgress(travelQuest.id, travelQuest.goal);
    }
    setShowTravel(false);
  };

  const coordLabel = selfPlayer
    ? `${Math.round((selfPlayer.x - 140) / 36)}, ${Math.round((selfPlayer.y - 230) / 20)}`
    : "-, -";

  if (!visible) {
    return (
      <button
        type="button"
        onClick={() => setVisible(true)}
        className="rounded-xl border border-amber-200/20 bg-black/50 px-3 py-1.5 text-xs text-amber-50 hover:bg-black/70"
      >
        [M] 지도
      </button>
    );
  }

  return (
    <div className="relative flex w-[208px] flex-col gap-2 overflow-hidden rounded-[22px] border border-[#b48a46]/35 bg-[linear-gradient(180deg,rgba(15,19,28,0.94),rgba(6,8,14,0.96))] p-2.5 shadow-[0_20px_40px_rgba(0,0,0,0.35)] backdrop-blur-md">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,214,120,0.1),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent)]" />

      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-amber-200/50">
            Field Map
          </p>
          <button
            type="button"
            onClick={() => setShowTravel((value) => !value)}
            className="text-left text-sm font-semibold text-amber-50 hover:text-amber-200"
          >
            {map.name} →
          </button>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="rounded-md bg-black/30 px-1.5 py-0.5 text-[10px] text-amber-200/50 hover:text-amber-200"
        >
          [M]
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={184}
        height={110}
        className="rounded-[16px] border border-white/8 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
        style={{ imageRendering: "pixelated", background: "rgba(4,7,10,0.7)" }}
      />

      <div className="relative flex items-center justify-between text-[10px] text-amber-100/60">
        <span>좌표 {coordLabel}</span>
        <span>인원 {worldPlayers.length}</span>
      </div>

      {showTravel && map.connections.length > 0 ? (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-xl border border-amber-200/20 bg-black/90 p-1.5 shadow-xl">
          <p className="mb-1 text-[10px] uppercase tracking-widest text-amber-200/50">
            이동
          </p>
          {map.connections.map((connection) => (
            <button
              key={`${map.id}-${connection.to}`}
              type="button"
              onClick={() => travel(connection.to)}
              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs text-amber-50 hover:bg-amber-200/10"
            >
              <span>{connection.fromPortalName}</span>
              <span className="text-amber-200/60">
                {MAPS[connection.to]?.name ?? connection.to}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
