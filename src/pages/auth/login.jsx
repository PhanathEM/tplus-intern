import { useMemo, useState } from "react";
import {
    FiArrowRight,
    FiEye,
    FiEyeOff,
    FiKey,
    FiUser,
    FiUserPlus,
} from "react-icons/fi";
import { login, signup } from "../../services/authService";
import { setAuthToken } from "../../lib/apiClient";
import tplusLogo from "../../assets/tplus-logo.png";

function getPasswordScore(password) {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
}

export default function Login({ onLogin }) {
    const [mode, setMode] = useState("signin");

    const [showPassword, setShowPassword] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [rememberDevice, setRememberDevice] = useState(false);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [attempts, setAttempts] = useState(0);

    const [regFullName, setRegFullName] = useState("");
    const [regUsername, setRegUsername] = useState("");
    const [regPassword, setRegPassword] = useState("");
    const [regConfirmPassword, setRegConfirmPassword] = useState("");
    const [regShowPassword, setRegShowPassword] = useState(false);
    const [regError, setRegError] = useState("");
    const [isRegisterSubmitting, setIsRegisterSubmitting] = useState(false);
    const [signupNotice, setSignupNotice] = useState("");

    const passwordScore = useMemo(() => getPasswordScore(password), [password]);
    const regPasswordScore = useMemo(() => getPasswordScore(regPassword), [regPassword]);
    const isLocked = attempts >= 3;

    const switchMode = (nextMode) => {
        setMode(nextMode);
        setError("");
        setRegError("");
        setSignupNotice("");
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();

        if (!regFullName.trim() || !regUsername.trim() || !regPassword.trim()) {
            setRegError("Fill in your name, username, and password to continue.");
            return;
        }

        if (regPassword !== regConfirmPassword) {
            setRegError("Passwords do not match.");
            return;
        }

        setRegError("");
        setIsRegisterSubmitting(true);

        try {
            await signup({
                fullName: regFullName.trim(),
                username: regUsername.trim(),
                password: regPassword,
            });
            setRegFullName("");
            setRegUsername("");
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

        if (!username.trim() || !password.trim()) {
            setAttempts((value) => value + 1);
            setError("Enter your username and password to continue.");
            return;
        }

        setError("");
        setSignupNotice("");
        setIsSubmitting(true);

        try {
            const response = await login(username.trim(), password);
            // Field name isn't documented by the backend yet — probe common shapes.
            const token = response?.token ?? response?.access_token ?? response?.accessToken;
            if (token) setAuthToken(token);
            onLogin({
                user: {
                    ...response?.user,
                    name: response?.user?.full_name || response?.user?.username || username.trim(),
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

    return (
        <main className="min-h-screen bg-linear-to-br from-yellow-50 via-white to-amber-50 text-slate-950 overflow-hidden">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#facc15_0.8px,transparent_1px)] bg-size-[20px_20px] opacity-30 pointer-events-none" />

            <div className="flex min-h-screen flex-col items-center justify-center px-5 py-12 sm:px-8 relative">
                <div className="mx-auto w-full max-w-md">
                    {/* Main Card */}
                    <div className="rounded-3xl border border-yellow-100 bg-white/90 backdrop-blur-xl p-8 shadow-2xl shadow-yellow-500/10 sm:p-10">
                        <div className="mb-8 flex items-center gap-4">
                            <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white shadow-xl shadow-yellow-500/20 ring-1 ring-yellow-100">
                                <img
                                    src={tplusLogo}
                                    alt="TPLUS"
                                    className="h-full w-full object-cover"
                                />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-3xl font-bold tracking-tight text-slate-950">TPLUS</h1>
                                <p className="mt-0.5 text-sm font-medium text-slate-500">Management System</p>
                            </div>
                        </div>

                        {/* Mode Toggle */}
                        <div className="mb-7 grid grid-cols-2 gap-1 rounded-2xl bg-yellow-50 p-1">
                            <button
                                type="button"
                                onClick={() => switchMode("signin")}
                                className={`h-11 rounded-xl text-sm font-semibold transition-all ${mode === "signin"
                                    ? "bg-white text-slate-950 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                                    }`}
                            >
                                Sign In
                            </button>
                            <button
                                type="button"
                                onClick={() => switchMode("register")}
                                className={`h-11 rounded-xl text-sm font-semibold transition-all ${mode === "register"
                                    ? "bg-white text-slate-950 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                                    }`}
                            >
                                Create Account
                            </button>
                        </div>

                        {mode === "signin" && signupNotice && (
                            <div
                                className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700 flex items-start gap-3"
                                role="status"
                                aria-live="polite"
                            >
                                <div className="mt-0.5">✅</div>
                                <div>{signupNotice}</div>
                            </div>
                        )}

                        {mode === "signin" && error && (
                            <div
                                className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700 flex items-start gap-3"
                                role="alert"
                                aria-live="polite"
                            >
                                <div className="mt-0.5">⚠️</div>
                                <div>{error}</div>
                            </div>
                        )}

                        {mode === "register" && regError && (
                            <div
                                className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700 flex items-start gap-3"
                                role="alert"
                                aria-live="polite"
                            >
                                <div className="mt-0.5">⚠️</div>
                                <div>{regError}</div>
                            </div>
                        )}

                        {mode === "signin" ? (
                        <form onSubmit={handleSubmit} className="space-y-7" autoComplete="off">
                            {/* Username Field */}
                            <div>
                                <label
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                    htmlFor="username"
                                >
                                    Username
                                </label>
                                <div className="relative group">
                                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-yellow-500 transition-colors" />
                                    <input
                                        id="username"
                                        type="text"
                                        required
                                        autoComplete="off"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Enter your username"
                                        className="h-14 w-full rounded-2xl border border-yellow-200 bg-white pl-12 pr-5 text-base outline-none transition-all focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 placeholder:text-slate-400"
                                        disabled={isSubmitting || isLocked}
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <label
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                    htmlFor="password"
                                >
                                    Password
                                </label>
                                <div className="relative group">
                                    <FiKey className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-yellow-500 transition-colors" />
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        autoComplete="new-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        className="h-14 w-full rounded-2xl border border-yellow-200 bg-white pl-12 pr-14 text-base outline-none transition-all focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 placeholder:text-slate-400"
                                        disabled={isSubmitting || isLocked}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((value) => !value)}
                                        className="absolute right-4 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-slate-400 hover:bg-yellow-100 hover:text-slate-700 transition-all"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        disabled={isSubmitting || isLocked}
                                    >
                                        {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                                    </button>
                                </div>

                                {/* Password Strength */}
                                <div className="mt-4 flex gap-2" aria-hidden="true">
                                    {[1, 2, 3, 4].map((level) => (
                                        <div
                                            key={level}
                                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${passwordScore >= level
                                                ? "bg-linear-to-r from-yellow-400 to-amber-500"
                                                : "bg-yellow-100"
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Options */}
                            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={rememberDevice}
                                        onChange={(e) => setRememberDevice(e.target.checked)}
                                        className="h-5 w-5 accent-yellow-500 border-yellow-300 rounded-lg focus:ring-yellow-400 transition"
                                        disabled={isSubmitting || isLocked}
                                    />
                                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800 transition">
                                        Remember this device
                                    </span>
                                </label>

                                <button
                                    type="button"
                                    className="text-sm font-semibold text-slate-600 hover:text-yellow-600 transition-colors"
                                >
                                    Forgot password?
                                </button>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="mt-4 inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-linear-to-r from-yellow-500 to-amber-500 px-8 text-base font-semibold text-slate-950 shadow-lg shadow-yellow-500/30 transition-all hover:brightness-110 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-70"
                                disabled={isSubmitting || isLocked}
                            >
                                {isSubmitting ? (
                                    <>Verifying identity...</>
                                ) : (
                                    <>
                                        Sign in securely
                                        <FiArrowRight className="transition-transform group-hover:translate-x-1" />
                                    </>
                                )}
                            </button>
                        </form>
                        ) : (
                        <form onSubmit={handleRegisterSubmit} className="space-y-6" autoComplete="off">
                            {/* Full Name Field */}
                            <div>
                                <label
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                    htmlFor="reg-full-name"
                                >
                                    Full Name
                                </label>
                                <div className="relative group">
                                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-yellow-500 transition-colors" />
                                    <input
                                        id="reg-full-name"
                                        type="text"
                                        required
                                        autoComplete="off"
                                        value={regFullName}
                                        onChange={(e) => setRegFullName(e.target.value)}
                                        placeholder="Enter your full name"
                                        className="h-14 w-full rounded-2xl border border-yellow-200 bg-white pl-12 pr-5 text-base outline-none transition-all focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 placeholder:text-slate-400"
                                        disabled={isRegisterSubmitting}
                                    />
                                </div>
                            </div>

                            {/* Username Field */}
                            <div>
                                <label
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                    htmlFor="reg-username"
                                >
                                    Username
                                </label>
                                <div className="relative group">
                                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-yellow-500 transition-colors" />
                                    <input
                                        id="reg-username"
                                        type="text"
                                        required
                                        autoComplete="off"
                                        value={regUsername}
                                        onChange={(e) => setRegUsername(e.target.value)}
                                        placeholder="Choose a username"
                                        className="h-14 w-full rounded-2xl border border-yellow-200 bg-white pl-12 pr-5 text-base outline-none transition-all focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 placeholder:text-slate-400"
                                        disabled={isRegisterSubmitting}
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <label
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                    htmlFor="reg-password"
                                >
                                    Password
                                </label>
                                <div className="relative group">
                                    <FiKey className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-yellow-500 transition-colors" />
                                    <input
                                        id="reg-password"
                                        type={regShowPassword ? "text" : "password"}
                                        required
                                        autoComplete="new-password"
                                        value={regPassword}
                                        onChange={(e) => setRegPassword(e.target.value)}
                                        placeholder="Create a password"
                                        className="h-14 w-full rounded-2xl border border-yellow-200 bg-white pl-12 pr-14 text-base outline-none transition-all focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 placeholder:text-slate-400"
                                        disabled={isRegisterSubmitting}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setRegShowPassword((value) => !value)}
                                        className="absolute right-4 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-slate-400 hover:bg-yellow-100 hover:text-slate-700 transition-all"
                                        aria-label={regShowPassword ? "Hide password" : "Show password"}
                                        disabled={isRegisterSubmitting}
                                    >
                                        {regShowPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                                    </button>
                                </div>

                                {/* Password Strength */}
                                <div className="mt-4 flex gap-2" aria-hidden="true">
                                    {[1, 2, 3, 4].map((level) => (
                                        <div
                                            key={level}
                                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${regPasswordScore >= level
                                                ? "bg-linear-to-r from-yellow-400 to-amber-500"
                                                : "bg-yellow-100"
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Confirm Password Field */}
                            <div>
                                <label
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                    htmlFor="reg-confirm-password"
                                >
                                    Confirm Password
                                </label>
                                <div className="relative group">
                                    <FiKey className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-yellow-500 transition-colors" />
                                    <input
                                        id="reg-confirm-password"
                                        type={regShowPassword ? "text" : "password"}
                                        required
                                        autoComplete="new-password"
                                        value={regConfirmPassword}
                                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                                        placeholder="Re-enter your password"
                                        className="h-14 w-full rounded-2xl border border-yellow-200 bg-white pl-12 pr-5 text-base outline-none transition-all focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 placeholder:text-slate-400"
                                        disabled={isRegisterSubmitting}
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="mt-4 inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-linear-to-r from-yellow-500 to-amber-500 px-8 text-base font-semibold text-slate-950 shadow-lg shadow-yellow-500/30 transition-all hover:brightness-110 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-70"
                                disabled={isRegisterSubmitting}
                            >
                                {isRegisterSubmitting ? (
                                    <>Creating account...</>
                                ) : (
                                    <>
                                        Create account
                                        <FiUserPlus className="transition-transform group-hover:translate-x-1" />
                                    </>
                                )}
                            </button>
                        </form>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
