"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PlusCircle, Pencil, Trash2, CheckCircle } from "lucide-react";

export default function ParentChoresPage() {
  const [chores, setChores] = useState<any[]>([]);
  const [children, setChildren] = useState<any[]>([]);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPoints, setNewPoints] = useState(10);
  const [newAssignee, setNewAssignee] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [choresRes, kidsRes] = await Promise.all([
        api.chores.getAll(),
        api.users.getAll()
      ]);
      setChores(choresRes || []);
      setChildren(kidsRes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChore = async () => {
    try {
      await api.chores.create({
        title: newTitle,
        points_worth: newPoints,
        user_id: newAssignee && newAssignee !== "unassigned" ? parseInt(newAssignee) : null,
      });
      setOpenDialog(false);
      setNewTitle("");
      setNewPoints(10);
      setNewAssignee("");
      loadData();
    } catch (e: any) {
      alert("Failed to create chore: " + e.message);
    }
  };

  const handleDeleteChore = async (id: number) => {
    if (!confirm("Are you sure you want to delete this chore?")) return;
    try {
      await api.chores.delete(id);
      loadData();
    } catch(e: any) {
      alert("Delete failed: " + e.message);
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

  const getAssigneeName = (userId: number | null) => {
    if (!userId) return "Unassigned";
    const child = children.find(c => c.id === userId);
    return child ? child.display_name : "Unknown";
  };

  if (loading) return <div className="text-gray-500 animate-pulse text-center mt-10">Loading chores...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Chores</h1>
          <p className="text-gray-500">Create, edit, and assign chores to your children.</p>
        </div>
        
        <Button onClick={() => setOpenDialog(true)}><PlusCircle className="mr-2 h-4 w-4" /> Add Chore</Button>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Chore</DialogTitle>
              <DialogDescription>
                Create a new chore. Click save when you&apos;re done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Title</Label>
                <Input id="title" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Walk the dog" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="points" className="text-right">Points</Label>
                <Input id="points" type="number" value={newPoints} onChange={e => setNewPoints(Number(e.target.value))} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="assignee" className="text-right">Assignee</Label>
                <select 
                  id="assignee" 
                  value={newAssignee}
                  onChange={e => setNewAssignee(e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm col-span-3"
                >
                  <option value="unassigned">Unassigned (Chore Wheel)</option>
                  {children.map(c => (
                    <option key={c.id} value={c.id}>{c.display_name}</option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddChore} disabled={!newTitle}>Save Chore</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 font-semibold">Chore Title</th>
                <th className="px-6 py-3 font-semibold">Points</th>
                <th className="px-6 py-3 font-semibold">Assignee</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y border-t-0">
              {chores.map((chore) => (
                <tr key={chore.id} className="hover:bg-gray-50 bg-white transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 line-clamp-1">{chore.title}</td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className="font-mono bg-blue-50 text-blue-700 border-blue-200">
                      {chore.points_worth}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    {!chore.user_id ? (
                      <span className="text-gray-500 italic flex items-center gap-1">🎡 Wheel</span>
                    ) : (
                      getAssigneeName(chore.user_id)
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Badge 
                      variant="secondary"
                      className={
                        chore.status === "completed" ? "bg-green-100 text-green-800" :
                        chore.status === "pending_approval" ? "bg-yellow-100 text-yellow-800 animate-pulse" : 
                        "bg-gray-100 text-gray-800"
                      }
                    >
                      {chore.status.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 items-center">
                      {chore.status === "pending_approval" && (
                        <Button variant="outline" onClick={() => handleApproveChore(chore.id)} size="sm" className="h-8 text-green-600 border-green-200 hover:bg-green-50 mr-2">
                          <CheckCircle className="h-4 w-4 mr-1" /> Approve
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" onClick={() => handleDeleteChore(chore.id)} size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {chores.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No chores found in the database.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
