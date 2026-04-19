"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ChildWheelPage() {
  const [user, setUser] = useState<any>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const u = await api.auth.me();
        setUser(u);
      } catch (e) {
        console.error("Not logged in");
      }
    };
    fetchUser();
  },[]);

  const handleSpin = async () => {
    if (!user) return;
    setSpinning(true);
    setResult(null);
    
    try {
      // Hit backend API to securely pick a random unassigned chore and assign it to the user.
      const spunChore = await api.chores.spin(user.id);
      
      // Simulate spin duration animation
      setTimeout(() => {
        setResult(spunChore);
        setSpinning(false);
      }, 3000);
      
    } catch (e: any) {
      setSpinning(false);
      alert(e.message || "No chores available to spin for!");
    }
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
            {result?.points_worth && result.points_worth > 0 ? (
               <div className="bg-blue-100 text-blue-800 px-6 py-3 rounded-full text-2xl font-black shadow-inner">
                 +{result.points_worth} Points possible!
               </div>
            ) : (
               <div className="bg-yellow-100 text-yellow-700 px-6 py-3 rounded-full text-2xl font-black shadow-inner flex items-center gap-2">
                 🎉 Lucky you!
               </div>
            )}
          </div>
          <div className="flex flex-col items-center gap-3 w-full mt-4">
            <Button type="button" size="lg" className="w-full font-bold text-lg bg-green-500 hover:bg-green-600 text-white" onClick={() => setResult(null)}>
              Awesome!
            </Button>
            <p className="text-xs text-gray-400 text-center">This chore has been instantly added to your dashboard.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
