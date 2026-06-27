import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Loader, Sparkles } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../contexts/AuthContext";
import { APP_NAME } from "../../lib/constants";
import api from "../../api/axios";

export default function Login() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginMode, setLoginMode] = useState<"manager" | "employee">("manager");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login(identifier, password);
      navigate("/dashboard");
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { detail?: string } } };
      setError(apiError.response?.data?.detail || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Google Login using the access-token flow → exchange with backend
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsGoogleLoading(true);
      setError("");
      try {
        // Get user info from Google using access token
        const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await userInfoRes.json();

        // Get an ID token by exchanging with our backend's Google endpoint
        // We send the access_token; the backend uses Google tokeninfo endpoint
        const res = await api.post("/auth/google", {
          credential: tokenResponse.access_token,
          access_token: tokenResponse.access_token,
        });

        const data = res.data;
        localStorage.setItem("synapseai_token", data.access_token);
        localStorage.setItem("synapseai_user", JSON.stringify(data.user));
        navigate("/dashboard");
        window.location.reload(); // refresh auth context from localStorage
      } catch (err: unknown) {
        const apiError = err as { response?: { data?: { detail?: string } } };
        setError(apiError.response?.data?.detail || "Google login failed. Please try again.");
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: () => {
      setError("Google sign-in was cancelled or failed.");
    },
    flow: "implicit",
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Animated background orbs */}
      <div style={{
        position: "fixed", top: "8%", left: "3%", width: 500, height: 500,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%)",
        filter: "blur(60px)", pointerEvents: "none", zIndex: 0,
        animation: "pulse 8s ease-in-out infinite",
      }} />
      <div style={{
        position: "fixed", bottom: "8%", right: "5%", width: 380, height: 380,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(139,92,246,0.1), transparent 70%)",
        filter: "blur(60px)", pointerEvents: "none", zIndex: 0,
        animation: "pulse 6s ease-in-out 2s infinite",
      }} />

      <div className="w-full max-w-[420px] p-8 bg-card rounded-2xl shadow-2xl border border-border/50 animate-fade-in relative z-10 m-4">
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
            boxShadow: "0 0 32px rgba(99,102,241,0.5)",
          }}>
            <Sparkles size={24} color="white" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px" }} className="gradient-text-animate">
            {APP_NAME}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 6 }}>
            Smart Meeting Intelligence Platform
          </p>
        </div>

        {/* Mode Toggle */}
        <div style={{
          display: "flex", background: "rgba(255,255,255,0.04)",
          borderRadius: "var(--radius-sm)", padding: 4, marginBottom: 24,
          border: "1px solid var(--border)",
        }}>
          {(["manager", "employee"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => { setLoginMode(mode); setError(""); }}
              style={{
                flex: 1, padding: "8px 12px", borderRadius: 6,
                border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                transition: "all 0.2s ease", fontFamily: "inherit",
                background: loginMode === mode
                  ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                  : "transparent",
                color: loginMode === mode ? "white" : "var(--text-muted)",
                boxShadow: loginMode === mode ? "0 2px 12px rgba(99,102,241,0.3)" : "none",
              }}
            >
              {mode === "manager" ? "Manager" : "Team Member"}
            </button>
          ))}
        </div>

        {/* Google Button — Manager only */}
        {loginMode === "manager" && (
          <>
            <button
              onClick={() => handleGoogleLogin()}
              disabled={isGoogleLoading}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                gap: 10, padding: "11px 16px", borderRadius: "var(--radius-sm)",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.15)",
                cursor: "pointer", fontSize: 14, fontWeight: 600,
                color: "var(--text-primary)", transition: "all 0.2s ease",
                fontFamily: "inherit", marginBottom: 20,
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.25)";
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)";
              }}
            >
              {isGoogleLoading ? (
                <Loader size={16} className="animate-spin" />
              ) : (
                // Google "G" SVG logo
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
              )}
              {isGoogleLoading ? "Signing in with Google..." : "Continue with Google"}
            </button>

            <div className="flex items-center text-xs text-muted-foreground mb-5 uppercase tracking-wider font-semibold">
              <div className="flex-1 h-px bg-border"></div>
              <span className="px-3">or sign in with email</span>
              <div className="flex-1 h-px bg-border"></div>
            </div>
          </>
        )}

        <form onSubmit={handleSubmit}>
          {/* Error */}
          {error && (
            <div style={{
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: "var(--radius-sm)", padding: "10px 14px", marginBottom: 18,
              color: "#fca5a5", fontSize: 13, display: "flex", alignItems: "flex-start", gap: 8,
            }}>
              <span style={{ flexShrink: 0, marginTop: 1 }}>⚠</span>
              {error}
            </div>
          )}

          {/* Identifier */}
          <div style={{ marginBottom: 14 }}>
            <label className="block text-sm font-medium mb-1.5 text-foreground">
              {loginMode === "manager" ? "Email address" : "Username"}
            </label>
            <div style={{ position: "relative" }}>
              <div style={{
                position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                color: "var(--text-muted)", pointerEvents: "none",
              }}>
                {loginMode === "manager" ? <Mail size={15} /> : <User size={15} />}
              </div>
              <input
                id="identifier"
                type={loginMode === "manager" ? "email" : "text"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                style={{ paddingLeft: 38 }}
                placeholder={loginMode === "manager" ? "you@company.com" : "your.username"}
                required
                autoFocus
                autoComplete={loginMode === "manager" ? "email" : "username"}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 22 }}>
            <label className="block text-sm font-medium mb-1.5 text-foreground">Password</label>
            <div style={{ position: "relative" }}>
              <div style={{
                position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                color: "var(--text-muted)", pointerEvents: "none",
              }}>
                <Lock size={15} />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                style={{ paddingLeft: 38, paddingRight: 42 }}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--text-muted)", padding: 0, display: "flex",
                }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors disabled:opacity-50 disabled:pointer-events-none"
            style={{ height: 44 }}
            disabled={isLoading}
          >
            {isLoading ? (
              <><Loader size={15} className="animate-spin" /> Signing in...</>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Register Link — managers only */}
        {loginMode === "manager" && (
          <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", marginTop: 20 }}>
            New manager?{" "}
            <Link to="/register" style={{ color: "#818cf8", fontWeight: 600 }}>
              Create an account
            </Link>
          </p>
        )}

        {loginMode === "employee" && (
          <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", marginTop: 20 }}>
            Use the username and password provided by your manager.
          </p>
        )}
      </div>
    </div>
  );
}
