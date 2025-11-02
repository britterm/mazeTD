import { createHexTopology } from "../../core/topology/hexTopology";
import { GridManager } from "../../core/grid/GridManager";
export const createHexBoardBlueprint = (radius) => {
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
    const cellVariants = generateRandomVariants(cells, spawn, goal);
    return {
        spawn,
        goal,
        cells,
        cellVariants
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
const HOLE_RATIO = 0.05;
const RAISED_RATIO = 0.05;
const NO_BUILD_RATIO = 0.05;
const ATTEMPTS_PER_CONFIG = 30;
const generateRandomVariants = (cells, spawn, goal) => {
    if (cells.length === 0) {
        return [];
    }
    const eligibleIndices = cells
        .map((_, index) => index)
        .filter((index) => {
        const coord = cells[index];
        return !isSameCoord(coord, spawn) && !isSameCoord(coord, goal);
    });
    if (eligibleIndices.length === 0) {
        return [];
    }
    const total = cells.length;
    const holeTarget = Math.max(1, Math.floor(total * HOLE_RATIO));
    const raisedTarget = Math.max(1, Math.floor(total * RAISED_RATIO));
    const pathTarget = Math.max(1, Math.floor(total * NO_BUILD_RATIO));
    const initialHole = Math.min(holeTarget, eligibleIndices.length);
    const remainingAfterHole = Math.max(0, eligibleIndices.length - initialHole);
    const initialRaised = Math.min(raisedTarget, remainingAfterHole);
    const remainingAfterRaised = Math.max(0, remainingAfterHole - initialRaised);
    const initialPath = Math.min(pathTarget, remainingAfterRaised);
    for (let holeCount = initialHole; holeCount >= 0; holeCount -= 1) {
        for (let raisedCount = initialRaised; raisedCount >= 0; raisedCount -= 1) {
            for (let pathCount = initialPath; pathCount >= 0; pathCount -= 1) {
                const variants = tryGenerateVariants(cells, eligibleIndices, holeCount, raisedCount, pathCount);
                if (!variants) {
                    continue;
                }
                if (validateVariantLayout(cells, spawn, goal, variants)) {
                    return variants;
                }
            }
        }
    }
    return [];
};
const tryGenerateVariants = (cells, eligibleIndices, holeCount, raisedCount, pathCount) => {
    if (eligibleIndices.length === 0) {
        return null;
    }
    for (let attempt = 0; attempt < ATTEMPTS_PER_CONFIG; attempt += 1) {
        const pool = [...eligibleIndices];
        const holeIndices = drawFromPool(pool, holeCount);
        const raisedIndices = drawFromPool(pool, raisedCount);
        const pathIndices = drawFromPool(pool, pathCount);
        if (holeIndices.length < holeCount || raisedIndices.length < raisedCount || pathIndices.length < pathCount) {
            continue;
        }
        const variants = [];
        variants.push(...holeIndices.map((index) => ({ coord: cells[index], variant: 'hole' })));
        variants.push(...raisedIndices.map((index) => ({ coord: cells[index], variant: 'raised-block' })));
        variants.push(...pathIndices.map((index) => ({ coord: cells[index], variant: 'no-build-path' })));
        if (hasDuplicateCoords(variants)) {
            continue;
        }
        return variants;
    }
    return null;
};
const hasDuplicateCoords = (variants) => {
    const seen = new Set();
    for (const entry of variants) {
        const key = `${entry.coord.q},${entry.coord.r}`;
        if (seen.has(key)) {
            return true;
        }
        seen.add(key);
    }
    return false;
};
const drawFromPool = (pool, count) => {
    const result = [];
    for (let i = 0; i < count && pool.length > 0; i += 1) {
        const index = Math.floor(Math.random() * pool.length);
        result.push(pool.splice(index, 1)[0]);
    }
    return result;
};
const validateVariantLayout = (cells, spawn, goal, variants) => {
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
