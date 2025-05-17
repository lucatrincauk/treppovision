
"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getTeamById, getTeams } from "@/lib/team-service";
import { getNations } from "@/lib/nation-service";
import { getAllNationsGlobalCategorizedScores } from "@/lib/voting-service";
import type { Team, Nation, NationGlobalCategorizedScores, GlobalPrimaSquadraDetail as GlobalPrimaSquadraDetailType, TeamWithScore as TeamWithScoreType, GlobalCategoryPickDetail as BaseGlobalCategoryPickDetail } from "@/types";
import { TeamListItem } from "@/components/teams/team-list-item";
import { Loader2, AlertTriangle, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image"; // Added for flags in nav buttons
import { cn } from "@/lib/utils";

interface GlobalCategoryPickDetail extends BaseGlobalCategoryPickDetail {
    artistName?: string;
    songTitle?: string;
}

interface LocalTeamWithScore extends TeamWithScoreType {
  primaSquadraDetails?: GlobalPrimaSquadraDetailType[];
  categoryPicksDetails?: GlobalCategoryPickDetail[];
  bonusCampionePronostici?: boolean;
  bonusGranCampionePronostici?: boolean;
  bonusEnPleinTop5?: boolean;
  rank?: number;
  isTied?: boolean;
}

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
    .filter(item => item.score !== null && (scoresMap.get(item.id)?.voteCount || 0) > 0)
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


export default function TeamDetailsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const params = useParams();
  const teamId = typeof params.teamId === "string" ? params.teamId : undefined;

  const [teamWithDetails, setTeamWithDetails] = useState<LocalTeamWithScore | null>(null);
  const [allNationsData, setAllNationsData] = useState<Nation[]>([]);
  const [globalScoresData, setGlobalScoresData] = useState<Map<string, NationGlobalCategorizedScores>>(new Map());

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rankedTeams, setRankedTeams] = useState<LocalTeamWithScore[]>([]);
  const [previousTeam, setPreviousTeam] = useState<LocalTeamWithScore | null>(null);
  const [nextTeam, setNextTeam] = useState<LocalTeamWithScore | null>(null);
  const [isLoadingRankedTeams, setIsLoadingRankedTeams] = useState(true);


  useEffect(() => {
    async function fetchAllRankedTeams() {
      if (!teamId) return; // No need to fetch if teamId isn't set yet

      setIsLoadingRankedTeams(true);
      try {
        const [allFetchedTeams, nationsData, globalScoresMap] = await Promise.all([
          getTeams(),
          getNations(),
          getAllNationsGlobalCategorizedScores()
        ]);
        setAllNationsData(nationsData); // Store for TeamListItem
        setGlobalScoresData(globalScoresMap); // Store for TeamListItem

        const nationsMap = new Map(nationsData.map(n => [n.id, n]));

        const topOverallNations = getTopNationsForCategory(globalScoresMap, nationsMap, 'overallAverageScore', 'desc');
        const topSongNations = getTopNationsForCategory(globalScoresMap, nationsMap, 'averageSongScore', 'desc');
        const topPerformanceNations = getTopNationsForCategory(globalScoresMap, nationsMap, 'averagePerformanceScore', 'desc');
        const topOutfitNations = getTopNationsForCategory(globalScoresMap, nationsMap, 'averageOutfitScore', 'desc');
        const worstOverallScoreNations = getTopNationsForCategory(globalScoresMap, nationsMap, 'overallAverageScore', 'asc');

        let calculatedTeams: LocalTeamWithScore[] = allFetchedTeams.map(team => {
          let score = 0;
          let bonusEnPleinTop5 = false;
          let bonusCampionePronostici = false;
          let bonusGranCampionePronostici = false;

          const primaSquadraDetails = (team.founderChoices || []).map(nationId => {
            const nation = nationsMap.get(nationId);
            const points = nation ? getPointsForRank(nation.ranking) : 0;
            score += points;
            return { id: nationId, name: nation?.name || 'Sconosciuto', countryCode: nation?.countryCode || 'xx', artistName: nation?.artistName, songTitle: nation?.songTitle, actualRank: nation?.ranking, points };
          });

          if (primaSquadraDetails.length === 3 && primaSquadraDetails.every(detail => detail.actualRank && detail.actualRank >= 1 && detail.actualRank <= 5)) {
            score += 30;
            bonusEnPleinTop5 = true;
          }

          const categoryPicksDetails: GlobalCategoryPickDetail[] = [];
          let firstPlaceCategoryPicksCount = 0;

          // Miglior TreppoScore
          const bestTreppoPick = getCategoryPickPointsAndRank(team.bestTreppoScoreNationId, topOverallNations);
          score += bestTreppoPick.points;
          if(bestTreppoPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({ categoryName: "Miglior TreppoScore", pickedNationId: team.bestTreppoScoreNationId || "", actualCategoryRank: bestTreppoPick.rank, pointsAwarded: bestTreppoPick.points, iconName: "Award", pickedNationScoreInCategory: bestTreppoPick.score });

          // Miglior Canzone
          const bestSongPick = getCategoryPickPointsAndRank(team.bestSongNationId, topSongNations);
          score += bestSongPick.points;
          if(bestSongPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({ categoryName: "Miglior Canzone", pickedNationId: team.bestSongNationId || "", actualCategoryRank: bestSongPick.rank, pointsAwarded: bestSongPick.points, iconName: "Music2", pickedNationScoreInCategory: bestSongPick.score });

          // Miglior Performance
          const bestPerfPick = getCategoryPickPointsAndRank(team.bestPerformanceNationId, topPerformanceNations);
          score += bestPerfPick.points;
          if(bestPerfPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({ categoryName: "Miglior Performance", pickedNationId: team.bestPerformanceNationId || "", actualCategoryRank: bestPerfPick.rank, pointsAwarded: bestPerfPick.points, iconName: "Star", pickedNationScoreInCategory: bestPerfPick.score });

          // Miglior Outfit
          const bestOutfitPick = getCategoryPickPointsAndRank(team.bestOutfitNationId, topOutfitNations);
          score += bestOutfitPick.points;
          if(bestOutfitPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({ categoryName: "Miglior Outfit", pickedNationId: team.bestOutfitNationId || "", actualCategoryRank: bestOutfitPick.rank, pointsAwarded: bestOutfitPick.points, iconName: "Shirt", pickedNationScoreInCategory: bestOutfitPick.score });

          // Peggior TreppoScore
          const worstPick = getCategoryPickPointsAndRank(team.worstTreppoScoreNationId, worstOverallScoreNations);
          score += worstPick.points;
          if(worstPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({ categoryName: "Peggior TreppoScore", pickedNationId: team.worstTreppoScoreNationId || "", actualCategoryRank: worstPick.rank, pointsAwarded: worstPick.points, iconName: "ThumbsDown", pickedNationScoreInCategory: worstPick.score });

          if (firstPlaceCategoryPicksCount >= 4) {
            score += 30;
            bonusGranCampionePronostici = true;
          } else if (firstPlaceCategoryPicksCount >= 2) {
            score += 5;
            bonusCampionePronostici = true;
          }

          return { ...team, score, primaSquadraDetails, categoryPicksDetails, bonusCampionePronostici, bonusGranCampionePronostici, bonusEnPleinTop5 };
        });

        calculatedTeams.sort((a, b) => (b.score ?? -Infinity) - (a.score ?? -Infinity) || a.name.localeCompare(b.name));

        let currentRank = 1;
        for (let i = 0; i < calculatedTeams.length; i++) {
          if (i > 0 && (calculatedTeams[i].score ?? -Infinity) < (calculatedTeams[i-1].score ?? -Infinity)) {
            currentRank = i + 1;
          }
          calculatedTeams[i].rank = currentRank;
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

      } catch (fetchError: any) {
        console.error("Failed to fetch all ranked teams:", fetchError);
        setError(fetchError.message || "Errore durante il caricamento di tutte le squadre.");
      } finally {
        setIsLoadingRankedTeams(false);
      }
    }
    fetchAllRankedTeams();
  }, [teamId]); // Re-fetch all teams if teamId changes (though unlikely on this page)


  useEffect(() => {
    if (isLoadingRankedTeams || !teamId || rankedTeams.length === 0) return;

    const currentTeamIndex = rankedTeams.findIndex(t => t.id === teamId);
    if (currentTeamIndex === -1) {
      // This could happen if the specific teamId is not in the fetched rankedTeams
      // or if data is inconsistent.
      setPreviousTeam(null);
      setNextTeam(null);
      // Fetch the specific team again if it wasn't in the ranked list to ensure its details are shown
      if (!teamWithDetails) {
        fetchCurrentTeamDetails();
      }
      return;
    }

    if (!teamWithDetails) {
      // If teamWithDetails hasn't been set yet by fetchCurrentTeamDetails, set it now
      // from the ranked list.
      setTeamWithDetails(rankedTeams[currentTeamIndex]);
    }


    if (currentTeamIndex > 0) {
      setPreviousTeam(rankedTeams[currentTeamIndex - 1]);
    } else {
      setPreviousTeam(null);
    }

    if (currentTeamIndex < rankedTeams.length - 1) {
      setNextTeam(rankedTeams[currentTeamIndex + 1]);
    } else {
      setNextTeam(null);
    }

  }, [isLoadingRankedTeams, teamId, rankedTeams, teamWithDetails]); // Added teamWithDetails to deps


  async function fetchCurrentTeamDetails() {
      if (!teamId) {
        setError("ID Squadra non valido.");
        setIsLoadingData(false);
        return;
      }
      setIsLoadingData(true);
      setError(null);

      try {
        // Fetch all necessary data if not already available from rankedTeams fetch
        let nationsToUse = allNationsData;
        let globalScoresToUse = globalScoresData;

        if (nationsToUse.length === 0 || globalScoresToUse.size === 0) {
            const [fetchedNations, fetchedGlobalScoresMap] = await Promise.all([
                getNations(),
                getAllNationsGlobalCategorizedScores()
            ]);
            nationsToUse = fetchedNations;
            globalScoresToUse = fetchedGlobalScoresMap;
            setAllNationsData(nationsToUse);
            setGlobalScoresData(globalScoresToUse);
        }

        const fetchedTeam = await getTeamById(teamId);

        if (!fetchedTeam) {
          setError("Squadra non trovata.");
          setIsLoadingData(false);
          return;
        }

        const nationsMap = new Map(nationsToUse.map(n => [n.id, n]));

        let score = 0;
        let bonusEnPleinTop5 = false;
        let bonusCampionePronostici = false;
        let bonusGranCampionePronostici = false;

        const primaSquadraDetails = (fetchedTeam.founderChoices || []).map(nationId => {
          const nation = nationsMap.get(nationId);
          const points = nation ? getPointsForRank(nation.ranking) : 0;
          score += points;
          return { id: nationId, name: nation?.name || 'Sconosciuto', countryCode: nation?.countryCode || 'xx', artistName: nation?.artistName, songTitle: nation?.songTitle, actualRank: nation?.ranking, points };
        });

        if (primaSquadraDetails.length === 3 && primaSquadraDetails.every(detail => detail.actualRank && detail.actualRank >= 1 && detail.actualRank <= 5)) {
          score += 30;
          bonusEnPleinTop5 = true;
        }

        const categoryPicksDetails: GlobalCategoryPickDetail[] = [];
        let firstPlaceCategoryPicksCount = 0;

        const topOverallNations = getTopNationsForCategory(globalScoresToUse, nationsMap, 'overallAverageScore', 'desc');
        const topSongNations = getTopNationsForCategory(globalScoresToUse, nationsMap, 'averageSongScore', 'desc');
        const topPerformanceNations = getTopNationsForCategory(globalScoresToUse, nationsMap, 'averagePerformanceScore', 'desc');
        const topOutfitNations = getTopNationsForCategory(globalScoresToUse, nationsMap, 'averageOutfitScore', 'desc');
        const worstOverallScoreNations = getTopNationsForCategory(globalScoresToUse, nationsMap, 'overallAverageScore', 'asc');


        const bestTreppoPick = getCategoryPickPointsAndRank(fetchedTeam.bestTreppoScoreNationId, topOverallNations);
        score += bestTreppoPick.points;
        if(bestTreppoPick.rank === 1) firstPlaceCategoryPicksCount++;
        categoryPicksDetails.push({ categoryName: "Miglior TreppoScore", pickedNationId: fetchedTeam.bestTreppoScoreNationId || "", pickedNationName: fetchedTeam.bestTreppoScoreNationId ? nationsMap.get(fetchedTeam.bestTreppoScoreNationId)?.name : undefined, pickedNationCountryCode: fetchedTeam.bestTreppoScoreNationId ? nationsMap.get(fetchedTeam.bestTreppoScoreNationId)?.countryCode : undefined, artistName: fetchedTeam.bestTreppoScoreNationId ? nationsMap.get(fetchedTeam.bestTreppoScoreNationId)?.artistName : undefined, songTitle: fetchedTeam.bestTreppoScoreNationId ? nationsMap.get(fetchedTeam.bestTreppoScoreNationId)?.songTitle : undefined, actualCategoryRank: bestTreppoPick.rank, pointsAwarded: bestTreppoPick.points, iconName: "Award", pickedNationScoreInCategory: bestTreppoPick.score });

        const bestSongPick = getCategoryPickPointsAndRank(fetchedTeam.bestSongNationId, topSongNations);
        score += bestSongPick.points;
        if(bestSongPick.rank === 1) firstPlaceCategoryPicksCount++;
        categoryPicksDetails.push({ categoryName: "Miglior Canzone", pickedNationId: fetchedTeam.bestSongNationId || "", pickedNationName: fetchedTeam.bestSongNationId ? nationsMap.get(fetchedTeam.bestSongNationId)?.name : undefined, pickedNationCountryCode: fetchedTeam.bestSongNationId ? nationsMap.get(fetchedTeam.bestSongNationId)?.countryCode : undefined, artistName: fetchedTeam.bestSongNationId ? nationsMap.get(fetchedTeam.bestSongNationId)?.artistName : undefined, songTitle: fetchedTeam.bestSongNationId ? nationsMap.get(fetchedTeam.bestSongNationId)?.songTitle : undefined, actualCategoryRank: bestSongPick.rank, pointsAwarded: bestSongPick.points, iconName: "Music2", pickedNationScoreInCategory: bestSongPick.score });

        const bestPerfPick = getCategoryPickPointsAndRank(fetchedTeam.bestPerformanceNationId, topPerformanceNations);
        score += bestPerfPick.points;
        if(bestPerfPick.rank === 1) firstPlaceCategoryPicksCount++;
        categoryPicksDetails.push({ categoryName: "Miglior Performance", pickedNationId: fetchedTeam.bestPerformanceNationId || "", pickedNationName: fetchedTeam.bestPerformanceNationId ? nationsMap.get(fetchedTeam.bestPerformanceNationId)?.name : undefined, pickedNationCountryCode: fetchedTeam.bestPerformanceNationId ? nationsMap.get(fetchedTeam.bestPerformanceNationId)?.countryCode : undefined, artistName: fetchedTeam.bestPerformanceNationId ? nationsMap.get(fetchedTeam.bestPerformanceNationId)?.artistName : undefined, songTitle: fetchedTeam.bestPerformanceNationId ? nationsMap.get(fetchedTeam.bestPerformanceNationId)?.songTitle : undefined, actualCategoryRank: bestPerfPick.rank, pointsAwarded: bestPerfPick.points, iconName: "Star", pickedNationScoreInCategory: bestPerfPick.score });

        const bestOutfitPick = getCategoryPickPointsAndRank(fetchedTeam.bestOutfitNationId, topOutfitNations);
        score += bestOutfitPick.points;
        if(bestOutfitPick.rank === 1) firstPlaceCategoryPicksCount++;
        categoryPicksDetails.push({ categoryName: "Miglior Outfit", pickedNationId: fetchedTeam.bestOutfitNationId || "", pickedNationName: fetchedTeam.bestOutfitNationId ? nationsMap.get(fetchedTeam.bestOutfitNationId)?.name : undefined, pickedNationCountryCode: fetchedTeam.bestOutfitNationId ? nationsMap.get(fetchedTeam.bestOutfitNationId)?.countryCode : undefined, artistName: fetchedTeam.bestOutfitNationId ? nationsMap.get(fetchedTeam.bestOutfitNationId)?.artistName : undefined, songTitle: fetchedTeam.bestOutfitNationId ? nationsMap.get(fetchedTeam.bestOutfitNationId)?.songTitle : undefined, actualCategoryRank: bestOutfitPick.rank, pointsAwarded: bestOutfitPick.points, iconName: "Shirt", pickedNationScoreInCategory: bestOutfitPick.score });

        const worstPick = getCategoryPickPointsAndRank(fetchedTeam.worstTreppoScoreNationId, worstOverallScoreNations);
        score += worstPick.points;
        if(worstPick.rank === 1) firstPlaceCategoryPicksCount++;
        categoryPicksDetails.push({ categoryName: "Peggior TreppoScore", pickedNationId: fetchedTeam.worstTreppoScoreNationId || "", pickedNationName: fetchedTeam.worstTreppoScoreNationId ? nationsMap.get(fetchedTeam.worstTreppoScoreNationId)?.name : undefined, pickedNationCountryCode: fetchedTeam.worstTreppoScoreNationId ? nationsMap.get(fetchedTeam.worstTreppoScoreNationId)?.countryCode : undefined, artistName: fetchedTeam.worstTreppoScoreNationId ? nationsMap.get(fetchedTeam.worstTreppoScoreNationId)?.artistName : undefined, songTitle: fetchedTeam.worstTreppoScoreNationId ? nationsMap.get(fetchedTeam.worstTreppoScoreNationId)?.songTitle : undefined, actualCategoryRank: worstPick.rank, pointsAwarded: worstPick.points, iconName: "ThumbsDown", pickedNationScoreInCategory: worstPick.score });

        if (firstPlaceCategoryPicksCount >= 4) {
          score += 30;
          bonusGranCampionePronostici = true;
        } else if (firstPlaceCategoryPicksCount >= 2) {
          score += 5;
          bonusCampionePronostici = true;
        }

        const processedTeam: LocalTeamWithScore = {
          ...fetchedTeam,
          score: score,
          primaSquadraDetails: primaSquadraDetails,
          categoryPicksDetails: categoryPicksDetails,
          bonusCampionePronostici,
          bonusGranCampionePronostici,
          bonusEnPleinTop5,
          rank: teamWithDetails?.rank, // Preserve rank if already set by rankedTeams logic
          isTied: teamWithDetails?.isTied, // Preserve tie status
        };
        setTeamWithDetails(processedTeam);

      } catch (fetchError: any) {
        console.error("Failed to fetch current team details:", fetchError);
        setError(fetchError.message || "Errore durante il caricamento dei dettagli della squadra.");
      } finally {
        setIsLoadingData(false);
      }
  }


  useEffect(() => {
    if (authLoading) return; // Wait for auth state to resolve

    if (!isLoadingRankedTeams && rankedTeams.length > 0 && teamId) {
        // If ranked teams are loaded, try to find the current team there.
        const teamFromRankedList = rankedTeams.find(t => t.id === teamId);
        if (teamFromRankedList) {
            setTeamWithDetails(teamFromRankedList);
            setIsLoadingData(false); // We have the team data
        } else {
            // Team not in ranked list (e.g. if it has no score yet), fetch its details individually
            fetchCurrentTeamDetails();
        }
    } else if (!isLoadingRankedTeams && rankedTeams.length === 0 && teamId) {
        // No ranked teams (maybe an error or empty leaderboard), fetch current team individually
        fetchCurrentTeamDetails();
    } else if (!teamId && !authLoading) {
        setError("ID Squadra non valido.");
        setIsLoadingData(false);
    }
    // If isLoadingRankedTeams is true, we wait for it to complete
  }, [teamId, authLoading, isLoadingRankedTeams, rankedTeams]); // Primary effect for current team details


  const nationGlobalCategorizedScoresArray = useMemo(() => Array.from(globalScoresData.entries()), [globalScoresData]);

  if (authLoading || isLoadingData || isLoadingRankedTeams || !teamWithDetails) {
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

  const rankText = (rank?: number, isTied?: boolean): string => {
    if (rank === undefined || rank === null || rank <= 0) return "";
    let rankStr = "";
    switch (rank) {
      case 1: rankStr = "Primo Posto"; break;
      case 2: rankStr = "Secondo Posto"; break;
      case 3: rankStr = "Terzo Posto"; break;
      default: rankStr = `${rank}º Posto`;
    }
    return isTied ? `${rankStr}*` : rankStr;
  };


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
          <Button asChild variant="outline" size="sm">
            <Link href={`/teams/${previousTeam.id}/details`} title={`Precedente: ${previousTeam.name} (${rankText(previousTeam.rank, previousTeam.isTied)})`} className="flex items-center">
              <ChevronLeft className="w-4 h-4 mr-2" />
              <span className="truncate max-w-[100px] sm:max-w-[150px]">{previousTeam.name}</span>
              {previousTeam.rank && <span className="ml-1.5 text-xs text-muted-foreground">({previousTeam.rank}{previousTeam.isTied && '*'})</span>}
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft className="w-4 h-4 mr-2" /> Precedente
          </Button>
        )}
        {nextTeam ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/teams/${nextTeam.id}/details`} title={`Successiva: ${nextTeam.name} (${rankText(nextTeam.rank, nextTeam.isTied)})`} className="flex items-center">
              <span className="truncate max-w-[100px] sm:max-w-[150px]">{nextTeam.name}</span>
              {nextTeam.rank && <span className="ml-1.5 text-xs text-muted-foreground">({nextTeam.rank}{nextTeam.isTied && '*'})</span>}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Successiva <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>


      <div className="max-w-xl mx-auto">
        <TeamListItem
          team={teamWithDetails}
          allNations={allNationsData}
          nationGlobalCategorizedScoresArray={nationGlobalCategorizedScoresArray}
          isLeaderboardPodiumDisplay={true}
          disableEdit={true}
          isOwnTeamCard={user?.uid === teamWithDetails.userId}
        />
      </div>
    </div>
  );
}

    