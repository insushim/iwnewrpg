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
    <div className="panel flex h-72 flex-col rounded-2xl p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-amber-50">채팅</h3>
        <span className="text-xs text-amber-100/60">일반</span>
      </div>
      <div className="scrollbar-thin flex-1 space-y-2 overflow-y-auto pr-1 text-sm">
        {chat.map((message) => (
          <div key={message.id}>
            <span className="mr-2 text-amber-200/60">
              {new Date(message.timestamp).toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="mr-1 font-semibold text-amber-50">{message.author}</span>
            <span className="text-stone-100">{message.message}</span>
          </div>
        ))}
      </div>
      <form onSubmit={onSubmit} className="mt-3 flex gap-2">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="flex-1 rounded-xl border border-amber-200/10 bg-black/30 px-3 py-2 text-sm outline-none"
          placeholder="메시지 입력"
        />
        <button className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-black">전송</button>
      </form>
    </div>
  );
}
