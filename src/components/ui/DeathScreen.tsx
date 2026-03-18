"use client";

import { useGameStore } from "@/lib/gameStore";

export function DeathScreen() {
  const ui = useGameStore((state) => state.ui);
  const closeDeath = useGameStore((state) => state.closeDeath);

  if (!ui.deathOpen) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center p-4"
      style={{
        background: `
          radial-gradient(circle at center, rgba(194, 38, 62, 0.4) 0%, rgba(0, 0, 0, 0.95) 70%),
          linear-gradient(0deg, rgba(0, 0, 0, 0.9), rgba(20, 0, 0, 0.8))
        `,
        backdropFilter: "blur(2px)",
      }}
    >
      {/* Blood vignette effect */}
      <div
        className="absolute inset-0 pointer-events-none animate-pulse"
        style={{
          background: `
            radial-gradient(circle at 50% 100%, rgba(194, 38, 62, 0.3) 0%, transparent 60%),
            radial-gradient(circle at 0% 50%, rgba(142, 29, 47, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 100% 50%, rgba(142, 29, 47, 0.2) 0%, transparent 50%)
          `,
        }}
      ></div>

      <div
        className="relative w-full max-w-lg overflow-hidden rounded-lg border-4 border-[#8e1d2f] bg-[linear-gradient(145deg,#0a0e18,#060a14)] p-8 text-center"
        style={{
          boxShadow: `
            0 0 50px rgba(194, 38, 62, 0.8),
            inset 0 2px 8px rgba(0, 0, 0, 0.9),
            inset 0 -2px 8px rgba(142, 29, 47, 0.3),
            0 0 100px rgba(0, 0, 0, 0.8)
          `,
        }}
      >
        {/* Ornate death corners */}
        <div className="absolute top-3 left-3 w-6 h-6 border-l-4 border-t-4 border-[#c2263e] opacity-80"></div>
        <div className="absolute top-3 right-3 w-6 h-6 border-r-4 border-t-4 border-[#c2263e] opacity-80"></div>
        <div className="absolute bottom-3 left-3 w-6 h-6 border-l-4 border-b-4 border-[#c2263e] opacity-80"></div>
        <div className="absolute bottom-3 right-3 w-6 h-6 border-r-4 border-b-4 border-[#c2263e] opacity-80"></div>

        {/* Dark texture overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 30%, rgba(194, 38, 62, 0.2) 0%, transparent 40%),
              radial-gradient(circle at 80% 70%, rgba(142, 29, 47, 0.1) 0%, transparent 40%),
              linear-gradient(45deg, transparent 40%, rgba(194, 38, 62, 0.1) 50%, transparent 60%)
            `,
          }}
        ></div>

        <div className="relative">
          {/* Skull Icon */}
          <div className="mb-4 text-6xl animate-bounce">💀</div>

          {/* Defeat Banner */}
          <div className="mb-4">
            <p
              className="text-sm font-bold uppercase tracking-[0.3em] text-[#c2263e]"
              style={{
                textShadow:
                  "0 0 8px rgba(194, 38, 62, 0.8), 0 2px 4px rgba(0, 0, 0, 0.9)",
              }}
            >
              ⚰️ DEFEAT ⚰️
            </p>
            <div className="mx-auto mt-2 h-1 w-32 bg-gradient-to-r from-transparent via-[#c2263e] to-transparent rounded"></div>
          </div>

          {/* Death Message */}
          <h2
            className="mb-6 text-4xl font-bold text-[#f2e4c2]"
            style={{
              textShadow:
                "0 0 12px rgba(194, 38, 62, 0.6), 2px 2px 8px rgba(0, 0, 0, 0.9)",
            }}
          >
            당신은 쓰러졌습니다
          </h2>

          {/* EXP Loss Display */}
          <div
            className="mb-6 rounded-lg border-2 border-[#c2263e] bg-[linear-gradient(145deg,#0a0e18,#060a14)] p-4"
            style={{
              boxShadow:
                "inset 0 2px 6px rgba(0,0,0,0.9), 0 0 15px rgba(194, 38, 62, 0.4)",
            }}
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-2xl">📉</span>
              <span className="text-lg font-bold text-[#ff4455]">
                경험치 손실: {ui.expLostOnDeath} EXP
              </span>
            </div>
            <p className="text-sm text-[#d8c3a1] opacity-80">
              마을에서 정신을 가다듬고 다시 출발할 수 있습니다.
            </p>
          </div>

          {/* Death Penalty Notice */}
          <div
            className="mb-6 rounded border-2 border-[#8e7540] bg-[linear-gradient(145deg,#d8c3a1,#b48a46)] p-3"
            style={{
              boxShadow: "inset 0 2px 4px rgba(142, 117, 64, 0.3)",
            }}
          >
            <p className="text-sm font-bold text-[#060a14]">
              ⚠️ 사망 패널티는 적용됐지만 장비와 인벤토리는 유지됩니다.
            </p>
          </div>

          {/* Respawn Button */}
          <button
            type="button"
            onClick={closeDeath}
            className="rounded-xl border-4 border-[#d4a647] bg-[linear-gradient(145deg,#b48a46,#8e7540)] px-8 py-3 text-lg font-bold text-[#f2e4c2] transition hover:brightness-110 active:scale-95"
            style={{
              textShadow: "0 1px 2px rgba(0, 0, 0, 0.8)",
              boxShadow:
                "inset 0 2px 4px rgba(255, 255, 255, 0.2), 0 4px 8px rgba(0, 0, 0, 0.4), 0 0 20px rgba(212, 166, 71, 0.3)",
            }}
          >
            🏰 마을에서 부활
          </button>
        </div>
      </div>
    </div>
  );
}
