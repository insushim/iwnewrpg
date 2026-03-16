"use client";

import { FormEvent, useState } from "react";
import { useGameStore } from "@/lib/gameStore";
import { getSocket } from "@/lib/socket";

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

    const socket = getSocket();
    if (socket.connected) {
      socket.emit("chat:send", { message: value.trim() });
    } else {
      addChat({
        id: crypto.randomUUID(),
        author: "나",
        channel: "normal",
        message: value.trim(),
        timestamp: Date.now(),
      });
    }
    setValue("");
  };

  if (minimized) {
    return (
      <div className="relative overflow-hidden rounded-[22px] border border-[#b48a46]/35 bg-[linear-gradient(180deg,rgba(15,19,28,0.94),rgba(6,8,14,0.96))] p-3 shadow-[0_18px_32px_rgba(0,0,0,0.35)]">
        <button type="button" onClick={() => setMinimized(false)} className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#f2e4c2]">채팅</span>
          <span className="rounded-full border border-white/8 bg-white/5 px-2 py-0.5 text-[10px] tracking-[0.18em] text-[#c7ae83]">
            OPEN
          </span>
        </button>
      </div>
    );
  }

  return (
    <section className="relative flex h-[284px] flex-col overflow-hidden rounded-[24px] border border-[#b48a46]/35 bg-[linear-gradient(180deg,rgba(15,19,28,0.94),rgba(6,8,14,0.97))] p-4 shadow-[0_22px_40px_rgba(0,0,0,0.42)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,214,120,0.09),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent)]" />

      <div className="relative mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#b79660]">Chronicle Log</p>
          <h3 className="mt-1 text-lg font-semibold text-[#f2e4c2]">채팅</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/8 bg-white/4 px-3 py-1 text-[10px] tracking-[0.18em] text-[#c7ae83]">
            NORMAL
          </span>
          <button
            type="button"
            onClick={() => setMinimized(true)}
            className="rounded-full border border-white/8 bg-white/4 px-2.5 py-1 text-[10px] text-[#c7ae83] transition hover:text-[#f2e4c2]"
          >
            MIN
          </button>
        </div>
      </div>

      <div className="scrollbar-thin relative flex-1 space-y-2 overflow-y-auto rounded-[18px] border border-white/8 bg-[linear-gradient(180deg,rgba(4,7,12,0.76),rgba(8,12,18,0.92))] p-3 pr-2 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        {chat.map((message) => {
          const tone =
            message.channel === "system"
              ? "text-yellow-300"
              : message.channel === "trade"
                ? "text-orange-300"
                : "text-stone-100";

          return (
            <div key={message.id} className="leading-5">
              <span className="mr-2 text-[#9f8d72]">
                {message.timestamp > 0
                  ? new Date(message.timestamp).toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "--:--"}
              </span>
              <span className="mr-1 font-semibold text-[#f2e4c2]">{message.author}</span>
              <span className={tone}>{message.message}</span>
            </div>
          );
        })}
      </div>

      <form onSubmit={onSubmit} className="relative mt-3 flex gap-2">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="flex-1 rounded-[16px] border border-white/8 bg-black/30 px-3 py-2 text-sm text-[#f2e4c2] outline-none transition placeholder:text-[#8f7b60] focus:border-[#d4b377]/40"
          placeholder="메시지 입력"
        />
        <button className="rounded-[16px] border border-[#e2c078]/45 bg-[linear-gradient(180deg,#dfbe73,#9e6e25)] px-4 py-2 text-sm font-semibold text-[#140d04] transition hover:brightness-105">
          전송
        </button>
      </form>
    </section>
  );
}
