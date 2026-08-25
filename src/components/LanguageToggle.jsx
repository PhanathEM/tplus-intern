import { TbLanguage } from "react-icons/tb";

export function LanguageToggle({ language, onToggle, className = "" }) {
  const isLao = language === "lo";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isLao ? "Switch to English" : "ປ່ຽນເປັນພາສາລາວ"}
      className={`inline-flex h-8 w-20 shrink-0 items-center justify-center gap-1.5 rounded-lg px-2 text-[13px] font-medium text-slate-600 outline-none transition hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:ring-offset-slate-900 ${className}`}
    >
      <TbLanguage size={16} className="shrink-0" />
      {isLao ? "Lao" : "English"}
    </button>
  );
}
