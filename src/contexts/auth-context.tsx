
"use client";

import type { User, LoginFormData, SignupFormData } from "@/types";
import type { Dispatch, ReactNode, SetStateAction} from "react";
import { createContext, useState, useEffect } from "react";
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "@/lib/firebase";
import { signOut, onAuthStateChanged, type User as FirebaseUser, type AuthError } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  loginWithEmail: (data: LoginFormData) => Promise<boolean>;
  signupWithEmail: (data: SignupFormData) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const appUser: User = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
          isAdmin: false, 
        };
        setUser(appUser);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const mapFirebaseAuthError = (errorCode: string): string => {
    switch (errorCode) {
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "Email o password non validi.";
      case "auth/email-already-in-use":
        return "Questo indirizzo email è già registrato.";
      case "auth/weak-password":
        return "La password è troppo debole. Deve essere di almeno 6 caratteri.";
      case "auth/invalid-email":
        return "L'indirizzo email non è valido.";
      default:
        return "Si è verificato un errore. Riprova.";
    }
  };

  const loginWithEmail = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({ title: "Accesso Riuscito", description: "Bentornato!" });
      setIsLoading(false);
      return true;
    } catch (error) {
      const authError = error as AuthError;
      console.error("Errore durante l'accesso con email:", authError);
      toast({ title: "Errore di Accesso", description: mapFirebaseAuthError(authError.code), variant: "destructive" });
      setIsLoading(false);
      return false;
    }
  };

  const signupWithEmail = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      if (data.displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName: data.displayName });
         // Re-fetch user to get updated displayName, or update local state
        const updatedFirebaseUser = auth.currentUser;
        if (updatedFirebaseUser) {
            const appUser: User = {
                uid: updatedFirebaseUser.uid,
                displayName: updatedFirebaseUser.displayName,
                email: updatedFirebaseUser.email,
                photoURL: updatedFirebaseUser.photoURL,
                isAdmin: false,
            };
            setUser(appUser); // Update context user
        }
      }
      toast({ title: "Registrazione Riuscita", description: "Benvenuto! Il tuo account è stato creato." });
      setIsLoading(false);
      return true;
    } catch (error) {
      const authError = error as AuthError;
      console.error("Errore durante la registrazione con email:", authError);
      toast({ title: "Errore di Registrazione", description: mapFirebaseAuthError(authError.code), variant: "destructive" });
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      toast({ title: "Logout Riuscito", description: "A presto!"});
    } catch (error) {
      console.error("Errore durante il logout:", error);
      toast({ title: "Errore Logout", description: "Non è stato possibile effettuare il logout. Riprova.", variant: "destructive" });
    }
    // setIsLoading is managed by onAuthStateChanged after signOut
  };
  
  return (
    <AuthContext.Provider value={{ user, loginWithEmail, signupWithEmail, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
