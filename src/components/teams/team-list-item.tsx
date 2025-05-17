
"use client";

import type { TeamWithScore, Nation, NationGlobalCategorizedScores, GlobalPrimaSquadraDetail, GlobalCategoryPickDetail } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCircle, Edit, Music2, Star, ThumbsDown, Shirt, Lock, BadgeCheck, Award, ListOrdered, Loader2, Info, CheckCircle, Trophy, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { getTeamsLockedStatus } from "@/lib/actions/team-actions"; 
import { getLeaderboardLockedStatus } from "@/lib/actions/admin-actions";
import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";


const MedalIcon = React.memo(({ rank, className }: { rank?: number, className?: string }) => {
  if (rank === undefined || rank === null || rank === 0 || rank > 3) return null;
  let colorClass = "";
  if (rank === 1) colorClass = "text-yellow-400";
  else if (rank === 2) colorClass = "text-slate-400";
  else if (rank === 3) colorClass = "text-amber-500";
  return <Award className={cn("w-3.5 h-3.5 shrink-0", colorClass, className)} />;
});
MedalIcon.displayName = 'MedalIconLocal';


const PrimaSquadraNationDisplayDetailPodium = React.memo(({
  detail,
  leaderboardLockedAdmin,
  isEvenRow,
}: {
  detail: GlobalPrimaSquadraDetail;
  leaderboardLockedAdmin: boolean | null;
  isEvenRow?: boolean;
}) => {
  const rankText = !leaderboardLockedAdmin && detail.actualRank && detail.actualRank > 0
    ? `(${detail.actualRank}º)`
    : "";
  const titleText = `${detail.name}${rankText ? ` ${rankText}` : ''}${detail.artistName ? ` - ${detail.artistName}` : ''}${detail.songTitle ? ` - ${detail.songTitle}` : ''}${!leaderboardLockedAdmin && typeof detail.points === 'number' ? ` Punti: ${detail.points}`: ''}`;

  return (
    <div className={cn(
      "px-2 py-1 flex items-center", // Ensure outer div is flex and items-center for vertical alignment of icon and text block
      isEvenRow && "bg-muted/50 rounded-md"
    )}>
      <BadgeCheck className="w-5 h-5 text-accent shrink-0 mr-1.5" /> {/* Icon */}
      <div className="flex-grow"> {/* Container for flag and text, allows text to take remaining space */}
        <div className="flex items-center gap-1.5"> {/* Flag + Nation Name/Rank Link */}
            {detail.countryCode ? (
            <Image
                src={`https://flagcdn.com/w20/${detail.countryCode.toLowerCase()}.png`}
                alt={detail.name}
                width={20}
                height={13}
                className="rounded-sm border border-border/30 object-contain shrink-0"
                data-ai-hint={`${detail.name} flag icon`}
            />
            ) : (
            <div className="w-5 h-[13px] shrink-0 bg-muted/20 rounded-sm"></div>
            )}
            <Link
                href={`/nations/${detail.id}`}
                className="group text-xs hover:underline hover:text-primary flex items-center gap-1"
                title={titleText}
            >
                <span className="font-medium">{detail.name}</span>
                {!leaderboardLockedAdmin && detail.actualRank && [1,2,3].includes(detail.actualRank) && <MedalIcon rank={detail.actualRank} />}
                {rankText && !leaderboardLockedAdmin && (
                <span className="text-muted-foreground text-xs ml-0.5">{rankText}</span>
                )}
            </Link>
        </div>
        {/* Artist and Song Name on a new line, aligned left */}
        {(detail.artistName || detail.songTitle) && !leaderboardLockedAdmin && (
            <div className="pl-[calc(20px+0.375rem)]"> {/* Adjust padding to align with Nation Name */}
                 <span className="text-xs text-muted-foreground/80 block">
                    {detail.artistName}{detail.artistName && detail.songTitle && " - "}{detail.songTitle}
                </span>
            </div>
        )}
      </div>
      {/* Points, aligned to the right */}
      {!leaderboardLockedAdmin && typeof detail.points === 'number' && (
        <span className={cn(
            "text-xs ml-auto pl-1 shrink-0 self-center", // self-center to align with the icon/flag group
            detail.points > 0 ? "font-semibold text-primary" : detail.points < 0 ? "font-semibold text-destructive" : "font-medium text-muted-foreground"
        )}>
            {detail.points > 0 ? `+${detail.points}pt` : (detail.points === 0 ? "0pt" : `${detail.points}pt`)}
        </span>
      )}
    </div>
  );
});
PrimaSquadraNationDisplayDetailPodium.displayName = 'PrimaSquadraNationDisplayDetailPodium';


