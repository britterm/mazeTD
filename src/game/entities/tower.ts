import { TowerType } from "../../core/types";

export type TargetingBehavior =
  | "first"
  | "closest"
  | "strongest";

export type AttackMode = "projectile" | "instant" | "aoe";

export interface TowerLevel {
  level: number;
  cost: number;
  range: number;
  damage: number;
  fireRate: number; // shots per second
  projectileSpeed?: number;
  splashRadius?: number;
  slowFactor?: number;
  slowDuration?: number;
  stunDuration?: number;
  instantHit?: boolean;
  effects?: string[];
}

export interface TowerDefinition {
  id: TowerType;
  name: string;
  description: string;
  color: string;
  category: "blocker" | "damage" | "control";
  attackMode: AttackMode;
  targeting: TargetingBehavior;
  baseCooldown: number;
  levels: TowerLevel[];
  passable: boolean;
}

export interface TowerInstance<Coord = unknown> {
  id: string;
  towerType: TowerType;
  coordKey: string;
  coord: Coord;
  level: number;
  cooldownRemaining: number;
  lastShotAt: number;
}
