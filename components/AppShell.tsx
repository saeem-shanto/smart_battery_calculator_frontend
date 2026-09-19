import { Sidebar } from "./Sidebar";
import { DebugPanel } from "./DebugPanel";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-frame">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <Sidebar />
      <main id="main-content" className="main-content" tabIndex={-1}>{children}</main>
      <DebugPanel />
    </div>
  );
}
