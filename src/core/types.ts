export interface WorldPoint {
  x: number;
  y: number;
}

export type EntityId = string;

export type TowerType =
  | "wall"
  | "lightning"
  | "fire"
  | "ice"
  | "earth";

export interface DamageEvent {
  sourceId: EntityId;
  targetId: EntityId;
  amount: number;
  type: "physical" | "fire" | "lightning" | "ice" | "earth";
}

export interface EffectEvent {
  sourceId: EntityId;
  targetId: EntityId;
  slow?: number;
  stunDuration?: number;
  duration: number;
}
