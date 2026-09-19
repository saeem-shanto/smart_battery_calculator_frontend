"use client";

import { ExternalLink, LayoutDashboard, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { DebugPanel } from "@/components/DebugPanel";

export function AdminShell({children,onLogout,active="records"}:{children:React.ReactNode;onLogout:()=>void;active?:"records"|"profile"}){
  return <div className="app-frame admin-frame">
    <aside className="sidebar admin-sidebar">
      <BrandLogo/>
      <div className="admin-badge"><ShieldCheck size={17}/> Administrator</div>
      <div className="sidebar-divider"/>
      <nav className="sidebar-nav" aria-label="Admin navigation">
        <a href="/admin" className={`nav-item ${active==="records"?"active":""}`}><LayoutDashboard size={21}/><span>Calculation Records</span></a>
        <a href="/admin/profile" className={`nav-item ${active==="profile"?"active":""}`}><UserRound size={21}/><span>Admin Profile</span></a>
        <a href="/dashboard" className="nav-item"><ExternalLink size={21}/><span>User Website</span></a>
      </nav>
      <button className="nav-item admin-logout" onClick={onLogout}><LogOut size={21}/><span>Log Out</span></button>
      <div className="sidebar-tip"><ShieldCheck size={20}/><span>Authenticated administration for calculation records, stored inputs and result CSV files.</span></div>
    </aside>
    <main className="main-content admin-main">{children}</main>
    <DebugPanel/>
  </div>;
}
