"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/gameStore";

const TABS = [
  { key: "level", label: "레벨 순위" },
  { key: "power", label: "전투력 순위" },
  { key: "kills", label: "킬 수 순위" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function RankingPanel() {
  const ranking = useGameStore((state) => state.ranking);
  const ui = useGameStore((state) => state.ui);
  const toggleRanking = useGameStore((state) => state.toggleRanking);
  const requestRankings = useGameStore((state) => state.requestRankings);
  const player = useGameStore((state) => state.player);

  const [activeTab, setActiveTab] = useState<TabKey>("level");

  useEffect(() => {
    if (ui.rankingOpen && Date.now() - ranking.lastUpdated > 30000) {
      // Refresh rankings if older than 30 seconds
      requestRankings();
    }
  }, [ui.rankingOpen, ranking.lastUpdated, requestRankings]);

  if (!ui.rankingOpen) return null;

  const getSortedRankings = (tab: TabKey) => {
    switch (tab) {
      case "level":
        return [...ranking.rankings].sort((a, b) => b.level - a.level);
      case "power":
        return [...ranking.rankings].sort(
          (a, b) => b.combatPower - a.combatPower,
        );
      case "kills":
        return [...ranking.rankings].sort(
          (a, b) => b.totalKills - a.totalKills,
        );
      default:
        return ranking.rankings;
    }
  };

  const sortedRankings = getSortedRankings(activeTab);

  const getClassIcon = (className: string) => {
    const normalized = className.toLowerCase();
    switch (normalized) {
      case "guardian":
        return "🛡️";
      case "ranger":
        return "🏹";
      case "arcanist":
        return "🔮";
      case "sovereign":
        return "👑";
      default:
        return "⚔️";
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return "text-yellow-400"; // Gold
    if (rank === 2) return "text-gray-300"; // Silver
    if (rank === 3) return "text-amber-600"; // Bronze
    return "text-gray-400";
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="relative w-[600px] max-w-[90vw] rounded-[24px] border border-[#b48a46]/35 bg-[linear-gradient(180deg,rgba(14,18,28,0.98),rgba(4,6,12,0.99))] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
        <div className="absolute inset-0 rounded-[24px] bg-[radial-gradient(circle_at_30%_20%,rgba(255,214,128,0.08),transparent_50%)]" />
        <div className="absolute inset-[12px] rounded-[18px] border border-white/8" />

        {/* Header */}
        <div className="relative mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-600/20 text-2xl">
              🏆
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#f5e8c3]">랭킹</h2>
              <p className="text-sm text-[#af9166]">
                내 순위:{" "}
                {ranking.myRank > 0 ? `${ranking.myRank}위` : "순위권 외"}
              </p>
            </div>
          </div>
          <button
            onClick={toggleRanking}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="relative mb-6 flex rounded-[16px] bg-black/30 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 rounded-[12px] px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.key
                  ? "bg-gradient-to-br from-[#f0c040]/90 to-[#d49c28]/90 text-black"
                  : "text-[#af9166] hover:bg-white/5 hover:text-[#d2b378]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Rankings List */}
        <div className="relative max-h-[400px] overflow-y-auto">
          {sortedRankings.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-[#af9166]">
              랭킹 데이터가 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {sortedRankings.slice(0, 20).map((entry, index) => {
                const rank = index + 1;
                const isCurrentPlayer = entry.id === player.name; // Using name as ID for now

                return (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-4 rounded-[12px] border p-3 transition ${
                      isCurrentPlayer
                        ? "border-[#f0c040]/50 bg-[#f0c040]/10"
                        : "border-white/10 bg-white/3 hover:bg-white/5"
                    }`}
                  >
                    {/* Rank */}
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${
                        rank <= 3 ? "bg-gradient-to-br" : "bg-white/10"
                      } ${
                        rank === 1
                          ? "from-yellow-400 to-yellow-600 text-black"
                          : rank === 2
                            ? "from-gray-300 to-gray-500 text-black"
                            : rank === 3
                              ? "from-amber-600 to-amber-800 text-black"
                              : ""
                      }`}
                    >
                      <span
                        className={
                          rank <= 3 ? "text-black" : getRankColor(rank)
                        }
                      >
                        {rank}
                      </span>
                    </div>

                    {/* Class Icon */}
                    <div className="text-lg">
                      {getClassIcon(entry.className)}
                    </div>

                    {/* Player Info */}
                    <div className="flex-1">
                      <div className="font-semibold text-[#f5e8c3]">
                        {entry.name}
                      </div>
                      <div className="text-xs text-[#af9166]">
                        {entry.className}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="text-right">
                      {activeTab === "level" && (
                        <div className="font-mono text-sm font-semibold text-[#f0c040]">
                          Lv.{entry.level}
                        </div>
                      )}
                      {activeTab === "power" && (
                        <div className="font-mono text-sm font-semibold text-red-400">
                          {entry.combatPower.toLocaleString()}
                        </div>
                      )}
                      {activeTab === "kills" && (
                        <div className="font-mono text-sm font-semibold text-green-400">
                          {entry.totalKills.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <div className="relative mt-6 flex justify-center">
          <button
            onClick={requestRankings}
            className="rounded-[12px] border border-[#f0c040]/30 bg-[#f0c040]/10 px-4 py-2 text-sm font-semibold text-[#f0c040] transition hover:bg-[#f0c040]/20"
          >
            🔄 새로고침
          </button>
        </div>

        {/* Last Updated */}
        {ranking.lastUpdated > 0 && (
          <div className="mt-3 text-center text-xs text-[#af9166]">
            마지막 업데이트:{" "}
            {new Date(ranking.lastUpdated).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}
