import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Video, CheckCircle, Clock, FolderOpen, ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { meetingsApi } from "@/api";
import type { Meeting } from "@/types";
import { formatRelativeTime, truncate } from "@/lib/utils";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const meetingsData = await meetingsApi.myMeetings();
        setMeetings(meetingsData);
      } catch (err) {
        console.error("Failed to load employee data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const analyzedCount = meetings.filter((m) => m.has_analysis).length;

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading dashboard...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Hello, {user?.full_name?.split(" ")[0]} 👋</h1>
        <p className="text-muted-foreground mt-1">Your assigned projects and responsibilities.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
            <Video className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{meetings.length}</div>
            <p className="text-xs text-muted-foreground mt-1">In your teams</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">AI Analyzed</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyzedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">With insights available</p>
          </CardContent>
        </Card>
        <Card className="flex flex-col items-center justify-center bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <Link to="/projects" className="flex flex-col items-center gap-2 text-primary hover:opacity-80">
              <FolderOpen className="h-8 w-8" />
              <span className="font-semibold">Go to Projects</span>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Meetings</CardTitle>
          <Link to="/projects" className="text-sm font-medium text-primary hover:underline">View in Projects</Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {meetings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No meetings available yet.</p>
            ) : (
              meetings.slice(0, 5).map((meeting) => (
                <div key={meeting.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    {meeting.status === "completed" ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    ) : meeting.status === "failed" ? (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{truncate(meeting.title, 40)}</p>
                      <p className="text-xs text-muted-foreground">{formatRelativeTime(meeting.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={meeting.status === "completed" ? "success" : "secondary"}>{meeting.status}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
