
"use client";

import * as React from "react";
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
import { LogIn, LogOut, UserPlus, Loader2, Link2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "./login-form";
import { SignupForm } from "./signup-form";
import { EmailLinkForm } from "./email-link-form"; // Import the new form

export function AuthButton() {
  const { user, logout, isLoading, completeEmailLinkSignIn } = useAuth();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("login");

  // Attempt to complete email link sign in when component mounts or user state might change
  React.useEffect(() => {
    completeEmailLinkSignIn();
  }, [completeEmailLinkSignIn]);


  const handleAuthSuccess = () => {
    setDialogOpen(false);
  };

  if (isLoading) {
    return <Button variant="outline" size="sm" disabled><Loader2 className="animate-spin mr-2" />Caricamento...</Button>;
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
              <p className="text-sm font-medium leading-none">{user.displayName || user.email || "Utente"}</p>
              {user.email && user.displayName && (
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
            Esci
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <LogIn className="mr-2 h-4 w-4" />
          Accedi / Registrati
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Autenticazione</DialogTitle>
          <DialogDescription>
            Scegli un metodo per accedere o creare un nuovo account.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="login"><LogIn className="mr-1"/>Accedi</TabsTrigger>
            <TabsTrigger value="signup"><UserPlus className="mr-1"/>Registrati</TabsTrigger>
            <TabsTrigger value="emailLink"><Link2 className="mr-1"/>Link Email</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <LoginForm onSuccess={handleAuthSuccess} />
          </TabsContent>
          <TabsContent value="signup">
            <SignupForm onSuccess={handleAuthSuccess} />
          </TabsContent>
          <TabsContent value="emailLink">
            <EmailLinkForm onSuccess={handleAuthSuccess} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
