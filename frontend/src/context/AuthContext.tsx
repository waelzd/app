import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

import { storage } from "@/src/utils/storage";
import { apiRequest, TOKEN_KEY } from "@/src/api/client";
import { registerForPush } from "@/src/lib/push";

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "user" | "admin";
};

type RegisterInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "user" | "admin";
  admin_secret?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    const token = await storage.secureGet<string>(TOKEN_KEY, "");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const me = await apiRequest<User>("/auth/me");
      setUser(me);
      registerForPush(me.id).catch(() => {});
    } catch {
      await storage.secureRemove(TOKEN_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const persist = async (token: string, u: User) => {
    await storage.secureSet(TOKEN_KEY, token);
    setUser(u);
    registerForPush(u.id).catch(() => {});
  };

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiRequest<{ access_token: string; user: User }>("/auth/login", {
      method: "POST",
      auth: false,
      body: { email, password },
    });
    await persist(res.access_token, res.user);
    return res.user;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const res = await apiRequest<{ access_token: string; user: User }>("/auth/register", {
      method: "POST",
      auth: false,
      body: input,
    });
    await persist(res.access_token, res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    await storage.secureRemove(TOKEN_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
