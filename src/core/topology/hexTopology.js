const HEX_DIRECTIONS = [
    { q: 1, r: 0 },
    { q: 1, r: -1 },
    { q: 0, r: -1 },
    { q: -1, r: 0 },
    { q: -1, r: 1 },
    { q: 0, r: 1 }
];
export class HexTopology {
    name = "hex";
    cellRadius;
    size;
    constructor(size) {
        this.cellRadius = size;
        this.size = size;
    }
    keyOf(coord) {
        return `${coord.q},${coord.r}`;
    }
    neighbors(coord) {
        return HEX_DIRECTIONS.map((dir) => ({ q: coord.q + dir.q, r: coord.r + dir.r }));
    }
    distance(a, b) {
        const s1 = -a.q - a.r;
        const s2 = -b.q - b.r;
        return Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs(s1 - s2));
    }
    heuristic(a, b) {
        return this.distance(a, b);
    }
    toWorld(coord) {
        const x = this.size * (3 / 2) * coord.q;
        const y = this.size * (Math.sqrt(3) / 2 * coord.q + Math.sqrt(3) * coord.r);
        return { x, y };
    }
    fromWorld(point) {
        const q = ((2 / 3) * point.x) / this.size;
        const r = ((-1 / 3) * point.x + (Math.sqrt(3) / 3) * point.y) / this.size;
        return this.roundAxial({ q, r });
    }
    axialToOffset(coord) {
        const col = coord.q + (coord.r - (coord.r & 1)) / 2;
        const row = coord.r;
        return { col, row };
    }
    roundAxial(coord) {
        const s = -coord.q - coord.r;
        let rq = Math.round(coord.q);
        let rr = Math.round(coord.r);
        let rs = Math.round(s);
        const qDiff = Math.abs(rq - coord.q);
        const rDiff = Math.abs(rr - coord.r);
        const sDiff = Math.abs(rs - s);
        if (qDiff > rDiff && qDiff > sDiff) {
            rq = -rr - rs;
        }
        else if (rDiff > sDiff) {
            rr = -rq - rs;
        }
        else {
            rs = -rq - rr;
        }
        return { q: rq, r: rr };
    }
}
export const createHexTopology = (size) => new HexTopology(size);
