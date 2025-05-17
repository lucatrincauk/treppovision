
"use client";

import * as React from "react";
import { useEffect, useState, useMemo } from "react";
import { getTeamsByUserId, getTeamsLockedStatus } from "@/lib/actions/team-actions";
import { listenToTeams } from "@/lib/team-service"; // Corrected import path for listenToTeams
import { getNations } from "@/lib/nation-service";
import { listenToAllVotesForAllNationsCategorized } from "@/lib/voting-service"; 
import type { Team, Nation, NationGlobalCategorizedScores, GlobalPrimaSquadraDetail, GlobalCategoryPickDetail, TeamWithScore as BaseTeamWithScore } from "@/types";
import { TeamListItem } from "@/components/teams/team-list-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Users, Loader2, Edit, Search, UserCircle as UserIcon, Lock, Music2, Star, Shirt, ThumbsDown, Award, CheckCircle, ListOrdered, ListChecks, Flag } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { TeamsSubNavigation } from "@/components/teams/teams-sub-navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getLeaderboardLockedStatus, getFinalPredictionsEnabledStatus, getUserRegistrationEnabledStatus } from "@/lib/actions/admin-actions";

interface LocalTeamWithScore extends BaseTeamWithScore {
  // Ensure all properties from TeamWithScore are here or make it extend properly
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
      if (!nation) return null;
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
        countryCode: nation.countryCode,
      };
    })
    .filter((item): item is { id: string; name: string; score: number | null; artistName?: string; songTitle?: string; countryCode?: string; } => {
      if (!item) return false;
      if (!scoresMap && typeof categoryKey === 'string' && (categoryKey === 'ranking' || categoryKey === 'juryRank' || categoryKey === 'televoteRank')) {
          return typeof item.score === 'number' && item.score > 0;
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
        return (a.name || "").localeCompare(b.name || "");
      }
      if (sortOrder === 'desc') {
        return (b.score as number) - (a.score as number);
      }
      return (a.score as number) - (b.score as number);
    });
};

const getCategoryPickPointsAndRank = (
  pickedNationId: string | undefined,
  sortedNationsForCategory: Array<{ id: string; name: string; score: number | null; artistName?: string; songTitle?: string; countryCode?: string; }>
): { points: number; rank?: number; score?: number | null } => {
  if (!pickedNationId || sortedNationsForCategory.length === 0) return { points: 0, rank: undefined, score: null };

  const rankIndex = sortedNationsForCategory.findIndex(n => n.id === pickedNationId);
  const actualRank = rankIndex !== -1 ? rankIndex + 1 : undefined;
  const actualScore = actualRank !== undefined && rankIndex < sortedNationsForCategory.length ? sortedNationsForCategory[rankIndex].score : null;

  let points = 0;
  if (actualRank === 1) points = 15;
  else if (actualRank === 2) points = 10;
  else if (actualRank === 3) points = 5;

  return { points, rank: actualRank, score: actualScore };
};


const PrimaSquadraNationDisplay = React.memo(({ detail, allNations, leaderboardLocked }: { detail: GlobalPrimaSquadraDetail, allNations: Nation[], leaderboardLocked: boolean | null }) => {
    const nation = allNations.find(n => n.id === detail.id);
    if (!nation) return <span className="text-xs text-muted-foreground">N/D</span>;
    
    const titleText = `${nation.name}${!leaderboardLocked && detail.actualRank && detail.actualRank > 0 ? ` (${detail.actualRank}°}` : ''}${nation.artistName ? ` - ${nation.artistName}` : ''}${nation.songTitle ? ` - ${nation.songTitle}` : ''}${!leaderboardLocked && typeof detail.points === 'number' ? ` Punti: ${detail.points}` : ''}`;

    return (
      <div className="flex items-center gap-1.5 py-0.5" title={titleText}>
        <Image
          src={`https://flagcdn.com/w20/${nation.countryCode.toLowerCase()}.png`}
          alt={nation.name || "Nazione"}
          width={20}
          height={13}
          className="rounded-sm border border-border/30 object-contain flex-shrink-0"
          data-ai-hint={`${nation.name} flag icon`}
        />
        <Link href={`/nations/${nation.id}`} className="text-xs hover:underline hover:text-primary">
          <span className="font-medium">{nation.name}</span>
        </Link>
      </div>
    );
  });
PrimaSquadraNationDisplay.displayName = 'PrimaSquadraNationDisplay';

