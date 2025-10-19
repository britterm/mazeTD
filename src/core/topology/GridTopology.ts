export interface GridTopology<Coord> {
  readonly name: string;
  readonly cellRadius: number;
  keyOf(coord: Coord): string;
  neighbors(coord: Coord): Coord[];
  distance(a: Coord, b: Coord): number;
  heuristic(a: Coord, b: Coord): number;
  toWorld(coord: Coord): { x: number; y: number };
  fromWorld(point: { x: number; y: number }): Coord | null;
  axialToOffset(coord: Coord): { col: number; row: number };
}
