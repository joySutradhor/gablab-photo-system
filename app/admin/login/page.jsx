
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // ---------------------------------------------------------
  // CHECK EXISTING LOGIN SESSION
  // ---------------------------------------------------------

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();

      if (!mounted) return;

      // Already logged in
      if (session?.user) {
        router.replace("/admin/dashboard");
        return;
      }

      // Not logged in
      setCheckingSession(false);
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, [router]);

  // ---------------------------------------------------------
  // LOGIN
  // ---------------------------------------------------------

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    const { error } = await supabaseBrowser.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.replace("/admin/dashboard");
  };

  // ---------------------------------------------------------
  // CHECKING EXISTING SESSION
  // ---------------------------------------------------------

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
          Checking session...
        </div>
      </main>
    );
  }

  // ---------------------------------------------------------
  // LOGIN UI
  // ---------------------------------------------------------

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900">
          Admin Login
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Sign in to manage your classes and photos.
        </p>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          {/* Email */}

          <div>
            <label className="mb-2 block text-sm font-medium text-black">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-[#181818] outline-none focus:border-black disabled:bg-gray-50"
            />
          </div>

          {/* Password */}

          <div>
            <label className="mb-2 block text-sm font-medium text-black">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-[#181818] outline-none focus:border-black disabled:bg-gray-50"
            />
          </div>

          {/* Error */}

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          {/* Submit */}

          <button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer rounded-lg bg-black px-4 py-3 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}

