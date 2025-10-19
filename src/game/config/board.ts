import { GridBlueprint } from "../../core/grid/GridBlueprint";
import { HexCoord } from "../../core/topology/hexTopology";
import { SquareCoord } from "../../core/topology/squareTopology";

export const createHexBoardBlueprint = (radius: number): GridBlueprint<HexCoord> => {
  const cells: HexCoord[] = [];
  for (let q = -radius; q <= radius; q += 1) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r += 1) {
      cells.push({ q, r });
    }
  }

  const spawn: HexCoord = { q: -radius, r: 0 };
  const goal: HexCoord = { q: radius, r: 0 };

  return {
    spawn,
    goal,
    cells
  };
};

export const createSquareBoardBlueprint = (
  width: number,
  height: number
): GridBlueprint<SquareCoord> => {
  const cells: SquareCoord[] = [];
  for (let x = 0; x < width; x += 1) {
    for (let y = 0; y < height; y += 1) {
      cells.push({ x, y });
    }
  }

  const spawn: SquareCoord = { x: 0, y: Math.floor(height / 2) };
  const goal: SquareCoord = { x: width - 1, y: Math.floor(height / 2) };

  return {
    spawn,
    goal,
    cells
  };
};
