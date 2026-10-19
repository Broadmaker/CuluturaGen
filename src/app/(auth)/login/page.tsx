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
  const [email, setEmail] = useState("admin@attirelab.local");
  const [password, setPassword] = useState("Admin123!");
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
    <main className="flex min-h-screen items-center justify-center bg-paper px-6 py-12">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-pop md:grid md:grid-cols-2">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-brand-500 to-brand-700 p-8 text-white md:flex">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white font-display text-xl font-bold text-brand-600"
            >
              A
            </span>
            <span>
              <span className="block font-display text-xl font-bold leading-none">AttireLab</span>
              <span className="mt-0.5 block text-[11px] font-medium uppercase tracking-widest text-brand-100">
                Heritage design lab
              </span>
            </span>
          </div>
          <div>
            <p className="font-display text-2xl font-semibold leading-snug">
              Culturally grounded, body-personalized, cost-aware attire design.
            </p>
            <ol className="mt-4 space-y-1.5 text-sm text-brand-50">
              <li>① Research verified cultural knowledge</li>
              <li>② Define requirements, body & budget</li>
              <li>③ Generate, evaluate, refine — then approve</li>
            </ol>
          </div>
          <p className="text-xs text-brand-100">
            Knowledge → Constraints → Generation → Evaluation → Human Review
          </p>
        </div>
        <div className="flex flex-col justify-center bg-white px-8 py-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-700 md:hidden">
            AttireLab
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold text-ink-950">Log in</h1>
          <p className="mt-4 rounded-xl bg-brand-50 px-3 py-2 text-xs text-brand-800 ring-1 ring-inset ring-brand-100">
            Prototype credentials are pre-filled — just press{" "}
            <span className="font-semibold">Log in</span>.
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-ink-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input mt-1.5"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium text-ink-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input mt-1.5"
              />
            </div>
            {error && (
              <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <Button type="submit" disabled={pending} className="w-full" size="md">
              {pending ? "Logging in…" : "Log in"}
            </Button>
          </form>
          <p className="mt-6 text-sm text-ink-500">
            No account?{" "}
            <Link href="/register" className="font-medium text-brand-600 underline underline-offset-2">
              Register
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
