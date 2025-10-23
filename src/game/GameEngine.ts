import { GridManager } from "../core/grid/GridManager";
import { GridTopology } from "../core/topology/GridTopology";
import { towerDefinitionMap } from "./config/towers";
import economyConfig from "../data/economy.json";
import { enemyDefinitionMap, waveSchedule } from "./config/enemies";
import { defaultProgression, ProgressionConfig } from "./config/progression";
import { TowerDefinition, TowerInstance, TowerLevel } from "./entities/tower";
import { EnemyInstance, WaveDefinition } from "./entities/enemy";
import { WorldPoint } from "../core/types";

interface Projectile {
  id: string;
  towerId: string;
  targetId: string;
  position: WorldPoint;
  velocity: WorldPoint;
  damage: number;
  splashRadius?: number;
  slowFactor?: number;
  slowDuration?: number;
  stunDuration?: number;
  impactColor?: string;
  impactDuration?: number;
  lastDistance?: number;
}

type VisualEffectType = "lightning" | "splash";

const DEFAULT_INTEREST_RATE = 0.05;

type EconomyConfig = {
  interestRate?: number;
};

const economySettings = (economyConfig as EconomyConfig) ?? {};
const BASE_INTEREST_RATE = typeof economySettings.interestRate === "number" && economySettings.interestRate >= 0  ? economySettings.interestRate  : DEFAULT_INTEREST_RATE;

interface VisualEffect {
  id: string;
  type: VisualEffectType;
  origin: WorldPoint;
  target?: WorldPoint;
  radius?: number;
  color?: string;
  createdAt: number;
  duration: number;
}

interface SpawnTask {
  enemyId: string;
  remaining: number;
  spawnInterval: number;
  nextSpawnAt: number;
}

interface EnemyRuntime<Coord> extends EnemyInstance<Coord> {
  position: WorldPoint;
  slowedUntil: number;
  slowFactor: number;
  stunnedUntil: number;
  stunImmuneUntil: number;
  attackingCore: boolean;
  nextCoreAttackAt: number;
  coreSlot?: number;
  coreOffset?: WorldPoint;
}

interface TowerRuntime<Coord> extends TowerInstance<Coord> {
  worldPosition: WorldPoint;
}

export interface GameSnapshot<Coord> {
  mode: "build" | "combat" | "defeat";
  round: number;
  credits: number;
  coreHealth: number;
  maxCoreHealth: number;
  lives: number;
  score: number;
  interestBonus: { amount: number; createdAt: number; expiresAt: number } | null;
  log: Array<{ id: number; message: string; createdAt: number }>;
  path: Coord[];
  towers: Array<{
    id: string;
    type: string;
    level: number;
    coord: Coord;
  }>;
  enemies: Array<{
    id: string;
    enemyId: string;
    coord: Coord;
    position: WorldPoint;
    health: number;
    maxHealth: number;
  }>;
  projectiles: Projectile[];
  effects: VisualEffect[];
  core: { position: WorldPoint; health: number; maxHealth: number };
  upcomingWave: WaveDefinition | null;
}

interface GameOptions<Coord> {
  topology: GridTopology<Coord>;
  grid: GridManager<Coord>;
  progression?: ProgressionConfig;
  waves?: WaveDefinition[];
  startingCredits?: number;
  startingCoreHealth?: number;
}

interface GameState<Coord> {
  mode: "build" | "combat" | "defeat";
  round: number;
  credits: number;
  coreHealth: number;
  maxCoreHealth: number;
  lives: number;
  path: Coord[];
  towers: Map<string, TowerRuntime<Coord>>;
  enemies: Map<string, EnemyRuntime<Coord>>;
  projectiles: Map<string, Projectile>;
  effects: Map<string, VisualEffect>;
  nextTowerId: number;
  nextEnemyId: number;
  nextProjectileId: number;
  nextEffectId: number;
  lastInterestBonus?: { amount: number; createdAt: number; expiresAt: number };
  eventLog: Array<{ id: number; message: string; createdAt: number }>;
  nextLogId: number;
  currentWave?: {
    definition: WaveDefinition;
    tasks: SpawnTask[];
    elapsed: number;
  };
}

export class GameEngine<Coord> {
  private readonly topology: GridTopology<Coord>;
  private readonly grid: GridManager<Coord>;
  private readonly progression: ProgressionConfig;
  private readonly waves: WaveDefinition[];
  private readonly coreWorld: WorldPoint;
  private readonly interestRate = Math.max(0, BASE_INTEREST_RATE);

  private readonly duplicateTowerPremium = 5;
  private readonly wallConversionDiscount = 2;

  private state: GameState<Coord>;
  private listeners = new Set<(snapshot: GameSnapshot<Coord>) => void>();

  private debug = {
    enabled: false,
    misses: 0,
    hits: 0,
    maxMisses: 80,
    maxHits: 80
  };

  constructor(options: GameOptions<Coord>) {
    this.topology = options.topology;
    this.grid = options.grid;
    this.progression = options.progression ?? defaultProgression;
    this.waves = options.waves ?? waveSchedule;
    this.coreWorld = this.grid.toWorld(this.grid.goal);

    const globalRef = (typeof window !== "undefined" ? (window as any) : (globalThis as any));
    if (globalRef) {
      this.debug.enabled = Boolean(globalRef.__MAZETD_DEBUG ?? true);
      globalRef.__MAZETD_ENGINE = this;
    }

    const initialPath = this.grid.findPath();
    if (!initialPath) {
      throw new Error("Unable to find initial path - check board setup.");
    }

    this.state = {
      mode: "build",
      round: 1,
      credits: options.startingCredits ?? 250,
      coreHealth: options.startingCoreHealth ?? 20,
      maxCoreHealth: options.startingCoreHealth ?? 20,
      lives: options.startingCoreHealth ?? 20,
      path: initialPath,
      towers: new Map(),
      enemies: new Map(),
      projectiles: new Map(),
      effects: new Map(),
      nextTowerId: 1,
      nextEnemyId: 1,
      nextProjectileId: 1,
      nextEffectId: 1,
      lastInterestBonus: undefined,
      eventLog: [],
      nextLogId: 1
    };
  }

