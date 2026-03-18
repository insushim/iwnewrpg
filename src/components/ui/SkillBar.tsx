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
    <div className="flex flex-col items-center gap-3">
      {/* SP indicator with ornate styling */}
      <div
        className="rounded border-2 border-[#8e7540] bg-[linear-gradient(145deg,#0a0e18,#060a14)] px-4 py-2"
        style={{
          boxShadow:
            "inset 0 2px 6px rgba(0,0,0,0.8), 0 2px 8px rgba(240,208,96,0.3)",
        }}
      >
        <div className="flex items-center gap-2 text-[12px] font-bold">
          <span
            className="text-[#f0d060]"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
          >
            ✨ SP
          </span>
          <span
            className="text-[#f2e4c2]"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
          >
            {sp}
          </span>
          <span className="text-[#d8c3a1] opacity-80">남은 포인트</span>
        </div>
      </div>

      {/* Skill slots with metal styling */}
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
                className="relative flex h-[72px] w-[64px] flex-col items-center justify-between overflow-hidden rounded-lg border-4 transition-all hover:scale-105 active:scale-95"
                style={{
                  borderColor: isActive ? cc : "#6b5530",
                  background: isActive
                    ? `linear-gradient(145deg, #0a0e18, #060a14)`
                    : "linear-gradient(145deg, #060a14, #0a0e18)",
                  boxShadow: isActive
                    ? `0 0 20px ${cc}88, inset 0 2px 6px rgba(0,0,0,0.8)`
                    : "inset 0 2px 6px rgba(0,0,0,0.8), 0 2px 4px rgba(107,85,48,0.3)",
                }}
              >
                {/* Hotkey label at top */}
                <div
                  className="mt-1 rounded border border-[#8e7540] bg-[linear-gradient(145deg,#d8c3a1,#b48a46)] px-2 py-0.5 text-[9px] font-bold text-[#060a14]"
                  style={{ textShadow: "0 1px 1px rgba(255,255,255,0.3)" }}
                >
                  {CLASS_SKILL_KEYS[i]}
                </div>

                {/* Skill icon in center */}
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold"
                  style={{
                    borderColor: isActive ? cc : "#6b5530",
                    background: isActive
                      ? `radial-gradient(circle, ${cc}40, ${cc}20)`
                      : "radial-gradient(circle, rgba(107,85,48,0.2), rgba(107,85,48,0.1))",
                    color: isActive ? "#f2e4c2" : "#8e7540",
                    textShadow: isActive
                      ? "0 1px 2px rgba(0,0,0,0.8), 0 0 8px " + cc
                      : "0 1px 1px rgba(0,0,0,0.5)",
                  }}
                >
                  {skill.name.charAt(0)}
                </div>

                {/* Level indicator */}
                <div
                  className="text-[8px] font-bold text-[#f0d060]"
                  style={{ textShadow: "0 1px 1px rgba(0,0,0,0.8)" }}
                >
                  {skillLv > 0 ? `Lv${skillLv}` : "OFF"}
                </div>

                {/* Roman numeral level dots */}
                <div className="mb-1 flex gap-px">
                  {Array.from({ length: maxLv }).map((_, di) => (
                    <div
                      key={di}
                      className="h-1 w-1 rounded-full transition-all"
                      style={{
                        backgroundColor: di < skillLv ? cc : "#6b5530",
                        boxShadow: di < skillLv ? `0 0 4px ${cc}` : "none",
                      }}
                    />
                  ))}
                </div>

                {/* Cooldown sweep overlay (when skill is used) */}
                {isActive && (
                  <div
                    className="absolute inset-0 rounded-lg pointer-events-none opacity-0 transition-opacity duration-300"
                    style={{
                      background:
                        "conic-gradient(from 0deg, transparent 0%, rgba(0,0,0,0.6) 25%, transparent 25%)",
                      animation: "none",
                    }}
                  />
                )}

                {/* Active skill pulse */}
                {isActive && (
                  <div
                    className="absolute inset-0 rounded-lg pointer-events-none animate-pulse"
                    style={{
                      background: `radial-gradient(circle at center, transparent 50%, ${cc}20 70%, transparent 100%)`,
                    }}
                  />
                )}
              </button>

              {/* Classic tooltip on hover */}
              <div
                className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-[200px] -translate-x-1/2 rounded border-2 border-[#d4a647] bg-[#f2e4c2] p-3 text-[11px] text-[#060a14] group-hover:block"
                style={{
                  boxShadow:
                    "0 4px 12px rgba(0,0,0,0.8), inset 0 1px 3px rgba(212,166,71,0.3)",
                }}
              >
                <div className="text-center">
                  <div
                    className="font-bold text-[#8e1d2f]"
                    style={{ textShadow: "1px 1px 2px rgba(212,166,71,0.3)" }}
                  >
                    {skill.name}
                  </div>
                  <div className="mt-1 text-[10px] font-bold text-[#6b5530]">
                    Level {skillLv}/{maxLv}
                  </div>
                </div>
                <div className="mx-auto my-2 h-px w-16 bg-gradient-to-r from-transparent via-[#8e7540] to-transparent"></div>
                <div className="text-[10px] leading-relaxed text-[#060a14] opacity-90">
                  {skill.description}
                </div>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <span className="text-[#4488ff] font-bold">✦ MP:</span>
                  <span className="font-bold text-[#8e1d2f]">{skill.mp}</span>
                </div>
                {canUpgrade && (
                  <button
                    type="button"
                    className="pointer-events-auto mt-3 w-full rounded border-2 border-[#8e7540] bg-[linear-gradient(145deg,#d8c3a1,#b48a46)] py-1 text-[10px] font-bold text-[#060a14] transition hover:brightness-110 active:scale-95"
                    style={{
                      textShadow: "0 1px 1px rgba(255,255,255,0.3)",
                      boxShadow:
                        "inset 0 1px 2px rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.3)",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      upgradeSkill(skill.id);
                    }}
                  >
                    ⚡ 업그레이드 (1 SP)
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
