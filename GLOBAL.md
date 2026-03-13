# Global Notes

## Current Project State
- 프로젝트는 `Next.js + Phaser + Socket.IO` 기반의 실행 가능한 MMORPG 프로토타입 상태다.
- 핵심 루프는 `몬스터 공격 -> 퀴즈 -> 보상/루팅 -> 인벤토리 반영`까지 연결되어 있다.
- 퀘스트는 서버 권위로 동작하며 상태 흐름은 `available -> in_progress -> ready_to_turn_in -> claimable -> completed`다.
- 존 이동은 미니맵 버튼을 통해 `map:travel` 소켓 이벤트로 처리된다.
- 몬스터는 서버 틱에서 추격/자동 공격을 수행한다.

## Important Files
- 서버 핵심: `server/gameServer.ts`
- 몬스터 AI/상태: `server/monsterManager.ts`
- 퀴즈 처리: `server/quizHandler.ts`
- 클라이언트 상태: `src/lib/gameStore.ts`
- 월드 렌더링/입력: `src/game/scenes/WorldScene.ts`
- 소켓 브릿지: `src/components/game/GameSocketBridge.tsx`

## Build And Verification
- 빌드는 현재 `npm run build`로 통과한다.
- 타입 체크는 `npm run typecheck`로 프론트와 `server/tsconfig.json` 둘 다 본다.
- 메모리 이슈를 피하려고 `package.json`의 `build`와 `typecheck` 스크립트에 `--max-old-space-size`가 이미 올라가 있다. 함부로 낮추지 말 것.

## Encoding Note
- 몇몇 한글 파일은 작업 중 터미널에서 깨져 보인 적이 있었다.
- 문자열이 다시 깨져 보이면 부분 수정보다 파일 전체를 `apply_patch`로 통째로 재작성하는 편이 안전했다.
- 특히 자주 문제가 났던 범위: `src/lib/gameStore.ts`, `src/components/ui/*`, `src/game/data/*`, `server/*`.

## Git / Repo
- 원격 저장소: `https://github.com/insushim/iwnewrpg.git`
- 기본 브랜치로 현재 `master`를 사용 중이다.
- 최근 푸시 커밋: `c54e8e4` (`Implement RuneWord Chronicle gameplay prototype`)

## Suggested Next Steps
- 몬스터별 공격적/비공격적 성향 분리
- 지역별 몬스터/NPC/포털 데이터 확장
- 피격 이펙트, 전투 로그, 데미지 숫자 표시 강화
- 퀘스트 목표 문구를 사람이 읽기 쉬운 형태로 정리
- 실제 배포 연결: `Vercel` 프론트 + `Railway/Render` 소켓 서버
