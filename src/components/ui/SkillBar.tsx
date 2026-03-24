"use client";

import { useCallback, useEffect } from "react";
import { useGameStore } from "@/lib/gameStore";
import { SKILLS } from "@/game/data/skills";

const CLASS_SKILL_KEYS = ["F1", "F2", "F3", "F4"];

export function SkillBar() {
  const player = useGameStore((s) => s.player);
  const skillLevels = useGameStore((s) => s.skillLevels);
  const sp = useGameStore((s) => s.sp);
  const upgradeSkill = useGameStore((s) => s.upgradeSkill);
  const activateSkill = useGameStore((s) => s.activateSkill);

  const classSkills = SKILLS.filter(
    (sk) => sk.class.toLowerCase() === player.className.toLowerCase(),
  ).slice(0, 4);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      const idx = CLASS_SKILL_KEYS.indexOf(e.key);
      if (idx !== -1 && classSkills[idx]) {
        e.preventDefault();
        activateSkill(classSkills[idx].id);
      }
    },
    [classSkills, activateSkill],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const classColors: Record<string, string> = {
    guardian: "#79a7ff",
    ranger: "#71d28f",
    arcanist: "#cb8cff",
    sovereign: "#f1cb6a",
  };
  const cc = classColors[player.className.toLowerCase()] ?? "#b2b2b2";

  return (
    <div className="flex items-center gap-1.5">
      {classSkills.map((skill, i) => {
        const skillLv = skillLevels[skill.id] ?? 0;
        const maxLv = 5;
        const canUpgrade = sp > 0 && skillLv < maxLv;
        const isActive = skillLv > 0;
        return (
          <div key={skill.id} className="group relative">
            <button
              type="button"
              onClick={() => isActive && activateSkill(skill.id)}
              className="relative flex h-[56px] w-[50px] flex-col items-center justify-center gap-0.5 rounded-lg border transition-transform hover:scale-105 active:scale-95"
              style={{
                borderColor: isActive ? `${cc}66` : "rgba(255,255,255,0.06)",
                background: isActive
                  ? `linear-gradient(180deg, ${cc}15, rgba(8,8,14,0.95))`
                  : "rgba(255,255,255,0.02)",
              }}
            >
              <div className="text-[8px] font-semibold text-[#8a7a5a]">
                {CLASS_SKILL_KEYS[i]}
              </div>
              <div
                className="flex h-[22px] w-[22px] items-center justify-center rounded-md text-[10px] font-bold"
                style={{
                  background: isActive ? `${cc}25` : "rgba(255,255,255,0.03)",
                  color: isActive ? "#f2e4c2" : "#4b5563",
                }}
              >
                {skill.name.charAt(0)}
              </div>
              <div className="flex gap-px">
                {Array.from({ length: maxLv }).map((_, di) => (
                  <div
                    key={di}
                    className="h-[3px] w-[3px] rounded-full"
                    style={{
                      backgroundColor: di < skillLv ? cc : "rgba(255,255,255,0.1)",
                    }}
                  />
                ))}
              </div>
            </button>

            {/* Tooltip */}
            <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-[180px] -translate-x-1/2 rounded-lg border border-[#3a3a4a] bg-[rgba(12,14,22,0.97)] p-2.5 text-[10px] text-[#e0d4b8] shadow-[0_8px_24px_rgba(0,0,0,0.6)] group-hover:block">
              <div className="text-center">
                <div className="font-bold" style={{ color: cc }}>{skill.name}</div>
                <div className="mt-0.5 text-[9px] text-[#8a7a5a]">
                  Lv {skillLv}/{maxLv} | MP: {skill.mp}
                </div>
              </div>
              <div className="mx-auto my-1.5 h-px w-12 bg-gradient-to-r from-transparent via-[#4a4a5a] to-transparent" />
              <div className="text-[9px] leading-relaxed text-[#a09080]">
                {skill.description}
              </div>
              {canUpgrade && (
                <button
                  type="button"
                  className="pointer-events-auto mt-2 w-full rounded-md border border-amber-600/40 bg-amber-900/40 py-1 text-[9px] font-semibold text-amber-300 transition hover:bg-amber-800/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    upgradeSkill(skill.id);
                  }}
                >
                  UP (1 SP)
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
