import { createHexTopology } from "../../core/topology/hexTopology";
import { GridManager } from "../../core/grid/GridManager";
const DEFAULT_ATTEMPTS = 80;
export const createHexBoardBlueprint = (radius, options = {}) => {
    const cells = [];
    for (let q = -radius; q <= radius; q += 1) {
        const r1 = Math.max(-radius, -q - radius);
        const r2 = Math.min(radius, -q + radius);
        for (let r = r1; r <= r2; r += 1) {
            cells.push({ q, r });
        }
    }
    const spawn = { q: -radius, r: 0 };
    const goal = { q: radius, r: 0 };
    const rng = createRng(options.seed ?? Date.now());
    const attempts = Math.max(1, Math.floor(options.attempts ?? DEFAULT_ATTEMPTS));
    const density = clamp(options.density ?? 0, 0, 0.9);
    const weights = normalizeWeights(options.tileWeights);
    const eligibleIndices = collectEligibleIndices(cells, spawn, goal);
    const targetCounts = computeTargetCounts(eligibleIndices.length, density, weights);
    let variants = [];
    if (targetCounts.total > 0) {
        for (let attempt = 0; attempt < attempts; attempt += 1) {
            variants = sampleVariants(cells, eligibleIndices, targetCounts, rng);
            if (validateVariantLayout(cells, spawn, goal, variants)) {
                break;
            }
            variants = [];
        }
    }
    return {
        spawn,
        goal,
        cells,
        cellVariants: variants
    };
};
export const createSquareBoardBlueprint = (width, height) => {
    const cells = [];
    for (let x = 0; x < width; x += 1) {
        for (let y = 0; y < height; y += 1) {
            cells.push({ x, y });
        }
    }
    const spawn = { x: 0, y: Math.floor(height / 2) };
    const goal = { x: width - 1, y: Math.floor(height / 2) };
    return {
        spawn,
        goal,
        cells
    };
};
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const collectEligibleIndices = (cells, spawn, goal) => {
    const indices = [];
    for (let index = 0; index < cells.length; index += 1) {
        const coord = cells[index];
        if (isSameCoord(coord, spawn) || isSameCoord(coord, goal)) {
            continue;
        }
        indices.push(index);
    }
    return indices;
};
const normalizeWeights = (weights) => {
    const safe = weights ?? {};
    const hole = Math.max(0, safe.hole ?? 0);
    const clearable = Math.max(0, (safe.clearable ?? safe.wall) ?? 0);
    const water = Math.max(0, safe.water ?? 0);
    const nonNormalTotal = hole + clearable + water;
    if (nonNormalTotal <= 0) {
        return { hole: 0, clearable: 0, water: 0, total: 0 };
    }
    return {
        hole: hole / nonNormalTotal,
        clearable: clearable / nonNormalTotal,
        water: water / nonNormalTotal,
        total: 1
    };
};
const computeTargetCounts = (eligible, density, weights) => {
    const total = Math.min(eligible, Math.max(0, Math.round(eligible * density)));
    if (total === 0 || weights.total === 0) {
        return { hole: 0, clearable: 0, water: 0, total: 0 };
    }
    const provisional = [
        { key: 'hole', raw: total * weights.hole },
        { key: 'clearable', raw: total * weights.clearable },
        { key: 'water', raw: total * weights.water }
    ];
    const allocation = provisional.map((entry) => ({
        key: entry.key,
        value: Math.floor(entry.raw),
        remainder: entry.raw - Math.floor(entry.raw)
    }));
    let assigned = allocation.reduce((sum, item) => sum + item.value, 0);
    const deficit = total - assigned;
    if (deficit > 0) {
        allocation
            .sort((a, b) => b.remainder - a.remainder)
            .slice(0, deficit)
            .forEach((item) => {
            item.value += 1;
        });
        assigned = allocation.reduce((sum, item) => sum + item.value, 0);
    }
    if (assigned > total) {
        allocation
            .sort((a, b) => a.remainder - b.remainder)
            .slice(0, assigned - total)
            .forEach((item) => {
            item.value = Math.max(0, item.value - 1);
        });
    }
    const result = {
        hole: allocation.find((item) => item.key === 'hole')?.value ?? 0,
        clearable: allocation.find((item) => item.key === 'clearable')?.value ?? 0,
        water: allocation.find((item) => item.key === 'water')?.value ?? 0,
        total
    };
    return result;
};
const sampleVariants = (cells, eligibleIndices, counts, rng) => {
    if (counts.total === 0) {
        return [];
    }
    const pool = [...eligibleIndices];
    const variants = [];
    const draw = (count, variant) => {
        for (let i = 0; i < count && pool.length > 0; i += 1) {
            const index = Math.floor(rng() * pool.length);
            const cellIndex = pool.splice(index, 1)[0];
            variants.push({ coord: cells[cellIndex], variant });
        }
    };
    draw(counts.hole, 'hole');
    draw(counts.clearable, 'clearable');
    draw(counts.water, 'water');
    return variants;
};
const validateVariantLayout = (cells, spawn, goal, variants) => {
    if (variants.length === 0) {
        return true;
    }
    try {
        const topology = createHexTopology(1);
        const grid = new GridManager(topology, { spawn, goal, cells, cellVariants: variants });
        const path = grid.findPath();
        return Array.isArray(path) && path.length > 0;
    }
    catch (error) {
        console.warn('[MazeTD] Failed to validate board variants', error);
        return false;
    }
};
const isSameCoord = (a, b) => a.q === b.q && a.r === b.r;
const createRng = (seed) => {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};
