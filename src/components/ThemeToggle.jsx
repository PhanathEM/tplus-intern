import { FiMoon as Moon, FiSun as Sun } from "react-icons/fi";

export function ThemeToggle({ theme, onToggle, className = "" }) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black/10 text-slate-700 outline-none transition hover:bg-black/15 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20 dark:focus-visible:ring-offset-slate-900 ${className}`}
    >
      {isDark ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
