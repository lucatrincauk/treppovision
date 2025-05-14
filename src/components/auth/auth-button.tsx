
"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogIn, LogOut, UserCircle } from "lucide-react";

export function AuthButton() {
  const { user, login, logout, isLoading } = useAuth();

  if (isLoading) {
    return <Button variant="outline" size="sm" disabled>Caricamento...</Button>;
  }

  if (user) {
    const userInitial = user.displayName ? user.displayName.substring(0, 2).toUpperCase() : (user.email ? user.email.substring(0,2).toUpperCase() : "U");
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || "User Avatar"} />}
              <AvatarFallback>{userInitial}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.displayName || "Utente"}</p>
              {user.email && (
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {/* Placeholder for future admin-specific actions or profile page */}
          {/* <DropdownMenuItem>
            <UserCircle className="mr-2 h-4 w-4" />
            Profilo
          </DropdownMenuItem> */}
          <DropdownMenuItem onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Esci
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={login} disabled={isLoading}>
      <LogIn className="mr-2 h-4 w-4" />
      Accedi con Google
    </Button>
  );
}
