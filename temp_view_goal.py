from pathlib import Path
text = Path("src/game/GameEngine.ts").read_text()
start = text.index("  private onEnemyReachedGoal")
end = text.index("  private updateTowers", start)
print(text[start:end])
