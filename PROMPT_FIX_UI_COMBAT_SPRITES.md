# RuneWord Chronicle — UI/Combat/Sprite 전체 수정 프롬프트
# Claude Code 명령 프롬프트 (그대로 붙여넣기용)

---

## [EPCT] Execution Context

이 프로젝트는 Next.js 14 + Phaser 3 + TypeScript + Socket.IO 기반의 2D 탑뷰 RPG 게임이다.
루트 경로: `iwnewrpg/` (package.json, tsconfig.json, src/, server/ 포함)

**현재 문제점 4가지를 한 번에 모두 수정한다:**
1. 우측 검은 패널(미니맵 과다 노출) → 작고 실용적인 컴팩트 미니맵으로 재설계
2. 몬스터 전투 시스템 → 클릭/자동공격 시 퀴즈 없이 직접 데미지 누적, 죽을 때까지 싸움
3. 퀴즈 모달 우클릭 브라우저 컨텍스트 메뉴 차단
4. 모든 캐릭터·몬스터 스프라이트 공격 애니메이션 4프레임으로 업그레이드 (방향당 최소 4장, 8방향 × 4프레임 = 32장)

---

## [EPCT] Pre-conditions — 사전 확인

작업 전에 아래 명령을 실행해서 환경을 확인하라:

```bash
cd iwnewrpg
node --version
npm --version
ls src/game/scenes/
ls src/components/ui/
```

---

## [EPCT] Core Tasks — 수정 작업 전체 목록

### TASK 1: 우측 패널 제거 + 컴팩트 미니맵 재설계
**파일: `src/components/ui/MiniMap.tsx`**

기존 MiniMap 컴포넌트를 아래 사양으로 완전 재작성하라:
- 전체 크기: 최대 200×220px (토글 가능, M 키)
- 실제 플레이어 좌표를 맵에 맞게 비율 변환하여 점으로 표시
- 몬스터 위치도 빨간 점으로 표시
- 배경: 해당 맵의 타일 구성 대략 반영 (풀=초록, 물=파랑, 길=갈색)
- 크기: canvas 160×120px (HTML Canvas 또는 SVG 사용)
- 하단에 현재 맵 이름 + 플레이어 좌표 표시
- 이동 가능한 지역 링크는 맵 이름 클릭 시 별도 작은 드롭다운으로만

**구체적 구현:**

