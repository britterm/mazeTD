import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { useGame } from "../game/GameProvider";
import "./TerrainMenu.css";
export const TerrainMenu = () => {
    const { engine, snapshot, activeTerrain, setActiveTerrain, clearTerrain, clearCost } = useGame();
    const variant = useMemo(() => {
        if (!activeTerrain) {
            return null;
        }
        return engine.getCellVariant(activeTerrain);
    }, [engine, activeTerrain]);
    if (!activeTerrain || variant !== "clearable") {
        return null;
    }
    const handleClear = () => {
        clearTerrain(activeTerrain);
    };
    const buttonLabel = clearCost > 0 ? `Clear for ${clearCost} credits` : 'Clear obstacle';
    return (_jsx("div", { className: "terrain-menu", children: _jsxs("div", { className: "terrain-menu__card", children: [_jsxs("div", { className: "terrain-menu__header", children: [_jsx("h3", { className: "terrain-menu__title", children: "Blocked Tile" }), _jsx("button", { className: "terrain-menu__close", onClick: () => setActiveTerrain(null), "aria-label": "Close", children: "\u00D7" })] }), _jsx("p", { className: "terrain-menu__description", children: "Spend credits to clear this obstacle. Clearing converts the tile into a wall you can convert later." }), _jsx("button", { className: "terrain-menu__action", onClick: handleClear, disabled: snapshot.credits < clearCost, children: buttonLabel })] }) }));
};
