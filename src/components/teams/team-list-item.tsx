
"use client";

import type { TeamWithScore, Nation, NationGlobalCategorizedScores, GlobalPrimaSquadraDetail, GlobalCategoryPickDetail as GlobalCategoryPickDetailType } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCircle, Music2, Star, ThumbsDown, Shirt, Lock, BadgeCheck, Award, ListOrdered, Loader2, Info, CheckCircle, Trophy, ChevronDown, Edit3 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { getTeamsLockedStatus } from "@/lib/actions/team-actions";
import { getLeaderboardLockedStatus } from "@/lib/actions/admin-actions";
import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

// Helper function to convert rank to text for Podium/Detailed Card
const getRankTextPodium = (rank?: number, isTied?: boolean): string => {
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
  if (rank === undefined || rank === null || rank === 0) return "text-muted-foreground";
  if (rank === 1) return "text-yellow-400";
  if (rank === 2) return "text-slate-400";
  if (rank === 3) return "text-amber-500";
  return "text-muted-foreground";
};

const MedalIcon = React.memo(({ rank, className }: { rank?: number, className?: string }) => {
  if (rank === undefined || rank === null || rank === 0 || rank > 3) return null;
  let colorClass = "";
  if (rank === 1) colorClass = "text-yellow-400";
  else if (rank === 2) colorClass = "text-slate-400";
  else if (rank === 3) colorClass = "text-amber-500";
  return <Award className={cn("w-4 h-4 shrink-0", colorClass, className)} />;
});
MedalIcon.displayName = 'MedalIconLocal';


interface PrimaSquadraNationDisplayDetailPodiumProps {
  detail: GlobalPrimaSquadraDetail;
  leaderboardLockedAdmin: boolean | null;
  isEvenRow?: boolean;
}

const PrimaSquadraNationDisplayDetailPodium = React.memo(({
  detail,
  leaderboardLockedAdmin,
  isEvenRow,
}: PrimaSquadraNationDisplayDetailPodiumProps) => {
  const nationRank = detail.actualRank;
  const rankText = !leaderboardLockedAdmin && nationRank && nationRank > 0 ? `(${nationRank}º)` : "";
  const titleText = `${detail.name}${rankText ? ` ${rankText}` : ''}${detail.artistName ? ` - ${detail.artistName}` : ''}${detail.songTitle ? ` - ${detail.songTitle}` : ''}${!leaderboardLockedAdmin && typeof detail.points === 'number' ? ` Punti: ${detail.points}` : ''}`;

  return (
    <div className={cn(
      "flex items-start py-1.5",
      isEvenRow ? "bg-muted/50 rounded-md pl-2" : "pl-2" 
    )}>
      <div className="flex items-center justify-center h-full mr-1.5 mt-1 shrink-0">
        <BadgeCheck className="w-5 h-5 text-accent" />
      </div>
      <div className="flex items-center gap-1.5 flex-grow min-w-0">
        {detail.countryCode ? (
          <Image
            src={`https://flagcdn.com/w20/${detail.countryCode.toLowerCase()}.png`}
            alt={detail.name}
            width={20}
            height={13}
            className="rounded-sm border border-border/30 object-contain shrink-0 mt-1"
            data-ai-hint={`${detail.name} flag icon`}
          />
        ) : (
          <div className="w-5 h-[13px] shrink-0 bg-muted/20 rounded-sm mt-1"></div>
        )}
        <div className="flex flex-col items-start flex-grow min-w-0">
          <Link
            href={`/nations/${detail.id}`}
            className="group text-xs hover:underline hover:text-primary flex items-center gap-1"
            title={titleText}
          >
            <span className="font-medium">{detail.name}</span>
            {!leaderboardLockedAdmin && nationRank && [1,2,3].includes(nationRank) && <MedalIcon rank={nationRank} className="ml-0.5" />}
            {rankText && !leaderboardLockedAdmin && (
               <span className={cn(
                  "text-xs ml-0.5",
                   nationRank && [1,2,3].includes(nationRank) ?
                    (nationRank === 1 ? "text-yellow-400" :
                     nationRank === 2 ? "text-slate-400" :
                     "text-amber-500")
                   : "text-muted-foreground/80"
              )}>
                  {rankText}
              </span>
            )}
          </Link>
          {(!leaderboardLockedAdmin && (detail.artistName || detail.songTitle)) && (
               <span className="text-[11px] text-muted-foreground/80 block pl-[calc(20px+0.25rem)]"> {/* Approx: flag width + gap */}
                {detail.artistName}{detail.artistName && detail.songTitle && " - "}{detail.songTitle}
              </span>
          )}
        </div>
      </div>
      {!leaderboardLockedAdmin && typeof detail.points === 'number' && (
        <span className={cn(
          "text-xs ml-auto pl-1 shrink-0 self-center",
          detail.points > 0 ? "font-semibold text-primary" :
          detail.points < 0 ? "font-semibold text-destructive" :
          "font-medium text-muted-foreground"
        )}>
          {detail.points > 0 ? `+${detail.points}` : detail.points}pt
        </span>
      )}
    </div>
  );
});
PrimaSquadraNationDisplayDetailPodium.displayName = 'PrimaSquadraNationDisplayDetailPodium';


