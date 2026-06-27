import React, { useState, useEffect } from "react";
import { UserPlus, Copy, Trash2, UserX, MoreHorizontal, Mail } from "lucide-react";
import { employeesApi } from "@/api";
import type { Employee } from "@/types";
import { ROLE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Input } from "@/components/ui/input";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteData, setInviteData] = useState({ full_name: "", email: "" });
  const [inviteResult, setInviteResult] = useState<{ temp_password?: string, message?: string } | null>(null);

  const loadEmployees = () =>
    employeesApi.list().then(setEmployees).catch(console.error).finally(() => setIsLoading(false));

  useEffect(() => { loadEmployees(); }, []);

  const handleDeactivate = async (id: string, name: string) => {
    if (!window.confirm(`Deactivate ${name}?`)) return;
    try {
      await employeesApi.deactivate(id);
      loadEmployees();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    try {
      await employeesApi.delete(id);
      loadEmployees();
    } catch (err) { console.error(err); }
  };

  const submitInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    setInviteResult(null);
    try {
      const payload = { ...inviteData, role: "team_member" };
      const res = await employeesApi.invite(payload);
      setInviteResult({ temp_password: res.temp_password, message: res.message });
      setInviteData({ full_name: "", email: "" });
      loadEmployees();
    } catch (err: any) {
      console.error(err);
      setInviteResult({ message: err.response?.data?.detail || "Failed to invite employee." });
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">People Directory</h1>
          <p className="text-muted-foreground mt-1">Manage your team members and access across projects.</p>
        </div>
        <Button onClick={() => setIsInviteOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Employee
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">All Employees</CardTitle>
            <Badge variant="secondary">{employees.length} Members</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground animate-pulse">Loading directory...</div>
          ) : employees.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No employees found.</div>
          ) : (
            <div className="divide-y">
              {employees.map((emp) => (
                <div key={emp.id} className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {emp.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-medium">{emp.full_name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {emp.email || "No email"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <Badge variant="outline">{ROLE_LABELS[emp.role as keyof typeof ROLE_LABELS]}</Badge>
                    <Badge variant={emp.is_active ? "success" : "destructive"}>
                      {emp.is_active ? "Active" : "Inactive"}
                    </Badge>
                    
                    <div className="text-sm text-muted-foreground hidden md:block">
                      Joined {formatDate(emp.created_at)}
                    </div>

                    <div className="flex items-center gap-2">
                      {emp.is_active && (
                        <Button variant="ghost" size="icon" onClick={() => handleDeactivate(emp.id, emp.full_name)}>
                          <UserX className="h-4 w-4 text-warning" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(emp.id, emp.full_name)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Employee Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader>
              <CardTitle>Invite New Employee</CardTitle>
            </CardHeader>
            <CardContent>
              {inviteResult ? (
                <div className="space-y-4">
                  <div className={`rounded-md p-4 border ${inviteResult.temp_password ? 'bg-success/20 text-success-foreground border-success/50' : 'bg-destructive/20 text-destructive border-destructive/50'}`}>
                    <p className="font-semibold">{inviteResult.message}</p>
                    {inviteResult.temp_password && (
                      <>
                        <p className="mt-2 text-sm">Temporary Password:</p>
                        <div className="mt-1 font-mono bg-background p-2 rounded flex justify-between items-center text-foreground">
                          {inviteResult.temp_password}
                          <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(inviteResult.temp_password || '')}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                  <Button className="w-full" onClick={() => { setIsInviteOpen(false); setInviteResult(null); }}>Done</Button>
                </div>
              ) : (
                <form onSubmit={submitInvite} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <Input 
                      placeholder="E.g. Jane Doe" 
                      value={inviteData.full_name} 
                      onChange={e => setInviteData({ ...inviteData, full_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Address</label>
                    <Input 
                      type="email"
                      placeholder="jane@company.com" 
                      value={inviteData.email} 
                      onChange={e => setInviteData({ ...inviteData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isInviting}>
                      {isInviting ? "Inviting..." : "Send Invite"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
