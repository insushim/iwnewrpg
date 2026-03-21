"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket() {
  if (socket) {
    return socket;
  }

  socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001", {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 3, // Reduced to avoid spam
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 5000,
    forceNew: true, // Ensure clean connection
  });

  // Suppress console error spam when server unavailable
  socket.on("connect_error", (error) => {
    // Silent fail for offline mode - game will work offline
    console.info("서버 연결 실패 - 오프라인 모드로 진행합니다");
  });

  socket.on("disconnect", (reason) => {
    if (reason === "io server disconnect" || reason === "transport close") {
      console.info("서버 연결 끊김 - 오프라인 모드로 전환합니다");
    }
  });

  return socket;
}
