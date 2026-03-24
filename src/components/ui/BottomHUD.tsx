"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MAPS } from "@/game/data/maps";
import { useGameStore } from "@/lib/gameStore";
import { SkillBar } from "@/components/ui/SkillBar";
import { ChatWindow } from "@/components/ui/ChatWindow";

type QuickSlot = {
  key: string;
  itemId: string | null;
  label: string;
  color: string;
  glyph: string;
};

const QUICK_SLOTS: QuickSlot[] = [
  { key: "1", itemId: "red_potion", label: "HP", color: "#d84a5a", glyph: "+" },
  {
    key: "2",
    itemId: "blue_potion",
    label: "MP",
    color: "#4f7cff",
    glyph: "M",
  },
  {
    key: "3",
    itemId: "teleport_scroll",
    label: "TP",
    color: "#b27cff",
    glyph: "T",
  },
  { key: "4", itemId: null, label: "EMPTY", color: "#4b5563", glyph: "-" },
];

export function BottomHUD() {
  const player = useGameStore((state) => state.player);
  const serverName = useGameStore((state) => state.serverName);
  const connected = useGameStore((state) => state.connected);
  const derived = useGameStore((state) => state.getDerivedStats());
  const currentMapId = useGameStore((state) => state.currentMapId);
  const toggleInventory = useGameStore((state) => state.toggleInventory);
  const toggleQuestWindow = useGameStore((state) => state.toggleQuestWindow);
  const ui = useGameStore((state) => state.ui);
  const inventory = useGameStore((state) => state.inventory);
  const consumeItem = useGameStore((state) => state.consumeItem);

  const inCombat = useGameStore((state) => state.inCombat);
  const toggleAchievements = useGameStore((state) => state.toggleAchievements);
  const toggleEnchant = useGameStore((state) => state.toggleEnchant);
  const comboKills = useGameStore((state) => state.comboKills);
  const comboMultiplier = useGameStore((state) => state.comboMultiplier);
  const comboTimer = useGameStore((state) => state.comboTimer);
  const getCombatPower = useGameStore((state) => state.getCombatPower);
  const autoHuntEnabled = useGameStore((state) => state.autoHuntEnabled);
  const achievements = useGameStore((state) => state.achievements);
  const claimableAchievements = achievements.filter(
    (a) => a.completed && !a.claimed,
  ).length;
  const activeTitle = useGameStore((state) => state.activeTitle);
  const sp = useGameStore((state) => state.sp);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(player.name);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const startEditName = () => {
    setNameInput(player.name);
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.select(), 0);
  };
  const commitName = () => {
    const trimmed = nameInput.trim();
    if (trimmed.length >= 2 && trimmed.length <= 12) {
      useGameStore.getState().setPlayer({ name: trimmed });
    }
    setEditingName(false);
  };

  const hpRatio = Math.max(
    0,
    Math.min(100, (player.hp / Math.max(1, derived.maxHp)) * 100),
  );
  const mpRatio = Math.max(
    0,
    Math.min(100, (player.mp / Math.max(1, derived.maxMp)) * 100),
  );
  const expRatio = Math.max(
    0,
    Math.min(100, (player.exp / Math.max(1, player.expToNext)) * 100),
  );

  const toggleRanking = useGameStore((state) => state.toggleRanking);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === "i" || e.key === "I") toggleInventory();
      if (e.key === "q" || e.key === "Q") toggleQuestWindow();
      if (e.key === "a" || e.key === "A") toggleAchievements();
      if (e.key === "e" || e.key === "E") toggleEnchant();
      if (e.key === "r" || e.key === "R") toggleRanking();
      if (e.key === "z" || e.key === "Z") {
        useGameStore.getState().toggleAutoHunt();
      }
      if (e.key === "1") {
        const hp = inventory?.find((it) => it.id === "red_potion");
        if (hp && hp.quantity > 0) consumeItem("red_potion");
      }
      if (e.key === "2") {
        const mp = inventory?.find((it) => it.id === "blue_potion");
        if (mp && mp.quantity > 0) consumeItem("blue_potion");
      }
      if (e.key === "3") {
        const sc = inventory?.find((it) => it.id === "teleport_scroll");
        if (sc && sc.quantity > 0) consumeItem("teleport_scroll");
      }
    },
    [
      consumeItem,
      inventory,
      toggleInventory,
      toggleQuestWindow,
      toggleAchievements,
      toggleEnchant,
      toggleRanking,
    ],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!inCombat) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [inCombat]);

  const classColors: Record<string, string> = {
    guardian: "#79a7ff",
    ranger: "#71d28f",
    arcanist: "#cb8cff",
    sovereign: "#f1cb6a",
  };
  const normalizedClass = player.className.toLowerCase();
  const classColor = classColors[normalizedClass] ?? "#b2b2b2";
  const classLabel =
    normalizedClass === "guardian"
      ? "가디언"
      : normalizedClass === "ranger"
        ? "레인저"
        : normalizedClass === "arcanist"
          ? "아르카니스트"
          : normalizedClass === "sovereign"
            ? "소버린"
            : player.className;

  return (
    <div className="pointer-events-auto fixed bottom-0 left-0 right-0 z-20">
      {/* Status badges row - above HUD */}
      <div className="flex items-center justify-center gap-1.5 pb-1">
        {comboKills > 0 && comboTimer > 0 && (
          <div className="rounded-full border border-yellow-500/50 bg-yellow-950/80 px-2.5 py-0.5 text-[9px] font-semibold tracking-wider text-yellow-300 backdrop-blur-sm">
            {comboKills}x ({comboMultiplier.toFixed(1)}x)
          </div>
        )}
        {autoHuntEnabled && (
          <div className="animate-pulse rounded-full border border-purple-400/40 bg-purple-950/80 px-2.5 py-0.5 text-[9px] font-semibold tracking-wider text-purple-300 backdrop-blur-sm">
            AUTO
          </div>
        )}
        {inCombat && (
          <div className="animate-pulse rounded-full border border-red-400/40 bg-red-950/80 px-2.5 py-0.5 text-[9px] font-semibold tracking-wider text-red-300 backdrop-blur-sm">
            COMBAT
          </div>
        )}
        {sp > 0 && (
          <div className="animate-pulse rounded-full border border-amber-400/50 bg-amber-950/80 px-2.5 py-0.5 text-[9px] font-bold tracking-wider text-amber-300 backdrop-blur-sm">
            SP {sp}
          </div>
        )}
      </div>

      {/* Main HUD bar */}
      <div className="relative mx-1 mb-0.5 flex h-[80px] items-stretch gap-0 overflow-hidden rounded-t-[16px] border border-b-0 border-[#2a2a3a] bg-[linear-gradient(180deg,rgba(16,18,28,0.98),rgba(8,10,16,0.99))] shadow-[0_-8px_32px_rgba(0,0,0,0.5)] md:mx-2 md:h-[96px] md:rounded-t-[20px]">
        {/* Gold accent line at top */}
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent_5%,rgba(180,138,70,0.3)_30%,rgba(180,138,70,0.5)_50%,rgba(180,138,70,0.3)_70%,transparent_95%)]" />

        {/* === LEFT: Character Info === */}
        <div className="flex shrink-0 items-center gap-2 px-2 md:gap-3 md:px-3">
          {/* Class emblem */}
          <div
            className="relative flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-xl border md:h-[58px] md:w-[58px]"
            style={{
              borderColor: `${classColor}66`,
              background: `radial-gradient(circle at 35% 30%, ${classColor}22 0%, rgba(8,8,12,0.95) 65%)`,
            }}
          >
            <div className="text-center leading-none">
              <div className="text-[16px] font-bold md:text-[18px]" style={{ color: classColor }}>
                {player.className.charAt(0).toUpperCase()}
              </div>
              <div className="text-[8px] font-semibold text-[#c9a869]">
                Lv {player.level}
              </div>
            </div>
          </div>

          {/* Name + bars */}
          <div className="w-[140px] md:w-[180px]">
            <div className="flex items-baseline gap-1.5">
              {editingName ? (
                <input
                  ref={nameInputRef}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onBlur={commitName}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitName();
                    if (e.key === "Escape") setEditingName(false);
                  }}
                  maxLength={12}
                  className="w-[100px] rounded border border-amber-400/50 bg-black/60 px-1 py-0.5 text-[12px] font-semibold text-[#f5e8c3] outline-none"
                />
              ) : (
                <button
                  type="button"
                  onClick={startEditName}
                  title="닉네임 변경"
                  className="truncate text-[12px] font-semibold text-[#f5e8c3] hover:text-amber-300 md:text-[13px]"
                >
                  {player.name}
                </button>
              )}
              <span className="text-[9px] tracking-wide" style={{ color: classColor }}>
                {activeTitle ? `[${activeTitle}]` : classLabel}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-1 text-[9px] text-[#8a7a5a]">
              <span>CP {getCombatPower().toLocaleString()}</span>
              <span
                className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-green-400" : "bg-orange-400"}`}
              />
            </div>
            <Gauge label="HP" ratio={hpRatio} color="linear-gradient(90deg,#ff6b6b,#c2263e)" text={`${player.hp}/${derived.maxHp}`} />
            <Gauge label="MP" ratio={mpRatio} color="linear-gradient(90deg,#68a6ff,#2b58d8)" text={`${player.mp}/${derived.maxMp}`} />
            <Gauge label="EXP" ratio={expRatio} color="linear-gradient(90deg,#c9a13d,#f0d16c)" text={`${player.exp}/${player.expToNext}`} small />
          </div>
        </div>

        <Divider />

        {/* === CENTER-LEFT: Quick slots === */}
        <div className="hidden shrink-0 items-center gap-1.5 px-1 md:flex">
          {QUICK_SLOTS.map((slot) => {
            const invItem = slot.itemId
              ? inventory?.find((it) => it.id === slot.itemId)
              : null;
            const count = invItem?.quantity ?? 0;
            const active = !!slot.itemId && count > 0;
            return (
              <button
                key={slot.key}
                type="button"
                onClick={() => {
                  if (slot.itemId && count > 0) consumeItem(slot.itemId);
                }}
                className="group relative flex h-[56px] w-[46px] shrink-0 flex-col items-center justify-center gap-1 rounded-lg border transition"
                style={{
                  cursor: active ? "pointer" : "default",
                  borderColor: active ? `${slot.color}55` : "rgba(255,255,255,0.06)",
                  background: active
                    ? `linear-gradient(180deg, ${slot.color}18, rgba(8,8,14,0.95))`
                    : "rgba(255,255,255,0.02)",
                }}
              >
                <span className="text-[8px] text-[#8a7a5a]">{slot.key}</span>
                <div
                  className="flex h-[22px] w-[22px] items-center justify-center rounded-md text-[11px] font-bold"
                  style={{
                    background: active ? `${slot.color}30` : "rgba(255,255,255,0.03)",
                    color: active ? "#fff3d6" : "#4b5563",
                  }}
                >
                  {slot.glyph}
                </div>
                <span className="text-[7px] text-[#9a8a6a]">
                  {active ? `x${count}` : slot.label}
                </span>
              </button>
            );
          })}
        </div>

        <Divider className="hidden md:block" />

        {/* === CENTER: Skills === */}
        <div className="hidden shrink-0 items-center px-1 md:flex">
          <SkillBar />
        </div>

        <Divider className="hidden md:block" />

        {/* === CENTER-RIGHT: Area + Gold === */}
        <div className="hidden shrink-0 items-center px-2 md:flex">
          <div className="w-[120px]">
            <div className="text-[9px] uppercase tracking-widest text-[#7a6a4a]">지역</div>
            <div className="text-[12px] font-semibold text-[#f5e8c3]">
              {MAPS[currentMapId]?.name ?? currentMapId}
            </div>
            <div className="text-[9px] text-[#6a5a3a]">{serverName}</div>
            <div className="mt-1 flex items-center gap-1">
              <span className="text-[12px] text-[#e8b84d]">G</span>
              <span className="font-mono text-[13px] font-semibold text-[#f7db86]">
                {player.gold.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <Divider className="hidden md:block" />

        {/* === Chat === */}
        <div className="relative hidden min-w-[160px] max-w-[320px] flex-1 items-stretch py-1 md:flex">
          <div className="w-full overflow-y-auto rounded-lg border border-white/5 bg-black/20 px-2 py-1">
            <ChatWindow />
          </div>
        </div>

        {/* === RIGHT: Menu buttons === */}
        <div className="ml-auto flex shrink-0 items-center gap-1 px-1.5 md:px-2">
          {player.buffs.slice(0, 2).map((buff) => (
            <div
              key={buff.id}
              title={`${buff.name} (${buff.remaining}s)`}
              className="flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-950/40 text-[9px] text-emerald-200"
            >
              BF
            </div>
          ))}
          <MenuBtn active={ui.inventoryOpen} label="인벤" onClick={toggleInventory} />
          <MenuBtn active={ui.questWindowOpen} label="Q" onClick={toggleQuestWindow} hotkey />
          <MenuBtn active={ui.achievementsOpen} label="A" onClick={toggleAchievements} hotkey badge={claimableAchievements} />
          <MenuBtn active={ui.enchantOpen} label="E" onClick={toggleEnchant} hotkey />
          <MenuBtn active={autoHuntEnabled} label="Z" onClick={() => useGameStore.getState().toggleAutoHunt()} hotkey />
          <MenuBtn active={ui.rankingOpen} label="R" onClick={toggleRanking} hotkey />
        </div>
      </div>
    </div>
  );
}

