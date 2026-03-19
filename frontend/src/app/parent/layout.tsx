import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Log out</button>
            <Avatar>
              <AvatarImage src="" alt="Parent Avatar" />
              <AvatarFallback>P</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
