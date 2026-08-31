import Link from "next/link";
import AdminPanel from "@/components/AdminPanel";
import ThemeToggle from "@/components/ThemeToggle";

export default function AdminPage() {
  return (
    <main className="flex-1 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-sm text-accent hover:text-accent-hover hover:underline transition">← На сайт</Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <a href="/api/admin/logout" className="text-sm text-muted hover:text-foreground transition">Выйти</a>
          </div>
        </div>
        <AdminPanel />
      </div>
    </main>
  );
}
