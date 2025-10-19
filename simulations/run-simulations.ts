import { enemyDefinitionMap, waveSchedule } from "../src/game/config/enemies";
import { towerDefinitions } from "../src/game/config/towers";
import { defaultProgression } from "../src/game/config/progression";

interface TowerMixItem {
  id: string;
  count: number;
  level: number;
}

const defaultMix: TowerMixItem[] = [
  { id: "lightning", count: 2, level: 1 },
  { id: "fire", count: 2, level: 1 },
  { id: "ice", count: 1, level: 1 },
  { id: "earth", count: 1, level: 1 }
];

const roundsToPreview = [1, 3, 5, 8, 10, 12];

for (const round of roundsToPreview) {
  const wave = waveSchedule.find((w) => w.round === round);
  if (!wave) continue;

  const healthScale = defaultProgression.healthScaling(round);
  const rewardScale = defaultProgression.rewardScaling(round);
  const speedScale = defaultProgression.speedScaling(round);

  let totalHealth = 0;
  let totalReward = 0;
  for (const segment of wave.segments) {
    const def = enemyDefinitionMap.get(segment.enemyId);
    if (!def) continue;
    totalHealth += def.baseHealth * healthScale * segment.quantity;
    totalReward += def.reward * rewardScale * segment.quantity;
  }
  if (wave.boss) {
    const bossDef = enemyDefinitionMap.get(wave.boss.enemyId);
    if (bossDef) {
      totalHealth += bossDef.baseHealth * healthScale * defaultProgression.bossHealthMultiplier(round);
      totalReward += bossDef.reward * rewardScale * wave.boss.quantity;
    }
  }

  const dps = estimateDps(defaultMix);
  const timeToKill = totalHealth / dps;

  console.log(`Round ${round}`);
  console.log(`  Wave health estimate: ${totalHealth.toFixed(0)} hp`);
  console.log(`  Approx tower DPS: ${dps.toFixed(1)} dmg/s`);
  console.log(`  Time to clear (if single lane): ${timeToKill.toFixed(1)} s`);
  console.log(`  Wave reward: ${totalReward.toFixed(0)} cr (speed scale ${speedScale.toFixed(2)})`);
  console.log("---");
}

function estimateDps(mix: TowerMixItem[]): number {
  let total = 0;
  for (const item of mix) {
    const def = towerDefinitions.find((tower) => tower.id === item.id);
    if (!def) continue;
    const level = def.levels.find((lvl) => lvl.level === item.level);
    if (!level) continue;
    total += level.damage * level.fireRate * item.count;
  }
  return total;
}
