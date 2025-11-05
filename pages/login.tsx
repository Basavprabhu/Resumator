// pages/login.tsx
"use client";

import React, { useState } from "react";
import { useAuth } from "../lib/authContext";
import { logInfo, logError } from "../lib/logger";

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      await login(email, password);
      logInfo("Login submitted", { email });
    } catch (err: any) {
      logError("Login error", err);
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    try {
      setLoading(true);
      await loginWithGoogle();
    } catch (err: any) {
      logError("Google login error", err);
      setError(err?.message || "Google login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white rounded-md shadow-md p-6">
        <h1 className="text-2xl font-semibold mb-4 text-gray-900">Log in</h1>
        {error && <div className="mb-3 text-red-900">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            className="w-full border rounded-md p-2 text-gray-700"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full border rounded-md p-2 text-gray-700"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-4 flex items-center gap-2 ">
          <button
            onClick={handleGoogle}
            className="flex-1 text-red-900 border rounded-md py-2 bg-white hover:bg-gray-700 hover:text-white"
          >
            Sign in with Google
          </button>
        </div>

        <div className="mt-4 text-sm text-gray-900">
          Don’t have an account?{" "}
          <a href="/register" className="text-blue-900 underline">
            Register
          </a>
        </div>
      </div>
    </div>
  );
}
