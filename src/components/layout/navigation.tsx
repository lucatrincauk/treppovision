
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ListMusic, BarChart3, Users } from "lucide-react"; // Users icon for Teams
import { useAuth } from "@/hooks/use-auth";

const navItemsBase = [
  { href: "/nations", label: "Nazioni", icon: ListMusic },
  { href: "/charts", label: "Grafici", icon: BarChart3 },
  { href: "/teams", label: "Squadre", icon: Users }, // Moved Teams here
];

const navItemsAuth = [
  // No items here for now, Teams moved to base
];


export function Navigation() {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  let currentNavItems = [...navItemsBase];
  if (user) {
    // If there were other auth-specific links, they would be added here
    // currentNavItems = [...currentNavItems, ...navItemsAuth];
  }
  
  if (isLoading) { 
    return (
        <nav className="flex items-center space-x-4 lg:space-x-6 mx-6">
            {navItemsBase.map((item) => ( // Always render base items during loading
                 <span key={item.href} className="text-sm font-medium text-foreground/30 animate-pulse">
                    <item.icon className="inline-block h-4 w-4 mr-1.5 mb-0.5" />
                    {item.label}
                 </span>
            ))}
             {/* Placeholder for any auth items if they existed and were loading 
             <span className="text-sm font-medium text-foreground/30 animate-pulse">
                <SomeAuthIcon className="inline-block h-4 w-4 mr-1.5 mb-0.5" />
                Auth Item
             </span>
             */}
        </nav>
    );
  }

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6 mx-6">
      {currentNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            // Updated path matching: exact for /teams, startsWith for others like /nations or /teams/new
            (item.href === "/teams" ? pathname === item.href || pathname.startsWith("/teams/") : pathname.startsWith(item.href)) 
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
