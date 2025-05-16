
"use client";

import * as React from "react";
import { useAuth } from "@/hooks/use-auth";
import { getAdminSettingsAction, updateAdminSettingsAction, updateNationRankingAction } from "@/lib/actions/admin-actions";
import { getNations } from "@/lib/nation-service"; // Import getNations
import type { AdminSettings, Nation } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Import Input
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; // Import Table components
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldAlert, Lock, Unlock, BarChartBig, Save, Edit2, ListOrdered } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image"; // For flags

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
          setNations(fetchedNations.sort((a, b) => a.performingOrder - b.performingOrder)); // Sort by performingOrder

          const initialRankings = new Map<string, string>();
          fetchedNations.forEach(nation => {
            initialRankings.set(nation.id, nation.ranking ? String(nation.ranking) : "");
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

  const handleRankingInputChange = (nationId: string, value: string) => {
    setRankingsInput(prev => new Map(prev).set(nationId, value));
  };

  const handleSaveRanking = async (nationId: string) => {
    setSavingStates(prev => new Map(prev).set(nationId, true));
    const rankingString = rankingsInput.get(nationId) ?? "";
    let newRanking: number | undefined | null = undefined;

    if (rankingString.trim() === "") {
      newRanking = null; // Intention to clear ranking
    } else {
      const parsedRanking = parseInt(rankingString, 10);
      if (!isNaN(parsedRanking) && parsedRanking > 0) {
        newRanking = parsedRanking;
      } else if (!isNaN(parsedRanking) && parsedRanking <= 0) {
        newRanking = null; // Treat 0 or negative as clearing
      } else {
        toast({ title: "Valore Non Valido", description: "Il ranking deve essere un numero intero positivo o vuoto.", variant: "destructive" });
        setSavingStates(prev => new Map(prev).set(nationId, false));
        return;
      }
    }

    const result = await updateNationRankingAction(nationId, newRanking);
    if (result.success) {
      toast({ title: "Ranking Aggiornato", description: `Ranking per ${nations.find(n => n.id === nationId)?.name} aggiornato.` });
      // Update local nations state to reflect the change immediately
      setNations(prevNations =>
        prevNations.map(n =>
          n.id === nationId ? { ...n, ranking: newRanking === null ? undefined : newRanking } : n
        ).sort((a,b) => a.performingOrder - b.performingOrder)
      );
    } else {
      toast({ title: "Errore Aggiornamento Ranking", description: result.message, variant: "destructive" });
    }
    setSavingStates(prev => new Map(prev).set(nationId, false));
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
            Imposta o modifica la posizione in classifica per ogni nazione. Lascia vuoto per rimuovere il ranking.
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
                    <TableHead className="w-[50px] text-center"># Ord.</TableHead>
                    <TableHead>Nazione</TableHead>
                    <TableHead className="w-[100px] text-center">Ranking</TableHead>
                    <TableHead className="w-[120px] text-right">Azione</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nations.map((nation) => (
                    <TableRow key={nation.id}>
                      <TableCell className="text-center text-muted-foreground">{nation.performingOrder}</TableCell>
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
                        <Input
                          type="text" // Using text to allow empty string for clearing
                          value={rankingsInput.get(nation.id) ?? ""}
                          onChange={(e) => handleRankingInputChange(nation.id, e.target.value)}
                          className="w-16 text-center h-8 px-1"
                          placeholder="N/D"
                          disabled={savingStates.get(nation.id) || false}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSaveRanking(nation.id)}
                          disabled={savingStates.get(nation.id) || false}
                        >
                          {savingStates.get(nation.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          <span className="ml-2 hidden sm:inline">Salva</span>
                        </Button>
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
