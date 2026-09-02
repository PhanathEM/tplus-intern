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
    <div className="flex items-center gap-1 pl-5 pr-2">
      <button
        type="button"
        onClick={() => scrollByAmount(-240)}
        aria-label={t("Scroll categories left")}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 outline-none transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-orange-400 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      >
        <ChevronLeft size={16} />
      </button>

      {/* The divider line is a sibling BEHIND the scrollable tab row (not
          inside it), so it's never subject to the row's own overflow-x-auto
          clipping. The active tab just renders above it (z-10) with an
          opaque background, which naturally covers the line wherever the
          two overlap — no pixel/color matching required. */}
      <div className="relative min-w-0 flex-1">
        <div
          ref={scrollRef}
          className="flex flex-nowrap items-stretch gap-1 overflow-x-auto scroll-smooth scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {options.map((option) => {
            const isActive = option.value === selected;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onSelect(option.value)}
                className={`relative shrink-0 whitespace-nowrap rounded-t-lg border px-5 py-2 text-[13px] font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-orange-400 ${isActive
                  ? "z-10 border-slate-200 border-b-transparent bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                  }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-slate-200 dark:bg-slate-800" />
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
