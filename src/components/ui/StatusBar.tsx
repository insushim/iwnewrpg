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
            className="btn-lineage mt-3 rounded-lg px-4 py-1.5 text-xs font-semibold tracking-wider transition"
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
      background: "linear-gradient(180deg, #e83a52 0%, #c2263e 40%, #8b1a2d 100%)",
      glow: "0 0 10px rgba(232,58,82,0.5), inset 0 1px 0 rgba(255,120,140,0.35)",
      topShine: "linear-gradient(180deg, rgba(255,200,200,0.25) 0%, transparent 50%)",
      icon: "HP",
    },
    "bg-game-mp": {
      background: "linear-gradient(180deg, #4a78f0 0%, #2b58d8 40%, #1a3a9a 100%)",
      glow: "0 0 10px rgba(74,120,240,0.5), inset 0 1px 0 rgba(120,160,255,0.35)",
      topShine: "linear-gradient(180deg, rgba(200,220,255,0.25) 0%, transparent 50%)",
      icon: "MP",
    },
    "bg-game-exp": {
      background: "linear-gradient(180deg, #e8c048 0%, #c9a13d 40%, #9a7a28 100%)",
      glow: "0 0 10px rgba(232,192,72,0.4), inset 0 1px 0 rgba(255,220,120,0.35)",
      topShine: "linear-gradient(180deg, rgba(255,240,200,0.2) 0%, transparent 50%)",
      icon: "EXP",
    },
  };

  const style =
    gaugeStyles[color as keyof typeof gaugeStyles] ||
    gaugeStyles["bg-game-exp"];

  return (
    <div>
      <div
        className="mb-1.5 flex items-center justify-between text-xs font-bold text-[#f2e4c2]"
        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
      >
        <span
          className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[9px] font-black tracking-wider"
          style={{
            background: "linear-gradient(180deg, rgba(40,34,20,0.8), rgba(20,16,10,0.9))",
            border: "1px solid rgba(180,138,70,0.3)",
            minWidth: 28,
          }}
        >
          {style.icon}
        </span>
        <span className="text-[11px] text-[#d8c3a1]">
          {current.toLocaleString()}<span className="text-[#8a7a60]">/</span>{max.toLocaleString()}
        </span>
      </div>
      <div
        className="relative h-[18px] overflow-hidden rounded-sm"
        style={{
          background: "linear-gradient(180deg, #040610 0%, #0a0e18 50%, #060a14 100%)",
          border: "1px solid rgba(107,85,48,0.6)",
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.8), 0 1px 0 rgba(255,240,200,0.04)",
        }}
      >
        {/* Gauge fill with multi-layer gradient */}
        <div
          className="absolute inset-0 transition-all duration-300 ease-out"
          style={{
            width: `${Math.max(1, Math.min(100, width))}%`,
            background: style.background,
            boxShadow: style.glow,
          }}
        />

        {/* Top shine — glass-like reflection */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            width: `${Math.max(1, Math.min(100, width))}%`,
            background: (style as Record<string, string>).topShine,
          }}
        />

        {/* Inner frame — ornate */}
        <div
          className="absolute inset-0 pointer-events-none rounded-sm"
          style={{
            border: "1px solid rgba(142,117,64,0.15)",
            boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.4)",
          }}
        />

        {/* Percentage text with drop shadow */}
        <div
          className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#f2e4c2] pointer-events-none"
          style={{
            textShadow: "0 1px 1px rgba(0,0,0,1), 0 0 6px rgba(0,0,0,0.8)",
            letterSpacing: "0.5px",
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
    <div
      className="rounded-lg px-3 py-2"
      style={{
        background: "linear-gradient(180deg, rgba(20,24,34,0.8), rgba(8,10,16,0.9))",
        border: "1px solid rgba(180,138,70,0.18)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,240,200,0.03)",
      }}
    >
      <p className="text-[9px] uppercase tracking-[0.25em] text-[#b4a070]">
        {label}
      </p>
      <p
        className="mt-0.5 truncate text-sm font-semibold text-[#f2e4c2]"
        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}
      >
        {value}
      </p>
    </div>
  );
}
