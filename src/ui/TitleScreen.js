import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useGame } from "../game/GameProvider";
import "./TitleScreen.css";
import heroBackground from "../../assets/ui/hero2.png";
const formatPercent = (value) => `${Math.round(value * 100)}%`;
export const TitleScreen = () => {
    const { phase, levels, selectLevel } = useGame();
    if (phase !== "title") {
        return null;
    }
    return (_jsx("div", { className: "title-screen", children: _jsx("div", { className: "title-screen__panel", style: { backgroundImage: `url(${heroBackground})` }, children: _jsxs("div", { className: "title-screen__panel-content", children: [_jsxs("div", { className: "title-screen__header", children: [_jsx("h1", { className: "title-screen__title", children: "Hexel Defense" }), _jsx("p", { className: "title-screen__subtitle", children: "Select a level to begin your defenses." })] }), _jsx("div", { className: "title-screen__levels", children: levels.map((level) => {
                            const locked = !level.unlocked;
                            return (_jsxs("button", { className: `title-screen__level ${locked ? "is-locked" : ""}`.trim(), disabled: locked, onClick: () => selectLevel(level.id), children: [_jsxs("div", { className: "title-screen__level-header", children: [_jsx("span", { className: "title-screen__level-name", children: level.name }), locked ? _jsx("span", { className: "title-screen__level-lock", children: "Locked" }) : null] }), _jsxs("div", { className: "title-screen__level-meta", children: [_jsxs("span", { children: ["Obstacles ", formatPercent(level.density)] }), _jsxs("span", { children: ["Best ", level.bestScore > 0 ? level.bestScore.toLocaleString() : "-"] }), _jsxs("span", { children: ["Waves ", level.waves] })] })] }, level.id));
                        }) })] }) }) }));
};
