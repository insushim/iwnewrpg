"use client";

import { useGameStore } from "@/lib/gameStore";

export function DeathScreen() {
  const ui = useGameStore((state) => state.ui);
  const closeDeath = useGameStore((state) => state.closeDeath);

  if (!ui.deathOpen) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(118,24,24,0.32),transparent_34%),rgba(0,0,0,0.82)] p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-[34px] border border-[#b48a46]/28 bg-[linear-gradient(180deg,rgba(18,12,14,0.96),rgba(8,6,10,0.98))] p-6 text-center shadow-[0_36px_72px_rgba(0,0,0,0.55)]">
        <div className="pointer-events-none absolute inset-0" />
        <p className="text-sm uppercase tracking-[0.35em] text-red-300/78">Defeat</p>
        <h2 className="mt-3 text-3xl font-semibold text-[#f2e4c2]">당신은 쓰러졌습니다</h2>
        <p className="mt-4 text-sm text-[#efc8b6]">잃은 경험치 {ui.expLostOnDeath} EXP</p>
        <p className="mt-2 text-sm leading-6 text-[#ddc1b8]/72">
          마을에서 정신을 가다듬고 다시 출발할 수 있습니다.
        </p>

        <div className="mt-5 rounded-[22px] border border-white/8 bg-black/24 px-4 py-3 text-sm text-[#d6b996]">
          사망 패널티는 적용됐지만 장비와 인벤토리는 유지됩니다.
        </div>

        <button
          type="button"
          onClick={closeDeath}
          className="mt-6 rounded-[16px] border border-[#e2bf74]/45 bg-[linear-gradient(180deg,#dfbe73,#9e6e25)] px-5 py-2.5 text-sm font-semibold text-[#140d04] transition hover:brightness-105"
        >
          마을에서 부활
        </button>
      </div>
    </div>
  );
}
