import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#1a3552_0%,#0b1420_56%,#06080d_100%)]">
      <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_center,rgba(255,255,255,0.2)_0,transparent_2px)] [background-size:42px_42px]" />
      <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,215,0,0.08),transparent_28%,transparent_72%,rgba(93,120,255,0.14))]" />

      <section className="relative mx-auto flex min-h-screen max-w-6xl items-center px-6 py-20">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex rounded-full border border-game-gold/25 bg-game-gold/10 px-4 py-1 text-sm text-game-gold">
            RuneWord Chronicle Prototype
          </div>
          <h1 className="fantasy-title text-shadow mb-5 text-6xl leading-none text-[#f5ebc6] md:text-8xl">룬워드 크로니클</h1>
          <p className="mb-3 text-2xl text-white/90">단어의 힘으로 세계를 구하라</p>
          <p className="mb-8 max-w-2xl text-base leading-7 text-white/70 md:text-lg">
            몬스터를 쓰러뜨린 뒤 퀴즈를 풀어야 보상을 획득하는 웹 기반 2D MMORPG 프로토타입입니다. Phaser 월드, React
            UI 오버레이, Zustand 상태 관리, Socket.IO 서버 골격까지 이어질 수 있도록 구성했습니다.
          </p>

          <div className="mb-10 flex flex-wrap gap-4">
            <Link href="/game" className="rounded-2xl bg-game-gold px-6 py-4 font-semibold text-black transition hover:brightness-110">
              게임 시작
            </Link>
            <div className="rounded-2xl border border-white/15 px-6 py-4 text-white/80">서버: 아스카론 01</div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <FeatureCard title="전투 후 퀴즈" description="처치 직후 4지선다 문제를 풀어야 골드와 경험치를 획득합니다." />
            <FeatureCard title="클래식 성장 루프" description="직업, 장비, 맵, 몬스터, 스킬 구조를 확장 가능한 형태로 준비했습니다." />
            <FeatureCard title="멀티플레이 골격" description="Socket.IO 서버와 클라이언트 연결 지점을 미리 잡아 두었습니다." />
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="panel rounded-3xl p-5">
      <div className="fantasy-title mb-2 text-xl text-game-gold">{title}</div>
      <p className="text-sm leading-6 text-white/70">{description}</p>
    </div>
  );
}
