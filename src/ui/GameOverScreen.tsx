import { useMemo } from "react";
import { useGame } from "../game/GameProvider";
import { getTowerSellValue } from "../game/config/towers";
import "./GameOverScreen.css";

export const GameOverScreen = () => {
  const { snapshot, highScore, currentLevel, selectLevel, returnToTitle, phase } = useGame();

  if (phase !== "playing" || snapshot.mode !== "defeat") {
    return null;
  }

  const stats = useMemo(() => {
    const roundsCleared = Math.max(0, snapshot.round - 1);
    const towerSalvage = snapshot.towers.reduce((total, tower) => total + getTowerSellValue(tower.type, tower.level), 0);
    const carriedCredits = Math.floor(snapshot.credits);
    const finalScore = Math.max(0, Math.floor(snapshot.score));
    const bestScore = Math.max(highScore, finalScore);
    return {
      roundsCleared,
      towerSalvage,
      carriedCredits,
      finalScore,
      bestScore
    };
  }, [snapshot, highScore]);

  const handleRetry = () => {
    if (currentLevel) {
      selectLevel(currentLevel.id);
    }
  };

  return (
    <div className="game-over-screen">
      <div className="game-over-card">
        <h1 className="game-over-title">Core Destroyed</h1>
        <p className="game-over-subtitle">Final Score</p>
        <div className="game-over-score">{stats.finalScore.toLocaleString()}</div>
        <div className="game-over-breakdown">
          <div className="game-over-stat">
            <span className="label">Best score</span>
            <span className="value">{stats.bestScore.toLocaleString()}</span>
          </div>
          <div className="game-over-stat">
            <span className="label">Tower salvage</span>
            <span className="value">{stats.towerSalvage.toLocaleString()}</span>
          </div>
          <div className="game-over-stat">
            <span className="label">Credits carried</span>
            <span className="value">{stats.carriedCredits.toLocaleString()}</span>
          </div>
          <div className="game-over-stat">
            <span className="label">Rounds cleared</span>
            <span className="value">{stats.roundsCleared}</span>
          </div>
        </div>
        <div className="game-over-actions">
          <button className="game-over-button" onClick={handleRetry}>
            Retry Level
          </button>
          <button className="game-over-button game-over-button--secondary" onClick={returnToTitle}>
            Level Select
          </button>
        </div>
      </div>
    </div>
  );
};
