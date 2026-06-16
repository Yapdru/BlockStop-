interface RiskScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export function RiskScore({ score, size = "md" }: RiskScoreProps) {
  const getColor = (s: number) => {
    if (s >= 70) return "text-red-600";
    if (s >= 40) return "text-yellow-600";
    return "text-green-600";
  };

  const getBackgroundColor = (s: number) => {
    if (s >= 70) return "bg-red-50";
    if (s >= 40) return "bg-yellow-50";
    return "bg-green-50";
  };

  const sizes = {
    sm: "w-16 h-16 text-2xl",
    md: "w-24 h-24 text-4xl",
    lg: "w-32 h-32 text-5xl",
  };

  return (
    <div className={`flex items-center justify-center rounded-full border-4 border-current ${sizes[size]} ${getBackgroundColor(score)} ${getColor(score)}`}>
      <div className="text-center">
        <div className="font-bold">{score}</div>
        <div className="text-xs">Risk</div>
      </div>
    </div>
  );
}
