import React, { useEffect, useState } from "react";
import { useParams, Routes, Route, NavLink, useNavigate } from "react-router-dom";
import { useAI } from "@/contexts/AIContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FolderKanban, Users, Video, LineChart, Upload, Loader2, Cpu, UserPlus, Trash2 } from "lucide-react";
import api from "@/api/axios";
import { projectsApi, teamsApi, employeesApi } from "@/api";
import { Input } from "@/components/ui/input";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

import { useAuth } from "@/contexts/AuthContext";
import MeetingDetail from "./MeetingDetail";

export default function ProjectWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setContext } = useAI();
  const [project, setProject] = useState<any>(null);
  const [teamDetail, setTeamDetail] = useState<any>(null);

  useEffect(() => {
    setContext("project", id, project);
    
    api.get(`/projects/${id}`).then(res => {
      setProject(res.data);
      if (res.data.team_id) {
        api.get(`/teams/${res.data.team_id}`).then(teamRes => setTeamDetail(teamRes.data)).catch(console.error);
      }
    }).catch(err => console.error(err));
  }, [id]);

  const userRoleInTeam = React.useMemo(() => {
    if (user?.role === "manager") return "manager";
    if (teamDetail && user) {
      const member = teamDetail.members?.find((m: any) => m.user_id === user.id);
      return member?.role_in_team || "team_member";
    }
    return "team_member";
  }, [teamDetail, user]);

  if (!project) {
    return <div className="p-8 text-center text-muted-foreground">Loading Project Workspace...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Project Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <Badge variant={project.ai_analysis_status === "done" ? "success" : "secondary"}>
            {project.ai_analysis_status || "Pending"}
          </Badge>
        </div>
        <p className="text-muted-foreground">{project.description}</p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b pb-px">
        <NavLink to={`/projects/${id}`} end className={({ isActive }) => `flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"}`}>
          <FolderKanban className="h-4 w-4" />
          Overview
        </NavLink>
        <NavLink to={`/projects/${id}/meetings`} className={({ isActive }) => `flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"}`}>
          <Video className="h-4 w-4" />
          Meetings
        </NavLink>
        <NavLink to={`/projects/${id}/teams`} className={({ isActive }) => `flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"}`}>
          <Users className="h-4 w-4" />
          Teams
        </NavLink>
        <NavLink to={`/projects/${id}/analysis`} className={({ isActive }) => `flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"}`}>
          <LineChart className="h-4 w-4" />
          Analysis
        </NavLink>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        <Routes>
          <Route path="" element={<ProjectOverview project={project} setProject={setProject} userRoleInTeam={userRoleInTeam} />} />
          <Route path="meetings" element={<ProjectMeetings projectId={id!} teamId={project.team_id} userRoleInTeam={userRoleInTeam} />} />
          <Route path="meetings/:meetingId" element={<MeetingDetail />} />
          <Route path="teams" element={<ProjectTeams teamDetail={teamDetail} setTeamDetail={setTeamDetail} projectId={id!} userRoleInTeam={userRoleInTeam} />} />
          <Route path="analysis" element={<ProjectAnalysis project={project} projectId={id!} />} />
        </Routes>
      </div>
    </div>
  );
}

