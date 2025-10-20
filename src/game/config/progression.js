export const defaultProgression = {
    healthScaling: (round) => 1.25 * (1 + round * 0.15),
    speedScaling: (round) => 0.85 * (1 + Math.min(round * 0.02, 0.25)),
    rewardScaling: (round) => (2 / 3) * (1 + round * 0.08),
    bossHealthMultiplier: (round) => 4 + round * 0.6
};
