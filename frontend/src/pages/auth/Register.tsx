import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Loader, UserCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { APP_NAME } from "../../lib/constants";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    username: "",
    password: "",
    confirm_password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    try {
      await register({
        full_name: form.full_name,
        email: form.email,
        username: form.username,
        password: form.password,
      });
      navigate("/dashboard");
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { detail?: string } } };
      setError(apiError.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fields = [
    { name: "full_name", label: "Full Name", type: "text", placeholder: "John Smith", icon: <UserCircle size={15} /> },
    { name: "email", label: "Email Address", type: "email", placeholder: "john@company.com", icon: <Mail size={15} /> },
    { name: "username", label: "Username", type: "text", placeholder: "john.smith", icon: <User size={15} /> },
  ];

  return (
    <div className="auth-page">
      <div style={{
        position: "fixed", top: "10%", right: "10%", width: 400, height: 400,
        borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.1), transparent)",
        filter: "blur(40px)", pointerEvents: "none"
      }} />

      <div className="auth-card animate-fade-in" style={{ maxWidth: 480 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: "linear-gradient(135deg, var(--accent), var(--violet))",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px", fontSize: 22, fontWeight: 800, color: "white",
            boxShadow: "0 0 24px rgba(99,102,241,0.4)"
          }}>
            S
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }} className="gradient-text">Create Manager Account</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 6 }}>
            Set up your {APP_NAME} workspace
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "var(--radius-sm)", padding: "10px 14px", marginBottom: 20,
              color: "#f87171", fontSize: 13
            }}>
              {error}
            </div>
          )}

          {/* Text Fields */}
          {fields.map((field) => (
            <div key={field.name} style={{ marginBottom: 16 }}>
              <label className="form-label">{field.label}</label>
              <div style={{ position: "relative" }}>
                <div style={{
                  position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                  color: "var(--text-muted)"
                }}>
                  {field.icon}
                </div>
                <input
                  id={field.name}
                  name={field.name}
                  type={field.type}
                  value={form[field.name as keyof typeof form]}
                  onChange={handleChange}
                  className="form-input"
                  style={{ paddingLeft: 36 }}
                  placeholder={field.placeholder}
                  required
                />
              </div>
            </div>
          ))}

          {/* Password */}
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">Password</label>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
                <Lock size={15} />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                className="form-input"
                style={{ paddingLeft: 36, paddingRight: 40 }}
                placeholder="Min 8 characters"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0, display: "flex" }}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: 24 }}>
            <label className="form-label">Confirm Password</label>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
                <Lock size={15} />
              </div>
              <input
                id="confirm_password"
                name="confirm_password"
                type={showPassword ? "text" : "password"}
                value={form.confirm_password}
                onChange={handleChange}
                className="form-input"
                style={{ paddingLeft: 36 }}
                placeholder="Repeat password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", height: 44, fontSize: 14 }}
            disabled={isLoading}
          >
            {isLoading ? (
              <><Loader size={15} className="animate-spin" /> Creating account...</>
            ) : (
              "Create Manager Account"
            )}
          </button>
        </form>

        <div className="divider" style={{ margin: "24px 0" }}>already have an account?</div>
        <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
          <Link to="/login" style={{ color: "var(--accent-hover)", fontWeight: 600 }}>
            Sign in instead
          </Link>
        </p>
      </div>
    </div>
  );
}
