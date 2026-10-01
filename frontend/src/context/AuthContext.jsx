import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

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
      const data = await api("/api/auth/me");

      const nextProfile = data.user || null;

      setProfile(nextProfile);

      return nextProfile;
    } catch (error) {
      console.error(
        "Profile loading failed:",
        error.message
      );

      setProfile(null);

      return null;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        setUser(firebaseUser);

        if (firebaseUser) {
          await loadProfile(firebaseUser);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return unsubscribe;
  }, [loadProfile]);

  async function logout() {
    try {
      await signOut(auth);
    } finally {
      setUser(null);
      setProfile(null);
    }
  }

  async function refreshProfile() {
    if (!auth.currentUser) {
      setProfile(null);
      return null;
    }

    return loadProfile(auth.currentUser);
  }

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