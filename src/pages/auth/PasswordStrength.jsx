// Used by login.jsx for both Create Account and the Forgot Password code/reset step.
export function PasswordStrengthBar({ score }) {
    return (
        <div className="mt-2.5 flex gap-1.5" aria-hidden="true">
            {[1, 2, 3, 4].map((level) => (
                <div
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-colors ${score >= level ? "bg-emerald-500" : "bg-slate-100 dark:bg-slate-700"
                        }`}
                />
            ))}
        </div>
    );
}
