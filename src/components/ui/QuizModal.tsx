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
  const updateQuestProgress = useGameStore(
    (state) => state.updateQuestProgress,
  );
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
    const prevent = (e: MouseEvent) => e.preventDefault();
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
  }, [
    quiz.active,
    quiz.feedback,
    quiz.monsterId,
    quiz.question,
    quiz.remaining,
    resolveQuiz,
  ]);

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
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 p-4"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="fantasy-frame w-full max-w-2xl rounded-[32px] p-6">
        <div className="mb-4 flex items-center justify-between text-sm text-amber-200/80">
          <span>
            {question.type === "en_to_kr" ? "영어 -> 한글" : "한글 -> 영어"}
          </span>
          <span>
            {quiz.bossStep}/{quiz.bossTotal}
          </span>
        </div>

        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-xs text-amber-50/70">
            <span>제한 시간</span>
            <span>{quiz.remaining}초</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-black/40">
            <div
              className="h-full bg-game-gold"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mb-6 text-center">
          <p className="mb-2 text-sm uppercase tracking-[0.3em] text-amber-100/60">
            {question.category}
          </p>
          <h2 className="text-4xl font-semibold text-amber-50">
            {question.question}
          </h2>
          <p className="mt-3 text-sm text-amber-100/70">
            현재 연속 정답: {quiz.streak}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {quiz.choices.map((choice) => (
            <button
              key={choice}
              type="button"
              disabled={Boolean(quiz.feedback)}
              onClick={() => submitAnswer(choice)}
              className="rounded-2xl border border-amber-200/10 bg-black/30 px-4 py-4 text-left text-lg text-amber-50 transition hover:border-amber-300/40 hover:bg-black/40 disabled:opacity-60"
            >
              {choice}
            </button>
          ))}
        </div>

        {quiz.feedback ? (
          <div className="mt-6 rounded-2xl border border-amber-200/10 bg-black/30 p-4">
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
                  : "오답입니다."}
            </p>
            <p className="mt-1 text-sm text-amber-50/80">
              정답: {quiz.feedback.answer}
            </p>
            {quiz.feedback.reward ? (
              <p className="mt-1 text-sm text-amber-200/80">
                +{quiz.feedback.reward.gold} Gold / +{quiz.feedback.reward.exp}{" "}
                EXP
              </p>
            ) : null}
            {quiz.feedback.reward?.items.length ? (
              <p className="mt-1 text-sm text-amber-100/80">
                획득 아이템: {quiz.feedback.reward.items.join(", ")}
              </p>
            ) : null}
            <button
              type="button"
              onClick={closeQuiz}
              className="mt-4 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-500"
            >
              닫기
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
