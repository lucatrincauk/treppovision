
"use client";

import type { User } from "@/types";
import type { Dispatch, ReactNode, SetStateAction} from "react";
import { createContext, useState, useEffect } from "react";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup, signOut, onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";

interface AuthContextType {
  user: User | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Map Firebase user to your app's User type
        const appUser: User = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
          // For isAdmin, you would typically check against a database or custom claims
          // For this example, we'll default to false.
          isAdmin: false, 
        };
        setUser(appUser);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const login = async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged will handle setting the user state
    } catch (error) {
      console.error("Errore durante l'accesso con Google:", error);
      // Potresti voler mostrare un toast di errore qui
    } finally {
      // setIsLoading(false); // onAuthStateChanged handles this
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      // onAuthStateChanged will handle setting the user state to null
    } catch (error) {
      console.error("Errore durante il logout:", error);
    } finally {
      // setIsLoading(false); // onAuthStateChanged handles this
    }
  };
  
  if (isLoading) {
    // You might want a global loading spinner here, 
    // or return null to prevent rendering children until auth state is resolved.
    // Returning null to match previous behavior for now.
    return null; 
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
