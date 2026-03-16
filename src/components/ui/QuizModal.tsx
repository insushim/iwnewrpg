"use client";

import { useEffect } from "react";
import { EventBus } from "@/components/game/EventBus";
import { useGameStore } from "@/lib/gameStore";
import { getSocket } from "@/lib/socket";

export function QuizModal() {
  const quiz = useGameStore((state) => state.quiz);
  const openQuiz = useGameStore((state) => state.openQuiz);
  const closeQuiz = useGameStore((state) => state.closeQuiz);
  const tickQuiz = useGameStore((state) => state.tickQuiz);
  const resolveQuiz = useGameStore((state) => state.resolveQuiz);
  const updateQuestProgress = useGameStore((state) => state.updateQuestProgress);
  const quests = useGameStore((state) => state.quests);

  useEffect(() => {
    return EventBus.on("quiz_trigger", (payload) => {
      openQuiz({
        question: payload.question,
        choices: payload.choices,
        monsterId: payload.monsterId,
        monsterLevel: payload.monsterLevel,
        streak: payload.streak,
        bossStep: payload.bossStep,
        bossTotal: payload.bossTotal,
      });
    });
  }, [openQuiz]);

  useEffect(() => {
    return EventBus.on("quiz_result", (payload) => {
      resolveQuiz(payload);
    });
  }, [resolveQuiz]);

  useEffect(() => {
    if (!quiz.active || quiz.feedback) {
      return;
    }

    const timer = window.setInterval(() => {
      tickQuiz();
    }, 1000);

    return () => window.clearInterval(timer);
  }, [quiz.active, quiz.feedback, tickQuiz]);

  useEffect(() => {
    if (!quiz.feedback || quiz.feedback.status !== "correct") {
      return;
    }

    const socket = getSocket();
    if (socket.connected) {
      return;
    }

    const streakQuest = quests.find((quest) => quest.questId === "mq_003");
    if (streakQuest?.status === "in_progress") {
      updateQuestProgress("mq_003", Math.min(10, streakQuest.progress + 1));
    }
  }, [quiz.feedback, quests, updateQuestProgress]);

  useEffect(() => {
    if (!quiz.active) return;
    const prevent = (event: MouseEvent) => event.preventDefault();
    document.addEventListener("contextmenu", prevent);
    return () => document.removeEventListener("contextmenu", prevent);
  }, [quiz.active]);

  useEffect(() => {
    if (!quiz.active || quiz.feedback || quiz.remaining > 0) {
      return;
    }

    const socket = getSocket();
    if (socket.connected && quiz.question) {
      socket.emit("quiz:answer", {
        questionId: quiz.question.id,
        monsterId: quiz.monsterId,
        answer: "__timeout__",
      });
      return;
    }

    resolveQuiz({
      status: "timeout",
      answer: quiz.question?.correctAnswer ?? "",
    });
  }, [quiz.active, quiz.feedback, quiz.monsterId, quiz.question, quiz.remaining, resolveQuiz]);

  if (!quiz.active || !quiz.question) {
    return null;
  }

  const question = quiz.question;
  const progress = (quiz.remaining / quiz.timeLimit) * 100;

  const submitAnswer = (answer: string) => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit("quiz:answer", {
        questionId: question.id,
        monsterId: quiz.monsterId,
        answer,
      });
      return;
    }

    const correct = answer === question.correctAnswer;
    resolveQuiz({
      status: correct ? "correct" : "wrong",
      answer: question.correctAnswer,
      reward: correct
        ? {
            gold: 12,
            exp: 45,
            items: [],
            bonusMultiplier: quiz.streak >= 2 ? 1.5 : 1,
          }
        : undefined,
    });
  };

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,214,120,0.12),transparent_28%),rgba(0,0,0,0.72)] p-4"
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-[34px] border border-[#b48a46]/35 bg-[linear-gradient(180deg,rgba(17,21,30,0.97),rgba(6,8,14,0.98))] p-6 shadow-[0_32px_64px_rgba(0,0,0,0.45)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,214,120,0.08),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent)]" />

        <div className="relative mb-4 flex items-center justify-between text-sm text-[#d8c4a0]">
          <span>{question.type === "en_to_kr" ? "영어 → 한국어" : "한국어 → 영어"}</span>
          <span>
            {quiz.bossStep}/{quiz.bossTotal}
          </span>
        </div>

        <div className="relative mb-6">
          <div className="mb-2 flex items-center justify-between text-xs text-[#e8d7b0]/76">
            <span>제한 시간</span>
            <span>{quiz.remaining}초</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-black/40">
            <div
              className="h-full bg-[linear-gradient(90deg,#c9a13d,#f0d16c)] transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="relative mb-6 text-center">
          <p className="mb-2 text-sm uppercase tracking-[0.3em] text-[#b79660]">
            {question.category}
          </p>
          <h2 className="text-4xl font-semibold text-[#f2e4c2]">{question.question}</h2>
          <p className="mt-3 text-sm text-[#d9c5a1]/72">현재 연속 정답: {quiz.streak}</p>
        </div>

        <div className="relative grid gap-3 md:grid-cols-2">
          {quiz.choices.map((choice) => (
            <button
              key={choice}
              type="button"
              disabled={Boolean(quiz.feedback)}
              onClick={() => submitAnswer(choice)}
              className="rounded-[20px] border border-white/8 bg-[linear-gradient(180deg,rgba(10,13,19,0.88),rgba(16,20,28,0.96))] px-4 py-4 text-left text-lg text-[#f2e4c2] transition hover:border-[#d4b377]/35 hover:bg-black/40 disabled:opacity-60"
            >
              {choice}
            </button>
          ))}
        </div>

        {quiz.feedback ? (
          <div className="relative mt-6 rounded-[24px] border border-white/8 bg-black/24 p-4">
            <p
              className={`text-lg font-semibold ${
                quiz.feedback.status === "correct"
                  ? "text-green-300"
                  : quiz.feedback.status === "timeout"
                    ? "text-stone-300"
                    : "text-red-300"
              }`}
            >
              {quiz.feedback.status === "correct"
                ? "정답!"
                : quiz.feedback.status === "timeout"
                  ? "시간 초과!"
                  : "오답입니다"}
            </p>
            <p className="mt-1 text-sm text-[#f1e6cf]/80">정답: {quiz.feedback.answer}</p>
            {quiz.feedback.reward ? (
              <p className="mt-1 text-sm text-[#f5d271]">
                +{quiz.feedback.reward.gold} Gold / +{quiz.feedback.reward.exp} EXP
              </p>
            ) : null}
            {quiz.feedback.reward?.items.length ? (
              <p className="mt-1 text-sm text-[#d9c5a1]/80">
                획득 아이템: {quiz.feedback.reward.items.join(", ")}
              </p>
            ) : null}
            <button
              type="button"
              onClick={closeQuiz}
              className="mt-4 rounded-[14px] border border-[#e2bf74]/45 bg-[linear-gradient(180deg,#dfbe73,#9e6e25)] px-4 py-2 text-sm font-semibold text-[#140d04] transition hover:brightness-105"
            >
              닫기
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
