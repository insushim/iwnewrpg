"use client";

import { useEffect, useCallback } from "react";
import { MAPS } from "@/game/data/maps";
import { useGameStore } from "@/lib/gameStore";

export function BottomHUD() {
  const player = useGameStore((state) => state.player);
  const connected = useGameStore((state) => state.connected);
  const derived = useGameStore((state) => state.getDerivedStats());
  const currentMapId = useGameStore((state) => state.currentMapId);
  const toggleInventory = useGameStore((state) => state.toggleInventory);
  const toggleQuestWindow = useGameStore((state) => state.toggleQuestWindow);
  const ui = useGameStore((state) => state.ui);

  const hpRatio = Math.max(
    4,
    Math.min(100, (player.hp / Math.max(1, derived.maxHp)) * 100),
  );
  const mpRatio = Math.max(
    4,
    Math.min(100, (player.mp / Math.max(1, derived.maxMp)) * 100),
  );
  const expRatio = Math.max(
    0,
    Math.min(100, (player.exp / Math.max(1, player.expToNext)) * 100),
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key === "i" || e.key === "I") toggleInventory();
      if (e.key === "q" || e.key === "Q") toggleQuestWindow();
    },
    [toggleInventory, toggleQuestWindow],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="pointer-events-auto fixed bottom-0 left-0 right-0 z-20 flex h-[88px] items-center gap-3 border-t border-amber-200/10 bg-black/85 px-3 backdrop-blur-sm">
      {/* 캐릭터 초상화 */}
      <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-2xl border border-amber-300/20 bg-black/40">
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 rounded-full bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-300 text-sm font-bold">
            {player.className.charAt(0)}
          </div>
          <span className="mt-0.5 text-[9px] text-amber-200/60">
            Lv.{player.level}
          </span>
        </div>
      </div>

      {/* HP/MP/EXP 바 */}
      <div className="flex min-w-[180px] flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="w-6 shrink-0 text-[10px] font-bold text-red-400">
            HP
          </span>
          <div className="h-4 flex-1 overflow-hidden rounded-full border border-white/5 bg-black/50">
            <div
              className="h-full bg-game-hp transition-all duration-300"
              style={{ width: `${hpRatio}%` }}
            />
          </div>
          <span className="w-16 shrink-0 text-right text-[10px] text-amber-100/70">
            {player.hp}/{derived.maxHp}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 shrink-0 text-[10px] font-bold text-blue-400">
            MP
          </span>
          <div className="h-4 flex-1 overflow-hidden rounded-full border border-white/5 bg-black/50">
            <div
              className="h-full bg-game-mp transition-all duration-300"
              style={{ width: `${mpRatio}%` }}
            />
          </div>
          <span className="w-16 shrink-0 text-right text-[10px] text-amber-100/70">
            {player.mp}/{derived.maxMp}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 shrink-0 text-[10px] font-bold text-yellow-400">
            EX
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full border border-white/5 bg-black/50">
            <div
              className="h-full bg-game-exp transition-all duration-300"
              style={{ width: `${expRatio}%` }}
            />
          </div>
          <span className="w-16 shrink-0 text-right text-[10px] text-amber-100/50">
            {player.exp}/{player.expToNext}
          </span>
        </div>
      </div>

      {/* 캐릭터 정보 */}
      <div className="hidden shrink-0 flex-col md:flex">
        <span className="text-sm font-semibold text-amber-50">
          {player.name}
        </span>
        <span className="text-[10px] text-amber-200/60">
          {player.className}
        </span>
        <span className="text-[10px] text-amber-100/50">
          {MAPS[currentMapId]?.name ?? currentMapId}
        </span>
      </div>

      {/* Gold */}
      <div className="shrink-0 text-center">
        <div className="text-lg font-bold text-yellow-300">
          {player.gold.toLocaleString()}
        </div>
        <div className="text-[9px] text-amber-200/50">GOLD</div>
      </div>

      {/* 스킬 슬롯 */}
      <div className="hidden shrink-0 gap-1 lg:flex">
        {[
          {
            key: "1",
            color: "border-red-400/30 bg-red-900/20",
            label: "HP포션",
          },
          {
            key: "2",
            color: "border-blue-400/30 bg-blue-900/20",
            label: "MP포션",
          },
          {
            key: "3",
            color: "border-amber-400/30 bg-amber-900/20",
            label: "스킬",
          },
          {
            key: "4",
            color: "border-purple-400/30 bg-purple-900/20",
            label: "스킬",
          },
        ].map((slot) => (
          <div
            key={slot.key}
            className={`flex h-[60px] w-[56px] flex-col items-center justify-between rounded-xl border ${slot.color} p-1.5 text-xs`}
          >
            <span className="text-[9px] text-amber-50/40">{slot.key}</span>
            <span className="text-center text-[9px] leading-3 text-amber-50/70">
              {slot.label}
            </span>
          </div>
        ))}
      </div>

      {/* 메뉴 버튼 */}
      <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
        <button
          type="button"
          onClick={toggleInventory}
          className={`rounded-xl px-2.5 py-1.5 text-[11px] font-semibold transition ${ui.inventoryOpen ? "bg-amber-500 text-black" : "border border-amber-200/20 bg-black/30 text-amber-50 hover:bg-black/50"}`}
        >
          [I] 인벤토리
        </button>
        <button
          type="button"
          onClick={toggleQuestWindow}
          className={`rounded-xl px-2.5 py-1.5 text-[11px] font-semibold transition ${ui.questWindowOpen ? "bg-amber-500 text-black" : "border border-amber-200/20 bg-black/30 text-amber-50 hover:bg-black/50"}`}
        >
          [Q] 퀘스트
        </button>
      </div>

      {/* 연결 상태 */}
      <div className="shrink-0">
        <span
          className={`rounded-lg px-2 py-1 text-[9px] font-semibold ${connected ? "bg-green-600/30 text-green-300" : "bg-stone-600/30 text-stone-300"}`}
        >
          {connected ? "온라인" : "오프라인"}
        </span>
      </div>
    </div>
  );
}
