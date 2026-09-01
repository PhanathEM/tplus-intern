import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiArrowRight, FiEye, FiEyeOff, FiKey } from "react-icons/fi";
import { confirmPasswordReset } from "../../services/authService";
import { AuthLayout } from "./AuthLayout";
import { PasswordStrengthBar } from "./PasswordStrength";
import { getPasswordScore } from "./passwordScore";
import {
    errorBoxClass,
    fieldInputClass,
    fieldLabelClass,
    noticeBoxClass,
    primaryButtonClass,
    secondaryButtonClass,
} from "./authStyles";

// Lands here from the link an email would send (see requestPasswordReset in
// authService.js) — ?token=... identifies which account/request this is.
export default function ResetPassword({ theme, onToggleTheme }) {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";

    const [showPassword, setShowPassword] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [isDone, setIsDone] = useState(false);

    const passwordScore = useMemo(() => getPasswordScore(newPassword), [newPassword]);
    const missingTokenError = token
        ? ""
        : "This reset link is missing its token — it may have been copied incorrectly.";
    const error = submitError || missingTokenError;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token) return;

        if (newPassword.length < 8) {
            setSubmitError("New password must be at least 8 characters.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setSubmitError("Passwords do not match.");
            return;
        }

        setSubmitError("");
        setIsSubmitting(true);

        try {
            await confirmPasswordReset(token, newPassword);
            setIsDone(true);
        } catch (err) {
            if (err.status === 404) {
                setSubmitError("This isn't set up yet — ask your system administrator to reset your password for you.");
            } else if (err.status === 400 || err.status === 401) {
                setSubmitError(err.message || "This reset link is invalid or has expired. Request a new one.");
            } else {
                setSubmitError(err.message || "Something went wrong. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthLayout theme={theme} onToggleTheme={onToggleTheme}>
            <div className="mb-6">
                <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">Set a new password</h2>
                <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
                    Choose a new password for your account.
                </p>
            </div>

            {isDone ? (
                <>
                    <div className={noticeBoxClass}>Your password has been reset. You can sign in with it now.</div>
                    <Link to="/login" className={`${primaryButtonClass} mt-5`}>
                        Go to Sign In
                        <FiArrowRight size={15} />
                    </Link>
                </>
            ) : (
                <>
                    {error && <div className={`mb-5 ${errorBoxClass}`}>{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
                        <div>
                            <label className={fieldLabelClass} htmlFor="reset-new-password">
                                New Password
                            </label>
                            <div className="relative">
                                <FiKey className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                                <input
                                    id="reset-new-password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    autoComplete="new-password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter a new password"
                                    className={`${fieldInputClass} pr-11`}
                                    disabled={isSubmitting || !token}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((value) => !value)}
                                    className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-slate-400 outline-none transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-orange-400 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    disabled={isSubmitting || !token}
                                >
                                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                                </button>
                            </div>
                            <PasswordStrengthBar score={passwordScore} />
                        </div>

                        <div>
                            <label className={fieldLabelClass} htmlFor="reset-confirm-password">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <FiKey className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                                <input
                                    id="reset-confirm-password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    autoComplete="new-password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Re-enter the new password"
                                    className={fieldInputClass}
                                    disabled={isSubmitting || !token}
                                />
                            </div>
                        </div>

                        <button type="submit" className={`${primaryButtonClass} mt-2`} disabled={isSubmitting || !token}>
                            {isSubmitting ? "Saving..." : "Reset password"}
                        </button>
                    </form>

                    <Link to="/login" className={`${secondaryButtonClass} mt-3`}>
                        Back to Sign In
                    </Link>
                </>
            )}
        </AuthLayout>
    );
}
