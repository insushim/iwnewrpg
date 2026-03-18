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
    <section className="panel hud-panel rounded-[28px] p-4 md:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-amber-200/70">
            RuneWord Chronicle
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-amber-50">
            Lv.{player.level} {player.name}
          </h2>
          <p className="mt-1 text-sm text-amber-100/70">
            {player.className} · {MAPS[currentMapId]?.name ?? currentMapId}
          </p>
        </div>

        <div className="min-w-40 text-right">
          <span className="hud-chip inline-flex px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-amber-100/80">
            {connected ? "서버 연결됨" : "오프라인 모드"}
          </span>
          <p className="mt-3 text-2xl font-semibold text-yellow-300">
            {player.gold.toLocaleString()} Gold
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveShop("radar");
              toggleShop();
            }}
            className="mt-3 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-amber-400"
          >
            상점 열기
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-xs text-amber-100/80 md:grid-cols-5">
        <StatPill label="무기" value={equipment.weapon?.name ?? "비어 있음"} />
        <StatPill label="공격" value={attackRange} />
        <StatPill label="방어" value={`AC ${derived.ac}`} />
        <StatPill label="최대 HP" value={String(derived.maxHp)} />
        <StatPill label="최대 MP" value={String(derived.maxMp)} />
      </div>

      <div className="mt-5 space-y-3">
        <Gauge
          label="HP"
          current={player.hp}
          max={derived.maxHp}
          width={hpRatio}
          color="bg-game-hp"
        />
        <Gauge
          label="MP"
          current={player.mp}
          max={derived.maxMp}
          width={mpRatio}
          color="bg-game-mp"
        />
        <Gauge
          label="EXP"
          current={player.exp}
          max={player.expToNext}
          width={expRatio}
          color="bg-game-exp"
        />
      </div>
    </section>
  );
}

function Gauge({
  label,
  current,
  max,
  width,
  color,
}: {
  label: string;
  current: number;
  max: number;
  width: number;
  color: string;
}) {
  // Enhanced color mappings for Lineage style
  const gaugeStyles = {
    "bg-game-hp": {
      background: "linear-gradient(90deg, #c2263e, #ff4455)",
      glow: "0 0 12px rgba(255, 68, 85, 0.6)",
      icon: "❤️",
    },
    "bg-game-mp": {
      background: "linear-gradient(90deg, #2b58d8, #4488ff)",
      glow: "0 0 12px rgba(68, 136, 255, 0.6)",
      icon: "💙",
    },
    "bg-game-exp": {
      background: "linear-gradient(90deg, #c9a13d, #f0d060)",
      glow: "0 0 12px rgba(240, 208, 96, 0.6)",
      icon: "⭐",
    },
  };

  const style =
    gaugeStyles[color as keyof typeof gaugeStyles] ||
    gaugeStyles["bg-game-exp"];

  return (
    <div>
      <div
        className="mb-2 flex items-center justify-between text-sm font-bold text-[#f2e4c2]"
        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
      >
        <span className="flex items-center gap-2">
          <span className="text-base">{style.icon}</span>
          {label}
        </span>
        <span className="text-[#d8c3a1]">
          {current.toLocaleString()}/{max.toLocaleString()}
        </span>
      </div>
      <div
        className="relative h-4 overflow-hidden rounded border-2 border-[#6b5530]"
        style={{
          background: "linear-gradient(145deg, #060a14, #0a0e18)",
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.8)",
        }}
      >
        {/* Gauge fill */}
        <div
          className="h-full transition-all duration-300 ease-out"
          style={{
            width: `${Math.max(2, Math.min(100, width))}%`,
            background: style.background,
            boxShadow: style.glow,
          }}
        />

        {/* Ornate beveled edge */}
        <div className="absolute inset-1 rounded border border-[#8e7540] opacity-30 pointer-events-none"></div>

        {/* Percentage text overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#f2e4c2] pointer-events-none"
          style={{
            textShadow: "0 1px 2px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.8)",
          }}
        >
          {Math.round(width)}%
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-amber-200/10 bg-black/25 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.22em] text-amber-200/55">
        {label}
      </p>
      <p className="mt-1 truncate text-sm text-amber-50">{value}</p>
    </div>
  );
}
