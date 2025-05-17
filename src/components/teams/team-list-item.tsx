
"use client";

import type { Team, Nation, NationGlobalCategorizedScores, GlobalPrimaSquadraDetail, GlobalCategoryPickDetail, TeamWithScore } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCircle, Edit, Music2, Star, ThumbsDown, Shirt, Lock, BadgeCheck, Award, ListOrdered, Loader2, Info, TrendingUp, CheckCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { getTeamsLockedStatus } from "@/lib/actions/team-actions"; 
import { getLeaderboardLockedStatus } from "@/lib/actions/admin-actions";
import React, { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";

// Helper components for detailed display, similar to leaderboard
const MedalIcon = React.memo(({ rank, className }: { rank?: number, className?: string }) => {
  if (rank === undefined || rank === null || rank === 0 || rank > 3) return null;
  let colorClass = "";
  if (rank === 1) colorClass = "text-yellow-400";
  else if (rank === 2) colorClass = "text-slate-400";
  else if (rank === 3) colorClass = "text-amber-500";
  return <Award className={cn("w-3.5 h-3.5 shrink-0", colorClass, className)} />;
});
MedalIcon.displayName = 'MedalIconPodium';

const PrimaSquadraNationDisplayDetailPodium = React.memo(({
  detail,
  allNations,
  leaderboardLocked,
  isEvenRow,
}: {
  detail: GlobalPrimaSquadraDetail;
  allNations: Nation[];
  leaderboardLocked: boolean | null;
  isEvenRow?: boolean;
}) => {
  const nationData = allNations.find(n => n.id === detail.id);
  const rankText = !leaderboardLocked && detail.actualRank && detail.actualRank > 0
    ? `(${detail.actualRank}º)`
    : "";
  const titleText = `${detail.name}${rankText ? ` ${rankText}` : ''}${nationData?.artistName ? ` - ${nationData.artistName}` : ''}${nationData?.songTitle ? ` - ${nationData.songTitle}` : ''}${!leaderboardLocked && typeof detail.points === 'number' ? ` Punti: ${detail.points}`: ''}`;

  return (
    <div className={cn(
      "flex items-center justify-between px-2 py-1.5",
      isEvenRow && "bg-muted/50 rounded-md"
    )}>
      <div className="flex items-center gap-1.5"> {/* Main container for icon, flag, text */}
          <BadgeCheck className="w-5 h-5 text-accent shrink-0" />
          {nationData?.countryCode ? (
          <Image
              src={`https://flagcdn.com/w20/${nationData.countryCode.toLowerCase()}.png`}
              alt={detail.name}
              width={20}
              height={13}
              className="rounded-sm border border-border/30 object-contain shrink-0"
              data-ai-hint={`${detail.name} flag icon`}
          />
          ) : (
          <div className="w-5 h-[13px] shrink-0 bg-muted/20 rounded-sm"></div>
          )}
          <div className="flex flex-col items-start"> {/* Text block */}
              <Link
                  href={`/nations/${detail.id}`}
                  className="group text-xs hover:underline hover:text-primary flex items-center gap-1"
                  title={titleText}
              >
                  <span className="font-medium">{detail.name}</span>
                  {!leaderboardLocked && <MedalIcon rank={detail.actualRank} className="ml-0.5" />}
                  {rankText && !leaderboardLocked && (
                  <span className="text-muted-foreground text-xs ml-0.5">{rankText}</span>
                  )}
              </Link>
              {(nationData?.artistName || nationData?.songTitle) && (
                  <span className="text-xs text-muted-foreground/80 block">
                  {nationData.artistName}{nationData.artistName && nationData.songTitle && " - "}{nationData.songTitle}
                  </span>
              )}
          </div>
      </div>

      {!leaderboardLocked && typeof detail.points === 'number' && (
        <span className={cn(
          "text-xs ml-auto pl-1 shrink-0 self-center",
          detail.points > 0 ? "font-semibold text-primary" : detail.points < 0 ? "font-semibold text-destructive" : "font-medium text-muted-foreground"
        )}>
          {detail.points > 0 ? `+${detail.points}pt` : `${detail.points}pt`}
        </span>
      )}
    </div>
  );
});
PrimaSquadraNationDisplayDetailPodium.displayName = 'PrimaSquadraNationDisplayDetailPodium';

const CategoryPickDisplayDetailPodium = React.memo(({
  detail,
  allNations,
  leaderboardLockedAdmin,
  isEvenRow,
}: {
  detail: GlobalCategoryPickDetail;
  allNations: Nation[];
  leaderboardLockedAdmin: boolean | null;
  isEvenRow?: boolean;
}) => {
  let IconComponent: React.ElementType;
  const iconColorClass = "text-accent";

  switch (detail.iconName) {
    case 'Music2': IconComponent = Music2; break;
    case 'Star': IconComponent = Star; break;
    case 'Shirt': IconComponent = Shirt; break;
    case 'ThumbsDown': IconComponent = ThumbsDown; break;
    default: IconComponent = Info;
  }

  const pickedNationFullDetails = detail.pickedNationId ? allNations.find(n => n.id === detail.pickedNationId) : undefined;
  
  let rankSuffix = "";
  if (detail.categoryName === "Peggior TreppoScore") {
    rankSuffix = " peggiore";
  }
  
  const rankText = !leaderboardLockedAdmin && detail.actualCategoryRank && detail.actualCategoryRank > 0
    ? `(${detail.actualCategoryRank}º${rankSuffix})`
    : "";

  const titleText = `${detail.categoryName}: ${pickedNationFullDetails?.name || 'N/D'}${rankText}${!leaderboardLockedAdmin && typeof detail.pointsAwarded === 'number' ? ` Punti: ${detail.pointsAwarded}`: ''}`;
  
  return (
     <div className={cn(
        "px-2 py-1.5", 
        isEvenRow && "bg-muted/50 rounded-md"
      )}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <IconComponent className={cn("h-5 w-5 shrink-0", iconColorClass)} />
            <span className="text-xs text-foreground/90 min-w-[120px] shrink-0 font-medium">{detail.categoryName}</span>
          </div>
          {typeof detail.pointsAwarded === 'number' && !leaderboardLockedAdmin && (
            <span className={cn(
                "text-xs ml-auto sm:ml-2 pl-1 shrink-0", 
                detail.pointsAwarded > 0 ? "font-semibold text-primary" :
                detail.pointsAwarded === 0 ? "font-medium text-muted-foreground" : 
                "font-semibold text-destructive"
            )}>
            {detail.pointsAwarded > 0 ? `+${detail.pointsAwarded}pt` : `${detail.pointsAwarded}pt`}
            </span>
          )}
        </div>

        <div className={cn(
            "w-full mt-1 sm:mt-0", 
            "pl-[calc(1.25rem+0.375rem)]" 
        )}>
            <div className="flex items-center gap-1.5">
                {pickedNationFullDetails?.countryCode ? (
                <Image
                    src={`https://flagcdn.com/w20/${pickedNationFullDetails.countryCode.toLowerCase()}.png`}
                    alt={pickedNationFullDetails.name}
                    width={20}
                    height={13}
                    className="rounded-sm border border-border/30 object-contain shrink-0"
                    data-ai-hint={`${pickedNationFullDetails.name} flag icon`}
                />
                ) : (
                <div className="w-5 h-[13px] shrink-0 bg-muted/20 rounded-sm"></div>
                )}
                <div className="flex flex-col items-start"> 
                    <Link href={`/nations/${pickedNationFullDetails ? pickedNationFullDetails.id : '#'}`}
                        className="group text-xs hover:underline hover:text-primary flex items-center gap-1"
                        title={titleText}
                    >
                        <span className="font-medium">
                        {pickedNationFullDetails ? pickedNationFullDetails.name : "Nessuna selezione"}
                        </span>
                        {!leaderboardLockedAdmin && detail.actualCategoryRank && [1,2,3].includes(detail.actualCategoryRank) && <MedalIcon rank={detail.actualCategoryRank} className="ml-0.5"/>}
                        {!leaderboardLockedAdmin && detail.actualCategoryRank && detail.actualCategoryRank > 0 && (
                        <span className="text-muted-foreground text-xs ml-0.5">
                            {rankText}
                        </span>
                        )}
                    </Link>
                    {pickedNationFullDetails && (pickedNationFullDetails.artistName || pickedNationFullDetails.songTitle) && (
                        <span className="text-xs text-muted-foreground/80 block">
                        {pickedNationFullDetails.artistName}{pickedNationFullDetails.artistName && pickedNationFullDetails.songTitle && " - "}{pickedNationFullDetails.songTitle}
                        </span>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
});
CategoryPickDisplayDetailPodium.displayName = 'CategoryPickDisplayDetailPodium';


const SelectedNationDisplay = React.memo(({
  nation,
  IconComponent,
  label,
  isCorrectPick,
  categoryRank,
  leaderboardLocked,
  actualEurovisionRank,
  isEvenRow,
  categoryRankText,
}: {
  nation?: Nation;
  IconComponent: React.ElementType;
  label?: string;
  isCorrectPick?: boolean;
  categoryRank?: number | null;
  leaderboardLocked: boolean | null;
  actualEurovisionRank?: number | null;
  isEvenRow?: boolean;
  categoryRankText?: string;
}) => {
  const iconColorClass = isCorrectPick && !leaderboardLocked ? "text-accent" : "text-accent";

  const NationInfoContent = ({
    nationData,
    showEurovisionRank,
    showCategoryRank,
    categoryRankTextForDisplay,
  }: {
    nationData?: Nation;
    showEurovisionRank?: boolean;
    showCategoryRank?: boolean;
    categoryRankTextForDisplay?: string;
  }) => {
    if (!nationData) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <UserCircle className="h-4 w-4 shrink-0" />
          <span>Nessuna selezione</span>
        </div>
      );
    }

    let rankTextToDisplay = "";
    let rankForMedal: number | undefined | null = undefined;

    if (showEurovisionRank && !leaderboardLocked && actualEurovisionRank && actualEurovisionRank > 0) {
      rankTextToDisplay = `(${actualEurovisionRank}º)`;
      rankForMedal = actualEurovisionRank;
    } else if (showCategoryRank && !leaderboardLocked && categoryRank && categoryRank > 0 && categoryRankTextForDisplay) {
      rankTextToDisplay = categoryRankTextForDisplay;
      rankForMedal = categoryRank;
    }
    
    const titleText = `${nationData.name}${rankTextToDisplay ? ` ${rankTextToDisplay}` : ''}${nationData.artistName ? ` - ${nationData.artistName}` : ''}${nationData.songTitle ? ` - ${nationData.songTitle}` : ''}`;
    
    return (
      <div className="flex flex-col items-start">
        <Link
          href={`/nations/${nationData.id}`}
          className="group text-xs hover:underline hover:text-primary flex items-center gap-1"
          title={titleText}
        >
          <Image
            src={`https://flagcdn.com/w20/${nationData.countryCode.toLowerCase()}.png`}
            alt={nationData.name || "Bandiera Nazione"}
            width={20}
            height={13}
            className="rounded-sm border border-border/30 object-contain shrink-0"
            data-ai-hint={`${nationData.name} flag icon`}
          />
          <span className="font-medium">{nationData.name}</span>
          {!leaderboardLocked && rankForMedal && [1,2,3].includes(rankForMedal) && <MedalIcon rank={rankForMedal} className="ml-0.5"/>}
          {rankTextToDisplay && !leaderboardLocked && (
            <span className="text-muted-foreground text-xs ml-0.5">{rankTextToDisplay}</span>
          )}
        </Link>
        {(nationData.artistName || nationData.songTitle) && (
            <span className="text-xs text-muted-foreground/80 block">
            {nationData.artistName}{nationData.artistName && nationData.songTitle && " - "}{nationData.songTitle}
            </span>
        )}
      </div>
    );
  };

  const mainContainerClasses = cn(
    "px-2 py-1",
    isEvenRow && "bg-muted/50 rounded-md",
    label && "flex flex-col items-start sm:flex-row sm:items-center gap-1 py-1.5 sm:gap-1.5 sm:py-1"
  );
  
  const labelAndIconContainerClasses = "flex items-center gap-1.5 w-full sm:w-auto";
  
  const nationInfoContainerOuterClasses = cn(
    "w-full",
    label && "mt-1 sm:mt-0 sm:ml-[calc(1.25rem+0.375rem)]"
  );


  if (label) { 
    return (
      <div className={mainContainerClasses}>
        <div className={labelAndIconContainerClasses}>
          <IconComponent className={cn("h-5 w-5 shrink-0", iconColorClass)} />
          <span className="text-xs text-foreground/90 min-w-[120px] shrink-0 font-medium">{label}</span>
        </div>
        <div className={nationInfoContainerOuterClasses}>
          <NationInfoContent
            nationData={nation}
            showCategoryRank={true}
            categoryRankTextForDisplay={categoryRankText}
          />
        </div>
      </div>
    );
  } else { 
    return (
      <div className={mainContainerClasses}>
        <div className="flex items-center gap-1.5"> 
          <IconComponent className={cn("h-5 w-5 shrink-0", iconColorClass)} />
            <NationInfoContent
                nationData={nation}
                showEurovisionRank={true}
            />
        </div>
      </div>
    );
  }
});
SelectedNationDisplay.displayName = 'SelectedNationDisplay';

const getRankText = (rank?: number, isTied?: boolean): string => {
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

interface TeamListItemProps {
  team: TeamWithScore & {
        isTied?: boolean;
        bonusCampionePronostici?: boolean;
        bonusEnPleinTop5?: boolean;
    };
  allNations: Nation[];
  nationGlobalCategorizedScoresArray: [string, NationGlobalCategorizedScores][];
  isOwnTeamCard?: boolean;
  isLeaderboardPodiumDisplay?: boolean;
  disableEdit?: boolean;
}


export function TeamListItem({
  team,
  allNations,
  nationGlobalCategorizedScoresArray,
  isOwnTeamCard = false,
  isLeaderboardPodiumDisplay = false,
  disableEdit = false,
}: TeamListItemProps) {
  const { user } = useAuth();
  const [teamsLocked, setTeamsLocked] = useState<boolean | null>(null);
  const [leaderboardLockedAdmin, setLeaderboardLockedAdmin] = useState<boolean | null>(null);
  const [isLoadingAdminSettings, setIsLoadingAdminSettings] = useState(true);

  const [categoryRanksAndCorrectness, setCategoryRanksAndCorrectness] = useState<{
    [key: string]: { rank?: number | null; isCorrectPick?: boolean; categoryRankText?: string };
  }>({});

  const sortedFounderNationsDetails = useMemo(() => {
    if (team.primaSquadraDetails && team.primaSquadraDetails.length > 0) {
      return [...team.primaSquadraDetails].sort((a, b) => (a.actualRank ?? Infinity) - (b.actualRank ?? Infinity));
    }
    if (!allNations || allNations.length === 0) return [];
    return (team.founderChoices || []).map(id => {
        const nation = allNations.find(n => n.id === id);
        return {
            id: id,
            name: nation?.name || 'Sconosciuto',
            countryCode: nation?.countryCode || 'xx',
            actualRank: nation?.ranking,
            artistName: nation?.artistName,
            songTitle: nation?.songTitle,
            points: 0 
        } as GlobalPrimaSquadraDetail;
      }).sort((a, b) => (a.actualRank ?? Infinity) - (b.actualRank ?? Infinity));
  }, [team.primaSquadraDetails, team.founderChoices, allNations]);

  const treppoScorePicksForDisplay = useMemo(() => [
    { teamPickNationId: team.bestSongNationId, Icon: Music2, label: "Miglior Canzone", rankInfoKey: 'Music2', categoryKey: 'averageSongScore' as keyof Omit<NationGlobalCategorizedScores, 'voteCount'> },
    { teamPickNationId: team.bestPerformanceNationId, Icon: Star, label: "Miglior Performance", rankInfoKey: 'Star', categoryKey: 'averagePerformanceScore' as keyof Omit<NationGlobalCategorizedScores, 'voteCount'> },
    { teamPickNationId: team.bestOutfitNationId, Icon: Shirt, label: "Miglior Outfit", rankInfoKey: 'Shirt', categoryKey: 'averageOutfitScore' as keyof Omit<NationGlobalCategorizedScores, 'voteCount'> },
    { teamPickNationId: team.worstSongNationId, Icon: ThumbsDown, label: "Peggior TreppoScore", rankInfoKey: 'ThumbsDown', categoryKey: 'overallAverageScore' as keyof Omit<NationGlobalCategorizedScores, 'voteCount'> },
  ].map(pick => {
      const nation = pick.teamPickNationId && allNations ? allNations.find(n => n.id === pick.teamPickNationId) : undefined;
      const rankInfo = categoryRanksAndCorrectness[pick.rankInfoKey] || {};
      const nationScores = pick.teamPickNationId && nationGlobalCategorizedScoresMap ? nationGlobalCategorizedScoresMap.get(pick.teamPickNationId) : undefined;
      const globalScore = nationScores ? nationScores[pick.categoryKey] : null;

      return {
          ...pick,
          nation: nation,
          actualCategoryRank: rankInfo.rank,
          isCorrectPick: rankInfo.isCorrectPick || false,
          pickedNationName: nation?.name,
          pickedNationCountryCode: nation?.countryCode,
          pointsAwarded: team.categoryPicksDetails?.find(p => p.categoryName === pick.label)?.pointsAwarded ?? 0,
          iconName: pick.rankInfoKey,
          categoryRankText: rankInfo.categoryRankText,
          globalScoreForCategory: globalScore,
      } as GlobalCategoryPickDetail & { Icon: React.ElementType, label: string, isCorrectPick: boolean, actualCategoryRank?: number | null, categoryRankText?: string, globalScoreForCategory?: number | null };
  }), [team, allNations, categoryRanksAndCorrectness, team.categoryPicksDetails]);


  const nationGlobalCategorizedScoresMap = useMemo(() => {
    if (nationGlobalCategorizedScoresArray && nationGlobalCategorizedScoresArray.length > 0) {
        return new Map(nationGlobalCategorizedScoresArray);
    }
    return new Map<string, NationGlobalCategorizedScores>();
  }, [nationGlobalCategorizedScoresArray]);

  const getRankAndTextForCategoryListItem = (nationId?: string, sortedList?: Array<{ id: string }>, categoryName?: string): { rank?: number; categoryRankText?: string } => {
      if (!nationId || !sortedList || sortedList.length === 0) return { rank: undefined, categoryRankText: undefined };
      const rankIndex = sortedList.findIndex(n => n.id === nationId);
      const rank = rankIndex !== -1 ? rankIndex + 1 : undefined;
      let suffix = "";
       if (categoryName === "Peggior TreppoScore") {
          suffix = " peggiore";
       } else if (categoryName === "Miglior Canzone" || categoryName === "Miglior Performance" || categoryName === "Miglior Outfit") {
          // No suffix
       }
      return { rank, categoryRankText: rank ? `(${rank}º${suffix})` : undefined };
  };

  useEffect(() => {
    if (nationGlobalCategorizedScoresMap && nationGlobalCategorizedScoresMap.size > 0 && allNations && allNations.length > 0) {
        const getSortedList = (categoryKey: keyof Omit<NationGlobalCategorizedScores, 'voteCount'>, order: 'asc' | 'desc') => {
          return Array.from(nationGlobalCategorizedScoresMap.entries())
            .map(([nationId, scores]) => ({
            id: nationId,
            name: allNations.find(n => n.id === nationId)?.name || 'Sconosciuto',
            score: scores[categoryKey]
            }))
            .filter(item => item.score !== null && (nationGlobalCategorizedScoresMap.get(item.id)?.voteCount || 0) > 0)
            .sort((a, b) => {
              if (a.score === null && b.score === null) return 0;
              if (a.score === null) return 1;
              if (b.score === null) return -1;
              if (a.score === b.score) {
                const voteCountA = nationGlobalCategorizedScoresMap.get(a.id)?.voteCount || 0;
                const voteCountB = nationGlobalCategorizedScoresMap.get(b.id)?.voteCount || 0;
                if (voteCountA !== voteCountB) {
                  return order === 'desc' ? voteCountB - voteCountA : voteCountA - voteCountB;
                }
                return a.name.localeCompare(b.name);
              }
              return order === 'desc' ? (b.score as number) - (a.score as number) : (a.score as number) - (b.score as number);
            });
        };

        const newRanks: typeof categoryRanksAndCorrectness = {};

        const bestSongNations = getSortedList('averageSongScore', 'desc');
        if (team.bestSongNationId) {
          const { rank, categoryRankText } = getRankAndTextForCategoryListItem(team.bestSongNationId, bestSongNations, "Miglior Canzone");
          newRanks['Music2'] = { rank, isCorrectPick: !leaderboardLockedAdmin && rank !== undefined && rank <=3, categoryRankText };
        }

        const bestPerfNations = getSortedList('averagePerformanceScore', 'desc');
        if (team.bestPerformanceNationId) {
          const { rank, categoryRankText } = getRankAndTextForCategoryListItem(team.bestPerformanceNationId, bestPerfNations, "Miglior Performance");
          newRanks['Star'] = { rank, isCorrectPick: !leaderboardLockedAdmin && rank !== undefined && rank <=3, categoryRankText };
        }

        const bestOutfitNations = getSortedList('averageOutfitScore', 'desc');
        if (team.bestOutfitNationId) {
          const { rank, categoryRankText } = getRankAndTextForCategoryListItem(team.bestOutfitNationId, bestOutfitNations, "Miglior Outfit");
          newRanks['Shirt'] = { rank, isCorrectPick: !leaderboardLockedAdmin && rank !== undefined && rank <=3, categoryRankText };
        }
        
        const worstTreppoScoreNationsList = getSortedList('overallAverageScore', 'asc'); 
        if (team.worstSongNationId) { 
            const { rank, categoryRankText } = getRankAndTextForCategoryListItem(team.worstSongNationId, worstTreppoScoreNationsList, "Peggior TreppoScore");
            newRanks['ThumbsDown'] = { rank, isCorrectPick: !leaderboardLockedAdmin && rank !== undefined && rank <= 3, categoryRankText };
        }
        setCategoryRanksAndCorrectness(newRanks);
    } else {
         setCategoryRanksAndCorrectness({});
    }
  }, [nationGlobalCategorizedScoresMap, allNations, team, leaderboardLockedAdmin]);


  useEffect(() => {
    async function fetchAdminSettings() {
      setIsLoadingAdminSettings(true);
      try {
        const [teamsLockStatus, lbLockedStatus] = await Promise.all([
          getTeamsLockedStatus(),
          getLeaderboardLockedStatus()
        ]);
        setTeamsLocked(teamsLockStatus);
        setLeaderboardLockedAdmin(lbLockedStatus);
      } catch (error) {
        console.error("Failed to fetch admin settings for TeamListItem:", error);
        setTeamsLocked(false);
        setLeaderboardLockedAdmin(false);
      } finally {
        setIsLoadingAdminSettings(false);
      }
    }
    fetchAdminSettings();
  }, []);

  if (isLoadingAdminSettings || !allNations) {
    return (
      <Card className={cn(
        "flex flex-col h-full shadow-lg p-4 items-center justify-center min-w-[280px]",
        isLeaderboardPodiumDisplay && !leaderboardLockedAdmin && team.rank && team.rank <=3 ?
          (team.rank === 1 ? "border-yellow-400 border-2 shadow-yellow-400/30" :
           team.rank === 2 ? "border-slate-400 border-2 shadow-slate-400/30" :
           "border-amber-500 border-2 shadow-amber-500/30")
        : "border-border"
      )}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-2 text-xs">Caricamento dettagli team...</p>
      </Card>
    );
  }

  const borderClass =
    isLeaderboardPodiumDisplay && !leaderboardLockedAdmin && team.rank && team.rank <=3 ?
      (team.rank === 1 ? "border-yellow-400 border-2 shadow-yellow-400/30" :
       team.rank === 2 ? "border-slate-400 border-2 shadow-slate-400/30" :
       "border-amber-500 border-2 shadow-amber-500/30")
    : "border-border";

  const rankTextColorClass =
    isLeaderboardPodiumDisplay && !leaderboardLockedAdmin && team.rank && [1,2,3].includes(team.rank) ?
      (team.rank === 1 ? "text-yellow-400" :
       team.rank === 2 ? "text-slate-400" :
       "text-amber-500")
    : "text-muted-foreground";

  const hasAnyTreppoScorePredictions = team.bestSongNationId || team.bestPerformanceNationId || team.bestOutfitNationId || team.worstSongNationId;
  const renderDetailedView = (isLeaderboardPodiumDisplay || isOwnTeamCard) && (team.primaSquadraDetails || sortedFounderNationsDetails.length > 0) && allNations && allNations.length > 0;
  const hasAnyBonus = team.bonusCampionePronostici || team.bonusEnPleinTop5;

  return (
    <Card className={cn(
      "flex flex-col h-full shadow-lg hover:shadow-primary/20 transition-shadow duration-300 min-w-[280px]",
      borderClass
    )}>
       <CardHeader className={cn(
        "pt-4 px-4 space-y-0",
        (renderDetailedView && (hasAnyTreppoScorePredictions || hasAnyBonus)) && "pb-3 border-b border-border"
      )}>
        {isLeaderboardPodiumDisplay ? (
          <>
            <div className="flex items-baseline justify-between w-full">
                <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-accent" />
                    <CardTitle className="text-xl text-primary">
                        {team.name}
                    </CardTitle>
                </div>
                 {typeof team.score === 'number' && !leaderboardLockedAdmin && (
                    <div className="text-lg font-bold text-primary whitespace-nowrap ml-2 shrink-0">
                        {team.score}pt
                    </div>
                )}
            </div>
            <div className="flex items-baseline justify-between w-full text-xs">
                {team.creatorDisplayName && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                        <UserCircle className="h-3 w-3" />
                        <span>{team.creatorDisplayName}</span>
                    </div>
                )}
                {!leaderboardLockedAdmin && team.rank && (
                    <div className={cn("font-semibold flex items-center", rankTextColorClass)}>
                        <MedalIcon rank={team.rank} className="mr-1" />
                        {getRankText(team.rank, team.isTied)}
                    </div>
                )}
            </div>
          </>
        ) : ( 
          <div className="flex flex-row justify-between items-start">
            <div className="flex-grow">
              <CardTitle className="text-xl text-primary flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                {team.name}
              </CardTitle>
              {team.creatorDisplayName && !isOwnTeamCard && (
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5" title={`Utente: ${team.creatorDisplayName}`}>
                    <UserCircle className="h-3 w-3" />{team.creatorDisplayName}
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
                {typeof team.score === 'number' && !leaderboardLockedAdmin && (
                    <div className="text-lg font-bold text-primary">
                        {team.score}pt
                    </div>
                )}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-grow space-y-1 pt-2 pb-4 px-4">
        { renderDetailedView ? (
          <>
            <div className={cn("mb-[15px]",(hasAnyTreppoScorePredictions || hasAnyBonus) && "pb-3 border-b border-border")}>
              <p className="text-lg font-bold text-primary mt-2 mb-1">
                Pronostici TreppoVision
              </p>
              {sortedFounderNationsDetails.map((detail, index) => (
                <PrimaSquadraNationDisplayDetailPodium
                  key={`${team.id}-${detail.id}-prima-detail-${index}`}
                  detail={detail}
                  allNations={allNations}
                  leaderboardLocked={leaderboardLockedAdmin}
                  isEvenRow={index % 2 !== 0}
                />
              ))}
            </div>

            {hasAnyTreppoScorePredictions && (
              <div className={cn("pt-0", (hasAnyBonus) && "pb-3 border-b border-border mb-[15px]")}>
                <p className="text-lg font-bold text-secondary mt-3 mb-1">
                  Pronostici TreppoScore
                </p>
                {treppoScorePicksForDisplay.map((detail, index) => (
                   <CategoryPickDisplayDetailPodium
                      key={`${team.id}-${detail.label}-detail-${index}`}
                      detail={detail}
                      allNations={allNations}
                      leaderboardLockedAdmin={leaderboardLockedAdmin}
                      isEvenRow={index % 2 !== 0}
                    />
                ))}
              </div>
            )}

           {hasAnyBonus && (
              <div className="pt-3">
                <p className="text-lg font-bold text-primary mt-0 mb-1">
                  Bonus
                </p>
                {team.bonusCampionePronostici && (
                  <div className={cn("flex items-center justify-between px-2 py-1 text-xs", (team.bonusEnPleinTop5 && (0 % 2 !==0)) && "bg-muted/50 rounded-md")}>
                    <div className="flex items-center gap-1.5">
                      <Trophy className="w-5 h-5 text-yellow-500 shrink-0" />
                      <span className="font-medium text-foreground/90">Campione di Pronostici</span>
                    </div>
                     {!leaderboardLockedAdmin && <span className="font-semibold text-primary ml-auto">+5pt</span>}
                  </div>
                )}
                {team.bonusEnPleinTop5 && (
                   <div className={cn("flex items-center justify-between px-2 py-1 text-xs", team.bonusCampionePronostici && (1 % 2 !==0) && "bg-muted/50 rounded-md")}>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                      <span className="font-medium text-foreground/90">En Plein Top 5</span>
                    </div>
                     {!leaderboardLockedAdmin && <span className="font-semibold text-primary ml-auto">+30pt</span>}
                  </div>
                )}
              </div>
            )}
          </>
        ) : ( 
          <>
            { (team.founderChoices && team.founderChoices.length > 0) && (
                 <div className="mb-[15px]">
                    <p className="text-lg font-bold text-primary mt-2 mb-1">
                        Pronostici TreppoVision
                    </p>
                    {sortedFounderNationsDetails.map((nationDetail, index) => {
                        const nation = allNations?.find(n => n.id === nationDetail.id);
                        return (
                            <SelectedNationDisplay
                                key={`founder-${nationDetail.id}-${index}`}
                                nation={nation}
                                IconComponent={BadgeCheck}
                                isEvenRow={index % 2 !== 0}
                                leaderboardLocked={leaderboardLockedAdmin}
                                actualEurovisionRank={!leaderboardLockedAdmin && nation ? nation.ranking : undefined}
                            />
                        );
                    })}
                </div>
            )}
             {hasAnyTreppoScorePredictions && isOwnTeamCard && ( 
                <div className={cn("mb-[15px] pt-3", (team.founderChoices && team.founderChoices.length > 0) && "border-t border-border")}>
                    <p className={cn("text-lg font-bold mb-1", "text-secondary" )}>
                        Pronostici TreppoScore
                    </p>
                    {treppoScorePicksForDisplay.map((category, index) => {
                        const rankInfo = categoryRanksAndCorrectness[category.rankInfoKey] || {};
                        return (
                            <SelectedNationDisplay
                                key={category.label}
                                nation={category.nation}
                                IconComponent={category.Icon}
                                label={category.label}
                                isEvenRow={index % 2 !== 0}
                                categoryRank={!leaderboardLockedAdmin ? rankInfo.rank : undefined}
                                isCorrectPick={rankInfo.isCorrectPick || false}
                                leaderboardLocked={leaderboardLockedAdmin}
                                categoryRankText={rankInfo.categoryRankText}
                            />
                        );
                    })}
                </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

