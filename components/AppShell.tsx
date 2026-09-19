import { Sidebar } from "./Sidebar";
import { DebugPanel } from "./DebugPanel";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-frame">
      <Sidebar />
      <main className="main-content">{children}</main>
      <DebugPanel />
    </div>
  );
}
