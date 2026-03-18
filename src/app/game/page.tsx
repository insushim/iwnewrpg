"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { GameSocketBridge } from "@/components/game/GameSocketBridge";
import { BottomHUD } from "@/components/ui/BottomHUD";
import { ChatWindow } from "@/components/ui/ChatWindow";
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
    <main className="relative h-screen overflow-hidden bg-[#04070c]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(255,211,120,0.18),transparent_26%),radial-gradient(circle_at_100%_24%,rgba(111,201,255,0.15),transparent_24%),radial-gradient(circle_at_0%_100%,rgba(68,153,110,0.12),transparent_22%),linear-gradient(180deg,#07101a_0%,#03060b_100%)]" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:46px_46px]" />
      <div className="absolute inset-x-0 top-0 h-[28vh] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent)]" />
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
        <div className="rounded-[20px] border border-[#b48a46]/35 bg-[linear-gradient(180deg,rgba(18,22,30,0.95),rgba(8,10,16,0.98))] px-6 py-3 text-center shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
          <div className="mb-2 h-px bg-[linear-gradient(90deg,transparent,rgba(255,222,150,0.45),transparent)]" />
          <div className="text-[10px] uppercase tracking-[0.34em] text-[#b79660]">World Channel</div>
          <div className="mt-1 text-sm font-semibold text-[#f2e4c2]">{serverName}</div>
          <div className="mt-2 h-px bg-[linear-gradient(90deg,transparent,rgba(255,222,150,0.18),transparent)]" />
        </div>
      </div>

      <div className="absolute inset-0 bottom-[88px]">
        <PhaserGame />
      </div>

      <div className="pointer-events-auto absolute bottom-[96px] left-3 z-10 w-[300px]">
        <ChatWindow />
      </div>

      <div className="pointer-events-auto absolute right-3 top-3 z-10 w-[208px]">
        <MiniMap />
      </div>

      <div className="pointer-events-auto absolute right-3 top-[216px] z-10">
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
    </main>
  );
}
