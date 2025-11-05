import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { useGame } from "../game/GameProvider";
import { getTowerSellValue } from "../game/config/towers";
import "./GameOverScreen.css";
export const GameOverScreen = () => {
    const { snapshot, highScore, currentLevel, selectLevel, returnToTitle, phase } = useGame();
    if (phase !== "playing" || snapshot.mode !== "defeat") {
        return null;
    }
    const stats = useMemo(() => {
        const roundsCleared = Math.max(0, snapshot.round - 1);
        const towerSalvage = snapshot.towers.reduce((total, tower) => total + getTowerSellValue(tower.type, tower.level), 0);
        const carriedCredits = Math.floor(snapshot.credits);
        const finalScore = Math.max(0, Math.floor(snapshot.score));
        const bestScore = Math.max(highScore, finalScore);
        return {
            roundsCleared,
            towerSalvage,
            carriedCredits,
            finalScore,
            bestScore
        };
    }, [snapshot, highScore]);
    const handleRetry = () => {
        if (currentLevel) {
            selectLevel(currentLevel.id);
        }
    };
    return (_jsx("div", { className: "game-over-screen", children: _jsxs("div", { className: "game-over-card", children: [_jsx("h1", { className: "game-over-title", children: "Core Destroyed" }), _jsx("p", { className: "game-over-subtitle", children: "Final Score" }), _jsx("div", { className: "game-over-score", children: stats.finalScore.toLocaleString() }), _jsxs("div", { className: "game-over-breakdown", children: [_jsxs("div", { className: "game-over-stat", children: [_jsx("span", { className: "label", children: "Best score" }), _jsx("span", { className: "value", children: stats.bestScore.toLocaleString() })] }), _jsxs("div", { className: "game-over-stat", children: [_jsx("span", { className: "label", children: "Tower salvage" }), _jsx("span", { className: "value", children: stats.towerSalvage.toLocaleString() })] }), _jsxs("div", { className: "game-over-stat", children: [_jsx("span", { className: "label", children: "Credits carried" }), _jsx("span", { className: "value", children: stats.carriedCredits.toLocaleString() })] }), _jsxs("div", { className: "game-over-stat", children: [_jsx("span", { className: "label", children: "Rounds cleared" }), _jsx("span", { className: "value", children: stats.roundsCleared })] })] }), _jsxs("div", { className: "game-over-actions", children: [_jsx("button", { className: "game-over-button", onClick: handleRetry, children: "Retry Level" }), _jsx("button", { className: "game-over-button game-over-button--secondary", onClick: returnToTitle, children: "Level Select" })] })] }) }));
};
