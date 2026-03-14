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
    <section className="panel hud-panel rounded-[28px] p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-amber-200/60">
            Inventory
          </p>
          <h3 className="mt-1 text-lg font-semibold text-amber-50">인벤토리</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="hud-chip px-3 py-1 text-[11px] font-semibold text-amber-100/75">
            28칸
          </span>
          <button
            type="button"
            onClick={toggleInventory}
            className="rounded-lg bg-black/30 px-2 py-1 text-xs text-amber-200/60 hover:text-amber-200"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
        {gearSlots.map(([slot, label]) => {
          const equipped = equipment[slot];
          const icon = equipped
            ? (ITEMS[equipped.id]?.icon ?? "unknown")
            : "unknown";
          return (
            <button
              key={slot}
              type="button"
              onClick={() => equipped && unequipItem(slot)}
              className="rounded-2xl border border-amber-200/10 bg-black/20 p-3 text-left transition hover:border-amber-300/20 hover:bg-black/30"
            >
              <div className="flex items-center gap-2">
                <ItemIcon icon={icon} size="sm" />
                <div className="min-w-0">
                  <div className="text-amber-200/55">{label}</div>
                  <div className="mt-1 truncate text-amber-50">
                    {equipped?.name ?? "비어 있음"}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-4 gap-2">
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
                if (canEquip) {
                  equipItem(item.id);
                  return;
                }
                if (canUse) {
                  consumeItem(item.id);
                }
              }}
              className={`aspect-square rounded-2xl border bg-black/25 p-2 text-left text-xs transition ${
                active
                  ? "border-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.18)]"
                  : "border-amber-200/10 hover:border-amber-200/25"
              }`}
            >
              {item && itemData ? (
                <div className="flex h-full flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <ItemIcon icon={itemData.icon} size="sm" />
                    <div
                      className={`line-clamp-2 text-right font-medium leading-4 ${rarityClass[item.rarity]}`}
                    >
                      {item.name}
                    </div>
                  </div>
                  <div className="text-right text-amber-100/60">
                    x{item.quantity}
                  </div>
                </div>
              ) : null}
            </button>
          );
        })}
      </div>

      {selectedItem && selectedItemData ? (
        <div className="mt-4 rounded-[24px] border border-amber-200/10 bg-black/25 p-4">
          <div className="flex items-center gap-3">
            <ItemIcon icon={selectedItemData.icon} />
            <div>
              <p
                className={`text-base font-semibold ${rarityClass[selectedItem.rarity]}`}
              >
                {selectedItem.name}
              </p>
              <p className="text-xs text-amber-100/50">
                {selectedItemData.icon}
              </p>
            </div>
          </div>
          <p className="mt-2 text-xs leading-5 text-amber-100/70">
            {selectedItemData.description}
          </p>

          <div className="mt-3 flex flex-wrap gap-2 text-xs text-amber-200/80">
            {selectedItemData.stats.hp ? (
              <span>HP +{selectedItemData.stats.hp}</span>
            ) : null}
            {selectedItemData.stats.mp ? (
              <span>MP +{selectedItemData.stats.mp}</span>
            ) : null}
            {selectedItemData.stats.minAttack ? (
              <span>
                공격 {selectedItemData.stats.minAttack}-
                {selectedItemData.stats.maxAttack}
              </span>
            ) : null}
            {selectedItemData.stats.ac ? (
              <span>AC {selectedItemData.stats.ac}</span>
            ) : null}
          </div>

          <div className="mt-4 flex gap-2">
            {usable ? (
              <button
                type="button"
                onClick={() => consumeItem(selectedItem.id)}
                className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
              >
                사용
              </button>
            ) : null}
            {equippable ? (
              <button
                type="button"
                onClick={() => equipItem(selectedItem.id)}
                className="rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-black transition hover:bg-amber-500"
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
