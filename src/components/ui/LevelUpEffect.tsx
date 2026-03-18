"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/lib/gameStore";

export function LevelUpEffect() {
  const pendingLevelUp = useGameStore((state) => state.pendingLevelUp);
  const clearLevelUp = useGameStore((state) => state.clearLevelUp);
  const level = useGameStore((state) => state.player.level);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!pendingLevelUp) {
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      clearLevelUp();
      timerRef.current = null;
    }, 3200);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [pendingLevelUp, clearLevelUp]);

  if (!pendingLevelUp) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center">
      <div
        className="absolute inset-0 animate-[flash_0.4s_ease-out]"
        style={{
          background:
            "radial-gradient(circle at center, rgba(255,220,80,0.35) 0%, transparent 70%)",
        }}
      />
      <div
        className="relative flex flex-col items-center gap-2 rounded-[32px] border-2 border-[#f0c040]/70 px-12 py-8 shadow-[0_0_80px_rgba(255,200,50,0.5),inset_0_0_40px_rgba(255,180,0,0.12)]"
        style={{
          background:
            "linear-gradient(180deg, rgba(18,14,8,0.97) 0%, rgba(8,6,2,0.99) 100%)",
          animation: "levelUpAppear 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards",
        }}
      >
        <div className="text-[11px] uppercase tracking-[0.4em] text-[#d4a020]">
          Level Up!
        </div>
        <div
          className="font-serif text-[72px] font-black leading-none text-[#ffd84a]"
          style={{
            textShadow:
              "0 0 30px rgba(255,200,50,0.8), 0 0 60px rgba(255,150,0,0.5)",
          }}
        >
          {level}
        </div>
        <div className="text-[13px] text-[#f0e0b0]">새로운 힘이 깨어납니다.</div>
        <div className="mt-1 flex gap-3 text-[11px] text-[#c8a060]">
          <span>HP 증가</span>
          <span>/</span>
          <span>MP 증가</span>
          <span>/</span>
          <span>SP +2</span>
        </div>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden rounded-[32px]">
          {Array.from({ length: 12 }).map((_, index) => (
            <div
              key={index}
              className="absolute h-2 w-2 rounded-full bg-[#ffd84a]"
              style={{
                animation: `particle_${index} 1s ease-out forwards`,
                transform: `rotate(${index * 30}deg) translateX(80px)`,
                opacity: 0,
                animationDelay: `${index * 0.04}s`,
              }}
            />
          ))}
        </div>
      </div>
      <style>{`
        @keyframes levelUpAppear {
          from { opacity: 0; transform: scale(0.6); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes flash {
          0% { opacity: 0; }
          30% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
