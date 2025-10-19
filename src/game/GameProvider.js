import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createHexTopology } from "../core/topology/hexTopology";
import { GridManager } from "../core/grid/GridManager";
import { createHexBoardBlueprint } from "./config/board";
import { GameEngine } from "./GameEngine";
import { useAnimationFrame } from "../hooks/useAnimationFrame";
const GameContext = createContext(undefined);
export const GameProvider = ({ children }) => {
    if (typeof window !== "undefined" && window.__MAZETD_DEBUG === undefined) {
        window.__MAZETD_DEBUG = true;
    }
    const topology = useMemo(() => createHexTopology(34), []);
    const blueprint = useMemo(() => createHexBoardBlueprint(6), []);
    const gridManager = useMemo(() => new GridManager(topology, blueprint), [topology, blueprint]);
    const [engine] = useState(() => new GameEngine({ topology, grid: gridManager }));
    const [snapshot, setSnapshot] = useState(engine.snapshot());
    const [selectedTower, setSelectedTower] = useState("lightning");
    const [activeTowerId, setActiveTowerId] = useState(null);
    const [statusMessage, setStatusMessage] = useState(null);
    useEffect(() => engine.subscribe(setSnapshot), [engine]);
    useEffect(() => {
        if (activeTowerId && !snapshot.towers.some((tower) => tower.id === activeTowerId)) {
            setActiveTowerId(null);
        }
    }, [snapshot, activeTowerId]);
    useEffect(() => {
        if (typeof window !== "undefined") {
            window.__MAZETD_ENGINE = engine;
        }
        return () => {
            if (typeof window !== "undefined" && window.__MAZETD_ENGINE === engine) {
                delete window.__MAZETD_ENGINE;
            }
        };
    }, [engine]);
    useAnimationFrame((dt) => {
        engine.tick(dt);
    });
    const upgradeTower = useCallback((towerId) => {
        const result = engine.upgradeTower(towerId);
        if (!result.success && result.reason) {
            setStatusMessage(result.reason);
        }
        else if (result.success) {
            setStatusMessage(null);
        }
        return result;
    }, [engine, setStatusMessage]);
    const sellTower = useCallback((towerId) => {
        const result = engine.sellTower(towerId);
        if (result.success) {
            if (result.refund != null) {
                setStatusMessage(`Sold for ${result.refund} cr`);
            }
            setActiveTowerId(null);
        }
        else if (result.reason) {
            setStatusMessage(result.reason);
        }
        return result;
    }, [engine, setStatusMessage, setActiveTowerId]);
    const getSellValue = useCallback((towerId) => engine.getTowerSellValue(towerId), [engine]);
    const value = useMemo(() => ({
        engine,
        snapshot,
        selectedTower,
        setSelectedTower,
        activeTowerId,
        setActiveTowerId,
        upgradeTower,
        sellTower,
        getSellValue,
        statusMessage,
        setStatusMessage
    }), [engine, snapshot, selectedTower, activeTowerId, statusMessage, upgradeTower, sellTower, getSellValue]);
    return _jsx(GameContext.Provider, { value: value, children: children });
};
export const useGame = () => {
    const ctx = useContext(GameContext);
    if (!ctx) {
        throw new Error("useGame must be used within GameProvider");
    }
    return ctx;
};