  subscribe(listener: (snapshot: GameSnapshot<Coord>) => void): () => void {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  enableDebug(flag: boolean): void {
    this.debug.enabled = flag;
  }

  resetDebugCounters(): void {
    this.debug.misses = 0;
    this.debug.hits = 0;
  }

  beginRound(): void {
    if (this.state.mode === "combat" || this.state.mode === "defeat") {
      return;
    }

    const wave = this.waves.find((w) => w.round === this.state.round);
    if (!wave) {
      this.state.mode = "defeat";
      this.notify();
      return;
    }

    this.logEvent(`Round ${this.state.round} started`);



    const tasks: SpawnTask[] = wave.segments.map((segment) => ({
      enemyId: segment.enemyId,
      remaining: segment.quantity,
      spawnInterval: segment.spawnInterval,
      nextSpawnAt: 0
    }));

    if (wave.boss) {
      tasks.push({
        enemyId: wave.boss.enemyId,
        remaining: wave.boss.quantity,
        spawnInterval: Math.max(wave.boss.spawnInterval, 1000),
        nextSpawnAt: Math.max(8000, wave.boss.spawnInterval)
      });
    }

    this.state.currentWave = {
      definition: wave,
      tasks,
      elapsed: 0
    };

    this.state.mode = "combat";
    this.notify();
  }

  placeTower(coord: Coord, towerType: string): { success: boolean; reason?: string; towerId?: string } {
    const def = this.getTowerDefinition(towerType);
    if (!def) {
      return { success: false, reason: "Unknown tower" };
    }

    if (!this.grid.canPlace(coord, def.passable)) {
      return { success: false, reason: "Placement blocks path" };
    }

    const key = this.topology.keyOf(coord);
    for (const existing of this.state.towers.values()) {
      if (existing.coordKey === key) {
        return { success: false, reason: "Tile already occupied" };
      }
    }

    const level = def.levels[0];
    if (!level) {
      return { success: false, reason: "Tower missing base level" };
    }

    const existingCount = Array.from(this.state.towers.values()).filter((tower) => tower.towerType === def.id).length;
    const adjustedCost = def.id === "wall" ? level.cost : level.cost + existingCount * this.duplicateTowerPremium;

    if (this.state.credits < adjustedCost) {
      return { success: false, reason: "Not enough credits" };
    }

    const towerId = `tower-${this.state.nextTowerId++}`;
    this.state.credits -= adjustedCost;

    const worldPosition = this.grid.toWorld(coord);
    const tower: TowerRuntime<Coord> = {
      id: towerId,
      towerType: def.id,
      coordKey: key,
      coord,
      level: level.level,
      cooldownRemaining: 0,
      lastShotAt: 0,
      worldPosition
    };

    this.state.towers.set(towerId, tower);
    this.grid.setOccupant(coord, { entityId: towerId, passable: def.passable });
    this.recomputePath();
    this.notify();
    return { success: true, towerId };
  }

  upgradeTower(towerId: string): { success: boolean; reason?: string } {
    const tower = this.state.towers.get(towerId);
    if (!tower) {
      return { success: false, reason: "Tower missing" };
    }

    const def = this.getTowerDefinition(tower.towerType);
    if (!def) {
      return { success: false, reason: "Tower definition missing" };
    }

    const nextLevel = def.levels.find((lvl) => lvl.level === tower.level + 1);
    if (!nextLevel) {
      return { success: false, reason: "Tower maxed" };
    }

    if (this.state.credits < nextLevel.cost) {
      return { success: false, reason: "Not enough credits" };
    }

    this.state.credits -= nextLevel.cost;
    tower.level = nextLevel.level;
    this.notify();
    return { success: true };
  }

  convertWallTower(towerId: string, targetType: string): { success: boolean; reason?: string; cost?: number } {
    const tower = this.state.towers.get(towerId);
    if (!tower) {
      return { success: false, reason: "Tower missing" };
    }
    if (tower.towerType !== "wall") {
      return { success: false, reason: "Only walls can convert" };
    }

    const targetDef = this.getTowerDefinition(targetType);
    if (!targetDef || targetDef.id === "wall") {
      return { success: false, reason: "Invalid target tower" };
    }

    const baseLevel = targetDef.levels[0];
    if (!baseLevel) {
      return { success: false, reason: "Tower missing base level" };
    }

    const cost = this.calculateWallConversionCost(tower, targetDef);
    if (cost == null) {
      return { success: false, reason: "Conversion cost unavailable" };
    }
    if (this.state.credits < cost) {
      return { success: false, reason: "Not enough credits", cost };
    }

    this.state.credits -= cost;
    tower.towerType = targetDef.id;
    tower.level = baseLevel.level;
    tower.cooldownRemaining = 0;
    tower.lastShotAt = 0;

    this.grid.setOccupant(tower.coord, { entityId: tower.id, passable: targetDef.passable });
    this.recomputePath();
    this.notify();

    return { success: true, cost };
  }

  getWallConversionCost(towerId: string, targetType: string): { success: boolean; reason?: string; cost?: number } {
    const tower = this.state.towers.get(towerId);
    if (!tower) {
      return { success: false, reason: "Tower missing" };
    }
    if (tower.towerType !== "wall") {
      return { success: false, reason: "Only walls can convert" };
    }

    const targetDef = this.getTowerDefinition(targetType);
    if (!targetDef || targetDef.id === "wall") {
      return { success: false, reason: "Invalid target tower" };
    }

    const baseLevel = targetDef.levels[0];
    if (!baseLevel) {
      return { success: false, reason: "Tower missing base level" };
    }

    const cost = this.calculateWallConversionCost(tower, targetDef);
    if (cost == null) {
      return { success: false, reason: "Conversion cost unavailable" };
    }

    return { success: true, cost };
  }

  sellTower(towerId: string): { success: boolean; reason?: string; refund?: number } {
    const tower = this.state.towers.get(towerId);
    if (!tower) {
      return { success: false, reason: "Tower missing" };
    }
    const def = this.getTowerDefinition(tower.towerType);
    if (!def) {
      return { success: false, reason: "Tower definition missing" };
    }

    const refund = this.calculateSellValue(def, tower.level);
    this.state.credits += refund;
    this.state.towers.delete(towerId);
    this.grid.setOccupant(tower.coord, undefined);
    this.recomputePath();
    this.notify();
    return { success: true, refund };
  }

  getTowerSellValue(towerId: string): number {
    const tower = this.state.towers.get(towerId);
    if (!tower) {
      return 0;
    }
    const def = this.getTowerDefinition(tower.towerType);
    if (!def) {
      return 0;
    }
    return this.calculateSellValue(def, tower.level);
  }

  private calculateSellValue(def: TowerDefinition, level: number): number {
    if (def.id === "wall") {
      return 2;
    }

    let total = 0;
    for (const lvl of def.levels) {
      if (lvl.level <= level) {
        total += lvl.cost;
      }
    }
    return Math.round(total * 0.6);
  }

  private calculateWallConversionCost(tower: TowerRuntime<Coord>, targetDef: TowerDefinition): number | null {
    const baseLevel = targetDef.levels[0];
    if (!baseLevel) {
      return null;
    }
    const existingCount = Array.from(this.state.towers.values()).filter((candidate) => candidate.towerType === targetDef.id).length;
    const baseCost = targetDef.id === "wall"
      ? baseLevel.cost
      : baseLevel.cost + existingCount * this.duplicateTowerPremium;
    const netCost = Math.max(0, baseCost - this.wallConversionDiscount);
    return netCost;
  }

  tick(deltaMs: number): void {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0) {
      return;
    }

    if (this.state.mode === "defeat") {
      return;
    }

    const maxStep = 100;
    let remaining = deltaMs;

    while (remaining > 0) {
      const step = Math.min(remaining, maxStep);

      if (this.state.mode === "combat") {
        this.advanceWave(step);
        this.updateEnemies(step);
        this.updateTowers(step);
        this.updateProjectiles(step);
      }

      remaining -= step;
    }

    const interestCleared = this.cleanupInterestBonus();

    if (this.state.mode === "combat") {
      this.cleanupEffects();
      this.checkVictoryConditions();
      this.notify();
    } else if (interestCleared) {
      this.notify();
    }
  }


