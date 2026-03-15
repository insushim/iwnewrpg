"use client";

import { useEffect, useCallback } from "react";
import { MAPS } from "@/game/data/maps";
import { useGameStore } from "@/lib/gameStore";

export function BottomHUD() {
  const player = useGameStore((state) => state.player);
  const connected = useGameStore((state) => state.connected);
  const derived = useGameStore((state) => state.getDerivedStats());
  const currentMapId = useGameStore((state) => state.currentMapId);
  const toggleInventory = useGameStore((state) => state.toggleInventory);
  const toggleQuestWindow = useGameStore((state) => state.toggleQuestWindow);
  const ui = useGameStore((state) => state.ui);
  const inventory = useGameStore((state) => state.inventory);
  const consumeItem = useGameStore((state) => state.consumeItem);

  const hpRatio = Math.max(
    0,
    Math.min(100, (player.hp / Math.max(1, derived.maxHp)) * 100),
  );
  const mpRatio = Math.max(
    0,
    Math.min(100, (player.mp / Math.max(1, derived.maxMp)) * 100),
  );
  const expRatio = Math.max(
    0,
    Math.min(100, (player.exp / Math.max(1, player.expToNext)) * 100),
  );

  // Quick-use slots: 1=HP포션, 2=MP포션, 3=스크롤, 4=기타소모품
  const quickSlots = [
    { key: "1", itemId: "red_potion", label: "HP 포션", color: "#cc2233" },
    { key: "2", itemId: "blue_potion", label: "MP 포션", color: "#2255cc" },
    {
      key: "3",
      itemId: "teleport_scroll",
      label: "이동 주문서",
      color: "#8844cc",
    },
    { key: "4", itemId: null, label: "비어 있음", color: "#334455" },
  ];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key === "i" || e.key === "I") toggleInventory();
      if (e.key === "q" || e.key === "Q") toggleQuestWindow();
      if (e.key === "1") {
        const hp = inventory.find((it) => it.id === "red_potion");
        if (hp && hp.quantity > 0) consumeItem("red_potion");
      }
      if (e.key === "2") {
        const mp = inventory.find((it) => it.id === "blue_potion");
        if (mp && mp.quantity > 0) consumeItem("blue_potion");
      }
      if (e.key === "3") {
        const sc = inventory.find((it) => it.id === "teleport_scroll");
        if (sc && sc.quantity > 0) consumeItem("teleport_scroll");
      }
    },
    [toggleInventory, toggleQuestWindow, consumeItem, inventory],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const classInitial = player.className.charAt(0).toUpperCase();
  const classColors: Record<string, string> = {
    Guardian: "#4488ff",
    Ranger: "#44cc66",
    Arcanist: "#cc66ff",
    Sovereign: "#ffcc44",
  };
  const classColor = classColors[player.className] ?? "#aaaaaa";

  return (
    <div
      className="pointer-events-auto fixed bottom-0 left-0 right-0 z-20"
      style={{
        height: "88px",
        background:
          "linear-gradient(to top, rgba(3,5,10,0.97), rgba(5,10,20,0.92))",
        borderTop: "1px solid rgba(200,169,110,0.18)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "0 12px",
      }}
    >
      {/* ─── 캐릭터 초상화 ─── */}
      <div style={{ flexShrink: 0, position: "relative" }}>
        {/* 원형 글로우 */}
        <div
          style={{
            position: "absolute",
            inset: -3,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${classColor}33 0%, transparent 70%)`,
          }}
        />
        {/* 초상화 원 */}
        <div
          style={{
            width: 62,
            height: 62,
            borderRadius: "50%",
            border: `2px solid ${classColor}88`,
            background: `radial-gradient(circle at 40% 35%, #1a1008, #0a0804)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <span
            style={{
              fontSize: "22px",
              fontWeight: "bold",
              color: classColor,
              fontFamily: "serif",
            }}
          >
            {classInitial}
          </span>
          <span
            style={{
              fontSize: "9px",
              color: "rgba(200,169,110,0.7)",
              marginTop: "-2px",
            }}
          >
            Lv.{player.level}
          </span>
        </div>
      </div>

      {/* ─── HP/MP/EXP 바 + 이름 ─── */}
      <div
        style={{
          flex: "0 0 220px",
          display: "flex",
          flexDirection: "column",
          gap: "5px",
        }}
      >
        {/* 이름 + 클래스 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: "1px",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: "bold",
              color: "#f0e0b0",
              fontFamily: "sans-serif",
            }}
          >
            {player.name}
          </span>
          <span style={{ fontSize: "9px", color: "rgba(200,169,110,0.55)" }}>
            {player.className}
          </span>
        </div>

        {/* HP 바 */}
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span
            style={{
              width: "16px",
              fontSize: "9px",
              fontWeight: "bold",
              color: "#cc3344",
              textAlign: "right",
            }}
          >
            HP
          </span>
          <div
            style={{
              flex: 1,
              height: "12px",
              background: "rgba(40,8,8,0.85)",
              borderRadius: "3px",
              border: "1px solid rgba(255,255,255,0.06)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${hpRatio}%`,
                background:
                  "linear-gradient(to bottom, #ff4455, #cc2233, #881422)",
                borderRadius: "2px",
                transition: "width 0.25s ease",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "1px",
                left: "2px",
                right: "2px",
                height: "3px",
                background: "rgba(255,255,255,0.18)",
                borderRadius: "2px",
                pointerEvents: "none",
                clipPath: `inset(0 ${100 - hpRatio}% 0 0)`,
              }}
            />
          </div>
          <span
            style={{
              width: "52px",
              fontSize: "9px",
              color: "rgba(255,180,180,0.65)",
              textAlign: "right",
            }}
          >
            {player.hp}/{derived.maxHp}
          </span>
        </div>

        {/* MP 바 */}
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span
            style={{
              width: "16px",
              fontSize: "9px",
              fontWeight: "bold",
              color: "#3366cc",
              textAlign: "right",
            }}
          >
            MP
          </span>
          <div
            style={{
              flex: 1,
              height: "9px",
              background: "rgba(8,10,40,0.85)",
              borderRadius: "3px",
              border: "1px solid rgba(255,255,255,0.06)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${mpRatio}%`,
                background:
                  "linear-gradient(to bottom, #4477ff, #2255cc, #112288)",
                borderRadius: "2px",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <span
            style={{
              width: "52px",
              fontSize: "9px",
              color: "rgba(170,200,255,0.65)",
              textAlign: "right",
            }}
          >
            {player.mp}/{derived.maxMp}
          </span>
        </div>

        {/* EXP 바 */}
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span
            style={{
              width: "16px",
              fontSize: "9px",
              fontWeight: "bold",
              color: "#aa8800",
              textAlign: "right",
            }}
          >
            EX
          </span>
          <div
            style={{
              flex: 1,
              height: "5px",
              background: "rgba(20,14,0,0.85)",
              borderRadius: "2px",
              border: "1px solid rgba(255,255,255,0.05)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${expRatio}%`,
                background: "linear-gradient(to right, #aa8800, #ffcc00)",
                borderRadius: "2px",
                transition: "width 0.4s ease",
              }}
            />
          </div>
          <span
            style={{
              width: "52px",
              fontSize: "9px",
              color: "rgba(255,200,80,0.5)",
              textAlign: "right",
            }}
          >
            {player.exp}/{player.expToNext}
          </span>
        </div>
      </div>

      {/* ─── 세로 구분선 ─── */}
      <div
        style={{
          width: "1px",
          height: "60px",
          background: "rgba(200,169,110,0.12)",
          flexShrink: 0,
        }}
      />

      {/* ─── 퀵슬롯 ─── */}
      <div style={{ display: "flex", gap: "5px", flexShrink: 0 }}>
        {quickSlots.map((slot) => {
          const invItem = slot.itemId
            ? inventory.find((it) => it.id === slot.itemId)
            : null;
          const count = invItem?.quantity ?? 0;
          return (
            <div
              key={slot.key}
              onClick={() => {
                if (slot.itemId && count > 0) consumeItem(slot.itemId);
              }}
              style={{
                width: "48px",
                height: "56px",
                background:
                  count > 0
                    ? `linear-gradient(145deg, ${slot.color}30, rgba(0,0,0,0.6))`
                    : "rgba(10,10,15,0.6)",
                border: `1px solid ${count > 0 ? slot.color + "55" : "rgba(50,50,60,0.5)"}`,
                borderRadius: "6px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "4px 2px",
                cursor: count > 0 ? "pointer" : "default",
                transition: "border-color 0.15s",
                position: "relative",
              }}
            >
              <span style={{ fontSize: "9px", color: "rgba(200,169,110,0.5)" }}>
                {slot.key}
              </span>
              <div style={{ textAlign: "center" }}>
                {count > 0 ? (
                  <>
                    <div
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "4px",
                        background: `${slot.color}44`,
                        margin: "0 auto 2px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span style={{ fontSize: "13px" }}>
                        {slot.itemId === "red_potion"
                          ? "🔴"
                          : slot.itemId === "blue_potion"
                            ? "🔵"
                            : slot.itemId === "teleport_scroll"
                              ? "📜"
                              : "•"}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "9px",
                        color: "rgba(200,200,200,0.7)",
                      }}
                    >
                      x{count}
                    </span>
                  </>
                ) : (
                  <span
                    style={{ fontSize: "18px", color: "rgba(100,100,120,0.3)" }}
                  >
                    —
                  </span>
                )}
              </div>
              <div style={{ height: "8px" }} />
            </div>
          );
        })}
      </div>

      {/* ─── 세로 구분선 ─── */}
      <div
        style={{
          width: "1px",
          height: "60px",
          background: "rgba(200,169,110,0.12)",
          flexShrink: 0,
        }}
      />

      {/* ─── 골드 + 맵 ─── */}
      <div style={{ flexShrink: 0, textAlign: "center", minWidth: "70px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: "14px" }}>🪙</span>
          <span
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              color: "#ffe060",
              fontFamily: "monospace",
            }}
          >
            {player.gold.toLocaleString()}
          </span>
        </div>
        <div
          style={{
            fontSize: "9px",
            color: "rgba(200,169,110,0.45)",
            marginTop: "2px",
          }}
        >
          {MAPS[currentMapId]?.name ?? currentMapId}
        </div>
      </div>

      {/* ─── 빈공간 ─── */}
      <div style={{ flex: 1 }} />

      {/* ─── 버프 표시 ─── */}
      {player.buffs.length > 0 && (
        <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
          {player.buffs.slice(0, 4).map((buff) => (
            <div
              key={buff.id}
              title={`${buff.name} (${buff.remaining}s)`}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "6px",
                background: "rgba(80,160,100,0.2)",
                border: "1px solid rgba(80,200,120,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
              }}
            >
              ✨
            </div>
          ))}
        </div>
      )}

      {/* ─── 메뉴 버튼 ─── */}
      <div style={{ display: "flex", gap: "5px", flexShrink: 0 }}>
        <button
          type="button"
          onClick={toggleInventory}
          style={{
            padding: "6px 10px",
            borderRadius: "6px",
            fontSize: "10px",
            fontWeight: "bold",
            cursor: "pointer",
            border: "1px solid",
            transition: "all 0.15s",
            background: ui.inventoryOpen ? "#c8a96e" : "rgba(10,8,5,0.7)",
            borderColor: ui.inventoryOpen
              ? "#c8a96e"
              : "rgba(200,169,110,0.25)",
            color: ui.inventoryOpen ? "#1a0e00" : "#f0e0b0",
          }}
        >
          [I] 인벤
        </button>
        <button
          type="button"
          onClick={toggleQuestWindow}
          style={{
            padding: "6px 10px",
            borderRadius: "6px",
            fontSize: "10px",
            fontWeight: "bold",
            cursor: "pointer",
            border: "1px solid",
            transition: "all 0.15s",
            background: ui.questWindowOpen ? "#c8a96e" : "rgba(10,8,5,0.7)",
            borderColor: ui.questWindowOpen
              ? "#c8a96e"
              : "rgba(200,169,110,0.25)",
            color: ui.questWindowOpen ? "#1a0e00" : "#f0e0b0",
          }}
        >
          [Q] 퀘스트
        </button>
      </div>

      {/* ─── 연결 상태 ─── */}
      <div style={{ flexShrink: 0 }}>
        <span
          style={{
            padding: "4px 8px",
            borderRadius: "6px",
            fontSize: "9px",
            fontWeight: "bold",
            background: connected
              ? "rgba(40,120,60,0.3)"
              : "rgba(60,60,70,0.3)",
            color: connected ? "#66dd88" : "#888899",
            border: `1px solid ${connected ? "rgba(80,180,100,0.3)" : "rgba(80,80,100,0.3)"}`,
          }}
        >
          {connected ? "온라인" : "오프라인"}
        </span>
      </div>
    </div>
  );
}
