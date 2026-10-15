import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const userId = localStorage.getItem("userId");
      const userName = localStorage.getItem("userName");
      const userEmail = localStorage.getItem("userEmail");
      const storedToken = localStorage.getItem("token");

      if (userId) {
        setUser({
          id: Number(userId),
          name: userName || "",
          email: userEmail || "",
        });

        setToken(storedToken || null);
      }
    } catch (err) {
      console.error("Auth hydration failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = ({ user: userData, token: authToken }) => {
    localStorage.setItem("userId", String(userData.id));
    localStorage.setItem("userName", userData.name || "");
    localStorage.setItem("userEmail", userData.email || "");

    if (authToken) {
      localStorage.setItem("token", authToken);
    }

    setUser(userData);
    setToken(authToken || null);
  };

  const logout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("token");

    setUser(null);
    setToken(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }

  return ctx;
}
