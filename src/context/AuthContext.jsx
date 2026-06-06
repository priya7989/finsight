import { createContext, useContext, useState, useEffect } from "react";
import { API_URL } from "../config";


const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(({ user }) => {
        setUser(user);
        // Restore saved theme/accent from user profile
        if (user.theme && user.theme !== "default") {
          localStorage.setItem("finsight_theme", user.theme);
        }
        if (user.accentColor) {
          localStorage.setItem("finsight_accent", user.accentColor);
        }
      })
      .catch(() => { localStorage.removeItem("token"); setToken(null); setUser(null); })
      .finally(() => setLoading(false));
  }, [token]);

  function login(userData, jwt) {
    localStorage.setItem("token", jwt);
    setToken(jwt);
    setUser(userData);
    if (userData.theme && userData.theme !== "default") {
      localStorage.setItem("finsight_theme", userData.theme);
    }
    if (userData.accentColor) {
      localStorage.setItem("finsight_accent", userData.accentColor);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }

  function updateUser(updated) {
    setUser((prev) => ({ ...prev, ...updated }));
  }

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
