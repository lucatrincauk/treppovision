
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ListMusic, BarChart3, Users } from "lucide-react"; // Added Users icon
import { useAuth } from "@/hooks/use-auth";

const navItemsBase = [
  { href: "/nations", label: "Nazioni", icon: ListMusic },
  { href: "/charts", label: "Grafici", icon: BarChart3 },
];

const navItemsAuth = [
  { href: "/teams/new", label: "Crea Team", icon: Users }, // For now, points to new, will be /teams later
];


export function Navigation() {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  let currentNavItems = [...navItemsBase];
  if (user) {
    currentNavItems = [...currentNavItems, ...navItemsAuth];
  }
  
  if (isLoading) { // Optional: render a placeholder or nothing while loading auth state
    return (
        <nav className="flex items-center space-x-4 lg:space-x-6 mx-6">
            {navItemsBase.map((item) => (
                 <span key={item.href} className="text-sm font-medium text-foreground/30 animate-pulse">
                    <item.icon className="inline-block h-4 w-4 mr-1.5 mb-0.5" />
                    {item.label}
                 </span>
            ))}
             <span className="text-sm font-medium text-foreground/30 animate-pulse">
                <Users className="inline-block h-4 w-4 mr-1.5 mb-0.5" />
                Teams
             </span>
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
            pathname.startsWith(item.href) // Use startsWith for parent path matching
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
