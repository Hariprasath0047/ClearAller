import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../lib/api";

export type SessionAccount = {
  id: string;
  email: string;
  displayName: string;
};

type LoginPayload = {
  email: string;
  password: string;
};

type SignupPayload = {
  displayName: string;
  email: string;
  password: string;
};

type AuthContextValue = {
  account: SessionAccount | null;
  isAuthenticated: boolean;
  isBusy: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => void;
};

const STORAGE_KEY = "clearaller.session";

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredAccount() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SessionAccount) : null;
  } catch {
    return null;
  }
}

function persistAccount(account: SessionAccount | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (account) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<SessionAccount | null>(() => readStoredAccount());
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    persistAccount(account);
  }, [account]);

  async function login({ email, password }: LoginPayload) {
    if (!email.trim() || !password.trim()) {
      throw new Error("Enter both email and password to continue.");
    }

    setIsBusy(true);
    try {
      const response = await api.get<SessionAccount>("/api/account/demo");
      setAccount(response.data);
    } finally {
      setIsBusy(false);
    }
  }

  async function signup({ displayName, email, password }: SignupPayload) {
    if (!displayName.trim()) {
      throw new Error("Enter your name to create an account.");
    }

    if (!email.trim() || !password.trim()) {
      throw new Error("Enter email and password to create an account.");
    }

    setIsBusy(true);
    try {
      const response = await api.post<SessionAccount>("/api/account", {
        email: email.trim(),
        displayName: displayName.trim()
      });
      setAccount(response.data);
    } finally {
      setIsBusy(false);
    }
  }

  function logout() {
    setAccount(null);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      account,
      isAuthenticated: Boolean(account),
      isBusy,
      login,
      signup,
      logout
    }),
    [account, isBusy]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
