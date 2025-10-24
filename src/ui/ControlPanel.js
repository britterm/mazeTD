import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { towerDefinitions } from "../game/config/towers";
import { useGame } from "../game/GameProvider";
import "./ControlPanel.css";
export const ControlPanel = () => {
    const { engine, snapshot, selectedTower, setSelectedTower, setStatusMessage, setActiveTowerId, gameSpeed, setGameSpeed, gameSpeedOptions } = useGame();
    const handleStartWave = () => {
        if (snapshot.mode !== "build") {
            setStatusMessage("Wave already running");
            return;
        }
        engine.beginRound();
        setStatusMessage("Wave launched");
    };
    return (_jsxs("div", { className: "control-panel", children: [_jsxs("section", { className: "panel-section", children: [_jsx("div", { className: "panel-header", children: "Wave Control" }), _jsx("button", { className: "start-btn", disabled: snapshot.mode !== "build", onClick: handleStartWave, children: snapshot.mode === "build" ? "Start Wave" : "In Progress" }), _jsxs("div", { className: "speed-controls", children: [_jsx("span", { className: "speed-label", children: "Game Speed" }), _jsx("div", { className: "speed-buttons", children: gameSpeedOptions.map(({ label, value }) => (_jsx("button", { className: `speed-btn ${gameSpeed === value ? "is-active" : ""}`, onClick: () => setGameSpeed(value), children: label }, value))) })] })] }), _jsxs("section", { className: "panel-section", children: [_jsx("div", { className: "panel-header", children: "Towers" }), _jsx("div", { className: "tower-grid", children: towerDefinitions.map((tower) => {
                            const baseLevel = tower.levels[0];
                            const isSelected = selectedTower === tower.id;
                            const existingCount = snapshot.towers.filter((placed) => placed.type === tower.id).length;
                            const ramp = tower.id === "wall" ? 0 : existingCount * 5;
                            const baseCost = baseLevel?.cost ?? 0;
                            const costLabel = ramp > 0 ? `${baseCost} + ${ramp}` : `${baseCost}`;
                            return (_jsxs("button", { className: `tower-card ${isSelected ? "is-selected" : ""}`, onClick: () => {
                                    setActiveTowerId(null);
                                    setSelectedTower(tower.id);
                                }, children: [_jsxs("div", { className: "tower-meta", children: [_jsx("div", { className: "tower-name", style: { color: tower.color }, children: tower.name }), _jsxs("span", { className: "tower-cost", children: [costLabel, " cr"] })] }), _jsx("p", { className: "tower-desc", children: tower.description })] }, tower.id));
                        }) })] })] }));
};
