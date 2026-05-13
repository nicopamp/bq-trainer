"use client";

import Link from "next/link";
import { Icon } from "./Icon";

type NavKey = "home" | "drill" | "progress" | "settings";

interface BottomNavProps {
  active: NavKey;
  bookName?: string;
}

export function BottomNav({ active, bookName = "Acts" }: BottomNavProps) {
  const NAV_ITEMS: { key: NavKey; href: string; icon: string; label: string }[] = [
    { key: "home",     href: "/home",     icon: "book",     label: bookName },
    { key: "drill",    href: "/drill",    icon: "spark",    label: "Drill" },
    { key: "progress", href: "/progress", icon: "waveform", label: "Progress" },
    { key: "settings", href: "/settings", icon: "tune",     label: "Settings" },
  ];
  return (
    <nav className="bottom-bar" style={{ height: 76, paddingBottom: 18, display: "flex" }}>
      {NAV_ITEMS.map(({ key, href, icon, label }) => {
        const isActive = key === active;
        return (
          <Link key={key} href={href} style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            color: isActive ? "var(--ink)" : "var(--ink-muted)",
            textDecoration: "none",
          }}>
            <Icon name={icon} size={20} color={isActive ? "var(--ink)" : "var(--ink-muted)"} strokeWidth={isActive ? 1.8 : 1.4} />
            <span style={{ fontSize: 10.5, fontWeight: isActive ? 600 : 500 }}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
