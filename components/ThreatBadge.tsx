interface ThreatBadgeProps {
  level: "safe" | "warning" | "dangerous" | "unknown";
  size?: "sm" | "md" | "lg";
}

export function ThreatBadge({ level, size = "md" }: ThreatBadgeProps) {
  const colors = {
    safe: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-700",
    dangerous: "bg-red-100 text-red-700",
    unknown: "bg-gray-100 text-gray-700",
  };

  const icons = {
    safe: "✓",
    warning: "⚠",
    dangerous: "🚫",
    unknown: "?",
  };

  const sizes = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-3 text-base",
  };

  return (
    <span className={`inline-flex items-center gap-1 font-semibold rounded-full ${colors[level]} ${sizes[size]}`}>
      <span>{icons[level]}</span>
      <span>{level.charAt(0).toUpperCase() + level.slice(1)}</span>
    </span>
  );
}