  private computeScore(): number {
    const levelsCleared = Math.max(0, this.state.round - 1);
    const remainingHealth = Math.max(0, this.state.coreHealth);
    return levelsCleared + remainingHealth;
  }

  snapshot(): GameSnapshot<Coord> {
    return {
      mode: this.state.mode,
      round: this.state.round,
      credits: this.state.credits,
      coreHealth: this.state.coreHealth,
      maxCoreHealth: this.state.maxCoreHealth,
      lives: this.state.lives,
      score: this.computeScore(),
      interestBonus: this.state.lastInterestBonus ?? null,
      log: this.state.eventLog.slice(-12),
      path: this.state.path,
      towers: Array.from(this.state.towers.values()).map((tower) => ({
        id: tower.id,
        type: tower.towerType,
        level: tower.level,
        coord: tower.coord
      })),
      enemies: Array.from(this.state.enemies.values()).map((enemy) => ({
        id: enemy.id,
        enemyId: enemy.enemyId,
        coord: enemy.coord,
        position: enemy.position,
        health: enemy.health,
        maxHealth: enemy.maxHealth
      })),
      projectiles: Array.from(this.state.projectiles.values()),
      effects: Array.from(this.state.effects.values()),
      core: { position: this.coreWorld, health: this.state.coreHealth, maxHealth: this.state.maxCoreHealth },
      upcomingWave: this.state.mode === "build" ? this.waves.find((w) => w.round === this.state.round) ?? null : null
    };
  }

  toWorld(coord: Coord): WorldPoint {
    return this.grid.toWorld(coord);
  }

  fromWorld(point: WorldPoint): Coord | null {
    return this.grid.fromWorld(point);
  }

  getCellRadius(): number {
    return this.topology.cellRadius;
  }

  getTopologyName(): string {
    return this.topology.name;
  }

  getBoardCells(): Coord[] {
    return this.grid.getAllCells();
  }

  keyOf(coord: Coord): string {
    return this.topology.keyOf(coord);
  }

  private notify(): void {
    const snap = this.snapshot();
    for (const listener of this.listeners) {
      listener(snap);
    }
  }

