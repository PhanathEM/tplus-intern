import { useMemo, useState } from "react";
import {
    FiArrowLeft,
    FiArrowRight,
    FiEye,
    FiEyeOff,
    FiKey,
    FiMail,
    FiUser,
    FiUserPlus,
} from "react-icons/fi";
import { login, signup, requestPasswordReset } from "../../services/authService";
import { setAuthToken, setStoredCredentials } from "../../lib/apiClient";
import { AuthLayout } from "./AuthLayout";
import { PasswordStrengthBar } from "./PasswordStrength";
import { getPasswordScore } from "./passwordScore";
import {
    errorBoxClass,
    fieldInputClass,
    fieldLabelClass,
    noticeBoxClass,
    primaryButtonClass,
} from "./authStyles";

export default function Login({ onLogin, theme, onToggleTheme }) {
    // "signin" | "register" | "forgot"
    const [mode, setMode] = useState("signin");

    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberDevice, setRememberDevice] = useState(false);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [attempts, setAttempts] = useState(0);

    const [regUsername, setRegUsername] = useState("");
    const [regEmail, setRegEmail] = useState("");
    const [regPassword, setRegPassword] = useState("");
    const [regConfirmPassword, setRegConfirmPassword] = useState("");
    const [regShowPassword, setRegShowPassword] = useState(false);
    const [regError, setRegError] = useState("");
    const [isRegisterSubmitting, setIsRegisterSubmitting] = useState(false);
    const [signupNotice, setSignupNotice] = useState("");

    // Backend doesn't have the real forgot-password endpoint built yet (see
    // the spec sent over) — this still runs the real request so it starts
    // working the moment that ships, but a 404 today is handled honestly
    // instead of pretending an email went out.
    const [forgotUsername, setForgotUsername] = useState("");
    const [isRequestingReset, setIsRequestingReset] = useState(false);
    const [forgotError, setForgotError] = useState("");
    const [forgotNotice, setForgotNotice] = useState("");

    const passwordScore = useMemo(() => getPasswordScore(password), [password]);
    const regPasswordScore = useMemo(() => getPasswordScore(regPassword), [regPassword]);
    const isLocked = attempts >= 3;

    const switchMode = (nextMode) => {
        setMode(nextMode);
        setError("");
        setRegError("");
        setSignupNotice("");
        setForgotError("");
        setForgotNotice("");
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();

        if (!regUsername.trim() || !regEmail.trim() || !regPassword.trim()) {
            setRegError("Fill in your username, email, and password to continue.");
            return;
        }

        if (!/^\S+@\S+\.\S+$/.test(regEmail.trim())) {
            setRegError("Enter a valid email address.");
            return;
        }

        if (regPassword !== regConfirmPassword) {
            setRegError("Passwords do not match.");
            return;
        }

        setRegError("");
        setIsRegisterSubmitting(true);

        try {
            // No separate "Full Name" field anymore — the username doubles
            // as the display name; an admin can still rename the account
            // later from the Users page.
            await signup({
                fullName: regUsername.trim(),
                username: regUsername.trim(),
                email: regEmail.trim(),
                password: regPassword,
            });
            setRegUsername("");
            setRegEmail("");
            setRegPassword("");
            setRegConfirmPassword("");
            setSignupNotice("Account created — an admin needs to approve it before you can sign in.");
            setMode("signin");
        } catch (err) {
            setRegError(err.message || "Could not create your account. Please try again.");
        } finally {
            setIsRegisterSubmitting(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isLocked) {
            setError("Too many sign-in attempts. Please wait before trying again.");
            return;
        }

        if (!email.trim() || !password.trim()) {
            setAttempts((value) => value + 1);
            setError("Enter your email and password to continue.");
            return;
        }

        setError("");
        setSignupNotice("");
        setIsSubmitting(true);

        try {
            const response = await login(email.trim(), password);
            // Field name isn't documented by the backend yet — probe common shapes.
            const token = response?.token ?? response?.access_token ?? response?.accessToken;
            if (token) setAuthToken(token);
            // Captured fresh on every successful login so the backend's
            // still-required username/password query params (see
            // apiClient.js) always match whatever the password actually is
            // right now — including right after this same account's
            // password was changed via Account settings.
            setStoredCredentials(email.trim(), password);
            onLogin({
                user: {
                    ...response?.user,
                    name: response?.user?.full_name || response?.user?.username || email.trim(),
                    rememberDevice,
                },
            });
        } catch (err) {
            setAttempts((value) => value + 1);
            setError(err.message || "Invalid username or password.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();

        if (!forgotUsername.trim()) {
            setForgotError("Enter your username to continue.");
            return;
        }

        setForgotError("");
        setForgotNotice("");
        setIsRequestingReset(true);

        try {
            await requestPasswordReset(forgotUsername.trim());
            // Same wording regardless of whether the account exists — never
            // let this confirm/deny a username to whoever's asking.
            setForgotNotice("If an account exists for that username, a reset link has been sent to the email on file.");
        } catch (err) {
            if (err.status === 404) {
                setForgotError("This isn't set up yet — ask your system administrator to reset your password for you.");
            } else if (err.status >= 500) {
                setForgotError(err.message || "Something went wrong. Please try again.");
            } else {
                setForgotNotice("If an account exists for that username, a reset link has been sent to the email on file.");
            }
        } finally {
            setIsRequestingReset(false);
        }
    };

    return (
        <AuthLayout theme={theme} onToggleTheme={onToggleTheme}>
            {mode !== "forgot" && (
                <div className="mb-7 flex border-b border-slate-200 dark:border-slate-700">
                    <button
                        type="button"
                        onClick={() => switchMode("signin")}
                        className={`flex-1 border-b-2 px-4 py-2.5 text-[13px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-inset ${mode === "signin"
                            ? "border-orange-500 text-orange-600 dark:text-orange-400"
                            : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            }`}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        onClick={() => switchMode("register")}
                        className={`flex-1 border-b-2 px-4 py-2.5 text-[13px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-inset ${mode === "register"
                            ? "border-orange-500 text-orange-600 dark:text-orange-400"
                            : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            }`}
                    >
                        Create Account
                    </button>
                </div>
            )}

            {mode === "signin" && signupNotice && <div className={`mb-5 ${noticeBoxClass}`}>{signupNotice}</div>}
            {mode === "signin" && error && <div className={`mb-5 ${errorBoxClass}`}>{error}</div>}
            {mode === "register" && regError && <div className={`mb-5 ${errorBoxClass}`}>{regError}</div>}

            {mode === "signin" && (
                <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
                    {/* Email Field */}
                    <div>
                        <label className={fieldLabelClass} htmlFor="email">
                            Email
                        </label>
                        <div className="relative">
                            <FiMail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                            <input
                                id="email"
                                type="email"
                                required
                                autoComplete="off"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                className={fieldInputClass}
                                disabled={isSubmitting || isLocked}
                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div>
                        <label className={fieldLabelClass} htmlFor="password">
                            Password
                        </label>
                        <div className="relative">
                            <FiKey className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                required
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className={`${fieldInputClass} pr-11`}
                                disabled={isSubmitting || isLocked}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((value) => !value)}
                                className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-slate-400 outline-none transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-orange-400 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                disabled={isSubmitting || isLocked}
                            >
                                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </button>
                        </div>
                        <PasswordStrengthBar score={passwordScore} />
                    </div>

                    {/* Options */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <label className="flex cursor-pointer items-center gap-2">
                            <input
                                type="checkbox"
                                checked={rememberDevice}
                                onChange={(e) => setRememberDevice(e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-800"
                                disabled={isSubmitting || isLocked}
                            />
                            <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400">
                                Remember this device
                            </span>
                        </label>

                        <button
                            type="button"
                            onClick={() => switchMode("forgot")}
                            className="rounded text-[13px] font-semibold text-orange-600 outline-none transition hover:text-orange-700 focus-visible:ring-2 focus-visible:ring-orange-400 dark:text-orange-400 dark:hover:text-orange-300"
                        >
                            Forgot password?
                        </button>
                    </div>

                    {/* Submit Button */}
                    <button type="submit" className={`${primaryButtonClass} mt-2`} disabled={isSubmitting || isLocked}>
                        {isSubmitting ? (
                            <>Verifying identity...</>
                        ) : (
                            <>
                                Sign in securely
                                <FiArrowRight size={15} />
                            </>
                        )}
                    </button>
                </form>
            )}

            {mode === "register" && (
                <form onSubmit={handleRegisterSubmit} className="space-y-5" autoComplete="off">
                    {/* Username Field */}
                    <div>
                        <label className={fieldLabelClass} htmlFor="reg-username">
                            Username
                        </label>
                        <div className="relative">
                            <FiUser className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                            <input
                                id="reg-username"
                                type="text"
                                required
                                autoComplete="off"
                                value={regUsername}
                                onChange={(e) => setRegUsername(e.target.value)}
                                placeholder="Choose a username"
                                className={fieldInputClass}
                                disabled={isRegisterSubmitting}
                            />
                        </div>
                    </div>

                    {/* Email Field */}
                    <div>
                        <label className={fieldLabelClass} htmlFor="reg-email">
                            Email
                        </label>
                        <div className="relative">
                            <FiMail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                            <input
                                id="reg-email"
                                type="email"
                                required
                                autoComplete="off"
                                value={regEmail}
                                onChange={(e) => setRegEmail(e.target.value)}
                                placeholder="you@company.com"
                                className={fieldInputClass}
                                disabled={isRegisterSubmitting}
                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div>
                        <label className={fieldLabelClass} htmlFor="reg-password">
                            Password
                        </label>
                        <div className="relative">
                            <FiKey className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                            <input
                                id="reg-password"
                                type={regShowPassword ? "text" : "password"}
                                required
                                autoComplete="new-password"
                                value={regPassword}
                                onChange={(e) => setRegPassword(e.target.value)}
                                placeholder="Create a password"
                                className={`${fieldInputClass} pr-11`}
                                disabled={isRegisterSubmitting}
                            />
                            <button
                                type="button"
                                onClick={() => setRegShowPassword((value) => !value)}
                                className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-slate-400 outline-none transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-orange-400 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                                aria-label={regShowPassword ? "Hide password" : "Show password"}
                                disabled={isRegisterSubmitting}
                            >
                                {regShowPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </button>
                        </div>
                        <PasswordStrengthBar score={regPasswordScore} />
                    </div>

                    {/* Confirm Password Field */}
                    <div>
                        <label className={fieldLabelClass} htmlFor="reg-confirm-password">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <FiKey className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                            <input
                                id="reg-confirm-password"
                                type={regShowPassword ? "text" : "password"}
                                required
                                autoComplete="new-password"
                                value={regConfirmPassword}
                                onChange={(e) => setRegConfirmPassword(e.target.value)}
                                placeholder="Re-enter your password"
                                className={fieldInputClass}
                                disabled={isRegisterSubmitting}
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button type="submit" className={`${primaryButtonClass} mt-2`} disabled={isRegisterSubmitting}>
                        {isRegisterSubmitting ? (
                            <>Creating account...</>
                        ) : (
                            <>
                                Create account
                                <FiUserPlus size={15} />
                            </>
                        )}
                    </button>
                </form>
            )}

            {mode === "forgot" && (
                <>
                    <div className="mb-6">
                        <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">Reset your password</h2>
                        <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
                            Enter your username and we'll email a reset link to the address on file for that account.
                        </p>
                    </div>

                    {forgotNotice && <div className={`mb-5 ${noticeBoxClass}`}>{forgotNotice}</div>}
                    {forgotError && <div className={`mb-5 ${errorBoxClass}`}>{forgotError}</div>}

                    {!forgotNotice && (
                        <form onSubmit={handleForgotSubmit} className="space-y-5" autoComplete="off">
                            <div>
                                <label className={fieldLabelClass} htmlFor="forgot-username">
                                    Username
                                </label>
                                <div className="relative">
                                    <FiUser className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                                    <input
                                        id="forgot-username"
                                        type="text"
                                        required
                                        autoComplete="off"
                                        value={forgotUsername}
                                        onChange={(e) => setForgotUsername(e.target.value)}
                                        placeholder="Enter your username"
                                        className={fieldInputClass}
                                        disabled={isRequestingReset}
                                    />
                                </div>
                            </div>

                            <button type="submit" className={primaryButtonClass} disabled={isRequestingReset}>
                                {isRequestingReset ? "Sending..." : "Send reset link"}
                            </button>
                        </form>
                    )}

                    <button
                        type="button"
                        onClick={() => switchMode("signin")}
                        className="mt-5 inline-flex items-center gap-1.5 rounded text-[13px] font-semibold text-slate-600 outline-none transition hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                        <FiArrowLeft size={14} />
                        Back to Sign In
                    </button>
                </>
            )}
        </AuthLayout>
    );
}
