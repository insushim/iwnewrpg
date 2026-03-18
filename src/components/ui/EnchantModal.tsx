"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/gameStore";
import { getEnchantRate, getEnchantColor, getEnchantedName } from "@/game/systems/enchant";
import { ITEMS } from "@/game/data/items";

export function EnchantModal() {
  const ui = useGameStore((s) => s.ui);
  const inventory = useGameStore((s) => s.inventory);
  const enchantItem = useGameStore((s) => s.enchantItem);
  const toggleEnchant = useGameStore((s) => s.toggleEnchant);

  const [selectedItemUid, setSelectedItemUid] = useState<string | null>(null);
  const [useBlessing, setUseBlessing] = useState(false);
  const [lastResult, setLastResult] = useState<{
    result: "success" | "fail" | "destroy";
    message: string;
    newLevel: number;
  } | null>(null);
  const [animating, setAnimating] = useState(false);

  if (!ui.enchantOpen) return null;

  // Enchantable items (weapons + armor that are not stackable)
  const enchantableItems = inventory.filter((item) => {
    const def = ITEMS[item.id];
    return def && !def.stackable && (def.type === "weapon" || def.type === "armor");
  });

  const hasBlessingScroll = inventory.some((i) => i.id === "blessing_scroll" && i.quantity > 0);
  const hasEnchantScroll = (itemType: string) => {
    if (itemType === "weapon") return inventory.some((i) => i.id === "weapon_enchant_scroll" && i.quantity > 0);
    return inventory.some((i) => i.id === "armor_enchant_scroll" && i.quantity > 0);
  };

  const selectedItem = selectedItemUid
    ? enchantableItems.find((item) => (item.uid ?? item.id) === selectedItemUid)
    : null;
  const selectedDef = selectedItem ? ITEMS[selectedItem.id] : null;
  const currentEnchantLevel = selectedItem?.enchantLevel ?? 0;
  const { successRate, destroyRate } = getEnchantRate(currentEnchantLevel);
  const enchantColor = getEnchantColor(currentEnchantLevel);
  const canEnchant = selectedItem && selectedDef && hasEnchantScroll(selectedDef.type ?? "");

  function handleEnchant() {
    if (!selectedItemUid || !selectedItem || animating) return;
    const result = enchantItem(selectedItemUid, useBlessing && hasBlessingScroll);
    setAnimating(true);
    setLastResult(null);
    setTimeout(() => {
      setLastResult(result);
      setAnimating(false);
      if (result.result === "destroy") {
        setSelectedItemUid(null);
      }
    }, 800);
  }

  const resultColors = {
    success: "#34d399",
    fail: "#f87171",
    destroy: "#ef4444",
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-[130] flex items-center justify-center bg-black/55 backdrop-blur-sm">
      <div
        className="relative w-[480px] rounded-[28px] border border-[#b48a46]/40 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.7)]"
        style={{ background: "linear-gradient(180deg, rgba(14,10,4,0.99) 0%, rgba(6,4,2,0.99) 100%)" }}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.3em] text-[#b79660]">Enchantment</div>
            <div className="font-serif text-[22px] font-bold text-[#f5e8c3]">아이템 강화</div>
          </div>
          <button
            type="button"
            onClick={toggleEnchant}
            className="rounded-full border border-white/10 px-3 py-1.5 text-[12px] text-[#9f8560] transition hover:text-[#f5e8c3]"
          >
            닫기
          </button>
        </div>

        <div className="flex gap-4">
          {/* Item list */}
          <div className="w-[180px] shrink-0">
            <div className="mb-2 text-[11px] text-[#9f8560]">강화할 아이템 선택</div>
            <div className="flex max-h-[280px] flex-col gap-1.5 overflow-y-auto pr-1">
              {enchantableItems.length === 0 && (
                <div className="py-4 text-center text-[11px] text-[#6b7280]">강화 가능한 장비가 없습니다</div>
              )}
              {enchantableItems.map((item) => {
                const lv = item.enchantLevel ?? 0;
                const isSelected = (item.uid ?? item.id) === selectedItemUid;
                const rarityColors: Record<string, string> = {
                  common: "#d4d4d4",
                  uncommon: "#4ade80",
                  rare: "#60a5fa",
                  epic: "#c084fc",
                  legendary: "#fbbf24",
                  mythic: "#f43f5e",
                };
                return (
                  <button
                    key={item.uid ?? item.id}
                    type="button"
                    onClick={() => { setSelectedItemUid(item.uid ?? item.id); setLastResult(null); }}
                    className="rounded-[12px] border p-2 text-left transition"
                    style={{
                      borderColor: isSelected ? "#b48a46" : "rgba(255,255,255,0.06)",
                      background: isSelected ? "rgba(180,138,70,0.15)" : "rgba(14,14,18,0.5)",
                    }}
                  >
                    <div
                      className="text-[11px] font-semibold"
                      style={{ color: getEnchantColor(lv) }}
                    >
                      {getEnchantedName(item.name, lv)}
                    </div>
                    <div className="mt-0.5 text-[9px]" style={{ color: rarityColors[item.rarity] }}>
                      {item.rarity.toUpperCase()}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Enchant panel */}
          <div className="flex-1">
            {selectedItem && selectedDef ? (
              <div className="flex flex-col gap-3">
                {/* Current level display */}
                <div className="rounded-[16px] border border-white/8 bg-white/3 p-3 text-center">
                  <div className="text-[11px] text-[#9f8560]">현재 강화 수치</div>
                  <div
                    className="mt-1 font-serif text-[42px] font-black"
                    style={{ color: enchantColor, textShadow: `0 0 20px ${enchantColor}88` }}
                  >
                    +{currentEnchantLevel}
                  </div>
                  <div className="text-[12px] text-[#d4c4a0]">
                    {getEnchantedName(selectedItem.name, currentEnchantLevel)}
                  </div>
                </div>

                {/* Probability display */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-[12px] border border-white/6 bg-white/3 p-2 text-center">
                    <div className="text-[#9f8560]">성공 확률</div>
                    <div className="mt-0.5 font-bold text-[#34d399]">{(successRate * 100).toFixed(0)}%</div>
                  </div>
                  <div className="rounded-[12px] border border-white/6 bg-white/3 p-2 text-center">
                    <div className="text-[#9f8560]">파괴 확률</div>
                    <div className="mt-0.5 font-bold text-[#f87171]">{(destroyRate * 100).toFixed(0)}%</div>
                  </div>
                </div>

                {/* Blessing option */}
                {hasBlessingScroll && (
                  <button
                    type="button"
                    onClick={() => setUseBlessing(!useBlessing)}
                    className="flex items-center gap-2 rounded-[12px] border p-2 text-[11px] transition"
                    style={{
                      borderColor: useBlessing ? "#c084fc88" : "rgba(255,255,255,0.06)",
                      background: useBlessing ? "rgba(192,132,252,0.12)" : "rgba(14,14,18,0.5)",
                      color: useBlessing ? "#c084fc" : "#9f8560",
                    }}
                  >
                    <div
                      className="h-4 w-4 rounded border flex items-center justify-center"
                      style={{ borderColor: useBlessing ? "#c084fc" : "#6b7280" }}
                    >
                      {useBlessing && <span className="text-[10px] text-[#c084fc]">✓</span>}
                    </div>
                    블레싱 주문서 사용 (파괴 방지)
                  </button>
                )}

                {/* Result display */}
                {animating && (
                  <div className="py-2 text-center">
                    <div className="text-[14px] text-[#f5e8c3] animate-pulse">강화 중...</div>
                  </div>
                )}
                {lastResult && !animating && (
                  <div
                    className="rounded-[12px] border p-2 text-center text-[13px] font-semibold"
                    style={{
                      borderColor: `${resultColors[lastResult.result]}44`,
                      background: `${resultColors[lastResult.result]}10`,
                      color: resultColors[lastResult.result],
                    }}
                  >
                    {lastResult.message}
                  </div>
                )}

                {/* Enchant button */}
                <button
                  type="button"
                  onClick={handleEnchant}
                  disabled={!canEnchant || animating}
                  className="w-full rounded-[16px] border py-3 text-[14px] font-bold transition disabled:opacity-40"
                  style={{
                    borderColor: canEnchant ? "#b48a46" : "rgba(255,255,255,0.1)",
                    background: canEnchant
                      ? "linear-gradient(180deg, rgba(180,138,70,0.85), rgba(120,80,20,0.9))"
                      : "rgba(20,20,24,0.8)",
                    color: canEnchant ? "#f5e8c3" : "#6b7280",
                  }}
                >
                  {canEnchant ? "강화 시도" : "강화 주문서 필요"}
                </button>

                <div className="text-center text-[10px] text-[#6b7280]">
                  {selectedDef.type === "weapon" ? "무기 강화 주문서 필요" : "방어구 강화 주문서 필요"}
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 py-8 text-center text-[13px] text-[#6b7280]">
                <div className="text-[28px]">⚔️</div>
                <div>왼쪽에서 강화할</div>
                <div>아이템을 선택하세요</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
