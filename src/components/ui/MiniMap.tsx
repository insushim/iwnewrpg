"use client";

import { MAPS } from "@/game/data/maps";
import { useGameStore } from "@/lib/gameStore";
import { getSocket } from "@/lib/socket";

export function MiniMap() {
  const currentMapId = useGameStore((state) => state.currentMapId);
  const worldPlayers = useGameStore((state) => state.worldPlayers);
  const worldMonsters = useGameStore((state) => state.worldMonsters);
  const selfId = useGameStore((state) => state.selfId);
  const setCurrentMapId = useGameStore((state) => state.setCurrentMapId);
  const updateQuestProgress = useGameStore((state) => state.updateQuestProgress);

  const map = MAPS[currentMapId] ?? MAPS.speakingIsland;
  const selfPlayer = worldPlayers.find((player) => player.id === selfId);
  const coordinateLabel = selfPlayer
    ? `${Math.round((selfPlayer.x - 120) / 36)}, ${Math.round((selfPlayer.y - 100) / 20)}`
    : "-, -";

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
      .find((quest) => (quest.objectives[0]?.type === "travel" || quest.objectives[0]?.type === "reach") && quest.objectives[0]?.target === nextMapId);
    if (travelQuest?.status === "in_progress") {
      updateQuestProgress(travelQuest.id, travelQuest.goal);
    }
  };

  return (
    <div className="panel rounded-2xl p-3">
      <div className="mb-3 flex items-center justify-between text-sm text-amber-100/80">
        <span>{map.name}</span>
        <span>{coordinateLabel}</span>
      </div>

      <div className="grid grid-cols-6 gap-1 rounded-xl bg-black/30 p-2">
        {Array.from({ length: 36 }).map((_, index) => {
          const hasPlayer = index === 20;
          const hasMonster = index === 24 && worldMonsters.length > 0;

          return (
            <div
              key={index}
              className={`aspect-square rounded-[4px] ${
                hasPlayer ? "bg-white" : hasMonster ? "bg-red-400" : "bg-emerald-900/80"
              }`}
            />
          );
        })}
      </div>

      <div className="mt-3 space-y-2">
        <p className="text-xs font-semibold text-amber-100/70">이동 가능한 지역</p>
        {map.connections.length === 0 ? (
          <p className="text-xs text-amber-100/50">현재 연결된 지역이 없습니다.</p>
        ) : (
          map.connections.map((connection) => (
            <button
              key={`${map.id}-${connection.to}`}
              type="button"
              onClick={() => travel(connection.to)}
              className="flex w-full items-center justify-between rounded-xl bg-black/30 px-3 py-2 text-left text-xs text-amber-50 hover:bg-black/40"
            >
              <span>{connection.fromPortalName}</span>
              <span className="text-amber-200/70">{MAPS[connection.to]?.name ?? connection.to}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
