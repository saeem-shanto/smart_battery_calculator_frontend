"use client";
import { usePathname } from "next/navigation";
import { CircleHelp, CirclePlus, Clock3, Home, Info, LibraryBig, Leaf, ShieldCheck } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { UserAccountWidget } from "./UserAccountWidget";
import { clearDraft } from "@/lib/draft";
import { clearDraftFile } from "@/lib/file-store";

const items = [
  { label: "Home", href: "/dashboard", icon: Home },
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
  return <aside className="sidebar"><BrandLogo/><div className="sidebar-divider"/><nav className="sidebar-nav" aria-label="Main navigation">{items.map(({label,href,icon:Icon})=><a href={href} className={`nav-item ${active(href)?"active":""}`} key={label} onClick={()=>{if(href==="/calculator/load-solar"){clearDraft();void clearDraftFile();}}}><Icon size={21} strokeWidth={1.8}/><span>{label}</span></a>)}</nav><UserAccountWidget/><div className="sidebar-tip"><Leaf size={20}/><span>Research decision-support tool using the client’s validated battery optimisation model.</span></div></aside>;
}
