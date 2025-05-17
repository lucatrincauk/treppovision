
"use client";

import { getTeams } from "@/lib/team-service";
import { getNations } from "@/lib/nation-service";
import { getAllNationsGlobalCategorizedScores } from "@/lib/voting-service";
import type { Team, Nation, NationGlobalCategorizedScores, GlobalPrimaSquadraDetail, GlobalCategoryPickDetail as BaseGlobalCategoryPickDetail } from "@/types";
import { TeamsSubNavigation } from "@/components/teams/teams-sub-navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, UserCircle, BarChartBig, Info, BadgeCheck, Music2, Star, Shirt, ThumbsDown, Award, TrendingUp, Lock as LockIcon, Loader2, Edit, CheckCircle, ListChecks, ChevronDown, Flag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TeamList } from "@/components/teams/team-list";
import { getAdminSettingsAction } from "@/lib/actions/admin-actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { TeamListItem } from "@/components/teams/team-list-item";

interface LocalCategoryPickDetail extends BaseGlobalCategoryPickDetail {
  iconName: string;
}

interface TeamWithScore extends Team {
  score: number;
  primaSquadraDetails: GlobalPrimaSquadraDetail[];
  categoryPicksDetails: LocalCategoryPickDetail[];
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

const getRankText = (rank?: number, isTied?: boolean): string => {
  if (rank === undefined || rank === null || rank <= 0) return "";
  let rankStr = "";
  switch (rank) {
    case 1: rankStr = "Primo Posto"; break;
    case 2: rankStr = "Secondo Posto"; break;
    case 3: rankStr = "Terzo Posto"; break;
    default: rankStr = `${rank}° Posto`;
  }
  return isTied ? `${rankStr}*` : rankStr;
};

const rankTextColorClass = (rank?: number) => {
  if (rank === undefined || rank === null || rank === 0 || rank > 3) return "text-muted-foreground";
  if (rank === 1) return "text-yellow-400";
  if (rank === 2) return "text-slate-400";
  if (rank === 3) return "text-amber-500";
  return "text-muted-foreground";
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
      // For categories based on aggregated scores (scoresMap)
      if (scoresMap && typeof categoryKey === 'string' && (scoresMap.get(nation.id) || {})[categoryKey as keyof NationGlobalCategorizedScores] !== undefined) {
        scoreValue = (scoresMap.get(nation.id) as any)?.[categoryKey] ?? null;
      // For categories based on Firestore 'Nation' object fields (ranking, juryRank, televoteRank)
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
    .filter(item => {
      // For categories based on Firestore 'Nation' object fields (ranking, juryRank, televoteRank)
      if (!scoresMap && typeof categoryKey === 'string' && (categoryKey === 'ranking' || categoryKey === 'juryRank' || categoryKey === 'televoteRank')) {
          return typeof item.score === 'number' && item.score > 0; // Ranks must be > 0
      }
      // For categories based on aggregated scores (scoresMap)
      if (scoresMap && typeof categoryKey === 'string' && (scoresMap.get(item.id) || {})[categoryKey as keyof NationGlobalCategorizedScores] !== undefined) {
        // For 'Peggior TreppoScore', we need to include nations with scores, even if low or zero, but must have votes.
        if (categoryKey === 'overallAverageScore' && sortOrder === 'asc') { 
             return typeof item.score === 'number' && (scoresMap.get(item.id)?.voteCount || 0) > 0;
        }
        return typeof item.score === 'number' && (scoresMap.get(item.id)?.voteCount || 0) > 0;
      }
      return false; // Default to false if categoryKey type doesn't match expected patterns
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

const TableMedalIcon = React.memo(({ rank }: { rank?: number }) => {
  if (rank === undefined || rank === null || rank === 0 || rank > 3) return null;
  let colorClass = "";
  if (rank === 1) colorClass = "text-yellow-400";
  else if (rank === 2) colorClass = "text-slate-400";
  else if (rank === 3) colorClass = "text-amber-500";
  return <Award className={cn("w-4 h-4 inline-block mr-1", colorClass)} />;
});
TableMedalIcon.displayName = 'TableMedalIcon';


const PrimaSquadraNationDisplay = React.memo(({ detail, nation, leaderboardLockedAdmin }: { detail: GlobalPrimaSquadraDetail; nation?: Nation; leaderboardLockedAdmin: boolean | null }) => {
  if (!nation) return <div className="text-xs text-muted-foreground pl-7">Nazione pick non trovata</div>;

  const rankText = !leaderboardLockedAdmin && detail.actualRank && detail.actualRank > 0 ? `(${detail.actualRank}°)` : "";
  const titleText = `${nation.name}${rankText ? ` ${rankText}` : ''}${nation.artistName ? ` - ${nation.artistName}` : ''}${nation.songTitle ? ` - ${nation.songTitle}` : ''}${!leaderboardLockedAdmin && typeof detail.points === 'number' ? ` Punti: ${detail.points}` : ''}`;

  return (
    <div className={cn("w-full flex items-center justify-between", detail.isEvenRow ? "bg-muted/50 rounded-md" : "")}>
        <div className="flex items-center gap-1.5 pl-2 py-1">
        <BadgeCheck className="w-5 h-5 text-accent shrink-0 mr-1" />
        <div className="flex items-center gap-1.5">
            <Image
            src={`https://flagcdn.com/w20/${nation.countryCode.toLowerCase()}.png`}
            alt={nation.name}
            width={20}
            height={13}
            className="rounded-sm border border-border/30 object-contain shrink-0"
            data-ai-hint={`${nation.name} flag`}
            />
             <div className="flex flex-col items-start">
                <Link
                    href={`/nations/${nation.id}`}
                    className="group text-xs hover:underline hover:text-primary flex items-center gap-0.5"
                    title={titleText}
                >
                    <span className="font-medium">{nation.name}</span>
                    {!leaderboardLockedAdmin && detail.actualRank && [1, 2, 3].includes(detail.actualRank) && <TableMedalIcon rank={detail.actualRank} />}
                    {rankText && (
                    <span className={cn(
                        "text-xs ml-0.5",
                        !leaderboardLockedAdmin && detail.actualRank && [1,2,3].includes(detail.actualRank) ?
                        (rankTextColorClass(detail.actualRank))
                        : "text-muted-foreground/80"
                    )}>
                        {rankText}
                    </span>
                    )}
                </Link>
                 {!leaderboardLockedAdmin && (nation.artistName || nation.songTitle) && (
                    <span className="text-[10px] text-muted-foreground/80 block">
                    {nation.artistName}{nation.artistName && nation.songTitle && " - "}{nation.songTitle}
                    </span>
                )}
            </div>
        </div>
        </div>
      {!leaderboardLockedAdmin && typeof detail.points === 'number' && (
        <span className={cn(
          "text-xs ml-auto pl-1 pr-2 shrink-0 self-center font-semibold",
          detail.points > 0 ? "text-primary" :
          detail.points < 0 ? "text-destructive" :
          "text-muted-foreground"
        )}>
          {detail.points > 0 ? `+${detail.points}` : detail.points}pt
        </span>
      )}
    </div>
  );
});
PrimaSquadraNationDisplay.displayName = 'PrimaSquadraNationDisplay';

const CategoryPickDisplay = React.memo(({ detail, nation, leaderboardLockedAdmin }: { detail: LocalCategoryPickDetail; nation?: Nation; leaderboardLockedAdmin: boolean | null }) => {
  let IconComponent: React.ElementType = Info;
  switch (detail.iconName) {
    case "EurovisionWinner": IconComponent = Award; break;
    case "JuryWinner": IconComponent = Users; break;
    case "TelevoteWinner": IconComponent = Flag; break;
    case "Award": IconComponent = Award; break; 
    case "Music2": IconComponent = Music2; break;
    case "Star": IconComponent = Star; break;
    case "Shirt": IconComponent = Shirt; break;
    case "ThumbsDown": IconComponent = ThumbsDown; break;
    default: IconComponent = Info;
  }

  const iconColorClass = "text-accent";
  const actualCategoryRank = detail.actualCategoryRank;
  
  let rankSuffix = "";
  if (detail.categoryName === "Peggior TreppoScore") {
    rankSuffix = " peggiore";
  }

  const rankText = !leaderboardLockedAdmin && actualCategoryRank && actualCategoryRank > 0
    ? `(${actualCategoryRank}°${rankSuffix})`
    : "";

  return (
    <div className={cn("w-full", detail.isEvenRow ? "bg-muted/50 rounded-md" : "")}>
      <div className="flex items-center justify-between w-full px-2 py-1.5">
        <div className="flex items-center gap-1.5">
          <IconComponent className={cn("w-4 h-4 flex-shrink-0", iconColorClass)} />
          <p className="text-xs font-medium text-foreground/90 min-w-[120px] shrink-0">
            {detail.categoryName}
          </p>
        </div>
        {typeof detail.pointsAwarded === 'number' && !leaderboardLockedAdmin && (
          <span
            className={cn(
              "text-xs font-semibold ml-auto",
              detail.pointsAwarded > 0 ? "text-primary" :
              detail.pointsAwarded === 0 ? "text-muted-foreground" :
              "text-destructive"
            )}
          >
            {detail.pointsAwarded >= 0 ? "+" : ""}{detail.pointsAwarded}pt
          </span>
        )}
      </div>

        <div className="w-full mt-0.5 pl-[calc(1rem+theme(spacing.1_5)+theme(spacing.1_5))]"> 
        {nation ? (
          <div className="flex items-center gap-1.5">
            <Image
              src={`https://flagcdn.com/w20/${nation.countryCode.toLowerCase()}.png`}
              alt={nation.name}
              width={20}
              height={13}
              className="rounded-sm border border-border/30 object-contain shrink-0"
              data-ai-hint={`${nation.name} flag`}
            />
            <Link href={`/nations/${nation.id}`}
              className="group text-xs hover:underline hover:text-primary flex items-center gap-0.5"
              title={`${nation.name} ${rankText ? rankText + " ": ""}${nation.artistName ? `- ${nation.artistName} ` : ''}${nation.songTitle ? `- ${nation.songTitle}` : ''}`}
            >
              <span className="font-medium">{nation.name}</span>
              {!leaderboardLockedAdmin && actualCategoryRank && [1, 2, 3].includes(actualCategoryRank) && <TableMedalIcon rank={actualCategoryRank} />}
              {rankText && (
                <span className={cn(
                  "text-xs ml-0.5",
                    !leaderboardLockedAdmin && actualCategoryRank && [1,2,3].includes(actualCategoryRank) ?
                    rankTextColorClass(actualCategoryRank) :
                    "text-muted-foreground/80"
                )}>
                  {rankText}
                </span>
              )}
            </Link>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Nessuna selezione</span>
        )}
      </div>
    </div>
  );
});
CategoryPickDisplay.displayName = 'CategoryPickDisplay';


export default function TeamsLeaderboardPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const [adminSettings, setAdminSettings] = React.useState<Awaited<ReturnType<typeof getAdminSettingsAction>> | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = React.useState(true);

  const [teamsWithScores, setTeamsWithScores] = React.useState<TeamWithScore[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(true);

  const [allNations, setAllNations] = React.useState<Nation[]>([]);
  const [globalCategorizedScoresMap, setGlobalCategorizedScoresMap] = React.useState<Map<string, NationGlobalCategorizedScores>>(new Map());

  const globalCategorizedScoresArray = React.useMemo(() => Array.from(globalCategorizedScoresMap.entries()), [globalCategorizedScoresMap]);

  const [selectedTeamDetail, setSelectedTeamDetail] = React.useState<TeamWithScore | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);

  useEffect(() => {
    async function fetchPageData() {
      setIsLoadingSettings(true);
      setIsLoadingData(true);
      try {
        const settings = await getAdminSettingsAction();
        setAdminSettings(settings);
        if (settings.leaderboardLocked) {
          setIsLoadingData(false);
          setIsLoadingSettings(false);
          setTeamsWithScores([]);
          setAllNations([]);
          setGlobalCategorizedScoresMap(new Map());
          return;
        }

        const [fetchedTeams, fetchedNationsData, fetchedGlobalScoresMapData] = await Promise.all([
          getTeams(),
          getNations(),
          getAllNationsGlobalCategorizedScores()
        ]);

        setAllNations(fetchedNationsData);
        const currentNationsMap = new Map(fetchedNationsData.map(nation => [nation.id, nation]));
        setGlobalCategorizedScoresMap(fetchedGlobalScoresMapData);

        // For official results based picks
        const topOverallRankNations = getTopNationsForCategory(null, currentNationsMap, 'ranking', 'asc');
        const topJuryRankNations = getTopNationsForCategory(null, currentNationsMap, 'juryRank', 'asc');
        const topTelevoteRankNations = getTopNationsForCategory(null, currentNationsMap, 'televoteRank', 'asc');
        
        // For user-vote based TreppoScore picks
        const topTreppoScoreNations = getTopNationsForCategory(fetchedGlobalScoresMapData, currentNationsMap, 'overallAverageScore', 'desc');
        const topSongNations = getTopNationsForCategory(fetchedGlobalScoresMapData, currentNationsMap, 'averageSongScore', 'desc');
        const topPerformanceNations = getTopNationsForCategory(fetchedGlobalScoresMapData, currentNationsMap, 'averagePerformanceScore', 'desc');
        const topOutfitNations = getTopNationsForCategory(fetchedGlobalScoresMapData, currentNationsMap, 'averageOutfitScore', 'desc');
        const worstOverallScoreNations = getTopNationsForCategory(fetchedGlobalScoresMapData, currentNationsMap, 'overallAverageScore', 'asc');


        let calculatedTeams: TeamWithScore[] = fetchedTeams.map(team => {
          let score = 0;
          let primaSquadraSubtotal = 0;
          let eurovisionPicksSubtotal = 0;
          let treppoScoreCategoryPicksSubtotal = 0;
          let bonusSubtotal = 0;
          let bonusCampionePronostici = false;
          let bonusGranCampionePronostici = false;
          let bonusEnPleinTop5 = false;

          const primaSquadraDetails: GlobalPrimaSquadraDetail[] = [];
          (team.founderChoices || []).forEach((nationId, index) => {
            const nation = currentNationsMap.get(nationId);
            if (nation) {
              const points = getPointsForRank(nation.ranking);
              primaSquadraSubtotal += points;
              primaSquadraDetails.push({
                id: nation.id,
                name: nation.name,
                countryCode: nation.countryCode,
                artistName: nation.artistName,
                songTitle: nation.songTitle,
                actualRank: nation.ranking,
                points,
                isEvenRow: index % 2 !== 0
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
          const eurovisionWinnerPickNation = team.eurovisionWinnerPickNationId ? currentNationsMap.get(team.eurovisionWinnerPickNationId) : undefined;
          const eurovisionWinnerPick = getCategoryPickPointsAndRank(team.eurovisionWinnerPickNationId, topOverallRankNations);
          eurovisionPicksSubtotal += eurovisionWinnerPick.points;
          if (eurovisionWinnerPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({
            categoryName: "Vincitore Eurovision", pickedNationId: team.eurovisionWinnerPickNationId || "",
            pickedNationName: eurovisionWinnerPickNation?.name, pickedNationCountryCode: eurovisionWinnerPickNation?.countryCode,
            artistName: eurovisionWinnerPickNation?.artistName, songTitle: eurovisionWinnerPickNation?.songTitle,
            actualCategoryRank: eurovisionWinnerPick.rank, pickedNationScoreInCategory: eurovisionWinnerPick.score,
            pointsAwarded: eurovisionWinnerPick.points, iconName: "EurovisionWinner"
          });

          const juryWinnerPickNation = team.juryWinnerPickNationId ? currentNationsMap.get(team.juryWinnerPickNationId) : undefined;
          const juryWinnerPick = getCategoryPickPointsAndRank(team.juryWinnerPickNationId, topJuryRankNations);
          eurovisionPicksSubtotal += juryWinnerPick.points;
          if (juryWinnerPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({
            categoryName: "Vincitore Giuria", pickedNationId: team.juryWinnerPickNationId || "",
            pickedNationName: juryWinnerPickNation?.name, pickedNationCountryCode: juryWinnerPickNation?.countryCode,
            artistName: juryWinnerPickNation?.artistName, songTitle: juryWinnerPickNation?.songTitle,
            actualCategoryRank: juryWinnerPick.rank, pickedNationScoreInCategory: juryWinnerPick.score,
            pointsAwarded: juryWinnerPick.points, iconName: "JuryWinner"
          });

          const televoteWinnerPickNation = team.televoteWinnerPickNationId ? currentNationsMap.get(team.televoteWinnerPickNationId) : undefined;
          const televoteWinnerPick = getCategoryPickPointsAndRank(team.televoteWinnerPickNationId, topTelevoteRankNations);
          eurovisionPicksSubtotal += televoteWinnerPick.points;
          if (televoteWinnerPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({
            categoryName: "Vincitore Televoto", pickedNationId: team.televoteWinnerPickNationId || "",
            pickedNationName: televoteWinnerPickNation?.name, pickedNationCountryCode: televoteWinnerPickNation?.countryCode,
            artistName: televoteWinnerPickNation?.artistName, songTitle: televoteWinnerPickNation?.songTitle,
            actualCategoryRank: televoteWinnerPick.rank, pickedNationScoreInCategory: televoteWinnerPick.score,
            pointsAwarded: televoteWinnerPick.points, iconName: "TelevoteWinner"
          });

          // User Vote Based Picks
          const bestTreppoScoreNation = team.bestTreppoScoreNationId ? currentNationsMap.get(team.bestTreppoScoreNationId) : undefined;
          const bestTreppoPick = getCategoryPickPointsAndRank(team.bestTreppoScoreNationId, topTreppoScoreNations);
          treppoScoreCategoryPicksSubtotal += bestTreppoPick.points;
          if(bestTreppoPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({
            categoryName: "Miglior TreppoScore", pickedNationId: team.bestTreppoScoreNationId || "",
            pickedNationName: bestTreppoScoreNation?.name, pickedNationCountryCode: bestTreppoScoreNation?.countryCode,
            artistName: bestTreppoScoreNation?.artistName, songTitle: bestTreppoScoreNation?.songTitle,
            actualCategoryRank: bestTreppoPick.rank, pointsAwarded: bestTreppoPick.points,
            iconName: "Award", pickedNationScoreInCategory: bestTreppoPick.score
          });

          const bestSongNation = team.bestSongNationId ? currentNationsMap.get(team.bestSongNationId) : undefined;
          const bestSongPick = getCategoryPickPointsAndRank(team.bestSongNationId, topSongNations);
          treppoScoreCategoryPicksSubtotal += bestSongPick.points;
          if (bestSongPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({
            categoryName: "Miglior Canzone", pickedNationId: team.bestSongNationId || "",
            pickedNationName: bestSongNation?.name, pickedNationCountryCode: bestSongNation?.countryCode,
            artistName: bestSongNation?.artistName, songTitle: bestSongNation?.songTitle,
            actualCategoryRank: bestSongPick.rank, pointsAwarded: bestSongPick.points,
            iconName: "Music2", pickedNationScoreInCategory: bestSongPick.score
          });

          const bestPerfNation = team.bestPerformanceNationId ? currentNationsMap.get(team.bestPerformanceNationId) : undefined;
          const bestPerformancePick = getCategoryPickPointsAndRank(team.bestPerformanceNationId, topPerformanceNations);
          treppoScoreCategoryPicksSubtotal += bestPerformancePick.points;
          if (bestPerformancePick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({
            categoryName: "Miglior Performance", pickedNationId: team.bestPerformanceNationId || "",
            pickedNationName: bestPerfNation?.name, pickedNationCountryCode: bestPerfNation?.countryCode,
            artistName: bestPerfNation?.artistName, songTitle: bestPerfNation?.songTitle,
            actualCategoryRank: bestPerformancePick.rank, pointsAwarded: bestPerformancePick.points,
            iconName: "Star", pickedNationScoreInCategory: bestPerformancePick.score
          });

          const bestOutfitNation = team.bestOutfitNationId ? currentNationsMap.get(team.bestOutfitNationId) : undefined;
          const bestOutfitPick = getCategoryPickPointsAndRank(team.bestOutfitNationId, topOutfitNations);
          treppoScoreCategoryPicksSubtotal += bestOutfitPick.points;
          if (bestOutfitPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({
            categoryName: "Miglior Outfit", pickedNationId: team.bestOutfitNationId || "",
            pickedNationName: bestOutfitNation?.name, pickedNationCountryCode: bestOutfitNation?.countryCode,
            artistName: bestOutfitNation?.artistName, songTitle: bestOutfitNation?.songTitle,
            actualCategoryRank: bestOutfitPick.rank, pointsAwarded: bestOutfitPick.points,
            iconName: "Shirt", pickedNationScoreInCategory: bestOutfitPick.score
          });

          const worstTreppoNation = team.worstTreppoScoreNationId ? currentNationsMap.get(team.worstTreppoScoreNationId) : undefined;
          const worstPick = getCategoryPickPointsAndRank(team.worstTreppoScoreNationId, worstOverallScoreNations);
          treppoScoreCategoryPicksSubtotal += worstPick.points;
          if (worstPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({
            categoryName: "Peggior TreppoScore", pickedNationId: team.worstTreppoScoreNationId || "",
            pickedNationName: worstTreppoNation?.name, pickedNationCountryCode: worstTreppoNation?.countryCode,
            artistName: worstTreppoNation?.artistName, songTitle: worstTreppoNation?.songTitle,
            actualCategoryRank: worstPick.rank, pointsAwarded: worstPick.points,
            iconName: "ThumbsDown", pickedNationScoreInCategory: worstPick.score
          });
          
          categoryPicksDetails.forEach((detail, index) => {
            detail.isEvenRow = index % 2 !== 0;
          });


          score = primaSquadraSubtotal + eurovisionPicksSubtotal + treppoScoreCategoryPicksSubtotal;

          if (firstPlaceCategoryPicksCount >= 4) {
            bonusSubtotal += 30;
            bonusGranCampionePronostici = true;
          } else if (firstPlaceCategoryPicksCount >= 2) {
            bonusSubtotal += 5;
            bonusCampionePronostici = true;
          }

          score += bonusSubtotal;

          return {
            ...team,
            score: settings.leaderboardLocked ? 0 : score,
            primaSquadraDetails,
            primaSquadraScore: settings.leaderboardLocked ? 0 : primaSquadraSubtotal,
            eurovisionPicksScore: settings.leaderboardLocked ? 0 : eurovisionPicksSubtotal,
            categoryPicksDetails,
            treppoScoreCategoryPicksScore: settings.leaderboardLocked ? 0 : treppoScoreCategoryPicksSubtotal,
            bonusTotalScore: settings.leaderboardLocked ? 0 : bonusSubtotal,
            bonusCampionePronostici,
            bonusGranCampionePronostici,
            bonusEnPleinTop5
          };
        });

        calculatedTeams.sort((a, b) => {
          if (b.score === a.score) {
            return a.name.localeCompare(b.name);
          }
          return (b.score ?? -Infinity) - (a.score ?? -Infinity);
        });

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
        setTeamsWithScores(calculatedTeams);

      } catch (error: any) {
        console.error("Error fetching leaderboard data:", error);
        setTeamsWithScores([]);
        setAllNations([]);
        setGlobalCategorizedScoresMap(new Map());
      } finally {
        setIsLoadingData(false);
        setIsLoadingSettings(false);
      }
    }
    fetchPageData();
  }, [authIsLoading]); 

  const podiumTeams = useMemo(() => teamsWithScores.filter(team => (team.rank ?? Infinity) <= 3), [teamsWithScores]);
  
  if (isLoadingSettings || isLoadingData || !adminSettings) {
    return (
      <div className="space-y-8">
        <TeamsSubNavigation />
        <header className="text-center sm:text-left space-y-2 mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary flex items-center">
            <BarChartBig className="mr-3 h-10 w-10" />
            Classifica Squadre
          </h1>
          <p className="text-xl text-muted-foreground">
            Caricamento classifica...
          </p>
        </header>
         <div className="flex items-center justify-center py-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (adminSettings.leaderboardLocked) {
    return (
      <div className="space-y-8">
        <TeamsSubNavigation />
        <Alert variant="destructive" className="max-w-lg mx-auto">
          <LockIcon className="h-4 w-4" />
          <AlertTitle>Classifica Bloccata</AlertTitle>
          <AlertDescription>
            L'amministratore ha temporaneamente bloccato l'accesso alla classifica squadre.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
      <div className="space-y-8">
        <TeamsSubNavigation />
        <header className="text-center sm:text-left space-y-2 mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary flex items-center">
            <BarChartBig className="mr-3 h-10 w-10" />
            Classifica Squadre
          </h1>
          <p className="text-xl text-muted-foreground">
            Punteggi basati sulla classifica finale e sui pronostici degli utenti.
          </p>
        </header>

        {isLoadingData ? (
             <div className="flex items-center justify-center py-10">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        ) : teamsWithScores.length === 0 ? (
          <div className="text-center text-muted-foreground py-10">
            <Trophy className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg">Nessuna squadra trovata o nessun punteggio calcolabile.</p>
            <p>Assicurati che le squadre siano state create e che le nazioni abbiano un ranking e voti utente.</p>
          </div>
        ) : (
          <>
            {podiumTeams.length > 0 && (
              <section className="mb-12">
                <h2 className="text-3xl font-bold tracking-tight mb-6 text-primary border-b-2 border-primary/30 pb-2">
                  Il Podio delle Squadre
                </h2>
                <TeamList
                  teams={podiumTeams}
                  allNations={allNations}
                  nationGlobalCategorizedScoresArray={globalCategorizedScoresArray}
                  isLeaderboardPodiumDisplay={true} 
                  disableListItemEdit={true}
                  defaultOpenSections={[]}
                />
              </section>
            )}

            {teamsWithScores.length > 0 && (
              <section className={podiumTeams.length > 0 ? "mt-12" : ""}>
                 <h2 className="text-3xl font-bold tracking-tight mb-6 text-primary border-b-2 border-primary/30 pb-2">
                   Classifica Completa
                </h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Info className="h-4 w-4" />
                  <span>Clicca sul nome di una squadra per vederne il dettaglio del punteggio in una nuova pagina.</span>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px] text-center">Pos.</TableHead>
                          <TableHead>Squadra</TableHead>
                          <TableHead className="text-right">Punteggio Totale</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teamsWithScores.map((team) => (
                          <TableRow
                            key={team.id}
                            className={cn(user && user.uid === team.userId && "bg-primary/10 hover:bg-primary/20 border-l-2 border-primary")}
                          >
                            <TableCell className="font-medium text-center align-top pt-3">
                                <div className="flex items-center justify-center">
                                    <TableMedalIcon rank={team.rank} />
                                    <span className={cn(
                                        team.rank && [1,2,3].includes(team.rank) &&
                                        (rankTextColorClass(team.rank)),
                                        "font-semibold"
                                    )}>
                                        {team.rank}{team.isTied && "*"}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="align-top pt-3">
                                <div className="flex flex-col items-start">
                                    <Link href={`/teams/${team.id}/details`}
                                      className="text-left hover:text-primary group w-full"
                                    >
                                      <div className="font-medium text-base group-hover:underline">
                                          {team.name}
                                      </div>
                                    </Link>
                                    {team.creatorDisplayName && (
                                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5" title={`Utente: ${team.creatorDisplayName}`}>
                                            <UserCircle className="h-3 w-3" />{team.creatorDisplayName}
                                        </div>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="text-right font-semibold text-lg text-primary align-top pt-3">
                                {team.score}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </section>
            )}
          </>
        )}
        <Card className="mt-8 border-primary/20 bg-card/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-primary">Come Funziona il Punteggio?</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Il punteggio totale di una squadra è composto da:
                  </p>
                  <ul className="list-disc pl-5 mt-2 text-sm text-muted-foreground space-y-1">
                      <li>
                          <strong>Nazioni Squadra (3 Nazioni)</strong>: Punti basati sulla classifica finale Eurovision.
                          Sistema: 1°: +30pt, 2°: +25pt, 3°: +20pt, 4°: +18pt, 5°: +16pt, 6°: +14pt, 7°-10°: +12pt, 11°-12°: +10pt, 13°-24°: -5pt, 25°: -10pt, 26°: -15pt.
                      </li>
                       <li>
                          <strong>Pronostici Eurovision</strong>: Punti per aver indovinato le nazioni al 1°, 2° o 3° posto (1°: +15pt, 2°: +10pt, 3°: +5pt) per:
                          <ul className="list-['\2013'] pl-5 mt-1 space-y-0.5">
                            <li>Vincitore Eurovision (basato su Classifica Finale)</li>
                            <li>Vincitore Giuria (basato su Classifica Giurie)</li>
                            <li>Vincitore Televoto (basato su Classifica Televoto)</li>
                          </ul>
                      </li>
                      <li>
                          <strong>Pronostici TreppoScore</strong>: Punti per aver indovinato le nazioni al 1°, 2° o 3° posto (1°: +15pt, 2°: +10pt, 3°: +5pt) per:
                          <ul className="list-['\2013'] pl-5 mt-1 space-y-0.5">
                            <li>Miglior TreppoScore (basato su Media Globale Voti Utenti)</li>
                            <li>Miglior Canzone (basato su Media Voti Canzone Utenti)</li>
                            <li>Miglior Performance (basato su Media Voti Performance Utenti)</li>
                            <li>Miglior Outfit (basato su Media Voti Outfit Utenti)</li>
                            <li>Peggior TreppoScore (basato su Media Globale Voti Utenti - nazioni meno votate)</li>
                          </ul>
                      </li>
                       <li>
                          <strong>Bonus "Campione di Pronostici"</strong>: Un bonus di +5 punti viene assegnato se una squadra indovina il 1° posto in 2 o 3 categorie degli "Pronostici Eurovision" e "Pronostici TreppoScore" (considerando tutte e 8 le categorie di pronostici).
                      </li>
                       <li>
                          <strong>Bonus "Gran Campione di Pronostici"</strong>: Un bonus di +30 punti viene assegnato se una squadra indovina il 1° posto in almeno 4 categorie degli "Pronostici Eurovision" e "Pronostici TreppoScore" (considerando tutte e 8 le categorie di pronostici). Se questo bonus è ottenuto, quello da +5pt non viene assegnato.
                      </li>
                      <li>
                          <strong>Bonus "En Plein Top 5"</strong>: Un bonus di +30 punti viene assegnato se tutte e tre le nazioni scelte per "Nazioni Squadra" si classificano nelle prime 5 posizioni della classifica finale Eurovision.
                      </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
      </div>
      {selectedTeamDetail && (
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0">
            <TeamListItem
                team={selectedTeamDetail}
                allNations={allNations}
                nationGlobalCategorizedScoresArray={globalCategorizedScoresArray}
                isLeaderboardPodiumDisplay={true}
                disableEdit={true}
                isOwnTeamCard={user?.uid === selectedTeamDetail.userId}
                defaultOpenSections={["treppovision", "pronosticiEurovision", "pronosticiTreppoScore", "bonus"]}
            />
        </DialogContent>
      )}
    </Dialog>
  );
}

