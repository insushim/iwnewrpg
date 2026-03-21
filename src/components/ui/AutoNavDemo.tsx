"use client";

import { useGameStore } from "@/lib/gameStore";

export function AutoNavDemo() {
  const setAutoNavTarget = useGameStore((state) => state.setAutoNavTarget);
  const autoNavTarget = useGameStore((state) => state.autoNavTarget);

  const handleNavToLocation = (x: number, y: number, label: string) => {
    setAutoNavTarget({ x, y, label });
  };

  const handleCancelNav = () => {
    setAutoNavTarget(null);
  };

  const demoLocations = [
    { x: 400, y: 300, label: "마을 중앙" },
    { x: 800, y: 400, label: "상점가" },
    { x: 200, y: 500, label: "훈련소" },
    { x: 600, y: 200, label: "포털" },
  ];

  return (
    <div className="pointer-events-auto absolute right-1 top-[450px] z-10 hidden md:block">
      <div className="w-[200px] rounded-[16px] border border-[#b48a46]/35 bg-[linear-gradient(180deg,rgba(14,18,28,0.96),rgba(4,6,12,0.98))] p-3 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
        <div className="absolute inset-0 rounded-[16px] bg-[radial-gradient(circle_at_30%_20%,rgba(255,214,128,0.06),transparent_50%)]" />
        <div className="absolute inset-[6px] rounded-[12px] border border-white/5" />

        <div className="relative mb-3 flex items-center gap-2">
          <div className="text-lg">🧭</div>
          <div>
            <h4 className="text-xs font-bold text-[#f5e8c3]">자동 이동</h4>
            <p className="text-[10px] text-[#af9166]">
              {autoNavTarget ? "이동 중..." : "목적지 선택"}
            </p>
          </div>
        </div>

        <div className="relative space-y-2">
          {demoLocations.map((location) => (
            <button
              key={`${location.x}-${location.y}`}
              onClick={() =>
                handleNavToLocation(location.x, location.y, location.label)
              }
              className="w-full rounded-[8px] border border-white/10 bg-white/3 px-2 py-1.5 text-left text-xs text-[#f5e8c3] transition hover:bg-white/8"
              disabled={!!autoNavTarget}
            >
              {location.label}
            </button>
          ))}

          {autoNavTarget && (
            <button
              onClick={handleCancelNav}
              className="w-full rounded-[8px] border border-red-500/30 bg-red-500/10 px-2 py-1.5 text-xs text-red-400 transition hover:bg-red-500/20"
            >
              이동 취소
            </button>
          )}
        </div>

        <div className="relative mt-3 text-center">
          <div className="text-[9px] text-[#af9166]">
            💡 NPC나 미니맵 클릭으로도 이동 가능
          </div>
        </div>
      </div>
    </div>
  );
}
