import Link from "next/link";
import AdminPanel from "@/components/AdminPanel";

export default function AdminPage() {
  return (
    <main className="flex-1 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="text-sm text-indigo-600 hover:underline">← На сайт</Link>
          <a href="/api/admin/logout" className="text-sm text-slate-400 hover:text-slate-600">Выйти</a>
        </div>
        <AdminPanel />
      </div>
    </main>
  );
}
