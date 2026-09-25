import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login, SignUp, ForgotCredentials, NewPassword, PasswordUpdated } from "../screens/Auth";
import { Home } from "../screens/Home";
import { DeckList } from "../screens/Decks";
import { DeckBuilder } from "../screens/DeckBuilder";
import { Profile } from "../screens/Profile";
import { authClient, type AppAuthSession } from "../lib";

export function App() {
  const [session, setSession] = useState<AppAuthSession | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let disposed = false;

    const loadSession = async () => {
      try {
        const nextSession = await authClient.getSession();
        if (disposed) return;
        setSession(nextSession);
      } catch (error) {
        if (disposed) return;
        console.error("Failed to load auth session", error);
        setSession(null);
      } finally {
        if (!disposed) {
          setAuthReady(true);
        }
      }
    };

    const onAuthChanged = () => {
      void loadSession();
    };

    window.addEventListener(authClient.eventName, onAuthChanged);

    void loadSession();

    return () => {
      disposed = true;
      window.removeEventListener(authClient.eventName, onAuthChanged);
    };
  }, []);

  const isAuthenticated = useMemo(() => Boolean(session), [session]);

  if (!authReady) {
    return null;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/home" replace /> : <Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot" element={<ForgotCredentials />} />
        <Route path="/reset-password" element={<NewPassword />} />
        <Route path="/password-updated" element={<PasswordUpdated />} />
        <Route path="/home" element={isAuthenticated ? <Home /> : <Navigate to="/" replace />} />
        <Route path="/decks" element={isAuthenticated ? <DeckList /> : <Navigate to="/" replace />} />
        <Route path="/decks/new" element={isAuthenticated ? <DeckBuilder /> : <Navigate to="/" replace />} />
        <Route path="/decks/:id" element={isAuthenticated ? <DeckBuilder /> : <Navigate to="/" replace />} />
        <Route
          path="/profile"
          element={isAuthenticated && session ? <Profile session={session} /> : <Navigate to="/" replace />}
        />
        <Route path="*" element={<Navigate to={isAuthenticated ? "/home" : "/"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
