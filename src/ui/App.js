import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { GameProvider } from "../game/GameProvider";
import { GameCanvas } from "../render/GameCanvas";
import { HudOverlay } from "./HudOverlay";
import { ControlPanel } from "./ControlPanel";
import { TowerMenu } from "./TowerMenu";
import { EnemyIndicator } from "./EnemyIndicator";
import { GameOverScreen } from "./GameOverScreen";
import { EventLog } from "./EventLog";
import "./App.css";
export const App = () => {
    return (_jsx(GameProvider, { children: _jsxs("div", { className: "app-shell", children: [_jsx("div", { className: "playfield", children: _jsxs("div", { className: "canvas-stack", children: [_jsx(GameCanvas, {}), _jsx(HudOverlay, {}), _jsx(TowerMenu, {}), _jsx(EnemyIndicator, {}), _jsx(GameOverScreen, {}), _jsx(EventLog, {})] }) }), _jsx("aside", { className: "sidebar", children: _jsx(ControlPanel, {}) })] }) }));
};
