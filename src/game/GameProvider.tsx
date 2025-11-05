import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createHexTopology, HexCoord } from "../core/topology/hexTopology";
import { GridManager } from "../core/grid/GridManager";
import { GameEngine, GameSnapshot } from "./GameEngine";
import { useAnimationFrame } from "../hooks/useAnimationFrame";
import speedConfig from "../data/game-speed.json";
import { createLevelBlueprint, staticLevelSettings, LevelDefinition } from "./config/levels";
import { waveSchedule } from "./config/enemies";

type SpeedOptionConfig = {
  label?: string;
  multiplier?: number;
  enabled?: boolean;
};

type SpeedOption = {
  label: string;
  value: number;
};

interface SpeedConfigFile {
  speedOptions?: SpeedOptionConfig[];
}

interface StoredProgress {
  unlockedLevelIndex: number;
  bestScores: Record<string, number>;
}

interface LevelSummary extends LevelDefinition {
  bestScore: number;
  unlocked: boolean;
  completed: boolean;
}

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
  gameSpeed: number;
  setGameSpeed: (speed: number) => void;
  gameSpeedOptions: SpeedOption[];
  highScore: number;
  phase: "title" | "playing";
  levels: LevelSummary[];
  currentLevel: LevelSummary | null;
  selectLevel: (levelId: string) => void;
  returnToTitle: () => void;
  activeTerrain: HexCoord | null;
  setActiveTerrain: (coord: HexCoord | null) => void;
  clearTerrain: (coord: HexCoord) => { success: boolean; reason?: string; towerId?: string };
  clearCost: number;
}

const PROGRESS_STORAGE_KEY = "mazeTD:level-progress";

const DEFAULT_PROGRESS: StoredProgress = { unlockedLevelIndex: 0, bestScores: {} };

const speedConfigData = (speedConfig as SpeedConfigFile) ?? {};
const configuredSpeedOptions = Array.isArray(speedConfigData.speedOptions) ? speedConfigData.speedOptions : [];

const GameContext = createContext<GameContextValue | undefined>(undefined);

const clampNumber = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const readStoredProgress = (maxLevels: number): StoredProgress => {
  if (typeof window === "undefined") {
    return DEFAULT_PROGRESS;
  }
  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_PROGRESS;
    }
    const parsed = JSON.parse(raw) as Partial<StoredProgress>;
    const unlocked = typeof parsed.unlockedLevelIndex === "number" ? parsed.unlockedLevelIndex : 0;
    const bestScores = typeof parsed.bestScores === "object" && parsed.bestScores ? parsed.bestScores : {};
    const stored = {
      unlockedLevelIndex: clampNumber(Math.floor(unlocked), 0, Math.max(0, maxLevels - 1)),
      bestScores
    };
    if (new URLSearchParams(window.location.search).get("winner") === "true") {
      return {
        unlockedLevelIndex: Math.max(0, maxLevels - 1),
        bestScores: stored.bestScores
      };
    }
    return stored;
  } catch {
    return DEFAULT_PROGRESS;
  }
};

const buildLevelSummaries = (definitions: LevelDefinition[], progress: StoredProgress): LevelSummary[] => {
  return definitions.map((definition, index) => {
    const bestScore = progress.bestScores[definition.id] ?? 0;
    const unlocked = index <= progress.unlockedLevelIndex;
    return {
      ...definition,
      bestScore,
      unlocked,
      completed: bestScore > 0
    };
  });
};

