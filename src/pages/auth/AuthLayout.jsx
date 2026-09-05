import tplusLogo from "../../assets/tplus-logo.png";
import { ThemeToggle } from "../../components/ThemeToggle";

// Shared chrome (background, theme toggle, card, TPLUS lockup) for every
// pre-auth page — login/signup and the reset-password page both render
// inside this, so a link between them never feels like a different app.
export function AuthLayout({ theme, onToggleTheme, children }) {
    return (
        <main className="relative min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-900 dark:text-slate-100">
            <div className="absolute right-5 top-5 z-10">
                <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            </div>

            <div className="flex min-h-screen flex-col items-center justify-center px-5 py-12 sm:px-8">
                <div className="mx-auto w-full max-w-md">
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40 sm:p-9">
                        <div className="mb-8 flex items-center gap-3">
                            <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                                <img src={tplusLogo} alt="TPLUS" className="h-full w-full object-cover" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">TPLUS</h1>
                                <p className="mt-0.5 text-[13px] font-medium text-slate-500 dark:text-slate-400">Management System</p>
                            </div>
                        </div>

                        {children}
                    </div>
                </div>
            </div>
        </main>
    );
}
