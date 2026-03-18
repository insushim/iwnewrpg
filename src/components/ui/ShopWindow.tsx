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
      setInventory(
        inventory.map((item) => (item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item)),
      );
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
    <div className="absolute right-4 top-28 z-30 w-[min(96vw,800px)] overflow-hidden rounded-[30px] border border-[#b48a46]/35 bg-[linear-gradient(180deg,rgba(17,21,30,0.96),rgba(6,8,14,0.98))] p-4 shadow-[0_28px_52px_rgba(0,0,0,0.45)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,214,120,0.08),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent)]" />
      <div className="pointer-events-none absolute inset-[10px] rounded-[22px] border border-white/5" />

      <div className="relative mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#b79660]">Merchant Hall</p>
          <h3 className="mt-1 text-xl font-semibold text-[#f2e4c2]">상점</h3>
          <p className="mt-1 text-xs text-[#b7a282]">{shop.name}</p>
        </div>
        <button
          type="button"
          onClick={toggleShop}
          className="rounded-[14px] border border-[#e2bf74]/45 bg-[linear-gradient(180deg,#dfbe73,#9e6e25)] px-3 py-1.5 text-xs font-semibold text-[#140d04] transition hover:brightness-105"
        >
          닫기
        </button>
      </div>

      <div className="relative mb-4 flex flex-wrap gap-2">
        {shops.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setActiveShop(entry.id)}
            className={`rounded-[14px] border px-3 py-1.5 text-xs font-semibold transition ${
              entry.id === shop.id
                ? "border-[#e2bf74]/45 bg-[linear-gradient(180deg,#dfbe73,#9e6e25)] text-[#140d04]"
                : "border-white/8 bg-white/4 text-[#efdfc0] hover:border-[#d4b377]/24"
            }`}
          >
            {entry.name}
          </button>
        ))}
      </div>

      <div className="relative mb-4 rounded-[18px] border border-white/8 bg-black/20 px-4 py-2 text-sm text-[#f2e4c2]">
        보유 골드: <span className="font-mono text-[#f5d271]">{player.gold.toLocaleString()}</span>
      </div>

      <div className="relative grid gap-4 md:grid-cols-2">
        <ShopColumn title="구매">
          {shop.shopInventory?.map((entry) => {
            const item = ITEMS[entry.itemId];
            if (!item) return null;
            const price = entry.price ?? item.price ?? 0;
            const quantity = entry.quantity ?? 1;

            return (
              <ShopEntry
                key={entry.itemId}
                title={item.name}
                rarity={item.rarity}
                info={`${quantity > 1 ? `${quantity}개 묶음 / ` : ""}${price} Gold`}
                onAction={() => buyItem(entry.itemId, price)}
                actionLabel="BUY"
              />
            );
          })}
        </ShopColumn>

        <ShopColumn title="판매">
          {inventory.map((entry) => {
            const item = ITEMS[entry.id];
            const price = Math.max(1, Math.floor((item?.price ?? 0) * 0.5));
            return (
              <ShopEntry
                key={entry.id}
                title={entry.name}
                rarity={entry.rarity}
                info={`보유 ${entry.quantity} / 판매가 ${price} Gold`}
                onAction={() => sellItem(entry.id)}
                actionLabel="SELL"
                actionTone="sell"
              />
            );
          })}
        </ShopColumn>
      </div>
    </div>
  );
}

function ShopColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-[linear-gradient(180deg,rgba(10,13,19,0.86),rgba(16,20,28,0.96))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <p className="mb-3 text-sm font-semibold text-[#f2e4c2]">{title}</p>
      <div className="scrollbar-thin max-h-72 space-y-2 overflow-y-auto pr-1">{children}</div>
    </div>
  );
}

function ShopEntry({
  title,
  rarity,
  info,
  onAction,
  actionLabel,
  actionTone = "buy",
}: {
  title: string;
  rarity: keyof typeof rarityClass;
  info: string;
  onAction: () => void;
  actionLabel: string;
  actionTone?: "buy" | "sell";
}) {
  return (
    <div className="rounded-[16px] border border-white/8 bg-black/22 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <div className={`text-sm font-semibold ${rarityClass[rarity]}`}>{title}</div>
      <div className="mt-1 text-xs text-[#b7a282]">{info}</div>
      <button
        type="button"
        onClick={onAction}
        className="mt-2 rounded-[12px] border px-3 py-1.5 text-[11px] font-semibold transition hover:brightness-110"
        style={{
          background:
            actionTone === "buy"
              ? "linear-gradient(180deg,#3e8b5f,#205438)"
              : "linear-gradient(180deg,#dfbe73,#9e6e25)",
          borderColor:
            actionTone === "buy" ? "rgba(110,227,154,0.25)" : "rgba(226,191,116,0.45)",
          color: actionTone === "buy" ? "#ffffff" : "#140d04",
        }}
      >
        {actionLabel}
      </button>
    </div>
  );
}