  private getTowerDefinition(id: string): TowerDefinition | undefined {
    return towerDefinitionMap.get(id as never);
  }

  private advanceWave(deltaMs: number): void {
    const currentWave = this.state.currentWave;
    if (!currentWave) {
      return;
    }

    currentWave.elapsed += deltaMs;
    for (const task of currentWave.tasks) {
      if (task.remaining <= 0) {
        continue;
      }
      if (currentWave.elapsed >= task.nextSpawnAt) {
        this.spawnEnemy(task.enemyId);
        task.remaining -= 1;
        task.nextSpawnAt = currentWave.elapsed + task.spawnInterval;
      }
    }
  }

  private spawnEnemy(enemyId: string): void {
    const def = enemyDefinitionMap.get(enemyId);
    const round = this.state.round;
    if (!def) {
      return;
    }

    const path = this.state.path;
    if (!path || path.length === 0) {
      return;
    }

    const healthScale = this.progression.healthScaling(round);
    const speedScale = this.progression.speedScaling(round);

    const enemyKey = `enemy-${this.state.nextEnemyId++}`;
    const startCoord = path[0];
    const startPos = this.grid.toWorld(startCoord);

    const enemy: EnemyRuntime<Coord> = {
      id: enemyKey,
      enemyId: def.id,
      coord: startCoord,
      coordKey: this.topology.keyOf(startCoord),
      pathIndex: 0,
      progress: 0,
      health: def.baseHealth * healthScale,
      maxHealth: def.baseHealth * healthScale,
      speed: def.baseSpeed * speedScale * this.topology.cellRadius * Math.sqrt(3),
      damage: Math.max(1, (typeof def.damage === "number" ? def.damage : 1)),
      reward: def.reward * this.progression.rewardScaling(round),
      size: def.size,
      effects: [],
      position: startPos,
      slowedUntil: 0,
      slowFactor: 1,
      stunnedUntil: 0,
      stunImmuneUntil: 0,
      attackingCore: false,
      nextCoreAttackAt: 0
    };

    this.state.enemies.set(enemyKey, enemy);
  }

  private updateEnemies(deltaMs: number): void {
    const dt = deltaMs / 1000;
    const pathCoords = this.state.path;
    const pathWorld: WorldPoint[] = pathCoords.map((coord) => this.grid.toWorld(coord));
    const now = this.now();
    const corePos = this.coreWorld;
    for (const enemy of this.state.enemies.values()) {
      enemy.effects = enemy.effects.filter((effect) => effect.expiresAt > now);

      enemy.slowFactor = 1;
      enemy.stunnedUntil = 0;
      for (const effect of enemy.effects) {
        if (effect.type === "slow") {
          enemy.slowFactor = Math.min(enemy.slowFactor, effect.magnitude);
        }
        if (effect.type === "stun") {
          enemy.stunnedUntil = Math.max(enemy.stunnedUntil, effect.expiresAt);
        }
      }
      if (enemy.attackingCore) {
        const offset = enemy.coreOffset ?? { x: 0, y: 0 };
        enemy.position = { x: corePos.x + offset.x, y: corePos.y + offset.y };
        if (now >= enemy.nextCoreAttackAt) {
          this.spawnLightningEffect(enemy.position, corePos, "#ff4f6d", 220);
          const def = enemyDefinitionMap.get(enemy.enemyId);
          const fallbackDamage = def && typeof def.damage === "number" ? def.damage : 1;
          const baseDamage = Number.isFinite(enemy.damage) ? enemy.damage : fallbackDamage;
          const coreDamage = Math.max(1, Math.round(baseDamage));
          const newCoreHealth = this.state.coreHealth - coreDamage;
          if (newCoreHealth <= 0) {
            this.state.coreHealth = 0;
            this.state.lives = 0;
            this.handleCoreDestroyed();
            return;
          }
          this.state.coreHealth = newCoreHealth;
          this.state.lives = this.state.coreHealth;
          enemy.nextCoreAttackAt = now + 1000;
        }
        continue;
      }
      if (enemy.stunnedUntil > now) {
        continue;
      }
      if (pathWorld.length === 0) {
        continue;
      }

      let targetIndex = Math.min(enemy.pathIndex + 1, pathWorld.length - 1);
      let from = pathWorld[enemy.pathIndex];
      let to = pathWorld[targetIndex];
      if (!from || !to) {
        continue;
      }
      const segmentLength = Math.max(Math.hypot(to.x - from.x, to.y - from.y), 0.0001);
      const moveDistance = enemy.speed * enemy.slowFactor * dt;
      let progress = enemy.progress + moveDistance / segmentLength;

      while (progress >= 1 && targetIndex < pathWorld.length - 1) {
        progress -= 1;
        enemy.pathIndex = targetIndex;
        enemy.coord = pathCoords[targetIndex];
        enemy.coordKey = this.topology.keyOf(enemy.coord);
        targetIndex = Math.min(enemy.pathIndex + 1, pathWorld.length - 1);
        from = pathWorld[enemy.pathIndex];
        to = pathWorld[targetIndex];
        if (!from || !to) {
          break;
        }
      }
      if (targetIndex === pathWorld.length - 1 && progress >= 1) {
        this.onEnemyReachedGoal(enemy, now);
        continue;
      }

      enemy.progress = progress;
      from = pathWorld[enemy.pathIndex];
      to = pathWorld[targetIndex];
      if (!from || !to) {
        continue;
      }
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      enemy.position = {
        x: from.x + dx * enemy.progress,
        y: from.y + dy * enemy.progress
      };
    }
  }


