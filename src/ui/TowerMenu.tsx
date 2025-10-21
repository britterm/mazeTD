import { useMemo } from "react";
import { useGame } from "../game/GameProvider";
import { towerDefinitionMap, towerDefinitions } from "../game/config/towers";
import { TowerLevel } from "../game/entities/tower";
import { TowerType } from "../core/types";
import "./TowerMenu.css";


const formatNumber = (value: number | undefined, fractionDigits = 1) => {
  if (value == null) {
    return "-";
  }
  const rounded = Math.round(value * Math.pow(10, fractionDigits)) / Math.pow(10, fractionDigits);
  return fractionDigits === 0 ? String(rounded) : rounded.toFixed(fractionDigits);
};


type StatEntry = {
  id: string;
  label: string;
  current?: number;
  next?: number;
  formatter?: (value: number | undefined) => string;
  suffix?: string;
};

type StatProps = Omit<StatEntry, "id">;

const defaultFormatter = (value: number | undefined) => formatNumber(value, 2);

const StatRow = ({ label, current, next, formatter = defaultFormatter, suffix = "" }: StatProps) => {
  if (current == null && next == null) {
    return null;
  }
  const currentText = formatter(current);
  const nextText = next != null ? formatter(next) : null;
  const diff = next != null && current != null ? next - current : null;

  return (
    <div className="tower-menu__stat">
      <span className="tower-menu__stat-label">{label}</span>
      <div className="tower-menu__stat-values">
        <span className="tower-menu__stat-current">{currentText}{suffix}</span>
        {nextText != null ? (
          <span className="tower-menu__stat-next">
            <span className="tower-menu__stat-arrow">&rarr;</span> {nextText}{suffix}
            {diff != null && Math.abs(diff) > 0.001 ? (
              <span className={`tower-menu__stat-diff ${diff >= 0 ? "is-positive" : "is-negative"}`}>
                {diff >= 0 ? `+${formatter(diff)}` : formatter(diff)}{suffix}
              </span>
            ) : null}
          </span>
        ) : null}
      </div>
    </div>
  );
};

