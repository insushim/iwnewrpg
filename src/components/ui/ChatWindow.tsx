"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useGameStore } from "@/lib/gameStore";
import { getSocket } from "@/lib/socket";
import { EventBus } from "@/components/game/EventBus";

/** Compact chat panel designed to embed inside BottomHUD */
export function ChatWindow() {
  const chat = useGameStore((state) => state.chat);
  const addChat = useGameStore((state) => state.addChat);
  const [value, setValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat.length]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!value.trim()) return;

    const msg = value.trim();
    const selfId = useGameStore.getState().selfId;
    const socket = getSocket();
    if (socket.connected) {
      socket.emit("chat:send", { message: msg });
    } else {
      addChat({
        id: crypto.randomUUID(),
        author: "나",
        channel: "normal",
        message: msg,
        timestamp: Date.now(),
      });
    }
    if (selfId) {
      EventBus.emit("chat_bubble", { playerId: selfId, message: msg });
    }
    setValue("");
  };

  const channelStyles: Record<string, { color: string; prefix: string }> = {
    system: { color: "#f0d060", prefix: "🔔" },
    trade: { color: "#71d28f", prefix: "💰" },
    party: { color: "#4488ff", prefix: "👥" },
    normal: { color: "#f2e4c2", prefix: "💬" },
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div
        ref={scrollRef}
        className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto pr-1"
        style={{ scrollbarColor: "#8e7540 #060a14", scrollbarWidth: "thin" }}
      >
        {chat.map((message) => {
          const s = channelStyles[message.channel] ?? channelStyles.normal;
          return (
            <div key={message.id} className="text-[13px] leading-snug">
              <span className="mr-1 text-[11px] text-[#8e7540]">
                {message.timestamp > 0
                  ? new Date(message.timestamp).toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "--:--"}
              </span>
              <span className="mr-0.5 text-[12px] opacity-70">{s.prefix}</span>
              <span
                className="mr-1 font-bold text-[#d8c3a1]"
                style={{ textShadow: "0 1px 1px rgba(0,0,0,0.8)" }}
              >
                [{message.author}]
              </span>
              <span
                style={{
                  color: s.color,
                  textShadow:
                    message.channel === "system"
                      ? "0 0 4px rgba(240,208,96,0.5)"
                      : "0 1px 1px rgba(0,0,0,0.6)",
                }}
              >
                {message.message}
              </span>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <form onSubmit={onSubmit} className="mt-1 flex gap-1">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="min-w-0 flex-1 rounded border border-[#6b5530] bg-black/50 px-2 py-1 text-[13px] text-[#f2e4c2] outline-none transition focus:border-[#d4a647]"
          style={{ boxShadow: "inset 0 1px 3px rgba(0,0,0,0.6)" }}
          placeholder="메시지 입력..."
        />
        <button
          type="submit"
          className="shrink-0 rounded border border-[#8e7540] bg-[linear-gradient(145deg,#b48a46,#8e7540)] px-2 py-1 text-[11px] font-bold text-[#060a14] transition hover:brightness-110 active:scale-95"
        >
          전송
        </button>
      </form>
    </div>
  );
}
