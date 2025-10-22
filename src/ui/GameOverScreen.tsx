import { useMemo } from "react";
import { useGame } from "../game/GameProvider";
import "./GameOverScreen.css";

export const GameOverScreen = () => {
  const { snapshot } = useGame();

  const isDefeat = snapshot.mode === "defeat";
  const stats = useMemo(() => {
    const levelsCleared = Math.max(0, snapshot.round - 1);
    return {
      levelsCleared,
      remainingHealth: Math.max(0, snapshot.coreHealth)
    };
  }, [snapshot.coreHealth, snapshot.round]);

  if (!isDefeat) {
    return null;
  }

  return (
    <div className="game-over-screen">
      <div className="game-over-card">
        <h1 className="game-over-title">Core Destroyed</h1>
        <p className="game-over-subtitle">Final Score</p>
        <div className="game-over-score">{snapshot.score}</div>
        <div className="game-over-breakdown">
          <div className="game-over-stat">
            <span className="label">Levels cleared</span>
            <span className="value">{stats.levelsCleared}</span>
          </div>
          <div className="game-over-stat">
            <span className="label">Core health remaining</span>
            <span className="value">{stats.remainingHealth}</span>
          </div>
        </div>
        <button className="game-over-button" onClick={() => window.location.reload()}>Try Again</button>
      </div>
    </div>
  );
};