const renderCategoryPickCell = (
    team: LocalTeamWithScore,
    category: "Miglior Canzone" | "Miglior Performance" | "Miglior Outfit" | "Peggior TreppoScore",
    allNations: Nation[],
    nationGlobalCategorizedScoresMap: Map<string, NationGlobalCategorizedScores>,
    leaderboardLocked: boolean | null
) => {
    let nationId: string | undefined;
    let categoryKey: keyof Omit<NationGlobalCategorizedScores, 'voteCount'>;
    let IconComponent: React.ElementType;
    let sortOrder: 'asc' | 'desc' = 'desc';

    switch (category) {
        case "Miglior Canzone":
            nationId = team.bestSongNationId;
            categoryKey = 'averageSongScore';
            IconComponent = Music2;
            break;
        case "Miglior Performance":
            nationId = team.bestPerformanceNationId;
            categoryKey = 'averagePerformanceScore';
            IconComponent = Star;
            break;
        case "Miglior Outfit":
            nationId = team.bestOutfitNationId;
            categoryKey = 'averageOutfitScore';
            IconComponent = Shirt;
            break;
        case "Peggior TreppoScore":
            nationId = team.worstTreppoScoreNationId;
            categoryKey = 'overallAverageScore'; 
            IconComponent = ThumbsDown;
            sortOrder = 'asc';
            break;
        default:
            return <span className="text-xs text-muted-foreground">N/D</span>;
    }

    const nation = nationId ? allNations.find(n => n.id === nationId) : null;
    if (!nation) return <span className="text-xs text-muted-foreground">Nessuna selezione</span>;

    const currentNationsMap = new Map(allNations.map(n => [n.id, n]));
    const sortedNationsForCategory = getTopNationsForCategory(nationGlobalCategorizedScoresMap, currentNationsMap, categoryKey, sortOrder);
    const pickInfo = getCategoryPickPointsAndRank(nationId, sortedNationsForCategory);
    const isCorrectPick = !leaderboardLocked && pickInfo.rank !== undefined && pickInfo.rank <= 3;

    return (
        <div className="flex items-center gap-1.5 text-xs">
            {isCorrectPick && <IconComponent className="h-3.5 w-3.5 text-accent" />}
            <Image
                src={`https://flagcdn.com/w20/${nation.countryCode.toLowerCase()}.png`}
                alt={nation.name}
                width={20}
                height={13}
                className="rounded-sm border border-border/30 object-contain flex-shrink-0"
                data-ai-hint={`${nation.name} flag icon`}
            />
            <Link href={`/nations/${nation.id}`} className="hover:underline hover:text-primary">
                <span className="font-medium">{nation.name}</span>
            </Link>
        </div>
    );
};


