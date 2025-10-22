export const defaultProgression = {
    healthScaling: (round) => 1.25 * (1 + round * 0.24),
    speedScaling: (round) => 0.85 * (1 + round * 0.05),
    rewardScaling: (round) => (2 / 3) * (1.3 + round * 0.11),
    bossHealthMultiplier: (round) => 4 + round * 0.57
};
