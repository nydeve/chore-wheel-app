"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

export default function ParentDashboardPage() {
  const childrenData = [
    { id: 1, name: "Sam", points: 150, avatar: "S" },
    { id: 2, name: "Alex", points: 40, avatar: "A" }
  ];

  const pendingApprovals = [
    { id: 1, child: "Sam", chore: "Clean room", time: "2 hours ago" },
    { id: 2, child: "Alex", chore: "Wash dishes", time: "Yesterday" }
  ];

  const pendingRewards = [
    { id: 1, child: "Sam", reward: "Extra Video Games", cost: 50, time: "Just now" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/parent/chores">
            <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Add Chore</Button>
          </Link>
          <Link href="/parent/rewards">
            <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Reward</Button>
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
            {childrenData.map(child => (
              <div key={child.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">{child.avatar}</AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-gray-800">{child.name}</span>
                </div>
                <Badge variant="secondary" className="text-sm font-bold bg-green-100 text-green-800">
                  {child.points} pts
                </Badge>
              </div>
            ))}
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
              <Badge variant="destructive" className="rounded-full px-2 py-0.5">{pendingApprovals.length}</Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingApprovals.length === 0 ? (
              <p className="text-sm text-gray-500">No pending approvals.</p>
            ) : (
              pendingApprovals.map(approval => (
                <div key={approval.id} className="flex flex-col p-3 rounded-lg bg-gray-50 border gap-2">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-gray-800 text-sm">{approval.chore}</span>
                    <span className="text-xs text-gray-500">{approval.time}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-4 w-4">
                      <AvatarFallback className="text-[8px] bg-blue-100 text-blue-700">{approval.child[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium text-gray-600">{approval.child}</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                     <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 border-none text-white h-7 text-xs">Approve</Button>
                     <Button size="sm" variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50 h-7 text-xs">Reject</Button>
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
              <CardTitle>Pending Rewards</CardTitle>
              <CardDescription>Claimed items to fulfill</CardDescription>
            </div>
            {pendingRewards.length > 0 && (
              <Badge variant="destructive" className="bg-yellow-500 hover:bg-yellow-600 rounded-full px-2 py-0.5">{pendingRewards.length}</Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingRewards.length === 0 ? (
              <p className="text-sm text-gray-500">No pending rewards.</p>
            ) : (
              pendingRewards.map(reward => (
                <div key={reward.id} className="flex flex-col p-3 rounded-lg bg-yellow-50/50 border border-yellow-100 gap-2">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-gray-800 text-sm">{reward.reward}</span>
                    <Badge variant="outline" className="text-[10px] text-gray-500 border-gray-200">{reward.cost} pts</Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-4 w-4">
                      <AvatarFallback className="text-[8px] bg-blue-100 text-blue-700">{reward.child[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium text-gray-600">{reward.child}</span>
                  </div>
                  <div className="mt-2">
                     <Button size="sm" className="w-full bg-yellow-500 hover:bg-yellow-600 border-none text-white h-7 text-xs">Mark Fulfilled</Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
