"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    // TODO: implement actual sign up api logic
    router.push("/parent");
  };

  return (
    <div className="w-full min-h-screen flex flex-col md:flex-row-reverse bg-white">
      {/* Right Decorational Panel - Reversed for variety */}
      <div className="md:w-5/12 w-full bg-gradient-to-bl from-purple-600 via-indigo-600 to-primary p-10 lg:p-16 flex flex-col justify-between text-white shadow-2xl z-10 relative overflow-hidden shrink-0">
         {/* Background Ornaments */}
         <div className="absolute top-[10%] right-[-20%] w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl"></div>
         <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-pink-400/30 rounded-full blur-3xl"></div>
         
         <div className="relative z-20 flex justify-end">
            <Link href="/" className="text-3xl font-black flex items-center gap-3 drop-shadow-sm hover:opacity-90 transition">
              <span className="text-5xl drop-shadow-lg">🎡</span> Chore Wheel
            </Link>
         </div>

         <div className="mt-16 mb-auto relative z-20 text-right">
            <h1 className="text-5xl lg:text-6xl font-black mb-6 leading-[1.1] drop-shadow-md">
              Start building <br /> good habits.
            </h1>
            <p className="text-indigo-100 text-xl font-medium max-w-sm ml-auto leading-relaxed">
              Create a parent account to set up chores, track points, and reward your kids instantly.
            </p>

            <div className="mt-12 space-y-5 flex flex-col items-end">
              <div className="flex items-center gap-4 flex-row-reverse text-white">
                 <div className="bg-white/20 p-2 rounded-full border border-white/30 backdrop-blur-md">
                   <CheckCircle2 className="text-green-300 h-6 w-6" />
                 </div>
                 <span className="font-bold text-xl tracking-tight">Easy setup in minutes</span>
              </div>
              <div className="flex items-center gap-4 flex-row-reverse text-white">
                 <div className="bg-white/20 p-2 rounded-full border border-white/30 backdrop-blur-md">
                   <CheckCircle2 className="text-yellow-300 h-6 w-6" />
                 </div>
                 <span className="font-bold text-xl tracking-tight">Totally free to use</span>
              </div>
            </div>
         </div>
         
         <div className="relative z-20 mt-12 opacity-70 text-sm font-bold tracking-widest uppercase text-right">
            © 2026 Chore Wheel App
         </div>
      </div>

      {/* Left Form Panel */}
      <div className="md:w-7/12 w-full flex items-center justify-center p-8 lg:p-24 relative bg-slate-50">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>
        
        <div className="max-w-md w-full relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
           <div className="mb-10 text-center md:text-left">
             <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-3 tracking-tight">Get Started</h2>
             <p className="text-gray-500 text-lg md:text-xl font-semibold">Create your Parent administrative account.</p>
           </div>

           <form onSubmit={handleRegister} className="space-y-6">
             <div className="space-y-3">
               <Label htmlFor="email" className="text-gray-700 font-bold text-base">Email Address</Label>
               <Input
                 id="email"
                 type="email"
                 placeholder="name@family.com"
                 required
                 className="h-14 px-4 text-lg bg-white border-gray-200 shadow-sm focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
               />
             </div>
             
             <div className="space-y-3">
               <Label htmlFor="password" className="text-gray-700 font-bold text-base">Password <span className="text-gray-400 font-medium text-sm ml-1">(min 8 chars)</span></Label>
               <Input
                 id="password"
                 type="password"
                 required
                 minLength={8}
                 placeholder="••••••••"
                 className="h-14 px-4 text-lg bg-white border-gray-200 shadow-sm focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
               />
             </div>

             <div className="space-y-3">
               <Label htmlFor="confirmPassword" className="text-gray-700 font-bold text-base">Confirm Password</Label>
               <Input
                 id="confirmPassword"
                 type="password"
                 required
                 minLength={8}
                 placeholder="••••••••"
                 className="h-14 px-4 text-lg bg-white border-gray-200 shadow-sm focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
                 value={confirmPassword}
                 onChange={(e) => setConfirmPassword(e.target.value)}
               />
             </div>

             <Button type="submit" className="w-full h-14 text-lg font-black shadow-lg shadow-primary/30 hover:shadow-xl hover:-translate-y-1 transition-all mt-4 rounded-xl">
               Create Account
             </Button>
           </form>

           <div className="mt-12 pt-8 border-t border-gray-200/60 text-center">
             <p className="text-gray-500 font-semibold text-lg">
               Already have an account?{" "}
               <Link href="/auth/login" className="text-primary font-black hover:underline hover:text-blue-700 ml-1 transition-colors">
                 Sign in instead
               </Link>
             </p>
           </div>
        </div>
      </div>
    </div>
  );
}
