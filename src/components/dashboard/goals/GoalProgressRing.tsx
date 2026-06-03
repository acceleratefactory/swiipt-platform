export default function GoalProgressRing({ percentage, size = 140 }: { percentage: number; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const center = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--gray-100)" strokeWidth="8" />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="var(--teal)"
        strokeWidth="8"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text
        x={center}
        y={center}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          transform: `rotate(90deg)`,
          transformOrigin: `${center}px ${center}px`,
          fontSize: size * 0.18,
          fontWeight: 800,
          fill: "var(--midnight)",
          fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
        }}
      >
        {Math.round(percentage)}%
      </text>
    </svg>
  );
}