  private handleCoreDestroyed(): void {
    if (this.state.mode === "defeat") {
      return;
    }

    this.spawnSplashEffect(this.coreWorld, this.topology.cellRadius * 4.5, "#ff7043", 520);
    this.spawnSplashEffect(this.coreWorld, this.topology.cellRadius * 2.8, "#ffd166", 360);

    this.state.coreHealth = 0;
    this.state.lives = 0;
    this.state.mode = "defeat";
    this.state.currentWave = undefined;
    this.state.enemies.clear();
    this.state.projectiles.clear();

    this.notify();
  }

  private onEnemyReachedGoal(enemy: EnemyRuntime<Coord>, now: number): void {
    if (enemy.attackingCore) {
      return;
    }
    enemy.attackingCore = true;
    enemy.nextCoreAttackAt = now + 300;
    enemy.coreSlot = this.assignCoreSlot();
    enemy.coreOffset = this.getCoreSlotOffset(enemy.coreSlot ?? 0);
    enemy.pathIndex = this.state.path.length - 1;
    enemy.coord = this.grid.goal as Coord;
    enemy.coordKey = this.topology.keyOf(enemy.coord);
    enemy.position = {
      x: this.coreWorld.x + (enemy.coreOffset?.x ?? 0),
      y: this.coreWorld.y + (enemy.coreOffset?.y ?? 0)
    };
  }

  private updateTowers(deltaMs: number): void {
    const dt = deltaMs / 1000;
    const enemies = Array.from(this.state.enemies.values());
    if (enemies.length === 0) {
      return;
    }


    for (const tower of this.state.towers.values()) {
      const def = this.getTowerDefinition(tower.towerType);
      if (!def) {
        continue;
      }
      const levelConfig = this.getTowerLevel(def, tower.level);
      if (!levelConfig) {
        continue;
      }
      if (def.id === "wall") {
        continue;
      }

      tower.cooldownRemaining = Math.max(0, tower.cooldownRemaining - dt);
      const cooldown = 1 / levelConfig.fireRate;
      if (tower.cooldownRemaining > 0) {
        continue;
      }
      const targetEnemy = this.selectTarget(def, tower, levelConfig, enemies);
      if (!targetEnemy) {
        continue;
      }

      this.fireTower(tower, def, levelConfig, targetEnemy);
      tower.cooldownRemaining = cooldown;
    }
  }

  private now(): number {
    if (typeof performance !== "undefined" && typeof performance.now === "function") {
      return performance.now();
    }
    return Date.now();
  }

  private spawnLightningEffect(origin: WorldPoint, target: WorldPoint, color = "#9de6ff", duration = 150): void {
    const effect: VisualEffect = {
      id: `effect-${this.state.nextEffectId++}`,
      type: "lightning",
      origin: { ...origin },
      target: { ...target },
      color,
      createdAt: this.now(),
      duration
    };
    this.state.effects.set(effect.id, effect);
  }

  private spawnSplashEffect(origin: WorldPoint, radius: number, color: string, duration = 220): void {
    const effect: VisualEffect = {
      id: `effect-${this.state.nextEffectId++}`,
      type: "splash",
      origin: { ...origin },
      radius,
      color,
      createdAt: this.now(),
      duration
    };
    this.state.effects.set(effect.id, effect);
  }

  private cleanupEffects(): void {
    const now = this.now();
    for (const [id, effect] of this.state.effects) {
      if (effect.createdAt + effect.duration <= now) {
        this.state.effects.delete(id);
      }
    }
  }

  private getEnemyVelocity(enemy: EnemyRuntime<Coord>): WorldPoint {
    const path = this.state.path;
    if (path.length === 0) {
      return { x: 0, y: 0 };
    }
    const nextIndex = Math.min(enemy.pathIndex + 1, path.length - 1);
    const nextCoord = path[nextIndex];
    const nextWorld = this.grid.toWorld(nextCoord);
    const currentPos = enemy.position;
    let dirX = nextWorld.x - currentPos.x;
    let dirY = nextWorld.y - currentPos.y;
    const length = Math.hypot(dirX, dirY);
    if (length < 1e-5) {
      return { x: 0, y: 0 };
    }
    const speed = enemy.speed * enemy.slowFactor;
    return { x: (dirX / length) * speed, y: (dirY / length) * speed };
  }

  private predictProjectileIntercept(
    towerPos: WorldPoint,
    enemy: EnemyRuntime<Coord>,
    projectileSpeed: number
  ): WorldPoint | null {
    const enemyVelocity = this.getEnemyVelocity(enemy);
    const relX = enemy.position.x - towerPos.x;
    const relY = enemy.position.y - towerPos.y;
    const vx = enemyVelocity.x;
    const vy = enemyVelocity.y;

    const a = vx * vx + vy * vy - projectileSpeed * projectileSpeed;
    const b = 2 * (relX * vx + relY * vy);
    const c = relX * relX + relY * relY;

    let t: number | null = null;

    if (Math.abs(a) < 1e-6) {
      if (Math.abs(b) < 1e-6) {
        return null;
      }
      const temp = -c / b;
      if (temp > 0 && isFinite(temp)) {
        t = temp;
      }
    } else {
      const discriminant = b * b - 4 * a * c;
      if (discriminant < 0) {
        return null;
      }
      const sqrt = Math.sqrt(discriminant);
      const t1 = (-b - sqrt) / (2 * a);
      const t2 = (-b + sqrt) / (2 * a);
      const candidates = [t1, t2].filter((value) => value > 0 && isFinite(value));
      if (candidates.length > 0) {
        t = Math.min(...candidates);
      }
    }

    if (t == null) {
      return null;
    }

    return { x: enemy.position.x + vx * t, y: enemy.position.y + vy * t };
  }

