"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, CircleDashed } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ChildDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [chores, setChores] = useState<any[]>([]);
  const [targetReward, setTargetReward] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [submittingChore, setSubmittingChore] = useState<any>(null);
  const [submissionNotes, setSubmissionNotes] = useState("");

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

      const [allChores, allRewards] = await Promise.all([
        api.chores.getAll(),
        api.rewards.getAll()
      ]);
      
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      
      const myChores = allChores.filter((c: any) => {
        if (c.user_id !== userData.id) return false;
        if (c.due_date) {
           const dueDate = new Date(c.due_date);
           return dueDate <= todayEnd;
        }
        return true;
      });
      setChores(myChores);

      if (allRewards && allRewards.length > 0) {
        // Try to find the next reward they are trying to reach
        const unattainable = allRewards.filter((r: any) => r.points_required > userData.total_points);
        if (unattainable.length > 0) {
           // Sort by closest cost
           unattainable.sort((a: any, b: any) => a.points_required - b.points_required);
           setTargetReward(unattainable[0]);
        } else {
           // Provide the highest tier reward if they can afford everything
           const highest = [...allRewards].sort((a: any, b: any) => b.points_required - a.points_required)[0];
           setTargetReward(highest);
        }
      }

    } catch (e: any) {
      console.error(e);
      if (e.message?.includes("Not logged in")) {
        router.push("/auth/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const openSubmitDialog = (chore: any) => {
    setSubmittingChore(chore);
    setSubmissionNotes("");
  };

  const handleCompleteChore = async () => {
    if (!submittingChore) return;
    try {
      await api.chores.complete(submittingChore.id, submissionNotes);
      setSubmittingChore(null);
      loadData();
    } catch(e: any) {
      alert("Failed to mark done: " + e.message);
    }
  };

  if (loading || !user) {
    return <div className="text-gray-500 animate-pulse text-center mt-10 font-bold text-xl">Loading Wallet...</div>;
  }

  const currentPoints = user.total_points;
  let progressPercent = 0;
  if (targetReward) {
     progressPercent = Math.min(100, Math.max(0, Math.round((currentPoints / targetReward.points_required) * 100)));
  }

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
            
            {targetReward ? (
              <div className="bg-white/20 p-4 rounded-xl space-y-3">
                <div className="flex justify-between text-sm font-bold">
                  <span>Goal: {targetReward.name}</span>
                  <span>{targetReward.points_required} pts</span>
                </div>
                <div className="h-3 w-full bg-black/10 rounded-full overflow-hidden relative shadow-inner">
                  <div 
                    className="absolute top-0 left-0 h-full bg-white transition-all duration-1000 ease-out rounded-full" 
                    style={{ width: `${Math.max(5, progressPercent)}%` }}
                  />
                </div>
                <p className="text-xs text-right font-medium opacity-90">{progressPercent}% there!</p>
              </div>
            ) : (
              <div className="bg-white/20 p-4 rounded-xl text-sm font-bold text-center">
                 No rewards in the store yet! Ask your parent to add some.
              </div>
            )}

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
                      <Button size="sm" onClick={() => openSubmitDialog(chore)} variant="outline" className="font-bold border-2 border-green-200 text-green-700 hover:bg-green-50">Mark Done</Button>
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

      <Dialog open={!!submittingChore} onOpenChange={(open) => !open && setSubmittingChore(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Chore</DialogTitle>
            <DialogDescription>
              Way to go! Add any details or proof for your parents before turning in '{submittingChore?.title}'.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
             <textarea 
                placeholder="Optional notes... (e.g., I put the clothes in the blue hamper!)" 
                value={submissionNotes}
                onChange={(e) => setSubmissionNotes(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none h-24"
             />
          </div>
          <DialogFooter className="sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setSubmittingChore(null)}>Cancel</Button>
            <Button type="button" onClick={handleCompleteChore} className="bg-green-500 hover:bg-green-600 font-bold">Submit for Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
