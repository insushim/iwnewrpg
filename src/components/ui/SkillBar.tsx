const slots = ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8"];

export function SkillBar() {
  return (
    <div className="panel rounded-2xl p-3">
      <div className="flex gap-2 overflow-x-auto">
        {slots.map((slot, index) => (
          <div
            key={slot}
            className="flex h-16 w-16 shrink-0 flex-col items-center justify-between rounded-xl border border-amber-200/10 bg-black/30 p-2 text-xs"
          >
            <span className="text-amber-50/60">{slot}</span>
            <span className="text-center text-amber-50">
              {index === 0 ? "공격" : index === 1 ? "물약" : "비어 있음"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
