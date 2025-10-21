export interface ProgressionConfig {
  healthScaling: (round: number) => number;
  speedScaling: (round: number) => number;
  rewardScaling: (round: number) => number;
  bossHealthMultiplier: (round: number) => number;
}

export const defaultProgression: ProgressionConfig = {
  healthScaling: (round) => 1.25 * (1 + round * 0.18),
  speedScaling: (round) => 0.85 * (1 + Math.min(round * 0.03, 0.25)),
  rewardScaling: (round) => (2 / 3) * (1 + round * 0.10),
  bossHealthMultiplier: (round) => 4 + round * 0.6
};
