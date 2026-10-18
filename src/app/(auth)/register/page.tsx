"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Registration failed.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Is the dev server running?");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-stone-200/80 bg-white p-8 shadow-pop">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 font-display text-xl font-bold text-white shadow-sm shadow-brand-500/40"
        >
          A
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold text-ink-950">Create account</h1>
        <p className="mt-1.5 text-sm text-ink-500">
          New accounts start with the Designer role.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="text-sm font-medium text-ink-700">
                First name
              </label>
              <input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="input mt-1.5"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="text-sm font-medium text-ink-700">
                Last name
              </label>
              <input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="input mt-1.5"
              />
            </div>
          </div>
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
              Password (min 8 chars)
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
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
            {pending ? "Creating…" : "Create account"}
          </Button>
        </form>
        <p className="mt-6 text-sm text-ink-500">
          Have an account?{" "}
          <Link href="/login" className="font-medium text-brand-600 underline underline-offset-2">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
