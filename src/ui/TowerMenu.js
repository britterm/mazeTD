import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { useGame } from "../game/GameProvider";
import { towerDefinitionMap } from "../game/config/towers";
import "./TowerMenu.css";
const RANGE_MINIMUMS = {
    wall: 0,
    lightning: 2.5,
    fire: 2.25,
    ice: 2.25,
    earth: 2.4
};
const formatNumber = (value, fractionDigits = 1) => {
    if (value == null) {
        return "-";
    }
    const rounded = Math.round(value * Math.pow(10, fractionDigits)) / Math.pow(10, fractionDigits);
    return fractionDigits === 0 ? String(rounded) : rounded.toFixed(fractionDigits);
};
const getRangeCells = (towerType, level) => {
    if (!level) {
        return 0;
    }
    const min = RANGE_MINIMUMS[towerType] ?? level.range;
    return Math.max(level.range ?? 0, min);
};
const defaultFormatter = (value) => formatNumber(value, 2);
const StatRow = ({ label, current, next, formatter = defaultFormatter, suffix = "" }) => {
    if (current == null && next == null) {
        return null;
    }
    const currentText = formatter(current);
    const nextText = next != null ? formatter(next) : null;
    const diff = next != null && current != null ? next - current : null;
    return (_jsxs("div", { className: "tower-menu__stat", children: [_jsx("span", { className: "tower-menu__stat-label", children: label }), _jsxs("div", { className: "tower-menu__stat-values", children: [_jsxs("span", { className: "tower-menu__stat-current", children: [currentText, suffix] }), nextText != null ? (_jsxs("span", { className: "tower-menu__stat-next", children: [_jsx("span", { className: "tower-menu__stat-arrow", children: "\u2192" }), " ", nextText, suffix, diff != null && Math.abs(diff) > 0.001 ? (_jsxs("span", { className: `tower-menu__stat-diff ${diff >= 0 ? "is-positive" : "is-negative"}`, children: [diff >= 0 ? `+${formatter(diff)}` : formatter(diff), suffix] })) : null] })) : null] })] }));
};
export const TowerMenu = () => {
    const { snapshot, activeTowerId, setActiveTowerId, upgradeTower, sellTower, getSellValue } = useGame();
    const data = useMemo(() => {
        if (!activeTowerId) {
            return null;
        }
        const tower = snapshot.towers.find((item) => item.id === activeTowerId);
        if (!tower) {
            return null;
        }
        const towerType = tower.type;
        const def = towerDefinitionMap.get(towerType);
        if (!def) {
            return null;
        }
        const currentLevel = def.levels.find((lvl) => lvl.level === tower.level);
        const nextLevel = def.levels.find((lvl) => lvl.level === tower.level + 1);
        return { tower, def, towerType, currentLevel, nextLevel };
    }, [activeTowerId, snapshot.towers]);
    const stats = useMemo(() => {
        if (!data) {
            return [];
        }
        const { towerType, currentLevel, nextLevel } = data;
        const entries = [];
        const addStat = (id, label, current, next, formatter = defaultFormatter, suffix = "") => {
            if (current == null && next == null) {
                return;
            }
            entries.push({ id, label, current, next, formatter, suffix });
        };
        addStat("range", "Range (cells)", getRangeCells(towerType, currentLevel), nextLevel ? getRangeCells(towerType, nextLevel) : undefined, (value) => formatNumber(value, 2));
        addStat("damage", "Damage", currentLevel?.damage, nextLevel?.damage, (value) => formatNumber(value, 0));
        addStat("fireRate", "Fire Rate", currentLevel?.fireRate, nextLevel?.fireRate, (value) => formatNumber(value, 2), "/s");
        addStat("projectileSpeed", "Projectile Speed", currentLevel?.projectileSpeed, nextLevel?.projectileSpeed, (value) => (value != null ? formatNumber(value, 2) : "-"), "");
        addStat("splash", "Splash Radius", currentLevel?.splashRadius, nextLevel?.splashRadius, (value) => (value != null ? formatNumber(value, 2) : "-"), "");
        addStat("slowFactor", "Slow Factor", currentLevel?.slowFactor != null ? currentLevel.slowFactor * 100 : undefined, nextLevel?.slowFactor != null ? nextLevel.slowFactor * 100 : undefined, (value) => (value != null ? formatNumber(value, 1) : "-"), "%");
        addStat("slowDuration", "Slow Duration", currentLevel?.slowDuration, nextLevel?.slowDuration, (value) => (value != null ? formatNumber(value, 2) : "-"), "s");
        addStat("stunDuration", "Stun Duration", currentLevel?.stunDuration, nextLevel?.stunDuration, (value) => (value != null ? formatNumber(value, 2) : "-"), "s");
        return entries;
    }, [data]);
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
    const handleSell = () => {
        const result = sellTower(tower.id);
        if (result.success) {
            setActiveTowerId(null);
        }
    };
    const closeMenu = () => setActiveTowerId(null);
    return (_jsxs("div", { className: "tower-menu", children: [_jsxs("div", { className: "tower-menu__header", children: [_jsxs("div", { children: [_jsx("h3", { className: "tower-menu__name", children: def.name }), _jsxs("span", { className: "tower-menu__subtitle", children: ["Level ", tower.level] })] }), _jsx("button", { className: "tower-menu__close", onClick: closeMenu, "aria-label": "Close", children: "x" })] }), _jsx("p", { className: "tower-menu__description", children: def.description }), _jsx("div", { className: "tower-menu__stats", children: stats.map(({ id, ...statProps }) => (_jsx(StatRow, { ...statProps }, id))) }), _jsxs("div", { className: "tower-menu__actions", children: [_jsx("button", { className: "tower-menu__button", disabled: !canUpgrade, onClick: handleUpgrade, children: nextLevel ? `Upgrade (${nextLevel.cost} cr)` : "Max Level" }), _jsxs("button", { className: "tower-menu__button tower-menu__button--secondary", onClick: handleSell, children: ["Sell (", sellValue, " cr)"] })] })] }));
};
