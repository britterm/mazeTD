export type EnemyCategory = "grunt" | "runner" | "brute" | "swarm" | "boss";

export interface EnemyDefinition {
  id: string;
  name: string;
  category: EnemyCategory;
  baseHealth: number;
  baseSpeed: number;
  reward: number;
  size: number;
  resistances?: Partial<Record<"fire" | "lightning" | "ice" | "earth" | "physical", number>>;
}

export interface EnemySpawnConfig {
  enemyId: string;
  quantity: number;
  spawnInterval: number; // ms between spawns within the wave chunk
}

export interface WaveDefinition {
  round: number;
  segments: EnemySpawnConfig[];
  boss?: EnemySpawnConfig;
  rewardBonus: number;
}

export interface EnemyInstance<Coord = unknown> {
  id: string;
  enemyId: string;
  coord: Coord;
  coordKey: string;
  pathIndex: number;
  progress: number;
  health: number;
  maxHealth: number;
  speed: number;
  reward: number;
  size: number;
  effects: Array<{
    type: "slow" | "stun";
    magnitude: number;
    expiresAt: number;
  }>;
  alive?: boolean;
}