export const TowerMenu = () => {
  const {
    snapshot,
    activeTowerId,
    setActiveTowerId,
    upgradeTower,
    convertWallTower,
    getWallConversionCost,
    sellTower,
    getSellValue
  } = useGame();

  const data = useMemo(() => {
    if (!activeTowerId) {
      return null;
    }
    const tower = snapshot.towers.find((item) => item.id === activeTowerId);
    if (!tower) {
      return null;
    }
    const towerType = tower.type as TowerType;
    const def = towerDefinitionMap.get(towerType);
    if (!def) {
      return null;
    }
    const currentLevel = def.levels.find((lvl) => lvl.level === tower.level);
    const nextLevel = def.levels.find((lvl) => lvl.level === tower.level + 1);
    return { tower, def, towerType, currentLevel, nextLevel } as const;
  }, [activeTowerId, snapshot.towers]);

  const stats: StatEntry[] = useMemo(() => {
    if (!data) {
      return [];
    }

    const { towerType, currentLevel, nextLevel } = data;
    const entries: StatEntry[] = [];
    const addStat = (
      id: string,
      label: string,
      current?: number,
      next?: number,
      formatter: (value: number | undefined) => string = defaultFormatter,
      suffix = ""
    ) => {
      if (current == null && next == null) {
        return;
      }
      entries.push({ id, label, current, next, formatter, suffix });
    };

    addStat(
      "range",
      "Range (cells)",
      currentLevel?.range,
      nextLevel?.range,
      (value) => formatNumber(value, 2)
    );
    addStat("damage", "Damage", currentLevel?.damage, nextLevel?.damage, (value) => formatNumber(value, 0));
    addStat("fireRate", "Fire Rate", currentLevel?.fireRate, nextLevel?.fireRate, (value) => formatNumber(value, 2), "/s");
    addStat(
      "projectileSpeed",
      "Projectile Speed",
      currentLevel?.projectileSpeed,
      nextLevel?.projectileSpeed,
      (value) => (value != null ? formatNumber(value, 2) : "-"),
      ""
    );
    addStat(
      "splash",
      "Splash Radius",
      currentLevel?.splashRadius,
      nextLevel?.splashRadius,
      (value) => (value != null ? formatNumber(value, 2) : "-"),
      ""
    );
    addStat(
      "slowFactor",
      "Slow Factor",
      currentLevel?.slowFactor != null ? currentLevel.slowFactor * 100 : undefined,
      nextLevel?.slowFactor != null ? nextLevel.slowFactor * 100 : undefined,
      (value) => (value != null ? formatNumber(value, 1) : "-"),
      "%"
    );
    addStat(
      "slowDuration",
      "Slow Duration",
      currentLevel?.slowDuration,
      nextLevel?.slowDuration,
      (value) => (value != null ? formatNumber(value, 2) : "-"),
      "s"
    );
    addStat(
      "stunDuration",
      "Stun Duration",
      currentLevel?.stunDuration,
      nextLevel?.stunDuration,
      (value) => (value != null ? formatNumber(value, 2) : "-"),
      "s"
    );

    return entries;
  }, [data]);

  const conversionOptions = useMemo(() => {
    if (!data || data.def.id !== 'wall') {
      return [];
    }

    const { tower } = data;

    return towerDefinitions
      .filter((definition) => definition.id !== 'wall')
      .map((definition) => {
        const result = getWallConversionCost(tower.id, definition.id);
        const cost = result.cost ?? null;
        return {
          id: definition.id as TowerType,
          name: definition.name,
          cost,
          affordable: cost != null && snapshot.credits >= cost,
          disabledReason: result.success ? null : result.reason ?? null
        };
      })
      .filter((option) => option.cost != null);
  }, [data, getWallConversionCost, snapshot.credits]);

  if (!data) {
    return null;
  }

  const { tower, def, towerType, currentLevel, nextLevel } = data;
  const sellValue = getSellValue(tower.id);
  const canUpgrade = Boolean(nextLevel) && snapshot.credits >= (nextLevel?.cost ?? Infinity);

  const handleUpgrade = () => {
    if (!nextLevel) {
      return;
    }
    upgradeTower(tower.id);
  };

  const handleConvert = (targetId: TowerType) => {
    convertWallTower(tower.id, targetId);
  };

  const handleSell = () => {
    const result = sellTower(tower.id);
    if (result.success) {
      setActiveTowerId(null);
    }
  };

  const closeMenu = () => setActiveTowerId(null);

  return (
    <div className="tower-menu">
      <div className="tower-menu__header">
        <div>
          <h3 className="tower-menu__name">{def.name}</h3>
          <span className="tower-menu__subtitle">Level {tower.level}</span>
        </div>
        <button className="tower-menu__close" onClick={closeMenu} aria-label="Close">
          x
        </button>
      </div>
      <p className="tower-menu__description">{def.description}</p>
      <div className="tower-menu__stats">
        {stats.map(({ id, ...statProps }) => (
          <StatRow key={id} {...statProps} />
        ))}
      </div>
      {conversionOptions.length > 0 ? (
        <div className="tower-menu__conversion">
          <span className="tower-menu__conversion-label">Convert wall</span>
          <div className="tower-menu__conversion-buttons">
            {conversionOptions.map((option) => (
              <button
                key={option.id}
                className="tower-menu__button tower-menu__button--conversion"
                disabled={!option.affordable || option.disabledReason != null}
                onClick={() => handleConvert(option.id)}
                title={option.disabledReason ?? undefined}
              >
                {`Convert to ${option.name} (${option.cost} cr)`}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="tower-menu__actions">
        <button className="tower-menu__button" disabled={!canUpgrade} onClick={handleUpgrade}>
          {nextLevel ? `Upgrade (${nextLevel.cost} cr)` : "Max Level"}
        </button>
        <button className="tower-menu__button tower-menu__button--secondary" onClick={handleSell}>
          Sell ({sellValue} cr)
        </button>
      </div>
    </div>
  );
};