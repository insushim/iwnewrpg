"use client";

type ItemIconProps = {
  icon: string;
  size?: "sm" | "md";
  showName?: boolean;
};

// Visual icon definitions using SVG paths and colors
const ICONS: Record<
  string,
  { svg: string; color: string; bgColor: string; label: string }
> = {
  // Weapons
  weapon_dagger_common: {
    label: "단검",
    color: "#c0c0c0",
    bgColor: "#3a2a1a",
    svg: "dagger",
  },
  weapon_dagger_epic: {
    label: "다크엘프 단검",
    color: "#cb8cff",
    bgColor: "#2a1a3a",
    svg: "dagger",
  },
  weapon_sword_common: {
    label: "철검",
    color: "#a0b8d0",
    bgColor: "#1a2a3a",
    svg: "sword",
  },
  weapon_sword_uncommon: {
    label: "미스릴 장검",
    color: "#80d0f0",
    bgColor: "#1a2a3a",
    svg: "sword",
  },
  weapon_sword_legendary: {
    label: "영원의 검",
    color: "#f0d060",
    bgColor: "#3a2a0a",
    svg: "sword",
  },
  weapon_greatsword_epic: {
    label: "용살의 대검",
    color: "#cb8cff",
    bgColor: "#2a1a3a",
    svg: "greatsword",
  },
  weapon_bow_common: {
    label: "사냥꾼의 활",
    color: "#8bc34a",
    bgColor: "#1a2a1a",
    svg: "bow",
  },
  weapon_bow_epic: {
    label: "환영의 활",
    color: "#cb8cff",
    bgColor: "#2a1a3a",
    svg: "bow",
  },
  weapon_staff_rare: {
    label: "아르카나 스태프",
    color: "#4488ff",
    bgColor: "#1a1a3a",
    svg: "staff",
  },
  weapon_staff_epic: {
    label: "공허의 지팡이",
    color: "#cb8cff",
    bgColor: "#2a1a3a",
    svg: "staff",
  },
  weapon_staff_legendary: {
    label: "영원의 지팡이",
    color: "#f0d060",
    bgColor: "#3a2a0a",
    svg: "staff",
  },
  // Armor
  armor_helmet_common: {
    label: "가죽 모자",
    color: "#b8906a",
    bgColor: "#2a2010",
    svg: "helmet",
  },
  armor_helmet_legendary: {
    label: "영원의 투구",
    color: "#f0d060",
    bgColor: "#3a2a0a",
    svg: "helmet",
  },
  armor_chest_common: {
    label: "체인 메일",
    color: "#a0a8b0",
    bgColor: "#1a2028",
    svg: "armor",
  },
  armor_chest_uncommon: {
    label: "가죽 갑옷",
    color: "#8bc34a",
    bgColor: "#1a2a1a",
    svg: "armor",
  },
  armor_chest_epic: {
    label: "용비늘 갑옷",
    color: "#cb8cff",
    bgColor: "#2a1a3a",
    svg: "armor",
  },
  armor_chest_legendary: {
    label: "영원의 갑옷",
    color: "#f0d060",
    bgColor: "#3a2a0a",
    svg: "armor",
  },
  armor_robe_uncommon: {
    label: "마법사 로브",
    color: "#b08cff",
    bgColor: "#2a1a3a",
    svg: "robe",
  },
  armor_cloak_epic: {
    label: "그림자의 망토",
    color: "#cb8cff",
    bgColor: "#1a1020",
    svg: "cloak",
  },
  armor_boots_uncommon: {
    label: "미스릴 부츠",
    color: "#80d0f0",
    bgColor: "#1a2a3a",
    svg: "boots",
  },
  armor_shield_common: {
    label: "철제 방패",
    color: "#a0a8b0",
    bgColor: "#1a2028",
    svg: "shield",
  },
  armor_shield_uncommon: {
    label: "미스릴 방패",
    color: "#80d0f0",
    bgColor: "#1a2a3a",
    svg: "shield",
  },
  ring_uncommon: {
    label: "수호의 반지",
    color: "#f0d060",
    bgColor: "#2a2010",
    svg: "ring",
  },
  amulet_rare: {
    label: "힘의 목걸이",
    color: "#4488ff",
    bgColor: "#1a1a3a",
    svg: "amulet",
  },
  belt_uncommon: {
    label: "신속의 허리띠",
    color: "#8bc34a",
    bgColor: "#1a2a1a",
    svg: "belt",
  },
  // Potions
  potion_red: {
    label: "붉은 물약",
    color: "#ff4455",
    bgColor: "#3a0a0a",
    svg: "potion_red",
  },
  potion_blue: {
    label: "푸른 물약",
    color: "#4488ff",
    bgColor: "#0a0a3a",
    svg: "potion_blue",
  },
  potion_green: {
    label: "초록 물약",
    color: "#44cc44",
    bgColor: "#0a2a0a",
    svg: "potion_green",
  },
  potion_hp_uncommon: {
    label: "고급 HP약",
    color: "#ff6666",
    bgColor: "#3a1010",
    svg: "potion_red",
  },
  potion_mp_uncommon: {
    label: "고급 MP약",
    color: "#6688ff",
    bgColor: "#10103a",
    svg: "potion_blue",
  },
  potion_full_rare: {
    label: "완전 회복약",
    color: "#f0d060",
    bgColor: "#2a2010",
    svg: "potion_gold",
  },
  potion_exp: {
    label: "경험치 물약",
    color: "#f0d060",
    bgColor: "#2a2010",
    svg: "potion_gold",
  },
  // Scrolls
  scroll_teleport: {
    label: "순간이동",
    color: "#b08cff",
    bgColor: "#1a1020",
    svg: "scroll",
  },
  scroll_return: {
    label: "귀환 주문서",
    color: "#ff8c00",
    bgColor: "#2a1a0a",
    svg: "scroll",
  },
  scroll_weapon_enchant: {
    label: "무기 강화",
    color: "#ff4488",
    bgColor: "#2a0a1a",
    svg: "scroll_enchant",
  },
  scroll_armor_enchant: {
    label: "방어구 강화",
    color: "#4488ff",
    bgColor: "#0a1a2a",
    svg: "scroll_enchant",
  },
  scroll_blessing: {
    label: "블레싱",
    color: "#f0d060",
    bgColor: "#2a2010",
    svg: "scroll_enchant",
  },
  // Materials
  material_hide: {
    label: "동물 가죽",
    color: "#b8906a",
    bgColor: "#2a1a0a",
    svg: "material",
  },
  material_iron: {
    label: "철 광석",
    color: "#a0a8b0",
    bgColor: "#1a2028",
    svg: "ore",
  },
  material_mithril: {
    label: "미스릴",
    color: "#c0d8e8",
    bgColor: "#1a2a3a",
    svg: "ore",
  },
  material_crystal: {
    label: "마력 결정",
    color: "#80d0ff",
    bgColor: "#0a1a2a",
    svg: "crystal",
  },
  material_dragon_bone: {
    label: "드래곤 뼈",
    color: "#cb8cff",
    bgColor: "#2a1a3a",
    svg: "bone",
  },
  material_shadow: {
    label: "그림자 정수",
    color: "#8060b0",
    bgColor: "#1a1020",
    svg: "essence",
  },
  ammo_arrow_common: {
    label: "화살",
    color: "#b8906a",
    bgColor: "#2a1a0a",
    svg: "arrow",
  },
  // Boxes
  box_mystery: {
    label: "미스터리 상자",
    color: "#4488ff",
    bgColor: "#0a1a2a",
    svg: "box",
  },
  box_legendary: {
    label: "전설 상자",
    color: "#f0d060",
    bgColor: "#2a2010",
    svg: "box",
  },
  // Special
  taming_stone: {
    label: "포획 주문서",
    color: "#f0d060",
    bgColor: "#2a2010",
    svg: "stone",
  },
  summon_stone_lesser: {
    label: "하급 소환석",
    color: "#4488ff",
    bgColor: "#0a1a2a",
    svg: "stone",
  },
  summon_stone_mid: {
    label: "중급 소환석",
    color: "#cb8cff",
    bgColor: "#2a1a3a",
    svg: "stone",
  },
  summon_stone_greater: {
    label: "상급 소환석",
    color: "#f0d060",
    bgColor: "#3a2a0a",
    svg: "stone",
  },
  unknown: { label: "???", color: "#666", bgColor: "#1a1a1a", svg: "unknown" },
};

