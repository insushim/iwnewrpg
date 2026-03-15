"use client";

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

const PhaserGame = dynamic(
  () => import("@/components/game/PhaserGame").then((mod) => mod.PhaserGame),
  {
    ssr: false,
  },
);

export default function GamePage() {
  return (
    <main className="relative h-screen overflow-hidden bg-game-dark">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,214,120,0.08),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(31,146,122,0.1),transparent_22%),linear-gradient(180deg,rgba(7,12,20,0.1),rgba(7,12,20,0.55))]" />
      <GameSocketBridge />

      {/* Phaser 캔버스 - 하단 HUD(88px) 위까지만 차지 */}
      <div className="absolute inset-0 bottom-[88px]">
        <PhaserGame />
      </div>

      {/* 좌측 하단 채팅창 */}
      <div className="pointer-events-auto absolute bottom-[96px] left-3 z-10 w-[300px]">
        <ChatWindow />
      </div>

      {/* 우측 상단 미니맵 - 작게 */}
      <div className="pointer-events-auto absolute right-3 top-3 z-10 w-[200px]">
        <MiniMap />
      </div>

      {/* 우측 인벤토리 (토글) */}
      <div className="pointer-events-auto absolute bottom-[96px] right-3 z-10">
        <InventoryPanel />
      </div>

      {/* 하단 HUD */}
      <BottomHUD />

      {/* 모달 레이어 */}
      <DialogueWindow />
      <QuestWindow />
      <ShopWindow />
      <DeathScreen />
      <QuizModal />
    </main>
  );
}
