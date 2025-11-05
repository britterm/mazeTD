import { useGame } from "../game/GameProvider";
import "./TitleScreen.css";
import heroBackground from "../../assets/ui/hero2.png";

const formatPercent = (value: number): string => `${Math.round(value * 100)}%`;

export const TitleScreen = () => {
  const { phase, levels, selectLevel } = useGame();

  if (phase !== "title") {
    return null;
  }

  return (
    <div className="title-screen">
      <div
        className="title-screen__panel"
        style={{ backgroundImage: `url(${heroBackground})` }}
      >
        <div className="title-screen__panel-content">
          <div className="title-screen__header">
            <h1 className="title-screen__title">Hexel Defense</h1>
            <p className="title-screen__subtitle">Select a level to begin your defenses.</p>
          </div>
          <div className="title-screen__levels">
            {levels.map((level) => {
              const locked = !level.unlocked;
              return (
                <button
                  key={level.id}
                  className={`title-screen__level ${locked ? "is-locked" : ""}`.trim()}
                  disabled={locked}
                  onClick={() => selectLevel(level.id)}
                >
                  <div className="title-screen__level-header">
                    <span className="title-screen__level-name">{level.name}</span>
                    {locked ? <span className="title-screen__level-lock">Locked</span> : null}
                  </div>
                  <div className="title-screen__level-meta">
                    <span>Obstacles {formatPercent(level.density)}</span>
                    <span>Best {level.bestScore > 0 ? level.bestScore.toLocaleString() : "-"}</span>
                    <span>Waves {level.waves}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
