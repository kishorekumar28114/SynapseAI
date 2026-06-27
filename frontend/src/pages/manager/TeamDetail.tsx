import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { teamsApi, employeesApi } from "@/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Loader2, ArrowLeft, Trash2, UserPlus } from "lucide-react";

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("team_member");

  useEffect(() => {
    fetchTeam();
  }, [id]);

  const fetchTeam = async () => {
    try {
      const data = await teamsApi.get(id!);
      setTeam(data);
    } catch (err) {
      console.error(err);
      navigate("/teams");
    } finally {
      setLoading(false);
    }
  };

  const handleFetchEmployees = async () => {
    setIsAddingMember(true);
    try {
      const res = await employeesApi.list();
      // Filter out existing members
      const existingIds = new Set(team?.members?.map((m: any) => m.user_id));
      setAllEmployees(res.filter((e: any) => !existingIds.has(e.id)));
    } catch (err) {
      console.error(err);
    }
  };

  const submitAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    try {
      await teamsApi.addMember(team.id, selectedUserId, selectedRole);
      fetchTeam();
      setIsAddingMember(false);
      setSelectedUserId("");
      setSelectedRole("team_member");
    } catch (err) {
      console.error(err);
      alert("Failed to add member");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
      await teamsApi.removeMember(team.id, userId);
      fetchTeam();
    } catch (err) {
      console.error(err);
      alert("Failed to remove member");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-4" /> Loading team details...</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/teams")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
          <p className="text-muted-foreground mt-1">Manage team members and roles.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Team Members</CardTitle>
          <Button onClick={handleFetchEmployees}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </CardHeader>
        <CardContent>
          {isAddingMember && (
            <div className="mb-6 rounded-lg border bg-secondary/20 p-4">
              <h4 className="font-medium mb-3">Add New Member</h4>
              <form onSubmit={submitAddMember} className="flex gap-3 items-end">
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-medium">Select Employee</label>
                  <select 
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={selectedUserId}
                    onChange={e => setSelectedUserId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Employee --</option>
                    {allEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.username})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Role</label>
                  <select 
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={selectedRole}
                    onChange={e => setSelectedRole(e.target.value)}
                  >
                    <option value="team_member">Team Member</option>
                    <option value="team_lead">Team Lead</option>
                  </select>
                </div>
                <Button type="submit">Add to Team</Button>
                <Button type="button" variant="ghost" onClick={() => setIsAddingMember(false)}>Cancel</Button>
              </form>
            </div>
          )}

          <div className="rounded-md border">
            {team.members?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No members in this team yet.</div>
            ) : (
              <div className="divide-y">
                {team.members?.map((member: any) => (
                  <div key={member.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                        {member.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{member.full_name}</p>
                        <p className="text-xs text-muted-foreground">{member.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={member.role_in_team === "team_lead" ? "default" : "secondary"}>
                        {member.role_in_team.replace('_', ' ')}
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveMember(member.user_id)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
