"use client";

import { ItemIcon } from "@/components/ui/ItemIcon";
import { EventBus } from "@/components/game/EventBus";
import { ITEMS } from "@/game/data/items";
import { useGameStore } from "@/lib/gameStore";

const rarityClass = {
  common: "text-[#f2e4c2] drop-shadow-[0_0_4px_rgba(242,228,194,0.3)]",
  uncommon: "text-[#71d28f] drop-shadow-[0_0_6px_rgba(113,210,143,0.4)]",
  rare: "text-[#4488ff] drop-shadow-[0_0_6px_rgba(68,136,255,0.4)]",
  epic: "text-[#cb8cff] drop-shadow-[0_0_8px_rgba(203,140,255,0.5)]",
  legendary: "text-[#f0d060] drop-shadow-[0_0_10px_rgba(240,208,96,0.6)]",
  mythic: "text-[#ff4455] drop-shadow-[0_0_12px_rgba(255,68,85,0.7)]",
} as const;

const rarityGlow = {
  common: "shadow-[0_0_8px_rgba(242,228,194,0.2)]",
  uncommon: "shadow-[0_0_12px_rgba(113,210,143,0.3)]",
  rare: "shadow-[0_0_12px_rgba(68,136,255,0.3)]",
  epic: "shadow-[0_0_16px_rgba(203,140,255,0.4)]",
  legendary: "shadow-[0_0_20px_rgba(240,208,96,0.5)]",
  mythic: "shadow-[0_0_24px_rgba(255,68,85,0.6)]",
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
  const isSummonStone =
    selectedItemData?.tags?.includes("summon_stone") ?? false;
  const isTamingStone =
    selectedItemData?.tags?.includes("taming_stone") ?? false;
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
    <section
      className="relative w-[380px] overflow-hidden border-4 border-[#d4a647] bg-[linear-gradient(145deg,#0a0e18,#060a14)] shadow-[0_0_30px_rgba(212,166,71,0.4),inset_0_0_50px_rgba(0,0,0,0.8)]"
      style={{
        borderRadius: "12px",
        borderImage: "linear-gradient(145deg, #f0d060, #d4a647, #8e7540) 1",
        boxShadow: `
          0 0 30px rgba(212, 166, 71, 0.4),
          inset 0 0 50px rgba(0, 0, 0, 0.8),
          inset 0 2px 4px rgba(240, 208, 96, 0.1),
          inset 0 -2px 4px rgba(0, 0, 0, 0.5)
        `,
      }}
    >
      {/* Ornate corner decorations */}
      <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-[#f0d060] opacity-60"></div>
      <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-[#f0d060] opacity-60"></div>
      <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-[#f0d060] opacity-60"></div>
      <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-[#f0d060] opacity-60"></div>

      {/* Stone texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
          radial-gradient(circle at 20% 30%, rgba(240, 208, 96, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(212, 166, 71, 0.1) 0%, transparent 50%),
          linear-gradient(45deg, transparent 40%, rgba(142, 117, 64, 0.1) 50%, transparent 60%)
        `,
        }}
      ></div>

      <div className="relative p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#f0d060] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              ⚔ INVENTORY ⚔
            </p>
            <div className="mt-1 h-px w-24 bg-gradient-to-r from-[#d4a647] to-transparent"></div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="rounded border border-[#8e7540] bg-[linear-gradient(145deg,#060a14,#0a0e18)] px-3 py-1 text-[11px] font-bold text-[#d8c3a1] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
            >
              {items.length}/28
            </span>
            <button
              type="button"
              onClick={toggleInventory}
              className="rounded border border-[#8e7540] bg-[linear-gradient(145deg,#c2263e,#8e1d2f)] px-3 py-1 text-[11px] font-bold text-[#f2e4c2] transition hover:brightness-110 active:scale-95"
              style={{
                textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                boxShadow:
                  "inset 0 1px 2px rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.3)",
              }}
            >
              ✕ CLOSE
            </button>
          </div>
        </div>

        {/* Equipment Slots Section */}
        <div
          className="mb-4 rounded border-2 border-[#8e7540] bg-[linear-gradient(145deg,#060a14,#0a0e18)] p-3"
          style={{
            boxShadow:
              "inset 0 2px 6px rgba(0,0,0,0.8), 0 1px 3px rgba(240,208,96,0.2)",
          }}
        >
          <div className="mb-3 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#d4a647] drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
              ⚜ EQUIPPED GEAR ⚜
            </p>
            <div className="mx-auto mt-1 h-px w-20 bg-gradient-to-r from-transparent via-[#d4a647] to-transparent"></div>
          </div>
          <div className="grid grid-cols-4 gap-2">
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
                  title={equipped?.name ?? label}
                  className="group relative flex flex-col items-center gap-1 rounded border border-[#6b5530] bg-[linear-gradient(145deg,#0a0e18,#060a14)] p-2 text-center transition hover:border-[#d4a647] hover:shadow-[0_0_8px_rgba(212,166,71,0.3)]"
                  style={{
                    boxShadow: equipped
                      ? "inset 0 0 10px rgba(240,208,96,0.2), 0 0 6px rgba(212,166,71,0.4)"
                      : "inset 0 1px 3px rgba(0,0,0,0.8)",
                  }}
                >
                  {/* Equipment slot silhouette background */}
                  <div className="absolute inset-1 rounded bg-[radial-gradient(circle,rgba(107,85,48,0.1),transparent)]"></div>
                  <ItemIcon icon={icon} size="sm" />
                  <span
                    className="text-[8px] font-semibold tracking-[0.1em] text-[#d8c3a1] group-hover:text-[#f0d060]"
                    style={{ textShadow: "0 1px 1px rgba(0,0,0,0.8)" }}
                  >
                    {label}
                  </span>
                  {equipped && (
                    <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#71d28f] shadow-[0_0_4px_rgba(113,210,143,0.6)]"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Inventory Grid Section */}
        <div
          className="mb-4 rounded border-2 border-[#8e7540] bg-[linear-gradient(145deg,#060a14,#0a0e18)] p-3"
          style={{
            boxShadow:
              "inset 0 2px 6px rgba(0,0,0,0.8), 0 1px 3px rgba(240,208,96,0.2)",
          }}
        >
          <div className="mb-3 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#d4a647] drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
              📦 ITEM STORAGE 📦
            </p>
            <div className="mx-auto mt-1 h-px w-24 bg-gradient-to-r from-transparent via-[#d4a647] to-transparent"></div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 28 }).map((_, index) => {
              const item = items[index];
              const itemData = item ? ITEMS[item.id] : null;
              const active = item?.id === selectedInventoryItemId;
              const isSummon =
                itemData?.tags?.includes("summon_stone") ?? false;
              const isTaming =
                itemData?.tags?.includes("taming_stone") ?? false;
              const canUse =
                !isSummon &&
                !isTaming &&
                (itemData?.type === "consumable" ||
                  itemData?.id === "return_scroll" ||
                  itemData?.id === "teleport_scroll");
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
                  className={`group relative aspect-square rounded border-2 transition ${
                    active
                      ? "border-[#f0d060] shadow-[0_0_16px_rgba(240,208,96,0.5)]"
                      : "border-[#6b5530] hover:border-[#8e7540]"
                  }`}
                  style={{
                    background: active
                      ? "linear-gradient(145deg, #0a0e18, #060a14)"
                      : "linear-gradient(145deg, #060a14, #0a0e18)",
                    boxShadow: active
                      ? "inset 0 0 10px rgba(240,208,96,0.3), 0 0 12px rgba(240,208,96,0.4)"
                      : item && itemData
                        ? `inset 0 1px 3px rgba(0,0,0,0.8), ${rarityGlow[item.rarity]}`
                        : "inset 0 1px 3px rgba(0,0,0,0.8)",
                  }}
                >
                  {/* Slot beveled border */}
                  <div className="absolute inset-1 rounded border border-[#8e7540] opacity-30"></div>

                  {item && itemData ? (
                    <>
                      <span className="flex h-full items-center justify-center">
                        <ItemIcon icon={itemData.icon} size="sm" />
                      </span>
                      {item.quantity > 1 && (
                        <span
                          className="absolute bottom-0.5 right-1 text-[8px] font-bold leading-none text-[#f0d060]"
                          style={{
                            textShadow:
                              "0 1px 2px rgba(0,0,0,0.9), 0 0 4px rgba(240,208,96,0.5)",
                          }}
                        >
                          {item.quantity}
                        </span>
                      )}

                      {/* Rarity glow effect */}
                      <div
                        className={`absolute inset-0 rounded opacity-20 transition-opacity group-hover:opacity-40`}
                        style={{
                          background:
                            item.rarity === "legendary"
                              ? "radial-gradient(circle, rgba(240,208,96,0.3) 0%, transparent 60%)"
                              : item.rarity === "mythic"
                                ? "radial-gradient(circle, rgba(255,68,85,0.3) 0%, transparent 60%)"
                                : item.rarity === "epic"
                                  ? "radial-gradient(circle, rgba(203,140,255,0.3) 0%, transparent 60%)"
                                  : item.rarity === "rare"
                                    ? "radial-gradient(circle, rgba(68,136,255,0.3) 0%, transparent 60%)"
                                    : item.rarity === "uncommon"
                                      ? "radial-gradient(circle, rgba(113,210,143,0.3) 0%, transparent 60%)"
                                      : "transparent",
                        }}
                      ></div>
                    </>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Item Details Tooltip */}
        {selectedItem && selectedItemData && (
          <div
            className="rounded border-2 border-[#d4a647] bg-[linear-gradient(145deg,#0a0e18,#060a14)] p-4"
            style={{
              boxShadow:
                "inset 0 2px 6px rgba(0,0,0,0.8), 0 0 15px rgba(212,166,71,0.4), 0 4px 8px rgba(0,0,0,0.5)",
            }}
          >
            <div className="mb-3 flex items-center gap-3 border-b border-[#8e7540] pb-2">
              <div className="text-2xl">{selectedItemData.icon}</div>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-bold ${rarityClass[selectedItem.rarity]}`}
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
                >
                  {selectedItem.name}
                </p>
                <p className="text-[11px] italic text-[#d8c3a1] opacity-80">
                  {selectedItemData.description}
                </p>
              </div>
            </div>

            {/* Stats Display */}
            <div className="mb-3 grid grid-cols-2 gap-2 text-[11px]">
              {selectedItemData.stats.hp && (
                <div className="flex items-center gap-1 text-[#ff4455]">
                  <span>❤</span>
                  <span className="font-bold">
                    HP +{selectedItemData.stats.hp}
                  </span>
                </div>
              )}
              {selectedItemData.stats.mp && (
                <div className="flex items-center gap-1 text-[#4488ff]">
                  <span>✦</span>
                  <span className="font-bold">
                    MP +{selectedItemData.stats.mp}
                  </span>
                </div>
              )}
              {selectedItemData.stats.minAttack && (
                <div className="flex items-center gap-1 text-[#f0d060]">
                  <span>⚔</span>
                  <span className="font-bold">
                    ATK {selectedItemData.stats.minAttack}-
                    {selectedItemData.stats.maxAttack}
                  </span>
                </div>
              )}
              {selectedItemData.stats.ac && (
                <div className="flex items-center gap-1 text-[#71d28f]">
                  <span>🛡</span>
                  <span className="font-bold">
                    AC {selectedItemData.stats.ac}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {isSummonStone ? (
                <button
                  type="button"
                  onClick={() => {
                    EventBus.emit("use_summon_stone", {
                      stoneId: selectedItem.id,
                    });
                    consumeItem(selectedItem.id);
                  }}
                  className="rounded border border-[#71d28f] bg-[linear-gradient(145deg,#2a6e44,#1a4a2e)] px-4 py-2 text-[11px] font-bold text-[#71d28f] transition hover:brightness-110 active:scale-95"
                  style={{
                    textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                    boxShadow:
                      "inset 0 1px 2px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.3)",
                  }}
                >
                  ✦ SUMMON
                </button>
              ) : isTamingStone ? (
                <button
                  type="button"
                  onClick={() => {
                    EventBus.emit("attempt_tame", {});
                    consumeItem(selectedItem.id);
                  }}
                  className="rounded border border-[#f0d060] bg-[linear-gradient(145deg,#7a4f10,#5a3a0c)] px-4 py-2 text-[11px] font-bold text-[#f0d060] transition hover:brightness-110 active:scale-95"
                  style={{
                    textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                    boxShadow:
                      "inset 0 1px 2px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.3)",
                  }}
                >
                  ♦ TAME
                </button>
              ) : usable ? (
                <button
                  type="button"
                  onClick={() => consumeItem(selectedItem.id)}
                  className="rounded border border-[#71d28f] bg-[linear-gradient(145deg,#3e8b5f,#2d6b47)] px-4 py-2 text-[11px] font-bold text-[#f2e4c2] transition hover:brightness-110 active:scale-95"
                  style={{
                    textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                    boxShadow:
                      "inset 0 1px 2px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.3)",
                  }}
                >
                  🍶 USE
                </button>
              ) : null}
              {equippable && (
                <button
                  type="button"
                  onClick={() => equipItem(selectedItem.id)}
                  className="rounded border border-[#d4a647] bg-[linear-gradient(145deg,#b48a46,#8e7540)] px-4 py-2 text-[11px] font-bold text-[#060a14] transition hover:brightness-110 active:scale-95"
                  style={{
                    textShadow: "0 1px 1px rgba(255,255,255,0.3)",
                    boxShadow:
                      "inset 0 1px 2px rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.3)",
                  }}
                >
                  ⚔ EQUIP
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
