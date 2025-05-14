
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
import { LogIn, LogOut, UserCircle, ShieldCheck } from "lucide-react";

export function AuthButton() {
  const { user, login, logout, isLoading } = useAuth();

  if (isLoading) {
    return <Button variant="outline" size="sm" disabled>Caricamento...</Button>;
  }

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={`https://picsum.photos/seed/${user.id}/40/40`} alt={user.name} data-ai-hint="profile avatar" />
              <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.isAdmin ? "Amministratore" : "Utente"}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Esci
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <LogIn className="mr-2 h-4 w-4" />
          Accedi
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel>Accedi Come</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => login(false)}>
          <UserCircle className="mr-2 h-4 w-4" />
          Utente
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => login(true)}>
          <ShieldCheck className="mr-2 h-4 w-4" />
          Admin
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
