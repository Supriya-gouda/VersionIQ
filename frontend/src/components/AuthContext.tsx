import React, { createContext, useContext, useEffect, useState } from "react";
import { me, getAccessToken, clearAccessToken, type ApiUser } from "@/lib/api";

type AuthContextType = {
  user: ApiUser | null;
  loading: boolean;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await me();
      setUser(response.user);
    } catch (error) {
      console.error("Auth rehydration failed:", error);
      clearAccessToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearAccessToken();
    setUser(null);
    window.location.href = "/login";
  }

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
