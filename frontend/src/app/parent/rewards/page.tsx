"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ParentRewardsPage() {
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<any>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [cost, setCost] = useState("100");
  const [icon, setIcon] = useState("🎁");
  const [quantity, setQuantity] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.rewards.getAll();
      setRewards(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDialog = (reward: any = null) => {
    if (reward) {
      setEditingReward(reward);
      setName(reward.name);
      setCost(String(reward.points_required));
      setIcon(reward.icon || "🎁");
      setQuantity(reward.quantity === null ? "" : String(reward.quantity));
    } else {
      setEditingReward(null);
      setName("");
      setCost("100");
      setIcon("🎁");
      setQuantity("");
    }
    setIsDialogOpen(true);
  };

  const handleSaveReward = async () => {
    if (!name.trim()) return;
    try {
      const payload = {
        name,
        points_required: parseInt(cost) || 0,
        icon: icon || "🎁",
        quantity: quantity.trim() === "" ? null : parseInt(quantity)
      };

      if (editingReward) {
        await api.rewards.update(editingReward.id, payload);
      } else {
        await api.rewards.create(payload);
      }
      setIsDialogOpen(false);
      loadData();
    } catch (e) {
      alert("Failed to save reward.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this reward?")) return;
    try {
      await api.rewards.delete(id);
      loadData();
    } catch (e) {
      alert("Failed to delete reward.");
    }
  };

  if (loading) return <div className="text-gray-500 animate-pulse text-center mt-10 font-bold">Loading Store...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Rewards</h1>
          <p className="text-gray-500">Create and edit rewards for the store.</p>
        </div>
        
        <Button onClick={() => handleOpenDialog()}><PlusCircle className="mr-2 h-4 w-4" /> Add Reward</Button>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingReward ? "Edit Reward" : "Add New Reward"}</DialogTitle>
              <DialogDescription>
                Set a prize and point cost for the exact reward.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Title</Label>
                <Input id="title" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Movie Night" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cost" className="text-right">Point Cost</Label>
                <Input id="cost" type="number" value={cost} onChange={(e) => setCost(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="icon" className="text-right">Emoji Icon</Label>
                <Input id="icon" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🍿" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="qty" className="text-right">Max Qty</Label>
                <Input id="qty" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Leave blank for infinite" className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSaveReward}>Save Reward</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {rewards.map((reward) => (
          <Card key={reward.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <div className="bg-gray-50 p-6 flex flex-col items-center justify-center border-b">
                <span className="text-6xl mb-4">{reward.icon}</span>
                <h3 className="font-bold text-lg text-center leading-tight mb-2">{reward.name}</h3>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200 text-sm py-1 px-3">
                  {reward.points_required} Points
                </Badge>
              </div>
              <div className="flex justify-between items-center p-4 bg-white">
                <span className="text-xs font-medium text-gray-500">
                  Qty left: {reward.quantity === null ? "∞" : reward.quantity}
                </span>
                <div className="flex gap-1">
                  <Button onClick={() => handleOpenDialog(reward)} variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => handleDelete(reward.id)} variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {rewards.length === 0 && (
         <div className="p-12 text-center text-gray-500 border rounded-lg bg-gray-50">
           No rewards found in the store. Click "Add Reward" to create one.
         </div>
      )}
    </div>
  );
}