```tsx
// src/components/ui/MiniMap.tsx 전체 재작성
"use client";

import { useState, useEffect, useRef } from "react";
import { MAPS } from "@/game/data/maps";
import { useGameStore } from "@/lib/gameStore";
import { getSocket } from "@/lib/socket";

export function MiniMap() {
  const [visible, setVisible] = useState(true);
  const [showTravel, setShowTravel] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentMapId = useGameStore((state) => state.currentMapId);
  const worldPlayers = useGameStore((state) => state.worldPlayers);
  const worldMonsters = useGameStore((state) => state.worldMonsters);
  const selfId = useGameStore((state) => state.selfId);
  const setCurrentMapId = useGameStore((state) => state.setCurrentMapId);
  const updateQuestProgress = useGameStore((state) => state.updateQuestProgress);

  const map = MAPS[currentMapId] ?? MAPS.speakingIsland;
  const selfPlayer = worldPlayers.find((p) => p.id === selfId);

  // M 키 토글
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "m" || e.key === "M") setVisible((v) => !v);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Canvas 렌더링
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !visible) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // 맵 월드 범위 (WorldScene과 동일)
    const TILE_W = 72;
    const TILE_H = 52;
    const worldW = map.width * TILE_W + 320;
    const worldH = map.height * TILE_H + 260;

    // 좌표 변환 함수
    const toMapX = (wx: number) => (wx / worldW) * W;
    const toMapY = (wy: number) => (wy / worldH) * H;

    // 배경 - 맵 종류별 색상
    const bgColor =
      currentMapId === "moonlitWetland"
        ? "#1a2e1a"
        : currentMapId === "dragonValley"
          ? "#2a1a0a"
          : currentMapId === "undergroundDungeon"
            ? "#0a0a1a"
            : "#1a2a1a";
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, W, H);

    // 수역 표시
    if (
      ["speakingIsland", "moonlitWetland", "windwoodForest"].includes(
        currentMapId,
      )
    ) {
      ctx.fillStyle = "rgba(43,131,170,0.55)";
      if (currentMapId === "speakingIsland") {
        ctx.beginPath();
        ctx.ellipse(
          toMapX(1480),
          toMapY(480),
          toMapX(260),
          toMapY(360),
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      } else if (currentMapId === "moonlitWetland") {
        ctx.beginPath();
        ctx.ellipse(
          toMapX(1440),
          toMapY(560),
          toMapX(380),
          toMapY(410),
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }

    // 마을 안전구역 표시 (speakingIsland)
    if (currentMapId === "speakingIsland") {
      ctx.fillStyle = "rgba(180,150,100,0.22)";
      ctx.beginPath();
      ctx.roundRect(toMapX(220), toMapY(180), toMapX(760), toMapY(430), 4);
      ctx.fill();
      ctx.strokeStyle = "rgba(246,223,149,0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 몬스터 점
    worldMonsters.forEach((m) => {
      if (m.mapId !== currentMapId) return;
      ctx.beginPath();
      ctx.arc(toMapX(m.x), toMapY(m.y), 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "#fb7260";
      ctx.fill();
    });

    // 다른 플레이어 점
    worldPlayers.forEach((p) => {
      if (p.id === selfId) return;
      ctx.beginPath();
      ctx.arc(toMapX(p.x), toMapY(p.y), 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "#89cffd";
      ctx.fill();
    });

    // 내 플레이어 (흰색 + 글로우)
    if (selfPlayer) {
      ctx.shadowColor = "#fff4ba";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(
        toMapX(selfPlayer.x),
        toMapY(selfPlayer.y),
        3.5,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = "#fff4ba";
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 테두리
    ctx.strokeStyle = "rgba(246,223,149,0.25)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, W, H);
  }, [
    visible,
    worldPlayers,
    worldMonsters,
    selfPlayer,
    currentMapId,
    map,
    selfId,
  ]);

  const travel = (nextMapId: string) => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit("map:travel", { to: nextMapId });
      setShowTravel(false);
      return;
    }
    setCurrentMapId(nextMapId);
    const travelQuest = useGameStore
      .getState()
      .getNpcQuests("elder")
      .find(
        (q) =>
          (q.objectives[0]?.type === "travel" ||
            q.objectives[0]?.type === "reach") &&
          q.objectives[0]?.target === nextMapId,
      );
    if (travelQuest?.status === "in_progress") {
      updateQuestProgress(travelQuest.id, travelQuest.goal);
    }
    setShowTravel(false);
  };

  const coordLabel = selfPlayer
    ? `${Math.round((selfPlayer.x - 140) / 36)}, ${Math.round((selfPlayer.y - 230) / 20)}`
    : "-, -";

  if (!visible) {
    return (
      <button
        type="button"
        onClick={() => setVisible(true)}
        className="rounded-xl border border-amber-200/20 bg-black/50 px-3 py-1.5 text-xs text-amber-50 hover:bg-black/70"
      >
        [M] 지도
      </button>
    );
  }

  return (
    <div className="relative flex w-[200px] flex-col gap-1 rounded-2xl border border-amber-200/20 bg-black/70 p-2 shadow-lg backdrop-blur-sm">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-amber-200/50">
            Field Map
          </p>
          <button
            type="button"
            onClick={() => setShowTravel((v) => !v)}
            className="text-left text-sm font-semibold text-amber-50 hover:text-amber-200"
          >
            {map.name} ▾
          </button>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="rounded-md bg-black/30 px-1.5 py-0.5 text-[10px] text-amber-200/50 hover:text-amber-200"
        >
          [M]
        </button>
      </div>

      {/* 미니맵 캔버스 */}
      <canvas
        ref={canvasRef}
        width={184}
        height={110}
        className="rounded-xl"
        style={{ imageRendering: "pixelated" }}
      />

      {/* 좌표 + 통계 */}
      <div className="flex items-center justify-between text-[10px] text-amber-100/60">
        <span>
          📍 {coordLabel}
        </span>
        <span>
          👤{worldPlayers.length} 👾{worldMonsters.length}
        </span>
      </div>

      {/* 이동 가능 맵 드롭다운 */}
      {showTravel && map.connections.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-xl border border-amber-200/20 bg-black/90 p-1.5 shadow-xl">
          <p className="mb-1 text-[10px] uppercase tracking-widest text-amber-200/50">
            이동
          </p>
          {map.connections.map((conn) => (
            <button
              key={`${map.id}-${conn.to}`}
              type="button"
              onClick={() => travel(conn.to)}
              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs text-amber-50 hover:bg-amber-200/10"
            >
              <span>{conn.fromPortalName}</span>
              <span className="text-amber-200/60">
                {MAPS[conn.to]?.name ?? conn.to}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### TASK 2: 전투 시스템 수정 — 직접 데미지 누적 방식
**파일: `src/game/scenes/WorldScene.ts`**

**변경 사항:**

#### 2-1. `performAttack` 메서드 수정
오프라인 모드에서 `triggerOfflineQuiz(monsterId)` 호출 부분을 직접 데미지 계산으로 교체한다.
퀴즈는 유지하되, 전투 중 **주기적으로**(매 5번째 공격마다) 퀴즈가 트리거되게 하고, 퀴즈 없이도 공격이 계속되게 한다.

`src/game/scenes/WorldScene.ts` 안에서:

1. 클래스 멤버변수에 추가:
```typescript
private offlineAttackCount = new Map<string, number>(); // 몬스터별 공격 횟수
private QUIZ_EVERY_N_ATTACKS = 5; // N번 공격마다 퀴즈 1번
```

2. `performAttack` 내 오프라인 처리 블록 (`triggerOfflineQuiz` 호출 전체)을 아래로 교체:

```typescript
// 오프라인 직접 데미지 처리
if (!socket.connected) {
  const monsterData = this.offlineMonsterHp.get(monsterId);
  if (!monsterData || monsterData.hp <= 0) return;

  const state = useGameStore.getState();
  const attackProfile = state.getAttackProfile();
  const baseDamage = 3 + attackProfile.str + Math.floor(attackProfile.dex * 0.5);
  const variance = Math.floor(Math.random() * 4) - 1; // -1 ~ +2
  const damage = Math.max(1, baseDamage + variance);
  const isCrit = Math.random() < 0.12;
  const finalDamage = isCrit ? Math.floor(damage * 1.8) : damage;

  const newHp = Math.max(0, monsterData.hp - finalDamage);
  this.offlineMonsterHp.set(monsterId, { ...monsterData, hp: newHp });

  // 데미지 숫자 표시
  if (monsterSprite) {
    this.showDamageNumber(monsterSprite.x, monsterSprite.y, finalDamage, isCrit);
  }

  // 몬스터 HP 바 업데이트
  useGameStore.getState().upsertMonster({
    id: monsterId,
    mapId: "speakingIsland",
    name: monsterSprite?.label.text ?? "",
    level: 1,
    hp: newHp,
    maxHp: monsterData.maxHp,
    x: monsterSprite?.x ?? 0,
    y: monsterSprite?.y ?? 0,
  });

  // 몬스터 사망 처리
  if (newHp <= 0) {
    const goldReward = monsterData.goldMin + Math.floor(Math.random() * (monsterData.goldMax - monsterData.goldMin + 1));
    const expReward = monsterData.exp;
    useGameStore.getState().applyOfflineReward({ gold: goldReward, exp: expReward });

    const killQuest = state.quests.find(q => q.questId === "mq_001" && q.status === "in_progress");
    if (killQuest) {
      useGameStore.getState().updateQuestProgress("mq_001", Math.min(10, killQuest.progress + 1));
    }
    this.offlineStreak = 0;
    this.offlineAttackCount.delete(monsterId);

    // 리스폰
    this.time.delayedCall(10000, () => {
      const sprite = this.monsterSprites.get(monsterId);
      if (!sprite) return;
      const fullHp = monsterData.maxHp;
      this.offlineMonsterHp.set(monsterId, { ...monsterData, hp: fullHp });
      useGameStore.getState().upsertMonster({
        id: monsterId,
        mapId: "speakingIsland",
        name: sprite.label.text,
        level: 1,
        hp: fullHp,
        maxHp: fullHp,
        x: sprite.x,
        y: sprite.y,
      });
      sprite.setVisible(true);
      sprite.setAlpha(0);
      this.tweens.add({ targets: sprite, alpha: 1, duration: 400 });
    });
    return;
  }

  // 주기적 퀴즈 트리거 (N번마다 1번)
  const attackCount = (this.offlineAttackCount.get(monsterId) ?? 0) + 1;
  this.offlineAttackCount.set(monsterId, attackCount);
  if (attackCount % this.QUIZ_EVERY_N_ATTACKS === 0) {
    this.triggerOfflineQuiz(monsterId); // 퀴즈 정답 시 보너스 데미지
  }
  return;
}
```

3. `handleOfflineQuizResult` 메서드에서 몬스터 사망 시 리스폰 로직이 중복되므로, 퀴즈 결과에서 죽이는 대신 **보너스 데미지**만 주는 방식으로 수정:

```typescript
private handleOfflineQuizResult(payload: {
  status: "correct" | "wrong" | "timeout";
  answer: string;
  reward?: { gold: number; exp: number; items: string[]; bonusMultiplier: number };
}) {
  const monsterId = this.pendingOfflineMonsterId;
  if (!monsterId) return;
  this.pendingOfflineMonsterId = null;

  if (payload.status !== "correct") {
    this.offlineStreak = 0;
    return;
  }

  this.offlineStreak += 1;

  // 퀴즈 정답 시 보너스 데미지
  const monsterData = this.offlineMonsterHp.get(monsterId);
  const monsterSprite = this.monsterSprites.get(monsterId);
  if (!monsterData || monsterData.hp <= 0) return;

  const bonusDamage = Math.floor(
    (5 + useGameStore.getState().getAttackProfile().int) *
      (payload.reward?.bonusMultiplier ?? 1),
  );
  const newHp = Math.max(0, monsterData.hp - bonusDamage);
  this.offlineMonsterHp.set(monsterId, { ...monsterData, hp: newHp });

  if (monsterSprite) {
    this.showDamageNumber(monsterSprite.x, monsterSprite.y - 20, bonusDamage, true);
    useGameStore.getState().upsertMonster({
      id: monsterId,
      mapId: "speakingIsland",
      name: monsterSprite.label.text,
      level: 1,
      hp: newHp,
      maxHp: monsterData.maxHp,
      x: monsterSprite.x,
      y: monsterSprite.y,
    });
  }

  // 퀴즈 보너스로 몬스터 사망 시
  if (newHp <= 0) {
    const goldReward = monsterData.goldMin + Math.floor(Math.random() * (monsterData.goldMax - monsterData.goldMin + 1));
    useGameStore.getState().applyOfflineReward({ gold: goldReward + 10, exp: monsterData.exp + 20 });
    this.offlineStreak = 0;
    this.offlineAttackCount.delete(monsterId);
    this.time.delayedCall(10000, () => {
      const sprite = this.monsterSprites.get(monsterId);
      if (!sprite) return;
      const fullHp = monsterData.maxHp;
      this.offlineMonsterHp.set(monsterId, { ...monsterData, hp: fullHp });
      useGameStore.getState().upsertMonster({
        id: monsterId,
        mapId: "speakingIsland",
        name: sprite.label.text,
        level: 1,
        hp: fullHp,
        maxHp: fullHp,
        x: sprite.x,
        y: sprite.y,
      });
      sprite.setVisible(true);
      sprite.setAlpha(0);
      this.tweens.add({ targets: sprite, alpha: 1, duration: 400 });
    });
  }

  // 퀘스트 연속 정답 추적
  const streakQuest = useGameStore.getState().quests.find(q => q.questId === "mq_003");
  if (streakQuest?.status === "in_progress") {
    useGameStore.getState().updateQuestProgress("mq_003", Math.min(10, streakQuest.progress + 1));
  }
}
```

---

### TASK 3: 퀴즈 모달 우클릭 컨텍스트 메뉴 차단
**파일: `src/components/ui/QuizModal.tsx`**

QuizModal의 최상위 div에 `onContextMenu` 핸들러와 전역 contextmenu 이벤트 차단 추가:

```tsx
// QuizModal.tsx - 모달 활성 시 전체 우클릭 차단
useEffect(() => {
  if (!quiz.active) return;
  const prevent = (e: MouseEvent) => e.preventDefault();
  document.addEventListener("contextmenu", prevent);
  return () => document.removeEventListener("contextmenu", prevent);
}, [quiz.active]);
```

그리고 최상위 div에도:
```tsx
<div
  className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 p-4"
  onContextMenu={(e) => e.preventDefault()}
