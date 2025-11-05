import { useMemo } from "react";
import { useGame } from "../game/GameProvider";
import { GridCellVariant } from "../core/grid/GridBlueprint";
import "./TerrainMenu.css";

export const TerrainMenu = () => {
  const { engine, snapshot, activeTerrain, setActiveTerrain, clearTerrain, clearCost } = useGame();

  const variant = useMemo<GridCellVariant | null>(() => {
    if (!activeTerrain) {
      return null;
    }
    return engine.getCellVariant(activeTerrain as never);
  }, [engine, activeTerrain]);

  if (!activeTerrain || variant !== "clearable") {
    return null;
  }

  const handleClear = () => {
    clearTerrain(activeTerrain);
  };

  const buttonLabel = clearCost > 0 ? `Clear for ${clearCost} credits` : 'Clear obstacle';

  return (
    <div className="terrain-menu">
      <div className="terrain-menu__card">
        <div className="terrain-menu__header">
          <h3 className="terrain-menu__title">Blocked Tile</h3>
          <button className="terrain-menu__close" onClick={() => setActiveTerrain(null)} aria-label="Close">
            ×
          </button>
        </div>
        <p className="terrain-menu__description">
          Spend credits to clear this obstacle. Clearing converts the tile into a wall you can convert later.
        </p>
        <button
          className="terrain-menu__action"
          onClick={handleClear}
          disabled={snapshot.credits < clearCost}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
};
