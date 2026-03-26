"use client";

import { useEffect, useState, useMemo } from "react";
import { useGameStore } from "@/lib/gameStore";
import type { AttendanceRevealData } from "@/lib/gameStore";
import {
  ATTENDANCE_REWARDS,
  WEEKLY_CHEST_DAYS,
  RARITY_COLORS,
  RARITY_PARTICLES,
  MAKEUP_COST,
  getStreakMultiplier,
} from "@/game/data/attendanceRewards";
import { ITEMS } from "@/game/data/items";

// ─── Reward Reveal Overlay ───
function RewardReveal({
  data,
  onDismiss,
}: {
  data: AttendanceRevealData;
  onDismiss: () => void;
}) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 100);
    const t2 = setTimeout(() => setPhase(2), 600);
    const t3 = setTimeout(() => setPhase(3), 1400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const particles = useMemo(() => {
    const count = RARITY_PARTICLES[data.displayRarity] ?? 16;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      dx: (Math.random() - 0.5) * 240,
      dy: (Math.random() - 0.5) * 240,
      dur: 0.6 + Math.random() * 0.6,
      delay: Math.random() * 0.3,
    }));
  }, [data.displayRarity]);

  const glowColor = RARITY_COLORS[data.displayRarity] ?? "#9ca3af";

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
      {/* Particle burst */}
      {phase >= 2 && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute left-1/2 top-1/2"
              style={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: glowColor,
                boxShadow: `0 0 6px ${glowColor}`,
                animation: `att-particle ${p.dur}s ease-out ${p.delay}s forwards`,
                ["--att-dx" as string]: `${p.dx}px`,
                ["--att-dy" as string]: `${p.dy}px`,
              }}
            />
          ))}
        </div>
      )}

      {/* Day label */}
      <div
        className="mb-3 text-[11px] uppercase tracking-[0.4em]"
        style={{
          color: glowColor,
          opacity: phase >= 1 ? 1 : 0,
          transition: "opacity 0.4s",
        }}
      >
        {data.isMonthlyMega
          ? "MONTHLY MEGA REWARD"
          : data.isWeeklyChest
            ? "WEEKLY CHEST"
            : `DAY ${data.day} REWARD`}
      </div>

      {/* Items */}
      <div className="mb-4 flex flex-wrap items-center justify-center gap-3">
        {data.items.map((item, idx) => (
          <div
            key={item.itemId}
            className="flex flex-col items-center gap-1 rounded-[14px] border px-3 py-2"
            style={{
              borderColor: `${RARITY_COLORS[item.rarity] ?? "#666"}80`,
              background: `${RARITY_COLORS[item.rarity] ?? "#666"}10`,
              boxShadow: `0 0 16px ${RARITY_COLORS[item.rarity] ?? "#666"}30`,
              opacity: phase >= 2 ? 1 : 0,
              transform: phase >= 2 ? "translateY(0) scale(1)" : "translateY(20px) scale(0.8)",
              transition: `all 0.5s ease-out ${idx * 0.15}s`,
            }}
          >
            <span
              className="text-[20px] font-bold"
              style={{ color: RARITY_COLORS[item.rarity] ?? "#ccc" }}
            >
              {ATTENDANCE_REWARDS[data.day - 1]?.icon ?? "??"}
            </span>
            <span className="text-[11px] text-[#f5e8c3]">{item.name}</span>
            <span className="text-[10px] text-[#9f8560]">x{item.qty}</span>
          </div>
        ))}
      </div>

      {/* Gold & EXP */}
      <div
        className="mb-1 flex items-center gap-4 text-[16px] font-bold"
        style={{
          opacity: phase >= 3 ? 1 : 0,
          transform: phase >= 3 ? "scale(1)" : "scale(0.5)",
          transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <span className="text-[#f7db86]">+{data.gold.toLocaleString()} Gold</span>
        <span className="text-[#9f8560]">/</span>
        <span className="text-[#94c87a]">+{data.exp.toLocaleString()} EXP</span>
      </div>

      {data.streakMultiplier > 1 && (
        <div
          className="mb-4 text-[11px]"
          style={{
            color: glowColor,
            opacity: phase >= 3 ? 1 : 0,
            transition: "opacity 0.3s 0.2s",
          }}
        >
          x{data.streakMultiplier.toFixed(1)} 연속 출석 보너스 적용!
        </div>
      )}

      {/* Dismiss button */}
      {phase >= 3 && (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-[14px] border border-[#b48a46]/50 px-8 py-2 text-[13px] font-bold text-[#f5e8c3] transition hover:bg-white/5"
          style={{
            animation: "att-fadeIn 0.4s ease-out",
          }}
        >
          확인
        </button>
      )}
    </div>
  );
}

// ─── Day Cell ───
function DayCell({
  day,
  claimed,
  isToday,
  isMakeup,
}: {
  day: number;
  claimed: boolean;
  isToday: boolean;
  isMakeup: boolean;
}) {
  const reward = ATTENDANCE_REWARDS[day - 1];
  const isWeekly = WEEKLY_CHEST_DAYS.has(day) && day !== 28;
  const isMega = day === 28;

  let borderColor = "rgba(255,255,255,0.08)";
  let bg = "rgba(255,255,255,0.02)";
  let shadow = "none";
  let extraClass = "";

  if (claimed) {
    borderColor = "rgba(75,96,64,0.6)";
    bg = "rgba(30,50,20,0.4)";
    extraClass = "opacity-70";
  } else if (isToday) {
    borderColor = "rgba(240,192,64,0.7)";
    bg = "linear-gradient(180deg, rgba(255,200,50,0.18), rgba(160,120,10,0.12))";
    shadow = "0 0 16px rgba(255,200,50,0.3)";
    extraClass = "animate-pulse";
  } else if (isMega) {
    borderColor = "rgba(245,158,11,0.6)";
    bg = "linear-gradient(180deg, rgba(245,158,11,0.15), rgba(180,120,20,0.08))";
    shadow = "0 0 20px rgba(245,158,11,0.25)";
  } else if (isWeekly) {
    borderColor = "rgba(168,85,247,0.5)";
    bg = "linear-gradient(180deg, rgba(168,85,247,0.12), rgba(100,50,180,0.06))";
    shadow = "0 0 12px rgba(168,85,247,0.2)";
  }

  return (
    <div
      className={`relative flex flex-col items-center justify-center gap-0.5 rounded-[12px] border p-1 ${extraClass}`}
      style={{
        borderColor,
        background: bg,
        boxShadow: shadow,
        minHeight: 62,
      }}
    >
      <div className="text-[8px] text-[#9f8560]">Day {day}</div>
      <div
        className="text-[14px] font-bold"
        style={{ color: RARITY_COLORS[reward.displayRarity] ?? "#ccc" }}
      >
        {isMega ? "👑" : isWeekly ? "⭐" : reward.icon}
      </div>
      <div className="text-center text-[7px] leading-tight text-[#d4b37b]">
        {reward.gold.toLocaleString()}G
      </div>

      {/* Claimed overlay */}
      {claimed && (
        <div className="absolute inset-0 flex items-center justify-center rounded-[12px] bg-black/40">
          <span
            className="text-[13px] font-bold"
            style={{ color: isMakeup ? "#60a5fa" : "#8fdc8a" }}
          >
            {isMakeup ? "보충" : "✓"}
          </span>
        </div>
      )}

      {/* Today badge */}
      {isToday && !claimed && (
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-[#f0c040]/60 bg-[#f0c040]/20 px-1.5 py-0.5 text-[6px] font-bold text-[#f5d060]">
          오늘
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───
export function LoginBonus() {
  const pendingDailyBonus = useGameStore((s) => s.pendingDailyBonus);
  const loginStreak = useGameStore((s) => s.loginStreak);
  const attendanceDays = useGameStore((s) => s.attendanceDays);
  const pendingReveal = useGameStore((s) => s.pendingAttendanceReveal);
  const playerGold = useGameStore((s) => s.player.gold);
  const makeupUsed = useGameStore((s) => s.attendanceMakeupUsedThisWeek);
  const claimDailyBonus = useGameStore((s) => s.claimDailyBonus);
  const claimMakeup = useGameStore((s) => s.claimMakeup);
  const dismissReveal = useGameStore((s) => s.dismissAttendanceReveal);

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!pendingDailyBonus) return;
    const timer = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(timer);
  }, [pendingDailyBonus]);

  // Also allow opening manually when reveal is pending
  const isVisible = open || !!pendingReveal;

  if (!isVisible && !pendingDailyBonus) return null;
  if (!isVisible) return null;

  const claimedCount = attendanceDays.length;
  const currentDay = claimedCount + 1; // next reward slot
  const multiplier = getStreakMultiplier(loginStreak);
  const todayReward = currentDay <= 28 ? ATTENDANCE_REWARDS[currentDay - 1] : null;

  // Can use makeup?
  const dayOfMonth = new Date().getDate();
  const isBehind = claimedCount < dayOfMonth && !pendingDailyBonus;
  const canMakeup =
    isBehind &&
    makeupUsed < 1 &&
    playerGold >= MAKEUP_COST &&
    claimedCount < 28;

  function handleClaim() {
    claimDailyBonus();
    // Don't close — reveal overlay will show
  }

  function handleDismissReveal() {
    dismissReveal();
    setOpen(false);
  }

  const monthComplete = claimedCount >= 28;

  return (
    <>
      <style>{`
        @keyframes att-modalAppear {
          from { opacity: 0; transform: scale(0.85) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes att-particle {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--att-dx)), calc(-50% + var(--att-dy))) scale(0); opacity: 0; }
        }
        @keyframes att-fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes att-streakFire {
          0%, 100% { text-shadow: 0 0 8px rgba(255,200,50,0.3); }
          50% { text-shadow: 0 0 20px rgba(255,200,50,0.8), 0 0 40px rgba(255,100,0,0.4); }
        }
        @keyframes att-chestGlow {
          0%, 100% { box-shadow: 0 0 12px rgba(245,158,11,0.2); }
          50% { box-shadow: 0 0 28px rgba(245,158,11,0.5); }
        }
      `}</style>
      <div className="pointer-events-auto fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div
          className="relative w-[640px] overflow-hidden rounded-[32px] border border-[#b48a46]/50 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.7)]"
          style={{
            background:
              "linear-gradient(180deg, rgba(16,12,6,0.99) 0%, rgba(8,6,2,0.99) 100%)",
            animation: "att-modalAppear 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* ── Reveal overlay ── */}
          {pendingReveal && (
            <RewardReveal data={pendingReveal} onDismiss={handleDismissReveal} />
          )}

          {/* ── Content (dims when reveal active) ── */}
          <div
            style={{
              opacity: pendingReveal ? 0.15 : 1,
              transition: "opacity 0.4s",
              pointerEvents: pendingReveal ? "none" : "auto",
            }}
          >
            {/* Header */}
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.4em] text-[#b79660]">
                  Monthly Attendance
                </div>
                <div className="mt-0.5 font-serif text-[24px] font-bold text-[#f5e8c3]">
                  출석 보너스
                </div>
                <div className="mt-0.5 text-[12px] text-[#9f8560]">
                  {claimedCount} / 28일 출석
                  {loginStreak > 1 && (
                    <span className="ml-2 text-[#d4b37b]">
                      · {loginStreak}일 연속
                    </span>
                  )}
                </div>
              </div>
              {/* Streak multiplier badge */}
              {multiplier > 1 && (
                <div
                  className="flex items-center gap-1 rounded-full border border-[#f0c040]/50 px-3 py-1"
                  style={{
                    background: "linear-gradient(135deg, rgba(212,166,71,0.2), rgba(240,208,96,0.1))",
                    animation: multiplier >= 1.5 ? "att-streakFire 2s ease-in-out infinite" : undefined,
                  }}
                >
                  <span className="text-[12px] font-bold text-[#f7db86]">
                    x{multiplier.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-[#d4b37b]">보너스</span>
                </div>
              )}
            </div>

            {/* 28-day Calendar Grid */}
            <div className="mb-4 grid grid-cols-7 gap-1.5">
              {ATTENDANCE_REWARDS.map((_, idx) => {
                const day = idx + 1;
                const claimedIdx = attendanceDays.length > idx ? idx : -1;
                const isClaimed = claimedIdx >= 0;
                const isToday = day === currentDay && pendingDailyBonus;
                const isMakeupDay = isClaimed && attendanceDays[idx] === 0;

                return (
                  <DayCell
                    key={day}
                    day={day}
                    claimed={isClaimed}
                    isToday={isToday}
                    isMakeup={isMakeupDay}
                  />
                );
              })}
            </div>

            {/* Today's Reward Detail */}
            {todayReward && !monthComplete && (
              <div
                className="mb-4 rounded-[18px] border border-[#b48a46]/30 bg-white/3 p-3"
                style={{
                  animation: todayReward.tier !== "normal" ? "att-chestGlow 2s ease-in-out infinite" : undefined,
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-[#9f8560]">
                      {todayReward.tier === "monthly_mega"
                        ? "이달의 메가 보상"
                        : todayReward.tier === "weekly_chest"
                          ? "주간 보상 상자"
                          : `${currentDay}일차 보상`}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-2 text-[12px]">
                      {todayReward.items.map((it) => (
                        <span
                          key={it.itemId}
                          style={{
                            color:
                              RARITY_COLORS[ITEMS[it.itemId]?.rarity ?? "common"] ?? "#ccc",
                          }}
                        >
                          {ITEMS[it.itemId]?.name ?? it.itemId} x{it.qty}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-[12px]">
                      <span className="text-[#f7db86]">
                        +{Math.floor(todayReward.gold * multiplier).toLocaleString()} Gold
                      </span>
                      <span className="text-[#9f8560]">/</span>
                      <span className="text-[#94c87a]">
                        +{Math.floor(todayReward.exp * multiplier).toLocaleString()} EXP
                      </span>
                    </div>
                    {multiplier > 1 && (
                      <div className="text-[9px] text-[#9f8560]">
                        (x{multiplier.toFixed(1)} 적용)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {monthComplete && (
              <div className="mb-4 rounded-[18px] border border-[#f59e0b]/30 bg-[rgba(245,158,11,0.05)] p-4 text-center">
                <div className="text-[18px] font-bold text-[#f5e8c3]">
                  이번 달 출석 완료!
                </div>
                <div className="mt-1 text-[12px] text-[#9f8560]">
                  다음 달에 새로운 보상이 준비됩니다.
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              {pendingDailyBonus && !monthComplete && (
                <button
                  type="button"
                  onClick={handleClaim}
                  className="w-full rounded-[16px] border border-[#f0c040]/60 py-3 text-[14px] font-bold text-[#1a0f00] transition hover:brightness-110"
                  style={{
                    background: "linear-gradient(180deg, #f0c040, #c8900a)",
                  }}
                >
                  보상 받기
                </button>
              )}

              {canMakeup && (
                <button
                  type="button"
                  onClick={claimMakeup}
                  className="w-full rounded-[14px] border border-[#d4a647]/40 py-2 text-[12px] text-[#d4b37b] transition hover:bg-white/5"
                >
                  출석 보충 ({MAKEUP_COST.toLocaleString()} Gold)
                </button>
              )}

              {!pendingDailyBonus && !canMakeup && (
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full rounded-[14px] border border-white/10 py-2 text-[12px] text-[#9f8560] transition hover:bg-white/5"
                >
                  닫기
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
