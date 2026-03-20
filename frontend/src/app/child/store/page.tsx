"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ChildStorePage() {
  const currentPoints = 150;
  
  const rewards = [
    { id: 1, title: "Extra Video Games", cost: 50, icon: "🎮", quantity: "∞" },
    { id: 2, title: "Stay Up Late", cost: 100, icon: "🌙", quantity: 1 },
    { id: 3, title: "Ice Cream Trip", cost: 150, icon: "🍦", quantity: 2 },
    { id: 4, title: "New Toy", cost: 500, icon: "🧸", quantity: 1 }
  ];

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
                <h3 className="font-black text-xl text-center leading-tight mb-3 text-gray-800">{reward.title}</h3>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-base py-1 px-4 border-2 border-transparent font-bold">
                  {reward.cost} Points
                </Badge>
              </div>
              <div className="p-5 bg-white space-y-4 mt-auto">
                <div className="flex justify-between items-center text-sm font-semibold text-gray-500">
                  <span>In Stock:</span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700">{reward.quantity}</span>
                </div>
                <Button 
                  className="w-full font-bold text-base h-12"
                  disabled={currentPoints < reward.cost}
                  variant={currentPoints >= reward.cost ? "default" : "secondary"}
                >
                  {currentPoints >= reward.cost ? "🎉 Redeem Now" : "Need more points"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
