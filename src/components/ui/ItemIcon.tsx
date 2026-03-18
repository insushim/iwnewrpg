"use client";

type ItemIconProps = {
  icon: string;
  size?: "sm" | "md";
};

type IconMeta = {
  glyph: string;
  accent: string;
  rim: string;
  bg: string;
  fg: string;
};

const ICON_STYLE: Record<string, IconMeta> = {
  weapon_dagger_common: { glyph: "DG", accent: "▸", rim: "border-stone-300/40", bg: "from-stone-500 to-stone-800", fg: "text-stone-100" },
  weapon_sword_common: { glyph: "SW", accent: "✦", rim: "border-sky-300/40", bg: "from-sky-500 to-sky-800", fg: "text-sky-50" },
  weapon_sword_uncommon: { glyph: "LS", accent: "✦", rim: "border-cyan-300/50", bg: "from-cyan-500 to-cyan-800", fg: "text-cyan-50" },
  weapon_bow_common: { glyph: "BW", accent: "➶", rim: "border-emerald-300/40", bg: "from-emerald-500 to-emerald-800", fg: "text-emerald-50" },
  weapon_staff_rare: { glyph: "ST", accent: "✧", rim: "border-violet-300/50", bg: "from-violet-500 to-violet-800", fg: "text-violet-50" },
  armor_helmet_common: { glyph: "HM", accent: "◈", rim: "border-zinc-300/40", bg: "from-zinc-500 to-zinc-800", fg: "text-zinc-50" },
  armor_chest_common: { glyph: "AR", accent: "▣", rim: "border-amber-300/40", bg: "from-amber-500 to-amber-800", fg: "text-amber-50" },
  armor_chest_uncommon: { glyph: "LT", accent: "▣", rim: "border-lime-300/40", bg: "from-lime-500 to-lime-800", fg: "text-lime-50" },
  armor_robe_uncommon: { glyph: "RB", accent: "✧", rim: "border-fuchsia-300/40", bg: "from-fuchsia-500 to-fuchsia-800", fg: "text-fuchsia-50" },
  ring_uncommon: { glyph: "RG", accent: "◌", rim: "border-yellow-300/50", bg: "from-yellow-500 to-yellow-800", fg: "text-yellow-50" },
  potion_red: { glyph: "HP", accent: "+", rim: "border-rose-300/45", bg: "from-rose-500 to-rose-800", fg: "text-rose-50" },
  potion_blue: { glyph: "MP", accent: "+", rim: "border-blue-300/45", bg: "from-blue-500 to-blue-800", fg: "text-blue-50" },
  potion_green: { glyph: "HS", accent: "+", rim: "border-green-300/45", bg: "from-green-500 to-green-800", fg: "text-green-50" },
  scroll_teleport: { glyph: "TP", accent: "⟡", rim: "border-indigo-300/45", bg: "from-indigo-500 to-indigo-800", fg: "text-indigo-50" },
  scroll_return: { glyph: "RT", accent: "⟲", rim: "border-orange-300/45", bg: "from-orange-500 to-orange-800", fg: "text-orange-50" },
  scroll_weapon_enchant: { glyph: "EN", accent: "✦", rim: "border-pink-300/45", bg: "from-pink-500 to-pink-800", fg: "text-pink-50" },
  material_hide: { glyph: "HD", accent: "◆", rim: "border-amber-400/35", bg: "from-amber-700 to-amber-950", fg: "text-amber-50" },
  ammo_arrow_common: { glyph: "AR", accent: "➶", rim: "border-lime-300/35", bg: "from-emerald-700 to-lime-950", fg: "text-lime-50" },
  material_mithril: { glyph: "MT", accent: "◈", rim: "border-slate-200/45", bg: "from-slate-400 to-slate-800", fg: "text-slate-50" },
  material_crystal: { glyph: "CR", accent: "✧", rim: "border-cyan-200/45", bg: "from-cyan-400 to-cyan-800", fg: "text-cyan-50" },
  unknown: { glyph: "?", accent: "•", rim: "border-stone-400/30", bg: "from-stone-700 to-stone-950", fg: "text-stone-300" },
};

export function ItemIcon({ icon, size = "md" }: ItemIconProps) {
  const meta = ICON_STYLE[icon] ?? ICON_STYLE.unknown;
  const box = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const glyphClass = size === "sm" ? "text-[9px]" : "text-[11px]";
  const accentClass = size === "sm" ? "text-[8px]" : "text-[9px]";

  return (
    <span
      className={`relative inline-flex ${box} items-center justify-center overflow-hidden rounded-xl border ${meta.rim} bg-gradient-to-br ${meta.bg} font-bold tracking-wide ${meta.fg} shadow-[0_4px_12px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.2)]`}
    >
      <span className="absolute inset-[2px] rounded-[10px] border border-white/10" />
      <span className="absolute left-1 top-0.5 text-[7px] text-white/60">{meta.accent}</span>
      <span className={`relative ${glyphClass}`}>{meta.glyph}</span>
      <span className={`absolute bottom-0.5 right-1 text-white/35 ${accentClass}`}>{meta.accent}</span>
    </span>
  );
}
