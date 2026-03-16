# Codex Memory

## 2026-03-16 Remaster Overhaul

- 이 프로젝트의 리마스터 상향은 `절차형 렌더링 + 런타임 오버라이드`의 2단 구조로 잡혀 있다.
- 기본 렌더링 상향의 시작점은 [src/game/config.ts](src/game/config.ts)에서 `pixelArt: false`, `antialias: true`로 바꾸는 것이다.
- 유닛 비주얼 파이프라인의 핵심 파일은 [src/game/render/remasterUnitTextures.ts](src/game/render/remasterUnitTextures.ts), [src/game/render/remasterTextureCatalog.ts](src/game/render/remasterTextureCatalog.ts), [src/game/render/remasterOverrides.ts](src/game/render/remasterOverrides.ts)다.
- 런타임은 [src/game/scenes/PreloadScene.ts](src/game/scenes/PreloadScene.ts)에서 `manifest.json`을 먼저 읽고, 실제 PNG/atlas/spritesheet 오버라이드를 우선 사용하며, 없는 프레임만 절차형 텍스처로 fallback 한다.
- 아트 파이프라인은 `public/game-assets/remaster/` 아래를 기준으로 돈다. `manifest.template.json`은 전체 키 템플릿, `manifest.json`은 실제 런타임 매니페스트다.
- 생성 스크립트는 다음 순서로 이해하면 된다.
  - `npm run generate:remaster-manifest`
  - `npm run generate:remaster-atlas-sample`
  - `npm run generate:remaster-atlas-placeholder`
  - `npm run generate:remaster-showcase-players`
  - `npm run generate:remaster-showcase-npcs`
  - `npm run generate:remaster-showcase-monsters`
  - `npm run generate:remaster-runtime-manifest`
- `generate:remaster-atlas-sample`는 각 베이스별 `atlas.sample.json`, `frame-order.txt`, `manifest.atlas.sample.json`, `atlas.mock.svg`를 만든다.
- `generate:remaster-atlas-placeholder`는 실제 PNG 시트 작업 전 자리맞춤용 `atlas.placeholder.png`를 생성한다.
- `generate:remaster-showcase-*` 스크립트들은 실제 런타임 데모용 `atlas.png`를 자동 생성한다.
- 플레이어 4종, NPC 6종, 몬스터 10종의 showcase atlas가 이미 준비돼 있고, 런타임 매니페스트도 이 20종을 우선 사용하도록 연결돼 있다.
- 미리보기 확인용 페이지는 [src/app/remaster-preview/page.tsx](src/app/remaster-preview/page.tsx)다.

## World/Scene Notes

- 월드 체감 품질의 중심은 [src/game/scenes/WorldScene.ts](src/game/scenes/WorldScene.ts)다.
- 이미 들어간 요소:
  - 분위기 광원 오버레이
  - 맵별 날씨/환경 파티클
  - 캐릭터/NPC/몬스터 백라이트
  - 클래스별 전투 톤 분기
  - 투사체 트레일, 근접 잔상, 크리티컬 버스트
  - 시간대처럼 흐르는 스크린 조명
  - 유닛 바닥 오라 시질
  - 보스 몬스터 전용 존재감 강화
- 월드 추가 작업은 대부분 `WorldScene.ts` 한 파일 안에서 해결 가능하지만, 에셋 연결은 `PreloadScene.ts`와 `remasterOverrides.ts`를 같이 봐야 한다.

## UI Notes

- 리마스터 UI 톤은 `금속 프레임 + 어두운 유리 패널 + 금색 포인트`로 통일했다.
- 이미 손본 주요 UI:
  - [src/app/page.tsx](src/app/page.tsx)
  - [src/app/game/page.tsx](src/app/game/page.tsx)
  - [src/components/ui/BottomHUD.tsx](src/components/ui/BottomHUD.tsx)
  - [src/components/ui/MiniMap.tsx](src/components/ui/MiniMap.tsx)
  - [src/components/ui/ChatWindow.tsx](src/components/ui/ChatWindow.tsx)
  - [src/components/ui/InventoryPanel.tsx](src/components/ui/InventoryPanel.tsx)
  - [src/components/ui/ShopWindow.tsx](src/components/ui/ShopWindow.tsx)
  - [src/components/ui/DialogueWindow.tsx](src/components/ui/DialogueWindow.tsx)
  - [src/components/ui/QuestWindow.tsx](src/components/ui/QuestWindow.tsx)
  - [src/components/ui/QuizModal.tsx](src/components/ui/QuizModal.tsx)
  - [src/components/ui/DeathScreen.tsx](src/components/ui/DeathScreen.tsx)

## Flow Notes

- [src/game/scenes/CharacterCreateScene.ts](src/game/scenes/CharacterCreateScene.ts)는 단순 클래스 선택이 아니라 `클래스 프리뷰 + 서버 선택 + 닉네임 입력` 흐름까지 포함한다.
- 서버명은 [src/lib/gameStore.ts](src/lib/gameStore.ts)의 `serverName` 상태로 관리되고, 월드 진입 시 [src/game/scenes/WorldScene.ts](src/game/scenes/WorldScene.ts)와 [src/components/ui/BottomHUD.tsx](src/components/ui/BottomHUD.tsx)에서 함께 사용한다.

## Practical Lessons

- 이 코드베이스에서 한글이 깨져 보여도 실제 파일 내용은 UTF-8로 정상인 경우가 있다. PowerShell 출력만 믿지 말고 `Get-Content -Encoding utf8`나 `rg` 결과를 같이 확인해야 한다.
- 상태 확인과 `git add`, `git commit`을 병렬로 돌리면 오래된 `git status` 출력이 섞일 수 있다. Git 명령은 순차 실행이 더 안전하다.
- 실제 배포는 현재 세션에 Vercel 자격 증명이 없으면 막힌다. `git push origin master`까지는 가능했고, 자동배포 연결이 있을 때만 원격 배포가 이어진다.
- 오늘 기준 배포 가능한 최신 커밋은 `2b38062 feat: ship remaster visual overhaul`다.
