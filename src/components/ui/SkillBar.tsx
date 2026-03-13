const slots = [
  { key: "F1", label: "기본 공격", accent: "from-amber-300/20 to-amber-500/10" },
  { key: "F2", label: "물약 사용", accent: "from-emerald-300/20 to-emerald-500/10" },
  { key: "F3", label: "스킬 예약", accent: "from-sky-300/20 to-sky-500/10" },
  { key: "F4", label: "스킬 예약", accent: "from-fuchsia-300/20 to-fuchsia-500/10" },
  { key: "F5", label: "비어 있음", accent: "from-stone-300/10 to-stone-500/5" },
  { key: "F6", label: "비어 있음", accent: "from-stone-300/10 to-stone-500/5" },
  { key: "F7", label: "비어 있음", accent: "from-stone-300/10 to-stone-500/5" },
  { key: "F8", label: "비어 있음", accent: "from-stone-300/10 to-stone-500/5" },
];

export function SkillBar() {
  return (
    <section className="panel hud-panel rounded-[28px] p-3">
      <div className="flex gap-2 overflow-x-auto">
        {slots.map((slot) => (
          <div
            key={slot.key}
            className={`flex h-[72px] w-[78px] shrink-0 flex-col justify-between rounded-[22px] border border-amber-200/10 bg-gradient-to-b ${slot.accent} p-2 text-xs`}
          >
            <span className="text-amber-50/60">{slot.key}</span>
            <span className="text-center leading-4 text-amber-50">{slot.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
