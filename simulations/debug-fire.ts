import { createHexTopology, HexCoord } from "../src/core/topology/hexTopology.ts";
import { GridManager } from "../src/core/grid/GridManager.ts";
import { createHexBoardBlueprint } from "../src/game/config/board.ts";
import { GameEngine } from "../src/game/GameEngine.ts";

const topology = createHexTopology(34);
const blueprint = createHexBoardBlueprint(6);
const grid = new GridManager<HexCoord>(topology, blueprint);
const engine = new GameEngine<HexCoord>({ topology, grid });

engine.placeTower({ q: -1, r: 0 }, "lightning");
engine.placeTower({ q: 0, r: -1 }, "fire");
engine.placeTower({ q: 1, r: -1 }, "ice");

engine.beginRound();

let steps = 0;
const logInterval = 30;

const dispose = engine.subscribe((snapshot) => {
  // no-op for now
});

while (steps < 300) {
  engine.tick(100);
  if (steps % logInterval === 0) {
    const snap = engine.snapshot();
    const target = snap.enemies[0];
    console.log(`step=${steps}`, {
      enemyCount: snap.enemies.length,
      enemyHealth: target?.health,
      projectiles: snap.projectiles.length,
      credits: snap.credits,
      mode: snap.mode
    });
  }
  steps += 1;
}

dispose();

