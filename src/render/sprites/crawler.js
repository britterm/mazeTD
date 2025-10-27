import crawlerAtlas from "../../../assets/sprites/enemies/crawler/atlas_96.json";
import crawlerSpriteUrl from "../../../assets/sprites/enemies/crawler/spritesheet_96x96_6x6.png";
const DIRECTION_ORDER = ["n", "ne", "se", "s", "sw", "nw"];
const atlasMeta = crawlerAtlas?.meta ?? {};
const frameSize = atlasMeta.frame_size;
const inferredPivot = frameSize && typeof frameSize.w === "number" && typeof frameSize.h === "number"
    ? { x: frameSize.w / 2, y: frameSize.h / 2 }
    : { x: 24, y: 44 };
const defaultFps = typeof atlasMeta.fps_suggestion === "number" && atlasMeta.fps_suggestion > 0
    ? atlasMeta.fps_suggestion
    : 8;
const buildFrames = () => {
    const frames = {
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
    const atlasFrames = crawlerAtlas.frames ?? {};
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
export const createCrawlerSpriteSheet = () => {
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
