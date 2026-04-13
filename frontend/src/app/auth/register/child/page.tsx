"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Gamepad2, Stars, AlertCircle } from "lucide-react";
import Link from "next/link";

function ChildRegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("code");

  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode) {
      setError("Missing invite code! Ask your parent for a valid invite link.");
      return;
    }
    
    setError("");
    setLoading(true);

    try {
      await api.auth.registerChild({
        invite_code: inviteCode,
        display_name: displayName,
        password: password
      });
      router.push("/child");
    } catch (err: any) {
      setError(err.message || "Something went wrong! Double check your link.");
    } finally {
      setLoading(false);
    }
  };

  if (!inviteCode) {
    return (
      <Card className="max-w-md mx-auto mt-20 border-red-200 shadow-xl overflow-hidden rounded-2xl animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-red-500 h-32 flex items-center justify-center">
            <AlertCircle className="w-16 h-16 text-white" />
        </div>
        <CardHeader className="text-center pt-8">
          <CardTitle className="text-2xl font-black">Missing Invite Code!</CardTitle>
          <CardDescription className="text-lg">You need a special link from your parents to create an account here.</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center pb-8">
            <Link href="/">
                <Button className="font-bold text-lg px-8 h-12">Go to Home</Button>
            </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto mt-12 border-none shadow-2xl overflow-hidden rounded-3xl animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* Playful Header */}
      <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 text-center relative overflow-hidden">
        <div className="absolute top-2 left-2 animate-bounce opacity-30"><Stars className="w-12 h-12 text-white" /></div>
        <div className="absolute bottom-2 right-4 animate-pulse opacity-50 text-white font-black text-6xl">✨</div>
        <Gamepad2 className="w-20 h-20 text-white mx-auto mb-4 drop-shadow-md" />
        <h1 className="text-4xl font-black text-white drop-shadow-sm tracking-tight">Create Your Account!</h1>
        <p className="text-purple-100 mt-2 font-medium">Earn points and claim epic rewards.</p>
      </div>

      <CardContent className="p-8 pt-10 bg-white">
        
        {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold flex items-center gap-2 mb-6 border border-red-100">
                <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
            </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="displayName" className="text-lg font-bold text-indigo-900">What is your Name?</Label>
            <Input 
              id="displayName" 
              placeholder="e.g. Sam" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="h-14 text-lg font-bold px-4 border-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 rounded-xl"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="password" className="text-lg font-bold text-indigo-900">Create a Secret Password</Label>
            <Input 
              id="password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="h-14 text-2xl px-4 border-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 rounded-xl tracking-widest"
            />
            <p className="text-xs font-bold text-gray-400 pl-1 uppercase tracking-wider">Must be at least 8 characters</p>
          </div>

          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full h-16 text-xl font-black rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 mt-4"
          >
            {loading ? "Creating Account..." : "Let's Go! 🚀"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ChildRegisterPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20">
      <Suspense fallback={<div className="flex justify-center items-center h-screen font-black text-indigo-300 text-2xl animate-pulse">Loading Magic Portal...</div>}>
        <ChildRegisterForm />
      </Suspense>
    </div>
  );
}
