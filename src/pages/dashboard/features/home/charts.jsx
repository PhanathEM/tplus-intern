// Small, dependency-free SVG chart for the Home page's insight panels. No
// charting library is installed in this project — this covers exactly the
// one shape Home needs (a donut) without adding one.

const DONUT_COLORS = ["#ABF43F", "#3FF4E5", "#B5A5FF", "#090909", "#F0793F"];

export function DonutChart({ data, size = 150, strokeWidth = 20 }) {
  const total = data.reduce((sum, item) => sum + item.count, 0) || 1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Each segment's length plus how far along the ring it starts — built as
  // plain derived arrays (no running variable mutated across iterations)
  // so this stays a pure computation during render.
  const dashLengths = data.map((item) => (item.count / total) * circumference);
  const offsets = dashLengths.map((_, index) =>
    dashLengths.slice(0, index).reduce((sum, length) => sum + length, 0)
  );

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        className="stroke-slate-100 dark:stroke-slate-800"
      />
      {data.map((item, index) => (
        <circle
          key={item.label}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          stroke={DONUT_COLORS[index % DONUT_COLORS.length]}
          strokeDasharray={`${dashLengths[index]} ${circumference - dashLengths[index]}`}
          strokeDashoffset={-offsets[index]}
        />
      ))}
    </svg>
  );
}

export function DonutLegend({ data }) {
  return (
    <ul className="space-y-2">
      {data.map((item, index) => (
        <li key={item.label} className="flex items-center justify-between gap-3 text-[13px]">
          <span className="flex min-w-0 items-center gap-2 text-slate-600 dark:text-slate-300">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }}
            />
            <span className="truncate">{item.label}</span>
          </span>
          <span className="shrink-0 font-semibold text-slate-950 dark:text-white">{item.percent}%</span>
        </li>
      ))}
    </ul>
  );
}
