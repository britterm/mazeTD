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
    return {
        spawn,
        goal,
        cells
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