>
```

---

### TASK 4: 스프라이트 공격 애니메이션 4프레임으로 업그레이드
**파일: `src/game/scenes/BootScene.ts`**
**파일: `src/game/scenes/WorldScene.ts`**

#### 4-1. WorldScene.ts 상수 수정
```typescript
// 변경 전
const ATTACK_FRAME_COUNT = 3;
// 변경 후
const ATTACK_FRAME_COUNT = 4;
```

#### 4-2. BootScene.ts — 모든 createAnimated*Set 함수에서 attack 프레임 [0,1,2,3]으로 변경

`createAnimatedHumanoidSet`, `createAnimatedSlimeSet`, `createAnimatedBeastSet` 세 함수 모두에서:
```typescript
// 변경 전
[0, 1, 2].forEach((frame) => {
  this.createUnitFrame(`${base}_attack_${direction}_${frame}`, { ... });
});
// 변경 후
[0, 1, 2, 3].forEach((frame) => {
  this.createUnitFrame(`${base}_attack_${direction}_${frame}`, { ... });
});
```

#### 4-3. BootScene.ts — `createUnitFrame` 의 attack 애니메이션 계산식 개선
`swing` 계산 (4프레임 버전):
```typescript
// 변경 전
const swing = spec.state === "attack" ? [0, 4, 8][spec.frame % 3] : 0;
// 변경 후 (4프레임: 준비→올림→내려침→회수)
const swing = spec.state === "attack" ? [0, 5, 10, 4][spec.frame % 4] : 0;
```

attack 시 bob 값도 4프레임에 맞게:
```typescript
// 변경 전
const bob = spec.state === "walk" ? [0, 2, 0, 1][spec.frame % 4] : spec.state === "attack" ? -2 + spec.frame : 0;
// 변경 후 (4프레임 공격: 뒤로/준비/-치는 순간 앞으로/회수)
const bob = spec.state === "walk"
  ? [0, 2, 0, 1][spec.frame % 4]
  : spec.state === "attack"
    ? [-1, -3, 1, 0][spec.frame % 4]
    : 0;
