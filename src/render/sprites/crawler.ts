import crawlerAtlas from "../../../assets/sprites/enemies/crawler/atlas_96.json";
import crawlerSpriteUrl from "../../../assets/sprites/enemies/crawler/spritesheet_96x96_6x6.png";

export type AtlasFrame = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type HexDirectionKey = "n" | "ne" | "se" | "s" | "sw" | "nw";

export interface CrawlerSpriteSheet {
  image: HTMLImageElement | null;
  frames: Record<HexDirectionKey, AtlasFrame[]>;
  frameDuration: number;
  pivot: { x: number; y: number };
  isLoaded: () => boolean;
}

const DIRECTION_ORDER: HexDirectionKey[] = ["n", "ne", "se", "s", "sw", "nw"];
type AtlasMeta = {
  frame_size?: { w?: number; h?: number };
  fps_suggestion?: number;
};

const atlasMeta: AtlasMeta = (crawlerAtlas as { meta?: AtlasMeta })?.meta ?? {};
const frameSize = atlasMeta.frame_size;
const inferredPivot = frameSize && typeof frameSize.w === "number" && typeof frameSize.h === "number"
  ? { x: frameSize.w / 2, y: frameSize.h / 2 }
  : { x: 24, y: 44 };
const defaultFps = typeof atlasMeta.fps_suggestion === "number" && atlasMeta.fps_suggestion > 0
  ? atlasMeta.fps_suggestion
  : 8;

const buildFrames = (): Record<HexDirectionKey, AtlasFrame[]> => {
  const frames: Record<HexDirectionKey, AtlasFrame[]> = {
    n: [],
    ne: [],
    se: [],
    s: [],
    sw: [],
    nw: []
  };

  if (!crawlerAtlas || typeof crawlerAtlas !== "object") {
    return frames;
  }

  const atlasFrames = (crawlerAtlas as { frames?: Record<string, AtlasFrame> }).frames ?? {};

  for (const direction of DIRECTION_ORDER) {
    const prefix = `crawler_move_${direction}_`;
    for (let index = 0; index < 12; index += 1) {
      const key = `${prefix}${index}`;
      const data = atlasFrames[key];
      if (!data) {
        break;
      }
      frames[direction].push({ ...data });
    }
  }

  return frames;
};

export const createCrawlerSpriteSheet = (): CrawlerSpriteSheet | null => {
  if (typeof Image === "undefined") {
    return null;
  }

  const image = new Image();
  image.src = crawlerSpriteUrl;

  const frames = buildFrames();
  const pivot = inferredPivot;
  const frameDuration = 1000 / defaultFps;

  return {
    image,
    frames,
    frameDuration,
    pivot,
    isLoaded: () => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0
  };
};
