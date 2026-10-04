import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { api, ApiError, loadStoredToken, setApiToken, setUnauthorizedHandler, TOKEN_KEY } from "@/lib/api";
import { storage } from "@/lib/storage";
import type { Me } from "@/lib/types";

type AuthState =
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "signedIn"; me: Me };

type AuthContextValue = {
  state: AuthState;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  const clearSession = useCallback(async () => {
    setApiToken(null);
    await storage.remove(TOKEN_KEY);
    setState({ status: "signedOut" });
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void clearSession();
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await loadStoredToken();
      if (!stored) {
        if (!cancelled) setState({ status: "signedOut" });
        return;
      }
      setApiToken(stored);
      try {
        const me = await api<Me>("/me");
        if (!cancelled) setState({ status: "signedIn", me });
      } catch (e) {
        // Ağ hatasında oturumu silme: belirteç hâlâ geçerli olabilir.
        if (e instanceof ApiError && e.status === 0) {
          if (!cancelled) setState({ status: "signedOut" });
          return;
        }
        if (!cancelled) await clearSession();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { token } = await api<{ token: string }>("/auth/login", { method: "POST", body: { email, password } });
    setApiToken(token);
    try {
      const me = await api<Me>("/me");
      await storage.set(TOKEN_KEY, token);
      setState({ status: "signedIn", me });
    } catch (e) {
      setApiToken(null);
      throw e;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      // Çevrimdışıysak da yerelde çıkış yap.
    }
    await clearSession();
  }, [clearSession]);

  const refreshMe = useCallback(async () => {
    const me = await api<Me>("/me");
    setState({ status: "signedIn", me });
  }, []);

  const value = useMemo(() => ({ state, signIn, signOut, refreshMe }), [state, signIn, signOut, refreshMe]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth yalnızca AuthProvider içinde kullanılabilir.");
  return ctx;
}

/** Giriş yapmış kullanıcı (yalnızca korumalı ekranlarda). */
export function useMe(): Me {
  const { state } = useAuth();
  if (state.status !== "signedIn") throw new Error("Oturum yok.");
  return state.me;
}