interface CategoryPickDisplayDetailPodiumProps {
  detail: {
    iconName: string; // Changed from IconComponent
    label: string;
    pickedNationId: string;
    pickedNationName?: string;
    pickedNationCountryCode?: string;
    artistName?: string;
    songTitle?: string;
    actualCategoryRank?: number;
    isCorrectPick?: boolean;
    categoryRankText?: string;
    pointsAwarded: number;
    pickedNationScoreInCategory?: number | null;
  };
  leaderboardLockedAdmin: boolean | null;
  isEvenRow?: boolean;
}

const CategoryPickDisplayDetailPodium = React.memo(({
  detail,
  leaderboardLockedAdmin,
  isEvenRow,
}: CategoryPickDisplayDetailPodiumProps) => {
  const { iconName, label, pickedNationId, actualCategoryRank, pointsAwarded, pickedNationName, pickedNationCountryCode, artistName, songTitle, isCorrectPick } = detail;
  
  let IconToRender: React.ElementType = Info; // Default icon
  switch (iconName) {
    case 'Award': IconToRender = Award; break;
    case 'Music2': IconToRender = Music2; break;
    case 'Star': IconToRender = Star; break;
    case 'Shirt': IconToRender = Shirt; break;
    case 'ThumbsDown': IconToRender = ThumbsDown; break;
  }
  
  const iconColorClass = isCorrectPick && !leaderboardLockedAdmin ? "text-accent" : "text-accent"; // Always accent for now

  let rankTextSuffix = "";
  if (detail.label === "Peggior TreppoScore") {
    rankTextSuffix = " peggiore";
  }
  
  const rankText = !leaderboardLockedAdmin && actualCategoryRank && actualCategoryRank > 0 
    ? `(${actualCategoryRank}º${rankTextSuffix})`
    : "";

  const titleText = `${label}: ${pickedNationName || 'N/D'}${rankText}${!leaderboardLockedAdmin && typeof pointsAwarded === 'number' ? ` Punti: ${pointsAwarded}`: ''}`;

  const mainContainerClasses = cn(
    "py-1.5",
    isEvenRow && "bg-muted/50 rounded-md"
  );

  const labelAndIconContainerClasses = cn(
    "flex items-center gap-1.5",
    isEvenRow ? "px-2" : "px-2"
  );
  
  const nationInfoContainerOuterClasses = cn(
    "w-full mt-1",
    isEvenRow ? "pl-[calc(1.625rem+theme(spacing.2))]" : "pl-[calc(1.625rem+theme(spacing.2))]", // Consistent padding based on icon+gap
    "sm:mt-0 sm:ml-[calc(1.25rem+0.375rem)] sm:pl-0" // For sm screens: margin for indent, reset padding
  );
   const nationInfoContainerInnerClasses = cn(
    "flex items-center gap-1.5"
  );


  return (
    <div className={cn(
      "flex flex-col sm:flex-row sm:items-center py-1.5 gap-1 sm:gap-0",
      isEvenRow && "bg-muted/50 rounded-md"
    )}>
      {/* Left side: Icon, Label */}
       <div className={cn("flex items-center gap-1.5 w-full sm:w-auto", isEvenRow ? "px-2" : "px-2")}>
        {IconToRender && <IconToRender className={cn("h-5 w-5 flex-shrink-0", iconColorClass)} />}
        <p className="text-sm text-foreground/90 min-w-[120px] shrink-0 font-medium">
          {label}
        </p>
      </div>

      {/* Center/Right Part: Nation Details and Points */}
      <div className={cn(
        "flex flex-col items-start sm:flex-row sm:items-center sm:justify-between flex-grow w-full",
        isEvenRow ? "sm:pl-2" : "sm:pl-2", // Add some space between label and nation details on sm+
        "pl-[calc(1.25rem+0.375rem)]" // Indent nation details on mobile
      )}>
        {/* Nation Details */}
        <div className="flex-grow min-w-0">
            {pickedNationId ? (
              <div className={nationInfoContainerInnerClasses}>
                {pickedNationCountryCode ? (
                <Image
                    src={`https://flagcdn.com/w20/${pickedNationCountryCode.toLowerCase()}.png`}
                    alt={pickedNationName || "Nazione"}
                    width={20}
                    height={13}
                    className="rounded-sm border border-border/30 object-contain flex-shrink-0 mt-0.5 sm:mt-0"
                    data-ai-hint={`${pickedNationName} flag icon`}
                />
                ) : (
                <div className="w-5 h-[13px] shrink-0 bg-muted/20 rounded-sm  mt-0.5 sm:mt-0"></div>
                )}
                 <div className="flex flex-col items-start flex-grow min-w-0">
                    <Link href={`/nations/${pickedNationId}`}
                        className="group text-xs hover:underline hover:text-primary flex items-center gap-1"
                        title={titleText}
                    >
                        <span className="font-medium">{pickedNationName}</span>
                        {!leaderboardLockedAdmin && actualCategoryRank && [1,2,3].includes(actualCategoryRank) && <MedalIcon rank={actualCategoryRank} className="ml-0.5" />}
                        {rankText && !leaderboardLockedAdmin && (
                           <span className={cn(
                            "text-xs ml-0.5",
                             actualCategoryRank && [1,2,3].includes(actualCategoryRank) ? 
                              (rankTextColorClass(actualCategoryRank))
                             : "text-muted-foreground/80"
                            )}>
                                {rankText}
                            </span>
                        )}
                    </Link>
                    {(!leaderboardLockedAdmin && (artistName || songTitle)) && (
                    <span className="text-[11px] text-muted-foreground/80 block">
                        {artistName}{artistName && songTitle && " - "}{songTitle}
                    </span>
                    )}
                </div>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">Nessuna selezione</span>
            )}
        </div>

        {/* Points Awarded Display */}
        {!leaderboardLockedAdmin && typeof pointsAwarded === 'number' && (
            <span className={cn(
            "text-xs shrink-0 sm:ml-2 mt-0.5 sm:mt-0 self-start sm:self-center", // Ensure alignment with first line of nation details on mobile
            pointsAwarded > 0 ? "font-semibold text-primary" :
            pointsAwarded === 0 ? "font-medium text-muted-foreground" :
            "font-semibold text-destructive"
            )}>
            {pointsAwarded > 0 ? `+${pointsAwarded}` : pointsAwarded}pt
            </span>
        )}
      </div>
    </div>
  );
});
CategoryPickDisplayDetailPodium.displayName = 'CategoryPickDisplayDetailPodium';


