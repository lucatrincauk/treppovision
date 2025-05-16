
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getTeamById } from "@/lib/team-service";
import { getNations } from "@/lib/nation-service";
import { getAllNationsGlobalCategorizedScores } from "@/lib/voting-service"; 
import type { Team, Nation, NationGlobalCategorizedScores, GlobalPrimaSquadraDetail as GlobalPrimaSquadraDetailType, TeamWithScore as TeamWithScoreType } from "@/types";
import { TeamListItem } from "@/components/teams/team-list-item";
import { Loader2, AlertTriangle, Users, ChevronLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Local interface for this page, including bonus flags
interface LocalCategoryPickDetail {
  categoryName: string;
  pickedNationId?: string;
  pickedNationName?: string;
  pickedNationCountryCode?: string;
  actualCategoryRank?: number;
  pickedNationScoreInCategory?: number | null;
  pointsAwarded: number;
  iconName: string; 
}

interface LocalTeamWithScore extends TeamWithScoreType {
  primaSquadraDetails?: GlobalPrimaSquadraDetailType[];
  categoryPicksDetails?: LocalCategoryPickDetail[];
  bonusCampionePronostici?: boolean;
  bonusEnPleinTop5?: boolean;
  rank?: number; 
}

// Helper function to calculate points (copy from leaderboard or factor out if used elsewhere)
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

const getTopNationsForCategory = (
  scoresMap: Map<string, NationGlobalCategorizedScores>,
  currentNationsMap: Map<string, Nation>,
  categoryKey: 'averageSongScore' | 'averagePerformanceScore' | 'averageOutfitScore' | 'overallAverageScore',
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
      if (a.score === null && b.score === null) return 0;
      if (a.score === null) return 1;
      if (b.score === null) return -1;
      if (sortOrder === 'desc') {
        return (b.score as number) - (a.score as number);
      }
      return (a.score as number) - (b.score as number);
    });
};

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


