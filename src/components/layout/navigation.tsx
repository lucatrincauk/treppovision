
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ListMusic, BarChart3 } from "lucide-react";

const navItems = [
  { href: "/nations", label: "Nazioni", icon: ListMusic },
  { href: "/charts", label: "Grafici", icon: BarChart3 },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6 mx-6">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === item.href
              ? "text-primary"
              : "text-foreground/60"
          )}
        >
          <item.icon className="inline-block h-4 w-4 mr-1.5 mb-0.5" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
