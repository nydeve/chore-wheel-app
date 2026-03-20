"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import { PlusCircle, Pencil, Trash2 } from "lucide-react";

export default function ParentChoresPage() {
  const [chores, setChores] = useState([
    { id: 1, title: "Clean Room", points: 20, assignee: "Sam", status: "Active", dueDate: "2026-03-20" },
    { id: 2, title: "Wash Dishes", points: 10, assignee: "Unassigned", status: "Active", dueDate: "2026-03-18" },
    { id: 3, title: "Take out Trash", points: 15, assignee: "Alex", status: "Completed", dueDate: "2026-03-19" },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Chores</h1>
          <p className="text-gray-500">Create, edit, and assign chores to your children.</p>
        </div>
        
        <Dialog>
          <DialogTrigger>
            <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Chore</Button>
          </DialogTrigger>
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
                <Input id="title" placeholder="e.g. Walk the dog" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="points" className="text-right">Points</Label>
                <Input id="points" type="number" defaultValue="10" className="col-span-3" />
              </div>
              {/* Note: Select components are missing from npx shadcn add but conceptually we would add them. I will use standard native select for now to avoid errors if uninstalled */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="assignee" className="text-right">Assignee</Label>
                <select id="assignee" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm col-span-3">
                  <option value="unassigned">Unassigned (Chore Wheel)</option>
                  <option value="sam">Sam</option>
                  <option value="alex">Alex</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save Chore</Button>
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
                <th className="px-6 py-3 font-semibold">Due Date</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {chores.map((chore) => (
                <tr key={chore.id} className="hover:bg-gray-50 bg-white transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{chore.title}</td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className="font-mono bg-blue-50 text-blue-700 border-blue-200">
                      {chore.points}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    {chore.assignee === "Unassigned" ? (
                      <span className="text-gray-500 italic flex items-center gap-1">🎡 Wheel</span>
                    ) : (
                      chore.assignee
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={chore.status === "Completed" ? "default" : "secondary"} 
                           className={chore.status === "Completed" ? "bg-green-100 text-green-800 hover:bg-green-200 border-transparent" : ""}>
                      {chore.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{chore.dueDate}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {chores.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No chores found. Click "Add Chore" to create one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
