"use client";

import { useGameStore } from "@/lib/gameStore";
import { ACHIEVEMENTS } from "@/game/data/achievements";
import type { AchievementCategory } from "@/game/data/achievements";
import { useState } from "react";

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  combat:      "전투",
  character:   "캐릭터",
  exploration: "탐험",
  crafting:    "제작",
  social:      "소셜",
};

const CATEGORY_COLORS: Record<AchievementCategory, string> = {
combat:      "#f87171",
  character:   "#fbbf24",
  exploration: "#34d399",
  crafting:    "#60a5fa",
  social:      "#c084fc",
};

export function AchievementsPanel() {
  const achievementsState = useGameStore((s) => s.achievements);
  const claimAchievement = useGameStore((s) => s.claimAchievement);
  const ui = useGameStore((s) => s.ui);
  const toggleAchievements = useGameStore((s) => s.toggleAchievements);
  const [activeTab, setActiveTab] = useState<AchievementCategory>("combat");

  if (!ui.achievementsOpen) return null;

  const filteredDefs = ACHIEVEMENTS.filter(
    (a) => a.category === activeTab && (!a.hidden || achievementsState.find((s) => s.id === a.id)?.completed),
  );

  const claimableCount = achievementsState.filter((s) => s.completed && !s.claimed).length;

  return (
    <div className="pointer-events-auto fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="relative flex h-[600px] w-[560px] flex-col rounded-[28px] border border-[#b48a46]/40 shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
        style={{ background: "linear-gradient(180deg, rgba(14,10,4,0.99) 0%, rgba(6,4,2,0.99) 100%)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/6 px-6 py-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.3em] text-[#b79660]">업적</div>
            <div className="font-serif text-[20px] font-bold text-[#f5e8c3]">Achievements</div>
          </div>
          {claimableCount > 0 && (
            <div className="rounded-full border border-[#f0c040]/60 bg-[#f0c040]/15 px-3 py-1 text-[11px] font-bold text-[#f0c040]">
              {claimableCount}개 수령 가능
            </div>
          )}
          <button
            type="button"
            onClick={toggleAchievements}
            className="rounded-full border border-white/10 px-3 py-1.5 text-[12px] text-[#9f8560] transition hover:text-[#f5e8c3]"
          >
            닫기
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/6 px-4 py-2">
          {(Object.keys(CATEGORY_LABELS) as AchievementCategory[]).map((cat) => {
            const hasPending = ACHIEVEMENTS.filter((a) => a.category === cat).some((a) => {
              const s = achievementsState.find((st) => st.id === a.id);
              return s?.completed && !s?.claimed;
            });
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveTab(cat)}
                className="relative rounded-[10px] px-3 py-1.5 text-[11px] font-medium transition"
                style={{
                  background: activeTab === cat ? `${CATEGORY_COLORS[cat]}22` : "transparent",
                  color: activeTab === cat ? CATEGORY_COLORS[cat] : "#9f8560",
                  borderBottom: activeTab === cat ? `2px solid ${CATEGORY_COLORS[cat]}` : "2px solid transparent",
                }}
              >
                {CATEGORY_LABELS[cat]}
                {hasPending && (
                  <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-[#f0c040]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Achievement list */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="flex flex-col gap-2">
            {filteredDefs.map((def) => {
              const state = achievementsState.find((s) => s.id === def.id);
              const progress = state?.progress ?? 0;
              const completed = state?.completed ?? false;
              const claimed = state?.claimed ?? false;
              const pct = Math.min(100, (progress / def.goal) * 100);

              return (
                <div
                  key={def.id}
                  className="relative overflow-hidden rounded-[16px] border p-3"
                  style={{
                    borderColor: completed
                      ? claimed ? "rgba(100,100,80,0.4)" : `${CATEGORY_COLORS[def.category]}50`
                      : "rgba(255,255,255,0.07)",
                    background: completed && !claimed
                      ? `linear-gradient(135deg, ${CATEGORY_COLORS[def.category]}10, rgba(10,10,12,0.95))`
                      : "rgba(14,14,18,0.6)",
                    opacity: claimed ? 0.6 : 1,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="text-[13px] font-semibold text-[#f5e8c3]">{def.name}</div>
                        {def.hidden && !completed && (
                          <span className="rounded px-1 text-[9px] text-[#9f8560]">[숨김]</span>
                        )}
                        {completed && !claimed && (
                          <span
                            className="animate-pulse rounded-full px-2 py-0.5 text-[9px] font-bold"
                            style={{
                              background: `${CATEGORY_COLORS[def.category]}20`,
                              color: CATEGORY_COLORS[def.category],
                            }}
                          >
                            수령 가능
                          </span>
                        )}
                        {claimed && <span className="text-[9px] text-[#6b7280]">완료 ✓</span>}
                      </div>
                      <div className="mt-0.5 text-[11px] text-[#9f8560]">{def.description}</div>

                      {/* Progress bar */}
                      {!completed && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="relative h-[5px] flex-1 overflow-hidden rounded-full bg-white/8">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${pct}%`,
                                background: `linear-gradient(90deg, ${CATEGORY_COLORS[def.category]}90, ${CATEGORY_COLORS[def.category]})`,
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-[#9f8560]">
                            {progress}/{def.goal}
                          </span>
                        </div>
                      )}

                      {/* Rewards */}
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {def.rewards.exp && (
                          <span className="text-[10px] text-[#94c87a]">+{def.rewards.exp.toLocaleString()} EXP</span>
                        )}
                        {def.rewards.gold && (
                          <span className="text-[10px] text-[#f7db86]">+{def.rewards.gold.toLocaleString()} Gold</span>
                        )}
                        {def.rewards.title && (
                          <span className="rounded border border-[#b48a46]/40 px-1.5 py-0.5 text-[9px] text-[#d4a050]">
                            칭호: {def.rewards.title}
                          </span>
                        )}
                        {def.rewards.itemId && (
                          <span className="rounded border border-white/10 px-1.5 py-0.5 text-[9px] text-[#c0b090]">
                            아이템
                          </span>
                        )}
                      </div>
                    </div>

                    {completed && !claimed && (
                      <button
                        type="button"
                        onClick={() => claimAchievement(def.id)}
                        className="shrink-0 rounded-[12px] px-3 py-2 text-[11px] font-bold text-[#1a0f00] transition hover:brightness-110"
                        style={{ background: `linear-gradient(180deg, ${CATEGORY_COLORS[def.category]}, ${CATEGORY_COLORS[def.category]}99)` }}
                      >
                        수령
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredDefs.length === 0 && (
              <div className="py-8 text-center text-[13px] text-[#6b7280]">이 카테고리의 업적이 없습니다.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
