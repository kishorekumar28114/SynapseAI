import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Loader, Sparkles, Clock } from "lucide-react";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { aiApi, teamsApi } from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import type { ChatMessage, Team } from "../../types";
import { formatRelativeTime } from "../../lib/utils";

export default function AIAssistant() {
  const { user } = useAuth();
  const isManager = user?.role === "manager";
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm SynapseAI, your intelligent meeting assistant. I can help you with:\n\n• Finding action items and deadlines\n• Summarizing past meetings\n• Answering questions about your projects\n• Analyzing team productivity\n\nSelect a team below and start chatting!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchTeams = isManager ? teamsApi.list : teamsApi.myTeams;
    fetchTeams().then((t) => {
      setTeams(t);
      if (t.length > 0) setSelectedTeamId(t[0].id);
    });
  }, [isManager]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !selectedTeamId || isLoading) return;

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
      const response = await aiApi.chat(userMessage.content, selectedTeamId);
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.answer,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      const isTimeout = err?.code === "ECONNABORTED" || err?.message?.includes("timeout");
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: isTimeout
            ? "⏱️ The AI is taking too long to respond. Ollama may be loading the model for the first time (this can take 1–2 minutes). Please try again."
            : "Sorry, I encountered an error. Please make sure Ollama is running and try again.",
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

  const suggestedQuestions = [
    "What are the pending action items?",
    "Summarize the last meeting",
    "Which tasks have upcoming deadlines?",
    "What is the overall team sentiment?",
  ];

  return (
    <DashboardLayout title="AI Assistant" subtitle="Chat with SynapseAI about your meetings and projects">
      <div style={{ display: "flex", gap: 20, height: "calc(100vh - var(--topbar-height) - 120px)" }}>
        {/* Sidebar: Team selector + suggestions */}
        <div style={{ width: 260, flexShrink: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Team selector */}
          <div className="card" style={{ padding: "16px" }}>
            <label className="form-label" style={{ marginBottom: 8 }}>Context Team</label>
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
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
              AI responses will use this team's meeting and project data.
            </p>
          </div>

          {/* Suggested questions */}
          <div className="card" style={{ padding: "16px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Suggested
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  style={{
                    background: "rgba(99,102,241,0.05)",
                    border: "1px solid rgba(99,102,241,0.15)",
                    borderRadius: 8,
                    padding: "8px 12px",
                    textAlign: "left",
                    cursor: "pointer",
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    transition: "all 0.2s",
                    fontFamily: "inherit",
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

        {/* Chat Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }} className="card">
          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  gap: 12,
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
                  fontSize: 14, color: "white",
                }}>
                  {msg.role === "assistant" ? <Sparkles size={14} /> : <User size={14} />}
                </div>

                {/* Bubble */}
                <div
                  className={msg.role === "user" ? "chat-message-user" : "chat-message-ai"}
                  style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, fontSize: 13.5 }}
                >
                  {msg.content}
                </div>
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
                        background: "var(--accent)", animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`
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
                placeholder={selectedTeamId ? "Ask anything about your meetings..." : "Select a team first..."}
                disabled={!selectedTeamId || isLoading}
                className="form-input"
                style={{ flex: 1, resize: "none", minHeight: 44, maxHeight: 120 }}
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || !selectedTeamId || isLoading}
                className="btn btn-primary"
                style={{ height: 44, paddingLeft: 16, paddingRight: 16, flexShrink: 0 }}
              >
                {isLoading ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
              Press Enter to send · Shift+Enter for new line · Powered by {" "}
              <span style={{ color: "var(--accent)" }}>Qwen3 8B via Ollama</span>
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
