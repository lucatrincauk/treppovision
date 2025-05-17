
"use client";

import { getTeams } from "@/lib/team-service";
import { getNations } from "@/lib/nation-service";
import { getAllNationsGlobalCategorizedScores } from "@/lib/voting-service";
import type { Team, Nation, NationGlobalCategorizedScores, GlobalPrimaSquadraDetail } from "@/types";
import { TeamsSubNavigation } from "@/components/teams/teams-sub-navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, UserCircle, BarChartBig, Info, BadgeCheck, Music2, Star, Shirt, ThumbsDown, Award, TrendingUp, Lock as LockIcon, Loader2, Edit, CheckCircle } from "lucide-react";
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

interface LocalCategoryPickDetail {
  categoryName: string;
  pickedNationId: string;
  pickedNationName?: string;
  pickedNationCountryCode?: string;
  artistName?: string;
  songTitle?: string;
  actualCategoryRank?: number | null;
  pickedNationScoreInCategory?: number | null;
  pointsAwarded: number;
  iconName: string;
}

interface TeamWithScore extends Team {
  score: number;
  primaSquadraDetails: GlobalPrimaSquadraDetail[];
  primaSquadraScore?: number;
  categoryPicksDetails: LocalCategoryPickDetail[];
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
  scoresMap: Map<string, NationGlobalCategorizedScores>,
  nationsMap: Map<string, Nation>,
  categoryKey: keyof Omit<NationGlobalCategorizedScores, 'voteCount'>,
  sortOrder: 'desc' | 'asc' = 'desc'
): Array<{ id: string; name: string; score: number | null; artistName?: string; songTitle?: string; }> => {
  if (!scoresMap || scoresMap.size === 0 || !nationsMap || nationsMap.size === 0) return [];
  return Array.from(scoresMap.entries())
    .map(([nationId, scores]) => {
        const nation = nationsMap.get(nationId);
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
  sortedNationsForCategory: Array<{ id: string; name: string; score: number | null; artistName?: string; songTitle?: string; }>
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

const MedalIcon = React.memo(({ rank, className }: { rank?: number, className?: string }) => {
  if (rank === undefined || rank === null || rank === 0 || rank > 3) return null;
  let colorClass = "";
  if (rank === 1) colorClass = "text-yellow-400";
  else if (rank === 2) colorClass = "text-slate-400";
  else if (rank === 3) colorClass = "text-amber-500";
  return <Award className={cn("w-4 h-4 inline-block", colorClass, className)} />;
});
MedalIcon.displayName = 'MedalIconTable';

const CategoryPickDisplay = React.memo(({ detail, leaderboardLocked }: { detail: LocalCategoryPickDetail, leaderboardLocked: boolean | null }) => {
  let IconComponent: React.ElementType = Info;
  switch (detail.iconName) {
    case 'EurovisionWinner':
    case 'JuryWinner':
    case 'TelevoteWinner':
    case 'Award': IconComponent = Award; break;
    case 'Music2': IconComponent = Music2; break;
    case 'Star': IconComponent = Star; break;
    case 'Shirt': IconComponent = Shirt; break;
    case 'ThumbsDown': IconComponent = ThumbsDown; break;
    default: IconComponent = Info;
  }
  const iconColorClass = "text-accent";

  let rankSuffix = "";
    if (detail.categoryName === "Peggior TreppoScore") {
    rankSuffix = " peggiore";
  }

 const rankText = !leaderboardLocked && detail.actualCategoryRank && detail.actualCategoryRank > 0
    ? `(${detail.actualCategoryRank}°${rankSuffix})`
    : "";

  const titleText = `${detail.categoryName}: ${detail.pickedNationName || 'N/D'}${rankText} ${typeof detail.pointsAwarded === 'number' && !leaderboardLocked ? `Punti: ${detail.pointsAwarded}` : ''}`;
  
  return (
    <div className={cn("py-0.5")}>
      <div className="flex items-center w-full justify-between">
        <div className="flex items-center gap-1.5">
          <IconComponent className={cn("w-4 h-4 flex-shrink-0", iconColorClass)} />
          <span className="text-xs text-foreground/90 min-w-[120px] shrink-0">{detail.categoryName}</span>
        </div>
        {typeof detail.pointsAwarded === 'number' && !leaderboardLocked && (
           <span
            className={cn(
              "text-xs shrink-0 ml-auto font-semibold",
              detail.pointsAwarded > 0 ? "text-primary" : "text-destructive"
            )}
          >
            {detail.pointsAwarded > 0 ? `+${detail.pointsAwarded}pt` : `${detail.pointsAwarded}pt`}
          </span>
        )}
         {typeof detail.pointsAwarded === 'number' && detail.pointsAwarded === 0 && !leaderboardLocked && (
           <span className="text-xs shrink-0 ml-auto font-medium text-muted-foreground">
            0pt
           </span>
        )}
      </div>
      <div className={cn(
        "w-full mt-1",
        "pl-[calc(1rem+theme(spacing.1_5))]"
      )}>
        {detail.pickedNationId ? (
          <div className="flex items-center gap-1">
            {detail.pickedNationCountryCode ? (
            <Image
                src={`https://flagcdn.com/w20/${detail.pickedNationCountryCode.toLowerCase()}.png`}
                alt={detail.pickedNationName || "Nazione"}
                width={20}
                height={13}
                className="rounded-sm border border-border/30 object-contain flex-shrink-0"
                data-ai-hint={`${detail.pickedNationName} flag`}
            />
            ) : (
            <div className="w-5 h-[13px] shrink-0 bg-muted/20 rounded-sm"></div>
            )}
            <Link href={`/nations/${detail.pickedNationId}`} className="group text-xs hover:underline hover:text-primary flex items-center gap-0.5" title={titleText}>
              <span className="font-medium">{detail.pickedNationName}</span>
              {!leaderboardLocked && detail.actualCategoryRank && [1,2,3].includes(detail.actualCategoryRank) && <MedalIcon rank={detail.actualCategoryRank} className="ml-0.5" />}
              {rankText && !leaderboardLocked && (
                  <span className={cn("text-muted-foreground/80 text-xs ml-0.5", detail.actualCategoryRank && [1,2,3].includes(detail.actualCategoryRank) && rankTextColorClass(detail.actualCategoryRank) )}>
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

const PrimaSquadraNationDisplay = React.memo(({ detail, nationsMap, leaderboardLocked }: { detail: Team['founderChoices'][number], nationsMap: Map<string, Nation>, leaderboardLocked: boolean | null }) => {
  const nation = nationsMap.get(detail);
  if (!nation) return <span className="text-xs text-muted-foreground">N/D</span>;

  const points = leaderboardLocked ? 0 : getPointsForEurovisionRank(nation.ranking);
  const rankText = !leaderboardLocked && nation.ranking && nation.ranking > 0 ? `(${nation.ranking}º)` : "";
  const titleText = `${nation.name}${rankText ? ` ${rankText}` : ''}${nation.artistName ? ` - ${nation.artistName}` : ''}${nation.songTitle ? ` - ${nation.songTitle}` : ''}${!leaderboardLocked && typeof points === 'number' ? ` Punti: ${points}` : ''}`;

  return (
    <div className="flex items-start gap-1.5 py-0.5">
      <div className="flex items-center mr-1.5 shrink-0">
        <BadgeCheck className="w-4 h-4 text-accent" />
      </div>
      <Image
        src={`https://flagcdn.com/w20/${nation.countryCode.toLowerCase()}.png`}
        alt={nation.name}
        width={20}
        height={13}
        className="rounded-sm border border-border/30 object-contain flex-shrink-0"
        data-ai-hint={`${nation.name} flag icon`}
      />
       <div className="flex flex-col items-start">
        <Link href={`/nations/${nation.id}`} className="text-xs hover:underline hover:text-primary group flex items-center gap-1" title={titleText}>
          <span className="font-medium group-hover:underline">{nation.name}</span>
          {!leaderboardLocked && nation.ranking && [1,2,3].includes(nation.ranking) && <MedalIcon rank={nation.ranking} className="ml-0.5" />}
          {rankText && !leaderboardLocked && (
            <span className={cn("text-muted-foreground/80 text-xs ml-0.5", nation.ranking && [1,2,3].includes(nation.ranking) && rankTextColorClass(nation.ranking))}>{rankText}</span>
          )}
        </Link>
        {!leaderboardLocked && (nation.artistName || nation.songTitle) && (
            <span className="text-[11px] text-muted-foreground/80 block">
                {nation.artistName}{nation.artistName && nation.songTitle && " - "}{nation.songTitle}
            </span>
        )}
       </div>
      {!leaderboardLocked && typeof points === 'number' && (
        <span className={cn(
          "text-xs ml-auto pl-1 font-semibold",
          points > 0 ? "text-primary" : points < 0 ? "text-destructive" : "text-muted-foreground"
        )}>
          {points > 0 ? `+${points}` : points}pt
        </span>
      )}
    </div>
  );
});
PrimaSquadraNationDisplay.displayName = 'PrimaSquadraNationDisplay';


export default function TeamsLeaderboardPage() {
  const { user } = useAuth();
  const [adminSettings, setAdminSettings] = React.useState<Awaited<ReturnType<typeof getAdminSettingsAction>> | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = React.useState(true);

  const [teamsWithScores, setTeamsWithScores] = React.useState<TeamWithScore[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(true);

  const [allNations, setAllNations] = React.useState<Nation[]>([]);
  const [nationsMap, setNationsMap] = React.useState<Map<string, Nation>>(new Map());
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
        setNationsMap(currentNationsMap);
        setGlobalCategorizedScoresMap(fetchedGlobalScoresMapData);

        const topOverallRankNations = fetchedNationsData.filter(n => n.ranking && n.ranking > 0).sort((a,b) => (a.ranking || Infinity) - (b.ranking || Infinity));
        const topJuryRankNations = fetchedNationsData.filter(n => n.juryRank && n.juryRank > 0).sort((a,b) => (a.juryRank || Infinity) - (b.juryRank || Infinity));
        const topTelevoteRankNations = fetchedNationsData.filter(n => n.televoteRank && n.televoteRank > 0).sort((a,b) => (a.televoteRank || Infinity) - (b.televoteRank || Infinity));

        const topTreppoScoreNations = getTopNationsForCategory(fetchedGlobalScoresMapData, currentNationsMap, 'overallAverageScore', 'desc');
        const topSongNations = getTopNationsForCategory(fetchedGlobalScoresMapData, currentNationsMap, 'averageSongScore', 'desc');
        const topPerformanceNations = getTopNationsForCategory(fetchedGlobalScoresMapData, currentNationsMap, 'averagePerformanceScore', 'desc');
        const topOutfitNations = getTopNationsForCategory(fetchedGlobalScoresMapData, currentNationsMap, 'averageOutfitScore', 'desc');
        const worstOverallScoreNations = getTopNationsForCategory(fetchedGlobalScoresMapData, currentNationsMap, 'overallAverageScore', 'asc');


        let calculatedTeams: TeamWithScore[] = fetchedTeams.map(team => {
          let score = 0;
          let primaSquadraSubtotal = 0;
          let treppoScoreCategoryPicksSubtotal = 0;
          let bonusSubtotal = 0;
          let bonusCampionePronostici = false;
          let bonusGranCampionePronostici = false;
          let bonusEnPleinTop5 = false;

          const primaSquadraDetails: GlobalPrimaSquadraDetail[] = [];
          const categoryPicksDetails: LocalCategoryPickDetail[] = [];

          (team.founderChoices || []).forEach(nationId => {
            const nation = currentNationsMap.get(nationId);
            if (nation) {
              const points = getPointsForEurovisionRank(nation.ranking);
              score += points;
              primaSquadraSubtotal += points;
              primaSquadraDetails.push({
                id: nation.id,
                name: nation.name,
                countryCode: nation.countryCode,
                artistName: nation.artistName,
                songTitle: nation.songTitle,
                actualRank: nation.ranking,
                points,
              });
            }
          });

          if (primaSquadraDetails.length === 3 && primaSquadraDetails.every(detail => detail.actualRank && detail.actualRank >= 1 && detail.actualRank <= 5)) {
            score += 30;
            bonusSubtotal += 30;
            bonusEnPleinTop5 = true;
          }

          let firstPlaceCategoryPicksCount = 0;
          
          // Official Result Predictions
          const eurovisionWinnerPick = getCategoryPickPointsAndRank(team.eurovisionWinnerPickNationId, topOverallRankNations.map(n => ({ id: n.id, name: n.name, score: n.ranking || null, artistName: n.artistName, songTitle: n.songTitle })));
          score += eurovisionWinnerPick.points;
          treppoScoreCategoryPicksSubtotal += eurovisionWinnerPick.points;
          if (eurovisionWinnerPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({
            categoryName: "Vincitore Eurovision", pickedNationId: team.eurovisionWinnerPickNationId || "",
            pickedNationName: team.eurovisionWinnerPickNationId ? currentNationsMap.get(team.eurovisionWinnerPickNationId)?.name : undefined,
            pickedNationCountryCode: team.eurovisionWinnerPickNationId ? currentNationsMap.get(team.eurovisionWinnerPickNationId)?.countryCode : undefined,
            artistName: team.eurovisionWinnerPickNationId ? currentNationsMap.get(team.eurovisionWinnerPickNationId)?.artistName : undefined,
            songTitle: team.eurovisionWinnerPickNationId ? currentNationsMap.get(team.eurovisionWinnerPickNationId)?.songTitle : undefined,
            actualCategoryRank: eurovisionWinnerPick.rank,
            pickedNationScoreInCategory: eurovisionWinnerPick.score,
            pointsAwarded: eurovisionWinnerPick.points,
            iconName: "EurovisionWinner"
          });
          
          const juryWinnerPick = getCategoryPickPointsAndRank(team.juryWinnerPickNationId, topJuryRankNations.map(n => ({ id: n.id, name: n.name, score: n.juryRank || null, artistName: n.artistName, songTitle: n.songTitle })));
          score += juryWinnerPick.points;
          treppoScoreCategoryPicksSubtotal += juryWinnerPick.points;
          if (juryWinnerPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({
            categoryName: "Vincitore Giuria", pickedNationId: team.juryWinnerPickNationId || "",
            pickedNationName: team.juryWinnerPickNationId ? currentNationsMap.get(team.juryWinnerPickNationId)?.name : undefined,
            pickedNationCountryCode: team.juryWinnerPickNationId ? currentNationsMap.get(team.juryWinnerPickNationId)?.countryCode : undefined,
            artistName: team.juryWinnerPickNationId ? currentNationsMap.get(team.juryWinnerPickNationId)?.artistName : undefined,
            songTitle: team.juryWinnerPickNationId ? currentNationsMap.get(team.juryWinnerPickNationId)?.songTitle : undefined,
            actualCategoryRank: juryWinnerPick.rank,
            pickedNationScoreInCategory: juryWinnerPick.score,
            pointsAwarded: juryWinnerPick.points,
            iconName: "JuryWinner"
          });

          const televoteWinnerPick = getCategoryPickPointsAndRank(team.televoteWinnerPickNationId, topTelevoteRankNations.map(n => ({ id: n.id, name: n.name, score: n.televoteRank || null, artistName: n.artistName, songTitle: n.songTitle })));
          score += televoteWinnerPick.points;
          treppoScoreCategoryPicksSubtotal += televoteWinnerPick.points;
          if (televoteWinnerPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({
            categoryName: "Vincitore Televoto", pickedNationId: team.televoteWinnerPickNationId || "",
            pickedNationName: team.televoteWinnerPickNationId ? currentNationsMap.get(team.televoteWinnerPickNationId)?.name : undefined,
            pickedNationCountryCode: team.televoteWinnerPickNationId ? currentNationsMap.get(team.televoteWinnerPickNationId)?.countryCode : undefined,
            artistName: team.televoteWinnerPickNationId ? currentNationsMap.get(team.televoteWinnerPickNationId)?.artistName : undefined,
            songTitle: team.televoteWinnerPickNationId ? currentNationsMap.get(team.televoteWinnerPickNationId)?.songTitle : undefined,
            actualCategoryRank: televoteWinnerPick.rank,
            pickedNationScoreInCategory: televoteWinnerPick.score,
            pointsAwarded: televoteWinnerPick.points,
            iconName: "TelevoteWinner"
          });

          // User Vote Based Predictions
          const bestTreppoPick = getCategoryPickPointsAndRank(team.bestTreppoScoreNationId, topTreppoScoreNations);
          score += bestTreppoPick.points;
          treppoScoreCategoryPicksSubtotal += bestTreppoPick.points;
          if (bestTreppoPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({
            categoryName: "Miglior TreppoScore", pickedNationId: team.bestTreppoScoreNationId || "",
            pickedNationName: team.bestTreppoScoreNationId ? currentNationsMap.get(team.bestTreppoScoreNationId)?.name : undefined,
            pickedNationCountryCode: team.bestTreppoScoreNationId ? currentNationsMap.get(team.bestTreppoScoreNationId)?.countryCode : undefined,
            artistName: team.bestTreppoScoreNationId ? currentNationsMap.get(team.bestTreppoScoreNationId)?.artistName : undefined,
            songTitle: team.bestTreppoScoreNationId ? currentNationsMap.get(team.bestTreppoScoreNationId)?.songTitle : undefined,
            actualCategoryRank: bestTreppoPick.rank,
            pickedNationScoreInCategory: bestTreppoPick.score,
            pointsAwarded: bestTreppoPick.points,
            iconName: "Award"
          });

          const bestSongPick = getCategoryPickPointsAndRank(team.bestSongNationId, topSongNations);
          score += bestSongPick.points;
          treppoScoreCategoryPicksSubtotal += bestSongPick.points;
          if (bestSongPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({
            categoryName: "Miglior Canzone", pickedNationId: team.bestSongNationId || "",
            pickedNationName: team.bestSongNationId ? currentNationsMap.get(team.bestSongNationId)?.name : undefined,
            pickedNationCountryCode: team.bestSongNationId ? currentNationsMap.get(team.bestSongNationId)?.countryCode : undefined,
            artistName: team.bestSongNationId ? currentNationsMap.get(team.bestSongNationId)?.artistName : undefined,
            songTitle: team.bestSongNationId ? currentNationsMap.get(team.bestSongNationId)?.songTitle : undefined,
            actualCategoryRank: bestSongPick.rank,
            pickedNationScoreInCategory: bestSongPick.score,
            pointsAwarded: bestSongPick.points,
            iconName: "Music2"
          });

          const bestPerformancePick = getCategoryPickPointsAndRank(team.bestPerformanceNationId, topPerformanceNations);
          score += bestPerformancePick.points;
          treppoScoreCategoryPicksSubtotal += bestPerformancePick.points;
          if (bestPerformancePick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({
            categoryName: "Miglior Performance", pickedNationId: team.bestPerformanceNationId || "",
            pickedNationName: team.bestPerformanceNationId ? currentNationsMap.get(team.bestPerformanceNationId)?.name : undefined,
            pickedNationCountryCode: team.bestPerformanceNationId ? currentNationsMap.get(team.bestPerformanceNationId)?.countryCode : undefined,
            artistName: team.bestPerformanceNationId ? currentNationsMap.get(team.bestPerformanceNationId)?.artistName : undefined,
            songTitle: team.bestPerformanceNationId ? currentNationsMap.get(team.bestPerformanceNationId)?.songTitle : undefined,
            actualCategoryRank: bestPerformancePick.rank,
            pickedNationScoreInCategory: bestPerformancePick.score,
            pointsAwarded: bestPerformancePick.points,
            iconName: "Star"
          });

          const bestOutfitPick = getCategoryPickPointsAndRank(team.bestOutfitNationId, topOutfitNations);
          score += bestOutfitPick.points;
          treppoScoreCategoryPicksSubtotal += bestOutfitPick.points;
          if (bestOutfitPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({
            categoryName: "Miglior Outfit", pickedNationId: team.bestOutfitNationId || "",
            pickedNationName: team.bestOutfitNationId ? currentNationsMap.get(team.bestOutfitNationId)?.name : undefined,
            pickedNationCountryCode: team.bestOutfitNationId ? currentNationsMap.get(team.bestOutfitNationId)?.countryCode : undefined,
            artistName: team.bestOutfitNationId ? currentNationsMap.get(team.bestOutfitNationId)?.artistName : undefined,
            songTitle: team.bestOutfitNationId ? currentNationsMap.get(team.bestOutfitNationId)?.songTitle : undefined,
            actualCategoryRank: bestOutfitPick.rank,
            pickedNationScoreInCategory: bestOutfitPick.score,
            pointsAwarded: bestOutfitPick.points,
            iconName: "Shirt"
          });

          const worstTreppoPick = getCategoryPickPointsAndRank(team.worstTreppoScoreNationId, worstOverallScoreNations);
          score += worstTreppoPick.points;
          treppoScoreCategoryPicksSubtotal += worstTreppoPick.points;
          if (worstTreppoPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({
            categoryName: "Peggior TreppoScore", pickedNationId: team.worstTreppoScoreNationId || "",
            pickedNationName: team.worstTreppoScoreNationId ? currentNationsMap.get(team.worstTreppoScoreNationId)?.name : undefined,
            pickedNationCountryCode: team.worstTreppoScoreNationId ? currentNationsMap.get(team.worstTreppoScoreNationId)?.countryCode : undefined,
            artistName: team.worstTreppoScoreNationId ? currentNationsMap.get(team.worstTreppoScoreNationId)?.artistName : undefined,
            songTitle: team.worstTreppoScoreNationId ? currentNationsMap.get(team.worstTreppoScoreNationId)?.songTitle : undefined,
            actualCategoryRank: worstTreppoPick.rank,
            pickedNationScoreInCategory: worstTreppoPick.score,
            pointsAwarded: worstTreppoPick.points,
            iconName: "ThumbsDown"
          });

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
        setNationsMap(new Map());
        setGlobalCategorizedScoresMap(new Map());
      } finally {
        setIsLoadingData(false);
        setIsLoadingSettings(false);
      }
    }
    fetchPageData();
  }, []);

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
                                  <MedalIcon rank={team.rank} className="mr-1" />
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
                          <strong>Pronostici TreppoVision (3 Nazioni)</strong>: Punti basati sulla classifica finale Eurovision.
                          Sistema: 1°: +30pt, 2°: +25pt, 3°: +20pt, 4°: +18pt, 5°: +16pt, 6°: +14pt, 7°-10°: +12pt, 11°-12°: +10pt, 13°-24°: -5pt, 25°: -10pt, 26°: -15pt.
                      </li>
                      <li>
                          <strong>Pronostici TreppoScore</strong>: Punti per aver indovinato le nazioni al 1°, 2° o 3° posto nelle classifiche globali degli utenti per le categorie:
                          <ul>
                            <li>Vincitore Eurovision (Classifica Finale): 1°: +15pt, 2°: +10pt, 3°: +5pt.</li>
                            <li>Vincitore Giuria (Classifica Giurie): 1°: +15pt, 2°: +10pt, 3°: +5pt.</li>
                            <li>Vincitore Televoto (Classifica Televoto): 1°: +15pt, 2°: +10pt, 3°: +5pt.</li>
                            <li>Miglior TreppoScore (Media Globale Utenti): 1°: +15pt, 2°: +10pt, 3°: +5pt.</li>
                            <li>Miglior Canzone (Media Voti Canzone Utenti): 1°: +15pt, 2°: +10pt, 3°: +5pt.</li>
                            <li>Miglior Performance (Media Voti Performance Utenti): 1°: +15pt, 2°: +10pt, 3°: +5pt.</li>
                            <li>Miglior Outfit (Media Voti Outfit Utenti): 1°: +15pt, 2°: +10pt, 3°: +5pt.</li>
                            <li>Peggior TreppoScore (Media Globale Utenti - Nazioni meno votate): 1° (peggiore): +15pt, 2° (peggiore): +10pt, 3° (peggiore): +5pt.</li>
                          </ul>
                      </li>
                       <li>
                          <strong>Bonus "Campione di Pronostici"</strong>: Un bonus di +5 punti viene assegnato se una squadra indovina il 1° posto in 2 o 3 categorie dei "Pronostici TreppoScore" (considerando tutte e 8 le categorie).
                      </li>
                       <li>
                          <strong>Bonus "Gran Campione di Pronostici"</strong>: Un bonus di +30 punti viene assegnato se una squadra indovina il 1° posto in almeno 4 categorie dei "Pronostici TreppoScore" (considerando tutte e 8 le categorie). Se questo bonus è ottenuto, quello da +5pt non viene assegnato.
                      </li>
                      <li>
                          <strong>Bonus "En Plein Top 5"</strong>: Un bonus di +30 punti viene assegnato se tutte e tre le nazioni scelte per "Pronostici TreppoVision" si classificano nelle prime 5 posizioni della classifica finale Eurovision.
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
                disableListItemEdit={true}
                isOwnTeamCard={user?.uid === selectedTeamDetail.userId}
                defaultOpenSections={["treppovision", "trepposcore", "bonus"]}
            />
        </DialogContent>
      )}
    </Dialog>
  );
}
