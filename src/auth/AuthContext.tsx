import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getAuth, postForm, postJson } from "@/lib/api";

type User = { id: number; email: string; full_name?: string | null };
type AuthCtx = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, full_name?: string) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);
export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within <AuthProvider>");
  return v;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("auth_token"));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // hydrate user on first load if token exists
  useEffect(() => {
    (async () => {
      try {
        if (token) {
          const me = await getAuth("/auth/me", token);
          setUser(me);
        }
      } catch {
        localStorage.removeItem("auth_token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await postForm("/auth/login", { username: email, password });
    localStorage.setItem("auth_token", res.access_token);
    setToken(res.access_token);
    const me = await getAuth("/auth/me", res.access_token);
    setUser(me);
  };

  const register = async (email: string, password: string, full_name?: string) => {
    await postJson("/auth/register", { email, password, full_name });
    // auto-login after register:
    await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
  };

  const value = useMemo(() => ({ user, token, loading, login, register, logout }), [user, token, loading]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};
