"use client";

import { ItemIcon } from "@/components/ui/ItemIcon";
import { ITEMS } from "@/game/data/items";
import { useGameStore } from "@/lib/gameStore";

const rarityClass = {
  common: "text-stone-100",
  uncommon: "text-green-300",
  rare: "text-blue-300",
  epic: "text-fuchsia-300",
  legendary: "text-orange-300",
  mythic: "text-red-300",
} as const;

export function InventoryPanel() {
  const items = useGameStore((state) => state.inventory);
  const equipment = useGameStore((state) => state.equipment);
  const selectedInventoryItemId = useGameStore(
    (state) => state.ui.selectedInventoryItemId,
  );
  const inventoryOpen = useGameStore((state) => state.ui.inventoryOpen);
  const selectInventoryItem = useGameStore(
    (state) => state.selectInventoryItem,
  );
  const consumeItem = useGameStore((state) => state.consumeItem);
  const equipItem = useGameStore((state) => state.equipItem);
  const unequipItem = useGameStore((state) => state.unequipItem);
  const toggleInventory = useGameStore((state) => state.toggleInventory);

  const selectedItem = selectedInventoryItemId
    ? (items.find((item) => item.id === selectedInventoryItemId) ?? null)
    : null;
  const selectedItemData = selectedItem ? ITEMS[selectedItem.id] : null;
  const equippable =
    selectedItemData?.type === "weapon" || selectedItemData?.type === "armor";
  const usable =
    selectedItemData?.type === "consumable" ||
    selectedItemData?.id === "return_scroll" ||
    selectedItemData?.id === "teleport_scroll";

  const gearSlots = [
    ["weapon", "무기"],
    ["armor", "갑옷"],
    ["helmet", "투구"],
    ["ring1", "반지"],
  ] as const;

  if (!inventoryOpen) {
    return null;
  }

  return (
    <section className="panel hud-panel w-[300px] rounded-2xl p-3 shadow-2xl">
      {/* 헤더 */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-amber-50">인벤토리</h3>
        <div className="flex items-center gap-1">
          <span className="hud-chip px-2 py-0.5 text-[10px] text-amber-100/60">
            {items.length}/28
          </span>
          <button
            type="button"
            onClick={toggleInventory}
            className="rounded bg-black/30 px-1.5 py-0.5 text-xs text-amber-200/60 hover:text-amber-200"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 장비 슬롯 - 가로 한 줄 */}
      <div className="mb-2 grid grid-cols-4 gap-1">
        {gearSlots.map(([slot, label]) => {
          const equipped = equipment[slot];
          const icon = equipped ? (ITEMS[equipped.id]?.icon ?? "unknown") : "unknown";
          return (
            <button
              key={slot}
              type="button"
              onClick={() => equipped && unequipItem(slot)}
              title={equipped?.name ?? label}
              className="flex flex-col items-center gap-0.5 rounded-lg border border-amber-200/10 bg-black/20 p-1.5 text-center transition hover:border-amber-300/20 hover:bg-black/30"
            >
              <ItemIcon icon={icon} size="sm" />
              <span className="text-[9px] text-amber-200/50">{label}</span>
            </button>
          );
        })}
      </div>

      {/* 아이템 슬롯 - 7열 × 4행 = 28칸 */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 28 }).map((_, index) => {
          const item = items[index];
          const itemData = item ? ITEMS[item.id] : null;
          const active = item?.id === selectedInventoryItemId;
          const canUse =
            itemData?.type === "consumable" ||
            itemData?.id === "return_scroll" ||
            itemData?.id === "teleport_scroll";
          const canEquip =
            itemData?.type === "weapon" || itemData?.type === "armor";

          return (
            <button
              key={index}
              type="button"
              onClick={() => selectInventoryItem(item?.id ?? null)}
              onDoubleClick={() => {
                if (!item) return;
                if (canEquip) { equipItem(item.id); return; }
                if (canUse) consumeItem(item.id);
              }}
              title={item?.name}
              className={`relative aspect-square rounded-lg border bg-black/25 text-xs transition ${
                active
                  ? "border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.25)]"
                  : "border-amber-200/10 hover:border-amber-200/25"
              }`}
            >
              {item && itemData ? (
                <>
                  <span className="flex h-full items-center justify-center">
                    <ItemIcon icon={itemData.icon} size="sm" />
                  </span>
                  {item.quantity > 1 && (
                    <span className="absolute bottom-0 right-0.5 text-[8px] leading-none text-amber-100/70">
                      {item.quantity}
                    </span>
                  )}
                </>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* 선택 아이템 상세 */}
      {selectedItem && selectedItemData ? (
        <div className="mt-2 rounded-xl border border-amber-200/10 bg-black/25 p-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">{selectedItemData.icon}</span>
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-semibold ${rarityClass[selectedItem.rarity]}`}>
                {selectedItem.name}
              </p>
              <p className="truncate text-[10px] text-amber-100/50">
                {selectedItemData.description}
              </p>
            </div>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-2 text-[10px] text-amber-200/80">
            {selectedItemData.stats.hp ? <span>HP +{selectedItemData.stats.hp}</span> : null}
            {selectedItemData.stats.mp ? <span>MP +{selectedItemData.stats.mp}</span> : null}
            {selectedItemData.stats.minAttack ? (
              <span>공격 {selectedItemData.stats.minAttack}-{selectedItemData.stats.maxAttack}</span>
            ) : null}
            {selectedItemData.stats.ac ? <span>AC {selectedItemData.stats.ac}</span> : null}
          </div>
          <div className="mt-2 flex gap-1.5">
            {usable ? (
              <button
                type="button"
                onClick={() => consumeItem(selectedItem.id)}
                className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-emerald-500"
              >
                사용
              </button>
            ) : null}
            {equippable ? (
              <button
                type="button"
                onClick={() => equipItem(selectedItem.id)}
                className="rounded-lg bg-amber-600 px-2.5 py-1 text-[11px] font-semibold text-black transition hover:bg-amber-500"
              >
                장착
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
