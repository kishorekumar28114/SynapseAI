import { Sidebar } from "../components/common/Sidebar";
import { TopBar } from "../components/common/TopBar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }} className="gradient-mesh">
      <Sidebar />
      <div className="main-content">
        <TopBar title={title} subtitle={subtitle} />
        <main className="page-content animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
