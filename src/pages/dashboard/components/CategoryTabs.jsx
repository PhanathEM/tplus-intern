import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { FiChevronLeft as ChevronLeft, FiChevronRight as ChevronRight } from "react-icons/fi";

export function CategoryTabs({ options, selected, onSelect, trailing }) {
  const { t } = useTranslation();
  const scrollRef = useRef(null);

  function scrollByAmount(amount) {
    scrollRef.current?.scrollBy({ left: amount, behavior: "smooth" });
  }

  return (
    <div className="flex items-center gap-1 border-b border-slate-100 pl-5 pr-2 py-3 dark:border-slate-800">
      <button
        type="button"
        onClick={() => scrollByAmount(-240)}
        aria-label={t("Scroll categories left")}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 outline-none transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-orange-400 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      >
        <ChevronLeft size={16} />
      </button>

      <div
        ref={scrollRef}
        className="flex flex-nowrap gap-2 overflow-x-auto scroll-smooth scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {options.map((option) => {
          const isActive = option.value === selected;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              className={`inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-full px-3.5 text-[13px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 ${isActive
                ? "bg-slate-950 text-white dark:bg-white dark:text-slate-900"
                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700"
                }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => scrollByAmount(240)}
        aria-label={t("Scroll categories right")}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 outline-none transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-orange-400 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      >
        <ChevronRight size={16} />
      </button>

      {trailing}
    </div>
  );
}
