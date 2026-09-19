"use client";

import { useEffect, useState } from "react";
import { Bug, ChevronDown, ChevronUp, RefreshCcw } from "lucide-react";
import { usePathname } from "next/navigation";
import { getCurrentUser } from "@/lib/account-api";
import { getHealth, getReadiness } from "@/lib/api";

type DebugState = {
  health: string;
  ready: string;
  engine: string;
  user: string;
};

export function DebugPanel() {
  const pathname = usePathname();
  const enabled = process.env.NEXT_PUBLIC_APP_DEBUG === "true";
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<DebugState>({ health: "checking", ready: "checking", engine: "—", user: "checking" });

  async function refresh() {
    const [health, ready, user] = await Promise.allSettled([getHealth(), getReadiness(), getCurrentUser()]);
    setState({
      health: health.status === "fulfilled" ? health.value.status : "offline",
      ready: ready.status === "fulfilled" ? ready.value.status : "unavailable",
      engine: ready.status === "fulfilled" ? (ready.value.engine?.octave_version || (ready.value.engine?.ready ? "ready" : "not ready")) : "—",
      user: user.status === "fulfilled" && user.value ? `@${user.value.username}` : "guest",
    });
  }

  useEffect(() => { if (enabled) void refresh(); }, [enabled, pathname]);
  if (!enabled) return null;

  return (
    <aside className={`debug-panel ${open ? "open" : ""}`} aria-label="Frontend debug panel">
      <button className="debug-panel-toggle" type="button" onClick={()=>setOpen((value)=>!value)}>
        <Bug size={16}/><span>DEBUG</span>{open?<ChevronDown size={15}/>:<ChevronUp size={15}/>} 
      </button>
      {open && <div className="debug-panel-body">
        <div><span>Version</span><strong>{process.env.NEXT_PUBLIC_APP_VERSION || "dev"}</strong></div>
        <div><span>Mode</span><strong>{process.env.NODE_ENV}</strong></div>
        <div><span>Route</span><strong>{pathname}</strong></div>
        <div><span>Health</span><strong>{state.health}</strong></div>
        <div><span>Readiness</span><strong>{state.ready}</strong></div>
        <div><span>Session</span><strong>{state.user}</strong></div>
        <div><span>Engine</span><strong>{state.engine}</strong></div>
        <button className="debug-refresh" type="button" onClick={refresh}><RefreshCcw size={14}/> Refresh</button>
      </div>}
    </aside>
  );
}
