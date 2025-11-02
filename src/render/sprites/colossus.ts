import type { AtlasFrame, CrawlerSpriteSheet, HexDirectionKey } from './crawler';
import colossusSpriteUrl from '../../../assets/sprites/enemies/colossus/spritesheet_96x96_6x6.png';

export type ColossusSpriteSheet = CrawlerSpriteSheet;

const FRAME_SIZE = 96;
const FRAMES_PER_ROW = 6;
const DIRECTION_ORDER: HexDirectionKey[] = ['n', 'ne', 'se', 's', 'sw', 'nw'];
const PIVOT = { x: FRAME_SIZE / 2, y: FRAME_SIZE / 2 };
const DEFAULT_FPS = 6;

const buildFrames = (): Record<HexDirectionKey, AtlasFrame[]> => {
  const frames: Record<HexDirectionKey, AtlasFrame[]> = {
    n: [],
    ne: [],
    se: [],
    s: [],
    sw: [],
    nw: []
  };

  for (let row = 0; row < DIRECTION_ORDER.length; row += 1) {
    const direction = DIRECTION_ORDER[row];
    for (let column = 0; column < FRAMES_PER_ROW; column += 1) {
      frames[direction].push({
        x: column * FRAME_SIZE,
        y: row * FRAME_SIZE,
        w: FRAME_SIZE,
        h: FRAME_SIZE
      });
    }
  }

  return frames;
};

export const createColossusSpriteSheet = (): ColossusSpriteSheet | null => {
  if (typeof Image === 'undefined') {
    return null;
  }

  const image = new Image();
  image.src = colossusSpriteUrl;

  const frames = buildFrames();
  const frameDuration = 1000 / DEFAULT_FPS;

  return {
    image,
    frames,
    frameDuration,
    pivot: PIVOT,
    isLoaded: () => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0
  };
};