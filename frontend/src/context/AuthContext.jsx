import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { onAuthStateChanged, signOut } from "firebase/auth";

import { auth } from "../services/firebase";
import { api } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (firebaseUser) => {
    if (!firebaseUser) {
      setProfile(null);
      return null;
    }

    try {
      const idToken = await firebaseUser.getIdToken();

      const data = await api("/api/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const nextProfile = data?.user || null;
      setProfile(nextProfile);

      return nextProfile;
    } catch (error) {
      console.error("Profile loading failed:", error.message);
      setProfile(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) return;

      setUser(firebaseUser);
      setLoading(true);

      try {
        if (firebaseUser) {
          await loadProfile(firebaseUser);
        } else {
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [loadProfile]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } finally {
      setUser(null);
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const firebaseUser = auth.currentUser;

    if (!firebaseUser) {
      setProfile(null);
      return null;
    }

    return loadProfile(firebaseUser);
  }, [loadProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}