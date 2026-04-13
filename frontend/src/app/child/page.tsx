"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, CircleDashed } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ChildDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [chores, setChores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fallback target for the progress bar if store isn't built yet
  const targetReward = { name: "Extra Video Games", cost: 200 };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const userData = await api.auth.me();
      
      if (userData.role === "parent") {
        router.push("/parent");
        return;
      }
      
      setUser(userData);

      const allChores = await api.chores.getAll();
      const myChores = allChores.filter((c: any) => c.user_id === userData.id);
      setChores(myChores);
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes("Not logged in")) {
        router.push("/auth/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteChore = async (choreId: number) => {
    try {
      await api.chores.complete(choreId);
      loadData();
    } catch(e: any) {
      alert("Failed to mark done: " + e.message);
    }
  };

  if (loading || !user) {
    return <div className="text-gray-500 animate-pulse text-center mt-10 font-bold text-xl">Loading Wallet...</div>;
  }

  const currentPoints = user.total_points;
  const progressPercent = Math.min(100, Math.max(0, Math.round((currentPoints / targetReward.cost) * 100)));

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="text-center md:text-left">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Welcome back, {user.display_name}! 👋</h1>
        <p className="text-lg text-gray-600 mt-2 font-medium">Ready to earn some points today?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Points & Progress Widget */}
        <Card className="bg-gradient-to-br from-blue-500 to-primary text-white border-none shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] animate-in zoom-in-95 duration-500">
          <CardHeader>
            <CardTitle className="text-white text-xl">My Points Wallet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-baseline justify-center md:justify-start gap-2">
              <span className="text-6xl font-black">{currentPoints}</span>
              <span className="text-xl font-medium opacity-80">pts</span>
            </div>
            
            <div className="bg-white/20 p-4 rounded-xl space-y-3">
              <div className="flex justify-between text-sm font-bold">
                <span>Goal: {targetReward.name}</span>
                <span>{targetReward.cost} pts</span>
              </div>
              <div className="h-3 w-full bg-black/10 rounded-full overflow-hidden relative shadow-inner">
                <div 
                  className="absolute top-0 left-0 h-full bg-white transition-all duration-1000 ease-out rounded-full" 
                  style={{ width: `${Math.max(5, progressPercent)}%` }}
                />
              </div>
              <p className="text-xs text-right font-medium opacity-90">{progressPercent}% there!</p>
            </div>

            <div className="flex gap-3">
               <Link href="/child/store" className="w-full">
                 <Button variant="secondary" className="w-full font-bold">Go to Store</Button>
               </Link>
               <Link href="/child/wheel" className="w-full">
                 <Button className="w-full bg-yellow-400 text-yellow-900 hover:bg-yellow-500 font-bold border-none shadow-sm">Spin Wheel!</Button>
               </Link>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* My Chores */}
          <Card className="shadow-lg border-t-4 border-t-green-500 animate-in slide-in-from-right-8 duration-500 delay-300 fill-mode-both">
            <CardHeader className="py-4">
              <CardTitle className="text-xl">My Assigned Chores</CardTitle>
            </CardHeader>
            <CardContent className="p-0 border-t">
              {chores.length === 0 ? (
                <div className="p-8 text-center text-gray-500 font-bold">You have zero assigned chores! 🎉</div>
              ) : (
                chores.map(chore => (
                  <div key={chore.id} className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-gray-50 transition">
                    <div className="flex items-center gap-3">
                      {chore.status === "completed" || chore.status === "pending_approval" ? (
                        <CheckCircle2 className={`h-6 w-6 ${chore.status === 'completed' ? 'text-green-500' : 'text-yellow-500'}`} />
                      ) : (
                        <CircleDashed className="h-6 w-6 text-gray-300" />
                      )}
                      <div>
                        <h3 className={`font-bold ${chore.status === "completed" ? "text-gray-400 line-through" : "text-gray-900"}`}>
                          {chore.title}
                        </h3>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs mt-1 border-transparent">
                          +{chore.points_worth} pts
                        </Badge>
                      </div>
                    </div>
                    {chore.status === "assigned" && (
                      <Button size="sm" onClick={() => handleCompleteChore(chore.id)} variant="outline" className="font-bold border-2 border-green-200 text-green-700 hover:bg-green-50">Mark Done</Button>
                    )}
                    {chore.status === "pending_approval" && (
                      <span className="text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-1 rounded">Waiting for Review</span>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
