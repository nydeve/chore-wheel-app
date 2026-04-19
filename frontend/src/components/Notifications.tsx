"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Bell } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export default function Notifications() {
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    // Poll user and notifications
    let interval: NodeJS.Timeout;
    
    const fetchNotifs = async () => {
      try {
        const currentUser = await api.auth.me();
        setUser(currentUser);
        if (currentUser) {
          const list = await api.notifications.getAll(currentUser.id);
          setNotifications(list || []);
        }
      } catch (e) {
        // Not logged in or error
      }
    };
    
    fetchNotifs();
    interval = setInterval(fetchNotifs, 10000); // poll every 10s
    return () => clearInterval(interval);
  }, []);

  const unread = notifications.filter(n => !n.is_read);

  const markRead = async (id: number) => {
    try {
       await api.notifications.markRead(id);
       setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch(e) {}
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none">
          <Bell className="w-6 h-6 text-gray-700" />
          {unread.length > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center p-0 rounded-full border-2 border-white">
              {unread.length}
            </Badge>
          )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-0 mr-4 mt-2 shadow-lg rounded-xl overflow-hidden" align="end">
        <div className="bg-gray-50 border-b border-gray-100 px-4 py-3">
           <h3 className="font-semibold text-gray-900">Notifications</h3>
        </div>
        <div className="max-h-80 overflow-y-auto w-full">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">You're all caught up!</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {notifications.map((n) => (
                <li key={n.id} 
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!n.is_read ? 'bg-blue-50/50' : 'opacity-75'}`}
                    onClick={() => !n.is_read && markRead(n.id)}>
                  <div className="flex gap-3">
                    {!n.is_read && <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
                    <div className="flex-1 space-y-1">
                      <p className={`text-sm font-medium leading-none ${!n.is_read ? 'text-gray-900' : 'text-gray-600'}`}>{n.title}</p>
                      <p className="text-sm text-gray-500">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
