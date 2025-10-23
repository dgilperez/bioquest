interface LevelProgressProps {
  currentPoints: number;
  pointsToNextLevel: number;
  nextLevel: number;
}

export function LevelProgress({
  currentPoints,
  pointsToNextLevel,
  nextLevel,
}: LevelProgressProps) {
  const totalPointsForNextLevel = currentPoints + pointsToNextLevel;
  const progressPercentage = (currentPoints / totalPointsForNextLevel) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{currentPoints.toLocaleString()} XP</span>
        <span>{pointsToNextLevel.toLocaleString()} to Level {nextLevel}</span>
      </div>
      <div className="h-3 rounded-full bg-white/30 overflow-hidden">
        <div
          className="h-full bg-white rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
}
