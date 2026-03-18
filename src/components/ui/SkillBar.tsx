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
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
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
    guardian:  "#79a7ff",
    ranger:    "#71d28f",
    arcanist:  "#cb8cff",
    sovereign: "#f1cb6a",
  };
  const cc = classColors[player.className.toLowerCase()] ?? "#b2b2b2";

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* SP indicator */}
      <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[10px]">
        <span className="text-[#f0c040]">SP</span>
        <span className="font-mono font-bold text-[#f5e8c3]">{sp}</span>
        <span className="text-[#9f8560]">남은 포인트</span>
      </div>
      {/* Skill slots */}
      <div className="flex gap-2">
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
                className="relative flex h-[64px] w-[56px] flex-col items-center justify-between overflow-hidden rounded-[16px] border px-1 py-1.5 transition"
                style={{
                  borderColor: isActive ? `${cc}77` : "rgba(120,120,140,0.24)",
                  background: isActive
                    ? `linear-gradient(180deg, ${cc}26, rgba(10,10,18,0.92))`
                    : "linear-gradient(180deg, rgba(26,28,34,0.88), rgba(10,10,16,0.94))",
                  boxShadow: isActive ? `0 0 18px ${cc}18` : "none",
                }}
              >
                <span className="text-[9px] text-[#af9166]">{CLASS_SKILL_KEYS[i]}</span>
                <div
                  className="flex h-[26px] w-[26px] items-center justify-center rounded-[8px] text-[11px] font-bold"
                  style={{
                    background: isActive ? `${cc}40` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${isActive ? `${cc}88` : "rgba(255,255,255,0.06)"}`,
                    color: isActive ? "#fff3d6" : "#6b7280",
                  }}
                >
                  {skill.name.charAt(0)}
                </div>
                <span className="text-center text-[7px] leading-none text-[#e9dcc0]/75">
                  Lv{skillLv}
                </span>
                {/* Level dots */}
                <div className="flex gap-[2px]">
                  {Array.from({ length: maxLv }).map((_, di) => (
                    <div
                      key={di}
                      className="h-[3px] w-[6px] rounded-full"
                      style={{
                        background: di < skillLv ? cc : "rgba(255,255,255,0.15)",
                      }}
                    />
                  ))}
                </div>
              </button>

              {/* Tooltip on hover */}
              <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-[180px] -translate-x-1/2 rounded-[14px] border border-white/10 bg-[rgba(8,8,12,0.98)] p-2.5 text-[11px] text-[#d4c4a0] group-hover:block">
                <div className="font-semibold text-[#f5e8c3]">{skill.name}</div>
                <div className="mt-0.5 text-[10px] text-[#9f8560]">Lv {skillLv}/{maxLv}</div>
                <div className="mt-1 text-[10px] leading-relaxed">{skill.description}</div>
                <div className="mt-1 text-[10px] text-[#4f7cff]">MP: {skill.mp}</div>
                {canUpgrade && (
                  <button
                    type="button"
                    className="pointer-events-auto mt-2 w-full rounded-[8px] border border-[#f0c040]/40 bg-[#f0c040]/10 py-1 text-[10px] text-[#f0c040] transition hover:bg-[#f0c040]/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      upgradeSkill(skill.id);
                    }}
                  >
                    업그레이드 (1 SP)
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
