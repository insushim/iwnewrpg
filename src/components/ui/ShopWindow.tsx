"use client";

import { ITEMS } from "@/game/data/items";
import { NPC_LIST } from "@/game/data/npcs";
import { useGameStore } from "@/lib/gameStore";
import { getSocket } from "@/lib/socket";

const rarityClass = {
  common: "text-stone-100",
  uncommon: "text-green-300",
  rare: "text-blue-300",
  epic: "text-fuchsia-300",
  legendary: "text-orange-300",
  mythic: "text-red-300",
} as const;

export function ShopWindow() {
  const ui = useGameStore((state) => state.ui);
  const inventory = useGameStore((state) => state.inventory);
  const player = useGameStore((state) => state.player);
  const setPlayer = useGameStore((state) => state.setPlayer);
  const setInventory = useGameStore((state) => state.setInventory);
  const toggleShop = useGameStore((state) => state.toggleShop);
  const setActiveShop = useGameStore((state) => state.setActiveShop);

  if (!ui.shopOpen) {
    return null;
  }

  const shops = NPC_LIST.filter((npc) => npc.shopInventory?.length);
  const shop = shops.find((entry) => entry.id === ui.activeShopId) ?? shops[0];
  if (!shop) {
    return null;
  }

  const buyItem = (itemId: string, price: number) => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit("shop:buy", { shopId: shop.id, itemId });
      return;
    }

    if (player.gold < price) {
      return;
    }

    const existing = inventory.find((item) => item.id === itemId);
    const itemData = ITEMS[itemId];
    if (!itemData) return;

    setPlayer({ gold: player.gold - price });
    if (existing) {
      setInventory(inventory.map((item) => (item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item)));
    } else {
      setInventory([
        ...inventory,
        {
          id: itemData.id,
          name: itemData.name,
          quantity: 1,
          rarity: itemData.rarity,
          type: itemData.type,
        },
      ]);
    }
  };

  const sellItem = (itemId: string) => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit("shop:sell", { shopId: shop.id, itemId });
      return;
    }

    const entry = inventory.find((item) => item.id === itemId);
    const itemData = ITEMS[itemId];
    if (!entry || !itemData) {
      return;
    }

    const sellPrice = Math.max(1, Math.floor((itemData.price ?? 0) * 0.5));
    setPlayer({ gold: player.gold + sellPrice });
    setInventory(
      inventory
        .map((item) => (item.id === itemId ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0),
    );
  };

  return (
    <div className="panel absolute right-4 top-28 z-30 w-[min(96vw,760px)] rounded-[28px] p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-amber-200/60">Merchant</p>
          <h3 className="mt-1 text-xl font-semibold text-amber-50">상점</h3>
          <p className="mt-1 text-xs text-amber-100/60">{shop.name}</p>
        </div>
        <button
          type="button"
          onClick={toggleShop}
          className="rounded-xl bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-600"
        >
          닫기
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {shops.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setActiveShop(entry.id)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              entry.id === shop.id ? "bg-amber-500 text-black" : "bg-black/25 text-amber-50 hover:bg-black/35"
            }`}
          >
            {entry.name}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[24px] border border-amber-200/10 bg-black/25 p-3">
          <p className="mb-3 text-sm font-semibold text-amber-50">구매</p>
          <div className="space-y-2">
            {shop.shopInventory?.map((entry) => {
              const item = ITEMS[entry.itemId];
              if (!item) return null;
              const price = entry.price ?? item.price ?? 0;
              const quantity = entry.quantity ?? 1;

              return (
                <div key={entry.itemId} className="rounded-2xl border border-amber-200/10 bg-black/20 p-3">
                  <div className={`text-sm font-semibold ${rarityClass[item.rarity]}`}>{item.name}</div>
                  <div className="mt-1 text-xs text-amber-100/70">
                    {quantity > 1 ? `${quantity}개 묶음 / ` : ""}
                    {price} Gold
                  </div>
                  <button
                    type="button"
                    onClick={() => buyItem(entry.itemId, price)}
                    className="mt-2 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500"
                  >
                    구매
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[24px] border border-amber-200/10 bg-black/25 p-3">
          <p className="mb-3 text-sm font-semibold text-amber-50">판매</p>
          <div className="scrollbar-thin max-h-72 space-y-2 overflow-y-auto pr-1">
            {inventory.map((entry) => {
              const item = ITEMS[entry.id];
              const price = Math.max(1, Math.floor((item?.price ?? 0) * 0.5));
              return (
                <div key={entry.id} className="rounded-2xl border border-amber-200/10 bg-black/20 p-3">
                  <div className={`text-sm font-semibold ${rarityClass[entry.rarity]}`}>{entry.name}</div>
                  <div className="mt-1 text-xs text-amber-100/70">
                    보유 {entry.quantity} / 판매가 {price} Gold
                  </div>
                  <button
                    type="button"
                    onClick={() => sellItem(entry.id)}
                    className="mt-2 rounded-lg bg-amber-600 px-2.5 py-1.5 text-xs font-semibold text-black transition hover:bg-amber-500"
                  >
                    판매
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
