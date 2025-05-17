import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiRequest } from "./queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {
    throw new Error("Not implemented");
  },
  logout: async () => {
    throw new Error("Not implemented");
  },
  isLoading: false,
  error: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const login = async (email: string, password: string): Promise<User> => {
    try {
      setError(null);
      const res = await apiRequest("POST", "/api/auth/login", { email, password });
      const data = await res.json();
      queryClient.setQueryData(["/api/auth/me"], data.user);
      return data.user;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setError(null);
      await apiRequest("POST", "/api/auth/logout");
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.clear();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
