"use client";

import dynamic from "next/dynamic";
import { GameSocketBridge } from "@/components/game/GameSocketBridge";
import { ChatWindow } from "@/components/ui/ChatWindow";
import { DeathScreen } from "@/components/ui/DeathScreen";
import { DialogueWindow } from "@/components/ui/DialogueWindow";
import { InventoryPanel } from "@/components/ui/InventoryPanel";
import { MiniMap } from "@/components/ui/MiniMap";
import { QuizModal } from "@/components/ui/QuizModal";
import { QuestWindow } from "@/components/ui/QuestWindow";
import { ShopWindow } from "@/components/ui/ShopWindow";
import { SkillBar } from "@/components/ui/SkillBar";
import { StatusBar } from "@/components/ui/StatusBar";

const PhaserGame = dynamic(() => import("@/components/game/PhaserGame").then((mod) => mod.PhaserGame), {
  ssr: false,
});

export default function GamePage() {
  return (
    <main className="relative h-screen overflow-hidden bg-game-dark">
      <GameSocketBridge />
      <div className="absolute inset-0">
        <PhaserGame />
      </div>
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col p-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_1fr_280px]">
          <div className="pointer-events-auto">
            <StatusBar />
          </div>
          <div />
          <div className="pointer-events-auto">
            <MiniMap />
          </div>
        </div>
        <div className="mt-auto grid gap-4 lg:grid-cols-[340px_1fr_320px]">
          <div className="pointer-events-auto">
            <ChatWindow />
          </div>
          <div className="pointer-events-auto self-end">
            <SkillBar />
          </div>
          <div className="pointer-events-auto">
            <InventoryPanel />
          </div>
        </div>
      </div>
      <DialogueWindow />
      <QuestWindow />
      <ShopWindow />
      <DeathScreen />
      <QuizModal />
    </main>
  );
}
