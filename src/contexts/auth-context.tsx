
"use client";

import type { User } from "@/types";
import type { Dispatch, ReactNode, SetStateAction} from "react";
import { createContext, useState, useEffect } from "react";

interface AuthContextType {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  login: (asAdmin: boolean) => void;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading user from storage
    try {
      const storedUser = localStorage.getItem("treppoUser");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to load user from localStorage", error);
      localStorage.removeItem("treppoUser"); // Clear corrupted data
    }
    setIsLoading(false);
  }, []);

  const login = (asAdmin: boolean) => {
    const mockUser: User = {
      id: "mockUserId",
      name: asAdmin ? "Admin User" : " EurovisionFan_123",
      isAdmin: asAdmin,
    };
    setUser(mockUser);
    localStorage.setItem("treppoUser", JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("treppoUser");
  };
  
  // Prevents rendering children until loading is complete to avoid hydration issues
  if (isLoading) {
    return null; // Or a loading spinner for the whole app
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
