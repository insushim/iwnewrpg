"use client";

import { useEffect, useState } from "react";

interface WorldBossTimer {
  id: string;
  name: string;
  mapName: string;
  spawnAt: number; // timestamp ms
  isActive: boolean;
}

// World boss spawn schedule (simulated - respawn every 4 hours)
function generateBossTimers(): WorldBossTimer[] {
  const now = Date.now();
  // Offset timers so they appear at different times
  return [
    {
      id: "ancient_dragon",
      name: "고대 드래곤 제루스",
      mapName: "용의 계곡",
      spawnAt: now + 1000 * 60 * 45 + Math.floor(Math.random() * 1000 * 60 * 30),
      isActive: false,
    },
    {
      id: "shadow_lich",
      name: "암흑 리치",
      mapName: "고대 동굴",
      spawnAt: now + 1000 * 60 * 20 + Math.floor(Math.random() * 1000 * 60 * 20),
      isActive: false,
    },
  ];
}

export function WorldBossAlert() {
  const [timers, setTimers] = useState<WorldBossTimer[]>(generateBossTimers);
  const [visible, setVisible] = useState(false);
  const [alertBoss, setAlertBoss] = useState<WorldBossTimer | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const currentNow = Date.now();
      setNow(currentNow);
      setTimers((prev) =>
        prev.map((boss) => {
          if (!boss.isActive && boss.spawnAt <= currentNow) {
            // Boss spawned! Show alert
            setAlertBoss(boss);
            setVisible(true);
            return { ...boss, isActive: true, spawnAt: currentNow + 1000 * 60 * 60 * 4 };
          }
          if (boss.isActive && boss.spawnAt <= currentNow) {
            // Boss despawned, schedule next
            return { ...boss, isActive: false, spawnAt: currentNow + 1000 * 60 * 60 * 4 };
          }
          return boss;
        }),
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => setVisible(false), 8000);
      return () => clearTimeout(t);
    }
  }, [visible]);

  function formatCountdown(ms: number): string {
    if (ms <= 0) return "출현 중!";
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  return (
    <>
      {/* World boss spawn notification */}
      {visible && alertBoss && (
        <div
          className="pointer-events-none fixed left-1/2 top-16 z-[180] -translate-x-1/2 animate-[slideDown_0.4s_ease-out]"
          style={{ animation: "slideDown 0.4s ease-out" }}
        >
          <div
            className="rounded-[20px] border-2 border-[#ef4444]/60 px-8 py-4 text-center shadow-[0_0_40px_rgba(239,68,68,0.4)]"
            style={{ background: "linear-gradient(180deg, rgba(60,6,6,0.97), rgba(20,2,2,0.98))" }}
          >
            <div className="text-[10px] uppercase tracking-[0.4em] text-[#f87171]">⚠ World Boss Spawned</div>
            <div className="mt-1 font-serif text-[20px] font-bold text-[#fca5a5]">{alertBoss.name}</div>
            <div className="mt-0.5 text-[12px] text-[#ef4444]">{alertBoss.mapName} 출현!</div>
          </div>
          <style>{`@keyframes slideDown { from { opacity:0; transform:translateX(-50%) translateY(-20px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
        </div>
      )}

      {/* World boss timer panel (top-right compact) */}
      <div className="pointer-events-auto fixed right-3 top-[58px] z-[50]">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 rounded-[14px] border border-[#ef4444]/30 bg-[rgba(20,4,4,0.88)] px-3 py-1.5 text-[10px] text-[#f87171] shadow-[0_4px_16px_rgba(0,0,0,0.4)] transition hover:border-[#ef4444]/60"
        >
          <span>☠</span>
          <span className="font-semibold">월드 보스</span>
          {timers.some((b) => b.isActive) && (
            <span className="animate-pulse rounded-full bg-[#ef4444] px-1.5 py-0.5 text-[8px] text-white">
              출현 중!
            </span>
          )}
        </button>

        {expanded && (
          <div
            className="mt-1.5 w-[220px] rounded-[16px] border border-[#ef4444]/20 p-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
            style={{ background: "linear-gradient(180deg, rgba(18,4,4,0.98), rgba(8,2,2,0.99))" }}
          >
            <div className="mb-2 text-[10px] uppercase tracking-[0.3em] text-[#f87171]">월드 보스 타이머</div>
            <div className="flex flex-col gap-2">
              {timers.map((boss) => {
                const remaining = boss.spawnAt - now;
                const isSpawned = boss.isActive;
                return (
                  <div
                    key={boss.id}
                    className="rounded-[12px] border p-2"
                    style={{
                      borderColor: isSpawned ? "#ef444466" : "rgba(255,255,255,0.07)",
                      background: isSpawned ? "rgba(239,68,68,0.08)" : "rgba(14,14,18,0.5)",
                    }}
                  >
                    <div className="text-[11px] font-semibold text-[#f5e8c3]">{boss.name}</div>
                    <div className="text-[9px] text-[#9f8560]">{boss.mapName}</div>
                    <div
                      className="mt-1 text-[11px] font-mono font-bold"
                      style={{ color: isSpawned ? "#ef4444" : "#60a5fa" }}
                    >
                      {isSpawned ? "⚔ 출현 중!" : `⏱ ${formatCountdown(remaining)}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
