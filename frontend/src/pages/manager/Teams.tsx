import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { teamsApi } from "@/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus, Loader2 } from "lucide-react";

export default function Teams() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const data = await teamsApi.list();
      setTeams(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setIsCreating(true);
    try {
      const res = await teamsApi.create({ name: newTeamName });
      setTeams([res, ...teams]);
      setNewTeamName("");
    } catch (err) {
      console.error(err);
      alert("Failed to create team.");
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-4" /> Loading teams...</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams Directory</h1>
          <p className="text-muted-foreground mt-1">Manage all your teams across the organization.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add New Team</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateTeam} className="flex max-w-md gap-3">
            <Input 
              placeholder="E.g. Frontend Engineering" 
              value={newTeamName} 
              onChange={e => setNewTeamName(e.target.value)} 
              required 
            />
            <Button type="submit" disabled={isCreating || !newTeamName.trim()}>
              {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Create Team
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teams.length === 0 ? (
          <div className="col-span-full rounded-lg border border-dashed p-12 text-center text-muted-foreground">
            <Users className="mx-auto mb-4 h-12 w-12 opacity-20" />
            <h3 className="text-lg font-medium text-foreground">No teams found</h3>
            <p className="mt-2 text-sm">Create your first team above to get started.</p>
          </div>
        ) : (
          teams.map(team => (
            <Card key={team.id} className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md group" onClick={() => navigate(`/teams/${team.id}`)}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
                <CardTitle className="text-xl mt-4 line-clamp-1">{team.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{team.member_count}</span> members
                </div>
                {team.project_id && (
                  <div className="mt-2 text-xs text-primary bg-primary/10 inline-block px-2 py-1 rounded">
                    Assigned to Project
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
