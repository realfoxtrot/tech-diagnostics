import LoginForm from "@/components/LoginForm";
import ThemeToggle from "@/components/ThemeToggle";

export default function AdminLoginPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-16 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <LoginForm />
    </main>
  );
}
