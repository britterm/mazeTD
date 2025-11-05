import { useCallback, useEffect, useMemo, useRef } from "react";
import { WorldPoint, TowerType } from "../core/types";
import { HexCoord } from "../core/topology/hexTopology";
import { useGame } from "../game/GameProvider";
import { GameSnapshot } from "../game/GameEngine";
import { towerDefinitionMap } from "../game/config/towers";
import { enemyDefinitionMap } from "../game/config/enemies";
import { GridCellVariant } from "../core/grid/GridBlueprint";
import { createCrawlerSpriteSheet, type CrawlerSpriteSheet, type HexDirectionKey } from "./sprites/crawler";
import { createSkitterSpriteSheet } from "./sprites/skitter";
import { createBruteSpriteSheet } from "./sprites/brute";
import { createColossusSpriteSheet } from "./sprites/colossus";

type DirectionalSpriteSheet = CrawlerSpriteSheet;

interface CanvasTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
  pixelRatio: number;
}

const SQRT3 = Math.sqrt(3);

const TOWER_COLOR_PALETTE: Record<TowerType, string[]> = {
  wall: ['#6c757d', '#7f8996', '#8a94a1'],
  lightning: ['#c76dff', '#a153ff', '#7b3bed'],
  fire: ['#ff7849', '#ff5c2e', '#ff4314'],
  ice: ['#7ff0ff', '#49d4ff', '#17c2ff'],
  earth: ['#c8a35a', '#b88f3f', '#a87d2b']
};

const ENEMY_STYLES = {
  grunt: { fill: '#68e365', stroke: '#1d6327', shape: 'circle', size: 1.0 },
  runner: { fill: '#4ad7ff', stroke: '#126c86', shape: 'triangle', size: 0.95 },
  brute: { fill: '#ff7b6b', stroke: '#7c241b', shape: 'square', size: 1.2 },
  swarm: { fill: '#f8a1ff', stroke: '#8a2ca8', shape: 'diamond', size: 0.8 },
  boss: { fill: '#ffa938', stroke: '#7a4508', shape: 'hex', size: 1.6 }
} as const;

type EnemyAnimationState = {
  lastX: number;
  lastY: number;
  direction: HexDirectionKey;
  frameIndex: number;
  accumulated: number;
};

const HEX_DIRECTION_ORDER: HexDirectionKey[] = ["n", "ne", "se", "s", "sw", "nw"];
const HEX_DIRECTION_VECTORS: Record<HexDirectionKey, { x: number; y: number }> = {
  n: { x: 0, y: -1 },
  ne: { x: 0.8660254037844387, y: -0.5 },
  se: { x: 0.8660254037844387, y: 0.5 },
  s: { x: 0, y: 1 },
  sw: { x: -0.8660254037844387, y: 0.5 },
  nw: { x: -0.8660254037844387, y: -0.5 }
};

