from pathlib import Path
text = Path("src/game/GameEngine.ts").read_text()
start = text.index("  snapshot(): GameSnapshot")
end = text.index("  toWorld(", start)
print(text[start:end])
