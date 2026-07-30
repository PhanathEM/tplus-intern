import { useState } from "react";
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

  function handleLogin(newSession) {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
    setSession(newSession);
  }

  function handleLogout() {
    setAuthToken(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setSession(null);
  }

  if (!session) {
    return <Login onLogin={handleLogin} />;
  }

  return <Dashboard user={session.user} onLogout={handleLogout} />;
}

export default App;
