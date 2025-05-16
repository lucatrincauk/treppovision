
"use client"; 

import { useEffect, useState, useMemo } from "react";
import { getTeamsByUserId, listenToTeams } from "@/lib/team-service";
import { getNations } from "@/lib/nation-service";
import { listenToAllVotesForAllNationsCategorized } from "@/lib/voting-service"; 
import type { Team, Nation, NationGlobalCategorizedScores, TeamWithScore, CategoryPickDetail as GlobalCategoryPickDetail, PrimaSquadraDetail as GlobalPrimaSquadraDetail } from "@/types"; // Import new types if defined globally
import { TeamListItem } from "@/components/teams/team-list-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; 
import { PlusCircle, Users, Loader2, Edit, Search, Music2, Star, Shirt, UserCircle as UserIcon, ThumbsDown, Lock } from "lucide-react"; 
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { TeamsSubNavigation } from "@/components/teams/teams-sub-navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getTeamsLockedStatus } from "@/lib/actions/team-actions";
import { getLeaderboardLockedStatus } from "@/lib/actions/admin-actions"; 

// Local interface definitions if not globally defined in types.ts
interface PrimaSquadraDetail {
  id: string;
  name: string;
  countryCode: string;
  artistName?: string;
  songTitle?: string;
  actualRank?: number;
  points: number;
}

interface CategoryPickDetail {
  categoryName: string;
  pickedNationId?: string;
  pickedNationName?: string;
  pickedNationCountryCode?: string;
  actualCategoryRank?: number; 
  pickedNationScoreInCategory?: number | null; 
  pointsAwarded: number;
  iconName: string; 
}


// Helper function to calculate points for a given rank (Eurovision rank)
const getPointsForRank = (rank?: number): number => {
  if (rank === undefined || rank === null || rank === 0) return 0;
  if (rank === 1) return 30;
  if (rank === 2) return 25;
  if (rank === 3) return 20;
  if (rank === 4) return 18;
  if (rank === 5) return 16;
  if (rank === 6) return 14;
  if (rank >= 7 && rank <= 10) return 12;
  if (rank >= 11 && rank <= 12) return 10;
  if (rank >= 13 && rank <= 24) return -5;
  if (rank === 25) return -10;
  if (rank === 26) return -15; 
  return 0;
};

