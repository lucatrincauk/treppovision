
"use client"; 

import { useEffect, useState } from "react";
import { getTeams, getTeamsByUserId } from "@/lib/team-service";
import { getNations } from "@/lib/nation-service";
import type { Team, Nation } from "@/types";
import { TeamList } from "@/components/teams/team-list";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, Loader2, Edit } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";

export default function TeamsPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [nations, setNations] = useState<Nation[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateTeamButton, setShowCreateTeamButton] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (authIsLoading) {
        setIsLoadingData(true);
        return;
      }
      
      setIsLoadingData(true);
      setError(null);
      try {
        const nationsData = await getNations();
        setNations(nationsData);

        const teamsData = await getTeams();
        setTeams(teamsData);

        if (user) {
          const userSpecificTeams = await getTeamsByUserId(user.uid);
          setUserTeams(userSpecificTeams);
          setShowCreateTeamButton(userSpecificTeams.length === 0);
        } else {
          setUserTeams([]);
          setShowCreateTeamButton(false); // Don't show create button if not logged in
        }

      } catch (fetchError: any) {
        console.error("Failed to fetch teams or nations:", fetchError);
        setError(fetchError.message || "Si è verificato un errore durante il caricamento dei dati.");
      } finally {
        setIsLoadingData(false);
      }
    }
    fetchData();
  }, [authIsLoading, user]); 

  const displayHeaderAndButton = () => (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
      <header className="text-center sm:text-left space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary flex items-center">
          <Users className="mr-3 h-10 w-10" />
          Squadre TreppoVision
        </h1>
        <p className="text-xl text-muted-foreground">
          Scopri tutte le squadre create dagli utenti e le loro scelte.
        </p>
      </header>
      {user && showCreateTeamButton && (
        <Button asChild variant="outline" size="lg">
          <Link href="/teams/new">
            <PlusCircle className="mr-2 h-5 w-5" />
            Crea Nuova Squadra
          </Link>
        </Button>
      )}
      {user && !showCreateTeamButton && userTeams.length > 0 && (
         <Button asChild variant="outline" size="lg">
          <Link href={`/teams/${userTeams[0].id}/edit`}>
            <Edit className="mr-2 h-5 w-5" />
            Modifica la Tua Squadra
          </Link>
        </Button>
      )}
    </div>
  );

  if (authIsLoading || isLoadingData) {
    return (
      <div className="space-y-8">
        {displayHeaderAndButton()}
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Caricamento squadre...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
       <div className="space-y-8">
        {displayHeaderAndButton()}
        <Alert variant="destructive">
          <Users className="h-4 w-4" />
          <AlertTitle>Errore nel Caricamento Dati</AlertTitle>
          <AlertDescription>
            {error} Si prega di riprovare più tardi.
          </AlertDescription>
        </Alert>
      </div>
    )
  }
  
  return (
    <div className="space-y-8">
      {displayHeaderAndButton()}

      {!user && teams.length > 0 && (
         <Alert>
          <Users className="h-4 w-4" />
          <AlertTitle>Visualizzazione Pubblica</AlertTitle>
          <AlertDescription>
            Stai visualizzando le squadre come ospite. <Link href="#" className="font-bold hover:underline" onClick={() => {
              const authButtonDialogTrigger = document.querySelector('button[aria-label="Open authentication dialog"], button>svg.lucide-log-in') as HTMLElement | null;
              if (authButtonDialogTrigger) {
                if (authButtonDialogTrigger.tagName === 'BUTTON') {
                  authButtonDialogTrigger.click();
                } else if (authButtonDialogTrigger.parentElement && authButtonDialogTrigger.parentElement.tagName === 'BUTTON'){
                  (authButtonDialogTrigger.parentElement as HTMLElement).click();
                }
              }
            }}>Accedi</Link> o <Link href="#" className="font-bold hover:underline" onClick={() => {
               const authButtonDialogTrigger = document.querySelector('button[aria-label="Open authentication dialog"], button>svg.lucide-log-in') as HTMLElement | null;
              if (authButtonDialogTrigger) {
                if (authButtonDialogTrigger.tagName === 'BUTTON') {
                  authButtonDialogTrigger.click();
                } else if (authButtonDialogTrigger.parentElement && authButtonDialogTrigger.parentElement.tagName === 'BUTTON'){
                  (authButtonDialogTrigger.parentElement as HTMLElement).click();
                }
              }
            }}>registrati</Link> per creare o modificare la tua squadra.
          </AlertDescription>
        </Alert>
      )}
      
      {user && !showCreateTeamButton && userTeams.length > 0 && (
        <Alert>
            <Users className="h-4 w-4" />
            <AlertTitle>Hai Già una Squadra!</AlertTitle>
            <AlertDescription>
                Hai già creato la squadra "{userTeams[0].name}". Puoi modificarla usando il pulsante in alto a destra.
            </AlertDescription>
        </Alert>
      )}


      {nations.length === 0 && teams.length > 0 && (
         <Alert variant="destructive">
          <Users className="h-4 w-4" />
          <AlertTitle>Dati Nazioni Mancanti</AlertTitle>
          <AlertDescription>
            Impossibile caricare i dati delle nazioni. Le squadre non possono essere visualizzate correttamente.
          </AlertDescription>
        </Alert>
      )}

      {teams.length === 0 && nations.length > 0 && (
         <Alert>
          <Users className="h-4 w-4" />
          <AlertTitle>Nessuna Squadra Ancora!</AlertTitle>
          <AlertDescription>
            Non ci sono ancora squadre. {user && showCreateTeamButton ? "Sii il primo a crearne una!" : !user ? "Effettua il login per crearne una." : ""}
          </AlertDescription>
        </Alert>
      )}
      
       {nations.length === 0 && teams.length === 0 && !isLoadingData && (
          <Alert variant="destructive">
            <Users className="h-4 w-4" />
            <AlertTitle>Dati Iniziali Mancanti</AlertTitle>
            <AlertDescription>
              Nessuna nazione trovata in Firestore. Le nazioni sono necessarie per creare e visualizzare le squadre.
              Assicurati che la collezione 'nations' sia popolata.
            </AlertDescription>
          </Alert>
       )}

      {teams.length > 0 && nations.length > 0 ? (
        <TeamList teams={teams} nations={nations} />
      ) : teams.length > 0 && nations.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">Dati delle nazioni non disponibili, impossibile visualizzare le squadre.</p>
      ) : null}
    </div>
  );
}
