import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { useGame } from "../game/GameProvider";
import { getTowerSellValue } from "../game/config/towers";
import "./VictoryScreen.css";
export const VictoryScreen = () => {
    const { snapshot, highScore, levels, currentLevel, selectLevel, returnToTitle, phase } = useGame();
    if (phase !== "playing" || snapshot.mode !== "victory") {
        return null;
    }
    const stats = useMemo(() => {
        const roundsSurvived = snapshot.round;
        const towerSalvage = snapshot.towers.reduce((total, tower) => total + getTowerSellValue(tower.type, tower.level), 0);
        const carriedCredits = Math.floor(snapshot.credits);
        const finalScore = Math.max(0, Math.floor(snapshot.score));
        const bestScore = Math.max(highScore, finalScore);
        return {
            roundsSurvived,
            towerSalvage,
            carriedCredits,
            finalScore,
            bestScore
        };
    }, [snapshot, highScore]);
    const nextLevel = useMemo(() => {
        if (!currentLevel) {
            return null;
        }
        return levels.find((level) => level.index === currentLevel.index + 1 && level.unlocked) ?? null;
    }, [levels, currentLevel]);
    const handleReplay = () => {
        if (currentLevel) {
            selectLevel(currentLevel.id);
        }
    };
    const handleNext = () => {
        if (nextLevel) {
            selectLevel(nextLevel.id);
        }
    };
    return (_jsx("div", { className: "victory-screen", children: _jsxs("div", { className: "victory-card", children: [_jsx("h1", { className: "victory-title", children: "Maze Secured" }), _jsx("p", { className: "victory-subtitle", children: "Final Score" }), _jsx("div", { className: "victory-score", children: stats.finalScore.toLocaleString() }), _jsxs("div", { className: "victory-breakdown", children: [_jsxs("div", { className: "victory-stat", children: [_jsx("span", { className: "label", children: "Best score" }), _jsx("span", { className: "value", children: stats.bestScore.toLocaleString() })] }), _jsxs("div", { className: "victory-stat", children: [_jsx("span", { className: "label", children: "Tower salvage" }), _jsx("span", { className: "value", children: stats.towerSalvage.toLocaleString() })] }), _jsxs("div", { className: "victory-stat", children: [_jsx("span", { className: "label", children: "Credits carried" }), _jsx("span", { className: "value", children: stats.carriedCredits.toLocaleString() })] }), _jsxs("div", { className: "victory-stat", children: [_jsx("span", { className: "label", children: "Rounds cleared" }), _jsx("span", { className: "value", children: stats.roundsSurvived })] })] }), _jsxs("div", { className: "victory-actions", children: [_jsx("button", { className: "victory-button", onClick: handleReplay, children: "Replay Level" }), _jsx("button", { className: "victory-button victory-button--secondary", onClick: returnToTitle, children: "Level Select" }), _jsx("button", { className: "victory-button victory-button--primary", onClick: handleNext, disabled: !nextLevel, children: nextLevel ? `Next: ${nextLevel.name}` : "All Levels Complete" })] })] }) }));
};
