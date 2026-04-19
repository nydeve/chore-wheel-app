"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@/lib/api";
import Notifications from "@/components/Notifications";

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch(e) {
      console.error(e);
    }
    router.push("/auth/login");
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      <header className="sticky top-0 z-30 w-full bg-white/70 backdrop-blur-lg border-b border-gray-200/50 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/parent" className="text-xl font-bold text-primary">
              Chore Wheel
            </Link>
            <nav className="hidden md:flex space-x-4">
              <Link href="/parent" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">Dashboard</Link>
              <Link href="/parent/chores" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">Chores</Link>
              <Link href="/parent/rewards" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">Rewards</Link>
              <Link href="/parent/profile" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">Profile</Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Notifications />
            <button onClick={handleLogout} className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">Log out</button>
            <Link href="/parent/profile">
              <Avatar className="cursor-pointer border-2 hover:border-primary transition-all">
                <AvatarImage src="" alt="Parent Avatar" />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">P</AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
