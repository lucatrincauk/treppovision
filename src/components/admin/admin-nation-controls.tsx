
"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";

interface AdminNationControlsProps {
  children: ReactNode;
  nationId: string | null; // null for general controls like "Add New", or nationId for specific nation controls
}

export function AdminNationControls({ children, nationId }: AdminNationControlsProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    // Optionally, render a loader or null while auth state is resolving
    return null; 
  }

  if (user?.isAdmin) {
    return <>{children}</>;
  }

  return null;
}
