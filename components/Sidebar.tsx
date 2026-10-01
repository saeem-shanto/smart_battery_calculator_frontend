"use client";
import type { MouseEvent } from "react";
import { usePathname } from "next/navigation";
import { CircleHelp, CirclePlus, Clock3, Home, Info, LibraryBig, Leaf, ShieldCheck } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { UserAccountWidget } from "./UserAccountWidget";
import { clearDraft } from "@/lib/draft";
import { clearDraftFile } from "@/lib/file-store";
import { clearCachedTransientResult } from "@/lib/transient-result-cache";

const items = [
  { label: "Home", href: "/", icon: Home },
  { label: "New Calculation", href: "/calculator/load-solar", icon: CirclePlus },
  { label: "My Calculations", href: "/results-history", icon: Clock3 },
  { label: "Tariff Library", href: "/tariff-library", icon: LibraryBig },
  { label: "Help", href: "/help", icon: CircleHelp },
  { label: "About", href: "/about", icon: Info },
  { label: "Admin Portal", href: "/admin/login", icon: ShieldCheck },
];
export function Sidebar() {
  const pathname=usePathname();
  const active=(href:string)=>href==="/calculator/load-solar"?pathname.startsWith("/calculator/"):pathname===href;

  async function navigate(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (href !== "/calculator/load-solar") return;
    event.preventDefault();
    clearDraft();
    clearCachedTransientResult();
    await clearDraftFile().catch(() => undefined);
    window.location.assign(href);
  }

  return <aside className="sidebar"><BrandLogo/><div className="sidebar-divider"/><nav className="sidebar-nav" aria-label="Main navigation">{items.map(({label,href,icon:Icon})=><a href={href} className={`nav-item ${active(href)?"active":""}`} key={label} aria-current={active(href) ? "page" : undefined} onClick={(event)=>void navigate(event,href)}><Icon size={21} strokeWidth={1.8}/><span>{label}</span></a>)}</nav><UserAccountWidget/><div className="sidebar-tip"><Leaf size={20}/><span>Research calculator using the client-provided battery optimisation model.</span></div></aside>;
}
