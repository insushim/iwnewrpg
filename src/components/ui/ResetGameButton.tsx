"use client";

export function ResetGameButton() {
  const resetGame = () => {
    if (
      confirm(
        "정말로 게임 데이터를 모두 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
      )
    ) {
      // Clear localStorage
      const keysToRemove = [
        "game-storage",
        "usedWordIds",
        "achievements",
        "inventory",
        "equipment",
        "quests",
      ];
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      // Reload page
      window.location.reload();
    }
  };

  return (
    <button
      onClick={resetGame}
      className="rounded-[18px] border border-red-400/45 bg-red-500/10 px-6 py-4 text-sm text-red-300 transition hover:bg-red-500/20"
    >
      데이터 초기화
    </button>
  );
}
