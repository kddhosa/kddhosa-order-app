import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "@/lib/firebase";
import { User, UserRole } from "@/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          try {
            const authDoc = await getDoc(
              doc(db, "authorizedUsers", "auth_doc")
            );
            const authData = authDoc.data();

            console.log(
              "Firebase User:",
              authData?.emails?.includes(firebaseUser.email)
            );
            console.log("Auth Data:", authData?.roles?.[firebaseUser.email!]);
            if (
              authData?.emails?.includes(firebaseUser.email) &&
              authData?.roles?.[firebaseUser.email!]
            ) {
              const userData: User = {
                uid: firebaseUser.uid,
                email: firebaseUser.email!,
                role: authData.roles[firebaseUser.email!] as UserRole,
                displayName: firebaseUser.displayName || undefined,
              };
              setUser(userData);
            } else {
              // User not authorized, sign them out
              await signOut(auth);
              setUser(null);
            }
          } catch (error) {
            console.error("Error checking user authorization:", error);
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
