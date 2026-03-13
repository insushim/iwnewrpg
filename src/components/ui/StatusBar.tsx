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
          <p className="text-xs uppercase tracking-[0.35em] text-amber-200/70">RuneWord Chronicle</p>
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
          <p className="mt-3 text-2xl font-semibold text-yellow-300">{player.gold.toLocaleString()} Gold</p>
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
        <Gauge label="HP" current={player.hp} max={derived.maxHp} width={hpRatio} color="bg-game-hp" />
        <Gauge label="MP" current={player.mp} max={derived.maxMp} width={mpRatio} color="bg-game-mp" />
        <Gauge label="EXP" current={player.exp} max={player.expToNext} width={expRatio} color="bg-game-exp" />
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
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs text-amber-50/80">
        <span>{label}</span>
        <span>
          {current}/{max}
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full border border-white/5 bg-black/40">
        <div
          className={`h-full ${color} shadow-[0_0_20px_rgba(255,255,255,0.12)]`}
          style={{ width: `${Math.max(4, Math.min(100, width))}%` }}
        />
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-amber-200/10 bg-black/25 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.22em] text-amber-200/55">{label}</p>
      <p className="mt-1 truncate text-sm text-amber-50">{value}</p>
    </div>
  );
}
