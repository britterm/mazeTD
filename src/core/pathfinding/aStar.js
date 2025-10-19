export function aStar(options) {
    const { topology, start, goal, isBlocked, maxIterations = 5000 } = options;
    const startKey = topology.keyOf(start);
    const goalKey = topology.keyOf(goal);
    const openSet = new Set([startKey]);
    const cameFrom = new Map();
    const gScore = new Map([[startKey, 0]]);
    const fScore = new Map([[startKey, topology.heuristic(start, goal)]]);
    const coordCache = new Map([
        [startKey, start],
        [goalKey, goal]
    ]);
    let iterations = 0;
    while (openSet.size > 0 && iterations++ < maxIterations) {
        let currentKey = null;
        let lowestF = Number.POSITIVE_INFINITY;
        for (const key of openSet) {
            const score = fScore.get(key) ?? Number.POSITIVE_INFINITY;
            if (score < lowestF) {
                lowestF = score;
                currentKey = key;
            }
        }
        if (!currentKey) {
            break;
        }
        if (currentKey === goalKey) {
            return reconstructPath(currentKey, cameFrom, coordCache);
        }
        openSet.delete(currentKey);
        const currentCoord = coordCache.get(currentKey);
        for (const neighbor of topology.neighbors(currentCoord)) {
            const neighborKey = topology.keyOf(neighbor);
            coordCache.set(neighborKey, neighbor);
            if (isBlocked(neighbor) && neighborKey !== goalKey) {
                continue;
            }
            const tentativeG = (gScore.get(currentKey) ?? Number.POSITIVE_INFINITY) + 1;
            if (tentativeG < (gScore.get(neighborKey) ?? Number.POSITIVE_INFINITY)) {
                cameFrom.set(neighborKey, currentKey);
                gScore.set(neighborKey, tentativeG);
                fScore.set(neighborKey, tentativeG + topology.heuristic(neighbor, goal));
                openSet.add(neighborKey);
            }
        }
    }
    return null;
}
function reconstructPath(currentKey, cameFrom, coordCache) {
    const path = [];
    let key = currentKey;
    while (key) {
        const coord = coordCache.get(key);
        if (coord) {
            path.push(coord);
        }
        key = cameFrom.get(key);
    }
    return path.reverse();
}
