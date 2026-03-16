"use client";

import { ITEMS } from "@/game/data/items";
import { useGameStore } from "@/lib/gameStore";

const STATUS_LABELS = {
  available: "수락 가능",
  in_progress: "진행 중",
  ready_to_turn_in: "보고 필요",
  claimable: "보상 수령",
  completed: "완료",
} as const;

export function QuestWindow() {
  const ui = useGameStore((state) => state.ui);
  const getNpcQuests = useGameStore((state) => state.getNpcQuests);
  const acceptQuest = useGameStore((state) => state.acceptQuest);
  const claimQuestReward = useGameStore((state) => state.claimQuestReward);
  const toggleQuestWindow = useGameStore((state) => state.toggleQuestWindow);

  if (!ui.questWindowOpen) {
    return null;
  }

  const quests = getNpcQuests(ui.activeNpcId);

  return (
    <div className="absolute left-4 top-28 z-30 w-[min(92vw,460px)] overflow-hidden rounded-[28px] border border-[#b48a46]/35 bg-[linear-gradient(180deg,rgba(17,21,30,0.96),rgba(6,8,14,0.98))] p-4 shadow-[0_26px_48px_rgba(0,0,0,0.45)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,214,120,0.08),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent)]" />

      <div className="relative mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#b79660]">Quest Log</p>
          <h3 className="mt-1 text-xl font-semibold text-[#f2e4c2]">퀘스트</h3>
          <p className="mt-1 text-xs text-[#b7a282]">
            {ui.activeNpcName ?? "이름 없는 안내자"}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleQuestWindow}
          className="rounded-[14px] border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#efdfc0] transition hover:bg-white/10"
        >
          닫기
        </button>
      </div>

      <div className="relative space-y-3">
        {quests.length === 0 ? (
          <div className="rounded-[24px] border border-white/8 bg-black/22 p-4 text-sm leading-6 text-[#dfcba5]/78">
            현재 받을 수 있는 퀘스트가 없습니다.
          </div>
        ) : null}

        {quests.map((quest) => (
          <div
            key={quest.id}
            className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(10,13,19,0.88),rgba(16,20,28,0.96))] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-base font-semibold text-[#f2e4c2]">{quest.name}</h4>
                <p className="mt-1 text-xs text-[#b9a586]">권장 레벨 {quest.level}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  quest.status === "completed"
                    ? "bg-emerald-600 text-white"
                    : quest.status === "claimable"
                      ? "bg-violet-600 text-white"
                      : quest.status === "ready_to_turn_in"
                        ? "bg-orange-600 text-white"
                        : quest.status === "in_progress"
                          ? "bg-sky-600 text-white"
                          : "bg-amber-500 text-black"
                }`}
              >
                {STATUS_LABELS[quest.status]}
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-[#f1e6cf]/90">{quest.description}</p>

            <div className="mt-3 space-y-1 text-xs text-[#d8c4a0]/80">
              {quest.objectives.map((objective, index) => (
                <p key={`${quest.id}-${index}`}>
                  목표: {objective.type}
                  {objective.target ? ` · ${objective.target}` : ""}
                  {objective.count ? ` · ${quest.progress}/${objective.count}` : ""}
                </p>
              ))}
            </div>

            <div className="mt-3 text-xs text-[#f5d271]">
              보상: {quest.rewards.exp} EXP / {quest.rewards.gold} Gold /{" "}
              {quest.rewards.items.map((itemId) => ITEMS[itemId]?.name ?? itemId).join(", ")}
            </div>

            {quest.status === "available" ? (
              <button
                type="button"
                onClick={() => acceptQuest(quest.id)}
                className="mt-3 rounded-[14px] border border-[#e2bf74]/45 bg-[linear-gradient(180deg,#dfbe73,#9e6e25)] px-3 py-2 text-xs font-semibold text-[#140d04] transition hover:brightness-105"
              >
                수락
              </button>
            ) : null}

            {quest.status === "ready_to_turn_in" ? (
              <p className="mt-3 text-xs text-[#cab38b]/72">
                해당 NPC와 다시 대화하면 보상 수령 상태로 전환됩니다.
              </p>
            ) : null}

            {quest.status === "claimable" ? (
              <button
                type="button"
                onClick={() => claimQuestReward(quest.id)}
                className="mt-3 rounded-[14px] border border-emerald-300/24 bg-[linear-gradient(180deg,#3e8b5f,#205438)] px-3 py-2 text-xs font-semibold text-white transition hover:brightness-110"
              >
                보상 받기
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
