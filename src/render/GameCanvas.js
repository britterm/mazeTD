import { jsx as _jsx } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useGame } from "../game/GameProvider";
import { towerDefinitionMap } from "../game/config/towers";
import { enemyDefinitionMap } from "../game/config/enemies";
import { createCrawlerSpriteSheet } from "./sprites/crawler";
import { createSkitterSpriteSheet } from "./sprites/skitter";
import { createBruteSpriteSheet } from "./sprites/brute";
import { createColossusSpriteSheet } from "./sprites/colossus";
const SQRT3 = Math.sqrt(3);
const TOWER_COLOR_PALETTE = {
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
};
const HEX_DIRECTION_ORDER = ["n", "ne", "se", "s", "sw", "nw"];
const HEX_DIRECTION_VECTORS = {
    n: { x: 0, y: -1 },
    ne: { x: 0.8660254037844387, y: -0.5 },
    se: { x: 0.8660254037844387, y: 0.5 },
    s: { x: 0, y: 1 },
    sw: { x: -0.8660254037844387, y: 0.5 },
    nw: { x: -0.8660254037844387, y: -0.5 }
};
export const GameCanvas = () => {
    const { engine, snapshot, selectedTower, setSelectedTower, setStatusMessage, activeTowerId, setActiveTowerId, setActiveTerrain } = useGame();
    const canvasRef = useRef(null);
    const snapshotRef = useRef(snapshot);
    const transformRef = useRef(null);
    const rangeAlphaRef = useRef(1);
    const activeTowerIdRef = useRef(null);
    const enemyAnimationRef = useRef(new Map());
    const lastFrameTimeRef = useRef(typeof performance !== "undefined" ? performance.now() : Date.now());
    const crawlerSpriteRef = useRef(null);
    const skitterSpriteRef = useRef(null);
    const bruteSpriteRef = useRef(null);
    const colossusSpriteRef = useRef(null);
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
        snapshotRef.current = snapshot;
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
        drawEnemies(ctx, snap, scale, offsetX, offsetY, delta, enemyAnimationRef.current, crawlerSpriteRef.current, skitterSpriteRef.current, bruteSpriteRef.current, colossusSpriteRef.current);
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
        const handleClick = (event) => {
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
                }
                else if (selectedTower) {
                    setStatusMessage("Invalid placement");
                }
                else {
                    setStatusMessage(null);
                }
                return;
            }
            const variant = engine.getCellVariant(coord);
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
                setActiveTerrain(coord);
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
            const result = engine.placeTower(coord, selectedTower);
            if (!result.success) {
                setStatusMessage(result.reason ?? "Cannot place tower");
            }
            else {
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
    return _jsx("canvas", { ref: canvasRef, className: "game-canvas" });
};
const computeWorldBounds = (points) => {
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
const drawCore = (ctx, core, cellRadius, scale, offsetX, offsetY) => {
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
        }
        else {
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
const CELL_STYLE_MAP = {
    default: { fill: '#1c2430', stroke: '#2f3b4c', pathFill: '#29344f', pathStroke: '#4d6d9a' },
    'hole': { fill: '#080c16', stroke: '#192030' },
    'clearable': { fill: '#2f3c4f', stroke: '#4a5970' },
    'water': { fill: '#142a3f', stroke: '#2e5b86', pathFill: '#1e3f60', pathStroke: '#3d6a94' }
};
const getCellColors = (variant, isPath) => {
    const style = CELL_STYLE_MAP[variant] ?? CELL_STYLE_MAP.default;
    if (isPath) {
        const fill = style.pathFill ?? CELL_STYLE_MAP.default.pathFill ?? '#29344f';
        const stroke = style.pathStroke ?? CELL_STYLE_MAP.default.pathStroke ?? '#4d6d9a';
        return { fill, stroke };
    }
    return { fill: style.fill, stroke: style.stroke };
};
const traceHex = (ctx, x, y, radius) => {
    for (let i = 0; i < 6; i += 1) {
        const angle = (Math.PI / 3) * i;
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius;
        if (i === 0) {
            ctx.moveTo(px, py);
        }
        else {
            ctx.lineTo(px, py);
        }
    }
    ctx.closePath();
};
const drawVariantOverlay = (ctx, variant, x, y, radius) => {
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
const drawCells = (ctx, cells, path, engine, scale, offsetX, offsetY) => {
    const radius = engine.getCellRadius() * scale * 0.95;
    const pathKeys = new Set((path ?? []).map((coord) => engine.keyOf(coord)));
    for (const cell of cells) {
        const world = engine.toWorld(cell);
        const screenX = world.x * scale + offsetX;
        const screenY = world.y * scale + offsetY;
        const isPath = pathKeys.has(engine.keyOf(cell));
        const variant = engine.getCellVariant ? engine.getCellVariant(cell) : 'default';
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
const drawEffects = (ctx, effects, scale, offsetX, offsetY, now) => {
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
const drawTowers = (ctx, snapshot, engine, scale, offsetX, offsetY, activeTowerId, rangeAlpha) => {
    const cellRadius = engine.getCellRadius();
    const sizeByLevel = [0.72, 0.82, 0.92];
    for (const tower of snapshot.towers) {
        const world = engine.toWorld(tower.coord);
        const screenX = world.x * scale + offsetX;
        const screenY = world.y * scale + offsetY;
        const towerId = tower.type;
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
const drawEnemies = (ctx, snapshot, scale, offsetX, offsetY, deltaMs, animationStates, crawlerSprite, skitterSprite, bruteSprite, colossusSprite) => {
    const baseSize = 12 * scale;
    const activeSpriteIds = [];
    for (const enemy of snapshot.enemies) {
        const screenX = enemy.position.x * scale + offsetX;
        const screenY = enemy.position.y * scale + offsetY;
        const def = enemyDefinitionMap.get(enemy.enemyId);
        const category = (def?.category ?? 'grunt');
        const style = ENEMY_STYLES[category] ?? ENEMY_STYLES.grunt;
        const sizeFactor = style.size * (def?.size ?? 1);
        let size = baseSize * sizeFactor;
        if (enemy.enemyId === "crawler") {
            size *= 2;
        }
        const half = size / 2;
        let drewSprite = false;
        let sprite = null;
        if (enemy.enemyId === "crawler") {
            sprite = crawlerSprite;
        }
        else if (enemy.enemyId === "swarm") {
            sprite = skitterSprite;
        }
        else if (enemy.enemyId === "brute") {
            sprite = bruteSprite;
        }
        else if (enemy.enemyId === "colossus") {
            sprite = colossusSprite;
        }
        if (sprite && sprite.image && sprite.isLoaded()) {
            activeSpriteIds.push(enemy.id);
            drewSprite = drawDirectionalSprite(ctx, enemy, screenX, screenY, size, deltaMs, animationStates, sprite);
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
            ctx.fillRect(screenX - barWidth / 2, screenY - half - barHeight - 4, barWidth * healthRatio, barHeight);
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
const drawEnemyPrimitive = (ctx, screenX, screenY, size, half, shape) => {
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
                }
                else {
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
const drawDirectionalSprite = (ctx, enemy, screenX, screenY, size, deltaMs, animationStates, sprite) => {
    if (!sprite.image) {
        return false;
    }
    const threshold = 0.0001;
    const existing = animationStates.get(enemy.id);
    const defaultDirection = existing?.direction ?? 'n';
    const state = existing
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
    }
    else {
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
    ctx.drawImage(sprite.image, frame.x, frame.y, frame.w, frame.h, screenX - pivotX, screenY - pivotY, drawWidth, drawHeight);
    ctx.imageSmoothingEnabled = previousSmoothing;
    return true;
};
const resolveHexDirection = (dx, dy, fallback) => {
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) {
        return fallback;
    }
    const magnitude = Math.hypot(dx, dy);
    if (magnitude < 1e-5) {
        return fallback;
    }
    const vx = dx / magnitude;
    const vy = dy / magnitude;
    let bestDirection = fallback;
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
const drawProjectiles = (ctx, snapshot, scale, offsetX, offsetY) => {
    const towerColors = new Map();
    for (const tower of snapshot.towers) {
        const palette = TOWER_COLOR_PALETTE[tower.type] ?? ['#f5f7ff'];
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
