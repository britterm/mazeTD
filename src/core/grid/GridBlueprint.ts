export type GridCellVariant = 'default' | 'hole' | 'clearable' | 'water';

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