function renderSvg(type: string, color: string, size: number) {
  // Create actual recognizable item SVG shapes
  const s = size;
  const half = s / 2;

  switch (type) {
    case "sword":
      return `<line x1="${half}" y1="${s * 0.1}" x2="${half}" y2="${s * 0.7}" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
              <line x1="${half - 4}" y1="${s * 0.55}" x2="${half + 4}" y2="${s * 0.55}" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
              <line x1="${half}" y1="${s * 0.65}" x2="${half}" y2="${s * 0.85}" stroke="#8B4513" stroke-width="3" stroke-linecap="round"/>
              <circle cx="${half}" cy="${s * 0.1}" r="1.5" fill="${color}" opacity="0.8"/>`;
    case "dagger":
      return `<line x1="${half}" y1="${s * 0.15}" x2="${half}" y2="${s * 0.6}" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
              <line x1="${half - 3}" y1="${s * 0.5}" x2="${half + 3}" y2="${s * 0.5}" stroke="${color}" stroke-width="1.5"/>
              <line x1="${half}" y1="${s * 0.6}" x2="${half}" y2="${s * 0.82}" stroke="#8B4513" stroke-width="2.5" stroke-linecap="round"/>`;
    case "greatsword":
      return `<line x1="${half}" y1="${s * 0.05}" x2="${half}" y2="${s * 0.72}" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
              <line x1="${half - 6}" y1="${s * 0.55}" x2="${half + 6}" y2="${s * 0.55}" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
              <line x1="${half}" y1="${s * 0.68}" x2="${half}" y2="${s * 0.9}" stroke="#8B4513" stroke-width="3.5" stroke-linecap="round"/>`;
    case "bow":
      return `<path d="M${half + 5} ${s * 0.15} Q${half - 6} ${half} ${half + 5} ${s * 0.85}" fill="none" stroke="#8B6914" stroke-width="2.5"/>
              <line x1="${half + 5}" y1="${s * 0.15}" x2="${half + 5}" y2="${s * 0.85}" stroke="${color}" stroke-width="1" opacity="0.6"/>
              <line x1="${half - 2}" y1="${half - 2}" x2="${half + 8}" y2="${half + 6}" stroke="#8B6914" stroke-width="1.5"/>`;
    case "staff":
      return `<line x1="${half}" y1="${s * 0.2}" x2="${half}" y2="${s * 0.9}" stroke="#8B6914" stroke-width="2.5" stroke-linecap="round"/>
              <circle cx="${half}" cy="${s * 0.15}" r="5" fill="none" stroke="${color}" stroke-width="1.5"/>
              <circle cx="${half}" cy="${s * 0.15}" r="2.5" fill="${color}" opacity="0.7"/>`;
    case "helmet":
      return `<path d="M${half - 7} ${s * 0.65} Q${half - 7} ${s * 0.2} ${half} ${s * 0.15} Q${half + 7} ${s * 0.2} ${half + 7} ${s * 0.65} Z" fill="${color}" opacity="0.7"/>
              <line x1="${half - 8}" y1="${s * 0.65}" x2="${half + 8}" y2="${s * 0.65}" stroke="${color}" stroke-width="2"/>`;
    case "armor":
      return `<path d="M${half - 8} ${s * 0.25} L${half} ${s * 0.15} L${half + 8} ${s * 0.25} L${half + 6} ${s * 0.75} L${half} ${s * 0.85} L${half - 6} ${s * 0.75} Z" fill="${color}" opacity="0.6" stroke="${color}" stroke-width="1"/>
              <line x1="${half}" y1="${s * 0.25}" x2="${half}" y2="${s * 0.75}" stroke="${color}" stroke-width="0.8" opacity="0.4"/>`;
    case "robe":
      return `<path d="M${half - 6} ${s * 0.2} L${half} ${s * 0.12} L${half + 6} ${s * 0.2} L${half + 8} ${s * 0.85} L${half} ${s * 0.8} L${half - 8} ${s * 0.85} Z" fill="${color}" opacity="0.5"/>
              <circle cx="${half}" cy="${s * 0.25}" r="2" fill="${color}" opacity="0.8"/>`;
    case "shield":
      return `<path d="M${half} ${s * 0.1} L${half + 9} ${s * 0.3} L${half + 7} ${s * 0.7} L${half} ${s * 0.85} L${half - 7} ${s * 0.7} L${half - 9} ${s * 0.3} Z" fill="${color}" opacity="0.5" stroke="${color}" stroke-width="1.2"/>
              <line x1="${half}" y1="${s * 0.2}" x2="${half}" y2="${s * 0.75}" stroke="${color}" stroke-width="0.8" opacity="0.4"/>`;
    case "ring":
      return `<circle cx="${half}" cy="${half}" r="7" fill="none" stroke="${color}" stroke-width="2.5"/>
              <circle cx="${half}" cy="${half - 7}" r="2" fill="${color}"/>`;
    case "amulet":
      return `<path d="M${half - 4} ${s * 0.15} Q${half} ${s * 0.05} ${half + 4} ${s * 0.15}" fill="none" stroke="${color}" stroke-width="1.5"/>
              <circle cx="${half}" cy="${s * 0.55}" r="6" fill="none" stroke="${color}" stroke-width="1.5"/>
              <circle cx="${half}" cy="${s * 0.55}" r="2.5" fill="${color}" opacity="0.8"/>
              <line x1="${half}" y1="${s * 0.15}" x2="${half}" y2="${s * 0.49}" stroke="${color}" stroke-width="1"/>`;
    case "belt":
      return `<rect x="${half - 10}" y="${half - 3}" width="20" height="6" rx="2" fill="${color}" opacity="0.6"/>
              <rect x="${half - 2}" y="${half - 4}" width="4" height="8" rx="1" fill="${color}" opacity="0.9"/>`;
    case "boots":
      return `<path d="M${half - 5} ${s * 0.2} L${half - 5} ${s * 0.7} L${half - 8} ${s * 0.8} L${half + 2} ${s * 0.8} L${half + 2} ${s * 0.2} Z" fill="${color}" opacity="0.6"/>
              <path d="M${half + 2} ${s * 0.2} L${half + 2} ${s * 0.7} L${half + 9} ${s * 0.8} L${half + 9} ${s * 0.7} L${half + 5} ${s * 0.2} Z" fill="${color}" opacity="0.5"/>`;
    case "cloak":
      return `<path d="M${half - 3} ${s * 0.12} Q${half} ${s * 0.08} ${half + 3} ${s * 0.12} L${half + 8} ${s * 0.85} Q${half} ${s * 0.75} ${half - 8} ${s * 0.85} Z" fill="${color}" opacity="0.5"/>`;
    case "potion_red":
      return `<path d="M${half - 2} ${s * 0.15} L${half + 2} ${s * 0.15} L${half + 2} ${s * 0.3} L${half + 6} ${s * 0.45} L${half + 6} ${s * 0.8} Q${half} ${s * 0.9} ${half - 6} ${s * 0.8} L${half - 6} ${s * 0.45} L${half - 2} ${s * 0.3} Z" fill="#cc2233" opacity="0.8" stroke="#aa1122" stroke-width="0.8"/>
              <rect x="${half - 3}" y="${s * 0.12}" width="6" height="5" rx="1" fill="#886644"/>
              <ellipse cx="${half - 2}" cy="${s * 0.55}" rx="2" ry="4" fill="#ff4455" opacity="0.4"/>`;
    case "potion_blue":
      return `<path d="M${half - 2} ${s * 0.15} L${half + 2} ${s * 0.15} L${half + 2} ${s * 0.3} L${half + 6} ${s * 0.45} L${half + 6} ${s * 0.8} Q${half} ${s * 0.9} ${half - 6} ${s * 0.8} L${half - 6} ${s * 0.45} L${half - 2} ${s * 0.3} Z" fill="#2244cc" opacity="0.8" stroke="#1133aa" stroke-width="0.8"/>
              <rect x="${half - 3}" y="${s * 0.12}" width="6" height="5" rx="1" fill="#886644"/>
              <ellipse cx="${half - 2}" cy="${s * 0.55}" rx="2" ry="4" fill="#4488ff" opacity="0.4"/>`;
    case "potion_green":
      return `<path d="M${half - 2} ${s * 0.15} L${half + 2} ${s * 0.15} L${half + 2} ${s * 0.3} L${half + 6} ${s * 0.45} L${half + 6} ${s * 0.8} Q${half} ${s * 0.9} ${half - 6} ${s * 0.8} L${half - 6} ${s * 0.45} L${half - 2} ${s * 0.3} Z" fill="#228833" opacity="0.8" stroke="#116622" stroke-width="0.8"/>
              <rect x="${half - 3}" y="${s * 0.12}" width="6" height="5" rx="1" fill="#886644"/>`;
    case "potion_gold":
      return `<path d="M${half - 2} ${s * 0.15} L${half + 2} ${s * 0.15} L${half + 2} ${s * 0.3} L${half + 6} ${s * 0.45} L${half + 6} ${s * 0.8} Q${half} ${s * 0.9} ${half - 6} ${s * 0.8} L${half - 6} ${s * 0.45} L${half - 2} ${s * 0.3} Z" fill="#aa8822" opacity="0.8" stroke="#886611" stroke-width="0.8"/>
              <rect x="${half - 3}" y="${s * 0.12}" width="6" height="5" rx="1" fill="#886644"/>
              <ellipse cx="${half}" cy="${s * 0.55}" rx="3" ry="5" fill="#f0d060" opacity="0.3"/>`;
    case "scroll":
      return `<rect x="${half - 6}" y="${s * 0.15}" width="12" height="${s * 0.7}" rx="2" fill="#d4b896" opacity="0.8"/>
              <ellipse cx="${half}" cy="${s * 0.18}" rx="7" ry="3" fill="#c4a886"/>
              <ellipse cx="${half}" cy="${s * 0.82}" rx="7" ry="3" fill="#c4a886"/>
              <line x1="${half - 3}" y1="${s * 0.35}" x2="${half + 3}" y2="${s * 0.35}" stroke="#8a7050" stroke-width="0.8"/>
              <line x1="${half - 3}" y1="${s * 0.45}" x2="${half + 3}" y2="${s * 0.45}" stroke="#8a7050" stroke-width="0.8"/>
              <line x1="${half - 3}" y1="${s * 0.55}" x2="${half + 2}" y2="${s * 0.55}" stroke="#8a7050" stroke-width="0.8"/>`;
    case "scroll_enchant":
      return `<rect x="${half - 6}" y="${s * 0.15}" width="12" height="${s * 0.7}" rx="2" fill="#d4b896" opacity="0.8"/>
              <ellipse cx="${half}" cy="${s * 0.18}" rx="7" ry="3" fill="#c4a886"/>
              <ellipse cx="${half}" cy="${s * 0.82}" rx="7" ry="3" fill="#c4a886"/>
              <text x="${half}" y="${s * 0.55}" text-anchor="middle" font-size="10" fill="${color}" font-weight="bold">✦</text>`;
    case "material":
      return `<rect x="${half - 7}" y="${s * 0.25}" width="14" height="16" rx="2" fill="${color}" opacity="0.6"/>
              <line x1="${half - 5}" y1="${s * 0.4}" x2="${half + 5}" y2="${s * 0.4}" stroke="${color}" stroke-width="0.5" opacity="0.4"/>`;
    case "ore":
      return `<polygon points="${half},${s * 0.15} ${half + 8},${s * 0.35} ${half + 6},${s * 0.75} ${half - 2},${s * 0.8} ${half - 8},${s * 0.5} ${half - 5},${s * 0.2}" fill="${color}" opacity="0.6"/>
              <polygon points="${half},${s * 0.15} ${half + 4},${s * 0.3} ${half},${s * 0.5} ${half - 3},${s * 0.25}" fill="${color}" opacity="0.9"/>`;
    case "crystal":
      return `<polygon points="${half},${s * 0.1} ${half + 7},${s * 0.4} ${half + 4},${s * 0.85} ${half - 4},${s * 0.85} ${half - 7},${s * 0.4}" fill="${color}" opacity="0.5"/>
              <polygon points="${half},${s * 0.1} ${half + 3},${s * 0.4} ${half},${s * 0.7} ${half - 3},${s * 0.4}" fill="${color}" opacity="0.8"/>
              <line x1="${half - 1}" y1="${s * 0.2}" x2="${half - 2}" y2="${s * 0.55}" stroke="white" stroke-width="0.8" opacity="0.4"/>`;
    case "bone":
      return `<line x1="${half - 6}" y1="${s * 0.25}" x2="${half + 6}" y2="${s * 0.75}" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
              <circle cx="${half - 6}" cy="${s * 0.25}" r="2.5" fill="${color}"/>
              <circle cx="${half + 6}" cy="${s * 0.75}" r="2.5" fill="${color}"/>`;
    case "essence":
      return `<circle cx="${half}" cy="${half}" r="7" fill="${color}" opacity="0.3"/>
              <circle cx="${half}" cy="${half}" r="4" fill="${color}" opacity="0.6"/>
              <circle cx="${half}" cy="${half}" r="2" fill="white" opacity="0.4"/>`;
    case "arrow":
      return `<line x1="${half - 8}" y1="${half + 4}" x2="${half + 6}" y2="${half - 4}" stroke="#8B6914" stroke-width="1.5"/>
              <polygon points="${half + 6},${half - 6} ${half + 9},${half - 3} ${half + 5},${half - 2}" fill="${color}"/>
              <line x1="${half - 8}" y1="${half + 6}" x2="${half - 6}" y2="${half + 2}" stroke="${color}" stroke-width="0.8"/>`;
    case "box":
      return `<rect x="${half - 8}" y="${s * 0.3}" width="16" height="12" rx="2" fill="${color}" opacity="0.5" stroke="${color}" stroke-width="1"/>
              <path d="M${half - 8} ${s * 0.3} L${half} ${s * 0.2} L${half + 8} ${s * 0.3}" fill="${color}" opacity="0.7"/>
              <rect x="${half - 1}" y="${s * 0.35}" width="2" height="4" rx="0.5" fill="#f0d060"/>`;
    case "stone":
      return `<circle cx="${half}" cy="${half}" r="8" fill="${color}" opacity="0.4"/>
              <circle cx="${half}" cy="${half}" r="5" fill="${color}" opacity="0.7"/>
              <text x="${half}" y="${half + 3}" text-anchor="middle" font-size="8" fill="white" opacity="0.8">✦</text>`;
    default:
      return `<text x="${half}" y="${half + 3}" text-anchor="middle" font-size="12" fill="${color}">?</text>`;
  }
}

export function ItemIcon({
  icon,
  size = "md",
  showName = false,
}: ItemIconProps) {
  const meta = ICONS[icon] ?? ICONS.unknown;
  const px = size === "sm" ? 32 : 40;

  return (
    <span className="relative inline-flex flex-col items-center">
      <span
        className="relative inline-flex items-center justify-center overflow-hidden rounded-lg border border-white/20"
        style={{
          width: px,
          height: px,
          background: `radial-gradient(circle at 30% 30%, ${meta.bgColor}ee, ${meta.bgColor})`,
          boxShadow: `inset 0 1px 2px rgba(255,255,255,0.1), 0 2px 6px rgba(0,0,0,0.3), 0 0 8px ${meta.color}33`,
        }}
      >
        <svg
          width={px}
          height={px}
          viewBox={`0 0 ${px} ${px}`}
          dangerouslySetInnerHTML={{
            __html: renderSvg(meta.svg, meta.color, px),
          }}
        />
      </span>
      {showName && (
        <span
          className="mt-0.5 text-[8px] text-[#d8c3a1] whitespace-nowrap"
          style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
        >
          {meta.label}
        </span>
      )}
    </span>
  );
}
