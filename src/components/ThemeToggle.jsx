import { FiMoon as Moon, FiSun as Sun } from "react-icons/fi";

export function ThemeToggle({ theme, onToggle, className = "" }) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-950/10 text-slate-900 outline-none transition hover:bg-slate-950/20 focus-visible:ring-2 focus-visible:ring-slate-950/40 ${className}`}
    >
      {isDark ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