function ProjectOverview({ project, setProject, userRoleInTeam }: { project: any, setProject: any, userRoleInTeam: string }) {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const res = await projectsApi.uploadRequirements(project.id, file);
      setProject(res);
    } catch (err) {
      console.error("Failed to upload requirements", err);
      alert("Failed to upload requirements");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const res = await projectsApi.analyzeProject(project.id);
      setProject(res);
    } catch (err) {
      console.error("Failed to analyze project", err);
      alert("Failed to analyze project. Make sure requirements exist.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const canEdit = userRoleInTeam === "manager" || userRoleInTeam === "team_lead";

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card className="md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Project Requirements</CardTitle>
          {canEdit && (
            <div>
              <input type="file" id="req-upload" className="hidden" accept=".txt,.md,.pdf,.docx" onChange={handleFileUpload} disabled={isUploading} />
              <label htmlFor="req-upload" className="cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {project.client_requirements ? "Replace Document" : "Upload Document"}
              </label>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="rounded-md bg-secondary/50 p-4 text-sm whitespace-pre-wrap min-h-[150px]">
                {project.client_requirements || "No requirements provided yet. Upload a document to get started."}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Estimates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!project.client_requirements ? (
              <div className="text-sm text-muted-foreground">Upload requirements to generate AI estimates.</div>
            ) : project.ai_analysis_status === "done" ? (
              <>
                <div>
                  <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-1">Difficulty</p>
                  <p className="font-semibold capitalize">{project.ai_difficulty?.replace('_', ' ') || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-1">Estimated Time</p>
                  <p className="font-semibold">{project.ai_time_estimate || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-1">Estimated Budget</p>
                  <p className="font-semibold">{project.ai_budget_estimate || "Unknown"}</p>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="text-sm text-muted-foreground">
                  Requirements uploaded. Trigger AI to generate time, budget, and difficulty estimates.
                </div>
                <Button onClick={handleAnalyze} disabled={isAnalyzing || project.ai_analysis_status === "analyzing"} className="w-full">
                  {isAnalyzing || project.ai_analysis_status === "analyzing" ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</>
                  ) : (
                    <><Cpu className="mr-2 h-4 w-4" /> Analyze Requirements</>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { meetingsApi } from "@/api";

function ProjectMeetings({ projectId, teamId, userRoleInTeam }: { projectId: string, teamId?: string, userRoleInTeam: string }) {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");

  const canUpload = userRoleInTeam === "team_lead";

  useEffect(() => {
    if (teamId) {
      meetingsApi.teamMeetings(teamId).then((res: any[]) => {
        setMeetings(res.filter(m => m.project_id === projectId));
      }).catch(console.error);
    }
  }, [teamId, projectId]);

  const handleUploadMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    const fileInput = document.getElementById("meeting-file") as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (!file || !uploadTitle.trim() || !teamId) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", uploadTitle);
      formData.append("team_id", teamId);
      formData.append("project_id", projectId);
      
      const res = await meetingsApi.upload(formData);
      setMeetings([res, ...meetings]);
      setIsUploadModalOpen(false);
      setUploadTitle("");
    } catch (err) {
      console.error(err);
      alert("Failed to upload meeting.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Project Meetings</CardTitle>
          {canUpload && teamId && (
            <Button onClick={() => setIsUploadModalOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Meeting
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!teamId ? (
            <p className="text-muted-foreground text-sm">Please assign a team to this project before uploading meetings.</p>
          ) : meetings.length === 0 ? (
            <p className="text-muted-foreground text-sm">No meetings recorded for this project yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {meetings.map((meeting) => (
                <Card key={meeting.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate(`/projects/${projectId}/meetings/${meeting.id}`)}>
                  <CardHeader className="pb-3">
                    <div className="flex gap-2 items-center">
                      <div className="rounded bg-primary/10 p-2 text-primary">
                        <Video className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-base line-clamp-1">{meeting.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>{new Date(meeting.created_at).toLocaleDateString()}</span>
                      <Badge variant={meeting.status === 'completed' ? 'success' : meeting.status === 'failed' ? 'destructive' : 'secondary'}>
                        {meeting.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Meeting Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader>
              <CardTitle>Upload New Meeting</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUploadMeeting} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Meeting Title</label>
                  <Input 
                    placeholder="E.g. Sprint Planning Sync" 
                    value={uploadTitle} 
                    onChange={e => setUploadTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Recording or Transcript File</label>
                  <Input 
                    type="file" 
                    id="meeting-file" 
                    accept="audio/*,video/*,.txt,.vtt,.srt" 
                    required 
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsUploadModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isUploading || !uploadTitle.trim()}>
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Upload & Process
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

function ProjectTeams({ teamDetail, setTeamDetail, projectId, userRoleInTeam }: { teamDetail?: any, setTeamDetail: any, projectId: string, userRoleInTeam: string }) {
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setIsCreatingTeam(true);
    try {
      const res = await teamsApi.create({ name: newTeamName, project_id: projectId });
      setTeamDetail(res);
    } catch (err) {
      console.error(err);
      alert("Failed to create team");
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const handleFetchEmployees = async () => {
    setIsAddingMember(true);
    try {
      const res = await employeesApi.list();
      // Filter out existing members
      const existingIds = new Set(teamDetail?.members?.map((m: any) => m.user_id));
      setAllEmployees(res.filter((e: any) => !existingIds.has(e.id)));
    } catch (err) {
      console.error(err);
    }
  };

  const submitAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    try {
      await teamsApi.addMember(teamDetail.id, selectedUserId, "team_member");
      // Refresh team detail
      const res = await teamsApi.get(teamDetail.id);
      setTeamDetail(res);
      setIsAddingMember(false);
    } catch (err) {
      console.error(err);
      alert("Failed to add member");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
      await teamsApi.removeMember(teamDetail.id, userId);
      const res = await teamsApi.get(teamDetail.id);
      setTeamDetail(res);
    } catch (err) {
      console.error(err);
      alert("Failed to remove member");
    }
  };

  const canEdit = userRoleInTeam === "manager" || userRoleInTeam === "team_lead";

  if (!teamDetail) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <Users className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No Team Assigned</h3>
          <p className="mb-6 text-sm text-muted-foreground">This project does not have an assigned team yet.</p>
          
          {userRoleInTeam === "manager" && (
            <form onSubmit={handleCreateTeam} className="flex w-full max-w-sm items-center gap-2">
              <Input placeholder="Enter new team name..." value={newTeamName} onChange={e => setNewTeamName(e.target.value)} required />
              <Button type="submit" disabled={isCreatingTeam}>
                {isCreatingTeam ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Team"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{teamDetail.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Manage team members for this project.</p>
          </div>
          {canEdit && (
            <Button onClick={handleFetchEmployees}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          )}
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
                <Button type="submit">Add to Team</Button>
                <Button type="button" variant="ghost" onClick={() => setIsAddingMember(false)}>Cancel</Button>
              </form>
            </div>
          )}

          <div className="rounded-md border">
            {teamDetail.members?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No members in this team yet.</div>
            ) : (
              <div className="divide-y">
                {teamDetail.members?.map((member: any) => (
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
                      {canEdit && (
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveMember(member.user_id)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
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

import { analyticsApi } from "@/api";

function ProjectAnalysis({ project, projectId }: { project: any, projectId: string }) {
  const [meetingAnalytics, setMeetingAnalytics] = useState<any[]>([]);

  useEffect(() => {
    if (project.team_id) {
      analyticsApi.meetingsAnalytics(project.team_id).then(res => {
        // Filter analytics for meetings in this project
        setMeetingAnalytics(res);
      }).catch(console.error);
    }
  }, [project.team_id]);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Project Health & Risk Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-secondary/50 p-4 text-sm whitespace-pre-wrap">
            {project.ai_analysis_summary || "No AI analysis available for this project yet."}
          </div>
        </CardContent>
      </Card>

      {meetingAnalytics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Meeting Productivity Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={meetingAnalytics} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEfficiency" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="title" tickFormatter={(v) => v.length > 10 ? v.substring(0,10)+'...' : v} tick={{fontSize: 12}} />
                  <YAxis domain={[0, 100]} tick={{fontSize: 12}} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <RechartsTooltip formatter={(value) => [`${value}%`, 'Efficiency']} />
                  <Area type="monotone" dataKey="efficiency_score" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorEfficiency)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
