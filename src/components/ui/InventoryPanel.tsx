"use client";

import { ItemIcon } from "@/components/ui/ItemIcon";
import { EventBus } from "@/components/game/EventBus";
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
  const selectedInventoryItemId = useGameStore((state) => state.ui.selectedInventoryItemId);
  const inventoryOpen = useGameStore((state) => state.ui.inventoryOpen);
  const selectInventoryItem = useGameStore((state) => state.selectInventoryItem);
  const consumeItem = useGameStore((state) => state.consumeItem);
  const equipItem = useGameStore((state) => state.equipItem);
  const unequipItem = useGameStore((state) => state.unequipItem);
  const toggleInventory = useGameStore((state) => state.toggleInventory);

  const selectedItem = selectedInventoryItemId
    ? (items.find((item) => item.id === selectedInventoryItemId) ?? null)
    : null;
  const selectedItemData = selectedItem ? ITEMS[selectedItem.id] : null;
  const equippable = selectedItemData?.type === "weapon" || selectedItemData?.type === "armor";
  const isSummonStone = selectedItemData?.tags?.includes("summon_stone") ?? false;
  const isTamingStone = selectedItemData?.tags?.includes("taming_stone") ?? false;
  const usable =
    !isSummonStone &&
    !isTamingStone &&
    (selectedItemData?.type === "consumable" ||
    selectedItemData?.id === "return_scroll" ||
    selectedItemData?.id === "teleport_scroll");

  const gearSlots = [
    ["weapon", "WEAPON"],
    ["armor", "ARMOR"],
    ["helmet", "HELM"],
    ["ring1", "RING"],
  ] as const;

  if (!inventoryOpen) {
    return null;
  }

  return (
    <section className="relative w-[328px] overflow-hidden rounded-[26px] border border-[#b48a46]/35 bg-[linear-gradient(180deg,rgba(16,20,28,0.95),rgba(7,9,15,0.97))] p-3.5 shadow-[0_24px_44px_rgba(0,0,0,0.45)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,214,120,0.08),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent)]" />
      <div className="pointer-events-none absolute inset-[10px] rounded-[20px] border border-white/5" />

      <div className="relative mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#b79660]">Armory</p>
          <h3 className="mt-1 text-sm font-semibold text-[#f2e4c2]">인벤토리</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full border border-white/8 bg-white/4 px-2 py-0.5 text-[10px] text-[#c7ae83]">
            {items.length}/28
          </span>
          <button
            type="button"
            onClick={toggleInventory}
            className="rounded-full border border-white/8 bg-white/4 px-2 py-0.5 text-[10px] text-[#c7ae83] transition hover:text-[#f2e4c2]"
          >
            CLOSE
          </button>
        </div>
      </div>

      <div className="relative mb-3 rounded-[18px] border border-white/6 bg-white/[0.03] p-2">
        <div className="mb-2 text-[10px] uppercase tracking-[0.22em] text-[#b79660]">Equipped</div>
        <div className="grid grid-cols-4 gap-1.5">
        {gearSlots.map(([slot, label]) => {
          const equipped = equipment[slot];
          const icon = equipped ? (ITEMS[equipped.id]?.icon ?? "unknown") : "unknown";
          return (
            <button
              key={slot}
              type="button"
              onClick={() => equipped && unequipItem(slot)}
              title={equipped?.name ?? label}
              className="flex flex-col items-center gap-1 rounded-[14px] border border-white/8 bg-[linear-gradient(180deg,rgba(22,26,34,0.9),rgba(8,10,16,0.92))] p-2 text-center transition hover:border-[#d4b377]/28"
            >
              <ItemIcon icon={icon} size="sm" />
              <span className="text-[8px] tracking-[0.18em] text-[#a98e67]">{label}</span>
            </button>
          );
        })}
        </div>
      </div>

      <div className="relative rounded-[18px] border border-white/6 bg-black/18 p-2.5">
        <div className="mb-2 text-[10px] uppercase tracking-[0.22em] text-[#b79660]">Inventory Grid</div>
        <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: 28 }).map((_, index) => {
          const item = items[index];
          const itemData = item ? ITEMS[item.id] : null;
          const active = item?.id === selectedInventoryItemId;
          const isSummon = itemData?.tags?.includes("summon_stone") ?? false;
          const isTaming = itemData?.tags?.includes("taming_stone") ?? false;
          const canUse =
            !isSummon && !isTaming &&
            (itemData?.type === "consumable" ||
            itemData?.id === "return_scroll" ||
            itemData?.id === "teleport_scroll");
          const canEquip = itemData?.type === "weapon" || itemData?.type === "armor";

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
                if (isSummon) {
                  EventBus.emit("use_summon_stone", { stoneId: item.id });
                  consumeItem(item.id);
                  return;
                }
                if (isTaming) {
                  EventBus.emit("attempt_tame", {});
                  consumeItem(item.id);
                  return;
                }
                if (canUse) consumeItem(item.id);
              }}
              title={item?.name}
              className={`relative aspect-square rounded-[12px] border bg-[linear-gradient(180deg,rgba(18,22,28,0.86),rgba(8,10,16,0.96))] text-xs transition ${
                active
                  ? "border-[#e2bf74] shadow-[0_0_14px_rgba(255,204,102,0.22)]"
                  : "border-white/8 hover:border-[#d4b377]/24"
              }`}
            >
              {item && itemData ? (
                <>
                  <span className="flex h-full items-center justify-center">
                    <ItemIcon icon={itemData.icon} size="sm" />
                  </span>
                  {item.quantity > 1 ? (
                    <span className="absolute bottom-0.5 right-1 text-[8px] leading-none text-[#ead8b2]/72">
                      {item.quantity}
                    </span>
                  ) : null}
                </>
              ) : null}
            </button>
          );
        })}
        </div>
      </div>

      {selectedItem && selectedItemData ? (
        <div className="relative mt-3 rounded-[18px] border border-white/8 bg-[linear-gradient(180deg,rgba(9,12,18,0.88),rgba(15,18,24,0.96))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <div className="flex items-center gap-2">
            <span className="text-xl">{selectedItemData.icon}</span>
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-semibold ${rarityClass[selectedItem.rarity]}`}>{selectedItem.name}</p>
              <p className="truncate text-[10px] text-[#b7a282]">{selectedItemData.description}</p>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-[#dfca9f]">
            {selectedItemData.stats.hp ? <span>HP +{selectedItemData.stats.hp}</span> : null}
            {selectedItemData.stats.mp ? <span>MP +{selectedItemData.stats.mp}</span> : null}
            {selectedItemData.stats.minAttack ? (
              <span>
                ATK {selectedItemData.stats.minAttack}-{selectedItemData.stats.maxAttack}
              </span>
            ) : null}
            {selectedItemData.stats.ac ? <span>AC {selectedItemData.stats.ac}</span> : null}
          </div>

          <div className="mt-3 flex gap-2">
            {isSummonStone ? (
              <button
                type="button"
                onClick={() => {
                  EventBus.emit("use_summon_stone", { stoneId: selectedItem.id });
                  consumeItem(selectedItem.id);
                }}
                className="rounded-[12px] border border-emerald-400/40 bg-[linear-gradient(180deg,#2a6e44,#0f3820)] px-3 py-1.5 text-[11px] font-semibold text-emerald-200 transition hover:brightness-110"
              >
                ✦ 소환
              </button>
            ) : isTamingStone ? (
              <button
                type="button"
                onClick={() => {
                  EventBus.emit("attempt_tame", {});
                  consumeItem(selectedItem.id);
                }}
                className="rounded-[12px] border border-amber-400/40 bg-[linear-gradient(180deg,#7a4f10,#3d2008)] px-3 py-1.5 text-[11px] font-semibold text-amber-200 transition hover:brightness-110"
              >
                ♦ 테이밍
              </button>
            ) : usable ? (
              <button
                type="button"
                onClick={() => consumeItem(selectedItem.id)}
                className="rounded-[12px] border border-emerald-300/24 bg-[linear-gradient(180deg,#3e8b5f,#205438)] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:brightness-110"
              >
                USE
              </button>
            ) : null}
            {equippable ? (
              <button
                type="button"
                onClick={() => equipItem(selectedItem.id)}
                className="rounded-[12px] border border-[#e2bf74]/45 bg-[linear-gradient(180deg,#dfbe73,#9e6e25)] px-3 py-1.5 text-[11px] font-semibold text-[#140d04] transition hover:brightness-105"
              >
                EQUIP
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
