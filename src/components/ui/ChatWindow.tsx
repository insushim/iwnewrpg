"use client";

import { FormEvent, useState } from "react";
import { useGameStore } from "@/lib/gameStore";
import { getSocket } from "@/lib/socket";

export function ChatWindow() {
  const chat = useGameStore((state) => state.chat);
  const addChat = useGameStore((state) => state.addChat);
  const [value, setValue] = useState("");

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

  return (
    <section className="panel hud-panel flex h-[270px] flex-col rounded-[28px] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-amber-200/60">Chat</p>
          <h3 className="mt-1 text-lg font-semibold text-amber-50">채팅</h3>
        </div>
        <span className="hud-chip px-3 py-1 text-[11px] font-semibold text-amber-100/75">일반</span>
      </div>

      <div className="scrollbar-thin flex-1 space-y-2 overflow-y-auto rounded-[22px] border border-amber-200/10 bg-black/20 p-3 pr-2 text-sm">
        {chat.map((message) => (
          <div key={message.id}>
            <span className="mr-2 text-amber-200/50">
              {message.timestamp > 0
                ? new Date(message.timestamp).toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "--:--"}
            </span>
            <span className="mr-1 font-semibold text-amber-50">{message.author}</span>
            <span className="text-stone-100/90">{message.message}</span>
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} className="mt-3 flex gap-2">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="flex-1 rounded-2xl border border-amber-200/10 bg-black/25 px-3 py-2 text-sm text-amber-50 outline-none transition placeholder:text-amber-100/35 focus:border-amber-300/30"
          placeholder="메시지 입력"
        />
        <button className="rounded-2xl bg-amber-600 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-500">
          전송
        </button>
      </form>
    </section>
  );
}