function Gauge({
  label,
  ratio,
  color,
  text,
  small = false,
}: {
  label: string;
  ratio: number;
  color: string;
  text: string;
  small?: boolean;
}) {
  return (
    <div className={`flex items-center gap-1.5 ${small ? "mt-0.5" : "mt-1"}`}>
      <span className={`w-6 text-right font-semibold ${small ? "text-[7px]" : "text-[8px]"} text-[#8a7a5a]`}>
        {label}
      </span>
      <div className={`relative flex-1 overflow-hidden rounded-full bg-black/60 ${small ? "h-[4px]" : "h-[8px]"}`}>
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-200 ease-out"
          style={{ width: `${ratio}%`, background: color }}
        />
        {!small && (
          <div
            className="absolute left-0.5 right-0.5 top-[1px] h-[2px] rounded-full bg-white/15"
            style={{ clipPath: `inset(0 ${100 - ratio}% 0 0)` }}
          />
        )}
      </div>
      <span className={`w-[50px] text-right font-mono ${small ? "text-[7px]" : "text-[8px]"} text-[#7a6a4a]`}>
        {text}
      </span>
    </div>
  );
}

function Divider({ className = "" }: { className?: string }) {
  return (
    <div className={`my-3 w-px shrink-0 bg-[linear-gradient(180deg,transparent,rgba(180,138,70,0.2),transparent)] ${className}`} />
  );
}

function MenuBtn({
  active,
  label,
  onClick,
  hotkey = false,
  badge = 0,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  hotkey?: boolean;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative hidden rounded-lg border px-2 py-1.5 text-[9px] font-semibold tracking-wider transition md:block"
      style={{
        background: active
          ? "linear-gradient(180deg, rgba(210,170,90,0.9), rgba(150,110,40,0.9))"
          : "rgba(255,255,255,0.03)",
        color: active ? "#0f0a03" : "#c9b999",
        borderColor: active ? "rgba(240,210,140,0.5)" : "rgba(255,255,255,0.06)",
      }}
    >
      {hotkey ? `[${label}]` : label}
      {badge > 0 && (
        <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-400 text-[7px] font-bold text-black">
          {badge}
        </span>
      )}
    </button>
  );
}
