import { towerDefinitions } from "../game/config/towers";
import { useGame } from "../game/GameProvider";
import "./ControlPanel.css";

export const ControlPanel = () => {
  const { engine, snapshot, selectedTower, setSelectedTower, setStatusMessage, setActiveTowerId } = useGame();

  const handleStartWave = () => {
    if (snapshot.mode !== "build") {
      setStatusMessage("Wave already running");
      return;
    }
    engine.beginRound();
    setStatusMessage("Wave launched");
  };

  return (
    <div className="control-panel">
      <section className="panel-section">
        <div className="panel-header">Wave Control</div>
        <button className="start-btn" disabled={snapshot.mode !== "build"} onClick={handleStartWave}>
          {snapshot.mode === "build" ? "Start Wave" : "In Progress"}
        </button>
        {snapshot.upcomingWave ? (
          <div className="wave-preview">
            <div className="preview-title">Next Wave</div>
            <ul>
              {snapshot.upcomingWave.segments.map((segment, index) => (
                <li key={`${segment.enemyId}-${index}`}>
                  <span>{segment.enemyId}</span>
                  <span>x{segment.quantity}</span>
                </li>
              ))}
              {snapshot.upcomingWave.boss ? (
                <li className="boss-line">
                  <span>BOSS: {snapshot.upcomingWave.boss.enemyId}</span>
                  <span>x{snapshot.upcomingWave.boss.quantity}</span>
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </section>

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

                  setSelectedTower(tower.id);

                }}

              >

                <div className="tower-name">{tower.name}</div>

                <div className="tower-meta">

                  <span className="tower-cost">{costLabel} cr</span>

                  <span className="tower-type">{tower.category}</span>

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


