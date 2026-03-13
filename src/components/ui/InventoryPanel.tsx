"use client";

import { ITEMS } from "@/game/data/items";
import { useGameStore } from "@/lib/gameStore";

const rarityClass = {
  common: "text-stone-100",
  uncommon: "text-green-300",
  rare: "text-blue-300",
  epic: "text-purple-300",
  legendary: "text-orange-300",
  mythic: "text-red-300",
} as const;

export function InventoryPanel() {
  const items = useGameStore((state) => state.inventory);
  const equipment = useGameStore((state) => state.equipment);
  const selectedInventoryItemId = useGameStore((state) => state.ui.selectedInventoryItemId);
  const selectInventoryItem = useGameStore((state) => state.selectInventoryItem);
  const consumeItem = useGameStore((state) => state.consumeItem);
  const equipItem = useGameStore((state) => state.equipItem);
  const unequipItem = useGameStore((state) => state.unequipItem);

  const selectedItem = selectedInventoryItemId
    ? items.find((item) => item.id === selectedInventoryItemId) ?? null
    : null;
  const selectedItemData = selectedItem ? ITEMS[selectedItem.id] : null;
  const equippable = selectedItemData?.type === "weapon" || selectedItemData?.type === "armor";
  const usable =
    selectedItemData?.type === "consumable" ||
    selectedItemData?.id === "return_scroll" ||
    selectedItemData?.id === "teleport_scroll";

  return (
    <div className="panel rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-amber-50">인벤토리</h3>
        <span className="text-xs text-amber-100/60">28칸</span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
        {(
          [
            ["weapon", "무기"],
            ["armor", "갑옷"],
            ["helmet", "투구"],
            ["ring1", "반지"],
          ] as const
        ).map(([slot, label]) => (
          <button
            key={slot}
            type="button"
            onClick={() => unequipItem(slot)}
            className="rounded-xl border border-amber-200/10 bg-black/30 p-2 text-left"
          >
            <div className="text-amber-200/60">{label}</div>
            <div className="mt-1 text-amber-50">{equipment[slot]?.name ?? "비어 있음"}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 28 }).map((_, index) => {
          const item = items[index];
          const active = item?.id === selectedInventoryItemId;
          return (
            <button
              key={index}
              type="button"
              onClick={() => selectInventoryItem(item?.id ?? null)}
              className={`aspect-square rounded-xl border bg-black/30 p-2 text-left text-xs ${
                active ? "border-amber-400" : "border-amber-200/10"
              }`}
            >
              {item ? (
                <div className="flex h-full flex-col justify-between">
                  <div className={`font-medium ${rarityClass[item.rarity]}`}>{item.name}</div>
                  <div className="text-right text-amber-100/60">x{item.quantity}</div>
                </div>
              ) : null}
            </button>
          );
        })}
      </div>

      {selectedItem && selectedItemData ? (
        <div className="mt-4 rounded-2xl border border-amber-200/10 bg-black/30 p-3">
          <p className={`text-base font-semibold ${rarityClass[selectedItem.rarity]}`}>{selectedItem.name}</p>
          <p className="mt-1 text-xs text-amber-100/70">{selectedItemData.description}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-amber-200/80">
            {selectedItemData.stats.hp ? <span>HP +{selectedItemData.stats.hp}</span> : null}
            {selectedItemData.stats.mp ? <span>MP +{selectedItemData.stats.mp}</span> : null}
            {selectedItemData.stats.minAttack ? (
              <span>
                공격 {selectedItemData.stats.minAttack}-{selectedItemData.stats.maxAttack}
              </span>
            ) : null}
            {selectedItemData.stats.ac ? <span>AC {selectedItemData.stats.ac}</span> : null}
          </div>
          <div className="mt-3 flex gap-2">
            {usable ? (
              <button
                type="button"
                onClick={() => consumeItem(selectedItem.id)}
                className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
              >
                사용
              </button>
            ) : null}
            {equippable ? (
              <button
                type="button"
                onClick={() => equipItem(selectedItem.id)}
                className="rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-black"
              >
                장착
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
