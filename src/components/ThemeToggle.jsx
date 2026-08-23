import { FiMoon as Moon, FiSun as Sun } from "react-icons/fi";

export function ThemeToggle({ theme, onToggle, className = "" }) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={onToggle}
      className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 ${
        isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-100"
      } ${className}`}
    >
      <span
        className={`grid h-6 w-6 place-items-center rounded-full bg-white shadow-sm transition-transform ${
          isDark ? "translate-x-[26px]" : "translate-x-1"
        }`}
      >
        {isDark ? <Moon size={13} className="text-slate-700" /> : <Sun size={13} className="text-amber-500" />}
      </span>
    </button>
  );
}
