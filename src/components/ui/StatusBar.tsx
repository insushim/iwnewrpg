"use client";

import { MAPS } from "@/game/data/maps";
import { useGameStore } from "@/lib/gameStore";

export function StatusBar() {
  const player = useGameStore((state) => state.player);
  const connected = useGameStore((state) => state.connected);
  const equipment = useGameStore((state) => state.equipment);
  const derived = useGameStore((state) => state.getDerivedStats());
  const currentMapId = useGameStore((state) => state.currentMapId);
  const toggleShop = useGameStore((state) => state.toggleShop);
  const setActiveShop = useGameStore((state) => state.setActiveShop);

  const hpRatio = (player.hp / Math.max(1, derived.maxHp)) * 100;
  const mpRatio = (player.mp / Math.max(1, derived.maxMp)) * 100;
  const expRatio = (player.exp / Math.max(1, player.expToNext)) * 100;
  const attackRange = `${derived.minAttack}-${derived.maxAttack}`;

  return (
    <div className="panel rounded-2xl p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-200/70">RuneWord Chronicle</p>
          <h2 className="text-xl font-semibold text-amber-50">
            Lv.{player.level} {player.name}
          </h2>
          <p className="text-sm text-amber-100/70">
            {player.className} · {MAPS[currentMapId]?.name ?? currentMapId}
          </p>
        </div>
        <div className="min-w-44 text-right">
          <p className="text-sm text-amber-100/70">{connected ? "서버 연결됨" : "오프라인 모드"}</p>
          <p className="text-lg font-semibold text-yellow-300">{player.gold.toLocaleString()} Gold</p>
          <button
            type="button"
            onClick={() => {
              setActiveShop("radar");
              toggleShop();
            }}
            className="mt-2 rounded-xl bg-amber-500 px-3 py-1 text-xs font-semibold text-black"
          >
            상점
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-xs text-amber-100/75">
        <span>무기: {equipment.weapon?.name ?? "없음"}</span>
        <span>공격: {attackRange}</span>
        <span>AC: {derived.ac}</span>
        <span>최대 HP: {derived.maxHp}</span>
        <span>최대 MP: {derived.maxMp}</span>
      </div>

      <div className="mt-4 space-y-2">
        <Gauge label={`HP ${player.hp}/${derived.maxHp}`} width={hpRatio} color="bg-game-hp" />
        <Gauge label={`MP ${player.mp}/${derived.maxMp}`} width={mpRatio} color="bg-game-mp" />
        <Gauge label={`EXP ${player.exp}/${player.expToNext}`} width={expRatio} color="bg-game-exp" />
      </div>
    </div>
  );
}

function Gauge({
  label,
  width,
  color,
}: {
  label: string;
  width: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-amber-50/80">
        <span>{label}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-black/40">
        <div className={`h-full ${color}`} style={{ width: `${Math.max(4, Math.min(100, width))}%` }} />
      </div>
    </div>
  );
}