```

stride도 공격 중 방향 전진:
```typescript
// 변경 전
const stride = spec.state === "walk" ? [-2, 2, -1, 1][spec.frame % 4] : 0;
// 변경 후 (공격 시 몸통 앞으로 이동)
const stride = spec.state === "walk"
  ? [-2, 2, -1, 1][spec.frame % 4]
  : spec.state === "attack"
    ? [0, 1, 3, 1][spec.frame % 4]
    : 0;
```

#### 4-4. WorldScene.ts — 애니메이션 타이밍 개선 (더 자연스럽게)
```typescript
// updateAnimatedActor 내 frameInterval 수정
const frameInterval =
  nextState === "attack" ? 80  // 공격 프레임 더 빠르게
  : nextState === "walk" ? 100  // 걷기 약간 빠르게
  : 280;  // idle은 더 느리게

// walk bob 보정 (4프레임에 맞게)
const bob =
  sprite.animState === "walk"
    ? [0, -1.8, -2.8, -0.9][sprite.animFrame % 4]
    : sprite.animState === "attack"
      ? [-1, -3.5, 2, 0][sprite.animFrame % 4]
      : 0;
```

---

### TASK 5: 레이아웃 정리 — 우측 패널 공간 최적화
**파일: `src/app/game/page.tsx`**

미니맵이 작아졌으므로 레이아웃에서 미니맵을 더 컴팩트하게 배치:

```tsx
{/* 우측 상단 미니맵 - 작게 */}
<div className="pointer-events-auto absolute right-3 top-3 z-10 w-[200px]">
  <MiniMap />