interface TeamListItemProps {
  team: TeamWithScore;
  allNations: Nation[];
  nationGlobalCategorizedScoresArray: [string, NationGlobalCategorizedScores][];
  isOwnTeamCard?: boolean;
  isLeaderboardPodiumDisplay?: boolean;
  disableEdit?: boolean;
  defaultOpenSections?: string[];
}

export function TeamListItem({
  team,
  allNations,
  nationGlobalCategorizedScoresArray,
  isOwnTeamCard = false,
  isLeaderboardPodiumDisplay = false,
  disableEdit = false,
  defaultOpenSections = [],
}: TeamListItemProps) {
  const { user } = useAuth();
  const [teamsLocked, setTeamsLocked] = useState<boolean | null>(null);
  const [leaderboardLockedAdmin, setLeaderboardLockedAdmin] = useState<boolean | null>(null);
  const [isLoadingAdminSettings, setIsLoadingAdminSettings] = useState(true);

  const nationGlobalCategorizedScoresMap = useMemo(() => {
    if (nationGlobalCategorizedScoresArray && nationGlobalCategorizedScoresArray.length > 0) {
        return new Map(nationGlobalCategorizedScoresArray);
    }
    return new Map<string, NationGlobalCategorizedScores>();
  }, [nationGlobalCategorizedScoresArray]);

  const treppoScoreCategoriesConfig = useMemo(() => [
    { teamPickNationId: team.bestTreppoScoreNationId, iconName: "Award", label: "Miglior TreppoScore", rankInfoKey: 'TreppoScore', categoryKey: 'overallAverageScore' as const },
    { teamPickNationId: team.bestSongNationId, iconName: "Music2", label: "Miglior Canzone", rankInfoKey: 'Music2', categoryKey: 'averageSongScore' as const },
    { teamPickNationId: team.bestPerformanceNationId, iconName: "Star", label: "Miglior Performance", rankInfoKey: 'Star', categoryKey: 'averagePerformanceScore' as const },
    { teamPickNationId: team.bestOutfitNationId, iconName: "Shirt", label: "Miglior Outfit", rankInfoKey: 'Shirt', categoryKey: 'averageOutfitScore' as const },
    { teamPickNationId: team.worstTreppoScoreNationId, iconName: "ThumbsDown", label: "Peggior TreppoScore", rankInfoKey: 'ThumbsDown', categoryKey: 'overallAverageScore' as const },
  ], [team.bestTreppoScoreNationId, team.bestSongNationId, team.bestPerformanceNationId, team.bestOutfitNationId, team.worstTreppoScoreNationId]);

  const [categoryRanksAndCorrectness, setCategoryRanksAndCorrectness] = useState<{
    [key: string]: { rank?: number | null; isCorrectPick?: boolean; categoryRankText?: string };
  }>({});

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
            artistName: nation?.artistName || undefined,
            songTitle: nation?.songTitle || undefined,
            actualRank: nation?.ranking,
            points: 0, 
        };
    }).sort((a, b) => (a.actualRank ?? Infinity) - (b.actualRank ?? Infinity));
  }, [team.primaSquadraDetails, team.founderChoices, allNations]);

  const treppoScorePicksForDisplay = useMemo(() => {
    if (!allNations || allNations.length === 0 || !nationGlobalCategorizedScoresMap || nationGlobalCategorizedScoresMap.size === 0) {
      return treppoScoreCategoriesConfig.map(pick => ({
        iconName: pick.iconName,
        label: pick.label,
        pickedNationId: pick.teamPickNationId || "",
        pickedNationName: pick.teamPickNationId ? (allNations.find(n => n.id === pick.teamPickNationId)?.name) : "Caricamento...",
        pickedNationCountryCode: pick.teamPickNationId ? (allNations.find(n => n.id === pick.teamPickNationId)?.countryCode) : undefined,
        artistName: pick.teamPickNationId ? (allNations.find(n => n.id === pick.teamPickNationId)?.artistName) : undefined,
        songTitle: pick.teamPickNationId ? (allNations.find(n => n.id === pick.teamPickNationId)?.songTitle) : undefined,
        actualCategoryRank: undefined,
        isCorrectPick: false,
        categoryRankText: undefined,
        pointsAwarded: team.categoryPicksDetails?.find(d => d.categoryName === pick.label)?.pointsAwarded ?? 0,
        pickedNationScoreInCategory: null,
      }));
    }

    return treppoScoreCategoriesConfig.map(pick => {
      const nation = pick.teamPickNationId ? allNations.find(n => n.id === pick.teamPickNationId) : undefined;
      const rankInfo = categoryRanksAndCorrectness[pick.rankInfoKey] || {};
      const originalDetail = team.categoryPicksDetails?.find(d => d.categoryName === pick.label);
      
      let scoreForCategory: number | null = null;
      if (nation) {
        const nationScores = nationGlobalCategorizedScoresMap.get(nation.id);
        if (nationScores && pick.categoryKey) {
            const scoreValue = nationScores[pick.categoryKey];
            if (typeof scoreValue === 'number') {
                scoreForCategory = scoreValue;
            }
        }
      }
      return {
        iconName: pick.iconName,
        label: pick.label,
        pickedNationId: pick.teamPickNationId || "",
        pickedNationName: nation?.name,
        pickedNationCountryCode: nation?.countryCode,
        artistName: nation?.artistName,
        songTitle: nation?.songTitle,
        actualCategoryRank: rankInfo.rank,
        isCorrectPick: rankInfo.isCorrectPick ?? false,
        categoryRankText: rankInfo.categoryRankText,
        pointsAwarded: originalDetail?.pointsAwarded ?? 0,
        pickedNationScoreInCategory: scoreForCategory,
      };
    });
  }, [allNations, nationGlobalCategorizedScoresMap, treppoScoreCategoriesConfig, categoryRanksAndCorrectness, team.categoryPicksDetails]);

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
        const getSortedList = (categoryKeyToUse: keyof Omit<NationGlobalCategorizedScores, 'voteCount'>, order: 'asc' | 'desc') => {
          return Array.from(nationGlobalCategorizedScoresMap.entries())
            .map(([nationId, scores]) => {
                const currentNation = allNations.find(n => n.id === nationId);
                return {
                id: nationId,
                name: currentNation?.name || 'Sconosciuto',
                score: scores[categoryKeyToUse]
              }
            })
            .filter(item => typeof item.score === 'number' && (nationGlobalCategorizedScoresMap.get(item.id)?.voteCount || 0) > 0)
            .sort((a, b) => {
              if (a.score === null && b.score === null) return 0;
              if (a.score === null) return 1; // Treat nulls as "larger" for sorting
              if (b.score === null) return -1;
              if (a.score === b.score) { // Tie-breaking by vote count, then name
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

        const getRankAndTextForCategoryPick = (nationId?: string, sortedList?: Array<{ id: string }>, categoryLabel?: string): { rank?: number | null; categoryRankText?: string } => {
            if (!nationId || !sortedList || sortedList.length === 0) return { rank: undefined, categoryRankText: undefined };
            const rankIndex = sortedList.findIndex(n => n.id === nationId);
            const rank = rankIndex !== -1 ? rankIndex + 1 : undefined;

            let suffix = "";
            if (categoryLabel === "Peggior TreppoScore") {
               suffix = " peggiore";
            } else if (categoryLabel !== "Miglior Canzone") {
                // suffix = " in cat."; // Removed based on user request
            }
            
            return { rank, categoryRankText: rank ? `(${rank}º${suffix})` : undefined };
        };

        const newRanks: typeof categoryRanksAndCorrectness = {};

        treppoScoreCategoriesConfig.forEach(config => {
          if (config.teamPickNationId) {
            const sortOrder = config.label === "Peggior TreppoScore" ? 'asc' : 'desc';
            const sortedList = getSortedList(config.categoryKey, sortOrder);
            const { rank, categoryRankText } = getRankAndTextForCategoryPick(config.teamPickNationId, sortedList, config.label);
            newRanks[config.rankInfoKey] = { rank, isCorrectPick: !leaderboardLockedAdmin && rank !== undefined && rank <= 3, categoryRankText };
          }
        });
        setCategoryRanksAndCorrectness(newRanks);
    } else {
         setCategoryRanksAndCorrectness({});
    }
  }, [nationGlobalCategorizedScoresMap, allNations, team, leaderboardLockedAdmin, treppoScoreCategoriesConfig]);


  const hasAnyTreppoScorePredictions = !!(team.bestTreppoScoreNationId || team.bestSongNationId || team.bestPerformanceNationId || team.bestOutfitNationId || team.worstTreppoScoreNationId);
  const hasAnyBonus = !!(team.bonusCampionePronostici || team.bonusGranCampionePronostici || team.bonusEnPleinTop5);

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

  const renderDetailedView = (isOwnTeamCard || isLeaderboardPodiumDisplay) && allNations && allNations.length > 0;

  const borderClass =
    isLeaderboardPodiumDisplay && !leaderboardLockedAdmin && team.rank && team.rank <=3 ?
      (team.rank === 1 ? "border-yellow-400 border-2 shadow-yellow-400/30" :
       team.rank === 2 ? "border-slate-400 border-2 shadow-slate-400/30" :
       "border-amber-500 border-2 shadow-amber-500/30")
    : "border-border";

  const PodiumHeader = () => (
    <>
      {/* Row 1: Team Name & Score */}
      <div className="flex items-baseline justify-between w-full">
        <div className="flex items-center gap-2 text-primary">
          <Users className="h-5 w-5 text-accent shrink-0" />
          <CardTitle className="text-xl">{team.name}</CardTitle>
        </div>
        {typeof team.score === 'number' && !leaderboardLockedAdmin && (
          <div className="text-2xl font-bold text-primary whitespace-nowrap">
            {team.score}pt
          </div>
        )}
      </div>
      {/* Row 2: Owner & Rank */}
      <div className="flex items-baseline justify-between w-full">
        {team.creatorDisplayName && !isOwnTeamCard && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <UserCircle className="h-3 w-3" />
                <span>{team.creatorDisplayName}</span>
            </div>
        )}
        {!leaderboardLockedAdmin && team.rank && (
          <div className={cn("font-semibold flex items-center", rankTextColorClass(team.rank), (team.creatorDisplayName && !isOwnTeamCard) ? "" : "ml-auto")}>
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
                (<UserCircle className="h-3 w-3" />{team.creatorDisplayName})
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end space-y-1 shrink-0">
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
        "pt-4 px-4 pb-3",
        isLeaderboardPodiumDisplay ? "space-y-0" : "space-y-1.5",
         isLeaderboardPodiumDisplay && "border-b border-border pb-3"
      )}>
        {isLeaderboardPodiumDisplay ? <PodiumHeader /> : <DefaultHeader />}
      </CardHeader>

      <CardContent className="flex-grow space-y-1 pt-3 pb-4 px-4">
        { renderDetailedView && allNations && allNations.length > 0 ? (
          <Accordion type="multiple" className="w-full" defaultValue={defaultOpenSections}>
            {/* Pronostici TreppoVision Section */}
            <AccordionItem value="treppovision">
              <AccordionTrigger className="py-2 hover:no-underline" asChild>
                 <div className="group flex justify-between items-center w-full py-2 font-medium cursor-pointer">
                    <div className="flex items-center gap-1">
                        <p className="text-lg font-bold text-primary">
                        Pronostici TreppoVision
                        </p>
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </div>
                    {!leaderboardLockedAdmin && typeof team.primaSquadraScore === 'number' && (
                        <span className={cn(
                        "text-sm font-semibold",
                        team.primaSquadraScore > 0 ? "text-primary" :
                        team.primaSquadraScore < 0 ? "text-destructive" :
                        "text-muted-foreground"
                        )}>
                        {team.primaSquadraScore >= 0 ? "+" : ""}{team.primaSquadraScore}pt
                        </span>
                    )}
                 </div>
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-2">
                <div className={cn("space-y-0.5", (hasAnyTreppoScorePredictions || hasAnyBonus) && "pb-3 border-b border-border")}>
                  { sortedFounderNationsDetails.map((detail, index) => (
                    <PrimaSquadraNationDisplayDetailPodium
                      key={`${team.id}-${detail.id}-prima-detail-${index}`}
                      detail={detail}
                      leaderboardLockedAdmin={leaderboardLockedAdmin}
                      isEvenRow={index % 2 !== 0}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Pronostici TreppoScore Section */}
            {(hasAnyTreppoScorePredictions) && (
              <AccordionItem value="trepposcore">
                 <AccordionTrigger className="py-2 hover:no-underline" asChild>
                    <div className="group flex justify-between items-center w-full py-2 font-medium cursor-pointer">
                        <div className="flex items-center gap-1">
                            <p className="text-lg font-bold text-primary">
                            Pronostici TreppoScore
                            </p>
                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </div>
                         {!leaderboardLockedAdmin && typeof team.treppoScoreCategoryPicksScore === 'number' && (
                            <span className={cn(
                            "text-sm font-semibold",
                            team.treppoScoreCategoryPicksScore > 0 ? "text-primary" :
                            team.treppoScoreCategoryPicksScore < 0 ? "text-destructive" : 
                            "text-muted-foreground"
                            )}>
                            {team.treppoScoreCategoryPicksScore >= 0 ? "+" : ""}{team.treppoScoreCategoryPicksScore}pt
                            </span>
                        )}
                    </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-2">
                  <div className={cn("space-y-0.5", hasAnyBonus && "pb-3 border-b border-border")}>
                    {treppoScorePicksForDisplay.map((detail, index) => {
                      if (!detail.pickedNationId && !isOwnTeamCard && !isLeaderboardPodiumDisplay) return null;
                      return (
                        <CategoryPickDisplayDetailPodium
                          key={`${team.id}-${detail.label}-detail-${index}`}
                          detail={detail}
                          leaderboardLockedAdmin={leaderboardLockedAdmin}
                          isEvenRow={index % 2 !== 0}
                        />
                      )
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Bonus Section */}
            {(!leaderboardLockedAdmin && hasAnyBonus) && (
               <AccordionItem value="bonus">
                <AccordionTrigger className="py-2 hover:no-underline" asChild>
                    <div className="group flex justify-between items-center w-full py-2 font-medium cursor-pointer">
                        <div className="flex items-center gap-1">
                            <p className="text-lg font-bold text-primary">
                            Bonus
                            </p>
                             <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </div>
                        {!leaderboardLockedAdmin && typeof team.bonusTotalScore === 'number' && (
                            <span className={cn(
                            "text-sm font-semibold",
                            team.bonusTotalScore > 0 ? "text-primary" : "text-muted-foreground"
                            )}>
                            {team.bonusTotalScore > 0 ? `+${team.bonusTotalScore}pt` : `${team.bonusTotalScore}pt`}
                            </span>
                        )}
                    </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-2">
                    <div className="space-y-0.5">
                        {team.bonusGranCampionePronostici && (
                        <div className={cn("flex items-center justify-between pl-2 py-1 text-xs")}>
                            <div className="flex items-center gap-1.5">
                            <Trophy className="w-5 h-5 text-yellow-500 shrink-0" />
                            <span className="font-medium text-foreground/90">Gran Campione di Pronostici</span>
                            </div>
                            <span className="font-semibold text-primary ml-auto">+30pt</span>
                        </div>
                        )}
                        {team.bonusCampionePronostici && !team.bonusGranCampionePronostici && (
                        <div className={cn("flex items-center justify-between pl-2 py-1 text-xs", team.bonusGranCampionePronostici && "bg-muted/50 rounded-md")}>
                            <div className="flex items-center gap-1.5">
                            <Trophy className="w-5 h-5 text-yellow-500 shrink-0" />
                            <span className="font-medium text-foreground/90">Campione di Pronostici</span>
                            </div>
                            <span className="font-semibold text-primary ml-auto">+5pt</span>
                        </div>
                        )}
                        {team.bonusEnPleinTop5 && (
                        <div className={cn("flex items-center justify-between pl-2 py-1 text-xs",
                                ( (team.bonusGranCampionePronostici) || (team.bonusCampionePronostici && !team.bonusGranCampionePronostici) )
                                && "bg-muted/50 rounded-md")}>
                            <div className="flex items-center gap-1.5">
                            <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                            <span className="font-medium text-foreground/90">En Plein Top 5</span>
                            </div>
                            <span className="font-semibold text-primary ml-auto">+30pt</span>
                        </div>
                        )}
                    </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        ) : (
          <div className="text-xs text-muted-foreground">
            {isOwnTeamCard ? "Completa la tua squadra e fai i tuoi pronostici finali!" : "Dettagli non disponibili."}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
