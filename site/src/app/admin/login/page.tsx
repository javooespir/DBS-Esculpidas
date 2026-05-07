"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Contraseña incorrecta");
      }
      router.push("/admin");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-6">
      <form onSubmit={submit} className="card w-full max-w-sm">
        <h1 className="font-display text-3xl mb-2">Panel admin</h1>
        <p className="text-sm text-[var(--color-muted)] mb-6">DBS Esculpidas</p>
        <label htmlFor="pwd" className="label">Contraseña</label>
        <input
          id="pwd"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          className="input mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-[var(--color-danger)] mb-4">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <Loader2 size={16} className="animate-spin" /> : "Entrar"}
        </button>
      </form>
    </main>
  );
}
