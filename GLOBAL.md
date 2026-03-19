# Global Notes

## Current Project State
- The project is a `Next.js + Phaser + Socket.IO` MMORPG prototype with active gameplay, UI, and world-scene iteration.
- Core gameplay loop is connected end-to-end: monster combat -> quiz/event handling -> rewards/loot -> inventory/store reflection.
- Quest state flow is handled as `available -> in_progress -> ready_to_turn_in -> claimable -> completed`.
- Map travel is triggered through `map:travel`.
- Monster chase and auto-attack behavior are server-authoritative.

## Important Files
- Server gameplay flow: `server/gameServer.ts`
- Monster AI/state: `server/monsterManager.ts`
- Quiz handling: `server/quizHandler.ts`
- Client state store: `src/lib/gameStore.ts`
- World rendering/input/combat presentation: `src/game/scenes/WorldScene.ts`
- Socket bridge: `src/components/game/GameSocketBridge.tsx`

## Build And Verification
- Primary local checks:
  - `npm run build`
  - `npm run typecheck`
  - `npm run lint`
- `package.json` already uses elevated `--max-old-space-size` for `build` and `typecheck`. Do not remove that casually.

## Encoding Note
- Some files may display as garbled in terminal output even when the file content itself is valid.
- If a file starts looking corrupted during patching, replacing the whole file with `apply_patch` is often safer than surgical line edits.
- Files that have shown encoding friction before:
  - `src/lib/gameStore.ts`
  - `src/components/ui/*`
  - `src/game/data/*`
  - `server/*`

## Git / Repo
- Remote repository: `https://github.com/insushim/iwnewrpg.git`
- Default branch in active use: `master`
- Always run `git status --short` before claiming there are new commit-worthy changes.

## 2026-03-18 Working Memory
- Character remaster pass now includes `8-direction x 3-frame` walking sprites for player humanoids.
- `src/game/scenes/WorldScene.ts` now adds direction-based `walkSway`, `walkLean`, body squash/stretch, ring drift, label drift, and per-step dust/spark effects.
- Weapon silhouette split is active for player classes:
  - `dagger`: close stance and fast stab feel
  - `oneHandSword`: balanced sword stance and regular slash feel
  - `twoHandSword`: broader stance and heavy swing feel
- Main files to revisit first next time:
  - `src/game/render/remasterTextureCatalog.ts`
  - `src/game/render/remasterUnitTextures.ts`
  - `src/game/scenes/WorldScene.ts`
- Practical rule for this character system:
  - direction readability is created by both generated textures and runtime motion offsets
  - weapon readability is created by both texture-base selection and attack/trail timing
- Manual Vercel production deploy worked in this repo.
- Stable production URL: `https://iwnewrpg.vercel.app`
- Recent deployment URLs from this session:
  - `https://iwnewrpg-l4farh8xj-insu-shims-projects.vercel.app`
  - `https://iwnewrpg-gujf77m39-insu-shims-projects.vercel.app`
  - `https://iwnewrpg-njfc42njg-insu-shims-projects.vercel.app`
- Repeated deploy warning to remember:
  - `zustand` / `use-sync-external-store@1.2.0` shows a React peer warning on Vercel
  - warning did not block build or deploy

## 2026-03-19 Working Memory — Lineage Remaster Graphics Upgrade

### Build & Deploy
- **Next.js 16은 Turbopack이 기본** → `npx next build --webpack` 플래그 필수 (Turbopack은 webpack config 있으면 에러)
- **Cloudflare Pages 배포**: `npx wrangler pages deploy out --commit-dirty=true` (Vercel 대신 CF 사용 중)
- 최근 배포 URL: `https://94f9f687.iwnewrpg.pages.dev`

### 스프라이트 시스템 핵심 구조
- `remasterTextureCatalog.ts`: 47개 UnitPack 정의 (9 플레이어 + 7 NPC + 31 몬스터)
- `remasterUnitTextures.ts`: 128x128 Canvas 기반 프로시저럴 텍스처 생성
  - 8방향 × 3상태(idle 2프레임, walk 3프레임, attack 4프레임) = 팩당 72 텍스처
  - **drawHumanoid**: 이미 상세함 (갑옷 레이어, 무기 5종, 망토 물리)
  - **drawSlime**: 이미 상세함 (반투명 젤리, 버블, 막질 효과)
  - **drawSpider/Wolf**: 중간 수준 디테일
  - **drawBeast switch**: dragon/golem/skeleton/orc/boar/wisp → 이번에 전면 리마스터 완료
- 새 몬스터 추가 시: `remasterTextureCatalog.ts`에 PalettePack 추가 → `drawBeast` switch에 case 추가

### 아이템 아이콘 시스템
- `ItemIcon.tsx`의 `renderSvg()`: SVG 문자열 반환 방식
- 각 아이콘에 고유 gradient ID 필요 (동일 페이지에 여러 아이콘 렌더 시 충돌 방지)
- 패턴: `const id = type + Math.random().toString(36).slice(2,6)` → `<defs>` 내 gradient/filter에 사용

### UI 클래스 시스템 (globals.css)
- `.btn-lineage`: 금속 텍스처 버튼 (hover/active 상태 포함)
- `.gauge-bar` + `.gauge-hp/.gauge-mp/.gauge-exp`: 게이지 바 시스템
- `.tooltip-lineage`: 블러 배경 금테 툴팁
- `.divider-ornate`: 장식 구분선
- `.rarity-*`: epic/legendary/mythic에 펄스 애니메이션 자동 적용

### WorldScene 이펙트 구조
- `showDamageNumber()`: 이중 글로우 + 크리티컬 별 버스트 + 스케일 팝
- `showHitEffect()`: 임팩트 플래시 + 확장 링 + X자 슬래시 + 다색 스파크
- `createAtmosphere()`: 갓 레이, 먼지 입자, 볼류메트릭 안개, 태양 후광
- `updateAmbientLighting()`: 맵별 색온도 + 시간 기반 동적 조명

### 주의사항
- `Math.random()` 사용하는 프로시저럴 텍스처는 매 생성마다 미세하게 달라짐 (의도적)
- BootScene의 legacy 텍스처(createCharacterTexture 등)는 remaster 시스템이 덮어씀 — 삭제해도 무방
- 타일 텍스처(96×72)와 유닛 텍스처(128×128)는 별도 시스템

## Suggested Next Steps
- Keep pushing character motion readability: idle breathing, directional attack anticipation, and hit-reaction separation by weapon type.
- Expand map-specific landmark density and ambient effects if the next pass returns to world presentation.
- If deployment issues appear later, inspect Vercel logs first and separately track the React peer warning from `zustand`.
- 몬스터별 고유 사망 이펙트 / 소환 이펙트 추가 검토
- 타일 텍스처도 리마스터 수준으로 업그레이드 가능 (현재 Phaser Graphics 기반 프로시저럴)
