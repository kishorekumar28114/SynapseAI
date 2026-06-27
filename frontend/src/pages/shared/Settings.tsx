import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Lock, Loader2, CheckCircle2 } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [isChanging, setIsChanging] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [isSettingPassword, setIsSettingPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    
    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg("New password must be at least 8 characters.");
      return;
    }

    setIsChanging(true);
    try {
      if (isSettingPassword) {
        await authApi.setPassword(newPassword);
      } else {
        await authApi.changePassword(currentPassword, newPassword);
      }
      setSuccessMsg(isSettingPassword ? "Password successfully set." : "Password successfully updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setErrorMsg(Array.isArray(detail) ? detail[0].msg : (detail || "Failed to change password."));
    } finally {
      setIsChanging(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6 h-full max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your personal profile and security preferences.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Full Name</p>
              <p className="font-medium text-lg">{user.full_name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Username</p>
              <p className="font-medium">{user.username}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Email Address</p>
              <p className="font-medium">{user.email || "Not provided"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Role</p>
              <p className="font-medium capitalize">{user.role}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              {isSettingPassword ? "Set Password" : "Change Password"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {successMsg && (
              <div className="mb-4 rounded-md bg-success/20 p-3 text-sm text-success-foreground flex items-center gap-2 border border-success/50">
                <CheckCircle2 className="h-4 w-4" />
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="mb-4 rounded-md bg-destructive/20 p-3 text-sm text-destructive border border-destructive/50">
                {errorMsg}
              </div>
            )}
            
            <div className="mb-4 flex justify-end">
              <Button variant="link" size="sm" onClick={() => setIsSettingPassword(!isSettingPassword)} className="h-auto p-0 text-muted-foreground">
                {isSettingPassword ? "I already have a password" : "I don't have a password yet"}
              </Button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {!isSettingPassword && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Current Password</label>
                  <Input 
                    type="password"
                    value={currentPassword} 
                    onChange={e => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                <Input 
                  type="password"
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm New Password</label>
                <Input 
                  type="password"
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={isChanging || (!isSettingPassword && !currentPassword) || !newPassword || !confirmPassword} className="w-full">
                {isChanging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSettingPassword ? "Set Password" : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
