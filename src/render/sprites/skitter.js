import skitterSpriteUrl from "../../../assets/sprites/enemies/skitter/spritesheet_96x96_6x6.png";
const FRAME_SIZE = 96;
const FRAMES_PER_ROW = 6;
const DIRECTION_ORDER = ["n", "ne", "se", "s", "sw", "nw"];
const PIVOT = { x: FRAME_SIZE / 2, y: FRAME_SIZE / 2 };
const DEFAULT_FPS = 10;
const buildFrames = () => {
    const frames = {
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
export const createSkitterSpriteSheet = () => {
    if (typeof Image === "undefined") {
        return null;
    }
    const image = new Image();
    image.src = skitterSpriteUrl;
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
