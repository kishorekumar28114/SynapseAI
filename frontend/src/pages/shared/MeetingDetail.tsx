import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { meetingsApi } from "@/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Video, FileText, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { useAI } from "@/contexts/AIContext";

export default function MeetingDetail() {
  const { id, meetingId } = useParams<{ id: string; meetingId: string }>();
  const navigate = useNavigate();
  const { setContext } = useAI();
  const [meeting, setMeeting] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!meetingId) return;
    
    meetingsApi.get(meetingId).then(res => {
      setMeeting(res);
      setContext("meeting", meetingId, res);
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      setIsLoading(false);
    });
  }, [meetingId, setContext]);

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!meeting) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertTriangle className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Meeting Not Found</h3>
        <Button variant="outline" className="mt-4" onClick={() => navigate(`/projects/${id}/meetings`)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4 border-b pb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/projects/${id}/meetings`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{meeting.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">{new Date(meeting.created_at).toLocaleString()}</span>
            <Badge variant={meeting.status === 'completed' ? 'success' : meeting.status === 'failed' ? 'destructive' : 'secondary'}>
              {meeting.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Transcript
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md bg-secondary/30 p-4 text-sm whitespace-pre-wrap max-h-[500px] overflow-y-auto">
              {meeting.transcript || "Transcript is still processing or not available."}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                Action Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {meeting.action_items?.length > 0 ? (
                <ul className="list-disc pl-4 space-y-2 text-sm">
                  {meeting.action_items.map((item: any) => (
                    <li key={item.id}>
                      <span className="font-medium">{item.task}</span>
                      {item.assignee && <span className="text-muted-foreground"> (Assignee: {item.assignee})</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No action items extracted yet.</p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                {meeting.summary || "Summary not available yet."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
