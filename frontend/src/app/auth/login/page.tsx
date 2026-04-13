"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.auth.login({ email, password });
      if (response && response.user) {
        if (response.user.role === "parent") {
          router.push("/parent");
        } else {
          router.push("/child");
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left Decorational Panel */}
      <div className="md:w-5/12 w-full bg-gradient-to-br from-primary via-blue-600 to-indigo-700 p-10 lg:p-16 flex flex-col justify-between text-white shadow-2xl z-10 relative overflow-hidden shrink-0">
         {/* Background Ornaments */}
         <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-purple-400/30 rounded-full blur-3xl"></div>
         
         <div className="relative z-20">
            <Link href="/" className="text-3xl font-black flex items-center gap-3 drop-shadow-sm hover:opacity-90 transition">
              <span className="text-5xl drop-shadow-lg">🎡</span> Chore Wheel
            </Link>
         </div>

         <div className="mt-16 mb-auto relative z-20">
            <h1 className="text-5xl lg:text-6xl font-black mb-6 leading-[1.1] drop-shadow-md">
              Welcome back to <br /> the magic.
            </h1>
            <p className="text-blue-100 text-xl font-medium max-w-sm leading-relaxed">
              Login to view your family's progress, spin the wheel, and redeem amazing rewards.
            </p>

            <div className="mt-12 space-y-5">
              <div className="flex items-center gap-4 text-white">
                 <div className="bg-white/20 p-2 rounded-full border border-white/30 backdrop-blur-md">
                   <CheckCircle2 className="text-green-300 h-6 w-6" />
                 </div>
                 <span className="font-bold text-xl tracking-tight">Gamified task completion</span>
              </div>
              <div className="flex items-center gap-4 text-white">
                 <div className="bg-white/20 p-2 rounded-full border border-white/30 backdrop-blur-md">
                   <CheckCircle2 className="text-yellow-300 h-6 w-6" />
                 </div>
                 <span className="font-bold text-xl tracking-tight">Interactive rewards store</span>
              </div>
              <div className="flex items-center gap-4 text-white">
                 <div className="bg-white/20 p-2 rounded-full border border-white/30 backdrop-blur-md">
                   <CheckCircle2 className="text-pink-300 h-6 w-6" />
                 </div>
                 <span className="font-bold text-xl tracking-tight">Parent & Child views</span>
              </div>
            </div>
         </div>
         
         <div className="relative z-20 mt-12 opacity-70 text-sm font-bold tracking-widest uppercase">
            © 2026 Chore Wheel App
         </div>
      </div>

      {/* Right Form Panel */}
      <div className="md:w-7/12 w-full flex items-center justify-center p-8 lg:p-24 relative bg-slate-50">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>
        
        <div className="max-w-md w-full relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
           <div className="mb-10 text-center md:text-left">
             <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-3 tracking-tight">Sign In</h2>
             <p className="text-gray-500 text-lg md:text-xl font-semibold">Enter your credentials to access your account.</p>
           </div>

           {error && (
             <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center gap-3">
               <AlertCircle className="h-5 w-5 shrink-0" />
               <p className="font-semibold text-sm">{error}</p>
             </div>
           )}

           <form onSubmit={handleLogin} className="space-y-6">
             <div className="space-y-3">
               <Label htmlFor="email" className="text-gray-700 font-bold text-base">Email Address</Label>
               <Input
                 id="email"
                 type="email"
                 placeholder="parent@example.com"
                 required
                 className="h-14 px-4 text-lg bg-white border-gray-200 shadow-sm focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
               />
             </div>
             
             <div className="space-y-3">
               <div className="flex justify-between items-center">
                 <Label htmlFor="password" className="text-gray-700 font-bold text-base">Password</Label>
                 <Link href="#" className="text-sm font-bold text-primary hover:underline">
                   Forgot password?
                 </Link>
               </div>
               <Input
                 id="password"
                 type="password"
                 required
                 placeholder="••••••••"
                 className="h-14 px-4 text-lg bg-white border-gray-200 shadow-sm focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
               />
             </div>

             <Button disabled={loading} type="submit" className="w-full h-14 text-lg font-black shadow-lg shadow-primary/30 hover:shadow-xl hover:-translate-y-1 transition-all mt-4 rounded-xl">
               {loading ? "Logging in..." : "Login to Account"}
             </Button>
           </form>

           <div className="mt-12 pt-8 border-t border-gray-200/60 text-center">
             <p className="text-gray-500 font-semibold text-lg">
               Don't have an account?{" "}
               <Link href="/auth/register" className="text-primary font-black hover:underline hover:text-blue-700 ml-1 transition-colors">
                 Create one now
               </Link>
             </p>
           </div>
        </div>
      </div>
    </div>
  );
}
