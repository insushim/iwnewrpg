"use client";

import { useEffect } from "react";
import { useGameStore } from "@/lib/gameStore";

export function DailyChallengePanel() {
  const dailyChallenges = useGameStore((state) => state.dailyChallenges);
  const generateDailyChallenges = useGameStore(
    (state) => state.generateDailyChallenges,
  );
  const totalKills = useGameStore((state) => state.totalKills);
  const maxCombo = useGameStore((state) => state.maxCombo);
  const bossKills = useGameStore((state) => state.bossKills);
  const updateChallengeProgress = useGameStore(
    (state) => state.updateChallengeProgress,
  );

  // Generate daily challenges if they don't exist
  useEffect(() => {
    if (dailyChallenges.length === 0) {
      generateDailyChallenges();
    }
  }, [dailyChallenges.length, generateDailyChallenges]);

  // Update challenge progress based on game stats
  useEffect(() => {
    updateChallengeProgress("daily_kills", totalKills);
  }, [totalKills, updateChallengeProgress]);

  useEffect(() => {
    updateChallengeProgress("daily_combos", maxCombo);
  }, [maxCombo, updateChallengeProgress]);

  useEffect(() => {
    updateChallengeProgress("daily_boss", bossKills);
  }, [bossKills, updateChallengeProgress]);

  // Don't render if no challenges
  if (dailyChallenges.length === 0) return null;

  const completedCount = dailyChallenges.filter((c) => c.completed).length;

  return (
    <div className="pointer-events-auto absolute right-1 top-[320px] z-10 hidden md:block">
      <div className="w-[280px] rounded-[20px] border border-[#b48a46]/35 bg-[linear-gradient(180deg,rgba(14,18,28,0.96),rgba(4,6,12,0.98))] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
        <div className="absolute inset-0 rounded-[20px] bg-[radial-gradient(circle_at_30%_20%,rgba(255,214,128,0.06),transparent_50%)]" />
        <div className="absolute inset-[8px] rounded-[16px] border border-white/5" />

        {/* Header */}
        <div className="relative mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-pink-600/20 text-lg">
              📋
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#f5e8c3]">
                일일 도전과제
              </h3>
              <p className="text-xs text-[#af9166]">
                {completedCount}/{dailyChallenges.length} 완료
              </p>
            </div>
          </div>
          {completedCount === dailyChallenges.length && (
            <div className="text-xs text-green-400">🎉 모두 완료!</div>
          )}
        </div>

        {/* Challenges List */}
        <div className="relative space-y-3">
          {dailyChallenges.map((challenge) => {
            const progressPercent = Math.min(
              100,
              (challenge.progress / challenge.target) * 100,
            );

            return (
              <div
                key={challenge.id}
                className={`rounded-[12px] border p-3 transition ${
                  challenge.completed
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-white/10 bg-white/3"
                }`}
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex-1">
                    <div
                      className={`text-sm font-semibold ${
                        challenge.completed
                          ? "text-green-400 line-through"
                          : "text-[#f5e8c3]"
                      }`}
                    >
                      {challenge.description}
                    </div>
                    <div className="mt-1 text-xs text-[#af9166]">
                      보상: +{challenge.reward.gold} Gold, +
                      {challenge.reward.exp} EXP
                    </div>
                  </div>
                  {challenge.completed && (
                    <div className="text-green-400">✓</div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-black/50 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        challenge.completed
                          ? "bg-green-500"
                          : "bg-gradient-to-r from-purple-500 to-pink-500"
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="text-xs font-mono text-[#af9166]">
                    {challenge.progress}/{challenge.target}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reset Timer (Static for now) */}
        <div className="relative mt-4 text-center">
          <div className="text-xs text-[#af9166]">
            ⏰ 다음 리셋: 내일 오전 6시
          </div>
        </div>
      </div>
    </div>
  );
}
