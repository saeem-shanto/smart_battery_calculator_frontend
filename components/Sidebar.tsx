"use client";

import { usePathname } from "next/navigation";
import { CircleHelp, CirclePlus, Clock3, Folder, Home, Info, LibraryBig, Leaf, ShieldCheck } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { clearDraft } from "@/lib/draft";

const items = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "New Calculation", href: "/calculator/load-solar", icon: CirclePlus },
  { label: "Saved Scenarios", href: "/saved-scenarios", icon: Folder },
  { label: "Results History", href: "/results-history", icon: Clock3 },
  { label: "Tariff Library", href: "/tariff-library", icon: LibraryBig },
  { label: "Help", href: "/help", icon: CircleHelp },
  { label: "About", href: "/about", icon: Info },
  { label: "Admin Portal", href: "/admin/login", icon: ShieldCheck },
];

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => href === "/calculator/load-solar"
    ? pathname.startsWith("/calculator/")
    : pathname === href;

  return (
    <aside className="sidebar">
      <BrandLogo />
      <div className="sidebar-divider" />
      <nav className="sidebar-nav" aria-label="Main navigation">
        {items.map(({ label, href, icon: Icon }) => (
          <a
            href={href}
            className={`nav-item ${isActive(href) ? "active" : ""}`}
            key={label}
            onClick={() => { if (href === "/calculator/load-solar") clearDraft(); }}
          >
            <Icon size={21} strokeWidth={1.8} /><span>{label}</span>
          </a>
        ))}
      </nav>
      <div className="sidebar-tip"><Leaf size={20} /><span>Make smarter energy decisions and save on electricity bills.</span></div>
    </aside>
  );
}
