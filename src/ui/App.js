import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { GameProvider, useGame } from "../game/GameProvider";
import { GameCanvas } from "../render/GameCanvas";
import { HudOverlay } from "./HudOverlay";
import { ControlPanel } from "./ControlPanel";
import { TowerMenu } from "./TowerMenu";
import { TerrainMenu } from "./TerrainMenu";
import { EnemyIndicator } from "./EnemyIndicator";
import { GameOverScreen } from "./GameOverScreen";
import { VictoryScreen } from "./VictoryScreen";
import { EventLog } from "./EventLog";
import { TitleScreen } from "./TitleScreen";
import "./App.css";
const AppContent = () => {
    const { phase } = useGame();
    const isTitle = phase === "title";
    return (_jsxs("div", { className: `app-shell${isTitle ? " app-shell--title" : ""}`, children: [_jsx("div", { className: "playfield", children: _jsxs("div", { className: "canvas-stack", children: [_jsx(GameCanvas, {}), _jsx(HudOverlay, {}), _jsx(TerrainMenu, {}), _jsx(TowerMenu, {}), _jsx(EnemyIndicator, {}), _jsx(VictoryScreen, {}), _jsx(GameOverScreen, {}), _jsx(EventLog, {}), _jsx(TitleScreen, {})] }) }), !isTitle ? (_jsx("aside", { className: "sidebar", children: _jsx(ControlPanel, {}) })) : null] }));
};
export const App = () => {
    return (_jsx(GameProvider, { children: _jsx(AppContent, {}) }));
};
