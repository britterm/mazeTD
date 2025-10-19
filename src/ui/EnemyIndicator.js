import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { useGame } from "../game/GameProvider";
import { enemyDefinitionMap } from "../game/config/enemies";
import "./EnemyIndicator.css";
const formatNumber = (value, fractionDigits = 1) => {
    const rounded = Math.round(value * Math.pow(10, fractionDigits)) / Math.pow(10, fractionDigits);
    return fractionDigits === 0 ? String(rounded) : rounded.toFixed(fractionDigits);
};
export const EnemyIndicator = () => {
    const { snapshot } = useGame();
    const activeGroups = useMemo(() => {
        const groups = new Map();
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
    const upcomingGroups = useMemo(() => {
        const wave = snapshot.upcomingWave;
        if (!wave) {
            return [];
        }
        const quantities = new Map();
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
    return (_jsxs("div", { className: "enemy-indicator", children: [_jsxs("div", { className: "enemy-indicator__section", children: [_jsx("h4", { children: "Current Wave" }), activeGroups.length === 0 ? (_jsx("span", { className: "enemy-indicator__empty", children: "No enemies on the field." })) : (_jsx("ul", { children: activeGroups.map((group) => (_jsxs("li", { children: [_jsx("span", { className: "enemy-indicator__name", children: group.name }), _jsxs("span", { className: "enemy-indicator__detail", children: ["x", group.count] }), _jsxs("span", { className: "enemy-indicator__detail", children: ["HP ", formatNumber(group.avgHealth, 1), " / ", formatNumber(group.maxHealth, 1)] })] }, group.id))) }))] }), _jsxs("div", { className: "enemy-indicator__section", children: [_jsx("h4", { children: "Upcoming" }), upcomingGroups.length === 0 ? (_jsx("span", { className: "enemy-indicator__empty", children: "Wave cleared." })) : (_jsx("ul", { children: upcomingGroups.map((group) => (_jsxs("li", { children: [_jsx("span", { className: "enemy-indicator__name", children: group.name }), _jsxs("span", { className: "enemy-indicator__detail", children: ["x", group.quantity] })] }, group.id))) }))] })] }));
};
