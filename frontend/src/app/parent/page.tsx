"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, CheckCircle, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ParentDashboardPage() {
  const [childrenData, setChildrenData] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [pendingRewards, setPendingRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [rejectChoreId, setRejectChoreId] = useState<number | null>(null);
  const [rejectFeedback, setRejectFeedback] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [kidsRes, choresRes, rewardsRes] = await Promise.all([
        api.users.getAll(),
        api.chores.getAll(),
        api.rewards.getPending()
      ]);
      
      setChildrenData(kidsRes || []);
      
      const pending = (choresRes || []).filter((c: any) => c.status === "pending_approval");
      setPendingApprovals(pending);
      setPendingRewards(rewardsRes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveChore = async (id: number) => {
    try {
      await api.chores.approve(id);
      loadData();
    } catch(e: any) {
      alert("Approval failed: " + e.message);
    }
  };

  const handleRejectChore = async () => {
    if (!rejectChoreId || !rejectFeedback.trim()) return;
    try {
      await api.chores.reject(rejectChoreId, rejectFeedback);
      setRejectChoreId(null);
      loadData();
    } catch(e: any) {
      alert("Rejection failed: " + e.message);
    }
  };

  const handleFulfillReward = async (id: number) => {
    try {
      await api.rewards.fulfill(id);
      loadData();
    } catch(e: any) {
      alert("Fulfill failed: " + e.message);
    }
  };

  const getChildName = (userId: number) => {
    const child = childrenData.find(c => c.id === userId);
    return child ? child.display_name : "Unknown";
  };

  if (loading) return <div className="text-gray-500 animate-pulse text-center mt-10 font-bold">Loading Dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/parent/chores">
            <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Manage Chores</Button>
          </Link>
          <Link href="/parent/profile">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white"><PlusCircle className="mr-2 h-4 w-4" /> Add Child via Profile</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Linked Children Overview */}
        <Card className="col-span-1 border-t-4 border-t-primary shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader>
            <CardTitle>Children Accounts</CardTitle>
            <CardDescription>Current point balances</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {childrenData.length === 0 ? (
              <div className="text-sm text-gray-500 italic p-4 text-center border rounded-lg bg-gray-50">
                You have no children linked to your account yet. Go to your Profile to generate an invite link!
              </div>
            ) : (
              childrenData.map(child => (
                <div key={child.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">{child.display_name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-gray-800">{child.display_name}</span>
                  </div>
                  <Badge variant="secondary" className="text-sm font-bold bg-green-100 text-green-800 border-transparent">
                    {child.total_points} pts
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Pending Approvals Queue */}
        <Card className="col-span-1 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>Chores awaiting review</CardDescription>
            </div>
            {pendingApprovals.length > 0 && (
              <Badge variant="destructive" className="bg-yellow-500 hover:bg-yellow-600 rounded-full px-2 py-0.5 border-transparent">{pendingApprovals.length}</Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingApprovals.length === 0 ? (
              <p className="text-sm text-gray-500 italic p-4 text-center border rounded-lg bg-yellow-50">No chores waiting for review right now.</p>
            ) : (
              pendingApprovals.map(approval => (
                <div key={approval.id} className="flex flex-col p-3 rounded-lg bg-gray-50 border gap-2">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-gray-800 text-sm">{approval.title}</span>
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-800 border-blue-200">+{approval.points_worth} pts</Badge>
                  </div>
                  {approval.submission_notes && (
                    <div className="text-[11px] text-gray-500 bg-white p-1.5 rounded italic border-l-2 border-gray-300">
                      "{approval.submission_notes}"
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-4 w-4">
                      <AvatarFallback className="text-[8px] bg-blue-100 text-blue-700">
                        {getChildName(approval.user_id).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium text-gray-600">{getChildName(approval.user_id)}</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                     <Button onClick={() => handleApproveChore(approval.id)} size="sm" className="flex-1 bg-green-600 hover:bg-green-700 border-none text-white h-7 text-xs font-bold">
                       <CheckCircle className="w-3 h-3 mr-1" /> Approve
                     </Button>
                     <Button onClick={() => { setRejectChoreId(approval.id); setRejectFeedback(""); }} size="sm" className="bg-red-100 hover:bg-red-200 text-red-700 border-none h-7 text-xs font-bold px-3">
                       <XCircle className="w-3 h-3" />
                     </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Pending Rewards Queue */}
        <Card className="col-span-1 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-both border-t-4 border-t-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle>Pending Rewards</CardTitle>
              <CardDescription>Claimed prizes</CardDescription>
            </div>
            {pendingRewards.length > 0 && (
              <Badge variant="destructive" className="bg-purple-500 rounded-full px-2 py-0.5 border-none">{pendingRewards.length}</Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingRewards.length === 0 ? (
               <p className="text-sm text-gray-500 italic p-4 text-center border rounded-lg bg-purple-50">No pending rewards right now.</p>
            ) : (
                pendingRewards.map((reward, i) => (
                    <div key={i} className="flex flex-col p-3 rounded-lg bg-purple-50 border border-purple-100 gap-2">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-gray-800 text-sm">{reward.reward}</span>
                        <Badge variant="outline" className="text-[10px] text-gray-500 border-gray-200">{reward.cost} pts</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-4 w-4">
                          <AvatarFallback className="text-[8px] bg-purple-100 text-purple-700">
                            {reward.child.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium text-gray-600">{reward.child}</span>
                      </div>
                      <div className="mt-2 text-xs text-gray-400">
                        Purchased recently
                      </div>
                      <div className="mt-2">
                         <Button onClick={() => handleFulfillReward(reward.id)} size="sm" className="w-full text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white border-none h-7">
                            <CheckCircle className="w-3 h-3 mr-1" /> Mark Fulfilled
                         </Button>
                      </div>
                    </div>
                ))
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!rejectChoreId} onOpenChange={(open) => !open && setRejectChoreId(null)}>
        <DialogContent className="sm:max-w-md border-t-8 border-t-red-500">
          <DialogHeader>
            <DialogTitle>Needs Fixes</DialogTitle>
            <DialogDescription>
              Provide specific feedback so your child knows exactly what to fix before resubmitting.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
             <textarea 
                placeholder="Needs more work... (e.g. You missed a spot on the kitchen counter!)" 
                value={rejectFeedback}
                onChange={(e) => setRejectFeedback(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none h-24"
             />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setRejectChoreId(null)}>Cancel</Button>
            <Button type="button" onClick={handleRejectChore} disabled={!rejectFeedback.trim()} className="bg-red-500 hover:bg-red-600 font-bold text-white">Send Back</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