  private assignCoreSlot(): number {
    const used = new Set<number>();
    for (const enemy of this.state.enemies.values()) {
      if (enemy.attackingCore && enemy.coreSlot != null) {
        used.add(enemy.coreSlot);
      }
    }
    let slot = 0;
    while (used.has(slot)) {
      slot += 1;
    }
    return slot;
  }

  private getCoreSlotOffset(slot: number): WorldPoint {
    const ring = Math.floor(slot / 6);
    const index = slot % 6;
    const baseRadius = this.topology.cellRadius * Math.sqrt(3) * 0.6 * (1 + ring * 0.55);
    const angle = (Math.PI * 2 * index) / 6;
    return {
      x: Math.cos(angle) * baseRadius,
      y: Math.sin(angle) * baseRadius
    };
  }

  private getEffectiveRange(_def: TowerDefinition, level: TowerLevel): number {
    return level.range;
  }

  private getTowerLevel(def: TowerDefinition, level: number): TowerLevel | undefined {
    return def.levels.find((l) => l.level === level);
  }

  private selectTarget(
    def: TowerDefinition,
    tower: TowerRuntime<Coord>,
    level: TowerLevel,
    enemies: EnemyRuntime<Coord>[]
  ): EnemyRuntime<Coord> | null {
    const rangeInCells = this.getEffectiveRange(def, level);
    const worldRange = rangeInCells * this.topology.cellRadius * Math.sqrt(3);

    let nearestRawCell = Number.POSITIVE_INFINITY;
    let nearestAdjustedCell = Number.POSITIVE_INFINITY;
    let nearestWorld = Number.POSITIVE_INFINITY;

    const rangeTolerance = Math.max(Math.min(this.topology.cellRadius * 0.04, 6), 0.5);

    const inRange = enemies.filter((enemy) => {
      const rawCellDistance = this.topology.distance(tower.coord, enemy.coord as Coord);
      nearestRawCell = Math.min(nearestRawCell, rawCellDistance);
      nearestAdjustedCell = Math.min(nearestAdjustedCell, rawCellDistance);
      const dist = Math.hypot(enemy.position.x - tower.worldPosition.x, enemy.position.y - tower.worldPosition.y);
      nearestWorld = Math.min(nearestWorld, dist);
      return dist <= worldRange + rangeTolerance;
    });

    if (inRange.length === 0) {
      if (this.debug.enabled && enemies.length > 0) {
        this.debugLog("tower-no-target", {
          towerId: tower.id,
          towerType: tower.towerType,
          rangeCells: rangeInCells,
          worldRange: Number(worldRange.toFixed(2)),
          nearestCellRaw: Number.isFinite(nearestRawCell) ? Number(nearestRawCell.toFixed(2)) : null,
          nearestCellAdjusted: Number.isFinite(nearestAdjustedCell) ? Number(nearestAdjustedCell.toFixed(2)) : null,
          nearestWorld: Number.isFinite(nearestWorld) ? Number(nearestWorld.toFixed(2)) : null,
          nearestEnemyCoord: enemies[0]?.coord ?? null,
          towerCoord: tower.coord,
          enemyCount: enemies.length
        });
      }
      return null;
    }


    let best: EnemyRuntime<Coord> | undefined;
    for (const enemy of inRange) {
      if (!best) {
        best = enemy;
        continue;
      }
      const enemyProgress = enemy.pathIndex + (enemy.progress ?? 0);
      const bestProgress = best.pathIndex + (best.progress ?? 0);
      if (enemyProgress > bestProgress + 1e-3) {
        best = enemy;
        continue;
      }
      if (enemyProgress < bestProgress - 1e-3) {
        continue;
      }
      if (enemy.attackingCore && !best.attackingCore) {
        best = enemy;
        continue;
      }
      if (!enemy.attackingCore && best.attackingCore) {
        continue;
      }
      const enemyDistanceToCore = Math.hypot(enemy.position.x - this.coreWorld.x, enemy.position.y - this.coreWorld.y);
      const bestDistanceToCore = Math.hypot(best.position.x - this.coreWorld.x, best.position.y - this.coreWorld.y);
      if (enemyDistanceToCore < bestDistanceToCore - 1e-3) {
        best = enemy;
        continue;
      }
      if (enemyDistanceToCore > bestDistanceToCore + 1e-3) {
        continue;
      }
      if (enemy.health > best.health) {
        best = enemy;
        continue;
      }
      if (enemy.health === best.health && enemy.id < best.id) {
        best = enemy;
      }
    }
    return best ?? inRange[0];
  }


