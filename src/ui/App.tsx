import { GameProvider } from "../game/GameProvider";
import { GameCanvas } from "../render/GameCanvas";
import { HudOverlay } from "./HudOverlay";
import { ControlPanel } from "./ControlPanel";
import { TowerMenu } from "./TowerMenu";
import { EnemyIndicator } from "./EnemyIndicator";
import { GameOverScreen } from "./GameOverScreen";
import { VictoryScreen } from "./VictoryScreen";
import { EventLog } from "./EventLog";
import "./App.css";

export const App = () => {
  return (
    <GameProvider>
      <div className="app-shell">
        <div className="playfield">
          <div className="canvas-stack">
            <GameCanvas />
            <HudOverlay />
            <TowerMenu />
            <EnemyIndicator />
            <VictoryScreen />
            <GameOverScreen />
            <EventLog />
          </div>
        </div>
        <aside className="sidebar">
          <ControlPanel />
        </aside>
      </div>
    </GameProvider>
  );
};
