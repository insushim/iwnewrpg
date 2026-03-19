"use client";

import { FormEvent, useState } from "react";
import { useGameStore } from "@/lib/gameStore";
import { getSocket } from "@/lib/socket";
import { EventBus } from "@/components/game/EventBus";

export function ChatWindow() {
  const chat = useGameStore((state) => state.chat);
  const addChat = useGameStore((state) => state.addChat);
  const [value, setValue] = useState("");
  const [minimized, setMinimized] = useState(false);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!value.trim()) {
      return;
    }

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
    // Emit chat bubble event for WorldScene
    if (selfId) {
      EventBus.emit("chat_bubble", { playerId: selfId, message: msg });
    }
    setValue("");
  };

  if (minimized) {
    return (
      <div
        className="relative overflow-hidden rounded border-2 border-[#8e7540] bg-[linear-gradient(145deg,#0a0e18,#060a14)] p-3 shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
        style={{
          boxShadow:
            "inset 0 1px 3px rgba(240,208,96,0.2), 0 4px 8px rgba(0,0,0,0.5)",
        }}
      >
        <button
          type="button"
          onClick={() => setMinimized(false)}
          className="flex items-center gap-2 transition hover:brightness-110"
        >
          <span
            className="text-sm font-bold text-[#f0d060]"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
          >
            📜 Chronicle
          </span>
          <span
            className="rounded border border-[#6b5530] bg-[linear-gradient(145deg,#d8c3a1,#b48a46)] px-2 py-1 text-[10px] font-bold text-[#060a14]"
            style={{ textShadow: "0 1px 1px rgba(255,255,255,0.3)" }}
          >
            EXPAND
          </span>
        </button>
      </div>
    );
  }

  return (
    <section
      className="relative flex h-[240px] max-w-[240px] flex-col overflow-hidden rounded border-2 border-[#8e7540] bg-[linear-gradient(145deg,#0a0e18,#060a14)] p-3"
      style={{
        boxShadow:
          "inset 0 2px 8px rgba(0,0,0,0.8), 0 4px 16px rgba(0,0,0,0.6), 0 0 20px rgba(142,117,64,0.3)",
      }}
    >
      {/* Semi-transparent overlay for depth */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(45deg, transparent 40%, rgba(142, 117, 64, 0.1) 50%, transparent 60%),
            radial-gradient(circle at 20% 30%, rgba(240, 208, 96, 0.1) 0%, transparent 50%)
          `,
        }}
      ></div>

      <div className="relative mb-4 flex items-center justify-between border-b border-[#6b5530] pb-2">
        <div>
          <p
            className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#f0d060]"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
          >
            📜 CHRONICLE LOG
          </p>
          <div className="mt-1 h-px w-20 bg-gradient-to-r from-[#d4a647] to-transparent"></div>
        </div>
        <div className="flex items-center gap-2">
          {/* Channel tabs */}
          <span
            className="rounded border border-[#6b5530] bg-[linear-gradient(145deg,#d8c3a1,#b48a46)] px-3 py-1 text-[10px] font-bold text-[#060a14]"
            style={{ textShadow: "0 1px 1px rgba(255,255,255,0.3)" }}
          >
            NORMAL
          </span>
          <button
            type="button"
            onClick={() => setMinimized(true)}
            className="rounded border border-[#8e7540] bg-[linear-gradient(145deg,#c2263e,#8e1d2f)] px-2 py-1 text-[10px] font-bold text-[#f2e4c2] transition hover:brightness-110 active:scale-95"
            style={{
              textShadow: "0 1px 2px rgba(0,0,0,0.8)",
              boxShadow:
                "inset 0 1px 2px rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.3)",
            }}
          >
            ─
          </button>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div
        className="scrollbar-thin relative flex-1 space-y-1 overflow-y-auto rounded border-2 border-[#6b5530] bg-[linear-gradient(145deg,#060a14,#0a0e18)] p-3 text-sm"
        style={{
          boxShadow: "inset 0 2px 6px rgba(0,0,0,0.8)",
          scrollbarColor: "#8e7540 #060a14",
          scrollbarWidth: "thin",
        }}
      >
        {chat.map((message) => {
          // Enhanced channel styling with MMO colors
          const channelStyles = {
            system: {
              color: "#f0d060",
              prefix: "🔔",
              bgColor: "rgba(240,208,96,0.1)",
            },
            trade: {
              color: "#71d28f",
              prefix: "💰",
              bgColor: "rgba(113,210,143,0.1)",
            },
            party: {
              color: "#4488ff",
              prefix: "👥",
              bgColor: "rgba(68,136,255,0.1)",
            },
            normal: {
              color: "#f2e4c2",
              prefix: "💬",
              bgColor: "rgba(242,228,194,0.05)",
            },
          };

          const style =
            channelStyles[message.channel as keyof typeof channelStyles] ||
            channelStyles.normal;

          return (
            <div
              key={message.id}
              className="rounded border border-[#6b5530] px-2 py-1 text-xs leading-relaxed transition hover:border-[#8e7540]"
              style={{
                backgroundColor: style.bgColor,
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3)",
              }}
            >
              <span className="mr-1 text-[10px] text-[#8e7540]">
                {message.timestamp > 0
                  ? new Date(message.timestamp).toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "--:--"}
              </span>
              <span className="mr-1 text-xs opacity-70">{style.prefix}</span>
              <span
                className="mr-2 text-xs font-bold text-[#d8c3a1]"
                style={{ textShadow: "0 1px 1px rgba(0,0,0,0.8)" }}
              >
                [{message.author}]
              </span>
              <span
                className="text-xs"
                style={{
                  color: style.color,
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

      {/* Input Form */}
      <form onSubmit={onSubmit} className="relative mt-3 flex gap-2">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="flex-1 rounded border-2 border-[#6b5530] bg-[linear-gradient(145deg,#0a0e18,#060a14)] px-3 py-2 text-sm text-[#f2e4c2] outline-none transition focus:border-[#d4a647] focus:shadow-[0_0_8px_rgba(212,166,71,0.3)]"
          style={{
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.8)",
            textShadow: "0 1px 2px rgba(0,0,0,0.8)",
          }}
          placeholder="Enter message..."
        />
        <button
          type="submit"
          className="rounded border-2 border-[#8e7540] bg-[linear-gradient(145deg,#b48a46,#8e7540)] px-4 py-2 text-sm font-bold text-[#060a14] transition hover:brightness-110 active:scale-95"
          style={{
            textShadow: "0 1px 1px rgba(255,255,255,0.3)",
            boxShadow:
              "inset 0 1px 2px rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.3)",
          }}
        >
          ⚡ SEND
        </button>
      </form>
    </section>
  );
}