</div>
```

---

## [EPCT] 전체 수정 실행 순서

Claude Code는 아래 순서대로 정확히 실행하라:

```
1. src/components/ui/MiniMap.tsx → TASK 1 전체 재작성
2. src/game/scenes/BootScene.ts → TASK 4-2, 4-3 수정 (attack 프레임 3→4, swing/bob/stride 수식)
3. src/game/scenes/WorldScene.ts → TASK 2 수정 (직접 데미지), TASK 4-1 (ATTACK_FRAME_COUNT=4), TASK 4-4 (타이밍)
4. src/components/ui/QuizModal.tsx → TASK 3 수정 (우클릭 차단)
5. src/app/game/page.tsx → TASK 5 레이아웃 정리
```

---

## [EPCT] 검증 단계 (수정 완료 후)

```bash
cd iwnewrpg
npm run build 2>&1 | tail -30
```

빌드 오류 발생 시:
- TypeScript 타입 오류 → 해당 파일 수정 후 재빌드
- Import 오류 → import 경로 확인
- 모든 오류 해소 후 `npm run build` 통과 확인

---

## [EPCT] 추가 참고사항

### 파일별 역할 요약
| 파일 | 역할 |
|------|------|
| `src/game/scenes/BootScene.ts` | 모든 스프라이트 텍스처를 Phaser Canvas API로 생성. 방향별 프레임 키: `{base}_{state}_{dir}_{frame}` |
| `src/game/scenes/WorldScene.ts` | 게임 메인 씬. 플레이어/몬스터/NPC 스프라이트 관리, 전투, 이동 |
| `src/components/ui/MiniMap.tsx` | React 미니맵 UI (Phaser 외부 오버레이) |
| `src/components/ui/QuizModal.tsx` | 퀴즈 전투 모달 |
| `src/app/game/page.tsx` | 게임 페이지 레이아웃 |

### 스프라이트 키 명명 규칙
```
{base}_{state}_{direction}_{frame}
예: anim_player_guardian_walk_se_2
    anim_monster_slime_attack_nw_3
