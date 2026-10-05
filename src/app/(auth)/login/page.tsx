"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-md px-6 py-16">Loading…</main>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Login failed.");
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Network error. Is the dev server running?");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-950 px-6 py-12">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl shadow-pop md:grid md:grid-cols-2">
        <div className="hidden flex-col justify-between bg-ink-900 p-8 text-white md:flex">
          <div className="flex items-center gap-2.5">
            <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-lg bg-brass-500 font-display text-xl text-ink-950">
              A
            </span>
            <span>
              <span className="block font-display text-xl leading-none">AttireLab</span>
              <span className="mt-0.5 block text-[11px] uppercase tracking-widest text-brass-200">
                Heritage design lab
              </span>
            </span>
          </div>
          <div>
            <p className="font-display text-2xl leading-snug">
              Culturally grounded, body-personalized, cost-aware attire design.
            </p>
            <ol className="mt-4 space-y-1.5 text-sm text-stone-300">
              <li>① Research verified cultural knowledge</li>
              <li>② Define requirements, body & budget</li>
              <li>③ Generate, evaluate, refine — then approve</li>
            </ol>
          </div>
          <p className="text-xs text-stone-400">
            Knowledge → Constraints → Generation → Evaluation → Human Review
          </p>
        </div>
        <div className="flex flex-col justify-center bg-white px-8 py-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-brass-700 md:hidden">
            AttireLab
          </p>
          <h1 className="mt-1 font-display text-3xl text-ink-950">Log in</h1>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-stone-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input mt-1"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium text-stone-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input mt-1"
              />
            </div>
            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <Button type="submit" disabled={pending} className="w-full" size="md">
              {pending ? "Logging in…" : "Log in"}
            </Button>
          </form>
          <p className="mt-6 text-sm text-stone-600">
            No account?{" "}
            <Link href="/register" className="font-medium text-ink-800 underline underline-offset-2">
              Register
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
