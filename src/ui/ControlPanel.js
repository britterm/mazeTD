import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { towerDefinitions } from "../game/config/towers";
import { useGame } from "../game/GameProvider";
import "./ControlPanel.css";
export const ControlPanel = () => {
    const { engine, snapshot, selectedTower, setSelectedTower, setStatusMessage, setActiveTowerId } = useGame();
    const handleStartWave = () => {
        if (snapshot.mode !== "build") {
            setStatusMessage("Wave already running");
            return;
        }
        engine.beginRound();
        setStatusMessage("Wave launched");
    };
    return (_jsxs("div", { className: "control-panel", children: [_jsxs("section", { className: "panel-section", children: [_jsx("div", { className: "panel-header", children: "Wave Control" }), _jsx("button", { className: "start-btn", disabled: snapshot.mode !== "build", onClick: handleStartWave, children: snapshot.mode === "build" ? "Start Wave" : "In Progress" }), snapshot.upcomingWave ? (_jsxs("div", { className: "wave-preview", children: [_jsx("div", { className: "preview-title", children: "Next Wave" }), _jsxs("ul", { children: [snapshot.upcomingWave.segments.map((segment, index) => (_jsxs("li", { children: [_jsx("span", { children: segment.enemyId }), _jsxs("span", { children: ["x", segment.quantity] })] }, `${segment.enemyId}-${index}`))), snapshot.upcomingWave.boss ? (_jsxs("li", { className: "boss-line", children: [_jsxs("span", { children: ["BOSS: ", snapshot.upcomingWave.boss.enemyId] }), _jsxs("span", { children: ["x", snapshot.upcomingWave.boss.quantity] })] })) : null] })] })) : null] }), _jsxs("section", { className: "panel-section", children: [_jsx("div", { className: "panel-header", children: "Towers" }), _jsx("div", { className: "tower-grid", children: towerDefinitions.map((tower) => {
                            const baseLevel = tower.levels[0];
                            const isSelected = selectedTower === tower.id;
                            return (_jsxs("button", { className: `tower-card ${isSelected ? "is-selected" : ""}`, onClick: () => {
                                    setActiveTowerId(null);
                                    setSelectedTower(tower.id);
                                }, children: [_jsx("div", { className: "tower-name", children: tower.name }), _jsxs("div", { className: "tower-meta", children: [_jsxs("span", { className: "tower-cost", children: [baseLevel?.cost ?? "-", " cr"] }), _jsx("span", { className: "tower-type", children: tower.category })] }), _jsx("p", { className: "tower-desc", children: tower.description })] }, tower.id));
                        }) })] })] }));
};
