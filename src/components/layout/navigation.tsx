
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ListMusic, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react"; // Import useState and useEffect

const navItemsBase = [
  { href: "/nations", label: "Nazioni", icon: ListMusic },
  { href: "/teams", label: "Squadre", icon: Users },
];

export function Navigation() {
  const pathname = usePathname();
  const { user, isLoading: authIsLoading } = useAuth();
  const [hasMounted, setHasMounted] = useState(false); // New state for ensuring client-side mount

  useEffect(() => {
    setHasMounted(true); // Set to true after component mounts on client
  }, []);

  // Consistent loading skeleton for server render and initial client render before mount
  const loadingSkeleton = (
    <nav className="flex items-center space-x-2 sm:space-x-4 lg:space-x-6 mx-auto sm:mx-6">
        {navItemsBase.map((item) => (
             <span
               key={item.href}
               className="text-sm font-medium text-foreground/30 animate-pulse flex items-center p-2 sm:p-0 sm:gap-1.5 rounded-md sm:rounded-none"
               aria-label={item.label}
             >
                <item.icon className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{item.label}</span>
             </span>
        ))}
    </nav>
  );

  if (!hasMounted) {
    return loadingSkeleton; // Render loading skeleton until client has mounted
  }

  if (authIsLoading) {
    return loadingSkeleton; // Render loading skeleton if auth is still loading after mount
  }

  // If mounted and not loading auth, render the actual navigation
  let currentNavItems = [...navItemsBase];
  // User-specific items logic (if any) would go here

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
