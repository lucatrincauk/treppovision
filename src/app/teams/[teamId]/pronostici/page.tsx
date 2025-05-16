
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getTeamById } from "@/lib/team-service";
import type { Team, TeamFinalAnswersFormData } from "@/types";
import { FinalAnswersForm } from "@/components/teams/final-answers-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertTriangle, Users, ListOrdered, Lock, ChevronLeft, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getTeamsLockedStatus } from "@/lib/actions/team-actions"; 
import { getFinalPredictionsEnabledStatus } from "@/lib/actions/admin-actions";

export default function EditFinalAnswersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const teamId = typeof params.teamId === "string" ? params.teamId : undefined;

  const [team, setTeam] = useState<Team | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [teamsLocked, setTeamsLocked] = useState<boolean | null>(null);
  const [finalPredictionsEnabled, setFinalPredictionsEnabled] = useState<boolean | null>(null);
  const [hasExistingPredictions, setHasExistingPredictions] = useState(false);

  useEffect(() => {
    async function fetchTeamAndSettings() {
      if (authLoading || !teamId) {
        setIsLoadingData(authLoading);
        return;
      }

      setIsLoadingData(true);
      setError(null);
      try {
        const [fetchedTeam, generalTeamsLockStatus, finalPredictionsEnableStatus] = await Promise.all([
          getTeamById(teamId),
          getTeamsLockedStatus(),
          getFinalPredictionsEnabledStatus()
        ]);
        setTeamsLocked(generalTeamsLockStatus);
        setFinalPredictionsEnabled(finalPredictionsEnableStatus);

        if (fetchedTeam) {
          setTeam(fetchedTeam);
          setHasExistingPredictions(
            !!fetchedTeam.bestSongNationId || 
            !!fetchedTeam.bestPerformanceNationId || 
            !!fetchedTeam.bestOutfitNationId || 
            !!fetchedTeam.worstSongNationId
          );
          if (user && fetchedTeam.userId === user.uid) {
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
            setError("Non sei autorizzato a modificare i pronostici di questa squadra.");
          }
        } else {
          setError("Squadra non trovata.");
          setIsAuthorized(false);
        }
      } catch (fetchError: any) {
        console.error("Failed to fetch team or settings for final answers:", fetchError);
        setError(fetchError.message || "Errore durante il caricamento dei dati della squadra o delle impostazioni.");
        setIsAuthorized(false);
      } finally {
        setIsLoadingData(false);
      }
    }

    fetchTeamAndSettings();
  }, [teamId, user, authLoading]);

  if (authLoading || isLoadingData || teamsLocked === null || finalPredictionsEnabled === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Caricamento dati pronostici...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Accesso Richiesto</AlertTitle>
        <AlertDescription>
          Devi effettuare il login per modificare i pronostici.
          <Button variant="link" asChild className="p-0 ml-1">
            <Link href="/teams">Torna alle Squadre</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Errore</AlertTitle>
        <AlertDescription>
          {error}
          <Button variant="link" asChild className="p-0 ml-1">
            <Link href="/teams">Torna alle Squadre</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  if (!finalPredictionsEnabled) {
     return (
      <Alert variant="destructive" className="max-w-lg mx-auto">
        <Lock className="h-4 w-4" />
        <AlertTitle>Inserimento Pronostici Bloccato</AlertTitle>
        <AlertDescription>
          L'amministratore ha temporaneamente disabilitato l'inserimento dei pronostici finali.
          <Button variant="link" asChild className="p-0 ml-1">
            <Link href="/teams">Torna alle Squadre</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (teamsLocked) {
    return (
      <Alert variant="destructive" className="max-w-lg mx-auto">
        <Lock className="h-4 w-4" />
        <AlertTitle>Modifica Pronostici Bloccata</AlertTitle>
        <AlertDescription>
          L'amministratore ha temporaneamente bloccato la modifica dei pronostici e delle squadre. Riprova più tardi.
          <Button variant="link" asChild className="p-0 ml-1">
            <Link href="/teams">Torna alle Squadre</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!isAuthorized || !team) {
     return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Accesso Negato</AlertTitle>
        <AlertDescription>
          Non sei autorizzato a modificare questi pronostici o la squadra non è stata trovata.
          <Button variant="link" asChild className="p-0 ml-1">
            <Link href="/teams">Torna alle Squadre</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const initialFinalAnswers: TeamFinalAnswersFormData = {
    bestSongNationId: team.bestSongNationId || "",
    bestPerformanceNationId: team.bestPerformanceNationId || "",
    bestOutfitNationId: team.bestOutfitNationId || "",
    worstSongNationId: team.worstSongNationId || "",
  };

  return (
    <div className="space-y-6">
        <Link href="/teams" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Torna alle Squadre
        </Link>
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-secondary">
            <ListOrdered className="mr-2 h-6 w-6" />
            Pronostici Finali per: {team.name}
          </CardTitle>
          <CardDescription>
            Inserisci o aggiorna i tuoi pronostici per le categorie basate sul voto degli utenti.
            {hasExistingPredictions && <span className="block mt-2 font-semibold text-destructive">Attenzione: I pronostici finali, una volta inviati, non possono essere modificati.</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FinalAnswersForm
            initialData={initialFinalAnswers}
            teamId={team.id}
            isReadOnly={hasExistingPredictions}
          />
        </CardContent>
      </Card>
    </div>
  );
}