const createEngineForLevel = (
  level: LevelDefinition,
  topology: ReturnType<typeof createHexTopology>
): GameEngine<HexCoord> => {
  const blueprint = createLevelBlueprint(6, level);
  const gridManager = new GridManager(topology, blueprint);
  const waves = waveSchedule.slice(0, level.waves);
  return new GameEngine<HexCoord>({ topology, grid: gridManager, waves });
};

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const topology = useMemo(() => createHexTopology(34), []);
  const baseLevels = staticLevelSettings.levels;
  const [progress, setProgress] = useState<StoredProgress>(() => readStoredProgress(baseLevels.length));
  const levels = useMemo(() => buildLevelSummaries(baseLevels, progress), [baseLevels, progress]);

  const initialLevelIndex = clampNumber(progress.unlockedLevelIndex, 0, Math.max(0, baseLevels.length - 1));
  const initialLevelDefinition = baseLevels[initialLevelIndex] ?? baseLevels[0];

  const [engine, setEngine] = useState<GameEngine<HexCoord>>(() => createEngineForLevel(initialLevelDefinition, topology));
  const [snapshot, setSnapshot] = useState<GameSnapshot<HexCoord>>(engine.snapshot());
  const [selectedTower, setSelectedTower] = useState<string | null>("lightning");
  const [activeTowerId, setActiveTowerId] = useState<string | null>(null);
  const [activeTerrain, setActiveTerrain] = useState<HexCoord | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const speedOptions = useMemo<SpeedOption[]>(() => {
    const seen = new Set<number>();
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

  const defaultSpeed = speedOptions[0]?.value ?? 1;
  const [gameSpeed, setGameSpeed] = useState<number>(defaultSpeed);
  const [phase, setPhase] = useState<"title" | "playing">("title");
  const [currentLevelId, setCurrentLevelId] = useState<string>(initialLevelDefinition.id);

  const currentLevel = useMemo<LevelSummary | null>(
    () => levels.find((level) => level.id === currentLevelId) ?? levels[0] ?? null,
    [levels, currentLevelId]
  );

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).__MAZETD_DEBUG === undefined) {
      (window as any).__MAZETD_DEBUG = true;
    }
  }, []);

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

  useEffect(() => engine.subscribe(setSnapshot), [engine]);

  useEffect(() => {
    setActiveTerrain(null);
  }, [engine]);

  useEffect(() => {
    if (activeTowerId && !snapshot.towers.some((tower) => tower.id === activeTowerId)) {
      setActiveTowerId(null);
    }
  }, [snapshot, activeTowerId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // ignore persistence errors
    }
  }, [progress]);

  const prevModeRef = useRef(snapshot.mode);
  useEffect(() => {
    const previousMode = prevModeRef.current;
    if (previousMode !== snapshot.mode && snapshot.mode === "victory" && currentLevel) {
      const finalScore = Math.max(0, Math.floor(snapshot.score));
      setProgress((prev) => {
        const bestSoFar = prev.bestScores[currentLevel.id] ?? 0;
        const unlockedLevelIndex = clampNumber(
          Math.max(prev.unlockedLevelIndex, currentLevel.index + 1),
          0,
          Math.max(0, baseLevels.length - 1)
        );
        if (finalScore <= bestSoFar && unlockedLevelIndex === prev.unlockedLevelIndex) {
          return prev;
        }
        return {
          unlockedLevelIndex,
          bestScores: {
            ...prev.bestScores,
            [currentLevel.id]: Math.max(bestSoFar, finalScore)
          }
        };
      });
    }
    prevModeRef.current = snapshot.mode;
  }, [snapshot.mode, snapshot.score, currentLevel, baseLevels.length]);

  useAnimationFrame((dt) => {
    engine.tick(dt * Math.max(1, gameSpeed));
  });

  const applyGameSpeed = useCallback(
    (speed: number) => {
      if (speedOptions.some((option) => option.value === speed)) {
        setGameSpeed(speed);
      }
    },
    [speedOptions]
  );

  const clearTerrain = useCallback(
    (coord: HexCoord) => {
      const result = engine.clearTerrain(coord, staticLevelSettings.clearCost);
      if (!result.success) {
        if (result.reason) {
          setStatusMessage(result.reason);
        }
      } else {
        if (staticLevelSettings.clearCost > 0) {
          setStatusMessage(`Cleared for ${staticLevelSettings.clearCost} cr`);
        } else {
          setStatusMessage("Terrain cleared");
        }
        setActiveTerrain(null);
        if (result.towerId) {
          setActiveTowerId(result.towerId);
          setSelectedTower(null);
        }
      }
      return result;
    },
    [engine]
  );

  const selectLevel = useCallback(
    (levelId: string) => {
      const summary = levels.find((level) => level.id === levelId);
      if (!summary) {
        setStatusMessage("Level not found");
        return;
      }
      if (!summary.unlocked) {
        setStatusMessage("Level locked");
        return;
      }
      const definition = baseLevels.find((level) => level.id === levelId);
      if (!definition) {
        setStatusMessage("Level configuration missing");
        return;
      }
      const nextEngine = createEngineForLevel(definition, topology);
      setEngine(nextEngine);
      setSnapshot(nextEngine.snapshot());
      setSelectedTower("lightning");
      setActiveTowerId(null);
      setStatusMessage(null);
      setActiveTerrain(null);
      setCurrentLevelId(levelId);
      setPhase("playing");
    },
    [levels, baseLevels, topology]
  );

  const returnToTitle = useCallback(() => {
    setPhase("title");
    setSelectedTower(null);
    setActiveTowerId(null);
    setActiveTerrain(null);
    setStatusMessage(null);
  }, []);

  const upgradeTower = useCallback(
    (towerId: string) => {
      const result = engine.upgradeTower(towerId);
      if (!result.success && result.reason) {
        setStatusMessage(result.reason);
      } else if (result.success) {
        setStatusMessage(null);
      }
      return result;
    },
    [engine]
  );

  const convertWallTower = useCallback(
    (towerId: string, targetType: string) => {
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
    },
    [engine]
  );

  const getWallConversionCost = useCallback(
    (towerId: string, targetType: string) => engine.getWallConversionCost(towerId, targetType),
    [engine]
  );

  const sellTower = useCallback(
    (towerId: string) => {
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
    },
    [engine]
  );

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
      setStatusMessage,
      gameSpeed,
      setGameSpeed: applyGameSpeed,
      gameSpeedOptions: speedOptions,
      highScore: currentLevel?.bestScore ?? 0,
      phase,
      levels,
      currentLevel,
      selectLevel,
      returnToTitle,
      activeTerrain,
      setActiveTerrain,
      clearTerrain,
      clearCost: staticLevelSettings.clearCost
    }),
    [
      engine,
      snapshot,
      selectedTower,
      activeTowerId,
      upgradeTower,
      convertWallTower,
      getWallConversionCost,
      sellTower,
      getSellValue,
      statusMessage,
      gameSpeed,
      applyGameSpeed,
      speedOptions,
      currentLevel,
      phase,
      levels,
      selectLevel,
      returnToTitle,
      activeTerrain,
      clearTerrain
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