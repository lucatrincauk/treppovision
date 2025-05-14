
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
import { LogIn, LogOut, UserPlus, Loader2, Link2, Edit3, FileEdit, Lock, Settings } from "lucide-react";
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
import { getTeamsByUserId } from "@/lib/team-service";
import type { Team } from "@/types";
import { useRouter } from "next/navigation";
import { getTeamsLockedStatus } from "@/lib/actions/team-actions";

export function AuthButton() {
  const { user, logout, isLoading, completeEmailLinkSignIn, updateUserProfileName } = useAuth();
  const router = useRouter();
  const [authDialogOpen, setAuthDialogOpen] = React.useState(false);
  const [editNameDialogOpen, setEditNameDialogOpen] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("login");

  const [userTeam, setUserTeam] = React.useState<Team | null>(null);
  const [isLoadingUserTeam, setIsLoadingUserTeam] = React.useState(false);
  const [teamsLocked, setTeamsLocked] = React.useState<boolean | null>(null);

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

  React.useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        setIsLoadingUserTeam(true);
        try {
          const [teams, lockedStatus] = await Promise.all([
            getTeamsByUserId(user.uid),
            getTeamsLockedStatus()
          ]);

          if (teams.length > 0) {
            setUserTeam(teams[0]);
          } else {
            setUserTeam(null);
          }
          setTeamsLocked(lockedStatus);
        } catch (error) {
          console.error("Failed to fetch user team or lock status:", error);
          setUserTeam(null);
          setTeamsLocked(false); // Default to false on error
        } finally {
          setIsLoadingUserTeam(false);
        }
      } else {
        setUserTeam(null);
        setTeamsLocked(null);
      }
    };

    fetchUserData();
  }, [user]);


  const handleAuthSuccess = () => {
    setAuthDialogOpen(false);
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      return;
    }
    const success = await updateUserProfileName(newName);
    if (success) {
      setEditNameDialogOpen(false);
    }
  };

  if (isLoading && !user) {
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

            {(isLoadingUserTeam || teamsLocked === null) && (
              <DropdownMenuItem disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Caricamento squadra...
              </DropdownMenuItem>
            )}
            {!isLoadingUserTeam && userTeam && teamsLocked === false && (
              <DropdownMenuItem onSelect={() => router.push(`/teams/${userTeam.id}/edit`)}>
                <FileEdit className="mr-2 h-4 w-4" />
                Modifica Squadra
              </DropdownMenuItem>
            )}
             {!isLoadingUserTeam && userTeam && teamsLocked === true && (
              <DropdownMenuItem disabled>
                <Lock className="mr-2 h-4 w-4 text-destructive" />
                Modifica Squadra Bloccata
              </DropdownMenuItem>
            )}

            {user?.isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => router.push('/admin/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Impostazioni Admin
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />
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
          <LogIn className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Accedi / Registrati</span>
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
