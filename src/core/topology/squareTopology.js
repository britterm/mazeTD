const SQUARE_DIRECTIONS = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 }
];
export class SquareTopology {
    name = "square";
    cellRadius;
    size;
    constructor(size) {
        this.size = size;
        this.cellRadius = size;
    }
    keyOf(coord) {
        return `${coord.x},${coord.y}`;
    }
    neighbors(coord) {
        return SQUARE_DIRECTIONS.map((dir) => ({ x: coord.x + dir.x, y: coord.y + dir.y }));
    }
    distance(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }
    heuristic(a, b) {
        return this.distance(a, b);
    }
    toWorld(coord) {
        return { x: coord.x * this.size, y: coord.y * this.size };
    }
    fromWorld(point) {
        return { x: Math.round(point.x / this.size), y: Math.round(point.y / this.size) };
    }
    axialToOffset(coord) {
        return { col: coord.x, row: coord.y };
    }
}
export const createSquareTopology = (size) => new SquareTopology(size);
