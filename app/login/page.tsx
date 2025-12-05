"use client";

import Image from "next/image";
import Link from "next/link"
import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase/firebase";
import { useAuth } from "@/context/AuthContext";
import { BrandLogo } from "@/components/BrandLogo";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // redirect if already logged in
  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/dashboard");
    } catch (err: any) { // Showing raw error messages for simplicity, TODO for production is better messages
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };
  //Really simple page render whule checking auth state
  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="relative min-h-screen text-white">
      {/* Background image of a plane at nigh*/}
      <Image
        src="/login-bg.jpg"
        alt="Airplane night background"
        fill
        priority
        className="object-cover -z-20"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/30 -z-10" />

      {/* Logo Component */}
      <BrandLogo href="/" />

      {/* Main content */}
      <main className="flex items-center justify-center px-4 pb-16 min-h-[70vh]">
        <div className="w-full max-w-md rounded-md bg-black/60 border border-white/10 px-8 py-10 shadow-xl shadow-black/40 backdrop-blur-sm">
          <h1 className="text-2xl font-semibold mb-6 text-center">Log in</h1>

          {loading ? (
            <div className="text-center text-sm text-gray-300">Loading…</div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm mb-1" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    data-testid="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-neutral-700 rounded px-3 py-2 bg-neutral-900/80 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    data-testid="login-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-neutral-700 rounded px-3 py-2 bg-neutral-900/80 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <p
                    data-testid="login-error"
                    className="text-sm text-red-500 text-center"
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  data-testid="login-button"
                  disabled={submitting}
                  className="w-full rounded bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  {submitting ? "Signing in…" : "Sign in"}
                </button>
              </form>
              {/* Backup Signup link */}
              <p className="mt-4 text-sm text-center text-gray-300">
                Don't have an account?{" "}
                <a
                  href="/signup"
                  data-testid="login-signup-link"
                  className="text-blue-400 hover:underline"
                >
                  Sign up
                </a>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
