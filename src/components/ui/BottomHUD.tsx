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
      e.returnValue = "전투 중에는 게임을 닫을 수 없습니다.";
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
    <div className="pointer-events-auto fixed bottom-0 left-0 right-0 z-20 px-2 pb-2 md:px-3">
      <div className="relative flex min-h-[80px] items-center gap-2 overflow-hidden rounded-[20px] border border-[#b48a46]/35 bg-[linear-gradient(180deg,rgba(14,18,28,0.96),rgba(4,6,12,0.98))] px-2 py-2 shadow-[0_-10px_40px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,228,168,0.05)] md:min-h-[104px] md:gap-4 md:rounded-[28px] md:px-4 md:py-3">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,214,128,0.09),transparent_28%),linear-gradient(90deg,transparent,rgba(119,168,255,0.04),transparent)]" />
        <div className="absolute inset-[10px] rounded-[22px] border border-white/5" />

        <div className="relative flex shrink-0 items-center gap-2 md:gap-3">
          <div
            className="relative flex h-[54px] w-[54px] items-center justify-center rounded-full border text-[18px] font-bold md:h-[72px] md:w-[72px] md:text-[22px]"
            style={{
              borderColor: `${classColor}99`,
              color: classColor,
              background: `radial-gradient(circle at 35% 30%, ${classColor}33 0%, rgba(11,10,10,0.96) 60%)`,
              boxShadow: `0 0 24px ${classColor}22, inset 0 1px 0 rgba(255,255,255,0.08)`,
            }}
          >
            <div className="absolute inset-[5px] rounded-full border border-white/8" />
            <div className="text-center leading-none">
              <div>{player.className.charAt(0).toUpperCase()}</div>
              <div className="mt-1 text-[9px] font-medium text-[#d4b37b]">
                Lv {player.level}
              </div>
            </div>
          </div>

          <div className="w-[180px] md:w-[252px]">
            <div className="mb-1 flex items-end justify-between">
              <div>
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
                    className="w-[140px] rounded border border-amber-400/50 bg-black/60 px-1.5 py-0.5 text-[13px] font-semibold text-[#f5e8c3] outline-none"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={startEditName}
                    title="클릭하여 닉네임 변경"
                    className="text-[13px] font-semibold text-[#f5e8c3] hover:text-amber-300 hover:underline"
                  >
                    {player.name}
                  </button>
                )}
                <div className="text-[10px] uppercase tracking-[0.22em] text-[#b79660]">
                  {activeTitle ? (
                    <span className="text-[#f0c040]">[{activeTitle}]</span>
                  ) : (
                    classLabel
                  )}
                </div>
                <div className="text-[11px] font-semibold text-[#ffd700] mt-0.5">
                  전투력: {getCombatPower().toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {comboKills > 0 && comboTimer > 0 && (
                  <div className="rounded-full border border-yellow-500/60 bg-yellow-900/50 px-2 py-0.5 text-[9px] tracking-[0.2em] text-yellow-300">
                    {comboKills}x 콤보 ({comboMultiplier.toFixed(1)}x)
                  </div>
                )}
                {autoHuntEnabled && (
                  <div className="rounded-full border border-purple-500/60 bg-purple-900/50 px-2 py-0.5 text-[9px] tracking-[0.2em] text-purple-300 animate-pulse">
                    자동사냥
                  </div>
                )}
                {inCombat && (
                  <div className="rounded-full border border-red-500/60 bg-red-900/50 px-2 py-0.5 text-[9px] tracking-[0.2em] text-red-300 animate-pulse">
                    전투 중
                  </div>
                )}
                <div
                  className={`rounded-full border px-2 py-0.5 text-[9px] tracking-[0.2em] ${
                    connected
                      ? "border-green-400/30 bg-green-400/10 text-green-300"
                      : "border-orange-400/30 bg-orange-400/10 text-orange-300"
                  }`}
                >
                  {connected ? "🟢 온라인" : "🟡 오프라인"}
                </div>
              </div>
            </div>

            <Gauge
              label="HP"
              ratio={hpRatio}
              color="linear-gradient(90deg,#ff6b6b,#c2263e)"
              text={`${player.hp}/${derived.maxHp}`}
            />
            <Gauge
              label="MP"
              ratio={mpRatio}
              color="linear-gradient(90deg,#68a6ff,#2b58d8)"
              text={`${player.mp}/${derived.maxMp}`}
            />
            <Gauge
              label="EXP"
              ratio={expRatio}
              color="linear-gradient(90deg,#c9a13d,#f0d16c)"
              text={`${player.exp}/${player.expToNext}`}
              small
            />
          </div>
        </div>

        <Divider />

        <div className="relative hidden shrink-0 gap-2 md:flex">
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
                className="group relative flex h-[66px] w-[56px] shrink-0 flex-col items-center justify-between overflow-hidden rounded-[16px] border px-1 py-1.5 text-[9px] transition"
                style={{
                  cursor: active ? "pointer" : "default",
                  borderColor: active
                    ? `${slot.color}77`
                    : "rgba(120,120,140,0.24)",
                  background: active
                    ? `linear-gradient(180deg, ${slot.color}26, rgba(10,10,18,0.92))`
                    : "linear-gradient(180deg, rgba(26,28,34,0.88), rgba(10,10,16,0.94))",
                  boxShadow: active
                    ? `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 18px ${slot.color}18`
                    : "none",
                }}
              >
                <span className="text-[#af9166]">{slot.key}</span>
                <div
                  className="flex h-[24px] w-[24px] items-center justify-center rounded-[8px] border text-[12px] font-bold"
                  style={{
                    background: active
                      ? `${slot.color}40`
                      : "rgba(255,255,255,0.04)",
                    borderColor: active
                      ? `${slot.color}88`
                      : "rgba(255,255,255,0.06)",
                    color: active ? "#fff3d6" : "#6b7280",
                  }}
                >
                  {slot.glyph}
                </div>
                <span className="text-[8px] tracking-[0.12em] text-[#e9dcc0]/75">
                  {active ? `x${count}` : slot.label}
                </span>
              </button>
            );
          })}
        </div>

        <Divider />

        <div className="relative hidden shrink-0 items-center md:flex">
          <SkillBar />
        </div>

        <Divider />

        <div className="relative min-w-[120px] shrink-0 rounded-[14px] border border-white/6 bg-white/[0.03] px-2 py-2 md:min-w-[148px] md:rounded-[18px] md:px-3 md:py-2.5">
          <div className="text-[10px] uppercase tracking-[0.26em] text-[#af9166]">
            지역
          </div>
          <div className="mt-1 text-[13px] font-semibold text-[#f5e8c3]">
            {MAPS[currentMapId]?.name ?? currentMapId}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#9f8560]">
            {serverName}
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-[14px] text-[#f2c45d]">G</span>
            <span className="font-mono text-[15px] font-semibold text-[#f7db86]">
              {player.gold.toLocaleString()}
            </span>
          </div>
          {sp > 0 && (
            <div className="mt-1 flex items-center gap-1">
              <span className="animate-pulse rounded-full border border-[#f0c040]/50 bg-[#f0c040]/10 px-2 py-0.5 text-[9px] font-bold text-[#f0c040]">
                SP +{sp}
              </span>
            </div>
          )}
        </div>

        <Divider />

        {/* Chat Window - integrated */}
        <div className="relative hidden min-w-[200px] max-w-[360px] flex-1 self-stretch rounded-[14px] border border-white/6 bg-black/30 px-2 py-1.5 md:block">
          <ChatWindow />
        </div>

        <div className="relative ml-auto flex shrink-0 items-center gap-1 md:gap-2">
          {player.buffs.slice(0, 2).map((buff) => (
            <div
              key={buff.id}
              title={`${buff.name} (${buff.remaining}s)`}
              className="flex h-[40px] w-[40px] items-center justify-center rounded-[14px] border border-emerald-300/20 bg-[linear-gradient(180deg,rgba(38,84,58,0.48),rgba(8,18,14,0.92))] text-[10px] text-emerald-100 shadow-[0_0_18px_rgba(84,214,145,0.12)]"
            >
              축
            </div>
          ))}

          <HudButton
            active={ui.inventoryOpen}
            label="인벤"
            onClick={toggleInventory}
          />
          <div className="relative hidden md:block">
            <HudButton
              active={ui.questWindowOpen}
              label="[Q] 퀘스트"
              onClick={toggleQuestWindow}
            />
          </div>
          <div className="relative hidden md:block">
            <HudButton
              active={ui.achievementsOpen}
              label="[A] 업적"
              onClick={toggleAchievements}
            />
            {claimableAchievements > 0 && (
              <div className="pointer-events-none absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#f0c040] text-[8px] font-bold text-[#1a0f00]">
                {claimableAchievements}
              </div>
            )}
          </div>
          <div className="hidden md:block">
            <HudButton
              active={ui.enchantOpen}
              label="[E] 강화"
              onClick={toggleEnchant}
            />
          </div>
          <div className="hidden md:block">
            <HudButton
              active={autoHuntEnabled}
              label="[Z] 자동사냥"
              onClick={() => useGameStore.getState().toggleAutoHunt()}
            />
          </div>
          <div className="hidden md:block">
            <HudButton
              active={ui.rankingOpen}
              label="[R] 랭킹"
              onClick={toggleRanking}
            />
          </div>
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
    <div className={`flex items-center gap-2 ${small ? "mt-1" : "mt-1.5"}`}>
      <span
        className={`w-7 text-right font-semibold ${small ? "text-[8px]" : "text-[9px]"} text-[#bea277]`}
      >
        {label}
      </span>
      <div
        className={`relative flex-1 overflow-hidden rounded-full border border-white/6 bg-black/50 ${small ? "h-[6px]" : "h-[10px]"}`}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${ratio}%`,
            background: color,
            transition: "width 220ms ease",
          }}
        />
        <div
          className="absolute left-1 right-1 top-[1px] h-[2px] rounded-full bg-white/20"
          style={{ clipPath: `inset(0 ${100 - ratio}% 0 0)` }}
        />
      </div>
      <span
        className={`w-[58px] text-right font-mono ${small ? "text-[8px]" : "text-[9px]"} text-[#d8c3a1]/70`}
      >
        {text}
      </span>
    </div>
  );
}

function Divider() {
  return (
    <div className="h-[58px] w-px shrink-0 bg-[linear-gradient(180deg,transparent,rgba(201,160,95,0.4),transparent)]" />
  );
}

function HudButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[12px] border px-3 py-2 text-[10px] font-semibold tracking-[0.14em] transition"
      style={{
        background: active
          ? "linear-gradient(180deg, rgba(226,193,120,0.95), rgba(165,121,49,0.95))"
          : "linear-gradient(180deg, rgba(26,30,38,0.92), rgba(10,12,18,0.96))",
        color: active ? "#120b03" : "#efdfc0",
        borderColor: active
          ? "rgba(255,232,179,0.6)"
          : "rgba(210,171,106,0.22)",
        boxShadow: active ? "0 0 18px rgba(232,191,97,0.22)" : "none",
      }}
    >
      {label}
    </button>
  );
}
