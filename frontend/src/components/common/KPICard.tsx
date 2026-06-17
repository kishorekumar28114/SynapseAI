import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "../../lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: number; // positive = up, negative = down
  color?: "accent" | "green" | "orange" | "red" | "cyan";
  className?: string;
}

const colorMap: Record<string, { bg: string; icon: string; glow: string }> = {
  accent: {
    bg: "rgba(99,102,241,0.12)",
    icon: "#818cf8",
    glow: "rgba(99,102,241,0.2)",
  },
  green: {
    bg: "rgba(16,185,129,0.12)",
    icon: "#34d399",
    glow: "rgba(16,185,129,0.2)",
  },
  orange: {
    bg: "rgba(245,158,11,0.12)",
    icon: "#fbbf24",
    glow: "rgba(245,158,11,0.2)",
  },
  red: {
    bg: "rgba(239,68,68,0.12)",
    icon: "#f87171",
    glow: "rgba(239,68,68,0.2)",
  },
  cyan: {
    bg: "rgba(6,182,212,0.12)",
    icon: "#22d3ee",
    glow: "rgba(6,182,212,0.2)",
  },
};

export function KPICard({ title, value, subtitle, icon, trend, color = "accent", className }: KPICardProps) {
  const colors = colorMap[color];

  return (
    <div className={cn("kpi-card animate-fade-in", className)}>
      {/* Icon */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: colors.bg,
          border: `1px solid ${colors.glow}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: colors.icon,
          marginBottom: 16,
          boxShadow: `0 0 16px ${colors.glow}`,
        }}
      >
        {icon}
      </div>

      {/* Value */}
      <div style={{ fontSize: 32, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1, marginBottom: 6 }}>
        {value}
      </div>

      {/* Title */}
      <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>{title}</div>

      {/* Trend & Subtitle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
        {subtitle && (
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{subtitle}</span>
        )}
        {trend !== undefined && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              fontSize: 12,
              fontWeight: 600,
              color: trend >= 0 ? "#34d399" : "#f87171",
            }}
          >
            {trend >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );
}
