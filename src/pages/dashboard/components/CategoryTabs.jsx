import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiChevronLeft as ChevronLeft, FiChevronRight as ChevronRight } from "react-icons/fi";

// `centered` uses mx-auto on an inner wrapper rather than justify-center,
// because justify-center on a scroll container makes the first items
// unreachable once the row overflows. mx-auto simply has no effect then, so
// the row falls back to scrolling from the start.
export function CategoryTabs({ options, selected, onSelect, trailing, centered = false }) {
  const { t } = useTranslation();
  const scrollRef = useRef(null);
  // The arrows only earn their space when the row actually overflows — with a
  // handful of tabs they'd otherwise sit there doing nothing.
  const [canScroll, setCanScroll] = useState(false);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    function measure() {
      // +1 absorbs sub-pixel rounding, which otherwise reports a 1px overflow
      // on rows that visibly fit.
      setCanScroll(element.scrollWidth > element.clientWidth + 1);
    }

    // ResizeObserver fires once on observe, so the first measurement happens
    // in its callback rather than as a setState in this effect body. Re-running
    // on `options` re-observes, covering content changes that don't resize the
    // container itself.
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [options]);

  function scrollByAmount(amount) {
    scrollRef.current?.scrollBy({ left: amount, behavior: "smooth" });
  }

  const arrowClass =
    "grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 outline-none transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-orange-400 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200";

  return (
    // The divider sits on this outer box rather than on the scroll row, so
    // inset-x-0 spans the padding too — the line stays edge-to-edge and lines
    // up with the title and button below whether or not the arrows are shown.
    <div className={`relative flex items-center gap-1 ${canScroll ? "pl-5 pr-2" : ""}`}>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-slate-200 dark:bg-slate-800" />
      {canScroll && (
        <button
          type="button"
          onClick={() => scrollByAmount(-240)}
          aria-label={t("Scroll categories left")}
          className={arrowClass}
        >
          <ChevronLeft size={16} />
        </button>
      )}

      {/* The active tab renders above the divider (z-10) with an opaque
          background, so it covers the line wherever the two overlap — no
          pixel or colour matching required. */}
      <div className="min-w-0 flex-1">
        <div
          ref={scrollRef}
          className="flex flex-nowrap items-stretch gap-1 overflow-x-auto scroll-smooth scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className={`flex flex-nowrap items-stretch gap-1 ${centered ? "mx-auto" : ""}`}>
            {options.map((option) => {
              const isActive = option.value === selected;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onSelect(option.value)}
                  className={`relative shrink-0 whitespace-nowrap rounded-t-lg border px-5 py-2 text-[13px] font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-orange-400 ${isActive
                    ? "z-10 -mb-px border-slate-200 border-b-transparent bg-white text-slate-900 dark:border-slate-800 dark:border-b-transparent dark:bg-slate-900 dark:text-white"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                    }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {canScroll && (
        <button
          type="button"
          onClick={() => scrollByAmount(240)}
          aria-label={t("Scroll categories right")}
          className={arrowClass}
        >
          <ChevronRight size={16} />
        </button>
      )}

      {trailing}
    </div>
  );
}
