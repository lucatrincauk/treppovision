
"use client";

import { useEffect, useState, useMemo, memo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getTeamById, getTeams } from "@/lib/team-service";
import { getNations } from "@/lib/nation-service";
import { getAllNationsGlobalCategorizedScores } from "@/lib/voting-service";
import type { Team, Nation, NationGlobalCategorizedScores, GlobalPrimaSquadraDetail as GlobalPrimaSquadraDetailType, TeamWithScore as TeamWithScoreType, GlobalCategoryPickDetail as GlobalCategoryPickDetailTypeRaw } from "@/types";
import { TeamListItem } from "@/components/teams/team-list-item";
import { Loader2, AlertTriangle, Users, ChevronLeft, ChevronRight, Award, UserCircle, Music2, Star, Shirt, ThumbsDown, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LocalCategoryPickDetail extends GlobalCategoryPickDetailTypeRaw {
  iconName: string; 
}

interface LocalTeamWithScore extends TeamWithScoreType {
  primaSquadraScore?: number;
  categoryPicksDetails?: LocalCategoryPickDetail[];
  treppoScoreCategoryPicksScore?: number;
  bonusTotalScore?: number;
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
  scoresMap: Map<string, NationGlobalCategorizedScores>,
  currentNationsMap: Map<string, Nation>,
  categoryKey: keyof Omit<NationGlobalCategorizedScores, 'voteCount'>,
  sortOrder: 'desc' | 'asc' = 'desc',
): Array<{ id: string; name: string; score: number | null; artistName?: string; songTitle?: string; }> => {
  if (!scoresMap || scoresMap.size === 0 || !currentNationsMap || currentNationsMap.size === 0) return [];
  return Array.from(scoresMap.entries())
    .map(([nationId, scores]) => {
        const nation = currentNationsMap.get(nationId);
        return {
            id: nationId,
            name: nation?.name || 'Sconosciuto',
            score: scores[categoryKey],
            artistName: nation?.artistName,
            songTitle: nation?.songTitle,
        };
    })
    .filter(item => typeof item.score === 'number' && (scoresMap.get(item.id)?.voteCount || 0) > 0)
    .sort((a, b) => {
      if (a.score === null && b.score === null) return 0;
      if (a.score === null) return 1;
      if (b.score === null) return -1;
      if (a.score === b.score) {
        const voteCountA = scoresMap.get(a.id)?.voteCount || 0;
        const voteCountB = scoresMap.get(b.id)?.voteCount || 0;
        if (voteCountA !== voteCountB) {
          return sortOrder === 'desc' ? voteCountB - voteCountA : voteCountA - voteCountB;
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

  const [globalCategorizedScoresArray, setGlobalCategorizedScoresArray] = useState<[string, NationGlobalCategorizedScores][]>([]);


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
        const [allFetchedTeams, nationsData, globalScoresMapData] = await Promise.all([
          getTeams(),
          getNations(),
          getAllNationsGlobalCategorizedScores()
        ]);

        setAllNationsData(nationsData);
        const nationsMap = new Map(nationsData.map(n => [n.id, n]));
        setGlobalCategorizedScoresArray(Array.from(globalScoresMapData.entries()));

        const topOverallRankNations = nationsData.filter(n => n.ranking && n.ranking > 0).sort((a,b) => (a.ranking || Infinity) - (b.ranking || Infinity));
        const topJuryRankNations = nationsData.filter(n => n.juryRank && n.juryRank > 0).sort((a,b) => (a.juryRank || Infinity) - (b.juryRank || Infinity));
        const topTelevoteRankNations = nationsData.filter(n => n.televoteRank && n.televoteRank > 0).sort((a,b) => (a.televoteRank || Infinity) - (b.televoteRank || Infinity));

        const topTreppoScoreNations = getTopNationsForCategory(globalScoresMapData, nationsMap, 'overallAverageScore', 'desc');
        const topSongNations = getTopNationsForCategory(globalScoresMapData, nationsMap, 'averageSongScore', 'desc');
        const topPerformanceNations = getTopNationsForCategory(globalScoresMapData, nationsMap, 'averagePerformanceScore', 'desc');
        const topOutfitNations = getTopNationsForCategory(globalScoresMapData, nationsMap, 'averageOutfitScore', 'desc');
        const worstOverallScoreNations = getTopNationsForCategory(globalScoresMapData, nationsMap, 'overallAverageScore', 'asc');


        let calculatedTeams: LocalTeamWithScore[] = allFetchedTeams.map(team => {
          let score = 0;
          let primaSquadraSubtotal = 0;
          let treppoScoreCategoryPicksSubtotal = 0;
          let bonusSubtotal = 0;
          let bonusCampionePronostici = false;
          let bonusGranCampionePronostici = false;
          let bonusEnPleinTop5 = false;

          const primaSquadraDetails = (team.founderChoices || []).map(nationId => {
            const nation = nationsMap.get(nationId);
            const points = nation ? getPointsForEurovisionRank(nation.ranking) : 0;
            score += points;
            primaSquadraSubtotal += points;
            return { id: nationId, name: nation?.name || 'Sconosciuto', countryCode: nation?.countryCode || 'xx', artistName: nation?.artistName, songTitle: nation?.songTitle, actualRank: nation?.ranking, points };
          });

          if (primaSquadraDetails.length === 3 && primaSquadraDetails.every(detail => detail.actualRank && detail.actualRank >= 1 && detail.actualRank <= 5)) {
            score += 30;
            bonusSubtotal += 30;
            bonusEnPleinTop5 = true;
          }

          const categoryPicksDetails: LocalCategoryPickDetail[] = [];
          let firstPlaceCategoryPicksCount = 0;

          // Official Result Predictions
          const eurovisionWinnerPick = getCategoryPickPointsAndRank(team.eurovisionWinnerPickNationId, topOverallRankNations.map(n => ({ id: n.id, name: n.name, score: n.ranking || null })));
          score += eurovisionWinnerPick.points;
          treppoScoreCategoryPicksSubtotal += eurovisionWinnerPick.points;
          if (eurovisionWinnerPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({
            categoryName: "Vincitore Eurovision", pickedNationId: team.eurovisionWinnerPickNationId || "",
            pickedNationName: team.eurovisionWinnerPickNationId ? nationsMap.get(team.eurovisionWinnerPickNationId)?.name : undefined,
            pickedNationCountryCode: team.eurovisionWinnerPickNationId ? nationsMap.get(team.eurovisionWinnerPickNationId)?.countryCode : undefined,
            artistName: team.eurovisionWinnerPickNationId ? nationsMap.get(team.eurovisionWinnerPickNationId)?.artistName : undefined,
            songTitle: team.eurovisionWinnerPickNationId ? nationsMap.get(team.eurovisionWinnerPickNationId)?.songTitle : undefined,
            actualCategoryRank: eurovisionWinnerPick.rank, pointsAwarded: eurovisionWinnerPick.points, iconName: "EurovisionWinner", pickedNationScoreInCategory: eurovisionWinnerPick.score 
          });
          
          const juryWinnerPick = getCategoryPickPointsAndRank(team.juryWinnerPickNationId, topJuryRankNations.map(n => ({ id: n.id, name: n.name, score: n.juryRank || null })));
          score += juryWinnerPick.points;
          treppoScoreCategoryPicksSubtotal += juryWinnerPick.points;
          if (juryWinnerPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({
            categoryName: "Vincitore Giuria", pickedNationId: team.juryWinnerPickNationId || "",
            pickedNationName: team.juryWinnerPickNationId ? nationsMap.get(team.juryWinnerPickNationId)?.name : undefined,
            pickedNationCountryCode: team.juryWinnerPickNationId ? nationsMap.get(team.juryWinnerPickNationId)?.countryCode : undefined,
            artistName: team.juryWinnerPickNationId ? nationsMap.get(team.juryWinnerPickNationId)?.artistName : undefined,
            songTitle: team.juryWinnerPickNationId ? nationsMap.get(team.juryWinnerPickNationId)?.songTitle : undefined,
            actualCategoryRank: juryWinnerPick.rank, pointsAwarded: juryWinnerPick.points, iconName: "JuryWinner", pickedNationScoreInCategory: juryWinnerPick.score 
          });

          const televoteWinnerPick = getCategoryPickPointsAndRank(team.televoteWinnerPickNationId, topTelevoteRankNations.map(n => ({ id: n.id, name: n.name, score: n.televoteRank || null })));
          score += televoteWinnerPick.points;
          treppoScoreCategoryPicksSubtotal += televoteWinnerPick.points;
          if (televoteWinnerPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({
            categoryName: "Vincitore Televoto", pickedNationId: team.televoteWinnerPickNationId || "",
            pickedNationName: team.televoteWinnerPickNationId ? nationsMap.get(team.televoteWinnerPickNationId)?.name : undefined,
            pickedNationCountryCode: team.televoteWinnerPickNationId ? nationsMap.get(team.televoteWinnerPickNationId)?.countryCode : undefined,
            artistName: team.televoteWinnerPickNationId ? nationsMap.get(team.televoteWinnerPickNationId)?.artistName : undefined,
            songTitle: team.televoteWinnerPickNationId ? nationsMap.get(team.televoteWinnerPickNationId)?.songTitle : undefined,
            actualCategoryRank: televoteWinnerPick.rank, pointsAwarded: televoteWinnerPick.points, iconName: "TelevoteWinner", pickedNationScoreInCategory: televoteWinnerPick.score 
          });

          // User Vote Based Predictions
          const bestTreppoPick = getCategoryPickPointsAndRank(team.bestTreppoScoreNationId, topTreppoScoreNations);
          score += bestTreppoPick.points;
          treppoScoreCategoryPicksSubtotal += bestTreppoPick.points;
          if(bestTreppoPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({ categoryName: "Miglior TreppoScore", pickedNationId: team.bestTreppoScoreNationId || "", pickedNationName: team.bestTreppoScoreNationId ? nationsMap.get(team.bestTreppoScoreNationId)?.name : undefined, pickedNationCountryCode: team.bestTreppoScoreNationId ? nationsMap.get(team.bestTreppoScoreNationId)?.countryCode : undefined, artistName: team.bestTreppoScoreNationId ? nationsMap.get(team.bestTreppoScoreNationId)?.artistName : undefined, songTitle: team.bestTreppoScoreNationId ? nationsMap.get(team.bestTreppoScoreNationId)?.songTitle : undefined, actualCategoryRank: bestTreppoPick.rank, pointsAwarded: bestTreppoPick.points, iconName: "Award", pickedNationScoreInCategory: bestTreppoPick.score });

          const bestSongPick = getCategoryPickPointsAndRank(team.bestSongNationId, topSongNations);
          score += bestSongPick.points;
          treppoScoreCategoryPicksSubtotal += bestSongPick.points;
          if(bestSongPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({ categoryName: "Miglior Canzone", pickedNationId: team.bestSongNationId || "", pickedNationName: team.bestSongNationId ? nationsMap.get(team.bestSongNationId)?.name : undefined, pickedNationCountryCode: team.bestSongNationId ? nationsMap.get(team.bestSongNationId)?.countryCode : undefined, artistName: team.bestSongNationId ? nationsMap.get(team.bestSongNationId)?.artistName : undefined, songTitle: team.bestSongNationId ? nationsMap.get(team.bestSongNationId)?.songTitle : undefined, actualCategoryRank: bestSongPick.rank, pointsAwarded: bestSongPick.points, iconName: "Music2", pickedNationScoreInCategory: bestSongPick.score });

          const bestPerfPick = getCategoryPickPointsAndRank(team.bestPerformanceNationId, topPerformanceNations);
          score += bestPerfPick.points;
          treppoScoreCategoryPicksSubtotal += bestPerfPick.points;
          if(bestPerfPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({ categoryName: "Miglior Performance", pickedNationId: team.bestPerformanceNationId || "", pickedNationName: team.bestPerformanceNationId ? nationsMap.get(team.bestPerformanceNationId)?.name : undefined, pickedNationCountryCode: team.bestPerformanceNationId ? nationsMap.get(team.bestPerformanceNationId)?.countryCode : undefined, artistName: team.bestPerformanceNationId ? nationsMap.get(team.bestPerformanceNationId)?.artistName : undefined, songTitle: team.bestPerformanceNationId ? nationsMap.get(team.bestPerformanceNationId)?.songTitle : undefined, actualCategoryRank: bestPerfPick.rank, pointsAwarded: bestPerfPick.points, iconName: "Star", pickedNationScoreInCategory: bestPerfPick.score });

          const bestOutfitPick = getCategoryPickPointsAndRank(team.bestOutfitNationId, topOutfitNations);
          score += bestOutfitPick.points;
          treppoScoreCategoryPicksSubtotal += bestOutfitPick.points;
          if(bestOutfitPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({ categoryName: "Miglior Outfit", pickedNationId: team.bestOutfitNationId || "", pickedNationName: team.bestOutfitNationId ? nationsMap.get(team.bestOutfitNationId)?.name : undefined, pickedNationCountryCode: team.bestOutfitNationId ? nationsMap.get(team.bestOutfitNationId)?.countryCode : undefined, artistName: team.bestOutfitNationId ? nationsMap.get(team.bestOutfitNationId)?.artistName : undefined, songTitle: team.bestOutfitNationId ? nationsMap.get(team.bestOutfitNationId)?.songTitle : undefined, actualCategoryRank: bestOutfitPick.rank, pointsAwarded: bestOutfitPick.points, iconName: "Shirt", pickedNationScoreInCategory: bestOutfitPick.score });

          const worstTreppoPick = getCategoryPickPointsAndRank(team.worstTreppoScoreNationId, worstOverallScoreNations);
          score += worstTreppoPick.points;
          treppoScoreCategoryPicksSubtotal += worstTreppoPick.points;
          if(worstTreppoPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({ categoryName: "Peggior TreppoScore", pickedNationId: team.worstTreppoScoreNationId || "", pickedNationName: team.worstTreppoScoreNationId ? nationsMap.get(team.worstTreppoScoreNationId)?.name : undefined, pickedNationCountryCode: team.worstTreppoScoreNationId ? nationsMap.get(team.worstTreppoScoreNationId)?.countryCode : undefined, artistName: team.worstTreppoScoreNationId ? nationsMap.get(team.worstTreppoScoreNationId)?.artistName : undefined, songTitle: team.worstTreppoScoreNationId ? nationsMap.get(team.worstTreppoScoreNationId)?.songTitle : undefined, actualCategoryRank: worstTreppoPick.rank, pointsAwarded: worstTreppoPick.points, iconName: "ThumbsDown", pickedNationScoreInCategory: worstTreppoPick.score });

          if (firstPlaceCategoryPicksCount >= 4) {
            score += 30;
            bonusSubtotal += 30;
            bonusGranCampionePronostici = true;
          } else if (firstPlaceCategoryPicksCount >= 2 && firstPlaceCategoryPicksCount < 4) {
            score += 5;
            bonusSubtotal += 5;
            bonusCampionePronostici = true;
          }


          return {
            ...team,
            score,
            primaSquadraDetails,
            primaSquadraScore: primaSquadraSubtotal,
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

        const currentTeam = calculatedTeams.find(t => t.id === teamId);
        if (currentTeam) {
            setTeamWithDetails(currentTeam);
        } else {
            setError("Squadra non trovata nella classifica globale.");
        }

      } catch (fetchError: any) {
        console.error("Failed to fetch page data:", fetchError);
        setError(fetchError.message || "Errore durante il caricamento dei dati della squadra.");
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

  if (!teamWithDetails) {
      return (
        <div className="space-y-4">
            <Link href="/teams/leaderboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Torna alla Classifica Squadre
            </Link>
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Errore</AlertTitle>
                <AlertDescription>Dettagli squadra non disponibili.</AlertDescription>
            </Alert>
        </div>
      )
  }


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
              title={`${previousTeam.name} ${previousTeam.creatorDisplayName ? `${previousTeam.creatorDisplayName}` : ''} - Rank ${previousTeam.rank}°${previousTeam.isTied ? '*' : ''}`}
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
              title={`${nextTeam.name} ${nextTeam.creatorDisplayName ? `${nextTeam.creatorDisplayName}` : ''} - Rank ${nextTeam.rank}°${nextTeam.isTied ? '*' : ''}`}
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
          defaultOpenSections={["treppovision", "trepposcore", "bonus"]}
        />
      </div>
    </div>
  );
}


    