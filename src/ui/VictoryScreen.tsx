import { useMemo } from "react";
import { useGame } from "../game/GameProvider";
import { getTowerSellValue } from "../game/config/towers";
import "./VictoryScreen.css";

export const VictoryScreen = () => {
  const { snapshot } = useGame();

  if (snapshot.mode !== "victory") {
    return null;
  }

  const stats = useMemo(() => {
    const roundsSurvived = snapshot.round;
    const towerSalvage = snapshot.towers.reduce((total, tower) => total + getTowerSellValue(tower.type, tower.level), 0);
    const carriedCredits = Math.floor(snapshot.credits);
    const finalScore = towerSalvage + carriedCredits;
    return {
      roundsSurvived,
      towerSalvage,
      carriedCredits,
      finalScore
    };
  }, [snapshot]);

  return (
    <div className="victory-screen">
      <div className="victory-card">
        <h1 className="victory-title">Maze Secured</h1>
        <p className="victory-subtitle">Final Score</p>
        <div className="victory-score">{stats.finalScore.toLocaleString()}</div>
        <div className="victory-breakdown">
          <div className="victory-stat">
            <span className="label">Tower salvage</span>
            <span className="value">{stats.towerSalvage.toLocaleString()}</span>
          </div>
          <div className="victory-stat">
            <span className="label">Credits carried</span>
            <span className="value">{stats.carriedCredits.toLocaleString()}</span>
          </div>
          <div className="victory-stat">
            <span className="label">Rounds survived</span>
            <span className="value">{stats.roundsSurvived}</span>
          </div>
        </div>
        <button className="victory-button" onClick={() => window.location.reload()}>Play Again</button>
      </div>
    </div>
  );
};
