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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,214,120,0.08),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(31,146,122,0.1),transparent_22%),linear-gradient(180deg,rgba(7,12,20,0.1),rgba(7,12,20,0.55))]" />
      <GameSocketBridge />
      <div className="absolute inset-0">
        <PhaserGame />
      </div>
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col p-4 md:p-5">
        <div className="grid gap-4 xl:grid-cols-[minmax(320px,420px)_1fr_300px]">
          <div className="pointer-events-auto">
            <StatusBar />
          </div>
          <div />
          <div className="pointer-events-auto">
            <MiniMap />
          </div>
        </div>
        <div className="mt-auto grid gap-4 xl:grid-cols-[340px_1fr_320px]">
          <div className="pointer-events-auto">
            <ChatWindow />
          </div>
          <div className="pointer-events-auto self-end xl:justify-self-center">
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
