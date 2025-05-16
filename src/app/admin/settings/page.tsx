
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
import { Loader2, ShieldAlert, Lock, Unlock, Save, ArrowUp, ArrowDown, ListOrdered } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";

const DEBOUNCE_DELAY = 1500; // 1.5 seconds

export default function AdminSettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [settings, setSettings] = React.useState<AdminSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = React.useState(true);
  const [isSubmittingTeams, setIsSubmittingTeams] = React.useState(false);
  const [isSubmittingLeaderboard, setIsSubmittingLeaderboard] = React.useState(false);

  const [nations, setNations] = React.useState<Nation[]>([]);
  const [isLoadingNations, setIsLoadingNations] = React.useState(true);
  const [rankingsInput, setRankingsInput] = React.useState<Map<string, string>>(new Map());
  const [savingStates, setSavingStates] = React.useState<Map<string, boolean>>(new Map());
  const debounceTimers = React.useRef<Map<string, NodeJS.Timeout>>(new Map());

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
          const sortedNations = [...fetchedNations].sort((a, b) => (a.performingOrder ?? Infinity) - (b.performingOrder ?? Infinity));
          setNations(sortedNations);

          const initialRankings = new Map<string, string>();
          fetchedNations.forEach(nation => {
            initialRankings.set(nation.id, (nation.ranking && nation.ranking > 0) ? String(nation.ranking) : "");
          });
          setRankingsInput(initialRankings);

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
  }, [user, authLoading, toast]);

  const handleToggleTeamsLocked = async (locked: boolean) => {
    setIsSubmittingTeams(true);
    const result = await updateAdminSettingsAction({ teamsLocked: locked });
    if (result.success) {
      setSettings(prev => prev ? { ...prev, teamsLocked: locked } : { teamsLocked: locked, leaderboardLocked: settings?.leaderboardLocked ?? false });
      toast({
        title: "Impostazioni Aggiornate",
        description: `Modifica squadre ${locked ? 'bloccata' : 'sbloccata'}.`,
      });
    } else {
      toast({
        title: "Errore Aggiornamento",
        description: result.message,
        variant: "destructive",
      });
    }
    setIsSubmittingTeams(false);
  };

  const handleToggleLeaderboardLocked = async (locked: boolean) => {
    setIsSubmittingLeaderboard(true);
    const result = await updateAdminSettingsAction({ leaderboardLocked: locked });
    if (result.success) {
      setSettings(prev => prev ? { ...prev, leaderboardLocked: locked } : { leaderboardLocked: locked, teamsLocked: settings?.teamsLocked ?? false });
      toast({
        title: "Impostazioni Aggiornate",
        description: `Classifica Squadre ${locked ? 'bloccata' : 'sbloccata'}.`,
      });
    } else {
      toast({
        title: "Errore Aggiornamento",
        description: result.message,
        variant: "destructive",
      });
    }
    setIsSubmittingLeaderboard(false);
  };

  const handleSaveRanking = React.useCallback(async (nationId: string) => {
    setSavingStates(prev => new Map(prev).set(nationId, true));
    const rankingString = rankingsInput.get(nationId) ?? "";
    
    const result = await updateNationRankingAction(nationId, rankingString);

    if (result.success) {
      toast({ title: "Ranking Aggiornato", description: `Ranking per ${nations.find(n => n.id === nationId)?.name} aggiornato.` });
      setNations(prevNations =>
        prevNations.map(n =>
          n.id === nationId ? { ...n, ranking: result.newRanking } : n
        )
      );
      setRankingsInput(prev => new Map(prev).set(nationId, result.newRanking ? String(result.newRanking) : ""));
    } else {
      toast({ title: "Errore Aggiornamento Ranking", description: result.message, variant: "destructive" });
    }
    setSavingStates(prev => new Map(prev).set(nationId, false));
  }, [rankingsInput, nations, toast]);


  const handleRankingInputChange = React.useCallback((nationId: string, value: string) => {
    setRankingsInput(prev => new Map(prev).set(nationId, value));

    if (debounceTimers.current.has(nationId)) {
      clearTimeout(debounceTimers.current.get(nationId)!);
    }
    debounceTimers.current.set(nationId, setTimeout(() => {
      handleSaveRanking(nationId);
    }, DEBOUNCE_DELAY));
  }, [handleSaveRanking]);

  const handleMoveNation = (nationId: string, direction: 'up' | 'down') => {
    setNations(prevNations => {
      const index = prevNations.findIndex(n => n.id === nationId);
      if (index === -1) return prevNations;

      const newNationsArray = [...prevNations];
      const item = newNationsArray.splice(index, 1)[0];

      let newIndex = index;
      if (direction === 'up' && index > 0) {
        newIndex = index - 1;
      } else if (direction === 'down' && index < newNationsArray.length) {
        newIndex = index + 1;
      }
      
      newNationsArray.splice(newIndex, 0, item);

      // After updating the visual order, update all ranking inputs
      newNationsArray.forEach((nation, idx) => {
        const newRankString = String(idx + 1);
        // Call handleRankingInputChange to update the input and trigger debounced save
        handleRankingInputChange(nation.id, newRankString);
      });
      
      return newNationsArray;
    });
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
    <div className="space-y-8">
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
                    Blocca Modifica Squadre
                </Label>
                <p className="text-sm text-muted-foreground">
                    Se attivo, gli utenti non potranno creare o modificare le loro squadre.
                </p>
            </div>
            <div className="flex items-center space-x-2">
              {settings.teamsLocked ? <Lock className="text-destructive" /> : <Unlock className="text-primary" />}
              <Switch
                id="teams-locked-switch"
                checked={settings.teamsLocked}
                onCheckedChange={handleToggleTeamsLocked}
                disabled={isSubmittingTeams}
                aria-label="Blocca modifica squadre"
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
                    Blocca Classifica Squadre
                </Label>
                <p className="text-sm text-muted-foreground">
                    Se attivo, la pagina "Classifica Squadre" e "Classifica TreppoScore" non saranno accessibili.
                </p>
            </div>
            <div className="flex items-center space-x-2">
              {settings.leaderboardLocked ? <Lock className="text-destructive" /> : <Unlock className="text-primary" />}
              <Switch
                id="leaderboard-locked-switch"
                checked={settings.leaderboardLocked}
                onCheckedChange={handleToggleLeaderboardLocked}
                disabled={isSubmittingLeaderboard}
                aria-label="Blocca classifica squadre"
              />
            </div>
          </div>
           {isSubmittingLeaderboard && (
            <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvataggio modifiche classifica...
            </div>
            )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ListOrdered className="mr-2 h-6 w-6" />
            Gestione Ranking Nazioni
          </CardTitle>
          <CardDescription>
            Modifica l'ordine visuale con le frecce. Il ranking di tutte le nazioni si aggiornerà automaticamente per riflettere il nuovo ordine e verrà salvato.
            Il campo "Ordine Esibizione" non è affetto da questa tabella.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                          disabled={index === 0}
                          aria-label={`Sposta ${nation.name} su`}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMoveNation(nation.id, 'down')}
                          disabled={index === nations.length - 1}
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
                            disabled={savingStates.get(nation.id) || false}
                          />
                          {savingStates.get(nation.id) && (
                            <Loader2 className="h-4 w-4 animate-spin ml-2 text-primary" />
                          )}
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
    </div>
  );
}

    