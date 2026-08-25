import { FiMoon as Moon, FiSun as Sun } from "react-icons/fi";

export function ThemeToggle({ theme, onToggle, className = "" }) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-600 outline-none transition hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:ring-offset-slate-900 ${className}`}
    >
      {isDark ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}
