import { towerDefinitions } from "../game/config/towers";
import { useGame } from "../game/GameProvider";
import "./ControlPanel.css";

export const ControlPanel = () => {
  const {
    engine,
    snapshot,
    selectedTower,
    setSelectedTower,
    setStatusMessage,
    setActiveTowerId,
    setActiveTerrain,
    gameSpeed,
    setGameSpeed,
    gameSpeedOptions,
    phase
  } = useGame();

  const handleStartWave = () => {
    if (snapshot.mode !== "build") {
      setStatusMessage("Wave already running");
      return;
    }
    setActiveTerrain(null);
    engine.beginRound();
    setStatusMessage("Wave launched");
  };

  return (
    <div className="control-panel">
      {phase !== "title" ? (
        <section className="panel-section">
          <div className="panel-header">Wave Control</div>
          <button className="start-btn" disabled={snapshot.mode !== "build"} onClick={handleStartWave}>
            {snapshot.mode === "build" ? "Start Wave" : "In Progress"}
          </button>
          <div className="speed-controls">
            <span className="speed-label">Game Speed</span>
            <div className="speed-buttons">
              {gameSpeedOptions.map(({ label, value }) => (
                <button
                  key={value}
                  className={`speed-btn ${gameSpeed === value ? "is-active" : ""}`}
                  onClick={() => setGameSpeed(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : null}
      <section className="panel-section">
        <div className="panel-header">Towers</div>
        <div className="tower-grid">
          {towerDefinitions.map((tower) => {
            const baseLevel = tower.levels[0];
            const isSelected = selectedTower === tower.id;
            const existingCount = snapshot.towers.filter((placed) => placed.type === tower.id).length;
            const ramp = tower.id === "wall" ? 0 : existingCount * 5;
            const baseCost = baseLevel?.cost ?? 0;
            const costLabel = ramp > 0 ? `${baseCost} + ${ramp}` : `${baseCost}`;
            return (
              <button
                key={tower.id}
                className={`tower-card ${isSelected ? "is-selected" : ""}`}
                onClick={() => {
                  setActiveTowerId(null);
                  setActiveTerrain(null);
                  setSelectedTower(tower.id);
                }}
              >
                <div className="tower-meta">
                  <div className="tower-name" style={{ color: tower.color }}>{tower.name}</div>
                  <span className="tower-cost">{costLabel} cr</span>
                </div>
                <p className="tower-desc">{tower.description}</p>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
