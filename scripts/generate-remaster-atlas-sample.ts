import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  REMASTER_FRAME_SIZE,
  REMASTER_UNIT_PACKS,
  getRemasterFrameDefinitions,
} from "../src/game/render/remasterTextureCatalog";

const COLUMNS = 4;

async function main() {
  const allFrames = getRemasterFrameDefinitions();
  const examplesRoot = resolve(process.cwd(), "public/game-assets/remaster/examples");
  await mkdir(examplesRoot, { recursive: true });

  const bases = REMASTER_UNIT_PACKS.map((pack) => pack.base);
  const generated = await Promise.all(
    bases.map((base) => generateAtlasSampleForBase(examplesRoot, base, allFrames)),
  );

  const indexPath = resolve(examplesRoot, "index.json");
  await writeFile(
    indexPath,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), units: generated }, null, 2)}\n`,
    "utf8",
  );

  console.log(`Generated ${generated.length} atlas samples at ${examplesRoot}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function generateAtlasSampleForBase(
  examplesRoot: string,
  base: string,
  allFrames: ReturnType<typeof getRemasterFrameDefinitions>,
) {
  const frames = allFrames.filter((definition) => definition.base === base);
  const sampleDir = resolve(examplesRoot, base);
  await mkdir(sampleDir, { recursive: true });

  const atlasJsonPath = resolve(sampleDir, "atlas.sample.json");
  const frameOrderPath = resolve(sampleDir, "frame-order.txt");
  const manifestSnippetPath = resolve(sampleDir, "manifest.atlas.sample.json");
  const mockupSvgPath = resolve(sampleDir, "atlas.mock.svg");

  const atlasPayload = {
    frames: Object.fromEntries(
      frames.map((frame, index) => {
        const x = (index % COLUMNS) * REMASTER_FRAME_SIZE;
        const y = Math.floor(index / COLUMNS) * REMASTER_FRAME_SIZE;
        return [
          frame.key,
          {
            frame: {
              x,
              y,
              w: REMASTER_FRAME_SIZE,
              h: REMASTER_FRAME_SIZE,
            },
            rotated: false,
            trimmed: false,
            spriteSourceSize: {
              x: 0,
              y: 0,
              w: REMASTER_FRAME_SIZE,
              h: REMASTER_FRAME_SIZE,
            },
            sourceSize: {
              w: REMASTER_FRAME_SIZE,
              h: REMASTER_FRAME_SIZE,
            },
          },
        ];
      }),
    ),
    meta: {
      app: "iwnewrpg atlas sample generator",
      version: "1.0",
      image: "atlas.png",
      format: "RGBA8888",
      size: {
        w: COLUMNS * REMASTER_FRAME_SIZE,
        h: Math.ceil(frames.length / COLUMNS) * REMASTER_FRAME_SIZE,
      },
      scale: "1",
    },
  };

  const manifestSnippet = {
    version: 1,
    textures: [],
    spritesheets: [],
    atlases: [
      {
        key: `${base}_atlas`,
        textureSrc: `/game-assets/remaster/examples/${base}/atlas.png`,
        atlasSrc: `/game-assets/remaster/examples/${base}/atlas.sample.json`,
        entries: frames.map((frame) => ({
          key: frame.key,
          frame: frame.key,
        })),
      },
    ],
  };

  const frameOrder = [
    `# ${base} atlas frame order`,
    `# frame size: ${REMASTER_FRAME_SIZE}x${REMASTER_FRAME_SIZE}`,
    `# columns: ${COLUMNS}`,
    ...frames.map((frame, index) => `${String(index).padStart(3, "0")} ${frame.key}`),
  ].join("\n");

  const mockupSvg = buildAtlasMockupSvg(base, frames);

  await Promise.all([
    writeFile(atlasJsonPath, `${JSON.stringify(atlasPayload, null, 2)}\n`, "utf8"),
    writeFile(frameOrderPath, `${frameOrder}\n`, "utf8"),
    writeFile(mockupSvgPath, mockupSvg, "utf8"),
    writeFile(
      manifestSnippetPath,
      `${JSON.stringify(manifestSnippet, null, 2)}\n`,
      "utf8",
    ),
  ]);

  return {
    base,
    frameCount: frames.length,
    atlasJson: `/game-assets/remaster/examples/${base}/atlas.sample.json`,
    atlasMockup: `/game-assets/remaster/examples/${base}/atlas.mock.svg`,
    atlasPng: `/game-assets/remaster/examples/${base}/atlas.png`,
    placeholderPng: `/game-assets/remaster/examples/${base}/atlas.placeholder.png`,
    frameOrder: `/game-assets/remaster/examples/${base}/frame-order.txt`,
    manifestSnippet: `/game-assets/remaster/examples/${base}/manifest.atlas.sample.json`,
  };
}

