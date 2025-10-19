export interface GridBlueprint<Coord> {
  spawn: Coord;
  goal: Coord;
  cells: Coord[];
}
