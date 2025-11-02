import { useMemo } from "react";
import { useGame } from "../game/GameProvider";
import { getTowerSellValue } from "../game/config/towers";
import "./GameOverScreen.css";

export const GameOverScreen = () => {
  const { snapshot, highScore } = useGame();

  const isDefeat = snapshot.mode === "defeat";
  const stats = useMemo(() => {
    const levelsCleared = Math.max(0, snapshot.round - 1);
    const towerSalvage = snapshot.towers.reduce((total, tower) => total + getTowerSellValue(tower.type, tower.level), 0);
    const carriedCredits = Math.floor(snapshot.credits);
    const finalScore = Math.max(0, Math.floor(snapshot.score));
    const bestScore = Math.max(highScore, finalScore);
    return {
      levelsCleared,
      towerSalvage,
      carriedCredits,
      finalScore,
      bestScore
    };
  }, [snapshot, highScore]);

  if (!isDefeat) {
    return null;
  }

  return (
    <div className="game-over-screen">
      <div className="game-over-card">
        <h1 className="game-over-title">Core Destroyed</h1>
        <p className="game-over-subtitle">Final Score</p>
        <div className="game-over-score">{stats.finalScore.toLocaleString()}</div>
        <div className="game-over-breakdown">
          <div className="game-over-stat">
            <span className="label">High score</span>
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
            <span className="label">Levels cleared</span>
            <span className="value">{stats.levelsCleared}</span>
          </div>
        </div>
        <button className="game-over-button" onClick={() => window.location.reload()}>Try Again</button>
      </div>
    </div>
  );
};