export const GameCanvas = () => {
  const { engine, snapshot, selectedTower, setSelectedTower, setStatusMessage, activeTowerId, setActiveTowerId, setActiveTerrain } = useGame();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const snapshotRef = useRef<GameSnapshot<any>>(snapshot as GameSnapshot<any>);
  const transformRef = useRef<CanvasTransform | null>(null);
  const rangeAlphaRef = useRef(1);
  const activeTowerIdRef = useRef<string | null>(null);
  const enemyAnimationRef = useRef<Map<string, EnemyAnimationState>>(new Map());
  const lastFrameTimeRef = useRef<number>(typeof performance !== "undefined" ? performance.now() : Date.now());
  const crawlerSpriteRef = useRef<DirectionalSpriteSheet | null>(null);
  const skitterSpriteRef = useRef<DirectionalSpriteSheet | null>(null);
  const bruteSpriteRef = useRef<DirectionalSpriteSheet | null>(null);
  const colossusSpriteRef = useRef<DirectionalSpriteSheet | null>(null);

  const boardCells = useMemo(() => engine.getBoardCells(), [engine]);
  const boardPoints = useMemo(() => boardCells.map((cell) => engine.toWorld(cell)), [boardCells, engine]);
  const bounds = useMemo(() => computeWorldBounds(boardPoints), [boardPoints]);

  useEffect(() => {
    if (!crawlerSpriteRef.current) {
      const sheet = createCrawlerSpriteSheet();
      if (sheet) {
        crawlerSpriteRef.current = sheet;
      }
    }
    if (!skitterSpriteRef.current) {
      const sheet = createSkitterSpriteSheet();
      if (sheet) {
        skitterSpriteRef.current = sheet;
      }
    }
    if (!bruteSpriteRef.current) {
      const sheet = createBruteSpriteSheet();
      if (sheet) {
        bruteSpriteRef.current = sheet;
      }
    }
    if (!colossusSpriteRef.current) {
      const sheet = createColossusSpriteSheet();
      if (sheet) {
        colossusSpriteRef.current = sheet;
      }
    }
  }, []);

  useEffect(() => {
    snapshotRef.current = snapshot as GameSnapshot<unknown>;
  }, [snapshot]);

  useEffect(() => {
    activeTowerIdRef.current = activeTowerId;
  }, [activeTowerId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const resizeCanvas = () => {
      const ratio = window.devicePixelRatio || 1;
      const width = canvas.clientWidth * ratio;
      const height = canvas.clientHeight * ratio;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const snap = snapshotRef.current;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const lastFrame = lastFrameTimeRef.current;
    const delta = Math.min(100, Math.max(0, now - lastFrame));
    lastFrameTimeRef.current = now;
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth * ratio;
    const height = canvas.clientHeight * ratio;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const padding = engine.getCellRadius() * 4;
    const worldWidth = bounds.maxX - bounds.minX + padding * 2;
    const worldHeight = bounds.maxY - bounds.minY + padding * 2;
    const scale = Math.min(width / worldWidth, height / worldHeight);
    const offsetX = width / 2 - ((bounds.minX + bounds.maxX) / 2) * scale;
    const offsetY = height / 2 - ((bounds.minY + bounds.maxY) / 2) * scale;

    transformRef.current = { scale, offsetX, offsetY, pixelRatio: ratio };

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#0c1018";
    ctx.fillRect(0, 0, width, height);

    const rangeTarget = snap.mode === "build" ? 1 : 0;
    rangeAlphaRef.current += (rangeTarget - rangeAlphaRef.current) * 0.12;
    if (rangeAlphaRef.current < 0.001 && rangeTarget === 0) {
      rangeAlphaRef.current = 0;
    }
    const rangeAlpha = Math.max(0, Math.min(1, rangeAlphaRef.current));
    const activeId = activeTowerIdRef.current;

    drawCells(ctx, boardCells, snap.path, engine, scale, offsetX, offsetY);
    drawCore(ctx, snap.core, engine.getCellRadius(), scale, offsetX, offsetY);
    drawTowers(ctx, snap, engine, scale, offsetX, offsetY, activeId ?? null, rangeAlpha);
    drawEffects(ctx, snap.effects, scale, offsetX, offsetY, now);
    drawEnemies(
      ctx,
      snap,
      scale,
      offsetX,
      offsetY,
      delta,
      enemyAnimationRef.current,
      crawlerSpriteRef.current,
      skitterSpriteRef.current,
      bruteSpriteRef.current,
      colossusSpriteRef.current
    );
    drawProjectiles(ctx, snap, scale, offsetX, offsetY);
  }, [boardCells, bounds, engine]);

  useEffect(() => {
    let frame = 0;
    const loop = () => {
      renderFrame();
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [renderFrame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      const transform = transformRef.current;
      if (!transform) {
        return;
      }

      const snap = snapshotRef.current;

      const rect = canvas.getBoundingClientRect();
      const screenX = (event.clientX - rect.left) * transform.pixelRatio;
      const screenY = (event.clientY - rect.top) * transform.pixelRatio;
      const worldPoint = {
        x: (screenX - transform.offsetX) / transform.scale,
        y: (screenY - transform.offsetY) / transform.scale
      };

      const coord = engine.fromWorld(worldPoint);
      if (!coord) {
        setActiveTerrain(null);
        if (activeTowerIdRef.current) {
          setActiveTowerId(null);
          setStatusMessage(null);
        } else if (selectedTower) {
          setStatusMessage("Invalid placement");
        } else {
          setStatusMessage(null);
        }
        return;
      }

      const variant = engine.getCellVariant(coord as never);
      const coordKey = engine.keyOf(coord);
      const towerAt = snap.towers.find((tower) => engine.keyOf(tower.coord) === coordKey);
      if (towerAt) {
        setSelectedTower(null);
        setActiveTowerId(towerAt.id);
        setStatusMessage(null);
        setActiveTerrain(null);
        return;
      }

      if (variant === 'clearable') {
        setSelectedTower(null);
        setActiveTowerId(null);
        setStatusMessage(null);
        setActiveTerrain(coord as HexCoord);
        return;
      }

      if (snap.mode !== "build") {
        setStatusMessage("Build between waves");
        setActiveTerrain(null);
        return;
      }

      if (!selectedTower) {
        setActiveTowerId(null);
        setActiveTerrain(null);
        setStatusMessage("Select a tower to place");
        return;
      }

      const result = engine.placeTower(coord as never, selectedTower);
      if (!result.success) {
        setStatusMessage(result.reason ?? "Cannot place tower");
      } else {
        setStatusMessage(null);
        setActiveTerrain(null);
        if (result.towerId) {
          setActiveTowerId(result.towerId);
        }
      }
    };

    canvas.addEventListener("click", handleClick);
    return () => canvas.removeEventListener("click", handleClick);
  }, [engine, selectedTower, setStatusMessage, setActiveTowerId, setSelectedTower]);

  return <canvas ref={canvasRef} className="game-canvas" />;
};

const computeWorldBounds = (points: WorldPoint[]) => {
  if (points.length === 0) {
    return { minX: -1, maxX: 1, minY: -1, maxY: 1 };
  }
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys)
  };
};

