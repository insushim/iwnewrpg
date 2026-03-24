import * as Phaser from "phaser";

export type RemasterTextureOverride = {
  key: string;
  src: string;
};

export type RemasterSpritesheetOverride = {
  key: string;
  src: string;
  frameWidth: number;
  frameHeight: number;
  entries: string[];
  margin?: number;
  spacing?: number;
  startFrame?: number;
};

export type RemasterAtlasEntry = {
  key: string;
  frame: string;
};

export type RemasterAtlasOverride = {
  key: string;
  textureSrc: string;
  atlasSrc: string;
  entries: RemasterAtlasEntry[];
};

export type RemasterManifest = {
  version: number;
  textures: RemasterTextureOverride[];
  spritesheets: RemasterSpritesheetOverride[];
  atlases: RemasterAtlasOverride[];
};

const DEFAULT_MANIFEST: RemasterManifest = {
  version: 1,
  textures: [],
  spritesheets: [],
  atlases: [],
};

export async function fetchRemasterManifest(): Promise<RemasterManifest> {
  try {
    const response = await fetch("/game-assets/remaster/manifest.json", {
      cache: "no-store",
    });

    if (!response.ok) {
      return DEFAULT_MANIFEST;
    }

    const parsed = (await response.json()) as Partial<RemasterManifest>;
    return {
      version: typeof parsed.version === "number" ? parsed.version : 1,
      textures: Array.isArray(parsed.textures)
        ? parsed.textures.filter(isValidOverride)
        : [],
      spritesheets: Array.isArray(parsed.spritesheets)
        ? parsed.spritesheets.filter(isValidSpritesheetOverride)
        : [],
      atlases: Array.isArray(parsed.atlases)
        ? parsed.atlases.filter(isValidAtlasOverride)
        : [],
    };
  } catch {
    return DEFAULT_MANIFEST;
  }
}

export function preloadRemasterOverrides(
  scene: Phaser.Scene,
  manifest: RemasterManifest,
) {
  // Override: remove existing procedural textures so external PNGs replace them
  const pending = manifest.textures.filter((entry) => {
    if (scene.textures.exists(entry.key)) {
      scene.textures.remove(entry.key);
    }
    return true;
  });
  const pendingSheets = manifest.spritesheets.filter((sheet) => {
    sheet.entries.forEach((entry) => {
      if (scene.textures.exists(entry)) {
        scene.textures.remove(entry);
      }
    });
    return true;
  });
  const pendingAtlases = manifest.atlases;

  if (pending.length === 0 && pendingSheets.length === 0 && pendingAtlases.length === 0) {
    return Promise.resolve();
  }

  pending.forEach((entry) => {
    scene.load.image(entry.key, entry.src);
  });
  pendingSheets.forEach((sheet) => {
    scene.load.spritesheet(sheet.key, sheet.src, {
      frameWidth: sheet.frameWidth,
      frameHeight: sheet.frameHeight,
      margin: sheet.margin ?? 0,
      spacing: sheet.spacing ?? 0,
    });
  });
  pendingAtlases.forEach((atlas) => {
    scene.load.atlas(atlas.key, atlas.textureSrc, atlas.atlasSrc);
  });

  return new Promise<void>((resolve) => {
    scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
      pendingSheets.forEach((sheet) => materializeSpritesheetEntries(scene, sheet));
      pendingAtlases.forEach((atlas) => materializeAtlasEntries(scene, atlas));
      resolve();
    });
    scene.load.start();
  });
}

function isValidOverride(value: unknown): value is RemasterTextureOverride {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<RemasterTextureOverride>;
  return typeof candidate.key === "string" && typeof candidate.src === "string";
}

function isValidSpritesheetOverride(
  value: unknown,
): value is RemasterSpritesheetOverride {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<RemasterSpritesheetOverride>;
  return (
    typeof candidate.key === "string" &&
    typeof candidate.src === "string" &&
    typeof candidate.frameWidth === "number" &&
    typeof candidate.frameHeight === "number" &&
    Array.isArray(candidate.entries) &&
    candidate.entries.every((entry) => typeof entry === "string")
  );
}

function isValidAtlasOverride(value: unknown): value is RemasterAtlasOverride {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<RemasterAtlasOverride>;
  return (
    typeof candidate.key === "string" &&
    typeof candidate.textureSrc === "string" &&
    typeof candidate.atlasSrc === "string" &&
    Array.isArray(candidate.entries) &&
    candidate.entries.every(isValidAtlasEntry)
  );
}

function isValidAtlasEntry(value: unknown): value is RemasterAtlasEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<RemasterAtlasEntry>;
  return typeof candidate.key === "string" && typeof candidate.frame === "string";
}

function materializeSpritesheetEntries(
  scene: Phaser.Scene,
  sheet: RemasterSpritesheetOverride,
) {
  const texture = scene.textures.get(sheet.key);
  if (!texture || texture.key === "__MISSING") {
    return;
  }
  const sourceImage = texture.getSourceImage();
  if (!sourceImage || (sourceImage as HTMLImageElement).width < 2) {
    return;
  }

  const startFrame = sheet.startFrame ?? 0;
  sheet.entries.forEach((runtimeKey, index) => {
    if (scene.textures.exists(runtimeKey)) {
      scene.textures.remove(runtimeKey);
    }

    const frame = texture.get(startFrame + index);
    if (!frame) {
      return;
    }

    const canvasTexture = scene.textures.createCanvas(
      runtimeKey,
      frame.cutWidth,
      frame.cutHeight,
    );
    if (!canvasTexture) {
      return;
    }

    const ctx = canvasTexture.context;
    ctx.clearRect(0, 0, frame.cutWidth, frame.cutHeight);
    ctx.drawImage(
      sourceImage as CanvasImageSource,
      frame.cutX,
      frame.cutY,
      frame.cutWidth,
      frame.cutHeight,
      0,
      0,
      frame.cutWidth,
      frame.cutHeight,
    );
    canvasTexture.refresh();
  });
}

function materializeAtlasEntries(
  scene: Phaser.Scene,
  atlas: RemasterAtlasOverride,
) {
  const texture = scene.textures.get(atlas.key);
  // Guard: skip if atlas failed to load (Phaser returns __MISSING texture)
  if (!texture || texture.key === "__MISSING") {
    return;
  }
  const sourceImage = texture.getSourceImage();
  if (!sourceImage || (sourceImage as HTMLImageElement).width < 2) {
    return;
  }

  atlas.entries.forEach((entry) => {
    const frame = texture.get(entry.frame);
    // Validate frame exists and isn't just the fallback base frame
    if (!frame || frame.cutWidth < 2 || frame.cutHeight < 2) {
      return;
    }

    // Only remove procedural texture AFTER validating atlas frame exists
    if (scene.textures.exists(entry.key)) {
      scene.textures.remove(entry.key);
    }

    const canvasTexture = scene.textures.createCanvas(
      entry.key,
      frame.cutWidth,
      frame.cutHeight,
    );
    if (!canvasTexture) {
      return;
    }

    const ctx = canvasTexture.context;
    ctx.clearRect(0, 0, frame.cutWidth, frame.cutHeight);
    ctx.drawImage(
      sourceImage as CanvasImageSource,
      frame.cutX,
      frame.cutY,
      frame.cutWidth,
      frame.cutHeight,
      0,
      0,
      frame.cutWidth,
      frame.cutHeight,
    );
    canvasTexture.refresh();
  });
}
