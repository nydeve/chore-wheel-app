"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import Notifications from "@/components/Notifications";

export default function ChildLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await api.auth.me();
        setUser(data);
      } catch(e) {
        // Will be caught by page.tsx redirect
      }
    };
    fetchUser();
    
    // Listen for cross-page optimistic point updates
    const handlePointsUpdate = (e: any) => {
      setUser((prev: any) => prev ? { ...prev, total_points: e.detail.points } : prev);
    };
    window.addEventListener("user-points-updated", handlePointsUpdate);
    
    return () => {
      window.removeEventListener("user-points-updated", handlePointsUpdate);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await api.auth.logout();
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50/80 to-indigo-50/40 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>
      <header className="sticky top-0 z-30 w-full bg-white/70 backdrop-blur-lg border-b border-white shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/child" className="text-2xl font-black text-primary flex items-center gap-2">
              <span className="text-3xl">🎡</span> Chore Wheel
            </Link>
            <nav className="hidden md:flex space-x-6 pl-4 border-l-2">
              <Link href="/child" className="text-base font-bold text-gray-700 hover:text-primary transition-colors">Home</Link>
              <Link href="/child/wheel" className="text-base font-bold text-gray-700 hover:text-primary transition-colors">Spin Wheel</Link>
              <Link href="/child/store" className="text-base font-bold text-gray-700 hover:text-primary transition-colors">Rewards Store</Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Notifications />
            {user && (
              <div className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full text-sm flex gap-1 items-center">
                 🌟 {user.total_points} pts
              </div>
            )}
            <Avatar className="ring-2 ring-primary ring-offset-2">
              <AvatarFallback className="bg-primary text-white font-bold">
                 {user ? user.display_name.charAt(0).toUpperCase() : "?"}
              </AvatarFallback>
            </Avatar>
            <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 transition-colors" title="Log out">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8 relative z-10">
        {children}
      </main>
    </div>
  );
}
