
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
import { LogIn, LogOut, UserPlus, Loader2, Link2, Edit3 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "./login-form";
import { SignupForm } from "./signup-form";
import { EmailLinkForm } from "./email-link-form"; 

export function AuthButton() {
  const { user, logout, isLoading, completeEmailLinkSignIn, updateUserProfileName } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = React.useState(false);
  const [editNameDialogOpen, setEditNameDialogOpen] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("login");

  React.useEffect(() => {
    completeEmailLinkSignIn();
  }, [completeEmailLinkSignIn]);

  React.useEffect(() => {
    if (user?.displayName) {
      setNewName(user.displayName);
    } else {
      setNewName("");
    }
  }, [user?.displayName, editNameDialogOpen]);


  const handleAuthSuccess = () => {
    setAuthDialogOpen(false);
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      // Toast is handled by updateUserProfileName, but can add specific one here if needed
      return;
    }
    const success = await updateUserProfileName(newName);
    if (success) {
      setEditNameDialogOpen(false);
    }
  };

  if (isLoading && !user) { // Show loader only if truly loading initial auth state
    return <Button variant="outline" size="sm" disabled><Loader2 className="animate-spin mr-2" />Caricamento...</Button>;
  }

  if (user) {
    const userInitial = user.displayName ? user.displayName.substring(0, 2).toUpperCase() : (user.email ? user.email.substring(0,2).toUpperCase() : "U");
    return (
      <>
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
            <AlertDialog open={editNameDialogOpen} onOpenChange={setEditNameDialogOpen}>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Edit3 className="mr-2 h-4 w-4" />
                  Modifica Nome
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Modifica Nome Visualizzato</AlertDialogTitle>
                  <AlertDialogDescription>
                    Inserisci il tuo nuovo nome visualizzato. Questo sarà mostrato agli altri utenti.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="newName" className="text-right">
                      Nome
                    </Label>
                    <Input
                      id="newName"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="col-span-3"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isLoading}>Annulla</AlertDialogCancel>
                  <AlertDialogAction onClick={handleUpdateName} disabled={isLoading || !newName.trim()}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Salva
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <DropdownMenuItem onClick={logout} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
              Esci
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    );
  }

  return (
    <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Open authentication dialog">
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