```

### 몬스터 종류 → 텍스처 매핑 (WorldScene.ts getMonsterTexture)
- slime → anim_monster_slime
- goblin_child, skeleton → anim_monster_skeleton
- orc, kobold, lizard → anim_monster_orc
- boar → anim_monster_boar
- wolf, werewolf → anim_monster_wolf
- spider → anim_monster_spider
- bog, frog → anim_monster_bog
- wisp, sprite → anim_monster_wisp
- dragon, wyvern, drake → anim_monster_dragon
- golem → anim_monster_rock_golem

### 필요한 API 키 / 환경변수
```
NEXT_PUBLIC_SOCKET_URL=   # Socket.IO 서버 URL (없으면 오프라인 모드 자동)
NEXT_PUBLIC_SUPABASE_URL= # Supabase URL (없으면 로컬 스토리지 폴백)
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Supabase anon key
```
이 키들은 `.env.local` 파일에 설정. 오프라인 모드는 키 없이도 정상 동작.

---

## [EPCT] 완료 체크리스트

- [ ] MiniMap 재설계: 200px 이하 컴팩트 크기, canvas 기반 실시간 위치 표시
- [ ] 몬스터 클릭 시 퀴즈 대신 직접 데미지 (자동공격 continuum)
- [ ] N번 공격마다 퀴즈 1번 트리거 (보너스 데미지)
- [ ] 퀴즈 모달 우클릭 시 브라우저 컨텍스트 메뉴 차단
- [ ] ATTACK_FRAME_COUNT = 4 (모든 캐릭터·몬스터·NPC)
- [ ] BootScene attack 프레임 [0,1,2,3] 생성
- [ ] swing/bob/stride 4프레임 수식 적용
- [ ] npm run build 통과 (TypeScript 오류 0)
