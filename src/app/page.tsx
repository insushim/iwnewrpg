import Link from "next/link";
import { ResetGameButton } from "@/components/ui/ResetGameButton";

const classes = [
  {
    title: "가디언",
    subtitle: "Guardian",
    description: "전열 유지와 생존에 특화된 중장 전사",
    accent: "from-[#9ebdff] to-[#385eae]",
  },
  {
    title: "레인저",
    subtitle: "Ranger",
    description: "기동성과 연속 사격으로 전장을 장악하는 추적자",
    accent: "from-[#9ae3ad] to-[#326f3a]",
  },
  {
    title: "아르카니스트",
    subtitle: "Arcanist",
    description: "광역 제압과 원거리 폭딜을 담당하는 비전술사",
    accent: "from-[#e0b4ff] to-[#6f389f]",
  },
  {
    title: "소버린",
    subtitle: "Sovereign",
    description: "폭발력과 지휘력을 겸비한 왕실 검투사",
    accent: "from-[#f0d189] to-[#8f6524]",
  },
];

const highlights = [
  {
    title: "리마스터 전투 표현",
    body: "유닛 atlas, 후광, 타격 궤적, 크리티컬 버스트까지 실시간으로 이어집니다.",
  },
  {
    title: "실아트 파이프라인",
    body: "개별 PNG, spritesheet, atlas override를 모두 지원하고 샘플 규격까지 준비돼 있습니다.",
  },
  {
    title: "월드 씬 업그레이드",
    body: "지면 셰이드, 물결, 오브젝트 그림자, HUD 리디자인으로 화면 밀도를 높였습니다.",
  },
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#06080d] text-[#f3e6c8]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#28486e_0%,#0b1420_34%,#06080d_70%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(250,211,124,0.12),transparent_28%,transparent_68%,rgba(93,129,255,0.12))]" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(255,228,160,0.22),transparent_62%)]" />

      <section className="relative mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-14">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-3 rounded-full border border-[#c99f5d]/30 bg-black/20 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[#d7b57f]">
            <span className="h-2 w-2 rounded-full bg-[#f0c972] shadow-[0_0_12px_rgba(240,201,114,0.85)]" />
            RuneWord Chronicle Remaster Build
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link
              href="/remaster-preview"
              className="rounded-[14px] border border-white/10 bg-white/5 px-4 py-2 text-white/85 transition hover:bg-white/10"
            >
              Atlas Preview
            </Link>
            <Link
              href="/game"
              className="rounded-[14px] border border-[#e2bf74]/45 bg-[linear-gradient(180deg,#dfbe73,#9e6e25)] px-4 py-2 font-semibold text-[#140d04] transition hover:brightness-105"
            >
              게임 입장
            </Link>
          </div>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.25fr_0.95fr] lg:items-center">
          <div>
            <p className="text-[12px] uppercase tracking-[0.4em] text-[#b79660]">
              Chronicle of Spell and Steel
            </p>
            <h1 className="fantasy-title mt-4 text-5xl leading-none text-[#f7eccf] drop-shadow-[0_10px_28px_rgba(0,0,0,0.45)] md:text-7xl lg:text-[92px]">
              룬워드
              <br />
              크로니클
            </h1>
            <p className="mt-5 max-w-2xl text-xl text-white/88 md:text-2xl">
              단어의 힘으로 세계를 구하라
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72 md:text-base">
              문제 기반 전투와 멀티플레이 필드를 결합한 2D MMORPG
              프로토타입입니다. 지금 빌드는 유닛 atlas, 맵 재질, HUD, 상점과
              인벤토리, 전투 이펙트까지 리마스터 방향으로 재정비된 상태입니다.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/game"
                className="rounded-[18px] border border-[#e2bf74]/45 bg-[linear-gradient(180deg,#efd38b,#a06c21)] px-6 py-4 text-sm font-semibold text-[#140d04] shadow-[0_14px_28px_rgba(0,0,0,0.28)] transition hover:translate-y-[-1px] hover:brightness-105"
              >
                아스카론 01 입장
              </Link>
              <Link
                href="/remaster-preview"
                className="rounded-[18px] border border-white/10 bg-white/5 px-6 py-4 text-sm text-white/85 transition hover:bg-white/10"
              >
                아트 파이프라인 보기
              </Link>
              <ResetGameButton />
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-3">
              {highlights.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[22px] border border-[#b48a46]/25 bg-[linear-gradient(180deg,rgba(18,23,32,0.92),rgba(7,9,15,0.96))] p-4 shadow-[0_20px_36px_rgba(0,0,0,0.32)]"
                >
                  <div className="text-sm font-semibold text-[#f2e4c2]">
                    {item.title}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/66">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <aside className="relative">
            <div className="absolute inset-0 rounded-[34px] bg-[radial-gradient(circle_at_top,rgba(255,213,120,0.14),transparent_38%),radial-gradient(circle_at_bottom,rgba(117,163,255,0.16),transparent_34%)] blur-2xl" />
            <div className="relative overflow-hidden rounded-[34px] border border-[#b48a46]/30 bg-[linear-gradient(180deg,rgba(17,21,30,0.95),rgba(6,8,14,0.98))] p-5 shadow-[0_28px_56px_rgba(0,0,0,0.4)]">
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_24%),radial-gradient(circle_at_top,rgba(255,214,120,0.09),transparent_32%)]" />
              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#b79660]">
                      Class Archive
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold text-[#f2e4c2]">
                      직업 선택 인장
                    </h2>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] tracking-[0.2em] text-[#c9b189]">
                    Live Build
                  </span>
                </div>

                <div className="grid gap-3">
                  {classes.map((item) => (
                    <div
                      key={item.title}
                      className="group relative overflow-hidden rounded-[22px] border border-white/8 bg-black/22 p-4 transition hover:border-[#d4b377]/28"
                    >
                      <div
                        className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${item.accent}`}
                      />
                      <div className="ml-3">
                        <div className="flex items-end justify-between gap-3">
                          <div>
                            <div className="text-lg font-semibold text-[#f5e8c6]">
                              {item.title}
                            </div>
                            <div className="text-[10px] uppercase tracking-[0.28em] text-[#ae9268]">
                              {item.subtitle}
                            </div>
                          </div>
                          <div
                            className={`h-10 w-10 rounded-full bg-gradient-to-br ${item.accent} opacity-85 shadow-[0_0_18px_rgba(255,255,255,0.12)]`}
                          />
                        </div>
                        <p className="mt-2 text-sm leading-6 text-white/66">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-[24px] border border-[#b48a46]/22 bg-[linear-gradient(180deg,rgba(8,11,17,0.86),rgba(14,18,26,0.96))] p-4">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-[#b79660]">
                    Operational State
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                    <StatCell label="유닛 시트" value="20" />
                    <StatCell label="플레이어" value="4" />
                    <StatCell label="몬스터" value="10" />
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-white/[0.04] px-3 py-3">
      <div className="text-lg font-semibold text-[#f5d271]">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.24em] text-[#a98d64]">
        {label}
      </div>
    </div>
  );
}
