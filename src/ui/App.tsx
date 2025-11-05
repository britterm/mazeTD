import { GameProvider, useGame } from "../game/GameProvider";
import { GameCanvas } from "../render/GameCanvas";
import { HudOverlay } from "./HudOverlay";
import { ControlPanel } from "./ControlPanel";
import { TowerMenu } from "./TowerMenu";
import { TerrainMenu } from "./TerrainMenu";
import { EnemyIndicator } from "./EnemyIndicator";
import { GameOverScreen } from "./GameOverScreen";
import { VictoryScreen } from "./VictoryScreen";
import { EventLog } from "./EventLog";
import { TitleScreen } from "./TitleScreen";
import "./App.css";

const AppContent = () => {
  const { phase } = useGame();
  const isTitle = phase === "title";

  return (
    <div className={`app-shell${isTitle ? " app-shell--title" : ""}`}>
      <div className="playfield">
        <div className="canvas-stack">
          <GameCanvas />
          <HudOverlay />
          <TerrainMenu />
          <TowerMenu />
          <EnemyIndicator />
          <VictoryScreen />
          <GameOverScreen />
          <EventLog />
          <TitleScreen />
        </div>
      </div>
      {!isTitle ? (
        <aside className="sidebar">
          <ControlPanel />
        </aside>
      ) : null}
    </div>
  );
};

export const App = () => {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
};
