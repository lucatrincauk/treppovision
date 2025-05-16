
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getTeamById } from "@/lib/team-service";
import type { Team, TeamFinalAnswersFormData } from "@/types";
import { FinalAnswersForm } from "@/components/teams/final-answers-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertTriangle, Users, ListOrdered, Lock, ChevronLeft, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getFinalPredictionsEnabledStatus } from "@/lib/actions/admin-actions";

export default function EditFinalAnswersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const params = useParams();
  const teamId = typeof params.teamId === "string" ? params.teamId : undefined;

  const [team, setTeam] = useState<Team | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [finalPredictionsEnabled, setFinalPredictionsEnabled] = useState<boolean | null>(null);
  const [hasExistingPredictions, setHasExistingPredictions] = useState(false);

  useEffect(() => {
    async function fetchPageData() {
      if (authLoading || !teamId) {
        setIsLoadingSettings(authLoading);
        setIsLoadingData(authLoading); 
        if (!teamId && !authLoading) {
          setError("ID Squadra non valido.");
          setIsLoadingData(false);
          setIsLoadingSettings(false);
        }
        return;
      }

      setIsLoadingSettings(true);
      setError(null);

      let predictionsEnabledStatus = false;
      try {
        predictionsEnabledStatus = await getFinalPredictionsEnabledStatus();
        setFinalPredictionsEnabled(predictionsEnabledStatus);
      } catch (settingsError: any) {
        console.error("Failed to fetch final predictions enabled status:", settingsError);
        setError("Impossibile caricare le impostazioni dei pronostici.");
        setFinalPredictionsEnabled(false); 
        setIsLoadingSettings(false);
        setIsLoadingData(false); 
        return;
      }
      setIsLoadingSettings(false);

      if (predictionsEnabledStatus === false) {
        setIsLoadingData(false); 
        return;
      }
      
      setIsLoadingData(true);
      try {
        const fetchedTeam = await getTeamById(teamId);

        if (fetchedTeam) {
          setTeam(fetchedTeam);
          const existingPreds = 
                               !!fetchedTeam.bestSongNationId ||
                               !!fetchedTeam.bestPerformanceNationId ||
                               !!fetchedTeam.bestOutfitNationId ||
                               !!fetchedTeam.worstSongNationId;
          setHasExistingPredictions(existingPreds);

          if (user && fetchedTeam.userId === user.uid) {
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
            // No error here, page will handle unauthorized display
          }
        } else {
          setError("Squadra non trovata.");
          setIsAuthorized(false);
        }
      } catch (fetchError: any) { // Added missing opening brace for catch block
        console.error("Failed to fetch team data for final answers:", fetchError);
        setError(fetchError.message || "Errore durante il caricamento dei dati della squadra.");
        setIsAuthorized(false);
      } finally {
        setIsLoadingData(false);
      }
    }

    fetchPageData();
  }, [teamId, user, authLoading]);

  if (authLoading || isLoadingSettings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Caricamento impostazioni...</p>
      </div>
    );
  }

  if (finalPredictionsEnabled === false) {
     return (
      <div className="space-y-6">
        <Link href="/teams" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Torna alle Squadre
        </Link>
        <Alert variant="destructive" className="max-w-lg mx-auto">
          <Lock className="h-4 w-4" />
          <AlertTitle>Inserimento Pronostici Bloccato</AlertTitle>
          <AlertDescription>
            L'amministratore ha temporaneamente disabilitato l'inserimento dei pronostici finali.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Caricamento dati pronostici...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Alert variant="destructive" className="max-w-lg mx-auto">
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
      <Alert variant="destructive" className="max-w-lg mx-auto">
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
  
  if (hasExistingPredictions) {
    return (
      <div className="space-y-6">
        <Link href="/teams" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Torna alle Squadre
        </Link>
        <Alert variant="default" className="max-w-lg mx-auto">
          <Info className="h-4 w-4" />
          <AlertTitle>Pronostici Già Inviati</AlertTitle>
          <AlertDescription>
            Hai già inviato i tuoi pronostici finali per la squadra "{team?.name || 'sconosciuta'}". Non possono essere modificati.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!isAuthorized && team) { 
     return (
      <Alert variant="destructive" className="max-w-lg mx-auto">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Accesso Negato</AlertTitle>
        <AlertDescription>
          Non sei autorizzato a modificare questi pronostici.
          <Button variant="link" asChild className="p-0 ml-1">
            <Link href="/teams">Torna alle Squadre</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  if (!team && !error) { 
    return (
        <Alert variant="destructive" className="max-w-lg mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Squadra Non Trovata</AlertTitle>
            <AlertDescription>
                La squadra richiesta non è stata trovata.
                <Button variant="link" asChild className="p-0 ml-1">
                <Link href="/teams">Torna alle Squadre</Link>
                </Button>
            </AlertDescription>
        </Alert>
    );
  }

  const initialFinalAnswers: TeamFinalAnswersFormData = {
    bestSongNationId: team!.bestSongNationId || "",
    bestPerformanceNationId: team!.bestPerformanceNationId || "",
    bestOutfitNationId: team!.bestOutfitNationId || "",
    worstSongNationId: team!.worstSongNationId || "",
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
            Pronostici Finali per: {team!.name}
          </CardTitle>
          <CardDescription>
            Inserisci i tuoi pronostici per le categorie basate sul voto degli utenti.
            {!hasExistingPredictions && (
               <Alert variant="destructive" className="mt-2">
                 <AlertTriangle className="h-4 w-4" />
                 <AlertTitle>Attenzione</AlertTitle>
                 <AlertDescription>
                    I pronostici finali, una volta inviati, non possono essere modificati.
                 </AlertDescription>
               </Alert>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FinalAnswersForm
            initialData={initialFinalAnswers}
            teamId={team!.id}
            isReadOnly={hasExistingPredictions} 
          />
        </CardContent>
      </Card>
    </div>
  );
}

