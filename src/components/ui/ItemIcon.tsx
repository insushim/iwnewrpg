"use client";

type ItemIconProps = {
  icon: string;
  size?: "sm" | "md";
};

const ICON_STYLE: Record<string, { label: string; bg: string; fg: string }> = {
  weapon_dagger_common: { label: "DG", bg: "from-stone-500 to-stone-700", fg: "text-stone-100" },
  weapon_sword_common: { label: "SW", bg: "from-sky-500 to-sky-700", fg: "text-sky-50" },
  weapon_sword_uncommon: { label: "MS", bg: "from-cyan-500 to-cyan-700", fg: "text-cyan-50" },
  weapon_bow_common: { label: "BW", bg: "from-emerald-500 to-emerald-700", fg: "text-emerald-50" },
  weapon_staff_rare: { label: "ST", bg: "from-violet-500 to-violet-700", fg: "text-violet-50" },
  armor_helmet_common: { label: "HM", bg: "from-zinc-500 to-zinc-700", fg: "text-zinc-50" },
  armor_chest_common: { label: "AR", bg: "from-amber-500 to-amber-700", fg: "text-amber-50" },
  armor_chest_uncommon: { label: "LT", bg: "from-lime-500 to-lime-700", fg: "text-lime-50" },
  armor_robe_uncommon: { label: "RB", bg: "from-fuchsia-500 to-fuchsia-700", fg: "text-fuchsia-50" },
  ring_uncommon: { label: "RG", bg: "from-yellow-500 to-yellow-700", fg: "text-yellow-50" },
  potion_red: { label: "HP", bg: "from-rose-500 to-rose-700", fg: "text-rose-50" },
  potion_blue: { label: "MP", bg: "from-blue-500 to-blue-700", fg: "text-blue-50" },
  potion_green: { label: "HS", bg: "from-green-500 to-green-700", fg: "text-green-50" },
  scroll_teleport: { label: "TP", bg: "from-indigo-500 to-indigo-700", fg: "text-indigo-50" },
  scroll_return: { label: "RT", bg: "from-orange-500 to-orange-700", fg: "text-orange-50" },
  scroll_weapon_enchant: { label: "EN", bg: "from-pink-500 to-pink-700", fg: "text-pink-50" },
  material_hide: { label: "HD", bg: "from-amber-700 to-amber-900", fg: "text-amber-50" },
  ammo_arrow_common: { label: "AR", bg: "from-emerald-700 to-lime-900", fg: "text-lime-50" },
  material_mithril: { label: "MT", bg: "from-slate-400 to-slate-700", fg: "text-slate-50" },
  material_crystal: { label: "CR", bg: "from-cyan-400 to-cyan-700", fg: "text-cyan-50" },
  unknown: { label: "--", bg: "from-stone-700 to-stone-900", fg: "text-stone-300" },
};

export function ItemIcon({ icon, size = "md" }: ItemIconProps) {
  const meta = ICON_STYLE[icon] ?? ICON_STYLE.unknown;
  const box = size === "sm" ? "h-8 w-8 text-[10px]" : "h-10 w-10 text-xs";

  return (
    <span
      className={`inline-flex ${box} items-center justify-center rounded-xl bg-gradient-to-br ${meta.bg} font-bold tracking-wide ${meta.fg} shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]`}
    >
      {meta.label}
    </span>
  );
}
