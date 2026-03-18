"use client";

import { useEffect, useRef, useState } from "react";
import { MAPS } from "@/game/data/maps";
import { useGameStore } from "@/lib/gameStore";
import { getSocket } from "@/lib/socket";

function getPortalMarkers(mapId: string, worldWidth: number, worldHeight: number) {
  switch (mapId) {
    case "speakingIsland":
      return [{ x: worldWidth - 150, y: 400 }, { x: 900, y: 162 }];
    case "ancientCave":
      return [{ x: worldWidth * 0.5, y: worldHeight - 120 }];
    case "silverKnightTown":
      return [
        { x: 150, y: 400 },
        { x: worldWidth * 0.5, y: 150 },
        { x: worldWidth - 150, y: 400 },
        { x: worldWidth * 0.5, y: worldHeight - 150 },
      ];
    case "windwoodForest":
      return [
        { x: 600, y: worldHeight - 150 },
        { x: worldWidth - 150, y: 400 },
        { x: worldWidth * 0.6, y: worldHeight - 150 },
      ];
    case "orcForest":
      return [{ x: 150, y: 400 }];
    case "gludioPlain":
      return [{ x: worldWidth * 0.5, y: 150 }];
    case "moonlitWetland":
      return [{ x: 600, y: 150 }];
    case "giranTown":
      return [
        { x: 150, y: 400 },
        { x: worldWidth - 150, y: 400 },
      ];
    case "dragonValley":
      return [{ x: 150, y: 400 }];
    default:
      return [];
  }
}

