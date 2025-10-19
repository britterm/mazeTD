from pathlib import Path
text = Path("src/game/GameEngine.ts").read_text()
start = text.index("  upgradeTower")
end = text.index("  tick(deltaMs")
print(text[start:end])
