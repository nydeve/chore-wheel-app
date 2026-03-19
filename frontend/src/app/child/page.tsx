"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function ChildDashboardPage() {
  const currentPoints = 150;
  const targetReward = { name: "Extra Video Games", cost: 200 };
  const progressPercent = Math.min(100, Math.round((currentPoints / targetReward.cost) * 100));

  const todayChores = [
    { id: 1, title: "Clean Room", points: 20, status: "Active" },
    { id: 2, title: "Feed the Dog", points: 5, status: "Completed" }
  ];

  const overdueChores = [
    { id: 3, title: "Take out Trash", points: 15, daysOverdue: 1 }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="text-center md:text-left">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Welcome back, Sam! 👋</h1>
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
          {/* Overdue Chores Alert (Only shown if there are overdue chores) */}
          {overdueChores.length > 0 && (
            <Card className="border-red-200 bg-red-50 shadow-md animate-in slide-in-from-right-8 duration-500 delay-150 fill-mode-both">
              <CardHeader className="py-3 px-4 flex flex-row items-center border-b border-red-100 gap-2">
                <AlertCircle className="text-red-500 h-5 w-5" />
                <CardTitle className="text-red-700 text-lg">Overdue Tasks</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {overdueChores.map(chore => (
                  <div key={chore.id} className="flex items-center justify-between p-4 border-b border-red-100 last:border-0 hover:bg-red-100/50 transition">
                    <div>
                      <h3 className="font-bold text-gray-800">{chore.title}</h3>
                      <p className="text-xs text-red-600 font-semibold">{chore.daysOverdue} day(s) late!</p>
                    </div>
                    <Button size="sm" className="bg-red-600 hover:bg-red-700 font-bold h-8">Do it now</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Today's Chores */}
          <Card className="shadow-lg border-t-4 border-t-green-500 animate-in slide-in-from-right-8 duration-500 delay-300 fill-mode-both">
            <CardHeader className="py-4">
              <CardTitle className="text-xl">Today&apos;s Chores</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {todayChores.map(chore => (
                <div key={chore.id} className="flex items-center justify-between p-4 border-t hover:bg-gray-50 transition">
                  <div className="flex items-center gap-3">
                    {chore.status === "Completed" ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : (
                      <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
                    )}
                    <div>
                      <h3 className={`font-bold ${chore.status === "Completed" ? "text-gray-500 line-through" : "text-gray-900"}`}>
                        {chore.title}
                      </h3>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs mt-1 border-transparent">
                        +{chore.points} pts
                      </Badge>
                    </div>
                  </div>
                  {chore.status !== "Completed" && (
                    <Button size="sm" variant="outline" className="font-bold border-2">Mark Done</Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
