
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
import { LogIn, LogOut, UserPlus, Loader2, Link2, Edit3, FileEdit, Lock, Settings, KeyRound } from "lucide-react";
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
import { getUserRegistrationEnabledStatus } from "@/lib/actions/admin-actions"; // Import new status

export function AuthButton() {
  const { user, logout, isLoading, completeEmailLinkSignIn, updateUserProfileName, sendPasswordReset } = useAuth();
  const router = useRouter();
  const [authDialogOpen, setAuthDialogOpen] = React.useState(false);
  const [editNameDialogOpen, setEditNameDialogOpen] = React.useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("login");

  const [userTeam, setUserTeam] = React.useState<Team | null>(null);
  const [isLoadingUserTeam, setIsLoadingUserTeam] = React.useState(false);
  const [teamsLocked, setTeamsLocked] = React.useState<boolean | null>(null);
  const [userRegistrationEnabled, setUserRegistrationEnabled] = React.useState<boolean | null>(null); // New state
  const [isLoadingRegStatus, setIsLoadingRegStatus] = React.useState(true); // Loading for reg status
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);


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
    const fetchInitialData = async () => {
      setIsLoadingRegStatus(true);
      try {
        const regStatus = await getUserRegistrationEnabledStatus();
        setUserRegistrationEnabled(regStatus);
      } catch (error) {
        console.error("Failed to fetch user registration status:", error);
        setUserRegistrationEnabled(false); // Default to false on error
      } finally {
        setIsLoadingRegStatus(false);
      }

      if (user) {
        setIsLoadingUserTeam(true);
        try {
          const [teamsResult, lockedStatusResult] = await Promise.all([
            getTeamsByUserId(user.uid),
            getTeamsLockedStatus()
          ]);

          setUserTeam(teamsResult.length > 0 ? teamsResult[0] : null);
          setTeamsLocked(lockedStatusResult);
        } catch (error) {
          console.error("Failed to fetch initial user data/lock status:", error);
          setUserTeam(null);
          setTeamsLocked(false);
        } finally {
          setIsLoadingUserTeam(false);
        }
      } else {
        setUserTeam(null);
        setTeamsLocked(null);
        setIsLoadingUserTeam(false);
      }
    };

    fetchInitialData();
  }, [user]);

  React.useEffect(() => {
    const refreshLockStatusOnOpen = async () => {
      if (user && isDropdownOpen) {
        try {
          const currentLockedStatus = await getTeamsLockedStatus();
          setTeamsLocked(currentLockedStatus);
        } catch (error) {
          console.error("Failed to refresh teams lock status:", error);
        }
      }
    };

    refreshLockStatusOnOpen();
  }, [user, isDropdownOpen]);


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

  const handlePasswordReset = async () => {
    if (user?.email) {
      await sendPasswordReset(user.email);
      setResetPasswordDialogOpen(false);
    }
  };

  if ((isLoading && !user) || isLoadingRegStatus) {
    return <Button variant="outline" size="sm" disabled><Loader2 className="animate-spin mr-2" />Caricamento...</Button>;
  }

  if (user) {
    const userInitial = user.displayName ? user.displayName.substring(0, 2).toUpperCase() : (user.email ? user.email.substring(0,2).toUpperCase() : "U");
    return (
      <>
        <DropdownMenu onOpenChange={setIsDropdownOpen}>
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

            {user.email && (
              <AlertDialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Cambia Password
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cambia Password</AlertDialogTitle>
                    <AlertDialogDescription>
                      Verrà inviata un'email a <strong>{user.email}</strong> con le istruzioni per reimpostare la tua password. Continuare?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Annulla</AlertDialogCancel>
                    <AlertDialogAction onClick={handlePasswordReset} disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Invia Email
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}


            {(isLoadingUserTeam && isDropdownOpen) && (teamsLocked === null || userTeam === undefined) && (
              <DropdownMenuItem disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Caricamento squadra...
              </DropdownMenuItem>
            )}

            {userTeam !== undefined && teamsLocked !== null && !isLoadingUserTeam && (
                <>
                    {userTeam && teamsLocked === false && (
                    <DropdownMenuItem onSelect={() => router.push(`/teams/${userTeam.id}/edit`)}>
                        <FileEdit className="mr-2 h-4 w-4" />
                        Modifica Squadra
                    </DropdownMenuItem>
                    )}
                    {userTeam && teamsLocked === true && (
                    <DropdownMenuItem disabled>
                        <Lock className="mr-2 h-4 w-4 text-destructive" />
                        Modifica Squadra Bloccata
                    </DropdownMenuItem>
                    )}
                </>
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
            <TabsTrigger value="signup" disabled={userRegistrationEnabled === false || isLoadingRegStatus}>
              <UserPlus className="mr-1"/>Registrati
            </TabsTrigger>
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
