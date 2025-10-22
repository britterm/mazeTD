import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { useGame } from "../game/GameProvider";
import "./GameOverScreen.css";
export const GameOverScreen = () => {
    const { snapshot } = useGame();
    const isDefeat = snapshot.mode === "defeat";
    const stats = useMemo(() => {
        const levelsCleared = Math.max(0, snapshot.round - 1);
        return {
            levelsCleared,
            remainingHealth: Math.max(0, snapshot.coreHealth)
        };
    }, [snapshot.coreHealth, snapshot.round]);
    if (!isDefeat) {
        return null;
    }
    return (_jsx("div", { className: "game-over-screen", children: _jsxs("div", { className: "game-over-card", children: [_jsx("h1", { className: "game-over-title", children: "Core Destroyed" }), _jsx("p", { className: "game-over-subtitle", children: "Final Score" }), _jsx("div", { className: "game-over-score", children: snapshot.score }), _jsxs("div", { className: "game-over-breakdown", children: [_jsxs("div", { className: "game-over-stat", children: [_jsx("span", { className: "label", children: "Levels cleared" }), _jsx("span", { className: "value", children: stats.levelsCleared })] }), _jsxs("div", { className: "game-over-stat", children: [_jsx("span", { className: "label", children: "Core health remaining" }), _jsx("span", { className: "value", children: stats.remainingHealth })] })] }), _jsx("button", { className: "game-over-button", onClick: () => window.location.reload(), children: "Try Again" })] }) }));
};