function buildAtlasMockupSvg(
  base: string,
  frames: ReturnType<typeof getRemasterFrameDefinitions>,
) {
  const width = COLUMNS * REMASTER_FRAME_SIZE;
  const rows = Math.ceil(frames.length / COLUMNS);
  const height = rows * REMASTER_FRAME_SIZE;

  const cells = frames
    .map((frame, index) => {
      const x = (index % COLUMNS) * REMASTER_FRAME_SIZE;
      const y = Math.floor(index / COLUMNS) * REMASTER_FRAME_SIZE;
      const accent = frame.state === "idle" ? "#7aa2ff" : frame.state === "walk" ? "#72d796" : "#f2c46b";
      const label = `${frame.state.toUpperCase()} ${frame.direction.toUpperCase()} ${frame.frame}`;
      return `
  <g transform="translate(${x}, ${y})">
    <rect x="0" y="0" width="${REMASTER_FRAME_SIZE}" height="${REMASTER_FRAME_SIZE}" fill="#0f1420" stroke="rgba(255,255,255,0.1)" />
    <rect x="8" y="8" width="${REMASTER_FRAME_SIZE - 16}" height="${REMASTER_FRAME_SIZE - 16}" rx="10" fill="rgba(255,255,255,0.02)" stroke="${accent}" stroke-opacity="0.28" />
    <line x1="${REMASTER_FRAME_SIZE / 2}" y1="18" x2="${REMASTER_FRAME_SIZE / 2}" y2="${REMASTER_FRAME_SIZE - 18}" stroke="rgba(255,255,255,0.08)" />
    <line x1="18" y1="${REMASTER_FRAME_SIZE / 2}" x2="${REMASTER_FRAME_SIZE - 18}" y2="${REMASTER_FRAME_SIZE / 2}" stroke="rgba(255,255,255,0.08)" />
    <ellipse cx="${REMASTER_FRAME_SIZE / 2}" cy="${REMASTER_FRAME_SIZE - 24}" rx="22" ry="7" fill="rgba(0,0,0,0.24)" />
    <circle cx="${REMASTER_FRAME_SIZE / 2}" cy="40" r="11" fill="${accent}" fill-opacity="0.28" />
    <rect x="${REMASTER_FRAME_SIZE / 2 - 14}" y="54" width="28" height="30" rx="10" fill="${accent}" fill-opacity="0.18" />
    <text x="10" y="18" font-size="10" fill="#d2b47c" font-family="monospace">${String(index).padStart(3, "0")}</text>
    <text x="10" y="${REMASTER_FRAME_SIZE - 18}" font-size="10" fill="#f2e6c8" font-family="monospace">${escapeXml(label)}</text>
  </g>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height + 52}" viewBox="0 0 ${width} ${height + 52}">
  <rect width="${width}" height="${height + 52}" fill="#06080e" />
  <rect x="0" y="0" width="${width}" height="52" fill="#0d1320" />
  <text x="18" y="22" font-size="16" font-weight="700" fill="#f2e6c8" font-family="monospace">${escapeXml(base)} atlas mockup</text>
  <text x="18" y="40" font-size="11" fill="#b79b69" font-family="monospace">Frame size ${REMASTER_FRAME_SIZE}x${REMASTER_FRAME_SIZE} | ${frames.length} frames | ${COLUMNS} columns</text>
  <g transform="translate(0, 52)">
${cells}
  </g>
</svg>
`;
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
