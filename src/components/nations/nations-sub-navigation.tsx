
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ListMusic, Award, TrendingUp } from "lucide-react"; 

const subNavItems = [
  { href: "/nations", label: "Elenco Completo", icon: ListMusic },
  { href: "/nations/ranking", label: "Classifica Finale", icon: Award },
  { href: "/nations/trepposcore-ranking", label: "Classifica TreppoScore", icon: TrendingUp },
];

export function NationsSubNavigation() {
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
          <span className="sm:hidden">{
            item.href === "/nations" ? "Elenco" : 
            item.href === "/nations/ranking" ? "Finale" : "TreppoScore"
          }</span>
        </Link>
      ))}
    </nav>
  );
}
