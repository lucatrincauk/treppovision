
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
        // User opened the link on a different device. To prevent session fixation
        // attacks, ask the user to provide a FAKE email. WORKAROUND.
        // Ideally, do not use this workaround. Instruct users to open on same device.
        // email = window.prompt('Please provide your email for confirmation');
        // For now, we'll show an error if email is not found in localStorage,
        // which means the link should be opened on the same browser it was requested from.
        toast({
          title: "Errore di Accesso",
          description: "Link di accesso non valido o scaduto. Apri il link nello stesso browser da cui è stato richiesto.",
          variant: "destructive",
        });
        setIsLoading(false);
        // Clean up URL
        if (typeof window !== 'undefined') {
            window.history.replaceState({}, document.title, window.location.pathname);
            window.localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
        }
        return;
      }
      try {
        await signInWithEmailLink(auth, email, window.location.href);
        window.localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
        // onAuthStateChanged will handle user state update
        toast({ title: "Accesso Riuscito", description: "Bentornato!" });
      } catch (error) {
        const authError = error as AuthError;
        console.error("Errore durante l'accesso con link email:", authError);
        toast({ title: "Errore di Accesso", description: mapFirebaseAuthError(authError.code), variant: "destructive" });
        window.localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
      } finally {
        setIsLoading(false);
        // Clean up URL
        if (typeof window !== 'undefined') {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
  };
  
  useEffect(() => {
    completeEmailLinkSignIn(); // Attempt to complete sign in on page load

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
        const updatedFirebaseUser = auth.currentUser;
        if (updatedFirebaseUser) {
            const appUser: User = {
                uid: updatedFirebaseUser.uid,
                displayName: updatedFirebaseUser.displayName,
                email: updatedFirebaseUser.email,
                photoURL: updatedFirebaseUser.photoURL,
                isAdmin: false,
            };
            setUser(appUser); 
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
    }
  };
  
  return (
    <AuthContext.Provider value={{ user, loginWithEmail, signupWithEmail, sendLoginLink, logout, isLoading, completeEmailLinkSignIn }}>
      {children}
    </AuthContext.Provider>
  );
};
