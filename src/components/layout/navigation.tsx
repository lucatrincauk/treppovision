
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ListMusic, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const navItemsBase = [
  { href: "/nations", label: "Nazioni", icon: ListMusic },
  { href: "/teams", label: "Squadre", icon: Users },
];

// const navItemsAuth = [
// No auth-specific items moved to base in previous iterations
// ];


export function Navigation() {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  let currentNavItems = [...navItemsBase];
  // if (user) {
    // currentNavItems = [...currentNavItems, ...navItemsAuth];
  // }
  
  if (isLoading) { 
    return (
        <nav className="flex items-center space-x-2 sm:space-x-4 lg:space-x-6 mx-auto sm:mx-6"> {/* Adjusted spacing for mobile */}
            {navItemsBase.map((item) => (
                 <span 
                   key={item.href} 
                   className="text-sm font-medium text-foreground/30 animate-pulse flex items-center p-2 sm:p-0 sm:gap-1.5 rounded-md sm:rounded-none"
                   aria-label={item.label}
                 >
                    <item.icon className="h-5 w-5 sm:h-4 sm:w-4" /> {/* Icon size adjusted */}
                    <span className="hidden sm:inline">{item.label}</span>
                 </span>
            ))}
        </nav>
    );
  }

  return (
    <nav className="flex items-center space-x-2 sm:space-x-4 lg:space-x-6 mx-auto sm:mx-6"> {/* Adjusted spacing and centering for mobile */}
      {currentNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary flex items-center p-2 sm:p-0 sm:gap-1.5 rounded-md sm:rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            (item.href === "/teams" ? pathname === item.href || pathname.startsWith("/teams/") : pathname.startsWith(item.href)) 
              ? "text-primary sm:bg-transparent bg-primary/10" // Slight bg for active mobile icon
              : "text-foreground/60"
          )}
          aria-label={item.label} // For accessibility
        >
          <item.icon className="h-5 w-5 sm:h-4 sm:w-4" /> {/* Icon size adjusted */}
          <span className="hidden sm:inline">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
