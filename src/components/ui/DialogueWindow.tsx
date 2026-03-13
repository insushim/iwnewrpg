"use client";

import { useGameStore } from "@/lib/gameStore";

export function DialogueWindow() {
  const ui = useGameStore((state) => state.ui);
  const closeDialogue = useGameStore((state) => state.closeDialogue);
  const toggleQuestWindow = useGameStore((state) => state.toggleQuestWindow);
  const quests = useGameStore((state) => state.getNpcQuests(ui.activeNpcId));

  if (!ui.dialogueOpen || !ui.activeNpcName) {
    return null;
  }

  return (
    <div className="panel absolute left-1/2 top-24 z-30 w-[min(92vw,560px)] -translate-x-1/2 rounded-[28px] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-amber-200/60">NPC Dialogue</p>
          <h3 className="mt-1 text-xl font-semibold text-amber-50">{ui.activeNpcName}</h3>
        </div>
        <button
          type="button"
          onClick={closeDialogue}
          className="rounded-xl bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-600"
        >
          닫기
        </button>
      </div>

      <div className="space-y-3 rounded-[24px] border border-amber-200/10 bg-black/25 p-4">
        {ui.activeDialogue.map((line, index) => (
          <p key={`${ui.activeNpcId}-${index}`} className="text-sm leading-7 text-amber-50/90">
            {line}
          </p>
        ))}
      </div>

      {quests.length > 0 ? (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={toggleQuestWindow}
            className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-400"
          >
            퀘스트 보기
          </button>
        </div>
      ) : null}
    </div>
  );
}
