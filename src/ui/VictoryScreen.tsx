import { useMemo } from "react";
import { useGame } from "../game/GameProvider";
import { getTowerSellValue } from "../game/config/towers";
import "./VictoryScreen.css";

export const VictoryScreen = () => {
  const { snapshot, highScore, levels, currentLevel, selectLevel, returnToTitle, phase } = useGame();

  if (phase !== "playing" || snapshot.mode !== "victory") {
    return null;
  }

  const stats = useMemo(() => {
    const roundsSurvived = snapshot.round;
    const towerSalvage = snapshot.towers.reduce((total, tower) => total + getTowerSellValue(tower.type, tower.level), 0);
    const carriedCredits = Math.floor(snapshot.credits);
    const finalScore = Math.max(0, Math.floor(snapshot.score));
    const bestScore = Math.max(highScore, finalScore);
    return {
      roundsSurvived,
      towerSalvage,
      carriedCredits,
      finalScore,
      bestScore
    };
  }, [snapshot, highScore]);

  const nextLevel = useMemo(() => {
    if (!currentLevel) {
      return null;
    }
    return levels.find((level) => level.index === currentLevel.index + 1 && level.unlocked) ?? null;
  }, [levels, currentLevel]);

  const handleReplay = () => {
    if (currentLevel) {
      selectLevel(currentLevel.id);
    }
  };

  const handleNext = () => {
    if (nextLevel) {
      selectLevel(nextLevel.id);
    }
  };

  return (
    <div className="victory-screen">
      <div className="victory-card">
        <h1 className="victory-title">Maze Secured</h1>
        <p className="victory-subtitle">Final Score</p>
        <div className="victory-score">{stats.finalScore.toLocaleString()}</div>
        <div className="victory-breakdown">
          <div className="victory-stat">
            <span className="label">Best score</span>
            <span className="value">{stats.bestScore.toLocaleString()}</span>
          </div>
          <div className="victory-stat">
            <span className="label">Tower salvage</span>
            <span className="value">{stats.towerSalvage.toLocaleString()}</span>
          </div>
          <div className="victory-stat">
            <span className="label">Credits carried</span>
            <span className="value">{stats.carriedCredits.toLocaleString()}</span>
          </div>
          <div className="victory-stat">
            <span className="label">Rounds cleared</span>
            <span className="value">{stats.roundsSurvived}</span>
          </div>
        </div>
        <div className="victory-actions">
          <button className="victory-button" onClick={handleReplay}>
            Replay Level
          </button>
          <button className="victory-button victory-button--secondary" onClick={returnToTitle}>
            Level Select
          </button>
          <button
            className="victory-button victory-button--primary"
            onClick={handleNext}
            disabled={!nextLevel}
          >
            {nextLevel ? `Next: ${nextLevel.name}` : "All Levels Complete"}
          </button>
        </div>
      </div>
    </div>
  );
};
