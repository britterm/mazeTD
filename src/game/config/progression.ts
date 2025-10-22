export interface ProgressionConfig {
  healthScaling: (round: number) => number;
  speedScaling: (round: number) => number;
  rewardScaling: (round: number) => number;
  bossHealthMultiplier: (round: number) => number;
}

export const defaultProgression: ProgressionConfig = {
  healthScaling: (round) => 1.25 * (1 + round * 0.24),
  speedScaling: (round) => 0.85 * (1 + round * 0.05),
  rewardScaling: (round) => (2 / 3) * (1.3 + round * 0.11),
  bossHealthMultiplier: (round) => 4 + round * 0.57
};
