
"use client"; 

import { useEffect, useState } from "react";
import { getTeamsByUserId, listenToTeams } from "@/lib/team-service";
import { getNations } from "@/lib/nation-service";
import { listenToAllVotesForAllNationsCategorized } from "@/lib/voting-service"; 
import type { Team, Nation, NationGlobalCategorizedScores } from "@/types";
import { TeamListItem } from "@/components/teams/team-list-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; 
import { PlusCircle, Users, Loader2, Edit, Search, ThumbsUp, Star, Music2, Shirt, BadgeCheck, UserCircle, ThumbsDown } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { TeamsSubNavigation } from "@/components/teams/teams-sub-navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { cn } from "@/lib/utils";

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
  sortOrder: 'desc' | 'asc' = 'desc',
  count: number = 1 // Get top 1 by default
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
        return (b.score as number) - (a.score as number);
      }
      return (a.score as number) - (b.score as number);
    })
    .slice(0, count);
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
  const [allFetchedTeams, setAllFetchedTeams] = useState<TeamWithScore[]>([]);
  const [userTeams, setUserTeams] = useState<TeamWithScore[]>([]);
  const [otherTeams, setOtherTeams] = useState<TeamWithScore[]>([]);
  const [filteredOtherTeams, setFilteredOtherTeams] = useState<TeamWithScore[]>([]);
  const [nations, setNations] = useState<Nation[]>([]);
  const [nationsMap, setNationsMap] = useState<Map<string, Nation>>(new Map());
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateTeamButton, setShowCreateTeamButton] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [nationGlobalCategorizedScoresMap, setNationGlobalCategorizedScoresMap] = useState<Map<string, NationGlobalCategorizedScores>>(new Map());
  const [isLoadingGlobalScores, setIsLoadingGlobalScores] = useState(true);

  // Top nations for categories (for "correct pick" indication)
  const [topSongNationId, setTopSongNationId] = useState<string | null>(null);
  const [worstSongNationId, setWorstSongNationId] = useState<string | null>(null);
  const [topPerfNationId, setTopPerfNationId] = useState<string | null>(null);
  const [topOutfitNationId, setTopOutfitNationId] = useState<string | null>(null);

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
      setAllFetchedTeams(teamsData); 
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
      if (nationsMap.size > 0 && scores.size > 0) {
        setTopSongNationId(getTopNationsForCategory(scores, nationsMap, 'averageSongScore', 'desc', 1)[0]?.id || null);
        setWorstSongNationId(getTopNationsForCategory(scores, nationsMap, 'averageSongScore', 'asc', 1)[0]?.id || null);
        setTopPerfNationId(getTopNationsForCategory(scores, nationsMap, 'averagePerformanceScore', 'desc', 1)[0]?.id || null);
        setTopOutfitNationId(getTopNationsForCategory(scores, nationsMap, 'averageOutfitScore', 'desc', 1)[0]?.id || null);
      }
      setIsLoadingGlobalScores(false);
    });
    return () => unsubscribeGlobalScores();
  }, [nationsMap]); // Re-run if nationsMap changes, to update top picks

  // Process teams with scores when all data is available
  useEffect(() => {
    if (isLoadingData || isLoadingGlobalScores || nations.length === 0 || allFetchedTeams.length === 0) {
      if (!isLoadingData && !isLoadingGlobalScores && nations.length > 0 && allFetchedTeams.length === 0) {
        setUserTeams([]);
        setOtherTeams([]);
        setShowCreateTeamButton(!!user);
      }
      return;
    }

    const topSongNationsForScoring = getTopNationsForCategory(nationGlobalCategorizedScoresMap, nationsMap, 'averageSongScore', 'desc', 3);
    const bottomSongNationsForScoring = getTopNationsForCategory(nationGlobalCategorizedScoresMap, nationsMap, 'averageSongScore', 'asc', 3); 
    const topPerformanceNationsForScoring = getTopNationsForCategory(nationGlobalCategorizedScoresMap, nationsMap, 'averagePerformanceScore', 'desc', 3);
    const topOutfitNationsForScoring = getTopNationsForCategory(nationGlobalCategorizedScoresMap, nationsMap, 'averageOutfitScore', 'desc', 3);

    const teamsWithCalculatedScores: TeamWithScore[] = allFetchedTeams.map(team => {
      let score = 0;
      (team.founderChoices || []).forEach(nationId => {
        const nation = nationsMap.get(nationId);
        if (nation) {
          score += getPointsForRank(nation.ranking);
        }
      });

      const bestSongPick = getCategoryPickPointsAndRank(team.bestSongNationId, topSongNationsForScoring);
      score += bestSongPick.points;
      const bestPerformancePick = getCategoryPickPointsAndRank(team.bestPerformanceNationId, topPerformanceNationsForScoring);
      score += bestPerformancePick.points;
      const bestOutfitPick = getCategoryPickPointsAndRank(team.bestOutfitNationId, topOutfitNationsForScoring);
      score += bestOutfitPick.points;
      const worstSongPick = getCategoryPickPointsAndRank(team.worstSongNationId, bottomSongNationsForScoring);
      score += worstSongPick.points;
      
      return { ...team, score };
    });

    if (user) {
      const userSpecificTeams = teamsWithCalculatedScores.filter(team => team.userId === user.uid);
      setUserTeams(userSpecificTeams);
      setShowCreateTeamButton(userSpecificTeams.length === 0);
      setOtherTeams(teamsWithCalculatedScores.filter(team => team.userId !== user.uid).sort((a, b) => (b.score ?? 0) - (a.score ?? 0)));
    } else {
      setUserTeams([]);
      setShowCreateTeamButton(false); 
      setOtherTeams(teamsWithCalculatedScores.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)));
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

  const renderCategoryPickCell = (team: TeamWithScore, category: 'bestSong' | 'bestPerf' | 'bestOutfit' | 'worstSong') => {
    let nationId: string | undefined;
    let topId: string | null = null;
    let IconComponent: React.ElementType = Music2;

    switch (category) {
      case 'bestSong':
        nationId = team.bestSongNationId;
        topId = topSongNationId;
        IconComponent = Music2;
        break;
      case 'bestPerf':
        nationId = team.bestPerformanceNationId;
        topId = topPerfNationId;
        IconComponent = Star;
        break;
      case 'bestOutfit':
        nationId = team.bestOutfitNationId;
        topId = topOutfitNationId;
        IconComponent = Shirt;
        break;
      case 'worstSong':
        nationId = team.worstSongNationId;
        topId = worstSongNationId;
        IconComponent = ThumbsDown;
        break;
    }
    const nation = nationId ? nationsMap.get(nationId) : null;
    const isCorrectPick = nationId === topId;

    if (!nation) return <span className="text-muted-foreground text-xs">N/D</span>;

    return (
      <div className="flex items-center gap-1.5">
        <Image
          src={`https://flagcdn.com/w20/${nation.countryCode.toLowerCase()}.png`}
          alt={nation.name}
          width={20}
          height={13}
          className="rounded-sm border border-border/30 object-contain flex-shrink-0"
          data-ai-hint={`${nation.name} flag icon`}
        />
        <span className="text-xs truncate" title={`${nation.name} - ${nation.artistName} - ${nation.songTitle}`}>{nation.name}</span>
        {isCorrectPick && <IconComponent className="h-3 w-3 text-accent flex-shrink-0" />}
      </div>
    );
  };


  if (authIsLoading || (isLoadingData && nations.length === 0) || (isLoadingGlobalScores && nations.length > 0)) {
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
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Squadra</TableHead>
                    <TableHead className="text-right w-[80px]">Punti</TableHead>
                    <TableHead className="hidden lg:table-cell">Pronostici Treppovision</TableHead>
                    <TableHead className="hidden md:table-cell">Miglior Canzone</TableHead>
                    <TableHead className="hidden md:table-cell">Miglior Performance</TableHead>
                    <TableHead className="hidden xl:table-cell">Miglior Outfit</TableHead>
                    <TableHead className="hidden xl:table-cell">Peggior Canzone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOtherTeams.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell>
                        <div className="font-medium text-sm">{team.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <UserCircle className="h-3 w-3" />
                          {team.creatorDisplayName}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-primary">{team.score ?? 0}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex flex-col gap-1">
                          {(team.founderChoices || []).map(nationId => {
                            const nation = nationsMap.get(nationId);
                            if (!nation) return <span key={nationId} className="text-xs text-muted-foreground">N/D</span>;
                            return (
                              <div key={nationId} className="flex items-center gap-1.5">
                                <Image
                                  src={`https://flagcdn.com/w20/${nation.countryCode.toLowerCase()}.png`}
                                  alt={nation.name}
                                  width={20}
                                  height={13}
                                  className="rounded-sm border border-border/30 object-contain flex-shrink-0"
                                  data-ai-hint={`${nation.name} flag icon`}
                                />
                                <span className="text-xs truncate" title={`${nation.name} - ${nation.artistName} - ${nation.songTitle}`}>{nation.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{renderCategoryPickCell(team, 'bestSong')}</TableCell>
                      <TableCell className="hidden md:table-cell">{renderCategoryPickCell(team, 'bestPerf')}</TableCell>
                      <TableCell className="hidden xl:table-cell">{renderCategoryPickCell(team, 'bestOutfit')}</TableCell>
                      <TableCell className="hidden xl:table-cell">{renderCategoryPickCell(team, 'worstSong')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : searchTerm && nations.length > 0 && !isLoadingData ? (
          <p className="text-center text-muted-foreground py-10">Nessuna squadra trovata corrispondente alla tua ricerca.</p>
        ) : filteredOtherTeams.length === 0 && !searchTerm && allFetchedTeams.length > 0 && nations.length > 0 && !isLoadingData ? (
           <p className="text-center text-muted-foreground py-10">Nessun'altra squadra creata dagli utenti.</p>
        ) : null }
      </section>
    </div>
  );
}

