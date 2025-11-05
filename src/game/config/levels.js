import levelSettingsFile from "../../data/levels.json";
import { createHexBoardBlueprint } from "./board";
const FALLBACK_CONFIG = {
    randomSeed: 1337,
    levelCount: 6,
    wavesPerLevel: 30,
    startingDensity: 0.08,
    endingDensity: 0.28,
    tileProportions: { normal: 0.55, hole: 0.2, clearable: 0.15, water: 0.1 },
    clearCost: 100
};
const rawConfig = levelSettingsFile ?? {};
const mergedConfig = {
    randomSeed: parseNumber(rawConfig.randomSeed, FALLBACK_CONFIG.randomSeed),
    levelCount: clampInt(rawConfig.levelCount, 1, 50, FALLBACK_CONFIG.levelCount),
    wavesPerLevel: clampInt(rawConfig.wavesPerLevel, 1, 60, FALLBACK_CONFIG.wavesPerLevel),
    startingDensity: clamp(rawConfig.startingDensity, 0, 0.9, FALLBACK_CONFIG.startingDensity),
    endingDensity: clamp(rawConfig.endingDensity, 0, 0.9, FALLBACK_CONFIG.endingDensity),
    tileProportions: normalizeProportions(rawConfig.tileProportions ?? FALLBACK_CONFIG.tileProportions),
    clearCost: clampInt(rawConfig.clearCost, 0, 1000, FALLBACK_CONFIG.clearCost)
};
export const staticLevelSettings = {
    clearCost: mergedConfig.clearCost,
    tileWeights: {
        hole: mergedConfig.tileProportions.hole,
        clearable: mergedConfig.tileProportions.clearable ?? mergedConfig.tileProportions.wall,
        water: mergedConfig.tileProportions.water
    },
    levels: buildLevelDefinitions(mergedConfig)
};
export const createLevelBlueprint = (radius, level) => {
    return createHexBoardBlueprint(radius, {
        density: level.density,
        tileWeights: staticLevelSettings.tileWeights,
        seed: level.seed
    });
};
function buildLevelDefinitions(config) {
    const levels = [];
    const { levelCount, wavesPerLevel, startingDensity, endingDensity, randomSeed } = config;
    const start = startingDensity;
    const end = endingDensity;
    for (let index = 0; index < levelCount; index += 1) {
        const t = levelCount <= 1 ? 0 : index / (levelCount - 1);
        const density = clamp(start + (end - start) * t, 0, 0.9, start);
        const seed = scrambleSeed(randomSeed, index);
        const levelNumber = index + 1;
        levels.push({
            id: `level-${levelNumber}`,
            index,
            name: `Level ${levelNumber}`,
            density,
            seed,
            waves: wavesPerLevel
        });
    }
    return levels;
}
function parseNumber(value, fallback) {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}
function clamp(value, min, max, fallback) {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed)) {
        return fallback;
    }
    return Math.min(max, Math.max(min, parsed));
}
function clampInt(value, min, max, fallback) {
    const parsed = Math.round(clamp(value, min, max, fallback));
    return parsed;
}
function normalizeProportions(proportions) {
    const safe = proportions ?? {};
    const normal = Math.max(0, safe.normal ?? 0);
    const hole = Math.max(0, safe.hole ?? 0);
    const clearable = Math.max(0, (safe.clearable ?? safe.wall) ?? 0);
    const water = Math.max(0, safe.water ?? 0);
    const wall = Math.max(0, safe.wall ?? 0);
    const total = normal + hole + clearable + water;
    if (total <= 0) {
        return { normal: 0.55, hole: 0.2, clearable: 0.15, water: 0.1, wall: 0 };
    }
    return {
        normal: normal / total,
        hole: hole / total,
        clearable: clearable / total,
        water: water / total,
        wall: wall / total
    };
}
function scrambleSeed(seed, index) {
    const base = seed >>> 0;
    const salt = (index + 1) * 0x9e3779b1;
    let value = (base ^ salt) >>> 0;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    return value >>> 0;
}
