"use client";

import { useState, useEffect } from "react";
import { MAPS } from "@/game/data/maps";
import { useGameStore } from "@/lib/gameStore";
import { getSocket } from "@/lib/socket";

export function MiniMap() {
  const [visible, setVisible] = useState(true);
  const currentMapId = useGameStore((state) => state.currentMapId);
  const worldPlayers = useGameStore((state) => state.worldPlayers);
  const worldMonsters = useGameStore((state) => state.worldMonsters);
  const selfId = useGameStore((state) => state.selfId);
  const setCurrentMapId = useGameStore((state) => state.setCurrentMapId);
  const updateQuestProgress = useGameStore(
    (state) => state.updateQuestProgress,
  );

  const map = MAPS[currentMapId] ?? MAPS.speakingIsland;
  const selfPlayer = worldPlayers.find((player) => player.id === selfId);
  const coordinateLabel = selfPlayer
    ? `${Math.round((selfPlayer.x - 140) / 36)}, ${Math.round((selfPlayer.y - 230) / 20)}`
    : "-, -";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "m" || e.key === "M") setVisible((v) => !v);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const travel = (nextMapId: string) => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit("map:travel", { to: nextMapId });
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
  };

  if (!visible) {
    return (
      <button
        type="button"
        onClick={() => setVisible(true)}
        className="rounded-xl border border-amber-200/20 bg-black/30 px-3 py-2 text-amber-50 hover:bg-black/50"
      >
        [M] 지도
      </button>
    );
  }

  return (
    <section className="panel hud-panel rounded-[28px] p-3">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-amber-200/60">
            Field Map
          </p>
          <h3 className="mt-1 text-lg font-semibold text-amber-50">
            {map.name}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right text-xs text-amber-100/70">
            <p>현재 좌표</p>
            <p className="mt-1 font-semibold text-amber-50">
              {coordinateLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="rounded-lg bg-black/30 px-2 py-1 text-xs text-amber-200/60 hover:text-amber-200"
          >
            [M]
          </button>
        </div>
      </div>

      <div className="rounded-[24px] border border-amber-200/10 bg-[linear-gradient(180deg,rgba(7,14,20,0.96),rgba(4,10,14,0.94))] p-3">
        <div className="grid grid-cols-6 gap-1.5">
          {Array.from({ length: 36 }).map((_, index) => {
            const hasPlayer = index === 20;
            const hasMonster = index === 24 && worldMonsters.length > 0;

            return (
              <div
                key={index}
                className={`aspect-square rounded-[6px] border border-black/20 ${
                  hasPlayer
                    ? "bg-stone-100 shadow-[0_0_18px_rgba(255,255,255,0.5)]"
                    : hasMonster
                      ? "bg-rose-400 shadow-[0_0_18px_rgba(251,113,133,0.38)]"
                      : "bg-emerald-900/80"
                }`}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-2xl border border-amber-200/10 bg-black/20 px-3 py-2 text-xs text-amber-100/70">
        <span>활성 플레이어 {worldPlayers.length}</span>
        <span>몬스터 {worldMonsters.length}</span>
      </div>

      <div className="mt-3 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-100/60">
          이동 가능한 지역
        </p>
        {map.connections.length === 0 ? (
          <p className="rounded-2xl border border-amber-200/10 bg-black/20 px-3 py-3 text-xs text-amber-100/55">
            연결된 지역이 없습니다.
          </p>
        ) : (
          map.connections.map((connection) => (
            <button
              key={`${map.id}-${connection.to}`}
              type="button"
              onClick={() => travel(connection.to)}
              className="flex w-full items-center justify-between rounded-2xl border border-amber-200/10 bg-black/20 px-3 py-3 text-left text-xs text-amber-50 transition hover:border-amber-300/25 hover:bg-black/30"
            >
              <span>{connection.fromPortalName}</span>
              <span className="text-amber-200/70">
                {MAPS[connection.to]?.name ?? connection.to}
              </span>
            </button>
          ))
        )}
      </div>
    </section>
  );
}
