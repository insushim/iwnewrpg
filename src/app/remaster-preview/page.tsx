import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import Image from "next/image";
import Link from "next/link";

type PreviewIndex = {
  generatedAt: string;
  units: Array<{
    base: string;
    frameCount: number;
    atlasJson: string;
    atlasMockup: string;
    atlasPng?: string;
    placeholderPng?: string;
    frameOrder: string;
    manifestSnippet: string;
  }>;
};

async function getPreviewIndex(): Promise<PreviewIndex | null> {
  try {
    const filePath = resolve(
      process.cwd(),
      "public/game-assets/remaster/examples/index.json",
    );
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as PreviewIndex;

    const units = await Promise.all(
      parsed.units.map(async (unit) => ({
        ...unit,
        atlasPng: await publicAssetExists(unit.atlasPng) ? unit.atlasPng : undefined,
        placeholderPng: await publicAssetExists(unit.placeholderPng)
          ? unit.placeholderPng
          : undefined,
      })),
    );

    return {
      ...parsed,
      units,
    };
  } catch {
    return null;
  }
}

async function publicAssetExists(assetPath?: string) {
  if (!assetPath) {
    return false;
  }

  const absolutePath = resolve(process.cwd(), "public", assetPath.replace(/^\//, ""));
  try {
    await access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

export default async function RemasterPreviewPage() {
  const preview = await getPreviewIndex();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1b2f49_0%,#0a1420_45%,#05070b_100%)] px-6 py-10 text-[#f2e4c2]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.34em] text-[#b79660]">
              Remaster Pipeline
            </p>
            <h1 className="mt-2 text-4xl font-semibold">Atlas Preview</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
              리마스터 에셋 파이프라인용 샘플 아틀라스 프리뷰입니다. 실제 atlas PNG,
              mockup, atlas json, frame order, manifest snippet을 한 곳에서 바로 확인할 수 있습니다.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/"
              className="rounded-[14px] border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/85 transition hover:bg-white/10"
            >
              홈
            </Link>
            <Link
              href="/game"
              className="rounded-[14px] border border-[#e2bf74]/45 bg-[linear-gradient(180deg,#dfbe73,#9e6e25)] px-4 py-2 text-sm font-semibold text-[#140d04] transition hover:brightness-105"
            >
              게임 열기
            </Link>
          </div>
        </div>

        <div className="mb-6 rounded-[20px] border border-white/8 bg-black/25 px-4 py-3 text-sm text-white/75">
          {preview ? (
            <span>
              생성 시각: <span className="text-[#f5d271]">{preview.generatedAt}</span>
              {" | "}
              유닛 수: <span className="text-[#f5d271]">{preview.units.length}</span>
            </span>
          ) : (
            <span className="text-orange-300">
              `public/game-assets/remaster/examples/index.json`을 찾지 못했습니다.
              `npm run generate:remaster-atlas-sample`을 먼저 실행해야 합니다.
            </span>
          )}
        </div>

        {preview ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {preview.units.map((unit) => {
              const heroImage = unit.atlasPng ?? unit.atlasMockup;

              return (
                <section
                  key={unit.base}
                  className="overflow-hidden rounded-[24px] border border-[#b48a46]/30 bg-[linear-gradient(180deg,rgba(17,21,30,0.96),rgba(6,8,14,0.98))] shadow-[0_24px_44px_rgba(0,0,0,0.38)]"
                >
                  <div className="border-b border-white/8 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.26em] text-[#b79660]">
                      Unit Base
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-[#f2e4c2]">{unit.base}</h2>
                    <p className="mt-1 text-xs text-white/60">{unit.frameCount} frames</p>
                  </div>

                  <div className="bg-black/25 p-3">
                    <a
                      href={heroImage}
                      target="_blank"
                      rel="noreferrer"
                      className="block overflow-hidden rounded-[16px] border border-white/8 bg-black/40 transition hover:border-[#d4b377]/30"
                    >
                      <Image
                        src={heroImage}
                        alt={`${unit.base} atlas preview`}
                        width={512}
                        height={220}
                        unoptimized
                        className="h-[220px] w-full object-cover object-top"
                      />
                    </a>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {unit.atlasPng ? (
                        <a
                          href={unit.atlasPng}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-[12px] border border-[#d4b377]/26 bg-[#d4b377]/10 px-3 py-1.5 text-xs text-[#f6e6bc] transition hover:border-[#d4b377]/50"
                        >
                          Atlas PNG
                        </a>
                      ) : null}
                      {unit.placeholderPng ? (
                        <a
                          href={unit.placeholderPng}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-[12px] border border-white/8 bg-white/4 px-3 py-1.5 text-xs text-[#efdfc0] transition hover:border-[#d4b377]/24"
                        >
                          Placeholder PNG
                        </a>
                      ) : null}
                      <a
                        href={unit.atlasMockup}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-[12px] border border-white/8 bg-white/4 px-3 py-1.5 text-xs text-[#efdfc0] transition hover:border-[#d4b377]/24"
                      >
                        Mockup SVG
                      </a>
                      <a
                        href={unit.atlasJson}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-[12px] border border-white/8 bg-white/4 px-3 py-1.5 text-xs text-[#efdfc0] transition hover:border-[#d4b377]/24"
                      >
                        Atlas JSON
                      </a>
                      <a
                        href={unit.frameOrder}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-[12px] border border-white/8 bg-white/4 px-3 py-1.5 text-xs text-[#efdfc0] transition hover:border-[#d4b377]/24"
                      >
                        Frame Order
                      </a>
                      <a
                        href={unit.manifestSnippet}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-[12px] border border-white/8 bg-white/4 px-3 py-1.5 text-xs text-[#efdfc0] transition hover:border-[#d4b377]/24"
                      >
                        Manifest Snippet
                      </a>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        ) : null}
      </div>
    </main>
  );
}
