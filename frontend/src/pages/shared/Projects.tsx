import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FolderOpen, Plus, Clock, Users, DollarSign, Loader2, Cpu } from "lucide-react";
import { projectsApi } from "@/api";
import type { Project } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate, truncate } from "@/lib/utils";
import { Input } from "@/components/ui/input";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isManager = user?.role === "manager";

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const loadProjects = () => {
    const fetcher = isManager ? projectsApi.list : projectsApi.myTeamProjects;
    fetcher()
      .then(setProjects)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { loadProjects(); }, [isManager]);

  const handleCreateNew = () => {
    setIsCreateModalOpen(true);
  };

  const submitCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setIsCreating(true);
    try {
      const res = await projectsApi.create({ name: newProjectName, description: newProjectDesc });
      setIsCreateModalOpen(false);
      setNewProjectName("");
      setNewProjectDesc("");
      navigate(`/projects/${res.id}`);
    } catch (err) {
      console.error("Failed to create project", err);
      alert("Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">
            {isManager ? "Manage all enterprise projects and requirements." : "Projects assigned to your teams."}
          </p>
        </div>
        {isManager && (
          <Button onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-[120px] bg-secondary/20" />
              <CardContent className="h-[80px]" />
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed bg-secondary/10 p-12 text-center">
          <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">No Projects Found</h3>
          <p className="text-muted-foreground mb-6">
            {isManager ? "Get started by creating your first project." : "You haven't been assigned to any projects yet."}
          </p>
          {isManager && (
            <Button onClick={handleCreateNew}>Create Project</Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map(project => (
            <Card 
              key={project.id} 
              className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3 items-center">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      <FolderOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        Updated {formatDate(project.updated_at || project.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[40px]">
                  {project.description || "No description provided."}
                </p>
                
                {project.ai_analysis_status === "done" && (
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Difficulty</span>
                      <span className="text-sm font-semibold capitalize">{project.ai_difficulty?.replace('_', ' ')}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Time Est</span>
                      <span className="text-sm font-semibold">{project.ai_time_estimate}</span>
                    </div>
                  </div>
                )}

                {project.ai_analysis_status === "analyzing" && (
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t text-sm text-primary">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing Requirements...
                  </div>
                )}
                
                {project.ai_analysis_status === "pending" && (
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t text-sm text-muted-foreground">
                    <Cpu className="h-4 w-4" />
                    Analysis Pending
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader>
              <CardTitle>Create New Project</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitCreateProject} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project Name</label>
                  <Input 
                    placeholder="E.g. Nexus Dashboard Redesign" 
                    value={newProjectName} 
                    onChange={e => setNewProjectName(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea 
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Brief description of the project goals..."
                    rows={4}
                    value={newProjectDesc}
                    onChange={e => setNewProjectDesc(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating || !newProjectName.trim()}>
                    {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Create Project
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
