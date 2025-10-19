import { aStar } from "../pathfinding/aStar";
import { GridTopology } from "../topology/GridTopology";
import { GridBlueprint } from "./GridBlueprint";

interface OccupancyState {
  entityId: string;
  passable: boolean;
}

export class GridManager<Coord> {
  private readonly topology: GridTopology<Coord>;
  private readonly blueprint: GridBlueprint<Coord>;
  private readonly cellMap: Map<string, Coord> = new Map();
  private readonly occupancy: Map<string, OccupancyState> = new Map();

  constructor(topology: GridTopology<Coord>, blueprint: GridBlueprint<Coord>) {
    this.topology = topology;
    this.blueprint = blueprint;

    for (const cell of blueprint.cells) {
      this.cellMap.set(this.topology.keyOf(cell), cell);
    }
  }

  get spawn(): Coord {
    return this.blueprint.spawn;
  }

  get goal(): Coord {
    return this.blueprint.goal;
  }

  getAllCells(): Coord[] {
    return Array.from(this.cellMap.values());
  }

  isWithinBounds(coord: Coord): boolean {
    return this.cellMap.has(this.topology.keyOf(coord));
  }

  isBlocked(coord: Coord): boolean {
    const key = this.topology.keyOf(coord);
    const occupant = this.occupancy.get(key);
    return Boolean(occupant && !occupant.passable);
  }

  getOccupant(coord: Coord): OccupancyState | undefined {
    return this.occupancy.get(this.topology.keyOf(coord));
  }

  setOccupant(coord: Coord, state: OccupancyState | undefined): void {
    const key = this.topology.keyOf(coord);
    if (state) {
      this.occupancy.set(key, state);
    } else {
      this.occupancy.delete(key);
    }
  }

  canPlace(coord: Coord, passable: boolean): boolean {
    if (!this.isWithinBounds(coord)) {
      return false;
    }
    const key = this.topology.keyOf(coord);
    if (key === this.topology.keyOf(this.spawn) || key === this.topology.keyOf(this.goal)) {
      return false;
    }

    const existing = this.occupancy.get(key);
    if (existing && !existing.passable) {
      return false;
    }

    if (!passable && existing?.passable === true) {
      return this.pathExistsAfterPlacement(coord, passable);
    }

    if (!passable) {
      return this.pathExistsAfterPlacement(coord, passable);
    }

    return true;
  }

  private pathExistsAfterPlacement(coord: Coord, passable: boolean): boolean {
    const key = this.topology.keyOf(coord);
    const previous = this.occupancy.get(key);
    this.occupancy.set(key, { entityId: "__temp__", passable });

    const path = this.findPath();

    if (previous) {
      this.occupancy.set(key, previous);
    } else {
      this.occupancy.delete(key);
    }

    return Boolean(path);
  }

  findPath(): Coord[] | null {
    return aStar({
      topology: this.topology,
      start: this.spawn,
      goal: this.goal,
      isBlocked: (coord) => !this.isWithinBounds(coord) || this.isBlocked(coord)
    });
  }

  toWorld(coord: Coord): { x: number; y: number } {
    return this.topology.toWorld(coord);
  }

  fromWorld(point: { x: number; y: number }): Coord | null {
    const candidate = this.topology.fromWorld(point);
    if (candidate && this.isWithinBounds(candidate)) {
      return candidate;
    }
    return null;
  }
}
