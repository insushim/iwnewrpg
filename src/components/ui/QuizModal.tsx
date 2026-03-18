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
      className="absolute inset-0 z-40 flex items-center justify-center p-4"
      style={{
        background:
          "radial-gradient(circle at center, rgba(212, 166, 71, 0.15), rgba(0, 0, 0, 0.85))",
      }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden border-4 border-[#d4a647] bg-[#f2e4c2] p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)]"
        style={{
          borderRadius: "20px",
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(212, 166, 71, 0.1) 0%, transparent 30%),
            radial-gradient(circle at 80% 70%, rgba(180, 138, 70, 0.1) 0%, transparent 30%),
            linear-gradient(45deg,
              rgba(242, 228, 194, 0.9) 0%,
              rgba(232, 216, 186, 0.95) 25%,
              rgba(222, 204, 178, 0.9) 50%,
              rgba(232, 216, 186, 0.95) 75%,
              rgba(242, 228, 194, 0.9) 100%
            )
          `,
          boxShadow: `
            0 0 50px rgba(0, 0, 0, 0.8),
            inset 0 2px 8px rgba(212, 166, 71, 0.3),
            inset 0 -2px 8px rgba(142, 117, 64, 0.3)
          `,
        }}
      >
        {/* Ornate parchment corners */}
        <div className="absolute top-4 left-4 w-8 h-8 border-l-4 border-t-4 border-[#8e7540] opacity-60 rounded-tl-lg"></div>
        <div className="absolute top-4 right-4 w-8 h-8 border-r-4 border-t-4 border-[#8e7540] opacity-60 rounded-tr-lg"></div>
        <div className="absolute bottom-4 left-4 w-8 h-8 border-l-4 border-b-4 border-[#8e7540] opacity-60 rounded-bl-lg"></div>
        <div className="absolute bottom-4 right-4 w-8 h-8 border-r-4 border-b-4 border-[#8e7540] opacity-60 rounded-br-lg"></div>

        {/* Parchment texture overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                transparent 0px,
                rgba(142, 117, 64, 0.1) 1px,
                transparent 2px,
                transparent 20px
              ),
              repeating-linear-gradient(
                90deg,
                transparent 0px,
                rgba(142, 117, 64, 0.05) 1px,
                transparent 2px,
                transparent 25px
              )
            `,
          }}
        ></div>

        <div className="relative">
          <div className="mb-6 text-center">
            <div className="mb-2 flex items-center justify-center gap-4 text-lg font-bold text-[#8e7540]">
              <span>
                {question.type === "en_to_kr"
                  ? "📜 영어 → 한국어"
                  : "📜 한국어 → 영어"}
              </span>
              <span className="text-[#d4a647]">|</span>
              <span className="text-[#b48a46]">
                {quiz.bossStep}/{quiz.bossTotal}
              </span>
            </div>
            <div className="mx-auto h-1 w-32 bg-gradient-to-r from-transparent via-[#d4a647] to-transparent rounded"></div>
          </div>

          {/* Burning Fuse Timer */}
          <div className="relative mb-8">
            <div className="mb-3 flex items-center justify-center gap-4">
              <span className="text-lg font-bold text-[#8e7540]">
                🔥 제한 시간
              </span>
              <span className="text-2xl font-bold text-[#c2263e]">
                {quiz.remaining}초
              </span>
            </div>
            <div
              className="relative h-4 overflow-hidden rounded-full border-2 border-[#8e7540] bg-[linear-gradient(145deg,#d8c3a1,#f2e4c2)]"
              style={{
                boxShadow: "inset 0 2px 6px rgba(142, 117, 64, 0.4)",
              }}
            >
              <div
                className="h-full transition-all duration-1000 ease-out"
                style={{
                  width: `${progress}%`,
                  background:
                    progress > 50
                      ? "linear-gradient(90deg, #f0d060, #d4a647)"
                      : progress > 25
                        ? "linear-gradient(90deg, #f0d060, #c9a13d)"
                        : "linear-gradient(90deg, #c2263e, #ff4455)",
                  boxShadow:
                    progress > 25
                      ? "0 0 8px rgba(240, 208, 96, 0.6)"
                      : "0 0 12px rgba(194, 38, 62, 0.8)",
                }}
              />
              {progress <= 25 && (
                <div className="absolute right-0 top-0 h-full w-6 animate-pulse bg-[radial-gradient(circle,rgba(255,68,85,0.8),transparent)]"></div>
              )}
            </div>
          </div>

          {/* Question Section */}
          <div className="relative mb-8 text-center">
            <div
              className="mb-4 rounded-lg border-2 border-[#8e7540] bg-[linear-gradient(145deg,#f2e4c2,#d8c3a1)] p-4"
              style={{
                boxShadow:
                  "inset 0 2px 6px rgba(142, 117, 64, 0.3), 0 4px 8px rgba(0, 0, 0, 0.2)",
              }}
            >
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-[#6b5530]">
                ✦ {question.category} ✦
              </p>
              <h2
                className="text-5xl font-bold text-[#060a14]"
                style={{
                  textShadow:
                    "2px 2px 4px rgba(212, 166, 71, 0.3), 0 0 8px rgba(240, 208, 96, 0.2)",
                }}
              >
                {question.question}
              </h2>
            </div>

            {/* Streak Counter with Fire Effect */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg">🔥</span>
              <span className="text-lg font-bold text-[#c2263e]">
                연속 정답: {quiz.streak}
              </span>
              <span className="text-lg">🔥</span>
            </div>
          </div>

          {/* Stone Tablet Answer Buttons */}
          <div className="relative grid gap-4 md:grid-cols-2">
            {quiz.choices.map((choice, index) => (
              <button
                key={choice}
                type="button"
                disabled={Boolean(quiz.feedback)}
                onClick={() => submitAnswer(choice)}
                className="group relative overflow-hidden rounded-xl border-4 border-[#8e7540] transition-all hover:border-[#d4a647] hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(145deg, #d8c3a1, #e8d7b0)",
                  boxShadow: `
                    inset 0 2px 6px rgba(107, 85, 48, 0.2),
                    0 6px 12px rgba(0, 0, 0, 0.3),
                    0 2px 4px rgba(212, 166, 71, 0.2)
                  `,
                  textShadow: "1px 1px 2px rgba(107, 85, 48, 0.3)",
                }}
              >
                {/* Stone texture overlay */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-30"
                  style={{
                    backgroundImage: `
                      radial-gradient(circle at 30% 20%, rgba(142, 117, 64, 0.2) 0%, transparent 40%),
                      radial-gradient(circle at 70% 80%, rgba(107, 85, 48, 0.1) 0%, transparent 40%),
                      linear-gradient(135deg,
                        transparent 40%,
                        rgba(212, 166, 71, 0.1) 50%,
                        transparent 60%
                      )
                    `,
                  }}
                ></div>

                {/* Answer Letter */}
                <div className="absolute top-2 left-3">
                  <span className="text-xl font-bold text-[#6b5530] opacity-70">
                    {String.fromCharCode(65 + index)}
                  </span>
                </div>

                {/* Answer Text */}
                <div className="relative px-6 py-4 text-left">
                  <span className="text-lg font-bold text-[#060a14] group-hover:text-[#6b5530]">
                    {choice}
                  </span>
                </div>

                {/* Hover glow effect */}
                <div className="absolute inset-0 rounded-lg opacity-0 transition-opacity group-hover:opacity-20 bg-[radial-gradient(circle_at_center,rgba(240,208,96,0.4),transparent_70%)]"></div>
              </button>
            ))}
          </div>

          {/* Dramatic Feedback Section */}
          {quiz.feedback && (
            <div className="relative mt-8">
              <div
                className="rounded-xl border-4 border-[#8e7540] p-6 text-center"
                style={{
                  background:
                    quiz.feedback.status === "correct"
                      ? "linear-gradient(145deg, #2a6e44, #1a4a2e)"
                      : quiz.feedback.status === "timeout"
                        ? "linear-gradient(145deg, #6b5530, #4a3820)"
                        : "linear-gradient(145deg, #8e1d2f, #5e1420)",
                  boxShadow:
                    quiz.feedback.status === "correct"
                      ? `
                        0 0 30px rgba(71, 210, 143, 0.4),
                        inset 0 2px 8px rgba(42, 110, 68, 0.3),
                        inset 0 -2px 8px rgba(26, 74, 46, 0.3)
                      `
                      : quiz.feedback.status === "timeout"
                        ? `
                        0 0 20px rgba(107, 85, 48, 0.4),
                        inset 0 2px 8px rgba(107, 85, 48, 0.2)
                      `
                        : `
                        0 0 30px rgba(194, 38, 62, 0.5),
                        inset 0 2px 8px rgba(142, 29, 47, 0.3),
                        inset 0 -2px 8px rgba(94, 20, 32, 0.3)
                      `,
                }}
              >
                {/* Animated Result Icon */}
                <div className="mb-4 text-6xl animate-bounce">
                  {quiz.feedback.status === "correct"
                    ? "✅"
                    : quiz.feedback.status === "timeout"
                      ? "⏰"
                      : "❌"}
                </div>

                {/* Result Text */}
                <h3
                  className={`mb-4 text-3xl font-bold ${
                    quiz.feedback.status === "correct"
                      ? "text-[#71d28f]"
                      : quiz.feedback.status === "timeout"
                        ? "text-[#d8c3a1]"
                        : "text-[#ff4455]"
                  }`}
                  style={{
                    textShadow:
                      quiz.feedback.status === "correct"
                        ? "0 0 10px rgba(71, 210, 143, 0.5), 2px 2px 4px rgba(0, 0, 0, 0.8)"
                        : quiz.feedback.status === "timeout"
                          ? "2px 2px 4px rgba(0, 0, 0, 0.6)"
                          : "0 0 10px rgba(255, 68, 85, 0.5), 2px 2px 4px rgba(0, 0, 0, 0.8)",
                  }}
                >
                  {quiz.feedback.status === "correct"
                    ? "🎉 정답! 🎉"
                    : quiz.feedback.status === "timeout"
                      ? "⏰ 시간 초과! ⏰"
                      : "💥 오답입니다 💥"}
                </h3>

                {/* Correct Answer */}
                <div
                  className="mb-4 rounded-lg border-2 border-[#d4a647] bg-[linear-gradient(145deg,#f2e4c2,#d8c3a1)] p-3"
                  style={{
                    boxShadow: "inset 0 2px 4px rgba(142, 117, 64, 0.3)",
                  }}
                >
                  <p className="text-lg font-bold text-[#060a14]">
                    📜 정답:{" "}
                    <span className="text-[#8e1d2f]">
                      {quiz.feedback.answer}
                    </span>
                  </p>
                </div>

                {/* Rewards */}
                {quiz.feedback.reward && (
                  <div className="mb-4 flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2 text-[#f0d060]">
                      <span className="text-xl">💰</span>
                      <span className="text-lg font-bold">
                        +{quiz.feedback.reward.gold} Gold
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[#4488ff]">
                      <span className="text-xl">⭐</span>
                      <span className="text-lg font-bold">
                        +{quiz.feedback.reward.exp} EXP
                      </span>
                    </div>
                  </div>
                )}

                {quiz.feedback.reward?.items.length ? (
                  <div className="mb-4">
                    <p className="text-lg font-bold text-[#71d28f]">
                      🎁 획득 아이템: {quiz.feedback.reward.items.join(", ")}
                    </p>
                  </div>
                ) : null}

                {/* Close Button */}
                <button
                  type="button"
                  onClick={closeQuiz}
                  className="rounded-xl border-4 border-[#d4a647] bg-[linear-gradient(145deg,#b48a46,#8e7540)] px-8 py-3 text-lg font-bold text-[#f2e4c2] transition hover:brightness-110 active:scale-95"
                  style={{
                    textShadow: "0 1px 2px rgba(0, 0, 0, 0.8)",
                    boxShadow:
                      "inset 0 2px 4px rgba(255, 255, 255, 0.2), 0 4px 8px rgba(0, 0, 0, 0.3)",
                  }}
                >
                  🗞️ 닫기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