const drawCore = (
  ctx: CanvasRenderingContext2D,
  core: { position: WorldPoint; health: number; maxHealth: number },
  cellRadius: number,
  scale: number,
  offsetX: number,
  offsetY: number
) => {
  const world = core.position;
  const screenX = world.x * scale + offsetX;
  const screenY = world.y * scale + offsetY;
  const radius = cellRadius * scale * 0.95;

  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 3) * i;
    const px = screenX + Math.cos(angle) * radius;
    const py = screenY + Math.sin(angle) * radius;
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  ctx.fillStyle = "#331f3f";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#ffb347";
  ctx.stroke();

  const innerRadius = radius * 0.6;
  const ratio = core.maxHealth > 0 ? Math.max(0, core.health / core.maxHealth) : 0;
  ctx.beginPath();
  ctx.arc(screenX, screenY, innerRadius, 0, Math.PI * 2);
  const gradient = ctx.createRadialGradient(screenX, screenY, innerRadius * 0.2, screenX, screenY, innerRadius);
  gradient.addColorStop(0, "#ffe8a1");
  gradient.addColorStop(Math.min(1, ratio + 0.05), "#ffe8a1");
  gradient.addColorStop(Math.min(1, ratio + 0.2), "#ff9f4a");
  gradient.addColorStop(1, "#652439");
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.restore();
};

const CELL_STYLE_MAP: Record<GridCellVariant, { fill: string; stroke: string; pathFill?: string; pathStroke?: string }> = {
  default: { fill: '#1c2430', stroke: '#2f3b4c', pathFill: '#29344f', pathStroke: '#4d6d9a' },
  'hole': { fill: '#080c16', stroke: '#192030' },
  'clearable': { fill: '#2f3c4f', stroke: '#4a5970' },
  'water': { fill: '#142a3f', stroke: '#2e5b86', pathFill: '#1e3f60', pathStroke: '#3d6a94' }
};

