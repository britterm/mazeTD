import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useGame } from "../game/GameProvider";
import "./HudOverlay.css";
export const HudOverlay = () => {
    const { snapshot, statusMessage } = useGame();
    return (_jsxs("div", { className: "hud-overlay", children: [_jsxs("div", { className: "hud-card", children: [_jsx("div", { className: "hud-title", children: "Round" }), _jsx("div", { className: "hud-value", children: snapshot.round })] }), _jsxs("div", { className: "hud-card", children: [_jsx("div", { className: "hud-title", children: "Credits" }), _jsx("div", { className: "hud-value", children: Math.floor(snapshot.credits) })] }), _jsxs("div", { className: "hud-card", children: [_jsx("div", { className: "hud-title", children: "Core" }), _jsx("div", { className: "hud-value", children: snapshot.coreHealth })] }), _jsxs("div", { className: "hud-status", children: [_jsx("span", { className: `hud-mode hud-mode-${snapshot.mode}`, children: snapshot.mode.toUpperCase() }), statusMessage ? _jsx("span", { className: "hud-message", children: statusMessage }) : null] })] }));
};
