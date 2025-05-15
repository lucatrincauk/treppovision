
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getTeamById } from "@/lib/team-service";
import type { Team, TeamFormData } from "@/types";
import { CreateTeamForm } from "@/components/teams/create-team-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertTriangle, Users, Edit, Lock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getTeamsLockedStatus } from "@/lib/actions/team-actions"; 

export default function EditTeamPage() {
  const { user, isLoading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const teamId = typeof params.teamId === "string" ? params.teamId : undefined;

  const [team, setTeam] = useState<Team | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [teamsLocked, setTeamsLocked] = useState<boolean | null>(null);

  useEffect(() => {
    async function fetchTeamAndSettings() {
      if (authLoading || !teamId) {
        setIsLoadingData(authLoading);
        return;
      }

      setIsLoadingData(true);
      setError(null);
      try {
        const [fetchedTeam, lockedStatus] = await Promise.all([
          getTeamById(teamId),
          getTeamsLockedStatus()
        ]);
        setTeamsLocked(lockedStatus);

        if (fetchedTeam) {
          setTeam(fetchedTeam);
          if (user && fetchedTeam.userId === user.uid) {
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
            setError("Non sei autorizzato a modificare questo team.");
          }
        } else {
          setError("Team non trovato.");
          setIsAuthorized(false);
        }
      } catch (fetchError: any) {
        console.error("Failed to fetch team or settings:", fetchError);
        setError(fetchError.message || "Errore durante il caricamento dei dati del team o delle impostazioni.");
        setIsAuthorized(false);
      } finally {
        setIsLoadingData(false);
      }
    }

    fetchTeamAndSettings();
  }, [teamId, user, authLoading]);

  if (authLoading || isLoadingData || teamsLocked === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Caricamento dati team...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Accesso Richiesto</AlertTitle>
        <AlertDescription>
          Devi effettuare il login per modificare un team.
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

  if (teamsLocked) {
    return (
      <Alert variant="destructive" className="max-w-lg mx-auto">
        <Lock className="h-4 w-4" />
        <AlertTitle>Modifica Squadre Bloccata</AlertTitle>
        <AlertDescription>
          L'amministratore ha temporaneamente bloccato la modifica delle squadre. Riprova più tardi.
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
          Non sei autorizzato a modificare questo team o il team non è stato trovato.
          <Button variant="link" asChild className="p-0 ml-1">
            <Link href="/teams">Torna alle Squadre</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const initialFormData: TeamFormData = {
    name: team.name,
    founderChoices: team.founderChoices || [],
    day1NationId: team.day1NationId,
    day2NationId: team.day2NationId,
    creatorDisplayName: team.creatorDisplayName,
    bestSongNationId: team.bestSongNationId || "",
    bestPerformanceNationId: team.bestPerformanceNationId || "",
    bestOutfitNationId: team.bestOutfitNationId || "",
    worstSongNationId: team.worstSongNationId || "",
  };

  return (
    <div className="space-y-6">
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-primary">
            <Edit className="mr-2 h-6 w-6" />
            Modifica la Tua Squadra: {team.name}
          </CardTitle>
          <CardDescription>
            Aggiorna il nome della tua squadra e le tue scelte per ogni categoria.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateTeamForm
            initialData={initialFormData}
            isEditMode={true}
            teamId={team.id}
            teamsLocked={teamsLocked} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
