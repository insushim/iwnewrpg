import http from "node:http";
import express from "express";
import { createGameServer } from "./gameServer";

const app = express();
const server = http.createServer(app);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "runeword-chronicle-server" });
});

createGameServer(server);

const port = Number(process.env.PORT ?? 3001);
server.listen(port, () => {
  console.log(`RuneWord Chronicle server listening on ${port}`);
});
