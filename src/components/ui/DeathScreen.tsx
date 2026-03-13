"use client";

import { useGameStore } from "@/lib/gameStore";

export function DeathScreen() {
  const ui = useGameStore((state) => state.ui);
  const closeDeath = useGameStore((state) => state.closeDeath);

  if (!ui.deathOpen) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/75 p-4">
      <div className="fantasy-frame w-full max-w-md rounded-[32px] p-6 text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-red-300/80">Defeat</p>
        <h2 className="mt-3 text-3xl font-semibold text-amber-50">당신은 쓰러졌습니다</h2>
        <p className="mt-4 text-sm text-amber-100/80">잃은 경험치 {ui.expLostOnDeath} EXP</p>
        <p className="mt-2 text-sm leading-6 text-amber-100/70">마을에서 정신을 가다듬고 다시 출발할 수 있습니다.</p>
        <button
          type="button"
          onClick={closeDeath}
          className="mt-6 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-400"
        >
          마을에서 부활
        </button>
      </div>
    </div>
  );
}
