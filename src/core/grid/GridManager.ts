import { aStar } from "../pathfinding/aStar";
import { GridTopology } from "../topology/GridTopology";
import { GridBlueprint, GridCellMetadata, GridCellVariant } from "./GridBlueprint";

interface OccupancyState {
  entityId: string;
  passable: boolean;
}

interface CellProperties {
  variant: GridCellVariant;
  buildable: boolean;
  passable: boolean;
}

const DEFAULT_CELL_PROPERTIES: CellProperties = {
  variant: 'default',
  buildable: true,
  passable: true
};

export class GridManager<Coord> {
  private readonly topology: GridTopology<Coord>;
  private readonly blueprint: GridBlueprint<Coord>;
  private readonly cellMap: Map<string, Coord> = new Map();
  private readonly occupancy: Map<string, OccupancyState> = new Map();
  private readonly baseOccupancy: Map<string, OccupancyState> = new Map();
  private readonly cellProperties: Map<string, CellProperties> = new Map();

  constructor(topology: GridTopology<Coord>, blueprint: GridBlueprint<Coord>) {
    this.topology = topology;
    this.blueprint = blueprint;

    for (const cell of blueprint.cells) {
      this.cellMap.set(this.topology.keyOf(cell), cell);
    }

    this.applyCellVariants(blueprint.cellVariants ?? []);
  }

  get spawn(): Coord {
    return this.blueprint.spawn;
  }

  get goal(): Coord {
    return this.blueprint.goal;
  }

  private applyCellVariants(variants: GridCellMetadata<Coord>[]): void {
    for (const { coord, variant } of variants) {
      this.updateCellVariantInternal(coord, variant);
    }
  }

  private resolveCellProperties(variant: GridCellVariant): CellProperties {
    switch (variant) {
      case 'hole':
      case 'clearable':
        return { variant, buildable: false, passable: false };
      case 'water':
        return { variant, buildable: false, passable: true };
      default:
        return DEFAULT_CELL_PROPERTIES;
    }
  }

  getCellProperties(coord: Coord): CellProperties {
    const key = this.topology.keyOf(coord);
    return this.cellProperties.get(key) ?? DEFAULT_CELL_PROPERTIES;
  }

  getCellVariant(coord: Coord): GridCellVariant {
    return this.getCellProperties(coord).variant;
  }

  setCellVariant(coord: Coord, variant: GridCellVariant): void {
    this.updateCellVariantInternal(coord, variant);
  }

  resetCellVariant(coord: Coord): void {
    this.updateCellVariantInternal(coord, 'default');
  }

  private updateCellVariantInternal(coord: Coord, variant: GridCellVariant): void {
    const key = this.topology.keyOf(coord);
    if (!this.cellMap.has(key)) {
      return;
    }
    if (key === this.topology.keyOf(this.spawn) || key === this.topology.keyOf(this.goal)) {
      return;
    }

    if (variant === 'default') {
      const base = this.baseOccupancy.get(key);
      this.cellProperties.delete(key);
      if (base) {
        const occupant = this.occupancy.get(key);
        if (occupant && occupant.entityId === base.entityId) {
          this.occupancy.delete(key);
        }
        this.baseOccupancy.delete(key);
      }
      return;
    }

    const properties = this.resolveCellProperties(variant);
    this.cellProperties.set(key, properties);

    if (!properties.passable) {
      const state: OccupancyState = { entityId: `__terrain_${variant}__`, passable: false };
      this.baseOccupancy.set(key, state);
      const occupant = this.occupancy.get(key);
      if (!occupant || occupant.entityId.startsWith('__terrain_')) {
        this.occupancy.set(key, state);
      }
    } else {
      const occupant = this.occupancy.get(key);
      if (occupant && occupant.entityId.startsWith('__terrain_')) {
        this.occupancy.delete(key);
      }
      this.baseOccupancy.delete(key);
    }
  }

  isBuildable(coord: Coord): boolean {
    if (!this.isWithinBounds(coord)) {
      return false;
    }
    return this.getCellProperties(coord).buildable;
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
      return;
    }

    const base = this.baseOccupancy.get(key);
    if (base) {
      this.occupancy.set(key, base);
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
    if (!this.isBuildable(coord)) {
      return false;
    }

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