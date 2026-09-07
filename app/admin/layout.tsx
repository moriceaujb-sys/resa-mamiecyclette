import Link from "next/link";
import { estConnecte } from "@/lib/auth";
import LoginForm from "./login-form";
import LogoutButton from "./logout-button";

export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!estConnecte()) {
    return <LoginForm />;
  }
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/admin"
          className="text-xl font-bold text-marine-700 hover:underline"
        >
          Espace équipe
        </Link>
        <LogoutButton />
      </div>
      {children}
    </div>
  );
}
