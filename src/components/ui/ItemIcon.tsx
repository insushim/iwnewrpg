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

function renderSvg(type: string, c: string, size: number) {
  // === Lineage Remaster quality item icons with gradients & metallic effects ===
  const s = size;
  const h = s / 2;
  // Shared defs for gradients/filters
  const id = type + Math.random().toString(36).slice(2, 6);
  const metalG = `<linearGradient id="m${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="white" stop-opacity="0.4"/><stop offset="40%" stop-color="${c}" stop-opacity="0.9"/><stop offset="70%" stop-color="${c}"/><stop offset="100%" stop-color="black" stop-opacity="0.3"/></linearGradient>`;
  const bladeG = `<linearGradient id="b${id}" x1="0" y1="0" x2="0.5" y2="1"><stop offset="0%" stop-color="white" stop-opacity="0.85"/><stop offset="25%" stop-color="#e8eef4"/><stop offset="50%" stop-color="#d0dae4"/><stop offset="75%" stop-color="#b8c6d2"/><stop offset="100%" stop-color="#a0aec0"/></linearGradient>`;
  const handleG = `<linearGradient id="h${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#a07840"/><stop offset="50%" stop-color="#7a5828"/><stop offset="100%" stop-color="#5a3818"/></linearGradient>`;
  const glowF = `<filter id="g${id}"><feGaussianBlur stdDeviation="1.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;

  switch (type) {
    case "sword":
      return `<defs>${bladeG}${handleG}${metalG}</defs>
        <line x1="${h}" y1="${s*0.06}" x2="${h}" y2="${s*0.58}" stroke="url(#b${id})" stroke-width="3.5" stroke-linecap="round"/>
        <line x1="${h-0.5}" y1="${s*0.08}" x2="${h-0.5}" y2="${s*0.3}" stroke="white" stroke-width="0.6" opacity="0.5"/>
        <polygon points="${h},${s*0.06} ${h+2},${s*0.1} ${h},${s*0.08}" fill="white" opacity="0.6"/>
        <rect x="${h-5}" y="${s*0.52}" width="10" height="4" rx="1" fill="url(#m${id})"/>
        <circle cx="${h}" cy="${s*0.54}" r="1.5" fill="${c}" opacity="0.9"/>
        <line x1="${h}" y1="${s*0.56}" x2="${h}" y2="${s*0.82}" stroke="url(#h${id})" stroke-width="3.5" stroke-linecap="round"/>
        <line x1="${h-0.5}" y1="${s*0.57}" x2="${h-0.5}" y2="${s*0.8}" stroke="white" stroke-width="0.4" opacity="0.2"/>
        <ellipse cx="${h}" cy="${s*0.85}" rx="3" ry="2" fill="#6a4a2a"/>`;
    case "dagger":
      return `<defs>${bladeG}${handleG}${metalG}</defs>
        <line x1="${h}" y1="${s*0.12}" x2="${h}" y2="${s*0.52}" stroke="url(#b${id})" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="${h-0.5}" y1="${s*0.14}" x2="${h-0.5}" y2="${s*0.3}" stroke="white" stroke-width="0.5" opacity="0.5"/>
        <polygon points="${h},${s*0.12} ${h+1.5},${s*0.16} ${h},${s*0.14}" fill="white" opacity="0.5"/>
        <rect x="${h-4}" y="${s*0.46}" width="8" height="3.5" rx="1" fill="url(#m${id})"/>
        <circle cx="${h}" cy="${s*0.475}" r="1.2" fill="${c}"/>
        <line x1="${h}" y1="${s*0.5}" x2="${h}" y2="${s*0.78}" stroke="url(#h${id})" stroke-width="3" stroke-linecap="round"/>
        <line x1="${h-0.5}" y1="${s*0.52}" x2="${h-0.5}" y2="${s*0.76}" stroke="white" stroke-width="0.3" opacity="0.2"/>
        <ellipse cx="${h}" cy="${s*0.82}" rx="2.5" ry="1.8" fill="#5a3a1a"/>`;
    case "greatsword":
      return `<defs>${bladeG}${handleG}${metalG}${glowF}</defs>
        <line x1="${h}" y1="${s*0.03}" x2="${h}" y2="${s*0.6}" stroke="url(#b${id})" stroke-width="4.5" stroke-linecap="round"/>
        <line x1="${h}" y1="${s*0.05}" x2="${h}" y2="${s*0.35}" stroke="white" stroke-width="0.8" opacity="0.35"/>
        <line x1="${h}" y1="${s*0.1}" x2="${h}" y2="${s*0.55}" stroke="${c}" stroke-width="1" opacity="0.15"/>
        <polygon points="${h},${s*0.03} ${h+3},${s*0.08} ${h},${s*0.06}" fill="white" opacity="0.5"/>
        <rect x="${h-7}" y="${s*0.53}" width="14" height="5" rx="1.5" fill="url(#m${id})"/>
        <circle cx="${h}" cy="${s*0.555}" r="2" fill="${c}" filter="url(#g${id})"/>
        <line x1="${h}" y1="${s*0.58}" x2="${h}" y2="${s*0.88}" stroke="url(#h${id})" stroke-width="4" stroke-linecap="round"/>
        <line x1="${h-1}" y1="${s*0.6}" x2="${h-1}" y2="${s*0.86}" stroke="white" stroke-width="0.4" opacity="0.15"/>
        <ellipse cx="${h}" cy="${s*0.91}" rx="4" ry="2.5" fill="#5a3a1a"/>`;
    case "bow":
      return `<defs>${handleG}<linearGradient id="bw${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#c4a060"/><stop offset="50%" stop-color="#8b6914"/><stop offset="100%" stop-color="#5a4010"/></linearGradient></defs>
        <path d="M${h+6} ${s*0.1} Q${h-8} ${h} ${h+6} ${s*0.9}" fill="none" stroke="url(#bw${id})" stroke-width="3"/>
        <path d="M${h+6} ${s*0.12} Q${h-4} ${h} ${h+6} ${s*0.88}" fill="none" stroke="#a08040" stroke-width="1" opacity="0.3"/>
        <line x1="${h+6}" y1="${s*0.1}" x2="${h+6}" y2="${s*0.9}" stroke="${c}" stroke-width="1" opacity="0.5"/>
        <line x1="${h-3}" y1="${h-2}" x2="${h+9}" y2="${h+5}" stroke="#a08040" stroke-width="1.8"/>
        <polygon points="${h+9},${h+3} ${h+12},${h+6} ${h+8},${h+6}" fill="${c}" opacity="0.8"/>
        <line x1="${h-3}" y1="${h}" x2="${h-5}" y2="${h-3}" stroke="${c}" stroke-width="0.8" opacity="0.6"/>
        <line x1="${h-3}" y1="${h}" x2="${h-5}" y2="${h+3}" stroke="${c}" stroke-width="0.8" opacity="0.6"/>`;
    case "staff":
      return `<defs>${handleG}${glowF}<radialGradient id="o${id}" cx="50%" cy="30%"><stop offset="0%" stop-color="white" stop-opacity="0.9"/><stop offset="40%" stop-color="${c}" stop-opacity="0.8"/><stop offset="100%" stop-color="${c}" stop-opacity="0.3"/></radialGradient></defs>
        <line x1="${h}" y1="${s*0.24}" x2="${h}" y2="${s*0.92}" stroke="url(#h${id})" stroke-width="3" stroke-linecap="round"/>
        <line x1="${h-0.5}" y1="${s*0.26}" x2="${h-0.5}" y2="${s*0.88}" stroke="white" stroke-width="0.4" opacity="0.15"/>
        <rect x="${h-1.5}" y="${s*0.4}" width="3" height="2" rx="0.5" fill="${c}" opacity="0.6"/>
        <rect x="${h-1.5}" y="${s*0.55}" width="3" height="2" rx="0.5" fill="${c}" opacity="0.5"/>
        <rect x="${h-1.5}" y="${s*0.7}" width="3" height="2" rx="0.5" fill="${c}" opacity="0.4"/>
        <circle cx="${h}" cy="${s*0.14}" r="7" fill="url(#o${id})" filter="url(#g${id})"/>
        <circle cx="${h}" cy="${s*0.14}" r="3.5" fill="${c}" opacity="0.8"/>
        <circle cx="${h-1}" cy="${s*0.12}" r="1.5" fill="white" opacity="0.6"/>`;
    case "helmet":
      return `<defs>${metalG}<linearGradient id="hl${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="white" stop-opacity="0.3"/><stop offset="30%" stop-color="${c}"/><stop offset="70%" stop-color="${c}" stop-opacity="0.8"/><stop offset="100%" stop-color="black" stop-opacity="0.2"/></linearGradient></defs>
        <path d="M${h-8} ${s*0.65} Q${h-9} ${s*0.25} ${h} ${s*0.12} Q${h+9} ${s*0.25} ${h+8} ${s*0.65} Z" fill="url(#hl${id})"/>
        <path d="M${h-3} ${s*0.16} Q${h} ${s*0.12} ${h+3} ${s*0.16} L${h+2} ${s*0.35} L${h-2} ${s*0.35} Z" fill="white" opacity="0.15"/>
        <rect x="${h-9}" y="${s*0.6}" width="18" height="4" rx="1.5" fill="url(#m${id})"/>
        <path d="M${h-5} ${s*0.45} L${h+5} ${s*0.45}" stroke="${c}" stroke-width="0.8" opacity="0.3"/>
        <line x1="${h}" y1="${s*0.18}" x2="${h}" y2="${s*0.08}" stroke="${c}" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
        <circle cx="${h}" cy="${s*0.07}" r="1.5" fill="${c}" opacity="0.7"/>`;
    case "armor":
      return `<defs>${metalG}<linearGradient id="ar${id}" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0%" stop-color="white" stop-opacity="0.25"/><stop offset="30%" stop-color="${c}" stop-opacity="0.8"/><stop offset="70%" stop-color="${c}" stop-opacity="0.7"/><stop offset="100%" stop-color="black" stop-opacity="0.2"/></linearGradient></defs>
        <path d="M${h-9} ${s*0.22} L${h} ${s*0.1} L${h+9} ${s*0.22} L${h+10} ${s*0.35} L${h+7} ${s*0.75} L${h} ${s*0.88} L${h-7} ${s*0.75} L${h-10} ${s*0.35} Z" fill="url(#ar${id})" stroke="${c}" stroke-width="0.8" opacity="0.9"/>
        <path d="M${h-4} ${s*0.18} L${h} ${s*0.12} L${h+4} ${s*0.18} L${h+3} ${s*0.35} L${h-3} ${s*0.35} Z" fill="white" opacity="0.12"/>
        <line x1="${h}" y1="${s*0.22}" x2="${h}" y2="${s*0.78}" stroke="${c}" stroke-width="0.6" opacity="0.25"/>
        <line x1="${h-6}" y1="${s*0.4}" x2="${h+6}" y2="${s*0.4}" stroke="${c}" stroke-width="0.6" opacity="0.2"/>
        <ellipse cx="${h}" cy="${s*0.5}" rx="3" ry="2" fill="${c}" opacity="0.3"/>`;
    case "robe":
      return `<defs><linearGradient id="rb${id}" x1="0" y1="0" x2="0.2" y2="1"><stop offset="0%" stop-color="white" stop-opacity="0.2"/><stop offset="40%" stop-color="${c}" stop-opacity="0.6"/><stop offset="100%" stop-color="${c}" stop-opacity="0.35"/></linearGradient></defs>
        <path d="M${h-7} ${s*0.18} L${h} ${s*0.08} L${h+7} ${s*0.18} L${h+10} ${s*0.88} Q${h} ${s*0.8} ${h-10} ${s*0.88} Z" fill="url(#rb${id})"/>
        <path d="M${h-3} ${s*0.14} Q${h} ${s*0.1} ${h+3} ${s*0.14}" fill="none" stroke="${c}" stroke-width="1.5"/>
        <circle cx="${h}" cy="${s*0.22}" r="2" fill="${c}" opacity="0.8"/>
        <circle cx="${h}" cy="${s*0.22}" r="0.8" fill="white" opacity="0.5"/>
        <line x1="${h}" y1="${s*0.24}" x2="${h}" y2="${s*0.7}" stroke="${c}" stroke-width="0.5" opacity="0.25"/>
        <path d="M${h-6} ${s*0.85} Q${h-8} ${s*0.82} ${h-10} ${s*0.88}" fill="none" stroke="${c}" stroke-width="0.5" opacity="0.3"/>
        <path d="M${h+6} ${s*0.85} Q${h+8} ${s*0.82} ${h+10} ${s*0.88}" fill="none" stroke="${c}" stroke-width="0.5" opacity="0.3"/>`;
    case "shield":
      return `<defs>${metalG}<linearGradient id="sh${id}" x1="0.2" y1="0" x2="0.8" y2="1"><stop offset="0%" stop-color="white" stop-opacity="0.3"/><stop offset="30%" stop-color="${c}" stop-opacity="0.7"/><stop offset="70%" stop-color="${c}" stop-opacity="0.6"/><stop offset="100%" stop-color="black" stop-opacity="0.15"/></linearGradient></defs>
        <path d="M${h} ${s*0.08} L${h+10} ${s*0.25} L${h+8} ${s*0.68} L${h} ${s*0.88} L${h-8} ${s*0.68} L${h-10} ${s*0.25} Z" fill="url(#sh${id})" stroke="${c}" stroke-width="1"/>
        <path d="M${h-4} ${s*0.18} L${h} ${s*0.12} L${h+4} ${s*0.18} L${h+3} ${s*0.4} L${h-3} ${s*0.4} Z" fill="white" opacity="0.1"/>
        <line x1="${h}" y1="${s*0.15}" x2="${h}" y2="${s*0.8}" stroke="${c}" stroke-width="1" opacity="0.25"/>
        <line x1="${h-8}" y1="${s*0.45}" x2="${h+8}" y2="${s*0.45}" stroke="${c}" stroke-width="1" opacity="0.2"/>
        <circle cx="${h}" cy="${s*0.45}" r="2.5" fill="url(#m${id})" opacity="0.8"/>`;
    case "ring":
      return `<defs>${metalG}${glowF}<radialGradient id="rg${id}" cx="50%" cy="20%"><stop offset="0%" stop-color="white" stop-opacity="0.5"/><stop offset="50%" stop-color="${c}"/><stop offset="100%" stop-color="${c}" stop-opacity="0.6"/></radialGradient></defs>
        <circle cx="${h}" cy="${h+1}" r="8" fill="none" stroke="url(#m${id})" stroke-width="3"/>
        <circle cx="${h}" cy="${h+1}" r="8" fill="none" stroke="white" stroke-width="0.5" opacity="0.2"/>
        <ellipse cx="${h}" cy="${h-7}" rx="3" ry="2.5" fill="url(#rg${id})" filter="url(#g${id})"/>
        <ellipse cx="${h-0.5}" cy="${h-7.5}" rx="1" ry="0.8" fill="white" opacity="0.5"/>`;
    case "amulet":
      return `<defs>${metalG}${glowF}<radialGradient id="am${id}" cx="40%" cy="30%"><stop offset="0%" stop-color="white" stop-opacity="0.6"/><stop offset="50%" stop-color="${c}"/><stop offset="100%" stop-color="${c}" stop-opacity="0.5"/></radialGradient></defs>
        <path d="M${h-5} ${s*0.12} Q${h} ${s*0.02} ${h+5} ${s*0.12}" fill="none" stroke="${c}" stroke-width="1.8"/>
        <line x1="${h}" y1="${s*0.12}" x2="${h}" y2="${s*0.42}" stroke="${c}" stroke-width="1"/>
        <circle cx="${h}" cy="${s*0.55}" r="7" fill="none" stroke="url(#m${id})" stroke-width="2"/>
        <circle cx="${h}" cy="${s*0.55}" r="4" fill="url(#am${id})" filter="url(#g${id})"/>
        <circle cx="${h-1}" cy="${s*0.53}" r="1.2" fill="white" opacity="0.5"/>`;
    case "belt":
      return `<defs>${metalG}<linearGradient id="bl${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c}" stop-opacity="0.8"/><stop offset="100%" stop-color="${c}" stop-opacity="0.5"/></linearGradient></defs>
        <rect x="${h-11}" y="${h-3}" width="22" height="7" rx="2.5" fill="url(#bl${id})"/>
        <rect x="${h-11}" y="${h-3}" width="22" height="2" rx="1" fill="white" opacity="0.1"/>
        <rect x="${h-3}" y="${h-4.5}" width="6" height="10" rx="1.5" fill="url(#m${id})"/>
        <circle cx="${h}" cy="${h}" r="1.5" fill="${c}" opacity="0.9"/>
        <line x1="${h-8}" y1="${h}" x2="${h-4}" y2="${h}" stroke="${c}" stroke-width="0.5" opacity="0.3"/>
        <line x1="${h+4}" y1="${h}" x2="${h+8}" y2="${h}" stroke="${c}" stroke-width="0.5" opacity="0.3"/>`;
    case "boots":
      return `<defs><linearGradient id="bt${id}" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0%" stop-color="white" stop-opacity="0.2"/><stop offset="30%" stop-color="${c}" stop-opacity="0.7"/><stop offset="100%" stop-color="${c}" stop-opacity="0.45"/></linearGradient></defs>
        <path d="M${h-6} ${s*0.15} L${h-6} ${s*0.65} L${h-10} ${s*0.78} L${h+1} ${s*0.82} L${h+1} ${s*0.15} Z" fill="url(#bt${id})"/>
        <path d="M${h+2} ${s*0.15} L${h+2} ${s*0.65} L${h+10} ${s*0.78} L${h+10} ${s*0.65} L${h+6} ${s*0.15} Z" fill="url(#bt${id})" opacity="0.85"/>
        <line x1="${h-6}" y1="${s*0.35}" x2="${h+1}" y2="${s*0.35}" stroke="${c}" stroke-width="0.6" opacity="0.3"/>
        <line x1="${h+2}" y1="${s*0.35}" x2="${h+6}" y2="${s*0.35}" stroke="${c}" stroke-width="0.6" opacity="0.3"/>
        <rect x="${h-5}" y="${s*0.18}" width="4" height="2" rx="0.5" fill="${c}" opacity="0.4"/>
        <rect x="${h+3}" y="${s*0.18}" width="3" height="2" rx="0.5" fill="${c}" opacity="0.4"/>`;
    case "cloak":
      return `<defs><linearGradient id="ck${id}" x1="0.3" y1="0" x2="0.7" y2="1"><stop offset="0%" stop-color="white" stop-opacity="0.15"/><stop offset="30%" stop-color="${c}" stop-opacity="0.6"/><stop offset="100%" stop-color="${c}" stop-opacity="0.3"/></linearGradient></defs>
        <path d="M${h-4} ${s*0.1} Q${h} ${s*0.06} ${h+4} ${s*0.1} L${h+10} ${s*0.88} Q${h} ${s*0.72} ${h-10} ${s*0.88} Z" fill="url(#ck${id})"/>
        <path d="M${h-2} ${s*0.12} Q${h} ${s*0.08} ${h+2} ${s*0.12}" fill="none" stroke="${c}" stroke-width="2" opacity="0.6"/>
        <circle cx="${h}" cy="${s*0.14}" r="1.5" fill="${c}" opacity="0.7"/>
        <path d="M${h-6} ${s*0.85} Q${h-9} ${s*0.8} ${h-10} ${s*0.88}" stroke="${c}" stroke-width="0.5" fill="none" opacity="0.25"/>`;
    case "potion_red":
      return `<defs><radialGradient id="pr${id}" cx="35%" cy="40%"><stop offset="0%" stop-color="#ff6666" stop-opacity="0.9"/><stop offset="60%" stop-color="#cc2233" stop-opacity="0.85"/><stop offset="100%" stop-color="#880011" stop-opacity="0.8"/></radialGradient><linearGradient id="pk${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#aa8866"/><stop offset="100%" stop-color="#664422"/></linearGradient></defs>
        <rect x="${h-3.5}" y="${s*0.08}" width="7" height="7" rx="1.5" fill="url(#pk${id})"/>
        <rect x="${h-2.5}" y="${s*0.11}" width="5" height="2" rx="0.5" fill="white" opacity="0.15"/>
        <path d="M${h-2.5} ${s*0.15} L${h+2.5} ${s*0.15} L${h+2.5} ${s*0.28} L${h+7} ${s*0.42} L${h+7} ${s*0.82} Q${h} ${s*0.92} ${h-7} ${s*0.82} L${h-7} ${s*0.42} L${h-2.5} ${s*0.28} Z" fill="url(#pr${id})" stroke="#991122" stroke-width="0.6"/>
        <ellipse cx="${h-2.5}" cy="${s*0.55}" rx="2" ry="6" fill="#ff4455" opacity="0.3"/>
        <ellipse cx="${h-3}" cy="${s*0.48}" rx="1" ry="3" fill="white" opacity="0.2"/>`;
    case "potion_blue":
      return `<defs><radialGradient id="pb${id}" cx="35%" cy="40%"><stop offset="0%" stop-color="#6688ff" stop-opacity="0.9"/><stop offset="60%" stop-color="#2244cc" stop-opacity="0.85"/><stop offset="100%" stop-color="#001188" stop-opacity="0.8"/></radialGradient><linearGradient id="pk${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#aa8866"/><stop offset="100%" stop-color="#664422"/></linearGradient></defs>
        <rect x="${h-3.5}" y="${s*0.08}" width="7" height="7" rx="1.5" fill="url(#pk${id})"/>
        <rect x="${h-2.5}" y="${s*0.11}" width="5" height="2" rx="0.5" fill="white" opacity="0.15"/>
        <path d="M${h-2.5} ${s*0.15} L${h+2.5} ${s*0.15} L${h+2.5} ${s*0.28} L${h+7} ${s*0.42} L${h+7} ${s*0.82} Q${h} ${s*0.92} ${h-7} ${s*0.82} L${h-7} ${s*0.42} L${h-2.5} ${s*0.28} Z" fill="url(#pb${id})" stroke="#112299" stroke-width="0.6"/>
        <ellipse cx="${h-2.5}" cy="${s*0.55}" rx="2" ry="6" fill="#4488ff" opacity="0.3"/>
        <ellipse cx="${h-3}" cy="${s*0.48}" rx="1" ry="3" fill="white" opacity="0.2"/>`;
    case "potion_green":
      return `<defs><radialGradient id="pg${id}" cx="35%" cy="40%"><stop offset="0%" stop-color="#44dd44" stop-opacity="0.9"/><stop offset="60%" stop-color="#228833" stop-opacity="0.85"/><stop offset="100%" stop-color="#005500" stop-opacity="0.8"/></radialGradient><linearGradient id="pk${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#aa8866"/><stop offset="100%" stop-color="#664422"/></linearGradient></defs>
        <rect x="${h-3.5}" y="${s*0.08}" width="7" height="7" rx="1.5" fill="url(#pk${id})"/>
        <path d="M${h-2.5} ${s*0.15} L${h+2.5} ${s*0.15} L${h+2.5} ${s*0.28} L${h+7} ${s*0.42} L${h+7} ${s*0.82} Q${h} ${s*0.92} ${h-7} ${s*0.82} L${h-7} ${s*0.42} L${h-2.5} ${s*0.28} Z" fill="url(#pg${id})" stroke="#116622" stroke-width="0.6"/>
        <ellipse cx="${h-3}" cy="${s*0.48}" rx="1" ry="3" fill="white" opacity="0.15"/>`;
    case "potion_gold":
      return `<defs><radialGradient id="py${id}" cx="35%" cy="40%"><stop offset="0%" stop-color="#ffe880" stop-opacity="0.9"/><stop offset="60%" stop-color="#c4a030" stop-opacity="0.85"/><stop offset="100%" stop-color="#886600" stop-opacity="0.8"/></radialGradient>${glowF}<linearGradient id="pk${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#aa8866"/><stop offset="100%" stop-color="#664422"/></linearGradient></defs>
        <rect x="${h-3.5}" y="${s*0.08}" width="7" height="7" rx="1.5" fill="url(#pk${id})"/>
        <path d="M${h-2.5} ${s*0.15} L${h+2.5} ${s*0.15} L${h+2.5} ${s*0.28} L${h+7} ${s*0.42} L${h+7} ${s*0.82} Q${h} ${s*0.92} ${h-7} ${s*0.82} L${h-7} ${s*0.42} L${h-2.5} ${s*0.28} Z" fill="url(#py${id})" stroke="#886611" stroke-width="0.6"/>
        <ellipse cx="${h}" cy="${s*0.55}" rx="3.5" ry="6" fill="#f0d060" opacity="0.25" filter="url(#g${id})"/>
        <ellipse cx="${h-3}" cy="${s*0.48}" rx="1" ry="3" fill="white" opacity="0.2"/>`;
    case "scroll":
      return `<defs><linearGradient id="sc${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#e8d4b0"/><stop offset="50%" stop-color="#d4b896"/><stop offset="100%" stop-color="#c0a07a"/></linearGradient></defs>
        <rect x="${h-6.5}" y="${s*0.15}" width="13" height="${s*0.7}" rx="2" fill="url(#sc${id})"/>
        <rect x="${h-6}" y="${s*0.2}" width="12" height="${s*0.6}" rx="1" fill="white" opacity="0.06"/>
        <ellipse cx="${h}" cy="${s*0.17}" rx="7.5" ry="3.5" fill="#c4a886"/>
        <ellipse cx="${h}" cy="${s*0.17}" rx="5" ry="2" fill="#d4b896" opacity="0.6"/>
        <ellipse cx="${h}" cy="${s*0.83}" rx="7.5" ry="3.5" fill="#c4a886"/>
        <ellipse cx="${h}" cy="${s*0.83}" rx="5" ry="2" fill="#d4b896" opacity="0.6"/>
        <line x1="${h-3.5}" y1="${s*0.34}" x2="${h+3.5}" y2="${s*0.34}" stroke="#9a8060" stroke-width="0.7"/>
        <line x1="${h-3.5}" y1="${s*0.44}" x2="${h+3.5}" y2="${s*0.44}" stroke="#9a8060" stroke-width="0.7"/>
        <line x1="${h-3.5}" y1="${s*0.54}" x2="${h+2}" y2="${s*0.54}" stroke="#9a8060" stroke-width="0.7"/>
        <line x1="${h-3.5}" y1="${s*0.64}" x2="${h+1}" y2="${s*0.64}" stroke="#9a8060" stroke-width="0.7"/>`;
    case "scroll_enchant":
      return `<defs><linearGradient id="se${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#e8d4b0"/><stop offset="50%" stop-color="#d4b896"/><stop offset="100%" stop-color="#c0a07a"/></linearGradient>${glowF}</defs>
        <rect x="${h-6.5}" y="${s*0.15}" width="13" height="${s*0.7}" rx="2" fill="url(#se${id})"/>
        <ellipse cx="${h}" cy="${s*0.17}" rx="7.5" ry="3.5" fill="#c4a886"/>
        <ellipse cx="${h}" cy="${s*0.83}" rx="7.5" ry="3.5" fill="#c4a886"/>
        <circle cx="${h}" cy="${s*0.5}" r="5" fill="${c}" opacity="0.15" filter="url(#g${id})"/>
        <text x="${h}" y="${s*0.55}" text-anchor="middle" font-size="11" fill="${c}" font-weight="bold" filter="url(#g${id})">✦</text>`;
    case "material":
      return `<defs><linearGradient id="mt${id}" x1="0.2" y1="0" x2="0.8" y2="1"><stop offset="0%" stop-color="white" stop-opacity="0.15"/><stop offset="40%" stop-color="${c}" stop-opacity="0.7"/><stop offset="100%" stop-color="${c}" stop-opacity="0.5"/></linearGradient></defs>
        <rect x="${h-8}" y="${s*0.2}" width="16" height="18" rx="2.5" fill="url(#mt${id})"/>
        <rect x="${h-6}" y="${s*0.24}" width="12" height="2" rx="0.5" fill="white" opacity="0.1"/>
        <line x1="${h-5}" y1="${s*0.38}" x2="${h+5}" y2="${s*0.38}" stroke="${c}" stroke-width="0.5" opacity="0.3"/>
        <line x1="${h-5}" y1="${s*0.52}" x2="${h+5}" y2="${s*0.52}" stroke="${c}" stroke-width="0.5" opacity="0.25"/>`;
    case "ore":
      return `<defs><linearGradient id="or${id}" x1="0.2" y1="0" x2="0.8" y2="1"><stop offset="0%" stop-color="white" stop-opacity="0.3"/><stop offset="40%" stop-color="${c}" stop-opacity="0.8"/><stop offset="100%" stop-color="${c}" stop-opacity="0.5"/></linearGradient></defs>
        <polygon points="${h},${s*0.12} ${h+9},${s*0.32} ${h+7},${s*0.72} ${h-2},${s*0.82} ${h-9},${s*0.48} ${h-6},${s*0.18}" fill="url(#or${id})"/>
        <polygon points="${h},${s*0.12} ${h+5},${s*0.28} ${h+1},${s*0.48} ${h-4},${s*0.22}" fill="white" opacity="0.2"/>
        <polygon points="${h+3},${s*0.35} ${h+7},${s*0.45} ${h+5},${s*0.6} ${h+1},${s*0.5}" fill="${c}" opacity="0.4"/>
        <line x1="${h-2}" y1="${s*0.3}" x2="${h+2}" y2="${s*0.5}" stroke="white" stroke-width="0.5" opacity="0.15"/>`;
    case "crystal":
      return `<defs>${glowF}<linearGradient id="cr${id}" x1="0.3" y1="0" x2="0.7" y2="1"><stop offset="0%" stop-color="white" stop-opacity="0.5"/><stop offset="30%" stop-color="${c}" stop-opacity="0.8"/><stop offset="100%" stop-color="${c}" stop-opacity="0.4"/></linearGradient></defs>
        <polygon points="${h},${s*0.06} ${h+8},${s*0.38} ${h+5},${s*0.88} ${h-5},${s*0.88} ${h-8},${s*0.38}" fill="url(#cr${id})" filter="url(#g${id})"/>
        <polygon points="${h},${s*0.06} ${h+4},${s*0.38} ${h+1},${s*0.72} ${h-3},${s*0.38}" fill="white" opacity="0.2"/>
        <line x1="${h-1}" y1="${s*0.15}" x2="${h-2}" y2="${s*0.55}" stroke="white" stroke-width="0.8" opacity="0.35"/>
        <line x1="${h+2}" y1="${s*0.2}" x2="${h+4}" y2="${s*0.5}" stroke="white" stroke-width="0.5" opacity="0.2"/>`;
    case "bone":
      return `<defs><linearGradient id="bn${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="white" stop-opacity="0.3"/><stop offset="50%" stop-color="${c}"/><stop offset="100%" stop-color="${c}" stop-opacity="0.6"/></linearGradient></defs>
        <line x1="${h-7}" y1="${s*0.22}" x2="${h+7}" y2="${s*0.78}" stroke="url(#bn${id})" stroke-width="3.5" stroke-linecap="round"/>
        <circle cx="${h-7}" cy="${s*0.22}" r="3" fill="${c}"/>
        <circle cx="${h-7}" cy="${s*0.22}" r="1" fill="white" opacity="0.2"/>
        <circle cx="${h+7}" cy="${s*0.78}" r="3" fill="${c}"/>
        <circle cx="${h+7}" cy="${s*0.78}" r="1" fill="white" opacity="0.2"/>
        <line x1="${h-6}" y1="${s*0.24}" x2="${h}" y2="${s*0.5}" stroke="white" stroke-width="0.5" opacity="0.15"/>`;
    case "essence":
      return `<defs>${glowF}<radialGradient id="es${id}" cx="40%" cy="35%"><stop offset="0%" stop-color="white" stop-opacity="0.5"/><stop offset="30%" stop-color="${c}" stop-opacity="0.7"/><stop offset="70%" stop-color="${c}" stop-opacity="0.4"/><stop offset="100%" stop-color="${c}" stop-opacity="0.1"/></radialGradient></defs>
        <circle cx="${h}" cy="${h}" r="9" fill="url(#es${id})" filter="url(#g${id})"/>
        <circle cx="${h}" cy="${h}" r="5" fill="${c}" opacity="0.5"/>
        <circle cx="${h}" cy="${h}" r="2.5" fill="white" opacity="0.4"/>
        <circle cx="${h-2}" cy="${h-2}" r="1" fill="white" opacity="0.3"/>`;
    case "arrow":
      return `<defs>${metalG}</defs>
        <line x1="${h-8}" y1="${h+5}" x2="${h+6}" y2="${h-4}" stroke="#9a7830" stroke-width="2"/>
        <polygon points="${h+6},${h-6} ${h+10},${h-2} ${h+6},${h-1}" fill="url(#m${id})"/>
        <line x1="${h-8}" y1="${h+6}" x2="${h-6}" y2="${h+2}" stroke="${c}" stroke-width="1"/>
        <line x1="${h-8}" y1="${h+6}" x2="${h-6}" y2="${h+8}" stroke="${c}" stroke-width="1"/>
        <line x1="${h-7}" y1="${h+5.5}" x2="${h+5}" y2="${h-3}" stroke="white" stroke-width="0.3" opacity="0.2"/>`;
    case "box":
      return `<defs><linearGradient id="bx${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c}" stop-opacity="0.7"/><stop offset="100%" stop-color="${c}" stop-opacity="0.4"/></linearGradient>${metalG}</defs>
        <rect x="${h-9}" y="${s*0.28}" width="18" height="14" rx="2.5" fill="url(#bx${id})" stroke="${c}" stroke-width="0.8"/>
        <path d="M${h-9} ${s*0.28} L${h} ${s*0.18} L${h+9} ${s*0.28}" fill="${c}" opacity="0.6"/>
        <path d="M${h-4} ${s*0.22} L${h} ${s*0.18} L${h+4} ${s*0.22}" fill="white" opacity="0.1"/>
        <rect x="${h-1.5}" y="${s*0.33}" width="3" height="5" rx="0.8" fill="url(#m${id})"/>
        <circle cx="${h}" cy="${s*0.38}" r="1" fill="#f0d060" opacity="0.8"/>
        <line x1="${h-7}" y1="${s*0.42}" x2="${h+7}" y2="${s*0.42}" stroke="${c}" stroke-width="0.5" opacity="0.3"/>`;
    case "stone":
      return `<defs>${glowF}<radialGradient id="st${id}" cx="40%" cy="35%"><stop offset="0%" stop-color="white" stop-opacity="0.5"/><stop offset="40%" stop-color="${c}" stop-opacity="0.8"/><stop offset="100%" stop-color="${c}" stop-opacity="0.3"/></radialGradient></defs>
        <circle cx="${h}" cy="${h}" r="10" fill="url(#st${id})" filter="url(#g${id})"/>
        <circle cx="${h}" cy="${h}" r="6" fill="${c}" opacity="0.6"/>
        <circle cx="${h}" cy="${h}" r="3" fill="white" opacity="0.3"/>
        <circle cx="${h-2}" cy="${h-2}" r="1.5" fill="white" opacity="0.25"/>
        <text x="${h}" y="${h+3.5}" text-anchor="middle" font-size="9" fill="white" opacity="0.7">✦</text>`;
    default:
      return `<text x="${h}" y="${h+3}" text-anchor="middle" font-size="12" fill="${c}">?</text>`;
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