export default function TeamDetailsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const params = useParams();
  const teamId = typeof params.teamId === "string" ? params.teamId : undefined;

  const [teamWithDetails, setTeamWithDetails] = useState<LocalTeamWithScore | null>(null);
  const [allNations, setAllNations] = useState<Nation[]>([]);
  const [nationGlobalCategorizedScoresMap, setNationGlobalCategorizedScoresMap] = useState<Map<string, NationGlobalCategorizedScores>>(new Map());
  
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const nationGlobalCategorizedScoresArray = Array.from(nationGlobalCategorizedScoresMap.entries());


  useEffect(() => {
    async function fetchTeamDetails() {
      if (!teamId) {
        setError("ID Squadra non valido.");
        setIsLoadingData(false);
        return;
      }
      setIsLoadingData(true);
      setError(null);

      try {
        const [fetchedTeam, fetchedNations, fetchedGlobalScoresMap] = await Promise.all([
          getTeamById(teamId),
          getNations(),
          getAllNationsGlobalCategorizedScores() 
        ]);

        if (!fetchedTeam) {
          setError("Squadra non trovata.");
          setIsLoadingData(false);
          return;
        }
        
        setAllNations(fetchedNations);
        setNationGlobalCategorizedScoresMap(fetchedGlobalScoresMap);

        const nationsMap = new Map(fetchedNations.map(n => [n.id, n]));
        
        let score = 0;
        let firstPlacePicksCount = 0;
        let bonusCampionePronostici = false;
        let bonusEnPleinTop5 = false;

        const primaSquadraDetails = (fetchedTeam.founderChoices || []).map(nationId => {
          const nation = nationsMap.get(nationId);
          const points = nation ? getPointsForRank(nation.ranking) : 0;
          score += points;
          if(nation?.ranking === 1) firstPlacePicksCount++;
          return {
            id: nationId,
            name: nation?.name || 'Sconosciuto',
            countryCode: nation?.countryCode || 'xx',
            artistName: nation?.artistName,
            songTitle: nation?.songTitle,
            actualRank: nation?.ranking,
            points,
          };
        });

        if (primaSquadraDetails.length === 3 && primaSquadraDetails.every(detail => detail.actualRank && detail.actualRank >= 1 && detail.actualRank <= 5)) {
          score += 30;
          bonusEnPleinTop5 = true;
        }

        const categoryPicksDetails: LocalCategoryPickDetail[] = [];
        
        const topSongNations = getTopNationsForCategory(fetchedGlobalScoresMap, nationsMap, 'averageSongScore', 'desc');
        const bottomOverallScoreNations = getTopNationsForCategory(fetchedGlobalScoresMap, nationsMap, 'overallAverageScore', 'asc');
        const topPerformanceNations = getTopNationsForCategory(fetchedGlobalScoresMap, nationsMap, 'averagePerformanceScore', 'desc');
        const topOutfitNations = getTopNationsForCategory(fetchedGlobalScoresMap, nationsMap, 'averageOutfitScore', 'desc');

        const bestSongPick = getCategoryPickPointsAndRank(fetchedTeam.bestSongNationId, topSongNations);
        score += bestSongPick.points;
        if(bestSongPick.rank === 1) firstPlacePicksCount++;
        categoryPicksDetails.push({
            categoryName: "Miglior Canzone", pickedNationId: fetchedTeam.bestSongNationId || "", 
            pickedNationName: fetchedTeam.bestSongNationId ? nationsMap.get(fetchedTeam.bestSongNationId)?.name : undefined,
            pickedNationCountryCode: fetchedTeam.bestSongNationId ? nationsMap.get(fetchedTeam.bestSongNationId)?.countryCode : undefined,
            actualCategoryRank: bestSongPick.rank, pointsAwarded: bestSongPick.points, iconName: "Music2", pickedNationScoreInCategory: bestSongPick.score
        });

        const bestPerfPick = getCategoryPickPointsAndRank(fetchedTeam.bestPerformanceNationId, topPerformanceNations);
        score += bestPerfPick.points;
        if(bestPerfPick.rank === 1) firstPlacePicksCount++;
        categoryPicksDetails.push({
            categoryName: "Miglior Performance", pickedNationId: fetchedTeam.bestPerformanceNationId || "",
            pickedNationName: fetchedTeam.bestPerformanceNationId ? nationsMap.get(fetchedTeam.bestPerformanceNationId)?.name : undefined,
            pickedNationCountryCode: fetchedTeam.bestPerformanceNationId ? nationsMap.get(fetchedTeam.bestPerformanceNationId)?.countryCode : undefined,
            actualCategoryRank: bestPerfPick.rank, pointsAwarded: bestPerfPick.points, iconName: "Star", pickedNationScoreInCategory: bestPerfPick.score
        });
        
        const bestOutfitPick = getCategoryPickPointsAndRank(fetchedTeam.bestOutfitNationId, topOutfitNations);
        score += bestOutfitPick.points;
        if(bestOutfitPick.rank === 1) firstPlacePicksCount++;
        categoryPicksDetails.push({
            categoryName: "Miglior Outfit", pickedNationId: fetchedTeam.bestOutfitNationId || "",
            pickedNationName: fetchedTeam.bestOutfitNationId ? nationsMap.get(fetchedTeam.bestOutfitNationId)?.name : undefined,
            pickedNationCountryCode: fetchedTeam.bestOutfitNationId ? nationsMap.get(fetchedTeam.bestOutfitNationId)?.countryCode : undefined,
            actualCategoryRank: bestOutfitPick.rank, pointsAwarded: bestOutfitPick.points, iconName: "Shirt", pickedNationScoreInCategory: bestOutfitPick.score
        });

        const worstPick = getCategoryPickPointsAndRank(fetchedTeam.worstSongNationId, bottomOverallScoreNations);
        score += worstPick.points;
        if(worstPick.rank === 1) firstPlacePicksCount++;
        categoryPicksDetails.push({
            categoryName: "Peggior Canzone", pickedNationId: fetchedTeam.worstSongNationId || "",
            pickedNationName: fetchedTeam.worstSongNationId ? nationsMap.get(fetchedTeam.worstSongNationId)?.name : undefined,
            pickedNationCountryCode: fetchedTeam.worstSongNationId ? nationsMap.get(fetchedTeam.worstSongNationId)?.countryCode : undefined,
            actualCategoryRank: worstPick.rank, pointsAwarded: worstPick.points, iconName: "ThumbsDown", pickedNationScoreInCategory: worstPick.score
        });

        if (firstPlacePicksCount >= 2) {
          score += 5;
          bonusCampionePronostici = true;
        }
        
        const processedTeam: LocalTeamWithScore = {
          ...fetchedTeam,
          score: score,
          primaSquadraDetails: primaSquadraDetails,
          categoryPicksDetails: categoryPicksDetails,
          bonusCampionePronostici,
          bonusEnPleinTop5,
          rank: fetchedTeam.rank 
        };
        setTeamWithDetails(processedTeam);

      } catch (fetchError: any) {
        console.error("Failed to fetch team details:", fetchError);
        setError(fetchError.message || "Errore durante il caricamento dei dettagli della squadra.");
      } finally {
        setIsLoadingData(false);
      }
    }
    if (user || !authLoading) { // Allow fetching if user is loaded or if auth is not relevant for this page
        fetchTeamDetails();
    }
  }, [teamId, user, authLoading]);


  if (authLoading || isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Caricamento dettagli squadra...</p>
        <Link href="/teams/leaderboard">
          <Button variant="outline" size="sm">
            <ChevronLeft className="w-4 h-4 mr-1" /> Torna alla Classifica
          </Button>
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Link href="/teams/leaderboard">
          <Button variant="outline">
            <ChevronLeft className="w-4 h-4 mr-1" /> Torna alla Classifica
          </Button>
        </Link>
      </div>
    );
  }

  if (!teamWithDetails) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Squadra Non Trovata</AlertTitle>
          <AlertDescription>La squadra richiesta non esiste o non è stato possibile caricarla.</AlertDescription>
        </Alert>
         <Link href="/teams/leaderboard">
          <Button variant="outline">
            <ChevronLeft className="w-4 h-4 mr-1" /> Torna alla Classifica
          </Button>
        </Link>
      </div>
    );
  }
  

  return (
    <div className="space-y-6">
      <Link href="/teams/leaderboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
        <ChevronLeft className="w-4 h-4 mr-1" />
        Torna alla Classifica Squadre
      </Link>
      <div className="max-w-xl mx-auto"> 
        <TeamListItem
          team={teamWithDetails}
          allNations={allNations}
          nationGlobalCategorizedScoresArray={nationGlobalCategorizedScoresArray}
          isLeaderboardPodiumDisplay={true} 
          disableEdit={true} 
          isOwnTeamCard={user?.uid === teamWithDetails.userId}
        />
      </div>
    </div>
  );
}