  private fireTower(
    tower: TowerRuntime<Coord>,
    def: TowerDefinition,
    level: TowerLevel,
    enemy: EnemyRuntime<Coord>
  ): void {
    const distToEnemy = Math.hypot(
      enemy.position.x - tower.worldPosition.x,
      enemy.position.y - tower.worldPosition.y
    );

    if (def.attackMode === "instant" || level.instantHit) {
      if (def.id === "lightning") {
        this.spawnLightningEffect(tower.worldPosition, enemy.position);
      }
      this.applyDamage(enemy, level.damage, def.id);
      if (def.id === "lightning" && level.effects?.includes("chain-prep")) {
        // Hook for future chain lightning upgrades
      }
      this.debugLog("tower-fire", {
        mode: "instant",
        towerId: tower.id,
        towerType: def.id,
        targetId: enemy.id,
        distance: Number(distToEnemy.toFixed(2)),
        damage: level.damage,
        level: tower.level
      });
      return;
    }

    const speed = (level.projectileSpeed ?? 8) * this.topology.cellRadius * 0.5 * Math.sqrt(3);
    let aimPoint = this.predictProjectileIntercept(tower.worldPosition, enemy, speed);
    if (!aimPoint) {
      aimPoint = enemy.position;
    }

    const dx = aimPoint.x - tower.worldPosition.x;
    const dy = aimPoint.y - tower.worldPosition.y;
    const length = Math.max(Math.hypot(dx, dy), 0.0001);
    const velocity: WorldPoint = {
      x: (dx / length) * speed,
      y: (dy / length) * speed
    };

    const impactColor =
      def.id === "fire" ? "#ff6b5a" : def.id === "ice" ? "#7fd4ff" : undefined;
    const impactDuration = def.id === "fire" ? 260 : def.id === "ice" ? 300 : undefined;

    const projectile: Projectile = {
      id: `projectile-${this.state.nextProjectileId++}`,
      towerId: tower.id,
      targetId: enemy.id,
      position: { ...tower.worldPosition },
      velocity,
      damage: level.damage,
      splashRadius: level.splashRadius ? level.splashRadius * this.topology.cellRadius * Math.sqrt(3) : undefined,
      slowFactor: level.slowFactor,
      slowDuration: level.slowDuration,
      stunDuration: level.stunDuration,
      impactColor,
      impactDuration,
      lastDistance: distToEnemy
    };

    this.state.projectiles.set(projectile.id, projectile);

    this.debugLog("tower-fire", {
      mode: "projectile",
      towerId: tower.id,
      towerType: def.id,
      targetId: enemy.id,
      distance: Number(distToEnemy.toFixed(2)),
      projectileSpeed: Number(speed.toFixed(2)),
      damage: level.damage,
      splash: level.splashRadius ?? null,
      level: tower.level
    });
  }


  private applyDamage(enemy: EnemyRuntime<Coord>, amount: number, _towerId: string): void {
    enemy.health -= amount;
    if (enemy.health <= 0) {
      this.onEnemyKilled(enemy);
    }
  }

  private onEnemyKilled(enemy: EnemyRuntime<Coord>): void {
    this.state.enemies.delete(enemy.id);
    this.state.credits += Math.round(enemy.reward);
  }

  private updateProjectiles(deltaMs: number): void {
    const dt = deltaMs / 1000;
    const distanceTolerance = this.topology.cellRadius * 0.015;
    for (const projectile of Array.from(this.state.projectiles.values())) {
      projectile.position.x += projectile.velocity.x * dt;
      projectile.position.y += projectile.velocity.y * dt;

      const previousDistance = projectile.lastDistance ?? Number.POSITIVE_INFINITY;

      let target = this.state.enemies.get(projectile.targetId);
      if (!target) {
        target = this.retargetProjectile(projectile);
        if (!target) {
          this.state.projectiles.delete(projectile.id);
          continue;
        }
      }

      const dist = Math.hypot(
        target.position.x - projectile.position.x,
        target.position.y - projectile.position.y
      );

      const passedTarget =
        projectile.splashRadius != null &&
        Number.isFinite(previousDistance) &&
        dist > previousDistance + distanceTolerance;

      if (passedTarget) {
        this.applyProjectileImpact(projectile, target, { ...projectile.position });
        this.state.projectiles.delete(projectile.id);
        continue;
      }

      if (dist < this.topology.cellRadius * 0.2) {
        this.applyProjectileImpact(projectile, target);
        this.state.projectiles.delete(projectile.id);
        continue;
      }

      projectile.lastDistance = dist;
    }
  }

  private retargetProjectile(projectile: Projectile): EnemyRuntime<Coord> | undefined {
    const speed = Math.hypot(projectile.velocity.x, projectile.velocity.y);
    if (speed < 0.0001) {
      return undefined;
    }

    let best: EnemyRuntime<Coord> | undefined;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const enemy of this.state.enemies.values()) {
      if (enemy.id === projectile.targetId) {
        continue;
      }

      const dx = enemy.position.x - projectile.position.x;
      const dy = enemy.position.y - projectile.position.y;
      const distance = Math.hypot(dx, dy);
      if (distance <= this.topology.cellRadius * 0.1) {
        continue;
      }

      const forward = distance > 0
        ? (dx * projectile.velocity.x + dy * projectile.velocity.y) / (distance * speed)
        : 1;
      if (forward <= 0) {
        continue;
      }

      const score = distance / Math.max(forward, 0.25);
      if (score < bestScore) {
        best = enemy;
        bestScore = score;
      }
    }

    if (!best) {
      return undefined;
    }

