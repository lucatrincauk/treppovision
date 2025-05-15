
"use client"; 

import { useEffect, useState } from "react";
import { getTeams, getTeamsByUserId, listenToTeams } from "@/lib/team-service";
import { getNations } from "@/lib/nation-service";
import { listenToAllVotesForAllNationsCategorized } from "@/lib/voting-service"; // Import new service
import type { Team, Nation, NationGlobalCategorizedScores } from "@/types";
import { TeamList } from "@/components/teams/team-list";
import { TeamListItem } from "@/components/teams/team-list-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; 
import { PlusCircle, Users, Loader2, Edit, Search, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { TeamsSubNavigation } from "@/components/teams/teams-sub-navigation";

export default function TeamsPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const [allFetchedTeams, setAllFetchedTeams] = useState<Team[]>([]);
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [otherTeams, setOtherTeams] = useState<Team[]>([]);
  const [filteredOtherTeams, setFilteredOtherTeams] = useState<Team[]>([]);
  const [nations, setNations] = useState<Nation[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateTeamButton, setShowCreateTeamButton] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [nationGlobalCategorizedScoresMap, setNationGlobalCategorizedScoresMap] = useState<Map<string, NationGlobalCategorizedScores>>(new Map());
  const [isLoadingGlobalScores, setIsLoadingGlobalScores] = useState(true);

  // Fetch static nations data once
  useEffect(() => {
    async function fetchNationsData() {
      try {
        const nationsData = await getNations();
        setNations(nationsData);
      } catch (fetchError: any) {
        console.error("Failed to fetch nations:", fetchError);
        setError(prev => prev ? `${prev}\nNazioni non caricate.` : "Nazioni non caricate.");
        setNations([]);
      }
    }
    fetchNationsData();
  }, []);

  // Listen to real-time team updates
  useEffect(() => {
    if (authIsLoading) {
      setIsLoadingData(true);
      return;
    }
    
    setIsLoadingData(true);
    setError(null);

    const unsubscribeTeams = listenToTeams((teamsData) => {
      setAllFetchedTeams(teamsData);
      if (user) {
        const userSpecificTeams = teamsData.filter(team => team.userId === user.uid);
        setUserTeams(userSpecificTeams);
        setShowCreateTeamButton(userSpecificTeams.length === 0);
        setOtherTeams(teamsData.filter(team => team.userId !== user.uid));
      } else {
        setUserTeams([]);
        setShowCreateTeamButton(false); 
        setOtherTeams(teamsData);
      }
      setIsLoadingData(false); // Set loading to false after first data received
    }, (err) => {
      console.error("Failed to fetch teams:", err);
      setError(err.message || "Si è verificato un errore durante il caricamento delle squadre.");
      setIsLoadingData(false);
    });

    return () => {
      unsubscribeTeams();
    };
  }, [authIsLoading, user]); 

  // Listen to real-time global categorized scores
  useEffect(() => {
    setIsLoadingGlobalScores(true);
    const unsubscribeGlobalScores = listenToAllVotesForAllNationsCategorized((scores) => {
      setNationGlobalCategorizedScoresMap(scores);
      setIsLoadingGlobalScores(false);
    });
    return () => unsubscribeGlobalScores();
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredOtherTeams(otherTeams);
      return;
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const filtered = otherTeams.filter(
      (team) =>
        team.name.toLowerCase().includes(lowercasedSearchTerm) ||
        (team.creatorDisplayName && team.creatorDisplayName.toLowerCase().includes(lowercasedSearchTerm))
    );
    setFilteredOtherTeams(filtered);
  }, [searchTerm, otherTeams]);

  const displayHeaderAndButton = () => (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
      <header className="text-center sm:text-left space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary flex items-center">
          <Users className="mr-3 h-10 w-10" />
          Elenco Squadre TreppoVision
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
    </div>
  );

  if (authIsLoading || isLoadingData || isLoadingGlobalScores) {
    return (
      <div className="space-y-8">
        <TeamsSubNavigation />
        {displayHeaderAndButton()}
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Caricamento dati squadre...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
       <div className="space-y-8">
        <TeamsSubNavigation />
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
      <TeamsSubNavigation />
      {displayHeaderAndButton()}

      {!user && allFetchedTeams.length > 0 && (
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
      
      {/* User's Team Section */}
      {user && userTeams.length > 0 && nations.length > 0 && (
        <section className="mb-12 pt-6 border-t border-border">
          <div className="flex items-center gap-3 mb-6">
            <ThumbsUp className="w-8 h-8 text-secondary" />
            <h2 className="text-3xl font-semibold tracking-tight text-secondary">
              La Mia Squadra
            </h2>
          </div>
          {userTeams.map(team => (
            <div key={team.id} className="mb-6">
              <TeamListItem 
                team={team} 
                nations={nations} 
                nationGlobalCategorizedScoresMap={nationGlobalCategorizedScoresMap}
              />
            </div>
          ))}
        </section>
      )}

      {/* Other Teams Section */}
      <section className="pt-6 border-t border-border">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <h2 className="text-3xl font-semibold tracking-tight text-primary flex-grow">
            Altre Squadre Create
          </h2>
          <div className="relative w-full md:w-auto md:min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cerca squadre per nome o creatore..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
              aria-label="Cerca altre squadre"
            />
          </div>
        </div>

        {nations.length === 0 && allFetchedTeams.length > 0 && (
          <Alert variant="destructive">
            <Users className="h-4 w-4" />
            <AlertTitle>Dati Nazioni Mancanti</AlertTitle>
            <AlertDescription>
              Impossibile caricare i dati delle nazioni. Le squadre non possono essere visualizzate correttamente.
            </AlertDescription>
          </Alert>
        )}

        {allFetchedTeams.length === 0 && nations.length > 0 && !isLoadingData && (
          <Alert>
            <Users className="h-4 w-4" />
            <AlertTitle>Nessuna Squadra Ancora!</AlertTitle>
            <AlertDescription>
              Non ci sono ancora squadre. {user && showCreateTeamButton ? "Sii il primo a crearne una!" : !user ? "Effettua il login per crearne una." : ""}
            </AlertDescription>
          </Alert>
        )}
      
       {nations.length === 0 && allFetchedTeams.length === 0 && !isLoadingData && (
          <Alert variant="destructive">
            <Users className="h-4 w-4" />
            <AlertTitle>Dati Iniziali Mancanti</AlertTitle>
            <AlertDescription>
              Nessuna nazione trovata in Firestore. Le nazioni sono necessarie per creare e visualizzare le squadre.
              Assicurati che la collezione 'nations' sia popolata.
            </AlertDescription>
          </Alert>
       )}

        {filteredOtherTeams.length > 0 && nations.length > 0 ? (
          <TeamList 
            teams={filteredOtherTeams} 
            nations={nations} 
            nationGlobalCategorizedScoresMap={nationGlobalCategorizedScoresMap}
          />
        ) : searchTerm && nations.length > 0 && !isLoadingData ? (
          <p className="text-center text-muted-foreground py-10">Nessuna squadra trovata corrispondente alla tua ricerca.</p>
        ) : filteredOtherTeams.length === 0 && !searchTerm && allFetchedTeams.length > 0 && nations.length > 0 && !isLoadingData ? (
           <p className="text-center text-muted-foreground py-10">Nessun'altra squadra creata dagli utenti.</p>
        ) : null }

      </section>
    </div>
  );
}
