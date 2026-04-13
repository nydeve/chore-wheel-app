"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, UserPlus, Copy, Trash2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const router = useRouter();
  
  // States
  const [user, setUser] = useState<any>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit Profile States
  const [displayName, setDisplayName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ text: "", type: "" });

  // Invite States
  const [inviteLink, setInviteLink] = useState("");
  const [generatingInvite, setGeneratingInvite] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [userData, childrenData] = await Promise.all([
        api.auth.me(),
        api.users.getAll()
      ]);
      
      setUser(userData);
      setDisplayName(userData.display_name);
      setChildren(childrenData || []);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Not logged in") || err.message?.includes("expired")) {
        router.push("/auth/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage({ text: "", type: "" });

    try {
      const updatedUser = await api.auth.updateProfile({ display_name: displayName });
      setUser(updatedUser);
      setProfileMessage({ text: "Profile updated successfully!", type: "success" });
      setTimeout(() => setProfileMessage({ text: "", type: "" }), 3000);
    } catch (err: any) {
      setProfileMessage({ text: err.message || "Failed to update profile", type: "error" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleGenerateInvite = async () => {
    setGeneratingInvite(true);
    try {
      const res = await api.users.invite();
      setInviteLink(res.invite_link);
    } catch (err: any) {
      alert(err.message || "Failed to generate invite link");
    } finally {
      setGeneratingInvite(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    alert("Copied to clipboard!");
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-gray-500 font-bold animate-pulse">Loading Profile...</div>;
  }

  if (!user) {
    return <div className="text-center text-red-500 mt-10">Failed to load profile.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Parent Settings</h1>
          <p className="text-gray-500 text-lg font-medium mt-1">Manage your account and family members.</p>
        </div>
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-4 py-1.5 text-sm">
          <ShieldCheck className="w-4 h-4 mr-2 inline" />
          Administrator Account
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Account Info Column */}
        <div className="md:col-span-5 space-y-8">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="text-xl font-bold">Personal Info</CardTitle>
              <CardDescription>Update your display name here.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              
              {profileMessage.text && (
                <div className={`mb-6 p-3 rounded-xl flex items-center gap-2 text-sm font-bold ${profileMessage.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                  {profileMessage.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  {profileMessage.text}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Email Address</Label>
                  <p className="font-semibold text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100">{user.email}</p>
                </div>
                
                <div className="space-y-2 pt-2">
                  <Label htmlFor="displayName" className="font-bold text-gray-700">Display Name</Label>
                  <Input 
                    id="displayName" 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)} 
                    className="focus:ring-primary/20 transition-all font-medium"
                  />
                </div>
                
                <Button disabled={savingProfile} type="submit" className="w-full mt-2 font-bold transition-all hover:shadow-md">
                  {savingProfile ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Family Management Column */}
        <div className="md:col-span-7 space-y-8">
          
          <Card className="border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white pb-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black shadow-sm inline-block">Family Members</h2>
                  <p className="text-blue-100 font-medium mt-1">Manage child accounts and tracking.</p>
                </div>
                <UserPlus className="w-10 h-10 text-white/20" />
              </div>
            </div>
            
            <CardContent className="p-0 -mt-6">
              <div className="bg-white rounded-xl mx-4 shadow-sm border border-gray-100 divide-y relative z-10">
                {children.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 font-medium">
                    No children added to your family yet. 
                    <br/> Use the invite code below to get started!
                  </div>
                ) : (
                  children.map((child: any) => (
                    <div key={child.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-lg">
                          {child.display_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{child.display_name}</p>
                          <p className="text-xs text-gray-500 font-medium">Joined {new Date(child.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
            
            <CardFooter className="bg-gray-50/50 border-t border-gray-100 p-6 mt-6 flex-col items-start gap-4">
              <div className="w-full">
                <h3 className="font-bold text-gray-900 mb-2">Add a Child Account</h3>
                <p className="text-sm text-gray-500 mb-4">Generate a secure, one-time link that allows a child to create their own login profile connected to your family.</p>
                
                {!inviteLink ? (
                  <Button 
                    variant="outline" 
                    onClick={handleGenerateInvite} 
                    disabled={generatingInvite}
                    className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 font-bold transition-all"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {generatingInvite ? "Generating..." : "Generate Invite Link"}
                  </Button>
                ) : (
                  <div className="bg-white border-2 border-green-200 rounded-lg p-1 animate-in zoom-in-95 duration-300 shadow-sm relative pr-24 overflow-hidden">
                    <div className="px-3 py-2 text-sm font-mono text-green-800 truncate select-all">
                      {inviteLink}
                    </div>
                    <Button 
                      onClick={copyToClipboard} 
                      className="absolute right-1 top-1 bottom-1 h-auto bg-green-500 hover:bg-green-600 text-white font-bold"
                    >
                      <Copy className="w-4 h-4 mr-2" /> Copy
                    </Button>
                  </div>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
