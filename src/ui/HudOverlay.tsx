import { useGame } from "../game/GameProvider";
import "./HudOverlay.css";

export const HudOverlay = () => {
  const { snapshot, statusMessage, highScore } = useGame();
  const currentScore = Math.max(0, Math.floor(snapshot.score));

  return (
    <div className="hud-overlay">
      <div className="hud-card">
        <div className="hud-title">Round</div>
        <div className="hud-value">{snapshot.round}</div>
      </div>
      <div className="hud-card hud-card--credits">
        <div className="hud-title">Credits</div>
        <div className="hud-value">
          {Math.floor(snapshot.credits)}
          {snapshot.interestBonus ? (
            <span key={snapshot.interestBonus.createdAt} className="hud-credit-float">
              (+{snapshot.interestBonus.amount})
            </span>
          ) : null}
        </div>
      </div>
      <div className="hud-card">
        <div className="hud-title">Score</div>
        <div className="hud-value">{currentScore.toLocaleString()}</div>
        <div className="hud-subvalue">Best {highScore.toLocaleString()}</div>
      </div>
      <div className="hud-card">
        <div className="hud-title">Core</div>
        <div className="hud-value">{snapshot.coreHealth}</div>
      </div>
      <div className="hud-status">
        <span className={`hud-mode hud-mode-${snapshot.mode}`}>{snapshot.mode.toUpperCase()}</span>
        {statusMessage ? <span className="hud-message">{statusMessage}</span> : null}
      </div>
    </div>
  );
};
