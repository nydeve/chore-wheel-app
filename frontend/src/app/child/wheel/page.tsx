"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ChildWheelPage() {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{title: string, points: number} | null>(null);

  const chores = [
    { title: "Clean the Windows", points: 30 },
    { title: "Fold Laundry", points: 20 },
    { title: "Water Plants", points: 15 },
    { title: "Take out Trash", points: 10 },
    { title: "Sweep Floor", points: 20 },
    { title: "Free Pass! 🌟", points: 0 }
  ];

  const handleSpin = () => {
    setSpinning(true);
    setResult(null);
    
    // Simulate spin duration and random result
    setTimeout(() => {
      let randomChore = chores[Math.floor(Math.random() * chores.length)];
      setResult(randomChore);
      setSpinning(false);
    }, 3000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-8 text-center space-y-8">
      <div>
        <h1 className="text-5xl font-black text-gray-900 mb-2 drop-shadow-sm">The Chore Wheel</h1>
        <p className="text-xl text-gray-600 font-medium tracking-wide">Spin to win your next task!</p>
      </div>

      <div className="relative w-80 h-80 flex items-center justify-center">
        {/* Pointer */}
        <div className="absolute top-0 z-20 w-0 h-0 border-l-[20px] border-r-[20px] border-t-[40px] border-transparent border-t-yellow-500 drop-shadow-md transform -translate-y-4"></div>
        
        {/* Wheel Graphic Placeholder uses conic-gradient to look like wheel sectors */}
        <div className={`w-full h-full rounded-full border-8 border-white shadow-xl flex items-center justify-center overflow-hidden transition-all duration-[3000ms] ${spinning ? "rotate-[1440deg] blur-[1px]" : "rotate-0"} ease-out`}
             style={{
               background: "conic-gradient(#ef4444 0deg 60deg, #f97316 60deg 120deg, #eab308 120deg 180deg, #22c55e 180deg 240deg, #3b82f6 240deg 300deg, #a855f7 300deg 360deg)"
             }}>
          <div className="w-16 h-16 bg-white rounded-full z-10 shadow-inner flex items-center justify-center">
             <span className="text-2xl">🎡</span>
          </div>
        </div>
      </div>

      <Button 
        onClick={handleSpin} 
        disabled={spinning}
        className="w-48 h-16 text-2xl font-black bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
      >
        {spinning ? "SPINNING..." : "SPIN NOW!"}
      </Button>

      <Dialog open={!!result} onOpenChange={(open) => !open && setResult(null)}>
        <DialogContent className="sm:max-w-md text-center border-t-8 border-t-green-500">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black text-gray-900 mt-4 mb-2">You Got...</DialogTitle>
            <DialogDescription className="text-xl font-bold text-gray-600">
              {result?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 flex justify-center">
            {result?.points && result.points > 0 ? (
               <div className="bg-blue-100 text-blue-800 px-6 py-3 rounded-full text-2xl font-black shadow-inner">
                 +{result.points} Points possible!
               </div>
            ) : (
               <div className="bg-yellow-100 text-yellow-700 px-6 py-3 rounded-full text-2xl font-black shadow-inner flex items-center gap-2">
                 🎉 Lucky you!
               </div>
            )}
          </div>
          <DialogFooter className="sm:justify-center">
            <Button type="button" size="lg" className="w-full font-bold text-lg" onClick={() => setResult(null)}>
              Accept Challenge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
