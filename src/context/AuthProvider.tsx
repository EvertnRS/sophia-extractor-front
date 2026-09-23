import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getMe, login as loginRequest } from "../api/auth";
import { clearToken, getToken, setToken } from "../api/authStorage";
import {
  AuthContext,
  type AuthContextValue,
  type AuthStatus,
} from "./authContextValue";
import type { CurrentUser } from "../api/auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setStatus("anonymous");
  }, []);

  // Ao carregar o app, se já existe um token salvo, valida ele contra
  // GET /auth/me (em vez de simplesmente confiar que ainda é válido --
  // pode ter expirado, ou o usuário pode ter sido desativado enquanto o
  // navegador estava fechado).
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const token = getToken();

      if (!token) {
        setStatus("anonymous");
        return;
      }

      try {
        const me = await getMe();
        if (!cancelled) {
          setUser(me);
          setStatus("authenticated");
        }
      } catch {
        if (!cancelled) {
          clearToken();
          setStatus("anonymous");
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  // Disparado pelo interceptor do axios (ver src/api/api.ts) quando
  // qualquer requisição autenticada volta com 401/403 -- sessão expirada
  // ou usuário desativado por um admin em outra sessão.
  useEffect(() => {
    function handleForcedLogout() {
      logout();
    }

    window.addEventListener("auth:logout", handleForcedLogout);
    return () => window.removeEventListener("auth:logout", handleForcedLogout);
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const { access_token } = await loginRequest({ email, password });
    setToken(access_token);

    // busca os dados do usuário logo em seguida -- assim a UI já sabe
    // nome/role sem precisar decodificar o JWT no front.
    const me = await getMe();
    setUser(me);
    setStatus("authenticated");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, logout }),
    [user, status, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}