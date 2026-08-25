import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/dashboard/dashboard";
import Login from "./pages/auth/login";
import { setAuthToken } from "./lib/apiClient";
import { mergeStoredPermissionsForUser } from "./lib/permissions";
import { useTheme } from "./hooks/useTheme";
import { useLanguage } from "./hooks/useLanguage";

const SESSION_STORAGE_KEY = "tplus_session";

function loadStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    const session = raw ? JSON.parse(raw) : null;
    return session?.user ? { ...session, user: mergeStoredPermissionsForUser(session.user) } : session;
  } catch {
    return null;
  }
}

function App() {
  const [session, setSession] = useState(loadStoredSession);
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();

  useEffect(() => {
    if (!session) {
      document.title = "Sign In | TPLUS Management System";
    }
  }, [session]);

  function handleLogin(newSession) {
    const nextSession = newSession?.user
      ? { ...newSession, user: mergeStoredPermissionsForUser(newSession.user) }
      : newSession;
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
  }

  function handleLogout() {
    setAuthToken(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setSession(null);
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          session ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Login onLogin={handleLogin} theme={theme} onToggleTheme={toggleTheme} />
          )
        }
      />
      <Route
        path="/dashboard/*"
        element={
          session ? (
            <Dashboard
              user={session.user}
              onLogout={handleLogout}
              theme={theme}
              onToggleTheme={toggleTheme}
              language={language}
              onToggleLanguage={toggleLanguage}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="/" element={<Navigate to={session ? "/dashboard" : "/login"} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
