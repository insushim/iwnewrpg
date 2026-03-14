"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket() {
  if (socket) {
    return socket;
  }

  socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001", {
    autoConnect: false,
    reconnectionAttempts: 3,
    timeout: 5000,
  });

  return socket;
}
