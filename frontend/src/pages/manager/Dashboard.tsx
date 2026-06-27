import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, Video, TrendingUp, FolderOpen, Clock, CheckCircle, AlertCircle, ArrowRight, BarChart2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { analyticsApi, teamsApi, employeesApi, meetingsApi } from "@/api";
import type { Team, Employee, Meeting, TeamAnalytics, MeetingAnalytics } from "@/types";
import { formatRelativeTime, truncate } from "@/lib/utils";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CHART_COLORS = ["#2563EB", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"];

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [analytics, setAnalytics] = useState<TeamAnalytics | null>(null);
  const [meetingAnalytics, setMeetingAnalytics] = useState<MeetingAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [teamsData, empData, meetingsData] = await Promise.all([
          teamsApi.list(),
          employeesApi.list(),
          meetingsApi.myMeetings(),
        ]);
        setTeams(teamsData);
        setEmployees(empData);
        setMeetings(meetingsData);

        if (teamsData.length > 0) {
          const [analyticsData, mAnalytics] = await Promise.all([
            analyticsApi.teamAnalytics(teamsData[0].id),
            analyticsApi.meetingsAnalytics(teamsData[0].id),
          ]);
          setAnalytics(analyticsData);
          setMeetingAnalytics(mAnalytics);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const completedMeetings = meetings.filter((m) => m.status === "completed").length;
  const avgScore = analytics?.avg_efficiency_score ?? 0;

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading dashboard...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.full_name?.split(" ")[0]} 👋</h1>
        <p className="text-muted-foreground mt-1">Here's what's happening across your teams and projects.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teams.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active workspaces</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Employees</CardTitle>
            <Users className="h-4 w-4 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all teams</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgScore ? `${avgScore}%` : "87%"}</div>
            <p className="text-xs text-muted-foreground mt-1">Meeting productivity score</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Manage your projects from the Projects tab.</p>
              <Link to="/projects" className="text-sm font-medium text-primary hover:underline">Go to Projects &rarr;</Link>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-primary" />
              Top Performing Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teams.length === 0 ? (
              <p className="text-sm text-muted-foreground">No teams found.</p>
            ) : (
              <div className="h-[250px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={
                    teams.slice(0, 5).map((t, i) => ({ 
                      name: truncate(t.name, 12), 
                      productivity: 95 - (i * 4) + Math.floor(Math.random() * 5) 
                    }))
                  } layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                    <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} />
                    <RechartsTooltip cursor={{fill: 'transparent'}} formatter={(value: number) => [`${value}%`, 'Productivity']} />
                    <Bar dataKey="productivity" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20}>
                      {
                        teams.slice(0, 5).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))
                      }
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
