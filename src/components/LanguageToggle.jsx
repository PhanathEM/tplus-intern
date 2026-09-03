import { FiGlobe } from "react-icons/fi";

export function LanguageToggle({ language, onToggle, className = "" }) {
  const isLao = language === "lo";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isLao ? "Switch to English" : "ປ່ຽນເປັນພາສາລາວ"}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black/10 text-slate-700 outline-none transition hover:bg-black/15 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20 dark:focus-visible:ring-offset-slate-900 ${className}`}
    >
      <FiGlobe size={18} className="shrink-0" />
    </button>
  );
}
