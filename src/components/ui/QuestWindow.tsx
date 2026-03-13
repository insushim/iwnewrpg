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
    <div className="panel absolute left-4 top-28 z-30 w-[min(92vw,440px)] rounded-[28px] p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-amber-200/60">Quest Log</p>
          <h3 className="mt-1 text-xl font-semibold text-amber-50">퀘스트</h3>
          <p className="mt-1 text-xs text-amber-100/60">{ui.activeNpcName ?? "이름 없는 안내자"}</p>
        </div>
        <button
          type="button"
          onClick={toggleQuestWindow}
          className="rounded-xl bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-600"
        >
          닫기
        </button>
      </div>

      <div className="space-y-3">
        {quests.length === 0 ? (
          <div className="rounded-[24px] border border-amber-200/10 bg-black/25 p-4 text-sm text-amber-100/70">
            현재 받을 수 있는 퀘스트가 없습니다.
          </div>
        ) : null}

        {quests.map((quest) => (
          <div key={quest.id} className="rounded-[24px] border border-amber-200/10 bg-black/25 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-base font-semibold text-amber-50">{quest.name}</h4>
                <p className="mt-1 text-xs text-amber-100/70">권장 레벨 {quest.level}</p>
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
                          : "bg-amber-600 text-black"
                }`}
              >
                {STATUS_LABELS[quest.status]}
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-amber-50/90">{quest.description}</p>

            <div className="mt-3 space-y-1 text-xs text-amber-100/80">
              {quest.objectives.map((objective, index) => (
                <p key={`${quest.id}-${index}`}>
                  목표: {objective.type}
                  {objective.target ? ` · ${objective.target}` : ""}
                  {objective.count ? ` · ${quest.progress}/${objective.count}` : ""}
                </p>
              ))}
            </div>

            <div className="mt-3 text-xs text-amber-200/80">
              보상: {quest.rewards.exp} EXP / {quest.rewards.gold} Gold /{" "}
              {quest.rewards.items.map((itemId) => ITEMS[itemId]?.name ?? itemId).join(", ")}
            </div>

            {quest.status === "available" ? (
              <button
                type="button"
                onClick={() => acceptQuest(quest.id)}
                className="mt-3 rounded-xl bg-amber-500 px-3 py-2 text-xs font-semibold text-black transition hover:bg-amber-400"
              >
                수락
              </button>
            ) : null}

            {quest.status === "ready_to_turn_in" ? (
              <p className="mt-3 text-xs text-amber-100/70">해당 NPC와 다시 대화하면 보상 수령 상태로 전환됩니다.</p>
            ) : null}

            {quest.status === "claimable" ? (
              <button
                type="button"
                onClick={() => claimQuestReward(quest.id)}
                className="mt-3 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-black transition hover:bg-emerald-400"
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
