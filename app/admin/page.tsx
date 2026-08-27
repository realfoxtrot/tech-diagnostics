import Link from "next/link";
import AdminPanel from "@/components/AdminPanel";

export default function AdminPage() {
  return (
    <main className="flex-1 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] hover:underline transition">← На сайт</Link>
          <a href="/api/admin/logout" className="text-sm text-[#64748b] hover:text-[#475569] transition">Выйти</a>
        </div>
        <AdminPanel />
      </div>
    </main>
  );
}
