import { GridTopology } from "./GridTopology";

export interface SquareCoord {
  x: number;
  y: number;
}

const SQUARE_DIRECTIONS: SquareCoord[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 }
];

export class SquareTopology implements GridTopology<SquareCoord> {
  public readonly name = "square";
  public readonly cellRadius: number;
  private readonly size: number;

  constructor(size: number) {
    this.size = size;
    this.cellRadius = size;
  }

  keyOf(coord: SquareCoord): string {
    return `${coord.x},${coord.y}`;
  }

  neighbors(coord: SquareCoord): SquareCoord[] {
    return SQUARE_DIRECTIONS.map((dir) => ({ x: coord.x + dir.x, y: coord.y + dir.y }));
  }

  distance(a: SquareCoord, b: SquareCoord): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  heuristic(a: SquareCoord, b: SquareCoord): number {
    return this.distance(a, b);
  }

  toWorld(coord: SquareCoord): { x: number; y: number } {
    return { x: coord.x * this.size, y: coord.y * this.size };
  }

  fromWorld(point: { x: number; y: number }): SquareCoord | null {
    return { x: Math.round(point.x / this.size), y: Math.round(point.y / this.size) };
  }

  axialToOffset(coord: SquareCoord): { col: number; row: number } {
    return { col: coord.x, row: coord.y };
  }
}

export const createSquareTopology = (size: number): SquareTopology => new SquareTopology(size);
