
"use client";

import { useEffect, useState, useMemo, memo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getTeamById, getTeams } from "@/lib/team-service";
import { getNations } from "@/lib/nation-service";
import { getAllNationsGlobalCategorizedScores } from "@/lib/voting-service";
import type { Team, Nation, NationGlobalCategorizedScores, GlobalPrimaSquadraDetail, TeamWithScore as TeamWithScoreType, GlobalCategoryPickDetail as BaseGlobalCategoryPickDetail } from "@/types";
import { TeamListItem } from "@/components/teams/team-list-item";
import { Loader2, AlertTriangle, Users, ChevronLeft, ChevronRight, Award, UserCircle, Music2, Star, Shirt, ThumbsDown, Info, ListChecks, Flag } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LocalCategoryPickDetail extends BaseGlobalCategoryPickDetail {
  iconName: string;
}

interface LocalTeamWithScore extends TeamWithScoreType {
  primaSquadraScore: number;
  eurovisionPicksScore: number;
  treppoScoreCategoryPicksScore: number;
  bonusTotalScore: number;
  rank?: number;
  isTied?: boolean;
  bonusCampionePronostici?: boolean;
  bonusGranCampionePronostici?: boolean;
  bonusEnPleinTop5?: boolean;
}

const getPointsForEurovisionRank = (rank?: number): number => {
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
  scoresMap: Map<string, NationGlobalCategorizedScores> | null,
  nationsMap: Map<string, Nation>,
  categoryKey: keyof Omit<NationGlobalCategorizedScores, 'voteCount'> | keyof Nation,
  sortOrder: 'desc' | 'asc' = 'desc'
): Array<{ id: string; name: string; score: number | null; artistName?: string; songTitle?: string; countryCode?: string; }> => {
   const nationsArray = Array.from(nationsMap.values());
   if (!nationsArray || nationsArray.length === 0) return [];
  return nationsArray
    .map(nation => {
      let scoreValue: number | null = null;
      if (scoresMap && typeof categoryKey === 'string' && (scoresMap.get(nation.id) || {})[categoryKey as keyof NationGlobalCategorizedScores] !== undefined) {
        scoreValue = (scoresMap.get(nation.id) as any)?.[categoryKey] ?? null;
      } else if (!scoresMap && typeof categoryKey === 'string' && categoryKey in nation) {
        scoreValue = (nation as any)[categoryKey] ?? null;
      }
      return {
        id: nation.id,
        name: nation.name || 'Sconosciuto',
        score: scoreValue,
        artistName: nation.artistName,
        songTitle: nation.songTitle,
        countryCode: nation.countryCode
      };
    })
    .filter(item => {
      if (!scoresMap && typeof categoryKey === 'string' && (categoryKey === 'ranking' || categoryKey === 'juryRank' || categoryKey === 'televoteRank')) { 
             return typeof item.score === 'number' && item.score > 0; // Ranks must be > 0
      }
      if (scoresMap && typeof categoryKey === 'string' && (scoresMap.get(item.id) || {})[categoryKey as keyof NationGlobalCategorizedScores] !== undefined) {
         if (categoryKey === 'overallAverageScore' && sortOrder === 'asc') { 
             return typeof item.score === 'number' && (scoresMap.get(item.id)?.voteCount || 0) > 0;
        }
        return typeof item.score === 'number' && (scoresMap.get(item.id)?.voteCount || 0) > 0;
      }
      return false;
    })
    .sort((a, b) => {
      if (a.score === null && b.score === null) return 0;
      if (a.score === null) return 1;
      if (b.score === null) return -1;
      if (a.score === b.score) {
        if (scoresMap && typeof categoryKey === 'string' && (scoresMap.get(a.id) || {})[categoryKey as keyof NationGlobalCategorizedScores] !== undefined) {
            const voteCountA = scoresMap.get(a.id)?.voteCount || 0;
            const voteCountB = scoresMap.get(b.id)?.voteCount || 0;
            if (voteCountA !== voteCountB) {
            return sortOrder === 'desc' ? voteCountB - voteCountA : voteCountA - voteCountB;
            }
        }
        return a.name.localeCompare(b.name);
      }
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
  if (!pickedNationId || !sortedNationsForCategory || sortedNationsForCategory.length === 0) return { points: 0, rank: undefined, score: null };
  const rankIndex = sortedNationsForCategory.findIndex(n => n.id === pickedNationId);
  const actualRank = rankIndex !== -1 ? rankIndex + 1 : undefined;
  const actualScore = actualRank !== undefined && rankIndex < sortedNationsForCategory.length ? sortedNationsForCategory[rankIndex].score : null;
  let points = 0;
  if (actualRank === 1) points = 15;
  else if (actualRank === 2) points = 10;
  else if (actualRank === 3) points = 5;
  return { points, rank: actualRank, score: actualScore };
};

const NavMedalIcon = memo(({ rank }: { rank?: number }) => {
  if (rank === undefined || rank === null || rank === 0 || rank > 3) return null;
  let colorClass = "";
  if (rank === 1) colorClass = "text-yellow-400";
  else if (rank === 2) colorClass = "text-slate-400";
  else if (rank === 3) colorClass = "text-amber-500";
  return <Award className={cn("w-4 h-4 inline-block mx-0.5", colorClass)} />;
});
NavMedalIcon.displayName = 'NavMedalIcon';

const getRankTextColorClass = (rank?: number) => {
  if (rank === undefined || rank === null || rank === 0 || rank > 3) return "text-muted-foreground";
  if (rank === 1) return "text-yellow-400";
  if (rank === 2) return "text-slate-400";
  if (rank === 3) return "text-amber-500";
  return "text-muted-foreground";
};


export default function TeamDetailsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const params = useParams();
  const teamId = typeof params.teamId === "string" ? params.teamId : undefined;

  const [teamWithDetails, setTeamWithDetails] = useState<LocalTeamWithScore | null>(null);
  const [allNationsData, setAllNationsData] = useState<Nation[]>([]);

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rankedTeams, setRankedTeams] = useState<LocalTeamWithScore[]>([]);
  const [previousTeam, setPreviousTeam] = useState<LocalTeamWithScore | null>(null);
  const [nextTeam, setNextTeam] = useState<LocalTeamWithScore | null>(null);
  const [isLoadingRankedTeams, setIsLoadingRankedTeams] = useState(true);

  const [globalCategorizedScoresMap, setGlobalCategorizedScoresMap] = useState<Map<string, NationGlobalCategorizedScores>>(new Map());


  useEffect(() => {
    async function fetchAllPageData() {
      if (!teamId || authLoading) {
        setIsLoadingData(authLoading);
        setIsLoadingRankedTeams(authLoading);
        if (!teamId && !authLoading) setError("ID Squadra non valido.");
        return;
      }

      setIsLoadingData(true);
      setIsLoadingRankedTeams(true);
      setError(null);

      try {
        const [allFetchedTeams, nationsData, fetchedGlobalScoresMap] = await Promise.all([
          getTeams(),
          getNations(),
          getAllNationsGlobalCategorizedScores()
        ]);

        setAllNationsData(nationsData);
        const nationsMap = new Map(nationsData.map(n => [n.id, n]));
        setGlobalCategorizedScoresMap(fetchedGlobalScoresMap);
        
        // For official results based picks
        const topOverallRankNations = getTopNationsForCategory(null, nationsMap, 'ranking', 'asc');
        const topJuryRankNations = getTopNationsForCategory(null, nationsMap, 'juryRank', 'asc');
        const topTelevoteRankNations = getTopNationsForCategory(null, nationsMap, 'televoteRank', 'asc');

        // For user-vote based TreppoScore picks
        const topTreppoScoreNations = getTopNationsForCategory(fetchedGlobalScoresMap, nationsMap, 'overallAverageScore', 'desc');
        const topSongNations = getTopNationsForCategory(fetchedGlobalScoresMap, nationsMap, 'averageSongScore', 'desc');
        const topPerformanceNations = getTopNationsForCategory(fetchedGlobalScoresMap, nationsMap, 'averagePerformanceScore', 'desc');
        const topOutfitNations = getTopNationsForCategory(fetchedGlobalScoresMap, nationsMap, 'averageOutfitScore', 'desc');
        const worstOverallScoreNations = getTopNationsForCategory(fetchedGlobalScoresMap, nationsMap, 'overallAverageScore', 'asc');


        let calculatedTeams: LocalTeamWithScore[] = allFetchedTeams.map(currentTeam => {
          let score = 0;
          let primaSquadraSubtotal = 0;
          let eurovisionPicksSubtotal = 0;
          let treppoScoreCategoryPicksSubtotal = 0;
          let bonusSubtotal = 0;
          let bonusCampionePronostici = false;
          let bonusGranCampionePronostici = false;
          let bonusEnPleinTop5 = false;

          const primaSquadraDetails: GlobalPrimaSquadraDetail[] = [];
          (currentTeam.founderChoices || []).forEach((nationId, index) => {
            const nation = nationsMap.get(nationId);
            if (nation) {
              const points = getPointsForEurovisionRank(nation.ranking);
              primaSquadraSubtotal += points;
              primaSquadraDetails.push({
                id: nation.id, name: nation.name, countryCode: nation.countryCode,
                artistName: nation.artistName, songTitle: nation.songTitle,
                actualRank: nation.ranking, points, isEvenRow: index % 2 !== 0
              });
            }
          });


          if (primaSquadraDetails.length === 3 && primaSquadraDetails.every(detail => detail.actualRank && detail.actualRank >= 1 && detail.actualRank <= 5)) {
            bonusSubtotal += 30;
            bonusEnPleinTop5 = true;
          }

          const categoryPicksDetails: LocalCategoryPickDetail[] = [];
          let firstPlaceCategoryPicksCount = 0;

          // Eurovision Result Based Picks
          const eurovisionWinnerPickNationId = currentTeam.eurovisionWinnerPickNationId || "";
          const eurovisionWinnerPickNationDetails = eurovisionWinnerPickNationId ? nationsMap.get(eurovisionWinnerPickNationId) : undefined;
          const eurovisionWinnerPick = getCategoryPickPointsAndRank(eurovisionWinnerPickNationId, topOverallRankNations);
          eurovisionPicksSubtotal += eurovisionWinnerPick.points;
          if (eurovisionWinnerPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({
            categoryName: "Vincitore Eurovision", pickedNationId: eurovisionWinnerPickNationId || "",
            pickedNationName: eurovisionWinnerPickNationDetails?.name, pickedNationCountryCode: eurovisionWinnerPickNationDetails?.countryCode,
            artistName: eurovisionWinnerPickNationDetails?.artistName, songTitle: eurovisionWinnerPickNationDetails?.songTitle,
            actualCategoryRank: eurovisionWinnerPick.rank, pointsAwarded: eurovisionWinnerPick.points, iconName: "EurovisionWinner", pickedNationScoreInCategory: eurovisionWinnerPick.score
          });

          const juryWinnerPickNationId = currentTeam.juryWinnerPickNationId || "";
          const juryWinnerPickNationDetails = juryWinnerPickNationId ? nationsMap.get(juryWinnerPickNationId) : undefined;
          const juryWinnerPick = getCategoryPickPointsAndRank(juryWinnerPickNationId, topJuryRankNations);
          eurovisionPicksSubtotal += juryWinnerPick.points;
          if (juryWinnerPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({
            categoryName: "Vincitore Giuria", pickedNationId: juryWinnerPickNationId || "",
            pickedNationName: juryWinnerPickNationDetails?.name, pickedNationCountryCode: juryWinnerPickNationDetails?.countryCode,
            artistName: juryWinnerPickNationDetails?.artistName, songTitle: juryWinnerPickNationDetails?.songTitle,
            actualCategoryRank: juryWinnerPick.rank, pointsAwarded: juryWinnerPick.points, iconName: "JuryWinner", pickedNationScoreInCategory: juryWinnerPick.score
          });

          const televoteWinnerPickNationId = currentTeam.televoteWinnerPickNationId || "";
          const televoteWinnerPickNationDetails = televoteWinnerPickNationId ? nationsMap.get(televoteWinnerPickNationId) : undefined;
          const televoteWinnerPick = getCategoryPickPointsAndRank(televoteWinnerPickNationId, topTelevoteRankNations);
          eurovisionPicksSubtotal += televoteWinnerPick.points;
          if (televoteWinnerPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({
            categoryName: "Vincitore Televoto", pickedNationId: televoteWinnerPickNationId || "",
            pickedNationName: televoteWinnerPickNationDetails?.name, pickedNationCountryCode: televoteWinnerPickNationDetails?.countryCode,
            artistName: televoteWinnerPickNationDetails?.artistName, songTitle: televoteWinnerPickNationDetails?.songTitle,
            actualCategoryRank: televoteWinnerPick.rank, pointsAwarded: televoteWinnerPick.points, iconName: "TelevoteWinner", pickedNationScoreInCategory: televoteWinnerPick.score
          });

          // User Vote Based Picks
          const bestTreppoScoreNationId = currentTeam.bestTreppoScoreNationId || "";
          const bestTreppoScoreNationDetails = bestTreppoScoreNationId ? nationsMap.get(bestTreppoScoreNationId) : undefined;
          const bestTreppoPick = getCategoryPickPointsAndRank(bestTreppoScoreNationId, topTreppoScoreNations);
          treppoScoreCategoryPicksSubtotal += bestTreppoPick.points;
          if(bestTreppoPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({
            categoryName: "Miglior TreppoScore", pickedNationId: bestTreppoScoreNationId || "",
            pickedNationName: bestTreppoScoreNationDetails?.name, pickedNationCountryCode: bestTreppoScoreNationDetails?.countryCode,
            artistName: bestTreppoScoreNationDetails?.artistName, songTitle: bestTreppoScoreNationDetails?.songTitle,
            actualCategoryRank: bestTreppoPick.rank, pointsAwarded: bestTreppoPick.points,
            iconName: "Award", pickedNationScoreInCategory: bestTreppoPick.score
          });

          const bestSongNationId = currentTeam.bestSongNationId || "";
          const bestSongNationDetails = bestSongNationId ? nationsMap.get(bestSongNationId) : undefined;
          const bestSongPick = getCategoryPickPointsAndRank(bestSongNationId, topSongNations);
          treppoScoreCategoryPicksSubtotal += bestSongPick.points;
          if(bestSongPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({
            categoryName: "Miglior Canzone", pickedNationId: bestSongNationId || "",
            pickedNationName: bestSongNationDetails?.name, pickedNationCountryCode: bestSongNationDetails?.countryCode,
            artistName: bestSongNationDetails?.artistName, songTitle: bestSongNationDetails?.songTitle,
            actualCategoryRank: bestSongPick.rank, pointsAwarded: bestSongPick.points,
            iconName: "Music2", pickedNationScoreInCategory: bestSongPick.score
          });

          const bestPerfNationId = currentTeam.bestPerformanceNationId || "";
          const bestPerfNationDetails = bestPerfNationId ? nationsMap.get(bestPerfNationId) : undefined;
          const bestPerfPick = getCategoryPickPointsAndRank(bestPerfNationId, topPerformanceNations);
          treppoScoreCategoryPicksSubtotal += bestPerfPick.points;
          if(bestPerfPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({
            categoryName: "Miglior Performance", pickedNationId: bestPerfNationId || "",
            pickedNationName: bestPerfNationDetails?.name, pickedNationCountryCode: bestPerfNationDetails?.countryCode,
            artistName: bestPerfNationDetails?.artistName, songTitle: bestPerfNationDetails?.songTitle,
            actualCategoryRank: bestPerfPick.rank, pointsAwarded: bestPerfPick.points,
            iconName: "Star", pickedNationScoreInCategory: bestPerfPick.score
          });

          const bestOutfitNationId = currentTeam.bestOutfitNationId || "";
          const bestOutfitNationDetails = bestOutfitNationId ? nationsMap.get(bestOutfitNationId) : undefined;
          const bestOutfitPick = getCategoryPickPointsAndRank(bestOutfitNationId, topOutfitNations);
          treppoScoreCategoryPicksSubtotal += bestOutfitPick.points;
          if(bestOutfitPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({
            categoryName: "Miglior Outfit", pickedNationId: bestOutfitNationId || "",
            pickedNationName: bestOutfitNationDetails?.name, pickedNationCountryCode: bestOutfitNationDetails?.countryCode,
            artistName: bestOutfitNationDetails?.artistName, songTitle: bestOutfitNationDetails?.songTitle,
            actualCategoryRank: bestOutfitPick.rank, pointsAwarded: bestOutfitPick.points,
            iconName: "Shirt", pickedNationScoreInCategory: bestOutfitPick.score
          });

          const worstTreppoScoreNationId = currentTeam.worstTreppoScoreNationId || "";
          const worstTreppoScoreNationDetails = worstTreppoScoreNationId ? nationsMap.get(worstTreppoScoreNationId) : undefined;
          const worstTreppoPick = getCategoryPickPointsAndRank(worstTreppoScoreNationId, worstOverallScoreNations);
          treppoScoreCategoryPicksSubtotal += worstTreppoPick.points;
          if(worstTreppoPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({
            categoryName: "Peggior TreppoScore", pickedNationId: worstTreppoScoreNationId || "",
            pickedNationName: worstTreppoScoreNationDetails?.name, pickedNationCountryCode: worstTreppoScoreNationDetails?.countryCode,
            artistName: worstTreppoScoreNationDetails?.artistName, songTitle: worstTreppoScoreNationDetails?.songTitle,
            actualCategoryRank: worstTreppoPick.rank, pointsAwarded: worstTreppoPick.points,
            iconName: "ThumbsDown", pickedNationScoreInCategory: worstTreppoPick.score
          });

          categoryPicksDetails.forEach((detail, index) => {
            detail.isEvenRow = index % 2 !== 0;
          });

          score = primaSquadraSubtotal + eurovisionPicksSubtotal + treppoScoreCategoryPicksSubtotal;

          if (firstPlaceCategoryPicksCount >= 4) {
            bonusSubtotal += 30;
            bonusGranCampionePronostici = true;
          } else if (firstPlaceCategoryPicksCount >= 2 && firstPlaceCategoryPicksCount < 4) {
            bonusSubtotal += 5;
            bonusCampionePronostici = true;
          }

          score += bonusSubtotal;

          return {
            ...currentTeam,
            score,
            primaSquadraDetails,
            primaSquadraScore: primaSquadraSubtotal,
            eurovisionPicksScore: eurovisionPicksSubtotal,
            categoryPicksDetails,
            treppoScoreCategoryPicksScore: treppoScoreCategoryPicksSubtotal,
            bonusTotalScore: bonusSubtotal,
            bonusCampionePronostici,
            bonusGranCampionePronostici,
            bonusEnPleinTop5
          };
        });

        calculatedTeams.sort((a, b) => (b.score ?? -Infinity) - (a.score ?? -Infinity) || a.name.localeCompare(b.name));

        let currentGlobalRank = 1;
        for (let i = 0; i < calculatedTeams.length; i++) {
          if (i > 0 && (calculatedTeams[i].score ?? -Infinity) < (calculatedTeams[i-1].score ?? -Infinity)) {
            currentGlobalRank = i + 1;
          }
          calculatedTeams[i].rank = currentGlobalRank;
        }

        for (let i = 0; i < calculatedTeams.length; i++) {
          let isTiedValue = false;
          if (i > 0 && calculatedTeams[i].rank === calculatedTeams[i - 1].rank && calculatedTeams[i].score === calculatedTeams[i-1].score) {
            isTiedValue = true;
            calculatedTeams[i-1].isTied = true;
          }
          if (i < calculatedTeams.length - 1 && calculatedTeams[i].rank === calculatedTeams[i + 1].rank && calculatedTeams[i].score === calculatedTeams[i+1].score) {
            isTiedValue = true;
          }
          calculatedTeams[i].isTied = isTiedValue;
        }
        setRankedTeams(calculatedTeams);

        const currentTeamForDetailsPage = calculatedTeams.find(t => t.id === teamId);
        if (currentTeamForDetailsPage) {
            setTeamWithDetails(currentTeamForDetailsPage);
        } else {
            setError("Squadra non trovata nella classifica globale.");
            setTeamWithDetails(null); // Explicitly set to null
        }

      } catch (fetchError: any) {
        console.error("Failed to fetch page data:", fetchError);
        setError(fetchError.message || "Errore durante il caricamento dei dati della squadra.");
        setTeamWithDetails(null); // Explicitly set to null on error
      } finally {
        setIsLoadingData(false);
        setIsLoadingRankedTeams(false);
      }
    }
    fetchAllPageData();
  }, [teamId, authLoading]);


  useEffect(() => {
    if (isLoadingRankedTeams || !teamId || rankedTeams.length === 0 || !teamWithDetails) return;

    const currentTeamIndex = rankedTeams.findIndex(t => t.id === teamWithDetails.id);
    if (currentTeamIndex === -1) {
      setPreviousTeam(null);
      setNextTeam(null);
      return;
    }

    setPreviousTeam(currentTeamIndex > 0 ? rankedTeams[currentTeamIndex - 1] : null);
    setNextTeam(currentTeamIndex < rankedTeams.length - 1 ? rankedTeams[currentTeamIndex + 1] : null);

  }, [isLoadingRankedTeams, teamId, rankedTeams, teamWithDetails]);


  const rankText = (rank?: number): string => {
    if (rank === undefined || rank === null || rank <= 0) return "";
    return `${rank}°`;
  };


  if (authLoading || isLoadingData || isLoadingRankedTeams || (!teamWithDetails && !error)) {
    return (
      <div className="space-y-4">
        <Link href="/teams/leaderboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Torna alla Classifica Squadre
        </Link>
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Caricamento dettagli squadra...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link href="/teams/leaderboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Torna alla Classifica Squadre
        </Link>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!teamWithDetails) { // This handles the case where teamWithDetails is null after loading
      return (
        <div className="space-y-4">
            <Link href="/teams/leaderboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Torna alla Classifica Squadre
            </Link>
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Errore</AlertTitle>
                <AlertDescription>Dettagli squadra non disponibili o squadra non trovata.</AlertDescription>
            </Alert>
        </div>
      )
  }

  const globalCategorizedScoresArray = Array.from(globalCategorizedScoresMap.entries());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Link href="/teams/leaderboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Torna alla Classifica Squadre
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        {previousTeam ? (
          <Button asChild variant="outline" size="sm" className="h-auto py-1.5 px-2.5">
            <Link
              href={`/teams/${previousTeam.id}/details`}
              title={`${previousTeam.name}${previousTeam.creatorDisplayName ? ` - ${previousTeam.creatorDisplayName}` : ''} - Rank ${previousTeam.rank}°${previousTeam.isTied ? '*' : ''}`}
              className="flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
               <div className="flex items-center">
                {previousTeam.rank && (
                    <span className={cn("mr-0.5 text-xs font-semibold", getRankTextColorClass(previousTeam.rank))}>
                      {rankText(previousTeam.rank)}
                    </span>
                )}
                <NavMedalIcon rank={previousTeam.rank} />
              </div>
              <div className="flex flex-col items-start text-left leading-tight">
                <span className="truncate max-w-[100px] sm:max-w-[150px] text-xs font-medium">{previousTeam.name}</span>
                 {previousTeam.creatorDisplayName && (
                  <span className="text-[10px] text-muted-foreground truncate max-w-[100px] sm:max-w-[150px]">
                    {previousTeam.creatorDisplayName}
                  </span>
                )}
              </div>
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled className="h-auto py-1.5 px-2.5">
            <ChevronLeft className="w-4 h-4 mr-2" /> Precedente
          </Button>
        )}
        {nextTeam ? (
          <Button asChild variant="outline" size="sm" className="h-auto py-1.5 px-2.5">
            <Link
              href={`/teams/${nextTeam.id}/details`}
              title={`${nextTeam.name}${nextTeam.creatorDisplayName ? ` - ${nextTeam.creatorDisplayName}` : ''} - Rank ${nextTeam.rank}°${nextTeam.isTied ? '*' : ''}`}
              className="flex items-center gap-1.5"
            >
              <div className="flex flex-col items-end text-right leading-tight">
                <span className="truncate max-w-[100px] sm:max-w-[150px] text-xs font-medium">{nextTeam.name}</span>
                {nextTeam.creatorDisplayName && (
                  <span className="text-[10px] text-muted-foreground truncate max-w-[100px] sm:max-w-[150px]">
                    {nextTeam.creatorDisplayName}
                  </span>
                )}
              </div>
              <div className="flex items-center">
                {nextTeam.rank && (
                  <span className={cn("mr-0.5 text-xs font-semibold", getRankTextColorClass(nextTeam.rank))}>
                    {rankText(nextTeam.rank)}
                  </span>
                )}
                <NavMedalIcon rank={nextTeam.rank} />
              </div>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled className="h-auto py-1.5 px-2.5">
            Successiva <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>


      <div className="max-w-xl mx-auto">
        <TeamListItem
          team={teamWithDetails}
          allNations={allNationsData}
          nationGlobalCategorizedScoresArray={globalCategorizedScoresArray}
          isLeaderboardPodiumDisplay={true}
          disableEdit={true}
          isOwnTeamCard={user?.uid === teamWithDetails.userId}
          defaultOpenSections={["treppovision", "pronosticiEurovision", "pronosticiTreppoScore", "bonus"]}
        />
      </div>
    </div>
  );
}

