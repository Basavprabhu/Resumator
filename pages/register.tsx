// pages/register.tsx
"use client";

import React, { useState } from "react";
import { useAuth } from "../lib/authContext";
import { logInfo, logError } from "../lib/logger";

export default function RegisterPage() {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    try {
      setLoading(true);
      await register(email, password);
      logInfo("Registered new user", { email });
    } catch (err: any) {
      logError("Register error", err);
      setError(err?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white rounded-md shadow-md p-6">
        <h1 className="text-2xl font-semibold mb-4 text-gray-900">Create Account</h1>
        {error && <div className="mb-3 text-red-900">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            className="w-full border rounded-md p-2 text-gray-600"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full border rounded-md p-2 text-gray-600"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <input
            className="w-full border rounded-md p-2 text-gray-600"
            placeholder="Confirm Password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={6}
          />

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="mt-4 text-sm text-gray-900">
          Already have an account? <a href="/login" className="text-blue-900 underline">Log in</a>
        </div>
      </div>
    </div>
  );
}
