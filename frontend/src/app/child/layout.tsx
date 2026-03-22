import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ChildLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
            <div className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full text-sm">
               🌟 150 Points
            </div>
            <Avatar className="ring-2 ring-primary ring-offset-2">
              <AvatarImage src="" alt="Child Avatar" />
              <AvatarFallback className="bg-primary text-white font-bold">S</AvatarFallback>
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
