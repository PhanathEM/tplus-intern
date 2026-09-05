import { FiGlobe } from "react-icons/fi";

export function LanguageToggle({ language, onToggle, className = "" }) {
  const isLao = language === "lo";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isLao ? "Switch to English" : "ປ່ຽນເປັນພາສາລາວ"}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-950/10 text-slate-900 outline-none transition hover:bg-slate-950/20 focus-visible:ring-2 focus-visible:ring-slate-950/40 ${className}`}
    >
      <FiGlobe size={18} className="shrink-0" />
    </button>
  );
}
