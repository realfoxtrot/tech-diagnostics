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
    <form onSubmit={submit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-sm mx-auto">
      <h1 className="text-xl font-bold mb-4">Вход для администратора</h1>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Пароль"
        className="w-full px-4 py-2 border border-slate-300 rounded-xl mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        autoFocus
      />
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <button type="submit" className="w-full px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition">
        Войти
      </button>
    </form>
  );
}