const getCellColors = (variant: GridCellVariant, isPath: boolean): { fill: string; stroke: string } => {
  const style = CELL_STYLE_MAP[variant] ?? CELL_STYLE_MAP.default;
  if (isPath) {
    const fill = style.pathFill ?? CELL_STYLE_MAP.default.pathFill ?? '#29344f';
    const stroke = style.pathStroke ?? CELL_STYLE_MAP.default.pathStroke ?? '#4d6d9a';
    return { fill, stroke };
  }
  return { fill: style.fill, stroke: style.stroke };
};

const traceHex = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 3) * i;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
};

const drawVariantOverlay = (ctx: CanvasRenderingContext2D, variant: GridCellVariant, x: number, y: number, radius: number) => {
  switch (variant) {
    case 'hole': {
      ctx.save();
      ctx.beginPath();
      traceHex(ctx, x, y, radius * 0.55);
      ctx.fillStyle = '#040610';
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'clearable': {
      ctx.save();
      ctx.beginPath();
      traceHex(ctx, x, y, radius * 0.6);
      ctx.strokeStyle = '#a9c0e6';
      ctx.lineWidth = Math.max(1.4, radius * 0.24);
      ctx.setLineDash([Math.max(3, radius * 0.6), Math.max(2, radius * 0.35)]);
      ctx.globalAlpha = 0.75;
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'water': {
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      traceHex(ctx, x, y, radius * 0.6);
      ctx.strokeStyle = '#3d7abf';
      ctx.lineWidth = Math.max(1.2, radius * 0.18);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.32, 0, Math.PI * 2);
      ctx.lineWidth = Math.max(0.8, radius * 0.12);
      ctx.stroke();
      ctx.restore();
      break;
    }
    default:
      break;
  }
};

const drawCells = (
  ctx: CanvasRenderingContext2D,
  cells: any[],
  path: any[] | undefined,
  engine: {
    toWorld: (coord: any) => WorldPoint;
    getCellRadius: () => number;
    keyOf: (coord: any) => string;
    getCellVariant: (coord: any) => GridCellVariant;
  },
  scale: number,
  offsetX: number,
  offsetY: number
) => {
  const radius = engine.getCellRadius() * scale * 0.95;
  const pathKeys = new Set((path ?? []).map((coord) => engine.keyOf(coord)));
  for (const cell of cells) {
    const world = engine.toWorld(cell);
    const screenX = world.x * scale + offsetX;
    const screenY = world.y * scale + offsetY;
    const isPath = pathKeys.has(engine.keyOf(cell));
    const variant = engine.getCellVariant ? engine.getCellVariant(cell) : ('default' as GridCellVariant);
    const colors = getCellColors(variant, isPath);

    ctx.beginPath();
    traceHex(ctx, screenX, screenY, radius);

    ctx.fillStyle = colors.fill;
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    drawVariantOverlay(ctx, variant, screenX, screenY, radius);
  }
};

const drawEffects = (
  ctx: CanvasRenderingContext2D,
  effects: Array<{
    type: string;
    origin: WorldPoint;
    target?: WorldPoint;
    radius?: number;
    color?: string;
    createdAt: number;
    duration: number;
  }>,
  scale: number,
  offsetX: number,
  offsetY: number,
  now: number
) => {
  for (const effect of effects) {
    const elapsed = now - effect.createdAt;
    if (elapsed >= effect.duration) {
      continue;
    }
    const alpha = Math.max(0, 1 - elapsed / effect.duration);

    if (effect.type === "lightning" && effect.target) {
      const originX = effect.origin.x * scale + offsetX;
      const originY = effect.origin.y * scale + offsetY;
      const targetX = effect.target.x * scale + offsetX;
      const targetY = effect.target.y * scale + offsetY;
      const primary = effect.color ?? "#9de6ff";
      const secondary = effect.color ? effect.color : "#d8f3ff";

      ctx.save();
      ctx.globalAlpha = alpha * 0.9;
      ctx.strokeStyle = primary;
      ctx.lineWidth = 4;
      ctx.shadowColor = primary;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(targetX, targetY);
      ctx.stroke();

      ctx.lineWidth = 2;
      ctx.shadowBlur = 0;
      ctx.globalAlpha = alpha * 0.6;
      ctx.strokeStyle = secondary;
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(targetX, targetY);
      ctx.stroke();
      ctx.restore();
      continue;
    }

    if (effect.type === "splash" && effect.radius) {
      const radius = effect.radius * scale;
      const color = effect.color ?? "#ff6b5a";
      const centerX = effect.origin.x * scale + offsetX;
      const centerY = effect.origin.y * scale + offsetY;

      ctx.save();
      ctx.globalAlpha = alpha * 0.25;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.globalAlpha = alpha * 0.45;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
};

const drawTowers = (
  ctx: CanvasRenderingContext2D,
  snapshot: GameSnapshot<any>,
  engine: { toWorld: (coord: any) => WorldPoint; getCellRadius: () => number; keyOf?: (coord: any) => string },
  scale: number,
  offsetX: number,
  offsetY: number,
  activeTowerId: string | null,
  rangeAlpha: number
) => {
  const cellRadius = engine.getCellRadius();
  const sizeByLevel = [0.72, 0.82, 0.92];

  for (const tower of snapshot.towers) {
    const world = engine.toWorld(tower.coord);
    const screenX = world.x * scale + offsetX;
    const screenY = world.y * scale + offsetY;
    const towerId = tower.type as TowerType;
    const isActive = activeTowerId === tower.id;

    const def = towerDefinitionMap.get(towerId);
    const levelConfig = def?.levels.find((lvl) => lvl.level === tower.level);
    const baseRange = levelConfig?.range ?? 0;
    const rangeCells = baseRange ?? 0;

    const palette = TOWER_COLOR_PALETTE[towerId] ?? ['#ffffff'];
    const levelIndex = Math.max(0, Math.min((tower.level ?? 1) - 1, palette.length - 1));
    const bodyColor = palette[levelIndex];
    const auraColor = palette[0] ?? bodyColor;

    const sizeFactor = sizeByLevel[Math.min(levelIndex, sizeByLevel.length - 1)];
    const bodySize = cellRadius * scale * sizeFactor;

    if (rangeAlpha > 0.01 && rangeCells > 0) {
      const worldRadius = rangeCells * cellRadius * SQRT3;
      const screenRadius = worldRadius * scale;
      ctx.save();
      const fillAlpha = rangeAlpha * (isActive ? 0.08 : 0.04);
      ctx.globalAlpha = fillAlpha;
      ctx.fillStyle = auraColor;
      ctx.beginPath();
      ctx.arc(screenX, screenY, screenRadius, 0, Math.PI * 2);
      ctx.fill();
      const strokeAlpha = rangeAlpha * (isActive ? 0.26 : 0.09);
      ctx.globalAlpha = strokeAlpha;
      ctx.lineWidth = isActive ? 3 : 2;
      ctx.strokeStyle = auraColor;
      ctx.beginPath();
      ctx.arc(screenX, screenY, screenRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = isActive ? '#fbe277' : '#0f141f';
    ctx.lineWidth = isActive ? 3 : 2;
    ctx.beginPath();
    ctx.rect(screenX - bodySize / 2, screenY - bodySize / 2, bodySize, bodySize);
    ctx.fill();
    ctx.stroke();

    if (isActive) {
      ctx.save();
      ctx.strokeStyle = '#fbe277';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(screenX, screenY, bodySize * 0.82, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
};


const drawEnemies = (
  ctx: CanvasRenderingContext2D,
  snapshot: GameSnapshot<any>,
  scale: number,
  offsetX: number,
  offsetY: number,
  deltaMs: number,
  animationStates: Map<string, EnemyAnimationState>,
  crawlerSprite: DirectionalSpriteSheet | null,
  skitterSprite: DirectionalSpriteSheet | null,
  bruteSprite: DirectionalSpriteSheet | null,
  colossusSprite: DirectionalSpriteSheet | null
) => {
  const baseSize = 12 * scale;
  const activeSpriteIds: string[] = [];

  for (const enemy of snapshot.enemies) {
    const screenX = enemy.position.x * scale + offsetX;
    const screenY = enemy.position.y * scale + offsetY;
    const def = enemyDefinitionMap.get(enemy.enemyId);
    const category = (def?.category ?? 'grunt') as keyof typeof ENEMY_STYLES;
    const style = ENEMY_STYLES[category] ?? ENEMY_STYLES.grunt;
    const sizeFactor = style.size * (def?.size ?? 1);
    let size = baseSize * sizeFactor;
    if (enemy.enemyId === "crawler") {
      size *= 2;
    }
    const half = size / 2;

    let drewSprite = false;

    let sprite: DirectionalSpriteSheet | null = null;
    if (enemy.enemyId === "crawler") {
      sprite = crawlerSprite;
    } else if (enemy.enemyId === "swarm") {
      sprite = skitterSprite;
    } else if (enemy.enemyId === "brute") {
      sprite = bruteSprite;
    } else if (enemy.enemyId === "colossus") {
      sprite = colossusSprite;
    }

    if (sprite && sprite.image && sprite.isLoaded()) {
      activeSpriteIds.push(enemy.id);
      drewSprite = drawDirectionalSprite(
        ctx,
        enemy,
        screenX,
        screenY,
        size,
        deltaMs,
        animationStates,
        sprite
      );
    }

    if (!drewSprite) {
      ctx.save();
      ctx.fillStyle = style.fill;
      ctx.strokeStyle = style.stroke;
      ctx.lineWidth = 2;
      drawEnemyPrimitive(ctx, screenX, screenY, size, half, style.shape);
      ctx.restore();
    }

    const maxHealth = enemy.maxHealth > 0 ? enemy.maxHealth : 1;
    const healthRatio = Math.max(0, Math.min(1, enemy.health / maxHealth));
    if (healthRatio < 0.999) {
      const barWidth = size;
      const barHeight = Math.max(4, size * 0.18);
      ctx.fillStyle = '#1a1d29';
      ctx.fillRect(screenX - barWidth / 2, screenY - half - barHeight - 4, barWidth, barHeight);
      ctx.fillStyle = '#4cff82';
      ctx.fillRect(
        screenX - barWidth / 2,
        screenY - half - barHeight - 4,
        barWidth * healthRatio,
        barHeight
      );
    }
  }

  if (animationStates.size > 0) {
    const activeSet = new Set(activeSpriteIds);
    for (const key of Array.from(animationStates.keys())) {
      if (!activeSet.has(key)) {
        animationStates.delete(key);
      }
    }
  }
};

const drawEnemyPrimitive = (
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  size: number,
  half: number,
  shape: typeof ENEMY_STYLES[keyof typeof ENEMY_STYLES]["shape"]
) => {
  switch (shape) {
    case 'triangle': {
      ctx.beginPath();
      ctx.moveTo(screenX, screenY - half);
      ctx.lineTo(screenX + half, screenY + half);
      ctx.lineTo(screenX - half, screenY + half);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'diamond': {
      ctx.beginPath();
      ctx.moveTo(screenX, screenY - half);
      ctx.lineTo(screenX + half, screenY);
      ctx.lineTo(screenX, screenY + half);
      ctx.lineTo(screenX - half, screenY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'square': {
      ctx.beginPath();
      ctx.rect(screenX - half, screenY - half, size, size);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'hex': {
      ctx.beginPath();
      for (let i = 0; i < 6; i += 1) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const x = screenX + half * Math.cos(angle);
        const y = screenY + half * Math.sin(angle);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'circle':
    default: {
      ctx.beginPath();
      ctx.arc(screenX, screenY, half, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }
  }
};

const drawDirectionalSprite = (
  ctx: CanvasRenderingContext2D,
  enemy: GameSnapshot<any>["enemies"][number],
  screenX: number,
  screenY: number,
  size: number,
  deltaMs: number,
  animationStates: Map<string, EnemyAnimationState>,
  sprite: DirectionalSpriteSheet
): boolean => {
  if (!sprite.image) {
    return false;
  }

  const threshold = 0.0001;
  const existing = animationStates.get(enemy.id);
  const defaultDirection: HexDirectionKey = existing?.direction ?? 'n';
  const state: EnemyAnimationState = existing
    ? { ...existing }
    : {
        lastX: enemy.position.x,
        lastY: enemy.position.y,
        direction: defaultDirection,
        frameIndex: 0,
        accumulated: 0
      };

  const dx = enemy.position.x - state.lastX;
  const dy = enemy.position.y - state.lastY;
  const distanceSq = dx * dx + dy * dy;

  if (distanceSq > threshold) {
    state.direction = resolveHexDirection(dx, dy, state.direction);
    state.accumulated += deltaMs;
    const frames = sprite.frames[state.direction] ?? [];
    const frameCount = frames.length;
    if (frameCount > 0) {
      while (state.accumulated >= sprite.frameDuration) {
        state.accumulated -= sprite.frameDuration;
        state.frameIndex = (state.frameIndex + 1) % frameCount;
      }
    }
  } else {
    state.accumulated = 0;
    state.frameIndex = 0;
  }

  state.lastX = enemy.position.x;
  state.lastY = enemy.position.y;
  animationStates.set(enemy.id, state);

  const frames = sprite.frames[state.direction] ?? [];
  if (frames.length === 0) {
    return false;
  }
  const frame = frames[state.frameIndex] ?? frames[0];
  if (!frame) {
    return false;
  }

  const spriteScale = size / frame.w;
  const drawWidth = frame.w * spriteScale;
  const drawHeight = frame.h * spriteScale;
  const pivotX = sprite.pivot.x * spriteScale;
  const pivotY = sprite.pivot.y * spriteScale;

  const previousSmoothing = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    sprite.image,
    frame.x,
    frame.y,
    frame.w,
    frame.h,
    screenX - pivotX,
    screenY - pivotY,
    drawWidth,
    drawHeight
  );
  ctx.imageSmoothingEnabled = previousSmoothing;

  return true;
};

const resolveHexDirection = (dx: number, dy: number, fallback: HexDirectionKey): HexDirectionKey => {
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) {
    return fallback;
  }

  const magnitude = Math.hypot(dx, dy);
  if (magnitude < 1e-5) {
    return fallback;
  }

  const vx = dx / magnitude;
  const vy = dy / magnitude;

  let bestDirection: HexDirectionKey = fallback;
  let bestScore = -Infinity;

  for (const direction of HEX_DIRECTION_ORDER) {
    const vector = HEX_DIRECTION_VECTORS[direction];
    const score = vx * vector.x + vy * vector.y;
    if (score > bestScore) {
      bestScore = score;
      bestDirection = direction;
    }
  }

  if (bestDirection !== fallback) {
    const currentVector = HEX_DIRECTION_VECTORS[fallback];
    if (currentVector) {
      const currentScore = vx * currentVector.x + vy * currentVector.y;
      if (currentScore + 0.1 >= bestScore) {
        return fallback;
      }
    }
  }

  return bestDirection;
};

const drawProjectiles = (
  ctx: CanvasRenderingContext2D,
  snapshot: GameSnapshot<any>,
  scale: number,
  offsetX: number,
  offsetY: number
) => {
  const towerColors = new Map<string, string>();
  for (const tower of snapshot.towers) {
    const palette = TOWER_COLOR_PALETTE[tower.type as TowerType] ?? ['#f5f7ff'];
    const index = Math.max(0, Math.min((tower.level ?? 1) - 1, palette.length - 1));
    towerColors.set(tower.id, palette[index]);
  }

  for (const projectile of snapshot.projectiles) {
    const screenX = projectile.position.x * scale + offsetX;
    const screenY = projectile.position.y * scale + offsetY;
    const color = towerColors.get(projectile.towerId) ?? '#f5f7ff';
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(screenX, screenY, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
};


