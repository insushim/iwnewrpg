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
    <div className="absolute left-1/2 top-24 z-30 w-[min(92vw,620px)] -translate-x-1/2 overflow-hidden rounded-[30px] border border-[#b48a46]/35 bg-[linear-gradient(180deg,rgba(17,21,30,0.97),rgba(7,9,15,0.98))] p-5 shadow-[0_28px_52px_rgba(0,0,0,0.45)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,214,120,0.08),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent)]" />

      <div className="relative mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#b79660]">
            NPC Dialogue
          </p>
          <h3 className="mt-1 text-2xl font-semibold text-[#f2e4c2]">
            {ui.activeNpcName}
          </h3>
          <p className="mt-1 text-xs text-[#b7a282]">
            대화와 퀘스트 진행을 이 창에서 이어갈 수 있습니다.
          </p>
        </div>
        <button
          type="button"
          onClick={closeDialogue}
          className="rounded-[14px] border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#efdfc0] transition hover:bg-white/10"
        >
          닫기
        </button>
      </div>

      <div className="relative rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(6,8,12,0.68),rgba(14,17,24,0.92))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        <div className="space-y-3">
          {ui.activeDialogue.map((line, index) => (
            <p
              key={`${ui.activeNpcId}-${index}`}
              className="text-sm leading-7 text-[#f1e6cf]/90"
            >
              {line}
            </p>
          ))}
        </div>
      </div>

      {quests.length > 0 ? (
        <div className="relative mt-4 flex items-center justify-between gap-3 rounded-[20px] border border-[#b48a46]/20 bg-black/18 px-4 py-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.26em] text-[#b79660]">
              Available Tasks
            </p>
            <p className="mt-1 text-sm text-[#f2e4c2]">
              {quests.length}개의 퀘스트가 이 NPC와 연결되어 있습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleQuestWindow}
            className="rounded-[14px] border border-[#e2bf74]/45 bg-[linear-gradient(180deg,#dfbe73,#9e6e25)] px-4 py-2 text-sm font-semibold text-[#140d04] transition hover:brightness-105"
          >
            퀘스트 보기
          </button>
        </div>
      ) : null}
    </div>
  );
}
