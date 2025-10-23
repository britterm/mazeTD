import { useEffect, useState } from "react";
import { useGame } from "../game/GameProvider";
import "./EventLog.css";

const MAX_DISPLAY = 12;
const FADE_DURATION_MS = 20000;
const UPDATE_INTERVAL_MS = 250;

export const EventLog = () => {
  const { snapshot } = useGame();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), UPDATE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  const entries = snapshot.log?.slice(-MAX_DISPLAY) ?? [];
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="event-log">
      <div className="event-log__inner">
        {entries.map((entry) => {
          const age = Math.max(0, now - entry.createdAt);
          const opacity = Math.max(0.4, Math.min(1, 1 - age / FADE_DURATION_MS));
          return (
            <div key={entry.id} className="event-log__entry" style={{ opacity }}>
              {entry.message}
            </div>
          );
        })}
      </div>
    </div>
  );
};
