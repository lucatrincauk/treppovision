
"use client"; 

import { useEffect, useState } from "react";
import { getTeamsByUserId, listenToTeams } from "@/lib/team-service";
import { getNations } from "@/lib/nation-service";
import { listenToAllVotesForAllNationsCategorized } from "@/lib/voting-service"; 
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

interface TeamWithScore extends Team {
  score?: number;
}

// Scoring logic adapted from leaderboard/page.tsx
const getPointsForRank = (rank?: number): number => {
  if (rank === undefined || rank === null || rank === 0) return 0;
  switch (rank) {
    case 1: return 50;
    case 2: return 35;
    case 3: return 25;
    case 4: return 15;
    case 5: return 10;
    case 6: return 9;
    case 7: return 8;
    case 8: return 7;
    case 9: return 6;
    case 10: return 5;
    case 11: return 4;
    case 12: return 3;
    case 13: return 2;
    case 14: return 1;
    case 15: return 0;
    case 16: return -1;
    case 17: return -2;
    case 18: return -3;
    case 19: return -4;
    case 20: return -5;
    case 21: return -6;
    case 22: return -7;
    case 23: return -8;
    case 24: return -9;
    case 25: return -10;
    case 26: return 25;
  }
  return 0; 
};

const getTopNationsForCategory = (
  scoresMap: Map<string, NationGlobalCategorizedScores>,
  nationsMap: Map<string, Nation>,
  categoryKey: 'averageSongScore' | 'averagePerformanceScore' | 'averageOutfitScore',
  sortOrder: 'desc' | 'asc' = 'desc'
): Array<{ id: string; name: string; score: number | null }> => {
  if (!scoresMap || scoresMap.size === 0 || !nationsMap || nationsMap.size === 0) return [];
  return Array.from(scoresMap.entries())
    .map(([nationId, scores]) => ({
      id: nationId,
      name: nationsMap.get(nationId)?.name || 'Sconosciuto',
      score: scores[categoryKey]
    }))
    .filter(item => item.score !== null && (scoresMap.get(item.id)?.voteCount || 0) > 0) 
    .sort((a, b) => {
      if (a.score === null) return 1;
      if (b.score === null) return -1;
      if (sortOrder === 'desc') {
        return b.score - a.score;
      }
      return a.score - b.score;
    });
};

const getCategoryPickPointsAndRank = (
  pickedNationId: string | undefined,
  sortedNationsForCategory: Array<{ id: string; score: number | null }> 
): { points: number; rank?: number; score?: number | null } => {
  if (!pickedNationId || !sortedNationsForCategory || sortedNationsForCategory.length === 0) return { points: 0, rank: undefined, score: null };
  
  const rankIndex = sortedNationsForCategory.findIndex(n => n.id === pickedNationId);
  const actualRank = rankIndex !== -1 ? rankIndex + 1 : undefined;
  const actualScore = actualRank && rankIndex < sortedNationsForCategory.length ? sortedNationsForCategory[rankIndex].score : null;

  let points = 0;
  if (actualRank === 1) points = 15;
  else if (actualRank === 2) points = 10;
  else if (actualRank === 3) points = 5;
  
  return { points, rank: actualRank, score: actualScore };
};


export default function TeamsPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const [allFetchedTeams, setAllFetchedTeams] = useState<TeamWithScore[]>([]); // Now TeamWithScore
  const [userTeams, setUserTeams] = useState<TeamWithScore[]>([]); // Now TeamWithScore
  const [otherTeams, setOtherTeams] = useState<TeamWithScore[]>([]); // Now TeamWithScore
  const [filteredOtherTeams, setFilteredOtherTeams] = useState<TeamWithScore[]>([]); // Now TeamWithScore
  const [nations, setNations] = useState<Nation[]>([]);
  const [nationsMap, setNationsMap] = useState<Map<string, Nation>>(new Map());
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
        setNationsMap(new Map(nationsData.map(n => [n.id, n])));
      } catch (fetchError: any) {
        console.error("Failed to fetch nations:", fetchError);
        setError(prev => prev ? `${prev}\nNazioni non caricate.` : "Nazioni non caricate.");
        setNations([]);
        setNationsMap(new Map());
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
      setAllFetchedTeams(teamsData); // Temporarily set raw teams; scores will be added
      // Further processing will happen in another useEffect that depends on allFetchedTeams, nations, and global scores
      setIsLoadingData(false); 
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

  // Process teams with scores when all data is available
  useEffect(() => {
    if (isLoadingData || isLoadingGlobalScores || nations.length === 0 || allFetchedTeams.length === 0) {
      // Wait for all data sources
      if (!isLoadingData && !isLoadingGlobalScores && nations.length > 0 && allFetchedTeams.length === 0) {
        // All data sources loaded, but no teams found
        setUserTeams([]);
        setOtherTeams([]);
        setShowCreateTeamButton(!!user);
      }
      return;
    }

    const topSongNations = getTopNationsForCategory(nationGlobalCategorizedScoresMap, nationsMap, 'averageSongScore', 'desc');
    const bottomSongNations = getTopNationsForCategory(nationGlobalCategorizedScoresMap, nationsMap, 'averageSongScore', 'asc'); 
    const topPerformanceNations = getTopNationsForCategory(nationGlobalCategorizedScoresMap, nationsMap, 'averagePerformanceScore', 'desc');
    const topOutfitNations = getTopNationsForCategory(nationGlobalCategorizedScoresMap, nationsMap, 'averageOutfitScore', 'desc');

    const teamsWithCalculatedScores: TeamWithScore[] = allFetchedTeams.map(team => {
      let score = 0;
      (team.founderChoices || []).forEach(nationId => {
        const nation = nationsMap.get(nationId);
        if (nation) {
          score += getPointsForRank(nation.ranking);
        }
      });

      const bestSongPick = getCategoryPickPointsAndRank(team.bestSongNationId, topSongNations);
      score += bestSongPick.points;
      const bestPerformancePick = getCategoryPickPointsAndRank(team.bestPerformanceNationId, topPerformanceNations);
      score += bestPerformancePick.points;
      const bestOutfitPick = getCategoryPickPointsAndRank(team.bestOutfitNationId, topOutfitNations);
      score += bestOutfitPick.points;
      const worstSongPick = getCategoryPickPointsAndRank(team.worstSongNationId, bottomSongNations);
      score += worstSongPick.points;
      
      return { ...team, score };
    });

    if (user) {
      const userSpecificTeams = teamsWithCalculatedScores.filter(team => team.userId === user.uid);
      setUserTeams(userSpecificTeams);
      setShowCreateTeamButton(userSpecificTeams.length === 0);
      setOtherTeams(teamsWithCalculatedScores.filter(team => team.userId !== user.uid));
    } else {
      setUserTeams([]);
      setShowCreateTeamButton(false); 
      setOtherTeams(teamsWithCalculatedScores);
    }

  }, [allFetchedTeams, nations, nationsMap, nationGlobalCategorizedScoresMap, user, isLoadingData, isLoadingGlobalScores]);


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

  if (authIsLoading || isLoadingData || isLoadingGlobalScores && nations.length === 0) {
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
                isOwnTeamCard={true}
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


    