function drawMapLandmarkOverlay(
  ctx: CanvasRenderingContext2D,
  mapId: string,
  toMapX: (worldX: number) => number,
  toMapY: (worldY: number) => number,
) {
  if (mapId === "speakingIsland") {
    ctx.fillStyle = "rgba(245,221,160,0.2)";
    ctx.beginPath();
    ctx.ellipse(toMapX(520), toMapY(330), toMapX(110), toMapY(56), 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(140,214,255,0.18)";
    ctx.fillRect(toMapX(1030), toMapY(330), toMapX(190), toMapY(86));

    ctx.strokeStyle = "rgba(255,245,210,0.38)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(toMapX(1228), toMapY(180));
    ctx.lineTo(toMapX(1228), toMapY(290));
    ctx.stroke();
  }

  if (mapId === "silverKnightTown") {
    ctx.fillStyle = "rgba(220,230,240,0.16)";
    ctx.beginPath();
    ctx.ellipse(toMapX(760), toMapY(352), toMapX(140), toMapY(54), 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(210,220,230,0.16)";
    ctx.fillRect(toMapX(236), toMapY(330), toMapX(128), toMapY(60));
    ctx.fillRect(toMapX(1156), toMapY(330), toMapX(128), toMapY(60));

    ctx.strokeStyle = "rgba(246,251,255,0.32)";
    ctx.beginPath();
    ctx.moveTo(toMapX(760), toMapY(130));
    ctx.lineTo(toMapX(760), toMapY(210));
    ctx.stroke();
  }

  if (mapId === "windwoodForest") {
    ctx.fillStyle = "rgba(196,242,168,0.16)";
    ctx.beginPath();
    ctx.ellipse(toMapX(760), toMapY(314), toMapX(86), toMapY(36), 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(72,108,80,0.2)";
    ctx.beginPath();
    ctx.ellipse(toMapX(332), toMapY(286), toMapX(70), toMapY(30), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(toMapX(1188), toMapY(286), toMapX(70), toMapY(30), 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (mapId === "orcForest") {
    ctx.fillStyle = "rgba(194,126,86,0.2)";
    ctx.beginPath();
    ctx.ellipse(toMapX(821), toMapY(360), toMapX(102), toMapY(44), 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(128,86,56,0.2)";
    ctx.fillRect(toMapX(270), toMapY(310), toMapX(110), toMapY(54));
    ctx.fillRect(toMapX(1120), toMapY(410), toMapX(110), toMapY(54));
  }

  if (mapId === "gludioPlain") {
    ctx.fillStyle = "rgba(230,212,156,0.18)";
    ctx.beginPath();
    ctx.ellipse(toMapX(480), toMapY(332), toMapX(98), toMapY(42), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(toMapX(1034), toMapY(420), toMapX(88), toMapY(38), 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(166,182,109,0.18)";
    ctx.fillRect(toMapX(676), toMapY(338), toMapX(168), toMapY(74));
  }

  if (mapId === "moonlitWetland") {
    ctx.fillStyle = "rgba(190,255,240,0.16)";
    ctx.beginPath();
    ctx.ellipse(toMapX(820), toMapY(360), toMapX(96), toMapY(40), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(toMapX(1090), toMapY(424), toMapX(102), toMapY(42), 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(60,96,82,0.18)";
    ctx.beginPath();
    ctx.ellipse(toMapX(820), toMapY(360), toMapX(58), toMapY(18), 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (mapId === "giranTown") {
    ctx.fillStyle = "rgba(232,216,177,0.18)";
    ctx.beginPath();
    ctx.ellipse(toMapX(760), toMapY(330), toMapX(120), toMapY(48), 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(192,155,98,0.18)";
    ctx.fillRect(toMapX(274), toMapY(330), toMapX(190), toMapY(70));
    ctx.fillRect(toMapX(1056), toMapY(330), toMapX(190), toMapY(70));
  }

  if (mapId === "dragonValley") {
    ctx.fillStyle = "rgba(255,170,100,0.16)";
    ctx.beginPath();
    ctx.ellipse(toMapX(870), toMapY(418), toMapX(92), toMapY(38), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(toMapX(395), toMapY(314), toMapX(64), toMapY(30), 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (mapId === "ancientCave") {
    ctx.fillStyle = "rgba(144,222,255,0.18)";
    ctx.beginPath();
    ctx.ellipse(toMapX(760), toMapY(226), toMapX(96), toMapY(34), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(toMapX(760), toMapY(360), toMapX(92), toMapY(36), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(toMapX(486), toMapY(340), toMapX(74), toMapY(30), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(toMapX(1034), toMapY(340), toMapX(74), toMapY(30), 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

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

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    if (currentMapId === "moonlitWetland") {
      gradient.addColorStop(0, "#213941");
      gradient.addColorStop(1, "#0e1718");
    } else if (currentMapId === "dragonValley") {
      gradient.addColorStop(0, "#4a2712");
      gradient.addColorStop(1, "#140b09");
    } else if (currentMapId === "ancientCave") {
      gradient.addColorStop(0, "#233241");
      gradient.addColorStop(1, "#091017");
    } else {
      gradient.addColorStop(0, "#223226");
      gradient.addColorStop(1, "#0d1510");
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    for (let x = 0; x < width; x += 12) {
      for (let y = 0; y < height; y += 10) {
        ctx.fillRect(x + ((y / 10) % 2), y, 1, 1);
      }
    }

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
    } else if (currentMapId === "silverKnightTown") {
      ctx.beginPath();
      ctx.moveTo(toMapX(160), toMapY(351));
      ctx.lineTo(toMapX(worldWidth - 160), toMapY(351));
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(toMapX(worldWidth * 0.5), toMapY(120));
      ctx.lineTo(toMapX(worldWidth * 0.5), toMapY(worldHeight - 120));
      ctx.stroke();
    } else if (currentMapId === "windwoodForest") {
      ctx.beginPath();
      ctx.moveTo(toMapX(210), toMapY(385));
      ctx.lineTo(toMapX(worldWidth - 210), toMapY(385));
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(toMapX(worldWidth * 0.5), toMapY(210));
      ctx.lineTo(toMapX(worldWidth * 0.5), toMapY(510));
      ctx.stroke();
    } else if (currentMapId === "orcForest") {
      ctx.beginPath();
      ctx.moveTo(toMapX(160), toMapY(387));
      ctx.lineTo(toMapX(worldWidth - 160), toMapY(387));
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(toMapX(worldWidth * 0.54), toMapY(264));
      ctx.lineTo(toMapX(worldWidth * 0.54), toMapY(484));
      ctx.stroke();
    } else if (currentMapId === "gludioPlain") {
      ctx.beginPath();
      ctx.moveTo(toMapX(170), toMapY(388));
      ctx.lineTo(toMapX(worldWidth - 170), toMapY(388));
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(toMapX(worldWidth * 0.5), toMapY(188));
      ctx.lineTo(toMapX(worldWidth * 0.5), toMapY(466));
      ctx.stroke();
    } else if (currentMapId === "moonlitWetland") {
      ctx.beginPath();
      ctx.moveTo(toMapX(170), toMapY(388));
      ctx.lineTo(toMapX(worldWidth - 170), toMapY(388));
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(toMapX(600), toMapY(182));
      ctx.lineTo(toMapX(600), toMapY(442));
      ctx.stroke();
    } else if (currentMapId === "giranTown") {
      ctx.beginPath();
      ctx.moveTo(toMapX(220), toMapY(403));
      ctx.lineTo(toMapX(worldWidth - 220), toMapY(403));
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(toMapX(worldWidth * 0.5), toMapY(140));
      ctx.lineTo(toMapX(worldWidth * 0.5), toMapY(worldHeight - 160));
      ctx.stroke();
    } else if (currentMapId === "dragonValley") {
      ctx.beginPath();
      ctx.moveTo(toMapX(160), toMapY(382));
      ctx.lineTo(toMapX(worldWidth - 160), toMapY(382));
      ctx.stroke();
    } else if (currentMapId === "ancientCave") {
      ctx.beginPath();
      ctx.moveTo(toMapX(worldWidth * 0.5), toMapY(120));
      ctx.lineTo(toMapX(worldWidth * 0.5), toMapY(worldHeight - 120));
      ctx.stroke();
    }

    drawMapLandmarkOverlay(ctx, currentMapId, toMapX, toMapY);

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

    getPortalMarkers(currentMapId, worldWidth, worldHeight).forEach(({ x, y }) => {
      const px = toMapX(x);
      const py = toMapY(y);
      ctx.beginPath();
      ctx.arc(px, py, 2.4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(141,214,255,0.9)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px, py, 5.2, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(141,214,255,0.26)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    ctx.strokeStyle = "rgba(246,223,149,0.25)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
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
    <div className="relative flex w-[220px] flex-col gap-2 overflow-hidden rounded-[24px] border border-[#b48a46]/35 bg-[linear-gradient(180deg,rgba(15,19,28,0.94),rgba(6,8,14,0.96))] p-3 shadow-[0_20px_40px_rgba(0,0,0,0.35)] backdrop-blur-md">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,214,120,0.1),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent)]" />
      <div className="pointer-events-none absolute inset-[10px] rounded-[18px] border border-white/5" />

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
        width={196}
        height={120}
        className="rounded-[18px] border border-white/8 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
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
