// pages/lib/authContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithPopup, User as FirebaseUser } from "firebase/auth";
import { auth, googleProvider } from "./firebaseClient";
import { logInfo, logError } from "./logger";
import { useRouter } from "next/router";

type AuthContextType = {
  user: FirebaseUser | null;
  loading: boolean;
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      logInfo("Auth state changed", { uid: u?.uid ?? null, email: u?.email ?? null });
    });
    return () => unsub();
  }, []);

  const register = async (email: string, password: string) => {
    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      logInfo("User registered", { email });
      router.push("/"); // go to home
    } catch (err) {
      logError("Register failed", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      logInfo("User logged in", { email });
      router.push("/");
    } catch (err) {
      logError("Login failed", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
      logInfo("User logged in with Google");
      router.push("/");
    } catch (err) {
      logError("Google login failed", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      logInfo("User logged out");
      router.push("/login");
    } catch (err) {
      logError("Logout failed", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = { user, loading, register, login, loginWithGoogle, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
