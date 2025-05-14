
"use client";

import type { User, LoginFormData, SignupFormData, AuthContextType } from "@/types";
import type { ReactNode } from "react";
import { createContext, useState, useEffect } from "react";
import { 
  auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  actionCodeSettings
} from "@/lib/firebase";
import { signOut, onAuthStateChanged, type User as FirebaseUser, type AuthError } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

const EMAIL_FOR_SIGN_IN_KEY = "emailForSignIn";
const ADMIN_EMAIL = "admin@treppovision.com"; // Define Admin Email

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const completeEmailLinkSignIn = async () => {
    if (typeof window !== 'undefined' && isSignInWithEmailLink(auth, window.location.href)) {
      setIsLoading(true);
      let email = window.localStorage.getItem(EMAIL_FOR_SIGN_IN_KEY);
      if (!email) {
        toast({
          title: "Errore di Accesso",
          description: "Link di accesso non valido o scaduto. Apri il link nello stesso browser da cui è stato richiesto.",
          variant: "destructive",
        });
        setIsLoading(false);
        if (typeof window !== 'undefined') {
            window.history.replaceState({}, document.title, window.location.pathname);
            window.localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
        }
        return;
      }
      try {
        await signInWithEmailLink(auth, email, window.location.href);
        window.localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
        toast({ title: "Accesso Riuscito", description: "Bentornato!" });
      } catch (error) {
        const authError = error as AuthError;
        console.error("Errore durante l'accesso con link email:", authError);
        toast({ title: "Errore di Accesso", description: mapFirebaseAuthError(authError.code), variant: "destructive" });
        window.localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
      } finally {
        setIsLoading(false);
        if (typeof window !== 'undefined') {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
  };
  
  useEffect(() => {
    // completeEmailLinkSignIn(); // Call this early

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const appUser: User = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
          isAdmin: firebaseUser.email === ADMIN_EMAIL, // Set isAdmin based on email
        };
        setUser(appUser);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
     // Call completeEmailLinkSignIn after onAuthStateChanged is set up
    // to ensure user state is correctly processed after email link sign-in.
    // but also ensure it doesn't block initial load if not an email link scenario.
    if (typeof window !== 'undefined' && isSignInWithEmailLink(auth, window.location.href)) {
      completeEmailLinkSignIn();
    }
    
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
      case "auth/invalid-action-code":
        return "Link di accesso non valido o scaduto. Potrebbe essere già stato utilizzato o il link è malformato.";
      case "auth/user-disabled":
        return "Questo account utente è stato disabilitato.";
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
        // User state will be updated by onAuthStateChanged
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

  const sendLoginLink = async (email: string) => {
    setIsLoading(true);
    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem(EMAIL_FOR_SIGN_IN_KEY, email);
      toast({ title: "Link Inviato", description: "Controlla la tua email per il link di accesso." });
      setIsLoading(false);
      return true;
    } catch (error) {
      const authError = error as AuthError;
      console.error("Errore durante l'invio del link email:", authError);
      toast({ title: "Errore Invio Link", description: mapFirebaseAuthError(authError.code), variant: "destructive" });
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
    } finally {
      setIsLoading(false); // Ensure loading is set to false
    }
  };
  
  return (
    <AuthContext.Provider value={{ user, loginWithEmail, signupWithEmail, sendLoginLink, logout, isLoading, completeEmailLinkSignIn }}>
      {children}
    </AuthContext.Provider>
  );
};
