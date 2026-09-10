"use client";

import { ExternalLink, LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

export function AdminShell({ children, onLogout }: { children: React.ReactNode; onLogout: () => void }) {
  return (
    <div className="app-frame admin-frame">
      <aside className="sidebar admin-sidebar">
        <BrandLogo />
        <div className="admin-badge"><ShieldCheck size={17} /> Administrator</div>
        <div className="sidebar-divider" />
        <nav className="sidebar-nav" aria-label="Admin navigation">
          <a href="/admin" className="nav-item active"><LayoutDashboard size={21} strokeWidth={1.8} /><span>Overview</span></a>
          <a href="/dashboard" className="nav-item"><ExternalLink size={21} strokeWidth={1.8} /><span>User Website</span></a>
        </nav>
        <button className="nav-item admin-logout" onClick={onLogout}><LogOut size={21} strokeWidth={1.8} /><span>Log Out</span></button>
        <div className="sidebar-tip"><ShieldCheck size={20} /><span>Demo admin area. Authentication and data are local prototype features only.</span></div>
      </aside>
      <main className="main-content admin-main">{children}</main>
    </div>
  );
}
