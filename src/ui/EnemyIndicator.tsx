import { useMemo } from "react";
import { useGame } from "../game/GameProvider";
import { enemyDefinitionMap } from "../game/config/enemies";
import "./EnemyIndicator.css";

type ActiveGroup = {
  id: string;
  name: string;
  count: number;
  avgHealth: number;
  maxHealth: number;
};

type UpcomingGroup = {
  id: string;
  name: string;
  quantity: number;
};

const formatNumber = (value: number, fractionDigits = 1) => {
  const rounded = Math.round(value * Math.pow(10, fractionDigits)) / Math.pow(10, fractionDigits);
  return fractionDigits === 0 ? String(rounded) : rounded.toFixed(fractionDigits);
};

export const EnemyIndicator = () => {
  const { snapshot } = useGame();

  const activeGroups = useMemo<ActiveGroup[]>(() => {
    const groups = new Map<string, { count: number; healthTotal: number; maxHealthTotal: number }>();
    for (const enemy of snapshot.enemies) {
      const group = groups.get(enemy.enemyId) ?? { count: 0, healthTotal: 0, maxHealthTotal: 0 };
      group.count += 1;
      group.healthTotal += enemy.health;
      group.maxHealthTotal += enemy.maxHealth;
      groups.set(enemy.enemyId, group);
    }
    return Array.from(groups.entries()).map(([enemyId, group]) => {
      const def = enemyDefinitionMap.get(enemyId);
      return {
        id: enemyId,
        name: def?.name ?? enemyId,
        count: group.count,
        avgHealth: group.healthTotal / group.count,
        maxHealth: group.maxHealthTotal / group.count
      };
    });
  }, [snapshot.enemies]);

  const upcomingGroups = useMemo<UpcomingGroup[]>(() => {
    const wave = snapshot.upcomingWave;
    if (!wave) {
      return [];
    }
    const quantities = new Map<string, number>();
    for (const segment of wave.segments) {
      quantities.set(segment.enemyId, (quantities.get(segment.enemyId) ?? 0) + segment.quantity);
    }
    if (wave.boss) {
      quantities.set(wave.boss.enemyId, (quantities.get(wave.boss.enemyId) ?? 0) + wave.boss.quantity);
    }
    return Array.from(quantities.entries()).map(([enemyId, quantity]) => {
      const def = enemyDefinitionMap.get(enemyId);
      return {
        id: enemyId,
        name: def?.name ?? enemyId,
        quantity
      };
    });
  }, [snapshot.upcomingWave]);

  if (activeGroups.length === 0 && upcomingGroups.length === 0) {
    return null;
  }

  return (
    <div className="enemy-indicator">
      <div className="enemy-indicator__section">
        <h4>Current Wave</h4>
        {activeGroups.length === 0 ? (
          <span className="enemy-indicator__empty">No enemies on the field.</span>
        ) : (
          <ul>
            {activeGroups.map((group) => (
              <li key={group.id}>
                <span className="enemy-indicator__name">{group.name}</span>
                <span className="enemy-indicator__detail">x{group.count}</span>
                <span className="enemy-indicator__detail">
                  HP {formatNumber(group.avgHealth, 1)} / {formatNumber(group.maxHealth, 1)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="enemy-indicator__section">
        <h4>Upcoming</h4>
        {upcomingGroups.length === 0 ? (
          <span className="enemy-indicator__empty">Wave cleared.</span>
        ) : (
          <ul>
            {upcomingGroups.map((group) => (
              <li key={group.id}>
                <span className="enemy-indicator__name">{group.name}</span>
                <span className="enemy-indicator__detail">x{group.quantity}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