// Helper to get top/bottom N nations for a category based on global user scores
const getTopNationsForCategory = (
  scoresMap: Map<string, NationGlobalCategorizedScores>,
  currentNationsMap: Map<string, Nation>,
  categoryKey: 'averageSongScore' | 'averagePerformanceScore' | 'averageOutfitScore',
  sortOrder: 'desc' | 'asc' = 'desc',
): Array<{ id: string; name: string; score: number | null }> => { 
  if (!scoresMap || scoresMap.size === 0 || !currentNationsMap || currentNationsMap.size === 0) return [];
  return Array.from(scoresMap.entries())
    .map(([nationId, scores]) => ({
      id: nationId,
      name: currentNationsMap.get(nationId)?.name || 'Sconosciuto',
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
    });
};

// Helper to get points and rank for a category pick
const getCategoryPickPointsAndRank = (
  pickedNationId: string | undefined,
  sortedNationsForCategory: Array<{ id: string; score: number | null }>
): { points: number; rank?: number; score?: number | null } => {
  if (!pickedNationId) return { points: 0, rank: undefined, score: null };
  
  const rankIndex = sortedNationsForCategory.findIndex(n => n.id === pickedNationId);
  const actualRank = rankIndex !== -1 ? rankIndex + 1 : undefined;
  const actualScore = actualRank !== undefined && rankIndex < sortedNationsForCategory.length ? sortedNationsForCategory[rankIndex].score : null;

  let points = 0;
  if (actualRank === 1) points = 15;
  else if (actualRank === 2) points = 10;
  else if (actualRank === 3) points = 5;
  
  return { points, rank: actualRank, score: actualScore };
};


export default function TeamsPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const [allFetchedTeams, setAllFetchedTeams] = useState<Team[]>([]);
  const [userTeams, setUserTeams] = useState<TeamWithScore[]>([]);
  const [otherTeams, setOtherTeams] = useState<TeamWithScore[]>([]);
  const [filteredOtherTeams, setFilteredOtherTeams] = useState<TeamWithScore[]>([]);
  
  const [allNations, setAllNations] = useState<Nation[]>([]);
  const [nationsMap, setNationsMap] = useState<Map<string, Nation>>(new Map());
  
  const [isLoadingNations, setIsLoadingNations] = useState(true);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateTeamButton, setShowCreateTeamButton] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [nationGlobalCategorizedScoresMap, setNationGlobalCategorizedScoresMap] = useState<Map<string, NationGlobalCategorizedScores>>(new Map());
  const [isLoadingGlobalScores, setIsLoadingGlobalScores] = useState(true);
  const [teamsLockedAdmin, setTeamsLockedAdmin] = useState<boolean | null>(null);
  const [leaderboardLockedAdmin, setLeaderboardLockedAdmin] = useState<boolean | null>(null);


  useEffect(() => {
    async function fetchInitialSettings() {
      try {
        const [teamsLock, leaderboardLock] = await Promise.all([
          getTeamsLockedStatus(),
          getLeaderboardLockedStatus()
        ]);
        setTeamsLockedAdmin(teamsLock);
        setLeaderboardLockedAdmin(leaderboardLock);
      } catch (err) {
        console.error("Failed to fetch admin lock statuses:", err);
        setTeamsLockedAdmin(false);
        setLeaderboardLockedAdmin(false);
      }
    }
    fetchInitialSettings();
  }, []);
  
  useEffect(() => {
    async function fetchNationsData() {
      setIsLoadingNations(true);
      try {
        const nationsData = await getNations();
        setAllNations(nationsData);
        setNationsMap(new Map(nationsData.map(n => [n.id, n])));
      } catch (fetchError: any) {
        console.error("Failed to fetch nations:", fetchError);
        setError(prev => prev ? `${prev}\nNazioni non caricate.` : "Nazioni non caricate.");
        setAllNations([]);
        setNationsMap(new Map());
      } finally {
        setIsLoadingNations(false);
      }
    }
    fetchNationsData();
  }, []);

  useEffect(() => {
    setIsLoadingGlobalScores(true);
    const unsubscribeGlobalScores = listenToAllVotesForAllNationsCategorized((scores) => {
      setNationGlobalCategorizedScoresMap(scores);
      setIsLoadingGlobalScores(false);
    });
    return () => unsubscribeGlobalScores();
  }, []); 

  useEffect(() => {
    setIsLoadingTeams(true);
    setError(null);
    const unsubscribeTeams = listenToTeams((teamsData) => {
      setAllFetchedTeams(teamsData);
      setIsLoadingTeams(false);
    }, (err) => {
      console.error("Failed to fetch teams:", err);
      setError(err.message || "Si è verificato un errore durante il caricamento delle squadre.");
      setIsLoadingTeams(false);
    });
    return () => unsubscribeTeams();
  }, []);

  const processedAndScoredTeams = useMemo(() => {
    if (isLoadingNations || isLoadingTeams || isLoadingGlobalScores || allNations.length === 0 || leaderboardLockedAdmin === null) {
      return [];
    }

    return allFetchedTeams.map(team => {
      let scoreValue: number | undefined = 0;
      
      const primaSquadraDetails: PrimaSquadraDetail[] = (team.founderChoices || []).map(nationId => {
        const nation = nationsMap.get(nationId);
        const points = nation ? getPointsForRank(nation.ranking) : 0;
        if(scoreValue !== undefined) scoreValue += points;
        return {
          id: nationId,
          name: nation?.name || 'Sconosciuto',
          countryCode: nation?.countryCode || 'xx',
          artistName: nation?.artistName,
          songTitle: nation?.songTitle,
          actualRank: nation?.ranking,
          points: points,
        };
      }).sort((a, b) => (a.actualRank ?? Infinity) - (b.actualRank ?? Infinity));

      const topSongNationsList = getTopNationsForCategory(nationGlobalCategorizedScoresMap, nationsMap, 'averageSongScore', 'desc');
      const worstSongNationsList = getTopNationsForCategory(nationGlobalCategorizedScoresMap, nationsMap, 'averageSongScore', 'asc');
      const topPerfNationsList = getTopNationsForCategory(nationGlobalCategorizedScoresMap, nationsMap, 'averagePerformanceScore', 'desc');
      const topOutfitNationsList = getTopNationsForCategory(nationGlobalCategorizedScoresMap, nationsMap, 'averageOutfitScore', 'desc');
      
      const categoryPicksDetails: CategoryPickDetail[] = [];

      const bestSongPick = getCategoryPickPointsAndRank(team.bestSongNationId, topSongNationsList);
      if(scoreValue !== undefined) scoreValue += bestSongPick.points;
      categoryPicksDetails.push({
        categoryName: "Miglior Canzone", pickedNationId: team.bestSongNationId, 
        pickedNationName: team.bestSongNationId ? nationsMap.get(team.bestSongNationId)?.name : undefined,
        pickedNationCountryCode: team.bestSongNationId ? nationsMap.get(team.bestSongNationId)?.countryCode : undefined,
        actualCategoryRank: bestSongPick.rank, pointsAwarded: bestSongPick.points, iconName: "Music2", pickedNationScoreInCategory: bestSongPick.score,
      });

      const bestPerfPick = getCategoryPickPointsAndRank(team.bestPerformanceNationId, topPerfNationsList);
      if(scoreValue !== undefined) scoreValue += bestPerfPick.points;
      categoryPicksDetails.push({
        categoryName: "Miglior Performance", pickedNationId: team.bestPerformanceNationId,
        pickedNationName: team.bestPerformanceNationId ? nationsMap.get(team.bestPerformanceNationId)?.name : undefined,
        pickedNationCountryCode: team.bestPerformanceNationId ? nationsMap.get(team.bestPerformanceNationId)?.countryCode : undefined,
        actualCategoryRank: bestPerfPick.rank, pointsAwarded: bestPerfPick.points, iconName: "Star", pickedNationScoreInCategory: bestPerfPick.score,
      });
      
      const bestOutfitPick = getCategoryPickPointsAndRank(team.bestOutfitNationId, topOutfitNationsList);
      if(scoreValue !== undefined) scoreValue += bestOutfitPick.points;
      categoryPicksDetails.push({
        categoryName: "Miglior Outfit", pickedNationId: team.bestOutfitNationId,
        pickedNationName: team.bestOutfitNationId ? nationsMap.get(team.bestOutfitNationId)?.name : undefined,
        pickedNationCountryCode: team.bestOutfitNationId ? nationsMap.get(team.bestOutfitNationId)?.countryCode : undefined,
        actualCategoryRank: bestOutfitPick.rank, pointsAwarded: bestOutfitPick.points, iconName: "Shirt", pickedNationScoreInCategory: bestOutfitPick.score,
      });

      const worstSongPick = getCategoryPickPointsAndRank(team.worstSongNationId, worstSongNationsList);
      if(scoreValue !== undefined) scoreValue += worstSongPick.points;
      categoryPicksDetails.push({
        categoryName: "Peggior Canzone", pickedNationId: team.worstSongNationId,
        pickedNationName: team.worstSongNationId ? nationsMap.get(team.worstSongNationId)?.name : undefined,
        pickedNationCountryCode: team.worstSongNationId ? nationsMap.get(team.worstSongNationId)?.countryCode : undefined,
        actualCategoryRank: worstSongPick.rank, pointsAwarded: worstSongPick.points, iconName: "ThumbsDown", pickedNationScoreInCategory: worstSongPick.score,
      });
      
      if (leaderboardLockedAdmin) {
        scoreValue = undefined;
      }
      
      // Explicitly cast to TeamWithScore
      const teamWithDetails: TeamWithScore = {
        ...team,
        score: scoreValue,
        primaSquadraDetails: primaSquadraDetails as GlobalPrimaSquadraDetail[],
        categoryPicksDetails: categoryPicksDetails as GlobalCategoryPickDetail[],
      };
      return teamWithDetails;

    });
  }, [allFetchedTeams, allNations, nationsMap, nationGlobalCategorizedScoresMap, isLoadingNations, isLoadingTeams, isLoadingGlobalScores, leaderboardLockedAdmin]);

  useEffect(() => {
    if (authIsLoading || teamsLockedAdmin === null) return; 

    if (user) {
      const userSpecificTeams = processedAndScoredTeams.filter(team => team.userId === user.uid);
      setUserTeams(userSpecificTeams);
      setShowCreateTeamButton(userSpecificTeams.length === 0 && !teamsLockedAdmin);
      setOtherTeams(processedAndScoredTeams.filter(team => team.userId !== user.uid).sort((a, b) => a.name.localeCompare(b.name)));
    } else {
      setUserTeams([]);
      setShowCreateTeamButton(false); 
      setOtherTeams(processedAndScoredTeams.sort((a, b) => a.name.localeCompare(b.name)));
    }
  }, [processedAndScoredTeams, user, authIsLoading, teamsLockedAdmin]);

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
       {user && !showCreateTeamButton && userTeams.length > 0 && !teamsLockedAdmin && (
        <Button asChild variant="default" size="lg">
            <Link href={`/teams/${userTeams[0].id}/edit`}>
                <Edit className="mr-2 h-5 w-5"/>
                Modifica la Tua Squadra
            </Link>
        </Button>
      )}
       {user && teamsLockedAdmin && (
         <Button variant="outline" size="lg" disabled>
            <Lock className="mr-2 h-5 w-5"/>
            Creazione/Modifica Bloccata
        </Button>
      )}
    </div>
  );

  const renderCategoryPickCell = (team: TeamWithScore, category: 'bestSong' | 'bestPerf' | 'bestOutfit' | 'worstSong', leaderboardLocked: boolean | null) => {
    let nationId: string | undefined;
    let IconComponent: React.ElementType = Music2; // Default Icon
    let isCorrectPick = false;
    let topId: string | null = null;
    let rankInCategory: number | undefined = undefined;
    
    // Determine top nation for the category
    if (nationGlobalCategorizedScoresMap.size > 0 && nationsMap.size > 0) {
        const getTopNationId = (catKey: 'averageSongScore' | 'averagePerformanceScore' | 'averageOutfitScore', order: 'asc' | 'desc') => {
            return getTopNationsForCategory(nationGlobalCategorizedScoresMap, nationsMap, catKey, order)[0]?.id || null;
        };
        const getRankForNationInCategory = (nationIdToCheck?: string, catKey?: 'averageSongScore' | 'averagePerformanceScore' | 'averageOutfitScore', order: 'asc' | 'desc' = 'desc') => {
            if (!nationIdToCheck || !catKey) return undefined;
            const sortedList = getTopNationsForCategory(nationGlobalCategorizedScoresMap, nationsMap, catKey, order);
            const index = sortedList.findIndex(n => n.id === nationIdToCheck);
            return index !== -1 ? index + 1 : undefined;
        };


        switch(category) {
            case 'bestSong': 
                nationId = team.bestSongNationId;
                topId = getTopNationId('averageSongScore', 'desc');
                IconComponent = Music2;
                rankInCategory = getRankForNationInCategory(nationId, 'averageSongScore', 'desc');
                break;
            case 'bestPerf': 
                nationId = team.bestPerformanceNationId;
                topId = getTopNationId('averagePerformanceScore', 'desc');
                IconComponent = Star;
                rankInCategory = getRankForNationInCategory(nationId, 'averagePerformanceScore', 'desc');
                break;
            case 'bestOutfit': 
                nationId = team.bestOutfitNationId;
                topId = getTopNationId('averageOutfitScore', 'desc');
                IconComponent = Shirt;
                rankInCategory = getRankForNationInCategory(nationId, 'averageOutfitScore', 'desc');
                break;
            case 'worstSong': 
                nationId = team.worstSongNationId;
                topId = getTopNationId('averageSongScore', 'asc');
                IconComponent = ThumbsDown;
                rankInCategory = getRankForNationInCategory(nationId, 'averageSongScore', 'asc');
                break;
        }
        isCorrectPick = nationId === topId && nationId !== undefined;
    } else {
        // Fallback if scores are not loaded - just get nation and icon
        switch(category) {
            case 'bestSong': nationId = team.bestSongNationId; IconComponent = Music2; break;
            case 'bestPerf': nationId = team.bestPerformanceNationId; IconComponent = Star; break;
            case 'bestOutfit': nationId = team.bestOutfitNationId; IconComponent = Shirt; break;
            case 'worstSong': nationId = team.worstSongNationId; IconComponent = ThumbsDown; break;
        }
    }

    const nation = nationId ? nationsMap.get(nationId) : null;
    
    if (!nation) return <span className="text-muted-foreground text-xs">N/D</span>;

    let rankSuffix = "";
    if (category === "Peggior Canzone") rankSuffix = " peggiore";
    else if (category !== "Miglior Canzone") rankSuffix = " in cat.";


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
        <div className="flex flex-col items-start">
            <span className="text-xs truncate" title={`${nation.name} - ${nation.artistName} - ${nation.songTitle}`}>
                {nation.name}
                {!leaderboardLocked && rankInCategory && (
                     <span className="text-muted-foreground/80 ml-0.5">({rankInCategory}°{rankSuffix})</span>
                )}
            </span>
        </div>
        {!leaderboardLocked && isCorrectPick && <IconComponent className="h-3 w-3 text-accent flex-shrink-0" />}
      </div>
    );
  };

  if (authIsLoading || isLoadingNations || isLoadingTeams || isLoadingGlobalScores || teamsLockedAdmin === null || leaderboardLockedAdmin === null) {
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
                if (authButtonDialogTrigger.tagName === 'BUTTON') { authButtonDialogTrigger.click(); }
                else if (authButtonDialogTrigger.parentElement?.tagName === 'BUTTON') { (authButtonDialogTrigger.parentElement as HTMLElement).click(); }
              }
            }}>Accedi</Link> o <Link href="#" className="font-bold hover:underline" onClick={() => {
               const authButtonDialogTrigger = document.querySelector('button[aria-label="Open authentication dialog"], button>svg.lucide-log-in') as HTMLElement | null;
              if (authButtonDialogTrigger) {
                if (authButtonDialogTrigger.tagName === 'BUTTON') { authButtonDialogTrigger.click(); }
                else if (authButtonDialogTrigger.parentElement?.tagName === 'BUTTON') { (authButtonDialogTrigger.parentElement as HTMLElement).click(); }
              }
            }}>registrati</Link> per creare o modificare la tua squadra.
          </AlertDescription>
        </Alert>
      )}
      
      {user && userTeams.length > 0 && allNations.length > 0 && (
        <section className="mb-12 pt-6 border-t border-border">
          <div className="flex items-center gap-3 mb-6">
             {/* Removed ThumbsUp Icon */}
            <h2 className="text-3xl font-semibold tracking-tight text-secondary">
              La Mia Squadra
            </h2>
          </div>
          {userTeams.map(team => (
            <div key={team.id} className="mb-6">
              <TeamListItem 
                team={team} 
                allNations={allNations}
                nationGlobalCategorizedScoresMap={nationGlobalCategorizedScoresMap}
                isOwnTeamCard={true}
              />
            </div>
          ))}
        </section>
      )}

      <section className="pt-6 border-t border-border">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="text-3xl font-semibold tracking-tight text-primary flex-grow text-left">
            Altre Squadre
          </h2>
          <div className="relative w-full md:w-auto md:min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cerca squadre per nome o utente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
              aria-label="Cerca altre squadre"
            />
          </div>
        </div>

        {allNations.length === 0 && allFetchedTeams.length > 0 && (
          <Alert variant="destructive">
            <Users className="h-4 w-4" />
            <AlertTitle>Dati Nazioni Mancanti</AlertTitle>
            <AlertDescription>
              Impossibile caricare i dati delle nazioni. Le squadre non possono essere visualizzate correttamente.
            </AlertDescription>
          </Alert>
        )}

        {allFetchedTeams.length === 0 && allNations.length > 0 && !isLoadingNations && !isLoadingTeams && (
          <Alert>
            <Users className="h-4 w-4" />
            <AlertTitle>Nessuna Squadra Ancora!</AlertTitle>
            <AlertDescription>
              Non ci sono ancora squadre. {user && showCreateTeamButton ? "Sii il primo a crearne una!" : !user ? "Effettua il login per crearne una." : ""}
            </AlertDescription>
          </Alert>
        )}
      
       {allNations.length === 0 && allFetchedTeams.length === 0 && !isLoadingNations && !isLoadingTeams && (
          <Alert variant="destructive">
            <Users className="h-4 w-4" />
            <AlertTitle>Dati Iniziali Mancanti</AlertTitle>
            <AlertDescription>
              Nessuna nazione trovata in Firestore. Le nazioni sono necessarie per creare e visualizzare le squadre.
              Assicurati che la collezione 'nations' sia popolata.
            </AlertDescription>
          </Alert>
       )}

        {filteredOtherTeams.length > 0 && allNations.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px] sm:w-[250px]">Squadra</TableHead>
                    {!leaderboardLockedAdmin && <TableHead className="w-[80px] text-right">Punti</TableHead>}
                    <TableHead>Pronostici TreppoVision</TableHead>
                    <TableHead className="hidden md:table-cell">Miglior Canzone</TableHead>
                    <TableHead className="hidden md:table-cell">Miglior Performance</TableHead>
                    <TableHead className="hidden lg:table-cell">Miglior Outfit</TableHead>
                    <TableHead className="hidden lg:table-cell">Peggior Canzone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOtherTeams.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell>
                        <div className="font-medium text-sm">{team.name}</div>
                        {team.creatorDisplayName && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1" title={`Utente: ${team.creatorDisplayName}`}>
                            <UserIcon className="h-3 w-3" />
                            {team.creatorDisplayName}
                          </div>
                        )}
                      </TableCell>
                       {!leaderboardLockedAdmin && (
                        <TableCell className="text-right font-semibold">
                          {typeof team.score === 'number' ? team.score : 'N/D'}
                        </TableCell>
                       )}
                      <TableCell>
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
                                <span className="text-xs truncate" title={`${nation.name} - ${nation.artistName} - ${nation.songTitle}`}>
                                    {nation.name}
                                    {!leaderboardLockedAdmin && nation.ranking && nation.ranking > 0 && (
                                        <span className="text-muted-foreground/80 ml-0.5">({nation.ranking}°)</span>
                                    )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{renderCategoryPickCell(team, 'bestSong', leaderboardLockedAdmin)}</TableCell>
                      <TableCell className="hidden md:table-cell">{renderCategoryPickCell(team, 'bestPerf', leaderboardLockedAdmin)}</TableCell>
                      <TableCell className="hidden lg:table-cell">{renderCategoryPickCell(team, 'bestOutfit', leaderboardLockedAdmin)}</TableCell>
                      <TableCell className="hidden lg:table-cell">{renderCategoryPickCell(team, 'worstSong', leaderboardLockedAdmin)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : searchTerm && allNations.length > 0 && !isLoadingNations && !isLoadingTeams ? (
          <p className="text-center text-muted-foreground py-10">Nessuna squadra trovata corrispondente alla tua ricerca.</p>
        ) : filteredOtherTeams.length === 0 && !searchTerm && allFetchedTeams.length > 0 && allNations.length > 0 && !isLoadingNations && !isLoadingTeams ? (
           <p className="text-center text-muted-foreground py-10">Nessun'altra squadra creata dagli utenti.</p>
        ) : null }
      </section>
    </div>
  );
}

    