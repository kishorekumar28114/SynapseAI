import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAI } from "@/contexts/AIContext";
import { X, Sparkles, AlertTriangle, Lightbulb, CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { aiApi } from "@/api";

export function AIPanel() {
  const { state, closePanel } = useAI();
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsTyping(true);

    try {
      const payload: any = { question: userMessage };
      if (state.contextType === "project") payload.project_id = state.contextId;
      if (state.contextType === "meeting") payload.meeting_id = state.contextId;

      const res = await aiApi.chat(payload);
      setMessages(prev => [...prev, { role: "assistant", content: res.answer }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <AnimatePresence>
      {state.isOpen && (
        <motion.aside
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 z-50 flex h-screen w-full md:w-[450px] flex-col border-l bg-background shadow-xl"
        >
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" />
              <h2 className="font-semibold">AI Analyst</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={closePanel}>
              <X className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-6 rounded-lg border bg-secondary/30 p-4">
              <p className="text-sm font-medium text-secondary-foreground">
                Current Context: <span className="capitalize text-primary">{state.contextType}</span>
              </p>
              {state.contextId && (
                <p className="text-xs text-muted-foreground mt-1">ID: {state.contextId}</p>
              )}
            </div>

            <div className="space-y-6">
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Lightbulb className="h-4 w-4 text-warning" />
                  Insights
                </h3>
                <div className="space-y-2">
                  <div className="rounded-md bg-card p-3 text-sm shadow-sm border">
                    Analyzing current view for automated insights...
                  </div>
                </div>
              </section>

              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Risks
                </h3>
                <div className="space-y-2">
                  <div className="rounded-md bg-card p-3 text-sm shadow-sm border">
                    No active risks detected in the current context.
                  </div>
                </div>
              </section>
              
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Recommendations
                </h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start text-left font-normal h-auto py-2 px-3" onClick={() => { setInputValue(`Summarize this ${state.contextType}`); }}>
                    Summarize this {state.contextType}
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-left font-normal h-auto py-2 px-3" onClick={() => { setInputValue("What are the key action items?"); }}>
                    Generate action items
                  </Button>
                </div>
              </section>
            </div>

            {messages.length > 0 && (
              <div className="mt-8 space-y-4 border-t pt-6">
                <h3 className="text-sm font-semibold text-muted-foreground">Chat History</h3>
                <div className="space-y-4">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-lg px-4 py-2 text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] rounded-lg px-4 py-3 bg-muted">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}
          </div>

          <div className="border-t p-4 bg-background/80 backdrop-blur-sm">
            <form onSubmit={handleSendMessage} className="relative flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask the AI Analyst..."
                className="w-full rounded-md border border-input bg-card px-4 py-2.5 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button type="submit" size="icon" className="h-[42px] w-[42px] shrink-0" disabled={!inputValue.trim() || isTyping}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
