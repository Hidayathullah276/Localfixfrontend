import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "@/lib/api";

type UserRole = "customer" | "worker" | "admin";

interface User {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  roles: UserRole[];
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  roles: UserRole[];
  loading: boolean;
  signIn: (data: { token: string; user: any }) => void;
  signOut: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  roles: [],
  loading: true,
  signIn: () => { },
  signOut: () => { },
  refreshUser: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const userData = await api.get("/auth/me");
          setUser(userData);
        } catch (error) {
          console.error("Auth initialization failed", error);
          localStorage.removeItem("token");
          setToken(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const signIn = ({ token, user }: { token: string; user: any }) => {
    localStorage.setItem("token", token);
    setToken(token);
    setUser(user);
  };

  const signOut = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    const userData = await api.get("/auth/me");
    setUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        roles: user?.roles || [],
        loading,
        signIn,
        signOut,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
