export type GridCellVariant = 'default' | 'hole' | 'raised-block' | 'no-build-path';

export interface GridCellMetadata<Coord> {
  coord: Coord;
  variant: GridCellVariant;
}

export interface GridBlueprint<Coord> {
  spawn: Coord;
  goal: Coord;
  cells: Coord[];
  cellVariants?: GridCellMetadata<Coord>[];
}
