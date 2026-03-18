"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/gameStore";

const DAY_REWARDS = [
  { day: 1, gold: 200, exp: 500, item: "붉은 물약 x5", icon: "PT" },
  { day: 2, gold: 400, exp: 1000, item: "강화 주문서 x1", icon: "SC" },
  { day: 3, gold: 600, exp: 1500, item: "귀환 주문서 x2", icon: "RT" },
  { day: 4, gold: 800, exp: 2000, item: "축복 물약 x2", icon: "BP" },
  { day: 5, gold: 1200, exp: 3000, item: "미스터리 상자", icon: "BX" },
  { day: 6, gold: 1500, exp: 4000, item: "희귀 강화 주문서", icon: "RS" },
  { day: 7, gold: 3000, exp: 8000, item: "전설 보급 상자", icon: "LX" },
];

export function LoginBonus() {
  const pendingDailyBonus = useGameStore((state) => state.pendingDailyBonus);
  const loginStreak = useGameStore((state) => state.loginStreak);
  const claimDailyBonus = useGameStore((state) => state.claimDailyBonus);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!pendingDailyBonus) {
      return;
    }

    const timer = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(timer);
  }, [pendingDailyBonus]);

  if (!open || !pendingDailyBonus) {
    return null;
  }

  const streakDay = ((loginStreak - 1) % 7) + 1;
  const todayReward = DAY_REWARDS[streakDay - 1];

  function handleClaim() {
    claimDailyBonus();
    setOpen(false);
  }

  return (
    <div className="pointer-events-auto fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="relative w-[480px] rounded-[28px] border border-[#b48a46]/50 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
        style={{
          background:
            "linear-gradient(180deg, rgba(16,12,6,0.99) 0%, rgba(8,6,2,0.99) 100%)",
        }}
      >
        <div className="mb-5 text-center">
          <div className="text-[11px] uppercase tracking-[0.4em] text-[#b79660]">
            Daily Login Bonus
          </div>
          <div className="mt-1 font-serif text-[26px] font-bold text-[#f5e8c3]">
            출석 보너스
          </div>
          <div className="mt-1 text-[13px] text-[#9f8560]">
            {loginStreak}일 연속 출석 중입니다. 오늘의 보상을 받으세요.
          </div>
        </div>

        <div className="mb-5 grid grid-cols-7 gap-1.5">
          {DAY_REWARDS.map((reward, index) => {
            const day = index + 1;
            const isPast = day < streakDay;
            const isToday = day === streakDay;

            return (
              <div
                key={day}
                className={`relative flex flex-col items-center gap-1 rounded-[14px] border p-2 ${
                  isToday
                    ? "border-[#f0c040]/70 bg-[linear-gradient(180deg,rgba(255,200,50,0.18),rgba(160,120,10,0.12))] shadow-[0_0_16px_rgba(255,200,50,0.3)]"
                    : isPast
                      ? "border-[#4b6040]/60 bg-[rgba(30,50,20,0.4)] opacity-70"
                      : "border-white/8 bg-white/3"
                }`}
              >
                <div className="text-[9px] text-[#9f8560]">Day {day}</div>
                <div className="text-[18px] font-semibold text-[#f5e8c3]">
                  {reward.icon}
                </div>
                <div className="text-center text-[7px] leading-tight text-[#d4b37b]">
                  {reward.gold}G
                </div>
                {isPast && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-[14px] bg-black/40">
                    <span className="text-[14px] text-[#8fdc8a]">완료</span>
                  </div>
                )}
                {isToday && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-[#f0c040]/60 bg-[#f0c040]/20 px-1.5 py-0.5 text-[7px] text-[#f5d060]">
                    오늘
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mb-4 rounded-[18px] border border-[#b48a46]/30 bg-white/3 p-3 text-center">
          <div className="text-[11px] text-[#9f8560]">오늘의 보상</div>
          <div className="mt-1 text-[22px] font-semibold text-[#f5e8c3]">
            {todayReward.icon}
          </div>
          <div className="mt-0.5 text-[13px] font-semibold text-[#f5e8c3]">
            {todayReward.item}
          </div>
          <div className="mt-1 flex items-center justify-center gap-3 text-[12px]">
            <span className="text-[#f7db86]">
              +{todayReward.gold.toLocaleString()} Gold
            </span>
            <span className="text-[#9f8560]">/</span>
            <span className="text-[#94c87a]">
              +{todayReward.exp.toLocaleString()} EXP
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClaim}
          className="w-full rounded-[16px] border border-[#f0c040]/60 py-3 text-[14px] font-bold text-[#1a0f00] transition hover:brightness-110"
          style={{ background: "linear-gradient(180deg, #f0c040, #c8900a)" }}
        >
          보상 받기
        </button>
      </div>
    </div>
  );
}
