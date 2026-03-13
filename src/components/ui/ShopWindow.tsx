"use client";

import { NPC_LIST } from "@/game/data/npcs";
import { ITEMS } from "@/game/data/items";
import { useGameStore } from "@/lib/gameStore";
import { getSocket } from "@/lib/socket";

const rarityClass = {
  common: "text-stone-100",
  uncommon: "text-green-300",
  rare: "text-blue-300",
  epic: "text-purple-300",
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
    <div className="panel absolute right-4 top-28 z-30 w-[360px] rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-amber-50">상점</h3>
          <p className="text-xs text-amber-100/60">{shop.name}</p>
        </div>
        <button
          type="button"
          onClick={toggleShop}
          className="rounded-xl bg-amber-700 px-3 py-1 text-xs font-semibold text-white"
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
            className={`rounded-xl px-3 py-1 text-xs font-semibold ${
              entry.id === shop.id ? "bg-amber-500 text-black" : "bg-black/30 text-amber-50"
            }`}
          >
            {entry.name}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-amber-200/10 bg-black/30 p-3">
          <p className="mb-2 text-sm font-semibold text-amber-50">구매</p>
          <div className="space-y-2">
            {shop.shopInventory?.map((entry) => {
              const item = ITEMS[entry.itemId];
              if (!item) return null;
              const price = entry.price ?? item.price ?? 0;
              return (
                <div key={entry.itemId} className="rounded-xl border border-amber-200/10 bg-black/20 p-2">
                  <div className={`text-sm font-semibold ${rarityClass[item.rarity]}`}>{item.name}</div>
                  <div className="mt-1 text-xs text-amber-100/70">{price} Gold</div>
                  <button
                    type="button"
                    onClick={() => buyItem(entry.itemId, price)}
                    className="mt-2 rounded-lg bg-emerald-600 px-2 py-1 text-xs font-semibold text-white"
                  >
                    구매
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200/10 bg-black/30 p-3">
          <p className="mb-2 text-sm font-semibold text-amber-50">판매</p>
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {inventory.map((entry) => {
              const item = ITEMS[entry.id];
              const price = Math.max(1, Math.floor((item?.price ?? 0) * 0.5));
              return (
                <div key={entry.id} className="rounded-xl border border-amber-200/10 bg-black/20 p-2">
                  <div className={`text-sm font-semibold ${rarityClass[entry.rarity]}`}>{entry.name}</div>
                  <div className="mt-1 text-xs text-amber-100/70">
                    보유 {entry.quantity} / 판매가 {price} Gold
                  </div>
                  <button
                    type="button"
                    onClick={() => sellItem(entry.id)}
                    className="mt-2 rounded-lg bg-amber-600 px-2 py-1 text-xs font-semibold text-black"
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
