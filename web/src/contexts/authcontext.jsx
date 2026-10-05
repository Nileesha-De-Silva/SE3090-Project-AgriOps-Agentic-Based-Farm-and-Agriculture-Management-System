import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getToken, setToken } from "../api/authToken";
import { login as apiLogin, logout as apiLogout } from "../api/authApi";
import { getMe } from "../api/adminApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { id, username, roles: [] }
  const [loading, setLoading] = useState(true);

  // On first load, if a token is saved, ask the backend who it belongs to.
  useEffect(() => {
    async function loadUser() {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const me = await getMe();
        setUser({ id: me.id, username: me.username, roles: me.roles });
      } catch {
        setToken(null); // token expired or invalid
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = useCallback(async (username, password) => {
    const result = await apiLogin(username, password);
    setUser({ id: result.userId, username: result.username, roles: result.roles });
    return result;
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (...roles) => !!user && roles.some((r) => user.roles?.includes(r)),
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
}