    const dx = best.position.x - projectile.position.x;
    const dy = best.position.y - projectile.position.y;
    const distance = Math.max(Math.hypot(dx, dy), 0.0001);
    projectile.velocity.x = (dx / distance) * speed;
    projectile.velocity.y = (dy / distance) * speed;
    projectile.targetId = best.id;
    return best;
  }

  private applyProjectileImpact(
    projectile: Projectile,
    target: EnemyRuntime<Coord>,
    impactPositionOverride?: WorldPoint
  ): void {
    const impactPosition: WorldPoint = impactPositionOverride ? { ...impactPositionOverride } : { ...target.position };
    const splashRadius = projectile.splashRadius;
    const distanceToTarget = Math.hypot(
      target.position.x - impactPosition.x,
      target.position.y - impactPosition.y
    );
    const directHitRadius = splashRadius ?? this.topology.cellRadius * 0.35;
    const canDealDirect = !impactPositionOverride || distanceToTarget <= directHitRadius + 1e-6;

    if (canDealDirect) {
      this.applyDamage(target, projectile.damage, projectile.towerId);
    }

    if (splashRadius) {
      for (const enemy of this.state.enemies.values()) {
        if (enemy.id === target.id) {
          continue;
        }
        const dist = Math.hypot(enemy.position.x - impactPosition.x, enemy.position.y - impactPosition.y);
        if (dist <= splashRadius) {
          this.applyDamage(enemy, projectile.damage * 0.6, projectile.towerId);
          if (projectile.slowFactor && projectile.slowDuration) {
            this.applySlow(enemy, projectile.slowFactor, projectile.slowDuration);
          }
        }
      }

      if (!canDealDirect && distanceToTarget <= splashRadius + 1e-6) {
        this.applyDamage(target, projectile.damage, projectile.towerId);
      }

      const splashColor = projectile.impactColor ?? "#ff6b5a";
      const splashDuration = projectile.impactDuration ?? 240;
      this.spawnSplashEffect(impactPosition, splashRadius, splashColor, splashDuration);
    } else if (projectile.impactColor) {
      const splashRadius = this.topology.cellRadius * Math.sqrt(3) * 0.6;
      const splashDuration = projectile.impactDuration ?? 220;
      this.spawnSplashEffect(impactPosition, splashRadius, projectile.impactColor, splashDuration);
    }

    const targetImpacted =
      canDealDirect || (splashRadius != null && distanceToTarget <= splashRadius + 1e-6);

    if (targetImpacted && projectile.slowFactor && projectile.slowDuration) {
      this.applySlow(target, projectile.slowFactor, projectile.slowDuration);
    }

    if (targetImpacted && projectile.stunDuration) {
      this.applyStun(target, projectile.stunDuration);
    }
  }

  private applySlow(enemy: EnemyRuntime<Coord>, factor: number, duration: number): void {
    const expiresAt = this.now() + duration * 1000;
    enemy.effects.push({ type: "slow", magnitude: factor, expiresAt });
  }

  private applyStun(enemy: EnemyRuntime<Coord>, duration: number): void {
    const now = this.now();
    if (enemy.stunImmuneUntil > now) {
      return;
    }

    const expiresAt = now + duration * 1000;
    enemy.effects.push({ type: "stun", magnitude: 0, expiresAt });

    const def = enemyDefinitionMap.get(enemy.enemyId);
    if (def?.category === "boss") {
      const immunityExtension = duration * 1000 * 3;
      enemy.stunImmuneUntil = Math.max(enemy.stunImmuneUntil, now + immunityExtension);
    }
  }

  private debugLog(type: "tower-fire" | "tower-no-target", payload: Record<string, unknown>): void {
    if (!this.debug.enabled) {
      return;
    }
    if (type === "tower-fire") {
      if (this.debug.hits >= this.debug.maxHits) {
        return;
      }
      this.debug.hits += 1;
    } else {
      if (this.debug.misses >= this.debug.maxMisses) {
        return;
      }
      this.debug.misses += 1;
    }
    console.debug(`[MazeTD:${type}]`, payload);
  }


  private logEvent(message: string): void {

    const entry = { id: this.state.nextLogId++, message, createdAt: this.now() };

    this.state.eventLog.push(entry);

    if (this.state.eventLog.length > 30) {

      this.state.eventLog.splice(0, this.state.eventLog.length - 30);

    }

  }



  private applyInterestBonus(): void {
    if (this.interestRate <= 0) {
      return;
    }

    const interestGain = Math.floor(this.state.credits * this.interestRate);
    if (interestGain <= 0) {
      return;
    }

    this.state.credits += interestGain;
    const now = this.now();
    this.state.lastInterestBonus = { amount: interestGain, createdAt: now, expiresAt: now + 1500 };
    this.logEvent(`+${interestGain} credits (interest)`);
  }

  private cleanupInterestBonus(): boolean {
    const bonus = this.state.lastInterestBonus;
    if (!bonus) {
      return false;
    }

    if (this.now() < bonus.expiresAt) {
      return false;
    }

    this.state.lastInterestBonus = undefined;
    return true;
  }
  private checkVictoryConditions(): void {
    const currentWave = this.state.currentWave;
    if (!currentWave) {
      return;
    }

    const waveCleared = currentWave.tasks.every((task) => task.remaining <= 0);
    const enemiesRemaining = this.state.enemies.size > 0;

    if (waveCleared && !enemiesRemaining) {
      this.state.mode = "build";
      const completedRound = this.state.round;
      this.logEvent(`Round ${completedRound} cleared`);
      this.state.round += 1;
      this.state.credits += currentWave.definition.rewardBonus;
      if (currentWave.definition.rewardBonus > 0) {
        this.logEvent(`+${currentWave.definition.rewardBonus} credits (wave reward)`);
      }
      this.applyInterestBonus();
      this.state.currentWave = undefined;
      this.state.projectiles.clear();
      this.notify();
    }
  }

  private recomputePath(): void {
    const newPath = this.grid.findPath();
    if (!newPath) {
      this.state.mode = "defeat";
      throw new Error("Path blocked after placement");
    }
    this.state.path = newPath;
  }
}















