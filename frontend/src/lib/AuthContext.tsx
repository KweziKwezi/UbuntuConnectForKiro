import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { authApi, setSession, clearSession, getStoredUser, getToken, StoredUser } from "./api";

interface AuthContextValue {
  user: StoredUser | null;
  token: string | null;
  login: (userEmail: string, password: string) => Promise<StoredUser>;
  register: (dto: Record<string, unknown>) => Promise<{ userId: number; userType: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getToken());

  const login = useCallback(async (userEmail: string, password: string) => {
    const res = await authApi.login({ userEmail, password });
    const storedUser: StoredUser = {
      userId: res.userId,
      userType: res.userType,
      email: res.email,
      isVerified: res.isVerified,
    };
    setSession(res.token, storedUser);
    setUser(storedUser);
    setToken(res.token);
    return storedUser;
  }, []);

  const register = useCallback(async (dto: Record<string, unknown>) => {
    const res = await authApi.register(dto);
    return { userId: res.userId, userType: res.userType };
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
