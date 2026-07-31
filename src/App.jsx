import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/dashboard/dashboard";
import Login from "./pages/auth/login";
import { setAuthToken } from "./lib/apiClient";

const SESSION_STORAGE_KEY = "tplus_session";

function loadStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function App() {
  const [session, setSession] = useState(loadStoredSession);

  useEffect(() => {
    if (!session) {
      document.title = "Sign In | TPLUS Management System";
    }
  }, [session]);

  function handleLogin(newSession) {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
    setSession(newSession);
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
        element={session ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />}
      />
      <Route
        path="/dashboard/*"
        element={
          session ? (
            <Dashboard user={session.user} onLogout={handleLogout} />
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
