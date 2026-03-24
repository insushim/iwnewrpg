"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { GameSocketBridge } from "@/components/game/GameSocketBridge";
import { BottomHUD } from "@/components/ui/BottomHUD";

import { DeathScreen } from "@/components/ui/DeathScreen";
import { DialogueWindow } from "@/components/ui/DialogueWindow";
import { InventoryPanel } from "@/components/ui/InventoryPanel";
import { MiniMap } from "@/components/ui/MiniMap";
import { QuizModal } from "@/components/ui/QuizModal";
import { QuestWindow } from "@/components/ui/QuestWindow";
import { ShopWindow } from "@/components/ui/ShopWindow";
import { AchievementsPanel } from "@/components/ui/AchievementsPanel";
import { EnchantModal } from "@/components/ui/EnchantModal";
import { LoginBonus } from "@/components/ui/LoginBonus";
import { LevelUpEffect } from "@/components/ui/LevelUpEffect";
import { WorldBossAlert } from "@/components/ui/WorldBossAlert";

import { MobileControls } from "@/components/ui/MobileControls";
import { RankingPanel } from "@/components/ui/RankingPanel";
import { RareDropAlert } from "@/components/ui/RareDropAlert";
import { ComboAlert } from "@/components/ui/ComboAlert";

import { useGameStore } from "@/lib/gameStore";

const PhaserGame = dynamic(
  () => import("@/components/game/PhaserGame").then((mod) => mod.PhaserGame),
  {
    ssr: false,
  },
);

export default function GamePage() {
  const serverName = useGameStore((state) => state.serverName);
  const checkDailyLogin = useGameStore((state) => state.checkDailyLogin);

  // Check daily login bonus on mount
  useEffect(() => {
    checkDailyLogin();
  }, [checkDailyLogin]);

  return (
    <main className="relative h-screen overflow-hidden bg-[#2d4a2d]">
      <GameSocketBridge />

      <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2">
        <div className="rounded-[16px] border border-[#b48a46]/35 bg-[linear-gradient(180deg,rgba(18,22,30,0.95),rgba(8,10,16,0.98))] px-4 py-2 text-center shadow-[0_18px_40px_rgba(0,0,0,0.35)] md:rounded-[20px] md:px-6 md:py-3">
          <div className="mb-1 h-px bg-[linear-gradient(90deg,transparent,rgba(255,222,150,0.45),transparent)] md:mb-2" />
          <div className="text-[8px] uppercase tracking-[0.34em] text-[#b79660] md:text-[10px]">
            World Channel
          </div>
          <div className="mt-1 text-xs font-semibold text-[#f2e4c2] md:text-sm">
            {serverName}
          </div>
          <div className="mt-1 h-px bg-[linear-gradient(90deg,transparent,rgba(255,222,150,0.18),transparent)] md:mt-2" />
        </div>
      </div>

      <div className="absolute inset-0 bottom-[84px] md:bottom-[100px] game-canvas z-0">
        <PhaserGame />
      </div>

      {/* ChatWindow is now integrated into BottomHUD */}

      <div className="pointer-events-auto absolute right-1 top-1 z-10 hidden md:block">
        <MiniMap />
      </div>

      <div className="pointer-events-auto absolute right-1 top-[200px] z-10 hidden md:block">
        <InventoryPanel />
      </div>

      <BottomHUD />
      <DialogueWindow />
      <QuestWindow />
      <ShopWindow />
      <DeathScreen />
      <QuizModal />
      <AchievementsPanel />
      <EnchantModal />
      <LoginBonus />
      <LevelUpEffect />
      <WorldBossAlert />
      <MobileControls />
      <RankingPanel />
      <RareDropAlert />
      <ComboAlert />
    </main>
  );
}
