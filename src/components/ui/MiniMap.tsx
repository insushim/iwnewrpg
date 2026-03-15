"use client";

import { useState, useEffect, useRef } from "react";
import { MAPS } from "@/game/data/maps";
import { useGameStore } from "@/lib/gameStore";
import { getSocket } from "@/lib/socket";

export function MiniMap() {
  const [visible, setVisible] = useState(true);
  const [showTravel, setShowTravel] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentMapId = useGameStore((state) => state.currentMapId);
  const worldPlayers = useGameStore((state) => state.worldPlayers);
  const worldMonsters = useGameStore((state) => state.worldMonsters);
  const selfId = useGameStore((state) => state.selfId);
  const setCurrentMapId = useGameStore((state) => state.setCurrentMapId);
  const updateQuestProgress = useGameStore(
    (state) => state.updateQuestProgress,
  );

  const map = MAPS[currentMapId] ?? MAPS.speakingIsland;
  const selfPlayer = worldPlayers.find((p) => p.id === selfId);

  // M 키 토글
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "m" || e.key === "M") setVisible((v) => !v);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Canvas 렌더링
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !visible) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // 맵 월드 범위 (WorldScene과 동일)
    const TILE_W = 72;
    const TILE_H = 52;
    const worldW = map.width * TILE_W + 320;
    const worldH = map.height * TILE_H + 260;

    // 좌표 변환 함수
    const toMapX = (wx: number) => (wx / worldW) * W;
    const toMapY = (wy: number) => (wy / worldH) * H;

    // 배경 - 맵 종류별 색상
    const bgColor =
      currentMapId === "moonlitWetland"
        ? "#1a2e1a"
        : currentMapId === "dragonValley"
          ? "#2a1a0a"
          : currentMapId === "undergroundDungeon"
            ? "#0a0a1a"
            : "#1a2a1a";
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, W, H);

    // 수역 표시
    if (
      ["speakingIsland", "moonlitWetland", "windwoodForest"].includes(
        currentMapId,
      )
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

    // 마을 안전구역 표시 (speakingIsland)
    if (currentMapId === "speakingIsland") {
      ctx.fillStyle = "rgba(180,150,100,0.22)";
      ctx.beginPath();
      ctx.roundRect(toMapX(220), toMapY(180), toMapX(760), toMapY(430), 4);
      ctx.fill();
      ctx.strokeStyle = "rgba(246,223,149,0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 몬스터 점
    worldMonsters.forEach((m) => {
      if (m.mapId !== currentMapId) return;
      ctx.beginPath();
      ctx.arc(toMapX(m.x), toMapY(m.y), 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "#fb7260";
      ctx.fill();
    });

    // 다른 플레이어 점
    worldPlayers.forEach((p) => {
      if (p.id === selfId) return;
      ctx.beginPath();
      ctx.arc(toMapX(p.x), toMapY(p.y), 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "#89cffd";
      ctx.fill();
    });

    // 내 플레이어 (흰색 + 글로우)
    if (selfPlayer) {
      ctx.shadowColor = "#fff4ba";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(toMapX(selfPlayer.x), toMapY(selfPlayer.y), 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "#fff4ba";
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 테두리
    ctx.strokeStyle = "rgba(246,223,149,0.25)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, W, H);
  }, [
    visible,
    worldPlayers,
    worldMonsters,
    selfPlayer,
    currentMapId,
    map,
    selfId,
  ]);

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
        (q) =>
          (q.objectives[0]?.type === "travel" ||
            q.objectives[0]?.type === "reach") &&
          q.objectives[0]?.target === nextMapId,
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
    <div className="relative flex w-[200px] flex-col gap-1 rounded-2xl border border-amber-200/20 bg-black/70 p-2 shadow-lg backdrop-blur-sm">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-amber-200/50">
            Field Map
          </p>
          <button
            type="button"
            onClick={() => setShowTravel((v) => !v)}
            className="text-left text-sm font-semibold text-amber-50 hover:text-amber-200"
          >
            {map.name} ▾
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

      {/* 미니맵 캔버스 */}
      <canvas
        ref={canvasRef}
        width={184}
        height={110}
        className="rounded-xl"
        style={{ imageRendering: "pixelated" }}
      />

      {/* 좌표 + 통계 */}
      <div className="flex items-center justify-between text-[10px] text-amber-100/60">
        <span>📍 {coordLabel}</span>
        <span>
          👤{worldPlayers.length} 👾{worldMonsters.length}
        </span>
      </div>

      {/* 이동 가능 맵 드롭다운 */}
      {showTravel && map.connections.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-xl border border-amber-200/20 bg-black/90 p-1.5 shadow-xl">
          <p className="mb-1 text-[10px] uppercase tracking-widest text-amber-200/50">
            이동
          </p>
          {map.connections.map((conn) => (
            <button
              key={`${map.id}-${conn.to}`}
              type="button"
              onClick={() => travel(conn.to)}
              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs text-amber-50 hover:bg-amber-200/10"
            >
              <span>{conn.fromPortalName}</span>
              <span className="text-amber-200/60">
                {MAPS[conn.to]?.name ?? conn.to}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
