"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setError("Неверный пароль");
    }
  };

  return (
    <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-6 shadow-sm max-w-sm mx-auto">
      <h1 className="text-xl font-bold mb-4 text-foreground">Вход для администратора</h1>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Пароль"
        className="w-full px-4 py-2 border border-border rounded-xl mb-3 focus:outline-none focus:ring-2 focus:ring-accent"
        autoFocus
      />
      {error && <p className="text-error text-sm mb-3">{error}</p>}
      <button type="submit" className="w-full px-4 py-2 rounded-xl btn-accent hover:bg-accent-hover transition">
        Войти
      </button>
    </form>
  );
}
