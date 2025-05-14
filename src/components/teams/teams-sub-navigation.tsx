
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Users, BarChartBig } from "lucide-react"; // Changed ListChecks to BarChart3

const subNavItems = [
  { href: "/teams", label: "Elenco Squadre", icon: Users },
  { href: "/teams/leaderboard", label: "Classifica Squadre", icon: BarChartBig },
];

export function TeamsSubNavigation() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 flex items-center justify-center space-x-1 rounded-md bg-muted p-1 sm:space-x-2">
      {subNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
            pathname === item.href
              ? "bg-background text-primary shadow-sm"
              : "text-muted-foreground hover:bg-background/50 hover:text-primary"
          )}
        >
          <item.icon className="h-4 w-4" />
          <span className="hidden sm:inline">{item.label}</span>
          <span className="sm:hidden">{item.href === "/teams" ? "Elenco" : "Classifica"}</span>
        </Link>
      ))}
    </nav>
  );
}
