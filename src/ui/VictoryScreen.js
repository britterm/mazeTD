import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { useGame } from "../game/GameProvider";
import { getTowerSellValue } from "../game/config/towers";
import "./VictoryScreen.css";
export const VictoryScreen = () => {
    const { snapshot, highScore } = useGame();
    if (snapshot.mode !== "victory") {
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
    return (_jsx("div", { className: "victory-screen", children: _jsxs("div", { className: "victory-card", children: [_jsx("h1", { className: "victory-title", children: "Maze Secured" }), _jsx("p", { className: "victory-subtitle", children: "Final Score" }), _jsx("div", { className: "victory-score", children: stats.finalScore.toLocaleString() }), _jsxs("div", { className: "victory-breakdown", children: [_jsxs("div", { className: "victory-stat", children: [_jsx("span", { className: "label", children: "High score" }), _jsx("span", { className: "value", children: stats.bestScore.toLocaleString() })] }), _jsxs("div", { className: "victory-stat", children: [_jsx("span", { className: "label", children: "Tower salvage" }), _jsx("span", { className: "value", children: stats.towerSalvage.toLocaleString() })] }), _jsxs("div", { className: "victory-stat", children: [_jsx("span", { className: "label", children: "Credits carried" }), _jsx("span", { className: "value", children: stats.carriedCredits.toLocaleString() })] }), _jsxs("div", { className: "victory-stat", children: [_jsx("span", { className: "label", children: "Rounds survived" }), _jsx("span", { className: "value", children: stats.roundsSurvived })] })] }), _jsx("button", { className: "victory-button", onClick: () => window.location.reload(), children: "Play Again" })] }) }));
};
