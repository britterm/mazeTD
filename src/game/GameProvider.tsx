import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createHexTopology, HexCoord } from "../core/topology/hexTopology";
import { GridManager } from "../core/grid/GridManager";
import { createHexBoardBlueprint } from "./config/board";
import { GameEngine, GameSnapshot } from "./GameEngine";
import { useAnimationFrame } from "../hooks/useAnimationFrame";

interface GameContextValue {
  engine: GameEngine<HexCoord>;
  snapshot: GameSnapshot<HexCoord>;
  selectedTower: string | null;
  setSelectedTower: (tower: string | null) => void;
  activeTowerId: string | null;
  setActiveTowerId: (towerId: string | null) => void;
  upgradeTower: (towerId: string) => { success: boolean; reason?: string };
  convertWallTower: (towerId: string, targetType: string) => { success: boolean; reason?: string; cost?: number };
  getWallConversionCost: (towerId: string, targetType: string) => { success: boolean; reason?: string; cost?: number };
  sellTower: (towerId: string) => { success: boolean; reason?: string; refund?: number };
  getSellValue: (towerId: string) => number;
  statusMessage: string | null;
  setStatusMessage: (message: string | null) => void;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  if (typeof window !== "undefined" && (window as any).__MAZETD_DEBUG === undefined) {
    (window as any).__MAZETD_DEBUG = true;
  }
  const topology = useMemo(() => createHexTopology(34), []);
  const blueprint = useMemo(() => createHexBoardBlueprint(6), []);
  const gridManager = useMemo(() => new GridManager(topology, blueprint), [topology, blueprint]);
  const [engine] = useState(() => new GameEngine<HexCoord>({ topology, grid: gridManager }));
  const [snapshot, setSnapshot] = useState<GameSnapshot<HexCoord>>(engine.snapshot());
  const [selectedTower, setSelectedTower] = useState<string | null>("lightning");
  const [activeTowerId, setActiveTowerId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => engine.subscribe(setSnapshot), [engine]);

  useEffect(() => {
    if (activeTowerId && !snapshot.towers.some((tower) => tower.id === activeTowerId)) {
      setActiveTowerId(null);
    }
  }, [snapshot, activeTowerId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__MAZETD_ENGINE = engine;
    }
    return () => {
      if (typeof window !== "undefined" && (window as any).__MAZETD_ENGINE === engine) {
        delete (window as any).__MAZETD_ENGINE;
      }
    };
  }, [engine]);

  useAnimationFrame((dt) => {
    engine.tick(dt);
  });

  const upgradeTower = useCallback((towerId: string) => {
    const result = engine.upgradeTower(towerId);
    if (!result.success && result.reason) {
      setStatusMessage(result.reason);
    } else if (result.success) {
      setStatusMessage(null);
    }
    return result;
  }, [engine, setStatusMessage]);

  const convertWallTower = useCallback((towerId: string, targetType: string) => {
    const result = engine.convertWallTower(towerId, targetType);
    if (!result.success && result.reason) {
      setStatusMessage(result.reason);
    } else if (result.success) {
      if (result.cost != null) {
        setStatusMessage(`Converted for ${result.cost} cr`);
      } else {
        setStatusMessage(null);
      }
    }
    return result;
  }, [engine, setStatusMessage]);

  const getWallConversionCost = useCallback((towerId: string, targetType: string) => {
    return engine.getWallConversionCost(towerId, targetType);
  }, [engine]);

  const sellTower = useCallback((towerId: string) => {
    const result = engine.sellTower(towerId);
    if (result.success) {
      if (result.refund != null) {
        setStatusMessage(`Sold for ${result.refund} cr`);
      }
      setActiveTowerId(null);
    } else if (result.reason) {
      setStatusMessage(result.reason);
    }
    return result;
  }, [engine, setStatusMessage, setActiveTowerId]);

  const getSellValue = useCallback((towerId: string) => engine.getTowerSellValue(towerId), [engine]);

  const value = useMemo(
    () => ({
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
      setStatusMessage
    }),
    [
      engine,
      snapshot,
      selectedTower,
      activeTowerId,
      statusMessage,
      upgradeTower,
      convertWallTower,
      getWallConversionCost,
      sellTower,
      getSellValue
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = (): GameContextValue => {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error("useGame must be used within GameProvider");
  }
  return ctx;
};

