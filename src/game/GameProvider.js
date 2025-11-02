import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createHexTopology } from "../core/topology/hexTopology";
import { GridManager } from "../core/grid/GridManager";
import { createHexBoardBlueprint } from "./config/board";
import { GameEngine } from "./GameEngine";
import { useAnimationFrame } from "../hooks/useAnimationFrame";
import speedConfig from "../data/game-speed.json";
const HIGH_SCORE_STORAGE_KEY = "mazeTD:high-score";
const readStoredHighScore = () => {
    if (typeof window === "undefined") {
        return 0;
    }
    try {
        const raw = window.localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
        if (!raw) {
            return 0;
        }
        const parsed = Number.parseInt(raw, 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    }
    catch {
        return 0;
    }
};
const speedConfigData = speedConfig;
const configuredSpeedOptions = Array.isArray(speedConfigData.speedOptions) ? speedConfigData.speedOptions : [];
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
    const [highScore, setHighScore] = useState(() => readStoredHighScore());
    const [selectedTower, setSelectedTower] = useState("lightning");
    const [activeTowerId, setActiveTowerId] = useState(null);
    const [statusMessage, setStatusMessage] = useState(null);
    const gameSpeedOptions = useMemo(() => {
        const seen = new Set();
        const normalized = configuredSpeedOptions
            .filter((option) => option && option.enabled !== false)
            .map((option) => {
            const value = typeof option?.multiplier === "number" && option.multiplier > 0 ? option.multiplier : 1;
            return {
                label: typeof option?.label === "string" && option.label.trim().length > 0 ? option.label : `${value}x`,
                value
            };
        })
            .filter((option) => {
            if (seen.has(option.value)) {
                return false;
            }
            seen.add(option.value);
            return true;
        })
            .sort((a, b) => a.value - b.value);
        return normalized.length > 0 ? normalized : [{ label: "1x", value: 1 }];
    }, []);
    const defaultSpeed = gameSpeedOptions[0]?.value ?? 1;
    const [gameSpeed, setGameSpeed] = useState(defaultSpeed);
    useEffect(() => engine.subscribe(setSnapshot), [engine]);
    useEffect(() => {
        const currentScore = Math.max(0, Math.floor(snapshot.score));
        if (!Number.isFinite(currentScore) || currentScore <= highScore) {
            return;
        }
        setHighScore(currentScore);
        if (typeof window !== "undefined") {
            try {
                window.localStorage.setItem(HIGH_SCORE_STORAGE_KEY, String(currentScore));
            }
            catch {
                // ignore persistence failures
            }
        }
    }, [snapshot.score, highScore]);
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
        engine.tick(dt * Math.max(1, gameSpeed));
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
    const convertWallTower = useCallback((towerId, targetType) => {
        const result = engine.convertWallTower(towerId, targetType);
        if (!result.success && result.reason) {
            setStatusMessage(result.reason);
        }
        else if (result.success) {
            if (result.cost != null) {
                setStatusMessage(`Converted for ${result.cost} cr`);
            }
            else {
                setStatusMessage(null);
            }
        }
        return result;
    }, [engine, setStatusMessage]);
    const getWallConversionCost = useCallback((towerId, targetType) => {
        return engine.getWallConversionCost(towerId, targetType);
    }, [engine]);
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
    const applyGameSpeed = useCallback((speed) => {
        if (gameSpeedOptions.some((option) => option.value === speed)) {
            setGameSpeed(speed);
        }
    }, [gameSpeedOptions]);
    const value = useMemo(() => ({
        engine,
        snapshot,
        selectedTower,
        setSelectedTower,
        activeTowerId,
        setActiveTowerId,
        upgradeTower,
        convertWallTower,
        getWallConversionCost,
        sellTower,
        getSellValue,
        statusMessage,
        setStatusMessage,
        gameSpeed,
        setGameSpeed: applyGameSpeed,
        gameSpeedOptions,
        highScore
    }), [
        engine,
        snapshot,
        selectedTower,
        activeTowerId,
        statusMessage,
        gameSpeed,
        gameSpeedOptions,
        highScore,
        applyGameSpeed,
        upgradeTower,
        convertWallTower,
        getWallConversionCost,
        sellTower,
        getSellValue
    ]);
    return _jsx(GameContext.Provider, { value: value, children: children });
};
export const useGame = () => {
    const ctx = useContext(GameContext);
    if (!ctx) {
        throw new Error("useGame must be used within GameProvider");
    }
    return ctx;
};
