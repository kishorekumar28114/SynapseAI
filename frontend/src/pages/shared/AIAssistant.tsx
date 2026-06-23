import { useState, useEffect, useRef } from "react";
import { Send, User, Loader, Sparkles, Clock, FolderOpen, Users } from "lucide-react";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { aiApi, teamsApi, projectsApi } from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import type { ChatMessage, Team, Project } from "../../types";
import { Markdown } from "../../components/common/Markdown";

export default function AIAssistant() {
  const { user } = useAuth();
  const isManager = user?.role === "manager";

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: isManager
        ? "Hello! I'm SynapseAI, your strategic project assistant.\n\nSelect a project from the dropdown and ask me:\n• What teams are working on this project?\n• What is each team's efficiency from recent meetings?\n• Which team has the most pending tasks?\n• What does the SRS say about [feature]?\n• What are the delivery risks?"
        : "Hello! I'm SynapseAI, your personal work assistant.\n\nSelect your team and ask me:\n• What are my pending tasks?\n• What was discussed in the last meeting?\n• What does the project SRS say about [feature]?\n• What are my upcoming deadlines?\n• What is my team working on right now?",
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Manager state
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");

  // Employee state
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");

  useEffect(() => {
    if (isManager) {
      projectsApi.list().then((ps: Project[]) => {
        setProjects(ps);
        if (ps.length > 0) setSelectedProjectId(ps[0].id);
      }).catch(console.error);
    } else {
      teamsApi.myTeams().then((ts: Team[]) => {
        setTeams(ts);
        if (ts.length > 0) setSelectedTeamId(ts[0].id);
      }).catch(console.error);
    }
  }, [isManager]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const canSend = isManager ? !!selectedProjectId : !!selectedTeamId;

  const handleSend = async () => {
    if (!input.trim() || !canSend || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setElapsedSecs(0);
    elapsedRef.current = setInterval(() => setElapsedSecs((s) => s + 1), 1000);

    try {
      const payload = isManager
        ? { question: userMessage.content, project_id: selectedProjectId }
        : { question: userMessage.content, team_id: selectedTeamId };

      const response = await aiApi.chat(payload);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response.answer,
          timestamp: new Date(),
        },
      ]);
    } catch (err: any) {
      const isTimeout = err?.code === "ECONNABORTED" || err?.message?.includes("timeout");
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: isTimeout
            ? "⏱️ The AI is taking too long to respond. Ollama may be loading the model. Please try again."
            : `Sorry, I encountered an error: ${err?.response?.data?.detail || "Please make sure Ollama is running."}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setElapsedSecs(0);
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const managerSuggestions = [
    "What teams are assigned to this project?",
    "Which team had the best efficiency recently?",
    "Summarize the project requirements",
    "What are the pending tasks across all teams?",
    "What are the AI estimated budget and timeline?",
    "Which team has the most critical tasks?",
  ];

  const employeeSuggestions = [
    "What are my pending tasks?",
    "Summarize the last team meeting",
    "What are my upcoming deadlines?",
    "What is the team working on right now?",
    "What does the SRS say about the authentication module?",
    "What was decided in our last meeting?",
  ];

  const suggestions = isManager ? managerSuggestions : employeeSuggestions;

  return (
    <DashboardLayout
      title="AI Assistant"
      subtitle={isManager ? "Strategic project intelligence for managers" : "Your personal work assistant"}
    >
      <div style={{ display: "flex", gap: 20, height: "calc(100vh - var(--topbar-height) - 120px)" }}>

        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <div style={{ width: 270, flexShrink: 0, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Context selector */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              {isManager
                ? <FolderOpen size={15} style={{ color: "var(--accent)" }} />
                : <Users size={15} style={{ color: "var(--accent)" }} />}
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {isManager ? "Select Project" : "Select Team"}
              </span>
            </div>

            {isManager ? (
              <select
                className="form-input"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
                {projects.length === 0 && <option value="">No projects available</option>}
              </select>
            ) : (
              <select
                className="form-input"
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
                {teams.length === 0 && <option value="">No teams available</option>}
              </select>
            )}

            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.5 }}>
              {isManager
                ? "AI will retrieve data from all teams assigned to this project."
                : "AI will use your team's meetings and your personal tasks."}
            </p>

            {/* Role badge */}
            <div style={{
              marginTop: 12, padding: "6px 10px", borderRadius: 8,
              background: isManager ? "rgba(99,102,241,0.1)" : "rgba(16,185,129,0.1)",
              border: `1px solid ${isManager ? "rgba(99,102,241,0.25)" : "rgba(16,185,129,0.25)"}`,
              fontSize: 11, fontWeight: 600, textAlign: "center",
              color: isManager ? "#818cf8" : "#34d399",
            }}>
              {isManager ? "📊 Manager View — Cross-team insights" : "👤 Personal View — Your tasks & team meetings"}
            </div>
          </div>

          {/* Suggested questions */}
          <div className="card" style={{ padding: 16, flex: 1, overflowY: "auto" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Try asking
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {suggestions.map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  style={{
                    background: "rgba(99,102,241,0.05)",
                    border: "1px solid rgba(99,102,241,0.15)",
                    borderRadius: 8, padding: "8px 12px",
                    textAlign: "left", cursor: "pointer",
                    fontSize: 12, color: "var(--text-secondary)",
                    transition: "all 0.2s", fontFamily: "inherit",
                    lineHeight: 1.4,
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)")}
                  onMouseOut={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.15)")}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Chat Area ───────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }} className="card">

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: "flex", gap: 12,
                  flexDirection: msg.role === "user" ? "row-reverse" : "row",
                  alignItems: "flex-start",
                }}
                className="animate-fade-in"
              >
                {/* Avatar */}
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                  background: msg.role === "assistant"
                    ? "linear-gradient(135deg, var(--accent), var(--violet))"
                    : "rgba(255,255,255,0.1)",
                  border: "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white",
                }}>
                  {msg.role === "assistant" ? <Sparkles size={14} /> : <User size={14} />}
                </div>

                {/* Bubble */}
                {msg.role === "user" ? (
                  <div
                    className="chat-message-user"
                    style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, fontSize: 13.5, maxWidth: "75%" }}
                  >
                    {msg.content}
                  </div>
                ) : (
                  <Markdown
                    content={msg.content}
                    className="chat-message-ai"
                    style={{ maxWidth: "75%" }}
                  />
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--accent), var(--violet))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Sparkles size={14} style={{ color: "white" }} />
                </div>
                <div className="chat-message-ai" style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px 18px" }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {[0, 1, 2].map((i) => (
                      <div key={i} style={{
                        width: 7, height: 7, borderRadius: "50%",
                        background: "var(--accent)",
                        animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                      }} />
                    ))}
                  </div>
                  {elapsedSecs > 3 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-muted)" }}>
                      <Clock size={11} />
                      Thinking... {elapsedSecs}s
                      {elapsedSecs > 30 && " (Ollama may be loading the model)"}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  !canSend
                    ? isManager ? "Select a project first..." : "Select a team first..."
                    : isManager
                      ? "Ask about your project, teams, or tasks..."
                      : "Ask about your tasks, meetings, or project..."
                }
                disabled={!canSend || isLoading}
                className="form-input"
                style={{ flex: 1, resize: "none", minHeight: 44, maxHeight: 120 }}
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || !canSend || isLoading}
                className="btn btn-primary"
                style={{ height: 44, paddingLeft: 16, paddingRight: 16, flexShrink: 0 }}
              >
                {isLoading ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
              Enter to send · Shift+Enter for new line · Powered by{" "}
              <span style={{ color: "var(--accent)" }}>Qwen3 8B via Ollama</span>
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
