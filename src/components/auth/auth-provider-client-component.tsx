
"use client";

import { useAuth } from "@/hooks/use-auth";
import type { User } from "@/types";
import type { ReactNode } from "react";

interface AuthProviderClientComponentProps {
  children: (user: User | null, isLoading: boolean) => ReactNode;
}

export function AuthProviderClientComponent({ children }: AuthProviderClientComponentProps) {
  const { user, isLoading } = useAuth();
  return <>{children(user, isLoading)}</>;
}
