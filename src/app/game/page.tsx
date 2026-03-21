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
    <main className="relative h-screen overflow-hidden bg-[#4a7a3a]">
      <GameSocketBridge />

      <div className="pointer-events-none absolute inset-3 bottom-[98px] rounded-[30px] border border-[#b48a46]/24 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03),0_32px_80px_rgba(0,0,0,0.42)]">
        <div className="absolute inset-0 rounded-[30px] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_24%)]" />
        <div className="absolute inset-[14px] rounded-[22px] border border-white/5" />
        <div className="absolute left-5 top-5 h-5 w-5 border-l-2 border-t-2 border-[#d2ae71]/70" />
        <div className="absolute right-5 top-5 h-5 w-5 border-r-2 border-t-2 border-[#d2ae71]/70" />
        <div className="absolute bottom-5 left-5 h-5 w-5 border-b-2 border-l-2 border-[#d2ae71]/70" />
        <div className="absolute bottom-5 right-5 h-5 w-5 border-b-2 border-r-2 border-[#d2ae71]/70" />
      </div>

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

      <div className="absolute inset-0 bottom-[88px] game-canvas">
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
