"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, CheckCircle } from "lucide-react";

export default function ParentDashboardPage() {
  const [childrenData, setChildrenData] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const pendingRewards = [
    { id: 1, child: "Fallback Data (Rewards Not Built Yet)", reward: "Extra Video Games", cost: 50, time: "Just now" }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [kidsRes, choresRes] = await Promise.all([
        api.users.getAll(),
        api.chores.getAll()
      ]);
      
      setChildrenData(kidsRes || []);
      
      const pending = (choresRes || []).filter((c: any) => c.status === "pending_approval");
      setPendingApprovals(pending);
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
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Pending Rewards Queue */}
        <Card className="col-span-1 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-both">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-gray-400">Pending Rewards</CardTitle>
              <CardDescription>Feature Coming Soon</CardDescription>
            </div>
            {pendingRewards.length > 0 && (
              <Badge variant="destructive" className="bg-yellow-500 hover:bg-yellow-600 rounded-full px-2 py-0.5 border-none opacity-50">{pendingRewards.length}</Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-3 opacity-50 select-none grayscale">
            {pendingRewards.map((reward, i) => (
                <div key={i} className="flex flex-col p-3 rounded-lg bg-yellow-50/50 border border-yellow-100 gap-2">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-gray-800 text-sm">{reward.reward}</span>
                    <Badge variant="outline" className="text-[10px] text-gray-500 border-gray-200">{reward.cost} pts</Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-gray-600">{reward.child}</span>
                  </div>
                  <div className="mt-2">
                     <Button size="sm" variant="outline" className="w-full text-xs" disabled>Backend Not Built Yet</Button>
                  </div>
                </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