export default function TeamsPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const [allFetchedTeams, setAllFetchedTeams] = React.useState<Team[]>([]);
  const [userTeam, setUserTeam] = React.useState<LocalTeamWithScore | null>(null);
  const [otherTeams, setOtherTeams] = React.useState<LocalTeamWithScore[]>([]);
  const [filteredOtherTeams, setFilteredOtherTeams] = React.useState<LocalTeamWithScore[]>([]);

  const [allNations, setAllNations] = React.useState<Nation[]>([]);
  const [isLoadingNations, setIsLoadingNations] = React.useState(true);
  const [isLoadingUserTeamProcessing, setIsLoadingUserTeamProcessing] = React.useState(true);
  const [isLoadingAllTeams, setIsLoadingAllTeams] = React.useState(true);

  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");

  const [nationGlobalCategorizedScoresMap, setNationGlobalCategorizedScoresMap] = React.useState<Map<string, NationGlobalCategorizedScores>>(new Map());
  const [isLoadingGlobalScores, setIsLoadingGlobalScores] = React.useState(true);

  const [teamsLockedAdmin, setTeamsLockedAdmin] = React.useState<boolean | null>(null);
  const [leaderboardLockedAdmin, setLeaderboardLockedAdmin] = React.useState<boolean | null>(null);
  const [finalPredictionsEnabledAdmin, setFinalPredictionsEnabledAdmin] = React.useState<boolean | null>(null);
  const [userRegistrationEnabled, setUserRegistrationEnabled] = React.useState<boolean | null>(null);
  const [isLoadingAdminSettings, setIsLoadingAdminSettings] = React.useState(true);
  const [hasUserSubmittedFinalPredictions, setHasUserSubmittedFinalPredictions] = React.useState(false);

  const nationGlobalCategorizedScoresArray = React.useMemo(() => Array.from(nationGlobalCategorizedScoresMap.entries()), [nationGlobalCategorizedScoresMap]);

  useEffect(() => {
    async function fetchInitialSettingsAndData() {
      setIsLoadingAdminSettings(true);
      setIsLoadingNations(true); 
      try {
        const [
          teamsLock, 
          leaderboardLock, 
          finalPredictionsLock, 
          nationsData, 
          regStatus
        ] = await Promise.all([
          getTeamsLockedStatus(),
          getLeaderboardLockedStatus(),
          getFinalPredictionsEnabledStatus(),
          getNations(),
          getUserRegistrationEnabledStatus()
        ]);
        setTeamsLockedAdmin(teamsLock);
        setLeaderboardLockedAdmin(leaderboardLock);
        setFinalPredictionsEnabledAdmin(finalPredictionsLock);
        setAllNations(nationsData);
        setUserRegistrationEnabled(regStatus);
      } catch (err) {
        console.error("Failed to fetch admin lock statuses or nations:", err);
        setError(prev => prev ? `${prev}\nImpostazioni admin o nazioni non caricate.` : "Impostazioni admin o nazioni non caricate.");
      } finally {
        setIsLoadingAdminSettings(false);
        setIsLoadingNations(false); 
      }
    }
    if (!authIsLoading) { 
      fetchInitialSettingsAndData();
    }
  }, [authIsLoading]); 

  useEffect(() => {
    setIsLoadingGlobalScores(true);
    const unsubscribeGlobalScores = listenToAllVotesForAllNationsCategorized((scores) => {
      setNationGlobalCategorizedScoresMap(scores);
      setIsLoadingGlobalScores(false);
    });
    return () => unsubscribeGlobalScores();
  }, []);

  useEffect(() => {
    setIsLoadingAllTeams(true);
    const unsubscribeTeams = listenToTeams((teamsData) => { // This should use listenToTeams from team-service
      setAllFetchedTeams(teamsData);
      setIsLoadingAllTeams(false);
    }, (err) => {
      console.error("Failed to fetch all teams:", err);
      setError(prev => prev ? `${prev}\nErrore caricamento squadre.` : "Errore caricamento squadre.");
      setIsLoadingAllTeams(false);
    });
    return () => unsubscribeTeams();
  }, []);

  useEffect(() => {
    if (authIsLoading || isLoadingNations || isLoadingGlobalScores || isLoadingAdminSettings || isLoadingAllTeams) {
      setIsLoadingUserTeamProcessing(true);
      return;
    }
    setIsLoadingUserTeamProcessing(true);

    const currentNationsMap = new Map(allNations.map(n => [n.id, n]));

    try {
      // Official results based picks
      const topOverallRankNations = getTopNationsForCategory(null, currentNationsMap, 'ranking', 'asc');
      const topJuryRankNations = getTopNationsForCategory(null, currentNationsMap, 'juryRank', 'asc');
      const topTelevoteRankNations = getTopNationsForCategory(null, currentNationsMap, 'televoteRank', 'asc');
      
      // User-vote based TreppoScore picks
      const topTreppoScoreNations = getTopNationsForCategory(nationGlobalCategorizedScoresMap, currentNationsMap, 'overallAverageScore', 'desc');
      const topSongNations = getTopNationsForCategory(nationGlobalCategorizedScoresMap, currentNationsMap, 'averageSongScore', 'desc');
      const topPerformanceNations = getTopNationsForCategory(nationGlobalCategorizedScoresMap, currentNationsMap, 'averagePerformanceScore', 'desc');
      const topOutfitNations = getTopNationsForCategory(nationGlobalCategorizedScoresMap, currentNationsMap, 'averageOutfitScore', 'desc');
      const worstOverallScoreNations = getTopNationsForCategory(nationGlobalCategorizedScoresMap, currentNationsMap, 'overallAverageScore', 'asc');


      const processedAndScoredTeams: LocalTeamWithScore[] = allFetchedTeams.map(team => {
        let score = 0;
        let primaSquadraSubtotal = 0;
        let eurovisionPicksSubtotal = 0;
        let treppoScoreCategoryPicksSubtotal = 0;
        let bonusSubtotal = 0;
        let firstPlaceCategoryPicksCount = 0; 

        const primaSquadraDetails: GlobalPrimaSquadraDetail[] = [];
        (team.founderChoices || []).forEach((nationId) => {
          const nation = currentNationsMap.get(nationId);
          const points = nation ? getPointsForRank(nation.ranking) : 0;
          primaSquadraSubtotal += points;
          primaSquadraDetails.push({
            id: nationId,
            name: nation?.name || 'Sconosciuto',
            countryCode: nation?.countryCode || 'xx',
            artistName: nation?.artistName,
            songTitle: nation?.songTitle,
            actualRank: nation?.ranking,
            points,
          });
        });

        let currentBonusEnPlein = false;
        if (primaSquadraDetails.length === 3 && primaSquadraDetails.every(detail => detail.actualRank && detail.actualRank >= 1 && detail.actualRank <= 5)) {
          bonusSubtotal += 30;
          currentBonusEnPlein = true;
        }

        const categoryPicksDetails: GlobalCategoryPickDetail[] = [];

        const eurovisionWinnerPick = getCategoryPickPointsAndRank(team.eurovisionWinnerPickNationId, topOverallRankNations);
        eurovisionPicksSubtotal += eurovisionWinnerPick.points;
        if (eurovisionWinnerPick.rank === 1) firstPlaceCategoryPicksCount++;
        const eurovisionWinnerPickNation = team.eurovisionWinnerPickNationId ? currentNationsMap.get(team.eurovisionWinnerPickNationId) : undefined;
        categoryPicksDetails.push({ 
            categoryName: "Vincitore Eurovision", 
            pickedNationId: team.eurovisionWinnerPickNationId || "", 
            pickedNationName: eurovisionWinnerPickNation?.name, 
            pickedNationCountryCode: eurovisionWinnerPickNation?.countryCode, 
            artistName: eurovisionWinnerPickNation?.artistName, 
            songTitle: eurovisionWinnerPickNation?.songTitle, 
            actualCategoryRank: eurovisionWinnerPick.rank, 
            pointsAwarded: eurovisionWinnerPick.points, 
            iconName: "EurovisionWinner", 
            pickedNationScoreInCategory: eurovisionWinnerPick.score 
        });
        
        const juryWinnerPick = getCategoryPickPointsAndRank(team.juryWinnerPickNationId, topJuryRankNations);
        eurovisionPicksSubtotal += juryWinnerPick.points;
        if(juryWinnerPick.rank === 1) firstPlaceCategoryPicksCount++;
        const juryWinnerPickNation = team.juryWinnerPickNationId ? currentNationsMap.get(team.juryWinnerPickNationId) : undefined;
        categoryPicksDetails.push({ 
            categoryName: "Vincitore Giuria", 
            pickedNationId: team.juryWinnerPickNationId || "", 
            pickedNationName: juryWinnerPickNation?.name, 
            pickedNationCountryCode: juryWinnerPickNation?.countryCode, 
            artistName: juryWinnerPickNation?.artistName, 
            songTitle: juryWinnerPickNation?.songTitle, 
            actualCategoryRank: juryWinnerPick.rank, 
            pointsAwarded: juryWinnerPick.points, 
            iconName: "JuryWinner", 
            pickedNationScoreInCategory: juryWinnerPick.score 
        });

        const televoteWinnerPick = getCategoryPickPointsAndRank(team.televoteWinnerPickNationId, topTelevoteRankNations);
        eurovisionPicksSubtotal += televoteWinnerPick.points;
        if(televoteWinnerPick.rank === 1) firstPlaceCategoryPicksCount++;
        const televoteWinnerPickNation = team.televoteWinnerPickNationId ? currentNationsMap.get(team.televoteWinnerPickNationId) : undefined;
        categoryPicksDetails.push({ 
            categoryName: "Vincitore Televoto", 
            pickedNationId: team.televoteWinnerPickNationId || "", 
            pickedNationName: televoteWinnerPickNation?.name, 
            pickedNationCountryCode: televoteWinnerPickNation?.countryCode, 
            artistName: televoteWinnerPickNation?.artistName, 
            songTitle: televoteWinnerPickNation?.songTitle, 
            actualCategoryRank: televoteWinnerPick.rank, 
            pointsAwarded: televoteWinnerPick.points, 
            iconName: "TelevoteWinner", 
            pickedNationScoreInCategory: televoteWinnerPick.score 
        });
        
        const bestTreppoPick = getCategoryPickPointsAndRank(team.bestTreppoScoreNationId, topTreppoScoreNations);
        treppoScoreCategoryPicksSubtotal += bestTreppoPick.points;
        if(bestTreppoPick.rank === 1) firstPlaceCategoryPicksCount++;
        const bestTreppoPickNation = team.bestTreppoScoreNationId ? currentNationsMap.get(team.bestTreppoScoreNationId) : undefined;
        categoryPicksDetails.push({ 
            categoryName: "Miglior TreppoScore", 
            pickedNationId: team.bestTreppoScoreNationId || "", 
            pickedNationName: bestTreppoPickNation?.name, 
            pickedNationCountryCode: bestTreppoPickNation?.countryCode, 
            artistName: bestTreppoPickNation?.artistName, 
            songTitle: bestTreppoPickNation?.songTitle, 
            actualCategoryRank: bestTreppoPick.rank, 
            pointsAwarded: bestTreppoPick.points, 
            iconName: "Award", 
            pickedNationScoreInCategory: bestTreppoPick.score 
        });
        
        const bestSongPick = getCategoryPickPointsAndRank(team.bestSongNationId, topSongNations);
        treppoScoreCategoryPicksSubtotal += bestSongPick.points;
        if(bestSongPick.rank === 1) firstPlaceCategoryPicksCount++;
        const bestSongPickNation = team.bestSongNationId ? currentNationsMap.get(team.bestSongNationId) : undefined;
        categoryPicksDetails.push({ 
            categoryName: "Miglior Canzone", 
            pickedNationId: team.bestSongNationId || "", 
            pickedNationName: bestSongPickNation?.name, 
            pickedNationCountryCode: bestSongPickNation?.countryCode, 
            artistName: bestSongPickNation?.artistName, 
            songTitle: bestSongPickNation?.songTitle, 
            actualCategoryRank: bestSongPick.rank, 
            pointsAwarded: bestSongPick.points, 
            iconName: "Music2", 
            pickedNationScoreInCategory: bestSongPick.score 
        });

        const bestPerfPick = getCategoryPickPointsAndRank(team.bestPerformanceNationId, topPerformanceNations);
        treppoScoreCategoryPicksSubtotal += bestPerfPick.points;
        if(bestPerfPick.rank === 1) firstPlaceCategoryPicksCount++;
        const bestPerfPickNation = team.bestPerformanceNationId ? currentNationsMap.get(team.bestPerformanceNationId) : undefined;
        categoryPicksDetails.push({ 
            categoryName: "Miglior Performance", 
            pickedNationId: team.bestPerformanceNationId || "", 
            pickedNationName: bestPerfPickNation?.name, 
            pickedNationCountryCode: bestPerfPickNation?.countryCode, 
            artistName: bestPerfPickNation?.artistName, 
            songTitle: bestPerfPickNation?.songTitle, 
            actualCategoryRank: bestPerfPick.rank, 
            pointsAwarded: bestPerfPick.points, 
            iconName: "Star", 
            pickedNationScoreInCategory: bestPerfPick.score 
        });
        
        const bestOutfitPick = getCategoryPickPointsAndRank(team.bestOutfitNationId, topOutfitNations);
        treppoScoreCategoryPicksSubtotal += bestOutfitPick.points;
        if(bestOutfitPick.rank === 1) firstPlaceCategoryPicksCount++;
        const bestOutfitPickNation = team.bestOutfitNationId ? currentNationsMap.get(team.bestOutfitNationId) : undefined;
        categoryPicksDetails.push({ 
            categoryName: "Miglior Outfit", 
            pickedNationId: team.bestOutfitNationId || "", 
            pickedNationName: bestOutfitPickNation?.name, 
            pickedNationCountryCode: bestOutfitPickNation?.countryCode, 
            artistName: bestOutfitPickNation?.artistName, 
            songTitle: bestOutfitPickNation?.songTitle, 
            actualCategoryRank: bestOutfitPick.rank, 
            pointsAwarded: bestOutfitPick.points, 
            iconName: "Shirt", 
            pickedNationScoreInCategory: bestOutfitPick.score 
        });

        const worstPick = getCategoryPickPointsAndRank(team.worstTreppoScoreNationId, worstOverallScoreNations); // worstTreppoScoreNationId for Peggior TreppoScore
        treppoScoreCategoryPicksSubtotal += worstPick.points;
        if(worstPick.rank === 1) firstPlaceCategoryPicksCount++;
        const worstPickNation = team.worstTreppoScoreNationId ? currentNationsMap.get(team.worstTreppoScoreNationId) : undefined;
        categoryPicksDetails.push({ 
            categoryName: "Peggior TreppoScore", // Label
            pickedNationId: team.worstTreppoScoreNationId || "", 
            pickedNationName: worstPickNation?.name, 
            pickedNationCountryCode: worstPickNation?.countryCode, 
            artistName: worstPickNation?.artistName, 
            songTitle: worstPickNation?.songTitle, 
            actualCategoryRank: worstPick.rank, 
            pointsAwarded: worstPick.points, 
            iconName: "ThumbsDown", 
            pickedNationScoreInCategory: worstPick.score 
        });
        
        score = primaSquadraSubtotal + eurovisionPicksSubtotal + treppoScoreCategoryPicksSubtotal;

        let currentBonusCampione = false;
        let currentBonusGranCampione = false;

        if (firstPlaceCategoryPicksCount >= 4) { 
          bonusSubtotal += 30;
          currentBonusGranCampione = true;
        } else if (firstPlaceCategoryPicksCount >= 2 && firstPlaceCategoryPicksCount < 4) { 
          bonusSubtotal += 5;
          currentBonusCampione = true;
        }
        
        score += bonusSubtotal;

        const teamWithDetails: LocalTeamWithScore = {
          ...team,
          primaSquadraScore: primaSquadraSubtotal,
          eurovisionPicksScore: eurovisionPicksSubtotal,
          treppoScoreCategoryPicksScore: treppoScoreCategoryPicksSubtotal,
          bonusTotalScore: bonusSubtotal,
          score: leaderboardLockedAdmin ? undefined : score,
          primaSquadraDetails,
          categoryPicksDetails,
          bonusCampionePronostici: currentBonusCampione,
          bonusGranCampionePronostici: currentBonusGranCampione,
          bonusEnPleinTop5: currentBonusEnPlein,
        };
        return teamWithDetails;
      });

      if (user) {
        const currentTeam = processedAndScoredTeams.find(t => t.userId === user.uid) || null;
        setUserTeam(currentTeam);
        if (currentTeam) {
          const existingPreds =
            !!currentTeam.eurovisionWinnerPickNationId ||
            !!currentTeam.juryWinnerPickNationId ||
            !!currentTeam.televoteWinnerPickNationId ||
            !!currentTeam.bestTreppoScoreNationId ||
            !!currentTeam.bestSongNationId ||
            !!currentTeam.bestPerformanceNationId ||
            !!currentTeam.bestOutfitNationId ||
            !!currentTeam.worstTreppoScoreNationId;
          setHasUserSubmittedFinalPredictions(existingPreds);
        } else {
          setHasUserSubmittedFinalPredictions(false);
        }
      } else {
        setUserTeam(null);
        setHasUserSubmittedFinalPredictions(false);
      }
      setOtherTeams(processedAndScoredTeams.filter(t => !user || t.userId !== user.uid).sort((a, b) => (a.name || "").localeCompare(b.name || "")));
    } catch (e) {
      console.error("Error processing team scores on TeamsPage:", e);
      setError("Errore durante l'elaborazione dei dati delle squadre.");
    } finally {
      setIsLoadingUserTeamProcessing(false);
    }
  }, [
    allFetchedTeams, allNations,
    nationGlobalCategorizedScoresMap, leaderboardLockedAdmin,
    authIsLoading, user,
    isLoadingNations, isLoadingGlobalScores, isLoadingAdminSettings, isLoadingAllTeams
  ]);


  useEffect(() => {
    if (!searchTerm) {
      setFilteredOtherTeams(otherTeams);
      return;
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const filtered = otherTeams.filter(
      (team) =>
        (team.name || "").toLowerCase().includes(lowercasedSearchTerm) ||
        (team.creatorDisplayName && team.creatorDisplayName.toLowerCase().includes(lowercasedSearchTerm))
    );
    setFilteredOtherTeams(filtered);
  }, [searchTerm, otherTeams]);

  const overallIsLoading = authIsLoading || isLoadingNations || isLoadingGlobalScores || isLoadingAdminSettings || isLoadingAllTeams || isLoadingUserTeamProcessing;

  if (overallIsLoading) {
    return (
      <div className="space-y-8">
        <TeamsSubNavigation />
         <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
            <header className="text-center sm:text-left space-y-2 flex-grow">
              <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary flex items-center">
                <Users className="mr-3 h-10 w-10" />
                Squadre TreppoVision
              </h1>
              <p className="text-xl text-muted-foreground">
                Scopri tutte le squadre create dagli utenti e le loro scelte.
              </p>
            </header>
             <div className="flex-shrink-0 self-center sm:self-auto">
              {user && !userTeam && !teamsLockedAdmin && !isLoadingAdminSettings && (
                <Button asChild variant="default" size="lg">
                  <Link href="/teams/new">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Crea Nuova Squadra
                  </Link>
                </Button>
              )}
              {user && teamsLockedAdmin && !userTeam && !isLoadingAdminSettings && (
                <Button variant="outline" size="lg" disabled>
                  <Lock className="mr-2 h-5 w-5" />
                  Creazione Bloccata
                </Button>
              )}
            </div>
        </div>
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
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <header className="text-center sm:text-left space-y-2 flex-grow">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary flex items-center">
                <Users className="mr-3 h-10 w-10" />
                Squadre TreppoVision
                </h1>
                <p className="text-xl text-muted-foreground">
                Scopri tutte le squadre create dagli utenti e le loro scelte.
                </p>
            </header>
        </div>
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

  const displayHeaderAndButtons = () => (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <header className="text-center sm:text-left space-y-2 flex-grow">
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary flex items-center">
            <Users className="mr-3 h-10 w-10" />
            Squadre TreppoVision
            </h1>
            <p className="text-xl text-muted-foreground">
            Scopri tutte le squadre create dagli utenti e le loro scelte.
            </p>
        </header>
        <div className="flex-shrink-0 self-center sm:self-auto">
            {user && !userTeam && !teamsLockedAdmin && (
                <Button asChild variant="default" size="lg">
                <Link href="/teams/new">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Crea Nuova Squadra
                </Link>
                </Button>
            )}
            {user && teamsLockedAdmin && !userTeam && (
                <Button variant="outline" size="lg" disabled>
                    <Lock className="mr-2 h-5 w-5"/>
                    Creazione Bloccata
                </Button>
            )}
        </div>
      </div>
  );

  return (
    <div className="space-y-8">
      <TeamsSubNavigation />
      {displayHeaderAndButtons()}

      {!user && allFetchedTeams.length > 0 && (
        <Alert>
          <Users className="h-4 w-4" />
          <AlertTitle>Visualizzazione Pubblica</AlertTitle>
          <AlertDescription>
            Stai visualizzando le squadre come ospite. {' '}
            <Button variant="link" asChild className="p-0 ml-1 font-bold hover:underline">
              <Link href="#" onClick={(e) => {
                e.preventDefault();
                const authButtonDialogTrigger = document.querySelector('button[aria-label="Open authentication dialog"], button>svg.lucide-log-in') as HTMLElement | null;
                if (authButtonDialogTrigger) {
                    if (authButtonDialogTrigger.tagName === 'BUTTON') { authButtonDialogTrigger.click(); }
                    else if (authButtonDialogTrigger.parentElement?.tagName === 'BUTTON') { (authButtonDialogTrigger.parentElement as HTMLElement).click(); }
                }
              }}>Accedi</Link>
            </Button>
            {userRegistrationEnabled ? ' per creare o modificare la tua squadra.' : ' per modificare la tua squadra.'}
          </AlertDescription>
        </Alert>
      )}
        <div className="flex items-center justify-between mb-6">
            <div className="flex-grow">
                {user && userTeam && (
                    <h2 className="text-3xl font-semibold tracking-tight text-primary">
                        La Mia Squadra
                    </h2>
                )}
            </div>
            {user && userTeam && !teamsLockedAdmin && (
                <Button asChild variant="default" size="sm" className="w-auto ml-4">
                    <Link href={`/teams/${userTeam.id}/edit`}>
                        <Edit className="h-4 w-4 sm:mr-1.5" />
                        <span className="hidden sm:inline">Modifica Squadra</span>
                    </Link>
                </Button>
            )}
            {user && userTeam && teamsLockedAdmin && (
                <Button variant="outline" size="sm" disabled className="w-auto ml-4">
                    <Lock className="h-4 w-4 sm:mr-1.5"/>
                    <span className="hidden sm:inline">Modifica Bloccata</span>
                </Button>
            )}
        </div>


      {user && userTeam && allNations.length > 0 && !isLoadingGlobalScores && !isLoadingUserTeamProcessing && (
        <section className="mb-12">
          <TeamListItem
            team={userTeam}
            allNations={allNations}
            nationGlobalCategorizedScoresArray={nationGlobalCategorizedScoresArray}
            isOwnTeamCard={true}
            defaultOpenSections={["treppovision", "pronosticiEurovision", "pronosticiTreppoScore", "bonus"]}
          />
          <div className="mt-4 flex justify-center">
            {user && userTeam && finalPredictionsEnabledAdmin && !hasUserSubmittedFinalPredictions && (
                <Button asChild variant="secondary" size="lg" className="w-full sm:w-auto">
                    <Link href={`/teams/${userTeam.id}/pronostici`}>
                        <ListOrdered className="mr-2 h-5 w-5" />
                        <span className="mr-2">Pronostici Finali</span>
                    </Link>
                </Button>
            )}
            {user && userTeam && hasUserSubmittedFinalPredictions && (
                <Button variant="outline" size="lg" disabled className="w-full sm:w-auto">
                    <ListOrdered className="mr-2 h-5 w-5"/>
                    <span className="mr-2">Pronostici Inviati</span>
                </Button>
            )}
            {user && userTeam && (!finalPredictionsEnabledAdmin) && !hasUserSubmittedFinalPredictions && (
                <Button variant="outline" size="lg" disabled className="w-full sm:w-auto">
                    <Lock className="h-5 w-5 mr-2"/>
                    <span className="mr-2">Pronostici Bloccati</span>
                </Button>
            )}
            </div>
        </section>
      )}

      <section className="pt-6 border-t border-border">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="text-3xl font-semibold tracking-tight text-left text-secondary">
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

        {!isLoadingAllTeams && allNations.length === 0 && allFetchedTeams.length > 0 && (
          <Alert variant="destructive">
            <Users className="h-4 w-4" />
            <AlertTitle>Dati Nazioni Mancanti</AlertTitle>
            <AlertDescription>
              Impossibile caricare i dati delle nazioni. Le squadre non possono essere visualizzate correttamente.
            </AlertDescription>
          </Alert>
        )}

        {!isLoadingAllTeams && allFetchedTeams.length === 0 && allNations.length > 0 && (
          <Alert>
            <Users className="h-4 w-4" />
            <AlertTitle>Nessuna Squadra Ancora!</AlertTitle>
            <AlertDescription>
              Non ci sono ancora squadre. {user && !userTeam && !teamsLockedAdmin && userRegistrationEnabled ? "Sii il primo a crearne una!" : !user && userRegistrationEnabled ? "Effettua il login per crearne una." : ""}
            </AlertDescription>
          </Alert>
        )}

      {!isLoadingAllTeams && allNations.length === 0 && allFetchedTeams.length === 0 && (
          <Alert variant="destructive">
            <Users className="h-4 w-4" />
            <AlertTitle>Dati Iniziali Mancanti</AlertTitle>
            <AlertDescription>
                Nessuna nazione trovata in Firestore. Le nazioni sono necessarie per creare e visualizzare le squadre.
                Assicurati che la collezione 'nations' sia popolata.
            </AlertDescription>
          </Alert>
      )}

        {!isLoadingAllTeams && filteredOtherTeams.length > 0 && allNations.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Squadra</TableHead>
                    <TableHead>Nazioni Squadra</TableHead>
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
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {(team.founderChoices || []).map(nationId => (
                            <PrimaSquadraNationDisplay
                              key={`${team.id}-${nationId}-prima`}
                              detail={{ id: nationId, name: "", countryCode: "", points: 0 }}
                              allNations={allNations}
                              leaderboardLocked={leaderboardLockedAdmin}
                            />
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : !isLoadingAllTeams && searchTerm && allNations.length > 0 ? (
          <p className="text-center text-muted-foreground py-10">Nessuna squadra trovata corrispondente alla tua ricerca.</p>
        ) : !isLoadingAllTeams && filteredOtherTeams.length === 0 && !searchTerm && allFetchedTeams.length > 0 && !userTeam ? (
          <p className="text-center text-muted-foreground py-10">Nessun'altra squadra creata dagli utenti.</p>
        ) : !isLoadingAllTeams && filteredOtherTeams.length === 0 && !searchTerm && !userTeam && allFetchedTeams.length === 0 ? (
            null
        ) : null }
      </section>
    </div>
  );
}
