import { EnemyDefinition, WaveDefinition } from "../entities/enemy";

export const enemyDefinitions: EnemyDefinition[] = [
  {
    id: "crawler",
    name: "Crawler",
    category: "grunt",
    baseHealth: 50,
    baseSpeed: 0.9,
    damage: 1,
    reward: 3,
    size: 1
  },
  {
    id: "runner",
    name: "Runner",
    category: "runner",
    baseHealth: 30,
    baseSpeed: 1.9,
    damage: 2,
    reward: 4,
    size: 1
  },
  {
    id: "brute",
    name: "Brute",
    category: "brute",
    baseHealth: 145,
    baseSpeed: 0.53,
    damage: 4,
    reward: 12,
    size: 1.2,
    resistances: { physical: 0.15 }
  },
  {
    id: "swarm",
    name: "Skitter",
    category: "swarm",
    baseHealth: 23,
    baseSpeed: 1.2,
    damage: 1,
    reward: 2,
    size: 0.8
  },
  {
    id: "colossus",
    name: "Colossus",
    category: "boss",
    baseHealth: 1000,
    baseSpeed: 0.5,
    damage: 10,
    reward: 65,
    size: 1.6,
    resistances: { fire: 0.2, lightning: 0.1 }
  }
];

export const enemyDefinitionMap = new Map(enemyDefinitions.map((def) => [def.id, def]));

export const waveSchedule: WaveDefinition[] = Array.from({ length: 30 }, (_, i) => {
  const round = i + 1;
  const baseMultiplier = 1 + round * 0.12;
  const rewardBonus = Math.round(12 + round * 1.5);

  const segments = [
    {
      enemyId: round % 3 === 0 ? "swarm" : "crawler",
      quantity: 6 + Math.floor(round * 0.6),
      spawnInterval: 900 - round * 15
    }
  ];

  if (round > 4) {
    segments.push({
      enemyId: round % 2 === 0 ? "runner" : "brute",
      quantity: 2 + Math.floor(round * 0.4),
      spawnInterval: 1100 - round * 18
    });
  }

  if (round % 5 === 0) {
    segments.push({
      enemyId: "swarm",
      quantity: 10 + Math.floor(round * 0.7),
      spawnInterval: 650 - round * 10
    });
  }

  const wave: WaveDefinition = {
    round,
    segments,
    rewardBonus,
    boss: round % 10 === 0
      ? {
          enemyId: "colossus",
          quantity: 1,
          spawnInterval: 0
        }
      : undefined
  };

  return wave;
});
