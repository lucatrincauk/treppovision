
"use client";

import * as React from "react";
import { useAuth } from "@/hooks/use-auth";
import { getAdminSettingsAction, updateAdminSettingsAction, updateNationRankingAction } from "@/lib/actions/admin-actions";
import { getNations } from "@/lib/nation-service";
import type { AdminSettings, Nation } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldAlert, Lock, Unlock, Save, ArrowUp, ArrowDown, ListOrdered, Trash2, Edit, UserPlus, Settings as SettingsIcon, SlidersHorizontal, Users as UsersIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminTeamsManagement } from "@/components/admin/admin-teams-management";

const DEBOUNCE_DELAY = 1500; // 1.5 seconds

export default function AdminSettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [settings, setSettings] = React.useState<AdminSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = React.useState(true);
  const [isSubmittingTeams, setIsSubmittingTeams] = React.useState(false);
  const [isSubmittingLeaderboard, setIsSubmittingLeaderboard] = React.useState(false);
  const [isSubmittingFinalPredictions, setIsSubmittingFinalPredictions] = React.useState(false);
  const [isSubmittingUserRegistration, setIsSubmittingUserRegistration] = React.useState(false);

  const [nations, setNations] = React.useState<Nation[]>([]);
  const [allNationsStable, setAllNationsStable] = React.useState<Nation[]>([]);
  const [isLoadingNations, setIsLoadingNations] = React.useState(true);
  
  const [rankingsInput, setRankingsInput] = React.useState<Map<string, string>>(new Map());
  const [initialRankingsMap, setInitialRankingsMap] = React.useState<Map<string, string>>(new Map());
  const debounceTimers = React.useRef<Map<string, NodeJS.Timeout>>(new Map());

  const [isSavingAll, setIsSavingAll] = React.useState(false);
  const [isDeletingAll, setIsDeletingAll] = React.useState(false);

  const handleSaveRanking = React.useCallback(async (nationId: string, rankingString: string | null) => {
    setSavingStates(prev => new Map(prev).set(nationId, true));
    const result = await updateNationRankingAction(nationId, rankingString);

    if (result.success) {
      toast({
        title: "Ranking Aggiornato",
        description: `Ranking per ${allNationsStable.find(n => n.id === nationId)?.name || nationId} aggiornato a ${result.newRanking ?? 'N/D'}.`,
      });
      setNations(prevNations =>
        prevNations.map(n =>
          n.id === nationId ? { ...n, ranking: result.newRanking } : n
        ).sort((a,b) => (a.ranking ?? Infinity) - (b.ranking ?? Infinity) || (a.performingOrder ?? Infinity) - (b.performingOrder ?? Infinity)) 
      );
      const newRankString = result.newRanking !== undefined && result.newRanking !== null ? String(result.newRanking) : "";
      setInitialRankingsMap(prev => new Map(prev).set(nationId, newRankString));
      setRankingsInput(prev => new Map(prev).set(nationId, newRankString));
    } else {
      toast({
        title: "Errore Aggiornamento Ranking",
        description: result.message,
        variant: "destructive",
      });
      setRankingsInput(prev => new Map(prev).set(nationId, initialRankingsMap.get(nationId) ?? ""));
    }
    setSavingStates(prev => new Map(prev).set(nationId, false));
  }, [toast, allNationsStable, initialRankingsMap]);


  const handleRankingInputChange = React.useCallback((nationId: string, value: string) => {
    setRankingsInput(prev => new Map(prev).set(nationId, value));
    
    if (debounceTimers.current.has(nationId)) {
      clearTimeout(debounceTimers.current.get(nationId)!);
    }
    const timer = setTimeout(() => {
      handleSaveRanking(nationId, value);
    }, DEBOUNCE_DELAY);
    debounceTimers.current.set(nationId, timer);

  }, [handleSaveRanking]);

  const [savingStates, setSavingStates] = React.useState<Map<string, boolean>>(new Map());


  React.useEffect(() => {
    async function fetchPageData() {
      if (user?.isAdmin) {
        setIsLoadingSettings(true);
        setIsLoadingNations(true);
        try {
          const [currentSettings, fetchedNations] = await Promise.all([
            getAdminSettingsAction(),
            getNations() 
          ]);
          setSettings(currentSettings);

          const sortedNationsForTable = [...fetchedNations].sort((a, b) => {
            const rankA = a.ranking ?? Infinity;
            const rankB = b.ranking ?? Infinity;
            if (rankA === rankB) {
                return (a.performingOrder ?? Infinity) - (b.performingOrder ?? Infinity);
            }
            return rankA - rankB;
          });

          setNations(sortedNationsForTable);
          setAllNationsStable(fetchedNations); 

          const initialRanks = new Map<string, string>();
          fetchedNations.forEach(nation => {
            initialRanks.set(nation.id, (nation.ranking && nation.ranking > 0) ? String(nation.ranking) : "");
          });
          setRankingsInput(new Map(initialRanks));
          setInitialRankingsMap(new Map(initialRanks));

        } catch (error) {
          console.error("Error fetching admin page data:", error);
          toast({ title: "Errore Caricamento Dati", description: "Impossibile caricare dati admin.", variant: "destructive" });
        } finally {
          setIsLoadingSettings(false);
          setIsLoadingNations(false);
        }
      } else if (!authLoading && user && !user.isAdmin) {
        setIsLoadingSettings(false);
        setIsLoadingNations(false);
      }
    }
    if (!authLoading) {
      fetchPageData();
    }
     // Cleanup debounce timers on unmount
    return () => {
      debounceTimers.current.forEach(timer => clearTimeout(timer));
    };
  }, [user, authLoading, toast]);

  const handleToggleSetting = async (
    settingKey: keyof AdminSettings,
    valueToStoreForSetting: boolean, 
    setSubmittingState: React.Dispatch<React.SetStateAction<boolean>>,
    toastTitle: string,
    toastDescriptionIfTrue?: string, 
    toastDescriptionIfFalse?: string 
  ) => {
    setSubmittingState(true);
    const result = await updateAdminSettingsAction({ [settingKey]: valueToStoreForSetting });
    if (result.success) {
      setSettings(prev => {
        const newSettings = prev ? { ...prev, [settingKey]: valueToStoreForSetting } : {
          teamsLocked: false, leaderboardLocked: false, finalPredictionsEnabled: false, userRegistrationEnabled: true,
          [settingKey]: valueToStoreForSetting
        } as AdminSettings; 
        return newSettings;
      });
      if (typeof valueToStoreForSetting === 'boolean' && toastDescriptionIfTrue && toastDescriptionIfFalse) {
        toast({
          title: toastTitle,
          description: valueToStoreForSetting ? toastDescriptionIfTrue : toastDescriptionIfFalse,
        });
      } else {
         toast({ title: toastTitle, description: "Impostazione aggiornata."});
      }
    } else {
      toast({
        title: "Errore Aggiornamento",
        description: result.message,
        variant: "destructive",
      });
    }
    setSubmittingState(false);
  };


  const handleMoveNation = React.useCallback((nationId: string, direction: 'up' | 'down') => {
    setNations(prevNations => {
      const index = prevNations.findIndex(n => n.id === nationId);
      if (index === -1) return prevNations;

      const newNationsArray = [...prevNations];
      const itemToMove = newNationsArray.splice(index, 1)[0];

      let newIndex = index;
      if (direction === 'up' && index > 0) {
        newIndex = index - 1;
      } else if (direction === 'down' && index < newNationsArray.length) {
        newIndex = index + 1;
      }
      newNationsArray.splice(newIndex, 0, itemToMove);
      
      newNationsArray.forEach((nation, idx) => {
          const newTargetRankString = String(idx + 1);
          const currentRankStringInInput = rankingsInput.get(nation.id) ?? "";
          if (newTargetRankString !== currentRankStringInInput) {
              handleRankingInputChange(nation.id, newTargetRankString);
          }
      });
      
      return newNationsArray;
    });
  }, [rankingsInput, handleRankingInputChange]);


  const handleSaveAllChangedRankings = async () => {
    setIsSavingAll(true);
    let changesMade = 0;
    let successfulSaves = 0;
    const promises = [];

    for (const nation of allNationsStable) {
      const currentInputValue = rankingsInput.get(nation.id) ?? "";
      const originalSavedRank = initialRankingsMap.get(nation.id) ?? "";

      if (currentInputValue !== originalSavedRank) {
        changesMade++;
        if (debounceTimers.current.has(nation.id)) {
            clearTimeout(debounceTimers.current.get(nation.id)!);
            debounceTimers.current.delete(nation.id);
        }
        promises.push(
          updateNationRankingAction(nation.id, currentInputValue)
            .then(result => {
              if (result.success) {
                successfulSaves++;
                setNations(prevNations =>
                  prevNations.map(n =>
                    n.id === nation.id ? { ...n, ranking: result.newRanking } : n
                  ).sort((a,b) => (a.ranking ?? Infinity) - (b.ranking ?? Infinity) || (a.performingOrder ?? Infinity) - (b.performingOrder ?? Infinity))
                );
              } else {
                toast({ title: `Errore salvataggio ${nation.name}`, description: result.message, variant: "destructive" });
              }
              return result; 
            })
        );
      }
    }

    if (changesMade === 0) {
      toast({ title: "Nessuna Modifica", description: "Nessun ranking è stato modificato." });
      setIsSavingAll(false);
      return;
    }

    await Promise.all(promises);

    if (successfulSaves > 0) {
      toast({ title: "Ranking Aggiornati", description: `${successfulSaves} ranking salvati con successo.` });
      const newInitialRanks = new Map(initialRankingsMap);
      allNationsStable.forEach(nation => {
        const currentInputValue = rankingsInput.get(nation.id) ?? "";
        const originalSavedRank = initialRankingsMap.get(nation.id) ?? "";
        if (currentInputValue !== originalSavedRank) { 
            newInitialRanks.set(nation.id, currentInputValue);
        }
      });
      setInitialRankingsMap(newInitialRanks);
    }
    setIsSavingAll(false);
  };

  const handleDeleteAllRankings = async () => {
    setIsDeletingAll(true);
    const promises = [];
    for (const nation of allNationsStable) {
        if (debounceTimers.current.has(nation.id)) {
            clearTimeout(debounceTimers.current.get(nation.id)!);
            debounceTimers.current.delete(nation.id);
        }
      promises.push(updateNationRankingAction(nation.id, ""));
    }
    await Promise.all(promises);

    const newEmptyRankings = new Map<string, string>();
    allNationsStable.forEach(n => newEmptyRankings.set(n.id, ""));
    setRankingsInput(newEmptyRankings);
    setInitialRankingsMap(newEmptyRankings);

    setNations(prevNations => 
      prevNations.map(n => ({ ...n, ranking: undefined }))
      .sort((a,b) => (a.ranking ?? Infinity) - (b.ranking ?? Infinity) || (a.performingOrder ?? Infinity) - (b.performingOrder ?? Infinity))
    );

    toast({ title: "Ranking Eliminati", description: "Tutti i ranking sono stati eliminati." });
    setIsDeletingAll(false);
  };


  if (authLoading || isLoadingSettings || (user?.isAdmin && isLoadingNations)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Caricamento impostazioni admin...</p>
      </div>
    );
  }

  if (!user?.isAdmin) {
    return (
      <Alert variant="destructive" className="max-w-lg mx-auto">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Accesso Negato</AlertTitle>
        <AlertDescription>
          Non hai i permessi necessari per visualizzare questa pagina.
        </AlertDescription>
      </Alert>
    );
  }

  if (!settings) {
     return (
      <Alert variant="destructive" className="max-w-lg mx-auto">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Errore Caricamento</AlertTitle>
        <AlertDescription>
          Impossibile caricare le impostazioni admin. Riprova più tardi.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Tabs defaultValue="general" className="space-y-8">
      <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto">
        <TabsTrigger value="general">
          <SettingsIcon className="mr-2 h-4 w-4" />
          Impostazioni Generali
        </TabsTrigger>
        <TabsTrigger value="nations">
          <ListOrdered className="mr-2 h-4 w-4" />
          Gestione Nazioni
        </TabsTrigger>
        <TabsTrigger value="teams">
          <UsersIcon className="mr-2 h-4 w-4" />
          Gestione Squadre
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <CardTitle>Impostazioni Generali</CardTitle>
            <CardDescription>
              Gestisci le impostazioni globali dell'applicazione.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                  <Label htmlFor="teams-locked-switch" className="text-base font-medium">
                      Abilita Modifica Squadre
                  </Label>
                  <p className="text-sm text-muted-foreground">
                      Se attivo, gli utenti potranno creare e modificare le loro squadre.
                  </p>
              </div>
              <div className="flex items-center space-x-2">
                {settings.teamsLocked ? <Lock className="text-destructive" /> : <Unlock className="text-primary" />}
                <Switch
                  id="teams-locked-switch"
                  checked={!settings.teamsLocked}
                  onCheckedChange={(enabled) =>
                    handleToggleSetting(
                      'teamsLocked',
                      !enabled,
                      setIsSubmittingTeams,
                      "Impostazioni Squadre Aggiornate",
                      "Modifica squadre disabilitata.",
                      "Modifica squadre abilitata."
                    )
                  }
                  disabled={isSubmittingTeams}
                  aria-label="Abilita modifica squadre"
                />
              </div>
            </div>
            {isSubmittingTeams && (
              <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvataggio modifiche squadre...
              </div>
              )}

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                  <Label htmlFor="leaderboard-locked-switch" className="text-base font-medium">
                      Abilita Accesso Classifiche Utenti
                  </Label>
                  <p className="text-sm text-muted-foreground">
                      Se attivo, "Classifica TreppoScore" e "Classifica Squadre" saranno accessibili.
                  </p>
              </div>
              <div className="flex items-center space-x-2">
                {settings.leaderboardLocked ? <Lock className="text-destructive" /> : <Unlock className="text-primary" />}
                <Switch
                  id="leaderboard-locked-switch"
                  checked={!settings.leaderboardLocked}
                  onCheckedChange={(enabled) =>
                    handleToggleSetting(
                      'leaderboardLocked',
                      !enabled,
                      setIsSubmittingLeaderboard,
                      "Impostazioni Classifiche Aggiornate",
                      "Accesso classifiche utenti disabilitato.",
                      "Accesso classifiche utenti abilitato."
                    )
                  }
                  disabled={isSubmittingLeaderboard}
                  aria-label="Abilita accesso classifiche utenti"
                />
              </div>
            </div>
            {isSubmittingLeaderboard && (
              <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvataggio modifiche classifiche...
              </div>
              )}

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                  <Label htmlFor="final-predictions-switch" className="text-base font-medium">
                      Abilita Inserimento Pronostici Finali
                  </Label>
                  <p className="text-sm text-muted-foreground">
                      Se attivo, gli utenti potranno inserire i loro "Pronostici Finali" per la squadra.
                  </p>
              </div>
              <div className="flex items-center space-x-2">
                {settings.finalPredictionsEnabled ? <Edit className="text-primary" /> : <Lock className="text-muted-foreground" />}
                <Switch
                  id="final-predictions-switch"
                  checked={settings.finalPredictionsEnabled}
                  onCheckedChange={(enabled) => handleToggleSetting('finalPredictionsEnabled', enabled, setIsSubmittingFinalPredictions, "Impostazioni Pronostici Finali Aggiornate", "Inserimento pronostici finali abilitato.", "Inserimento pronostici finali disabilitato.")}
                  disabled={isSubmittingFinalPredictions}
                  aria-label="Abilita inserimento pronostici finali"
                />
              </div>
            </div>
            {isSubmittingFinalPredictions && (
              <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvataggio modifiche pronostici finali...
              </div>
              )}

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                  <Label htmlFor="user-registration-switch" className="text-base font-medium">
                      Abilita Registrazione Utenti
                  </Label>
                  <p className="text-sm text-muted-foreground">
                      Se attivo, i nuovi utenti potranno registrarsi all'applicazione.
                  </p>
              </div>
              <div className="flex items-center space-x-2">
                {settings.userRegistrationEnabled ? <UserPlus className="text-primary" /> : <Lock className="text-muted-foreground" />}
                <Switch
                  id="user-registration-switch"
                  checked={settings.userRegistrationEnabled}
                  onCheckedChange={(enabled) =>
                    handleToggleSetting(
                      'userRegistrationEnabled',
                      enabled,
                      setIsSubmittingUserRegistration,
                      "Impostazioni Registrazione Utenti Aggiornate",
                      "Registrazione utenti abilitata.",
                      "Registrazione utenti disabilitata."
                    )
                  }
                  disabled={isSubmittingUserRegistration}
                  aria-label="Abilita registrazione utenti"
                />
              </div>
            </div>
            {isSubmittingUserRegistration && (
              <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvataggio modifiche registrazione...
              </div>
              )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="nations">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ListOrdered className="mr-2 h-6 w-6" />
              Gestione Ranking Nazioni
            </CardTitle>
            <CardDescription>
              Usa le frecce per riordinare visivamente le nazioni. Questo aggiornerà i campi input del ranking.
              Inserisci manualmente il ranking desiderato se preferisci (il salvataggio è automatico dopo un breve ritardo).
              Poi clicca "Salva Ranking Modificati" per persistere le modifiche non ancora salvate.
              "Elimina Tutti i Ranking" rimuoverà il ranking da tutte le nazioni.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:justify-end gap-2 mb-4">
              <Button onClick={handleSaveAllChangedRankings} disabled={isSavingAll || isDeletingAll} className="w-full sm:w-auto">
                {isSavingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salva Ranking Modificati
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isSavingAll || isDeletingAll} className="w-full sm:w-auto">
                    {isDeletingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Elimina Tutti i Ranking
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
                    <AlertDialogDescription>
                      Sei sicuro di voler eliminare tutti i ranking? Questa azione non può essere annullata.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAllRankings}>
                      Elimina Tutti
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            {isLoadingNations ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Caricamento nazioni...</p>
              </div>
            ) : nations.length === 0 ? (
              <p className="text-muted-foreground text-center">Nessuna nazione trovata.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Sposta</TableHead>
                      <TableHead>Nazione</TableHead>
                      <TableHead className="w-[150px] text-center">Ranking</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nations.map((nation, index) => (
                      <TableRow key={nation.id}>
                        <TableCell className="space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveNation(nation.id, 'up')}
                            disabled={index === 0 || isSavingAll || isDeletingAll}
                            aria-label={`Sposta ${nation.name} su`}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveNation(nation.id, 'down')}
                            disabled={index === nations.length - 1 || isSavingAll || isDeletingAll}
                            aria-label={`Sposta ${nation.name} giù`}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Image
                              src={`https://flagcdn.com/w40/${nation.countryCode.toLowerCase()}.png`}
                              alt={nation.name}
                              width={20}
                              height={13}
                              className="rounded-sm border border-border/50 object-contain"
                              data-ai-hint={`${nation.name} flag`}
                            />
                            <span className="font-medium">{nation.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center">
                            <Input
                              type="text"
                              value={rankingsInput.get(nation.id) ?? ""}
                              onChange={(e) => handleRankingInputChange(nation.id, e.target.value)}
                              className="w-16 text-center h-8 px-1"
                              placeholder="N/D"
                              disabled={isSavingAll || isDeletingAll || savingStates.get(nation.id)}
                            />
                             {savingStates.get(nation.id) && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
       <TabsContent value="teams">
        <AdminTeamsManagement allNations={allNationsStable} />
      </TabsContent>
    </Tabs>
  );
}

    