const CategoryPickDisplayDetailPodium = React.memo(({
  detail,
  leaderboardLockedAdmin,
  isEvenRow,
}: {
  detail: GlobalCategoryPickDetail & { artistName?: string, songTitle?: string };
  leaderboardLockedAdmin: boolean | null;
  isEvenRow?: boolean;
}) => {
  let IconComponent: React.ElementType;
  const iconColor = "text-accent";

  switch (detail.iconName) {
    case 'Award': IconComponent = Award; break;
    case 'Music2': IconComponent = Music2; break;
    case 'Star': IconComponent = Star; break;
    case 'Shirt': IconComponent = Shirt; break;
    case 'ThumbsDown': IconComponent = ThumbsDown; break;
    default: IconComponent = Info;
  }

  let rankSuffix = "";
   if (detail.categoryName === "Peggior TreppoScore") {
    rankSuffix = " peggiore";
  }
  
  const rankText = !leaderboardLockedAdmin && detail.actualCategoryRank && detail.actualCategoryRank > 0
    ? `(${detail.actualCategoryRank}º${rankSuffix})`
    : "";

  const titleText = `${detail.categoryName}: ${detail.pickedNationName || 'N/D'}${rankText}${!leaderboardLockedAdmin && typeof detail.pointsAwarded === 'number' ? ` Punti: ${detail.pointsAwarded}`: ''}`;
  
  return (
    <div className={cn(
      "px-2 py-1.5", 
      isEvenRow && "bg-muted/50 rounded-md"
    )}>
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-1.5">
          <IconComponent className={cn("h-5 w-5 shrink-0", iconColor)} />
          <span className="text-sm text-foreground/90 min-w-[120px] shrink-0 font-medium">
            {detail.categoryName}
          </span>
        </div>
        {typeof detail.pointsAwarded === 'number' && !leaderboardLockedAdmin && (
          <span
            className={cn(
              "text-xs shrink-0 ml-auto", 
              detail.pointsAwarded > 0 ? "font-semibold text-primary" :
              detail.pointsAwarded === 0 ? "font-medium text-muted-foreground" :
              "font-semibold text-destructive"
            )}
          >
            {detail.pointsAwarded > 0 ? `+${detail.pointsAwarded}pt` : `${detail.pointsAwarded}pt`}
          </span>
        )}
      </div>

      <div className={cn(
        "w-full mt-1 flex items-center", // Make this a flex container
        "pl-[calc(1.25rem+0.375rem)]" // Standard indent based on icon + gap
      )}>
        {detail.pickedNationName ? (
            <>
              <div className="flex items-center gap-1.5 mr-1.5"> {/* Flag + Nation/Rank/Artist/Song */}
                {detail.pickedNationCountryCode ? (
                <Image
                    src={`https://flagcdn.com/w20/${detail.pickedNationCountryCode.toLowerCase()}.png`}
                    alt={detail.pickedNationName || "Nazione"}
                    width={20}
                    height={13}
                    className="rounded-sm border border-border/30 object-contain shrink-0"
                    data-ai-hint={`${detail.pickedNationName} flag icon`}
                />
                ) : (
                <div className="w-5 h-[13px] shrink-0 bg-muted/20 rounded-sm"></div>
                )}
                <div className="flex flex-col items-start"> 
                    <Link href={`/nations/${detail.pickedNationId || '#'}`}
                        className="group text-xs hover:underline hover:text-primary flex items-center gap-0.5"
                        title={titleText}
                    >
                        <span className="font-medium">
                        {detail.pickedNationName}
                        </span>
                        {!leaderboardLockedAdmin && detail.actualCategoryRank && [1,2,3].includes(detail.actualCategoryRank) && <MedalIcon rank={detail.actualCategoryRank}/>}
                        {rankText && !leaderboardLockedAdmin && detail.actualCategoryRank && detail.actualCategoryRank > 0 && (
                        <span className="text-muted-foreground text-xs ml-0.5">
                            {rankText}
                        </span>
                        )}
                    </Link>
                    {(detail.artistName || detail.songTitle) && !leaderboardLockedAdmin && (
                        <span className="text-xs text-muted-foreground/80 block">
                        {detail.artistName}{detail.artistName && detail.songTitle && " - "}{detail.songTitle}
                        </span>
                    )}
                </div>
              </div>
            </>
        ) : (
          <span className="text-xs text-muted-foreground">Nessuna selezione</span>
        )}
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
  leaderboardLocked,
  isEvenRow,
  categoryRank,
  categoryRankText,
  globalScoreForCategory
}: {
  nation?: Nation | null;
  IconComponent: React.ElementType;
  label?: string;
  isCorrectPick?: boolean;
  leaderboardLocked: boolean | null;
  isEvenRow?: boolean;
  categoryRank?: number | null;
  categoryRankText?: string | null;
  globalScoreForCategory?: number | null;
}) => {
  const iconColor = isCorrectPick && !leaderboardLocked ? "text-accent" : "text-accent";

  const nationEurovisionRank = nation?.ranking;
  let eurovisionRankTextDisplay = "";
  if (!label && !leaderboardLocked && nationEurovisionRank && nationEurovisionRank > 0) {
    eurovisionRankTextDisplay = `(${nationEurovisionRank}º)`;
  }
  
  const nameForDisplay = (
    <>
      <span className="font-medium">{nation?.name || "Nessuna selezione"}</span>
      {!label && !leaderboardLocked && nationEurovisionRank && [1,2,3].includes(nationEurovisionRank) && <MedalIcon rank={nationEurovisionRank} className="ml-1"/>}
      {eurovisionRankTextDisplay && !label && (
        <span className="text-muted-foreground text-xs ml-0.5">{eurovisionRankTextDisplay}</span>
      )}
      {label && !leaderboardLocked && categoryRank && [1,2,3].includes(categoryRank) && <MedalIcon rank={categoryRank} className="ml-1"/>}
      {label && categoryRankText && !leaderboardLocked && (
        <span className="text-muted-foreground text-xs ml-0.5">{categoryRankText}</span>
      )}
    </>
  );
  
  const mainContainerClasses = cn(
    "px-2 py-1",
    isEvenRow && "bg-muted/50 rounded-md"
  );

  const labelAndIconContainerClasses = cn(
    "flex items-center gap-1.5"
  );

  const nationInfoContainerOuterClasses = cn(
    "flex items-center gap-1.5"
  );

  const nationInfoContainerInnerClasses = cn(
     label && "mt-1 sm:mt-0 pl-[1.625rem]" // Indent for labeled items
  );

  return (
     <div className={cn(
        mainContainerClasses,
        label && "flex flex-col items-start sm:flex-row sm:items-center gap-1 sm:gap-1.5" 
      )}>
      <div className={cn(labelAndIconContainerClasses, label && "w-full sm:w-auto")}>
        <IconComponent className={cn("h-5 w-5 shrink-0", iconColor)} />
        {label && (
          <span className="text-sm text-foreground/90 min-w-[120px] shrink-0 font-medium">
            {label}
          </span>
        )}
      </div>
      
      <div className={cn(
        nationInfoContainerOuterClasses,
        label && "pl-0 w-full sm:w-auto" 
      )}>
        <div className={cn(
          "flex items-center gap-1.5",
          label && nationInfoContainerInnerClasses
        )}>
          {nation?.countryCode ? (
            <Image
              src={`https://flagcdn.com/w20/${nation.countryCode.toLowerCase()}.png`}
              alt={nation.name || "Bandiera Nazione"}
              width={20}
              height={13}
              className="rounded-sm border border-border/30 object-contain shrink-0"
              data-ai-hint={`${nation.name} flag icon`}
            />
          ) : (
           (nation || (label && !nation)) && <div className="w-5 h-[13px] shrink-0 bg-muted/20 rounded-sm"></div>
          )}
          {nation || (label && !nation) ? ( 
            <div className="flex flex-col items-start">
              <Link
                href={nation ? `/nations/${nation.id}` : '#'}
                className={cn("group text-xs hover:underline hover:text-primary flex items-center gap-0.5", !nation && "pointer-events-none")}
                title={nation ? `${nation.name}${eurovisionRankTextDisplay} - ${nation.artistName} - ${nation.songTitle}` : "Nessuna selezione"}
              >
                {nameForDisplay}
              </Link>
              {nation && (nation.artistName || nation.songTitle) && !label && ( 
                <span className="text-xs text-muted-foreground/80 block">
                    {nation.artistName}{nation.artistName && nation.songTitle && " - "}{nation.songTitle}
                </span>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
});
SelectedNationDisplay.displayName = 'SelectedNationDisplay';

interface TeamListItemProps {
  team: TeamWithScore & { isTied?: boolean };
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

  const nationGlobalCategorizedScoresMap = useMemo(() => {
    if (nationGlobalCategorizedScoresArray && nationGlobalCategorizedScoresArray.length > 0) {
        return new Map(nationGlobalCategorizedScoresArray);
    }
    return new Map<string, NationGlobalCategorizedScores>();
  }, [nationGlobalCategorizedScoresArray]);


  const treppoScoreCategoriesConfig = useMemo(() => [
    { teamPickNationId: team.bestSongNationId, Icon: Music2, label: "Miglior Canzone", rankInfoKey: 'Music2', categoryKey: 'averageSongScore' as keyof NationGlobalCategorizedScores },
    { teamPickNationId: team.bestPerformanceNationId, Icon: Star, label: "Miglior Performance", rankInfoKey: 'Star', categoryKey: 'averagePerformanceScore' as keyof NationGlobalCategorizedScores },
    { teamPickNationId: team.bestOutfitNationId, Icon: Shirt, label: "Miglior Outfit", rankInfoKey: 'Shirt', categoryKey: 'averageOutfitScore' as keyof NationGlobalCategorizedScores },
    { teamPickNationId: team.worstSongNationId, Icon: ThumbsDown, label: "Peggior TreppoScore", rankInfoKey: 'ThumbsDown', categoryKey: 'overallAverageScore' as keyof NationGlobalCategorizedScores },
  ], [team.bestSongNationId, team.bestPerformanceNationId, team.bestOutfitNationId, team.worstSongNationId]);

  const sortedFounderNationsDetails = useMemo(() => {
    if (!allNations || allNations.length === 0) return [];
    if (team.primaSquadraDetails && team.primaSquadraDetails.length > 0) {
      return [...team.primaSquadraDetails].sort((a, b) => (a.actualRank ?? Infinity) - (b.actualRank ?? Infinity));
    }
    return (team.founderChoices || []).map(id => {
        const nation = allNations.find(n => n.id === id);
        return {
            id,
            name: nation?.name || 'Sconosciuto',
            countryCode: nation?.countryCode || 'xx',
            artistName: nation?.artistName,
            songTitle: nation?.songTitle,
            actualRank: nation?.ranking,
            points: 0, 
        };
    }).sort((a, b) => (a.actualRank ?? Infinity) - (b.actualRank ?? Infinity));
  }, [team.primaSquadraDetails, team.founderChoices, allNations]);

  const treppoScorePicksForDisplay = useMemo(() => {
     if (!allNations || allNations.length === 0) return treppoScoreCategoriesConfig.map(pick => ({...pick, pickedNationName: "N/A", pickedNationCountryCode: "xx", artistName: "", songTitle: "", actualCategoryRank: undefined, isCorrectPick: false, categoryRankText: undefined, pointsAwarded: 0 }));
    return treppoScoreCategoriesConfig.map(pick => {
      const nation = pick.teamPickNationId && allNations ? allNations.find(n => n.id === pick.teamPickNationId) : undefined;
      const rankInfo = categoryRanksAndCorrectness[pick.rankInfoKey] || {};
      const originalDetail = team.categoryPicksDetails?.find(d => d.categoryName === pick.label);
      const nationScores = pick.teamPickNationId && nationGlobalCategorizedScoresMap ? nationGlobalCategorizedScoresMap.get(pick.teamPickNationId) : undefined;
      const globalScore = nationScores ? nationScores[pick.categoryKey] : null;

      return {
        ...pick,
        pickedNationName: nation?.name,
        pickedNationCountryCode: nation?.countryCode,
        artistName: nation?.artistName,
        songTitle: nation?.songTitle,
        actualCategoryRank: rankInfo.rank,
        isCorrectPick: rankInfo.isCorrectPick,
        categoryRankText: rankInfo.categoryRankText,
        pointsAwarded: originalDetail?.pointsAwarded ?? 0,
        globalScoreForCategory: globalScore
      };
    });
  }, [treppoScoreCategoriesConfig, categoryRanksAndCorrectness, allNations, nationGlobalCategorizedScoresMap, team.categoryPicksDetails]);


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

  useEffect(() => {
    if (nationGlobalCategorizedScoresMap && nationGlobalCategorizedScoresMap.size > 0 && allNations && allNations.length > 0) {
        const getSortedList = (categoryKey: 'averageSongScore' | 'averagePerformanceScore' | 'averageOutfitScore' | 'overallAverageScore', order: 'asc' | 'desc') => {
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

        const getRankAndText = (nationId?: string, sortedList?: Array<{ id: string }>, categoryName?: string): { rank?: number | null; categoryRankText?: string } => {
            if (!nationId || !sortedList || sortedList.length === 0) return { rank: undefined, categoryRankText: undefined };
            const rankIndex = sortedList.findIndex(n => n.id === nationId);
            const rank = rankIndex !== -1 ? rankIndex + 1 : undefined;

            let suffix = "";
             if (categoryName === "Peggior TreppoScore") {
                suffix = " peggiore";
            } else if (["Miglior Canzone", "Miglior Performance", "Miglior Outfit"].includes(categoryName || "")) {
                // No suffix here
            }
            return { rank, categoryRankText: rank ? `(${rank}º${suffix})` : undefined };
        };

        const newRanks: typeof categoryRanksAndCorrectness = {};

        const bestSongNations = getSortedList('averageSongScore', 'desc');
        if (team.bestSongNationId) {
          const { rank, categoryRankText } = getRankAndText(team.bestSongNationId, bestSongNations, "Miglior Canzone");
          newRanks['Music2'] = { rank, isCorrectPick: !leaderboardLockedAdmin && rank !== undefined && rank <=3, categoryRankText };
        }

        const bestPerfNations = getSortedList('averagePerformanceScore', 'desc');
        if (team.bestPerformanceNationId) {
          const { rank, categoryRankText } = getRankAndText(team.bestPerformanceNationId, bestPerfNations, "Miglior Performance");
          newRanks['Star'] = { rank, isCorrectPick: !leaderboardLockedAdmin && rank !== undefined && rank <= 3, categoryRankText };
        }

        const bestOutfitNations = getSortedList('averageOutfitScore', 'desc');
        if (team.bestOutfitNationId) {
          const { rank, categoryRankText } = getRankAndText(team.bestOutfitNationId, bestOutfitNations, "Miglior Outfit");
          newRanks['Shirt'] = { rank, isCorrectPick: !leaderboardLockedAdmin && rank !== undefined && rank <=3, categoryRankText };
        }
        
        const worstOverallScoreNations = getSortedList('overallAverageScore', 'asc');
        if (team.worstSongNationId) { 
            const { rank, categoryRankText } = getRankAndText(team.worstSongNationId, worstOverallScoreNations, "Peggior TreppoScore");
            newRanks['ThumbsDown'] = { rank, isCorrectPick: !leaderboardLockedAdmin && rank !== undefined && rank <= 3, categoryRankText };
        }
        setCategoryRanksAndCorrectness(newRanks);
    } else {
         setCategoryRanksAndCorrectness({});
    }
  }, [nationGlobalCategorizedScoresArray, allNations, team, leaderboardLockedAdmin, treppoScoreCategoriesConfig, nationGlobalCategorizedScoresMap]); // Added nationGlobalCategorizedScoresMap
  
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

  const rankTextColorClass = (rank?: number) =>
    isLeaderboardPodiumDisplay && !leaderboardLockedAdmin && rank && [1,2,3].includes(rank) ?
      (rank === 1 ? "text-yellow-400" :
       rank === 2 ? "text-slate-400" :
       "text-amber-500")
    : "text-muted-foreground";

  const getRankTextPodium = (rank?: number, isTied?: boolean): string => {
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
  
  const renderDetailedView = isOwnTeamCard || (isLeaderboardPodiumDisplay && team.primaSquadraDetails && team.categoryPicksDetails);
  const hasActualTreppoScorePredictions = team.bestSongNationId || team.bestPerformanceNationId || team.bestOutfitNationId || team.worstSongNationId;

  const PodiumHeader = () => (
    <>
      <div className="flex items-baseline justify-between w-full">
        <CardTitle className="text-xl text-primary flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            {team.name}
        </CardTitle>
        {typeof team.score === 'number' && !leaderboardLockedAdmin && (
          <div className="text-2xl font-bold text-primary whitespace-nowrap ml-2 shrink-0">
            {team.score}pt
          </div>
        )}
      </div>
       <div className="flex items-baseline justify-between w-full text-xs">
         {team.creatorDisplayName && !isOwnTeamCard && (
          <div className={cn("flex items-center gap-1 text-muted-foreground")}>
            <UserCircle className="h-3 w-3" />
            <span>{team.creatorDisplayName}</span>
          </div>
        )}
        {!leaderboardLockedAdmin && team.rank && (
          <div className={cn("font-semibold flex items-center", rankTextColorClass(team.rank), (!team.creatorDisplayName || isOwnTeamCard || !isLeaderboardPodiumDisplay) ? "ml-auto" : "")}>
            <MedalIcon rank={team.rank} className="mr-1" />
            {getRankTextPodium(team.rank, team.isTied)}
          </div>
        )}
      </div>
    </>
  );

  const DefaultHeader = () => (
     <div className="flex flex-row justify-between items-start">
        <div className="flex-grow">
          <div className="flex items-center gap-2 text-xl text-primary">
            <Users className="h-5 w-5 text-accent" />
            <CardTitle className="text-xl">
                {team.name}
            </CardTitle>
            {team.creatorDisplayName && !isOwnTeamCard && (
              <span className="ml-1 text-xs text-muted-foreground flex items-center gap-1" title={`Utente: ${team.creatorDisplayName}`}>
                <UserCircle className="h-3 w-3" />{team.creatorDisplayName}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
            {typeof team.score === 'number' && !leaderboardLockedAdmin && (
                <div className="text-lg font-bold text-primary">
                    {team.score}pt
                </div>
            )}
        </div>
    </div>
  );

  return (
    <Card className={cn(
      "flex flex-col h-full shadow-lg hover:shadow-primary/20 transition-shadow duration-300",
      borderClass
    )}>
      <CardHeader className={cn(
        "pt-4 px-4 pb-3 space-y-0", 
        isLeaderboardPodiumDisplay && "border-b border-border"
      )}>
        {isLeaderboardPodiumDisplay ? <PodiumHeader /> : <DefaultHeader />}
      </CardHeader>

      <CardContent className="flex-grow space-y-1 pt-3 pb-4 px-4">
        { renderDetailedView && allNations && allNations.length > 0 ? (
          <>
            <div className={cn("mb-[15px]", (hasActualTreppoScorePredictions || team.bonusCampionePronostici || team.bonusEnPleinTop5) && "pb-3 border-b border-border")}>
              <p className="text-lg font-bold text-primary mt-2 mb-1">
                Pronostici TreppoVision
              </p>
              { (sortedFounderNationsDetails).map((detail, index) => (
                <PrimaSquadraNationDisplayDetailPodium
                  key={`${team.id}-${detail.id}-prima-detail-${index}`}
                  detail={detail}
                  leaderboardLockedAdmin={leaderboardLockedAdmin}
                  isEvenRow={index % 2 !== 0}
                />
              ))}
            </div>

            {(hasActualTreppoScorePredictions) && (
              <div className={cn("pt-0 mb-[15px]", (team.bonusCampionePronostici || team.bonusEnPleinTop5) && "pb-3 border-b border-border")}>
                <p className="text-lg font-bold text-primary mt-0 pt-0 mb-1">
                  Pronostici TreppoScore
                </p>
                {treppoScorePicksForDisplay.map((detail, index) => (
                   <CategoryPickDisplayDetailPodium
                      key={`${team.id}-${detail.label}-detail-${index}`}
                      detail={{
                        categoryName: detail.label,
                        pickedNationId: detail.teamPickNationId,
                        pickedNationName: detail.pickedNationName,
                        pickedNationCountryCode: detail.pickedNationCountryCode,
                        artistName: detail.artistName,
                        songTitle: detail.songTitle,
                        actualCategoryRank: detail.actualCategoryRank,
                        pointsAwarded: detail.pointsAwarded,
                        iconName: detail.rankInfoKey, 
                        pickedNationScoreInCategory: detail.globalScoreForCategory,
                      }}
                      leaderboardLockedAdmin={leaderboardLockedAdmin}
                      isEvenRow={index % 2 !== 0}
                    />
                ))}
              </div>
            )}

           {(team.bonusCampionePronostici || team.bonusEnPleinTop5) && !leaderboardLockedAdmin && (
              <div className="pt-0">
                <p className="text-lg font-bold text-primary mt-3 mb-1"> 
                  Bonus
                </p>
                {team.bonusCampionePronostici && (
                  <div className={cn("flex items-center justify-between px-2 py-1 text-xs", (team.bonusEnPleinTop5 && (0 % 2 !==0)) && "bg-muted/50 rounded-md")}>
                    <div className="flex items-center gap-1.5">
                      <Trophy className="w-5 h-5 text-yellow-500 shrink-0" />
                      <span className="font-medium text-foreground/90">Campione di Pronostici</span>
                    </div>
                    <span className="font-semibold text-primary ml-auto">{typeof team.score === 'number' ? "+30pt" : ""}</span>
                  </div>
                )}
                {team.bonusEnPleinTop5 && (
                   <div className={cn("flex items-center justify-between px-2 py-1 text-xs", team.bonusCampionePronostici && (1 % 2 !==0) && "bg-muted/50 rounded-md")}>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                      <span className="font-medium text-foreground/90">En Plein Top 5</span>
                    </div>
                    <span className="font-semibold text-primary ml-auto">+30pt</span>
                  </div>
                )}
              </div>
            )}
          </>
        ) : ( 
          <> 
            { (sortedFounderNationsDetails && sortedFounderNationsDetails.length > 0 && allNations && allNations.length > 0) && (
                 <div className="mb-3">
                    <p className="text-base font-semibold text-primary mb-1">
                        Pronostici TreppoVision
                    </p>
                    {sortedFounderNationsDetails.map((nationDetail, index) => { 
                        const nation = allNations?.find(n => n.id === nationDetail.id);
                        return (
                          <SelectedNationDisplay
                            key={`founder-${nationDetail.id}-${index}`}
                            nation={nation}
                            IconComponent={BadgeCheck}
                            leaderboardLocked={leaderboardLockedAdmin}
                            isEvenRow={index % 2 !== 0}
                            categoryRank={nation?.ranking} 
                          />
                        );
                    })}
                </div>
            )}
             {hasActualTreppoScorePredictions && allNations && allNations.length > 0 && (
                <div className={cn("pt-3 mb-0", (sortedFounderNationsDetails && sortedFounderNationsDetails.length > 0) && "border-t border-border")}>
                    <p className={cn("text-base font-semibold mb-1", "text-primary" )}>
                        Pronostici TreppoScore
                    </p>
                    {treppoScorePicksForDisplay.map((category, index) => {
                        const nationForPick = category.teamPickNationId ? allNations.find(n => n.id === category.teamPickNationId) : undefined;
                        const rankInfo = categoryRanksAndCorrectness[category.rankInfoKey] || {};
                        
                        return (
                          <SelectedNationDisplay
                            key={category.label}
                            nation={nationForPick}
                            IconComponent={category.Icon}
                            label={category.label}
                            isCorrectPick={rankInfo.isCorrectPick}
                            leaderboardLocked={leaderboardLockedAdmin}
                            isEvenRow={index % 2 !== 0}
                            categoryRankText={rankInfo.categoryRankText}
                            categoryRank={rankInfo.rank}
                            globalScoreForCategory={category.globalScoreForCategory}
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
