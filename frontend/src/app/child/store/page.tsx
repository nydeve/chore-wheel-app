"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ChildStorePage() {
  const [rewards, setRewards] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [userRes, rewardsRes] = await Promise.all([
        api.auth.me(),
        api.rewards.getAll()
      ]);
      setUser(userRes);
      setRewards(rewardsRes || []);
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRedeem = async (reward: any) => {
    if (!user) return;
    if (user.total_points < reward.points_required) {
      alert("Not enough points!");
      return;
    }
    if (reward.quantity !== null && reward.quantity <= 0) {
      alert("Out of stock!");
      return;
    }
    
    if (!confirm(`Are you sure you want to spend ${reward.points_required} points on ${reward.name}?`)) {
      return;
    }
    
    try {
      // Optimistic front-end UI update for instant feedback
      const newPoints = user.total_points - reward.points_required;
      setUser({ ...user, total_points: newPoints });
      setRewards(rewards.map(r => r.id === reward.id && r.quantity !== null ? { ...r, quantity: r.quantity - 1 } : r));

      // Dispatch event to sync global header layout instantly
      window.dispatchEvent(new CustomEvent("user-points-updated", { detail: { points: newPoints } }));

      await api.rewards.redeem(user.id, reward.id);
      
      // Refresh strictly in the background (silent) to confirm backend state
      loadData(true); 
      
      // Flash a quick confirmation!
      setTimeout(() => alert("Reward claimed! Let your parents know!"), 100);
      
    } catch (e: any) {
      alert("Failed to claim: " + e.message);
      loadData(true); // Re-sync to undo optimistic update
    }
  };

  if (loading && !user) return <div className="text-gray-500 animate-pulse text-center mt-10 font-bold text-xl">Loading Store...</div>;

  const currentPoints = user?.total_points || 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-blue-500 to-primary rounded-2xl p-6 shadow-lg text-white mb-8">
        <div>
          <h1 className="text-3xl font-black mb-1">Rewards Store 🎁</h1>
          <p className="font-medium opacity-90">Redeem your hard-earned points for awesome prizes!</p>
        </div>
        <div className="mt-4 md:mt-0 bg-white/20 px-6 py-3 rounded-xl border border-white/30 backdrop-blur-sm shadow-inner flex items-center gap-3 text-2xl font-black">
          <span>{currentPoints}</span>
          <span className="text-xl font-medium opacity-80">pts available</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {rewards.map((reward) => (
          <Card key={reward.id} className="flex flex-col h-full overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
            <CardContent className="p-0 flex flex-col h-full">
              <div className="bg-gray-50/50 p-8 flex flex-col items-center justify-center border-b flex-grow">
                <span className="text-7xl mb-6 drop-shadow-md">{reward.icon}</span>
                <h3 className="font-black text-xl text-center leading-tight mb-3 text-gray-800">{reward.name}</h3>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-base py-1 px-4 border-2 border-transparent font-bold">
                  {reward.points_required} Points
                </Badge>
              </div>
              <div className="p-5 bg-white space-y-4 mt-auto">
                <div className="flex justify-between items-center text-sm font-semibold text-gray-500">
                  <span>In Stock:</span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                    {reward.quantity === null ? "∞" : reward.quantity}
                  </span>
                </div>
                <Button 
                  onClick={() => handleRedeem(reward)}
                  className="w-full font-bold text-base h-12"
                  disabled={currentPoints < reward.points_required || (reward.quantity !== null && reward.quantity <= 0)}
                  variant={currentPoints >= reward.points_required ? "default" : "secondary"}
                >
                  {reward.quantity !== null && reward.quantity <= 0 
                    ? "Out of Stock" 
                    : currentPoints >= reward.points_required 
                      ? "🎉 Redeem Now" 
                      : "Need more points"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {rewards.length === 0 && (
          <div className="p-12 text-center text-gray-500 border rounded-lg bg-gray-50 font-bold">
            The store is currently empty! Ask your parents to add some prizes.
          </div>
      )}
    </div>
  );
}
