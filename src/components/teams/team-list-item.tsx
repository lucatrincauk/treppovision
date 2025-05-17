
"use client";

import type { TeamWithScore, Nation, NationGlobalCategorizedScores, GlobalPrimaSquadraDetail, GlobalCategoryPickDetail } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCircle, Lock, BadgeCheck, Award, ListOrdered, Loader2, Info, CheckCircle, Trophy, ChevronDown, Music2, Star, Shirt, ThumbsDown, Edit3, Edit } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { getTeamsLockedStatus } from "@/lib/actions/team-actions";
import { getLeaderboardLockedStatus } from "@/lib/actions/admin-actions";
import React, { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

// Helper function to get ordinal rank text for podium
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
  if (rank === undefined || rank === null || rank === 0 || rank > 3) return "text-muted-foreground";
  if (rank === 1) return "text-yellow-400";
  if (rank === 2) return "text-slate-400";
  if (rank === 3) return "text-amber-500";
  return "text-muted-foreground";
};

// MedalIcon defined at module scope
const MedalIcon = React.memo(({ rank, className }: { rank?: number, className?: string }) => {
  if (rank === undefined || rank === null || rank === 0 || rank > 3) return null;
  let colorClass = "";
  if (rank === 1) colorClass = "text-yellow-400";
  else if (rank === 2) colorClass = "text-slate-400";
  else if (rank === 3) colorClass = "text-amber-500";
  return <Award className={cn("w-4 h-4 shrink-0", colorClass, className)} />;
});
MedalIcon.displayName = 'MedalIcon';


// Sub-component for displaying a single nation choice in "Pronostici TreppoVision"
interface PrimaSquadraNationDisplayDetailPodiumProps {
  detail: GlobalPrimaSquadraDetail;
  leaderboardLockedAdmin: boolean | null;
  isEvenRow?: boolean;
}
const PrimaSquadraNationDisplayDetailPodium = React.memo(({ detail, leaderboardLockedAdmin, isEvenRow }: PrimaSquadraNationDisplayDetailPodiumProps) => {
  const nationRank = detail.actualRank;
  const rankText = !leaderboardLockedAdmin && nationRank && nationRank > 0 ? `(${nationRank}°)` : "";
  const titleText = `${detail.name}${rankText ? ` ${rankText}` : ''}${detail.artistName ? ` - ${detail.artistName}` : ''}${detail.songTitle ? ` - ${detail.songTitle}` : ''}${!leaderboardLockedAdmin && typeof detail.points === 'number' ? ` Punti: ${detail.points}` : ''}`;

  return (
    <div className={cn(
      "w-full flex items-start justify-between", // Changed to items-start for top alignment of icon
      isEvenRow ? "bg-muted/50 rounded-md" : "",
      "pl-2 py-1"
    )}>
      <div className="flex items-center gap-1.5"> {/* Main left content: Icon + (Flag + Text Block) */}
        <BadgeCheck className="w-5 h-5 text-accent shrink-0" /> {/* Icon will be centered with the Flag + Text block */}
        
        <div className="flex items-center gap-1.5"> {/* Flag + Text Block */}
          {detail.countryCode ? (
            <Image
                src={`https://flagcdn.com/w20/${detail.countryCode.toLowerCase()}.png`}
                alt={detail.name || "Nazione"}
                width={20}
                height={13}
                className="rounded-sm border border-border/30 object-contain shrink-0"
                data-ai-hint={`${detail.name} flag`}
            />
          ) : (
            <div className="w-5 h-[13px] shrink-0 bg-muted/20 rounded-sm"></div>
          )}
          <div className="flex flex-col items-start"> {/* Text Block */}
            <Link
                href={`/nations/${detail.id}`}
                className="group text-sm hover:underline hover:text-primary flex items-center gap-1"
                title={titleText}
            >
                <span className="font-medium">{detail.name}</span>
                {!leaderboardLockedAdmin && nationRank && [1,2,3].includes(nationRank) && <MedalIcon rank={nationRank} className="ml-0.5" />}
                {rankText && !leaderboardLockedAdmin && (
                    <span className={cn(
                        "text-xs ml-0.5",
                        nationRank && [1,2,3].includes(nationRank) ? 
                        (rankTextColorClass(nationRank))
                        : "text-muted-foreground/80"
                    )}>
                        {rankText}
                    </span>
                )}
            </Link>
            {!leaderboardLockedAdmin && (detail.artistName || detail.songTitle) && (
                <span className="text-[11px] text-muted-foreground/80 block"> 
                    {detail.artistName}{detail.artistName && detail.songTitle && " - "}{detail.songTitle}
                </span>
            )}
          </div>
        </div>
      </div>

      {!leaderboardLockedAdmin && typeof detail.points === 'number' && (
        <span className={cn(
          "text-sm ml-auto pl-1 shrink-0 self-center", // self-center for vertical alignment with icon+text block
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
  detail: GlobalCategoryPickDetail & { actualCategoryRank?: number | null; iconName: string; };
  leaderboardLockedAdmin: boolean | null;
  isEvenRow?: boolean;
  allNations: Nation[]; 
}

const CategoryPickDisplayDetailPodium = React.memo(({ detail, leaderboardLockedAdmin, isEvenRow, allNations }: CategoryPickDisplayDetailPodiumProps) => {
  let IconComponent: React.ElementType = Info;
  switch (detail.iconName) {
    case "Award": IconComponent = Award; break;
    case "Music2": IconComponent = Music2; break;
    case "Star": IconComponent = Star; break;
    case "Shirt": IconComponent = Shirt; break;
    case "ThumbsDown": IconComponent = ThumbsDown; break;
    case "EurovisionWinner": IconComponent = Award; break;
    case "JuryWinner": IconComponent = Award; break;
    case "TelevoteWinner": IconComponent = Award; break;
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
    
  const titleText = `${detail.categoryName}: ${detail.pickedNationName || 'N/D'}${rankText} ${typeof detail.pointsAwarded === 'number' && !leaderboardLockedAdmin ? `Punti: ${detail.pointsAwarded}` : ''}`;
  
  const mainContainerClasses = cn(
    "w-full",
    isEvenRow ? "bg-muted/50 rounded-md" : "",
    "pl-2 py-1" // Consistent padding for all rows
  );

  const labelAndIconContainerClasses = "flex items-center justify-between w-full"; // label and points on one line
  const nationInfoContainerOuterClasses = "mt-1 ml-[calc(1.25rem+0.375rem)]"; // Indent for nation details

  return (
    <div className={mainContainerClasses}>
      {/* Label and Icon Part */}
      <div className={labelAndIconContainerClasses}>
        <div className="flex items-center gap-1.5"> {/* Label and icon */}
            <IconComponent className={cn("h-5 w-5 flex-shrink-0", iconColorClass)} />
            <p className="text-sm font-medium text-foreground/90 min-w-[120px] shrink-0">
                {detail.categoryName}
            </p>
        </div>
        {typeof detail.pointsAwarded === 'number' && !leaderboardLockedAdmin && (
            <span
            className={cn(
                "text-sm font-semibold ml-auto",
                detail.pointsAwarded > 0 ? "text-primary" :
                detail.pointsAwarded === 0 ? "text-muted-foreground" : 
                "text-destructive"
            )}
            >
            {detail.pointsAwarded > 0 ? `+${detail.pointsAwarded}` : detail.pointsAwarded}pt
            </span>
        )}
      </div>

      {/* Nation Details Part */}
      <div className={nationInfoContainerOuterClasses}>
        {detail.pickedNationId ? (
           <div className="flex items-center gap-1.5"> {/* Container for flag and text block */}
            {detail.pickedNationCountryCode ? (
            <Image
                src={`https://flagcdn.com/w20/${detail.pickedNationCountryCode.toLowerCase()}.png`}
                alt={detail.pickedNationName || "Nazione"}
                width={20}
                height={13}
                className="rounded-sm border border-border/30 object-contain shrink-0"
                data-ai-hint={`${detail.pickedNationName} flag`}
            />
            ) : (
            <div className="w-5 h-[13px] shrink-0 bg-muted/20 rounded-sm"></div>
            )}
            <div className="flex flex-col items-start flex-grow min-w-0"> {/* Text block */}
                <Link href={`/nations/${detail.pickedNationId}`}
                    className="group text-sm hover:underline hover:text-primary flex items-center gap-0.5"
                    title={titleText}
                >
                    <span className="font-medium">{detail.pickedNationName}</span>
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
                {!leaderboardLockedAdmin && (detail.artistName || detail.songTitle) && (
                <span className="text-[11px] text-muted-foreground/80 block">
                    {detail.artistName}{detail.artistName && detail.songTitle && " - "}{detail.songTitle}
                </span>
                )}
            </div>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Nessuna selezione</span>
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
    { teamPickNationId: team.bestTreppoScoreNationId, label: "Miglior TreppoScore", rankInfoKey: 'TreppoScore', categoryKey: 'overallAverageScore' as keyof NationGlobalCategorizedScores, sortOrder: 'desc', iconName: "Award" },
    { teamPickNationId: team.bestSongNationId, label: "Miglior Canzone", rankInfoKey: 'Music2', categoryKey: 'averageSongScore' as keyof NationGlobalCategorizedScores, sortOrder: 'desc', iconName: "Music2" },
    { teamPickNationId: team.bestPerformanceNationId, label: "Miglior Performance", rankInfoKey: 'Star', categoryKey: 'averagePerformanceScore' as keyof NationGlobalCategorizedScores, sortOrder: 'desc', iconName: "Star" },
    { teamPickNationId: team.bestOutfitNationId, label: "Miglior Outfit", rankInfoKey: 'Shirt', categoryKey: 'averageOutfitScore' as keyof NationGlobalCategorizedScores, sortOrder: 'desc', iconName: "Shirt" },
    { teamPickNationId: team.worstTreppoScoreNationId, label: "Peggior TreppoScore", rankInfoKey: 'ThumbsDown', categoryKey: 'overallAverageScore' as keyof NationGlobalCategorizedScores, sortOrder: 'asc', iconName: "ThumbsDown" },
    { teamPickNationId: team.eurovisionWinnerPickNationId, label: "Vincitore Eurovision", rankInfoKey: 'EurovisionWinner', rankSourceField: 'ranking' as keyof Nation, sortOrder: 'asc', iconName: "EurovisionWinner" },
    { teamPickNationId: team.juryWinnerPickNationId, label: "Vincitore Giuria", rankInfoKey: 'JuryWinner', rankSourceField: 'juryRank' as keyof Nation, sortOrder: 'asc', iconName: "JuryWinner" },
    { teamPickNationId: team.televoteWinnerPickNationId, label: "Vincitore Televoto", rankInfoKey: 'TelevoteWinner', rankSourceField: 'televoteRank' as keyof Nation, sortOrder: 'asc', iconName: "TelevoteWinner" },
  ], [team.bestTreppoScoreNationId, team.bestSongNationId, team.bestPerformanceNationId, team.bestOutfitNationId, team.worstTreppoScoreNationId, team.eurovisionWinnerPickNationId, team.juryWinnerPickNationId, team.televoteWinnerPickNationId]);
  
  const sortedFounderNationsDetails = useMemo(() => {
    if (!allNations || allNations.length === 0) return [];
    if (team.primaSquadraDetails && team.primaSquadraDetails.length > 0) {
      return [...team.primaSquadraDetails].sort((a, b) => (a.actualRank ?? Infinity) - (b.actualRank ?? Infinity));
    }
    // Fallback if primaSquadraDetails is not pre-calculated (shouldn't happen for detailed views)
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

  const renderDetailedView = isOwnTeamCard || isLeaderboardPodiumDisplay;

  const eurovisionPicksForDisplay = useMemo(() => {
    if (!renderDetailedView) return [];
    // Find the corresponding details from team.categoryPicksDetails
    return treppoScoreCategoriesConfig
      .filter(p => ["Vincitore Eurovision", "Vincitore Giuria", "Vincitore Televoto"].includes(p.label))
      .map(pickConfig => {
        const detail = team.categoryPicksDetails?.find(d => d.categoryName === pickConfig.label);
        const nation = detail?.pickedNationId && allNations ? allNations.find(n => n.id === detail.pickedNationId) : undefined;
        return {
          categoryName: pickConfig.label,
          pickedNationId: detail?.pickedNationId || "",
          pickedNationName: nation?.name || detail?.pickedNationName,
          pickedNationCountryCode: nation?.countryCode || detail?.pickedNationCountryCode,
          artistName: nation?.artistName || detail?.artistName,
          songTitle: nation?.songTitle || detail?.songTitle,
          actualCategoryRank: detail?.actualCategoryRank,
          pointsAwarded: detail?.pointsAwarded ?? 0,
          iconName: pickConfig.iconName,
          pickedNationScoreInCategory: detail?.pickedNationScoreInCategory
        };
      });
  }, [renderDetailedView, treppoScoreCategoriesConfig, team.categoryPicksDetails, allNations]);

  const userVotePicksForDisplay = useMemo(() => {
    if (!renderDetailedView) return [];
    return treppoScoreCategoriesConfig
      .filter(p => !["Vincitore Eurovision", "Vincitore Giuria", "Vincitore Televoto"].includes(p.label))
      .map(pickConfig => {
        const detail = team.categoryPicksDetails?.find(d => d.categoryName === pickConfig.label);
        const nation = detail?.pickedNationId && allNations ? allNations.find(n => n.id === detail.pickedNationId) : undefined;
        return {
          categoryName: pickConfig.label,
          pickedNationId: detail?.pickedNationId || "",
          pickedNationName: nation?.name || detail?.pickedNationName,
          pickedNationCountryCode: nation?.countryCode || detail?.pickedNationCountryCode,
          artistName: nation?.artistName || detail?.artistName,
          songTitle: nation?.songTitle || detail?.songTitle,
          actualCategoryRank: detail?.actualCategoryRank,
          pointsAwarded: detail?.pointsAwarded ?? 0,
          iconName: pickConfig.iconName,
          pickedNationScoreInCategory: detail?.pickedNationScoreInCategory
        };
      });
  }, [renderDetailedView, treppoScoreCategoriesConfig, team.categoryPicksDetails, allNations]);

  useEffect(() => {
    setIsLoadingAdminSettings(true);
    Promise.all([
      getTeamsLockedStatus(),
      getLeaderboardLockedStatus()
    ]).then(([teamsLock, lbLock]) => {
      setTeamsLocked(teamsLock);
      setLeaderboardLockedAdmin(lbLock);
    }).catch(error => {
      console.error("Failed to fetch admin settings for TeamListItem:", error);
      setTeamsLocked(false);
      setLeaderboardLockedAdmin(false);
    }).finally(() => {
      setIsLoadingAdminSettings(false);
    });
  }, []);
  
  // This useEffect calculates ranks and correctness for TreppoScore type picks
  useEffect(() => {
    if (!renderDetailedView || (!nationGlobalCategorizedScoresMap || nationGlobalCategorizedScoresMap.size === 0) && (!allNations || allNations.length === 0)) {
      setCategoryRanksAndCorrectness({});
      return;
    }
  
    const getSortedList = (
      categoryKeyOrRankField: keyof NationGlobalCategorizedScores | keyof Nation,
      type: 'score' | 'rank',
      order: 'asc' | 'desc'
    ): Array<{ id: string; name: string; score: number | null }> => {
       if (type === 'score') {
        if (!nationGlobalCategorizedScoresMap || nationGlobalCategorizedScoresMap.size === 0) return [];
        return Array.from(nationGlobalCategorizedScoresMap.entries())
          .map(([nationId, scores]) => {
            const currentNation = allNations.find(n => n.id === nationId);
            return {
              id: nationId,
              name: currentNation?.name || 'Sconosciuto',
              score: scores[categoryKeyOrRankField as keyof NationGlobalCategorizedScores]
            };
          })
          .filter(item => typeof item.score === 'number' && (nationGlobalCategorizedScoresMap.get(item.id)?.voteCount || 0) > 0)
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
              return (allNations.find(n => n.id === a.id)?.name || 'Z').localeCompare(allNations.find(n => n.id === b.id)?.name || 'Z');
            }
            return order === 'desc' ? (b.score as number) - (a.score as number) : (a.score as number) - (b.score as number);
          });
      } else { 
        if (!allNations || allNations.length === 0) return [];
        return [...allNations]
          .filter(nation => {
            const rankVal = (nation as any)[categoryKeyOrRankField as keyof Nation];
            return typeof rankVal === 'number' && rankVal > 0;
          })
          .sort((a, b) => {
            const rankA = (a as any)[categoryKeyOrRankField as keyof Nation] as number ?? Infinity;
            const rankB = (b as any)[categoryKeyOrRankField as keyof Nation] as number ?? Infinity;
            return order === 'asc' ? rankA - rankB : rankB - rankA;
          })
          .map(n => ({ id: n.id, name: n.name, score: (n as any)[categoryKeyOrRankField as keyof Nation] as number | null }));
      }
    };
    
    const getRankAndText = (nationId?: string, sortedList?: Array<{ id: string }>, categoryLabel?: string): { rank?: number | null; categoryRankText?: string } => {
        if (!nationId || !sortedList || sortedList.length === 0) return { rank: undefined, categoryRankText: undefined };
        const rankIndex = sortedList.findIndex(n => n.id === nationId);
        const rank = rankIndex !== -1 ? rankIndex + 1 : undefined;

        let suffix = "";
        if (categoryLabel === "Peggior TreppoScore") {
          suffix = " peggiore";
        }
        
        return { rank, categoryRankText: rank ? `(${rank}°${suffix})` : undefined };
    };

    const newRanks: typeof categoryRanksAndCorrectness = {};

    treppoScoreCategoriesConfig.forEach(config => {
      if (config.teamPickNationId) {
        let sortedList: Array<{ id: string; name: string; score: number | null }> = [];
        if (config.categoryKey) { 
            sortedList = getSortedList(config.categoryKey, 'score', config.sortOrder);
        } else if (config.rankSourceField) { 
            sortedList = getSortedList(config.rankSourceField, 'rank', config.sortOrder);
        }

        const { rank, categoryRankText } = getRankAndText(config.teamPickNationId, sortedList, config.label);
        newRanks[config.rankInfoKey] = { rank, isCorrectPick: !leaderboardLockedAdmin && rank !== undefined && rank <= 3, categoryRankText };
      }
    });
    setCategoryRanksAndCorrectness(newRanks);

  }, [nationGlobalCategorizedScoresMap, allNations, team, leaderboardLockedAdmin, treppoScoreCategoriesConfig, renderDetailedView]); 

  if (isLoadingAdminSettings || !allNations ) { 
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
    
  const hasAnyTreppoScorePredictions = team.bestTreppoScoreNationId || team.bestSongNationId || team.bestPerformanceNationId || team.bestOutfitNationId || team.worstTreppoScoreNationId;
  const hasAnyEurovisionPredictions = team.eurovisionWinnerPickNationId || team.juryWinnerPickNationId || team.televoteWinnerPickNationId;
  const hasAnyBonus = !!(team.bonusCampionePronostici || team.bonusGranCampionePronostici || team.bonusEnPleinTop5);

  const PodiumHeader = () => (
    <>
      <div className="flex items-baseline justify-between w-full"> {/* Team Name & Score */}
        <CardTitle className="text-xl text-primary flex items-center gap-2">
          <Users className="h-5 w-5 text-accent shrink-0" />
          {team.name}
        </CardTitle>
        {typeof team.score === 'number' && !leaderboardLockedAdmin && (
          <div className="text-2xl font-bold text-primary whitespace-nowrap">
            {team.score}pt
          </div>
        )}
      </div>
      <div className="flex items-baseline justify-between w-full"> {/* Team Owner & Rank */}
        {team.creatorDisplayName && !isOwnTeamCard && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <UserCircle className="h-3 w-3" />
            <span>{team.creatorDisplayName}</span>
          </div>
        )}
        {!leaderboardLockedAdmin && team.rank && (
          <div className={cn("font-semibold flex items-center", rankTextColorClass(team.rank), (!team.creatorDisplayName || isOwnTeamCard) && "ml-auto")}>
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
         {typeof team.score === 'number' && !leaderboardLockedAdmin && (
            <div className="text-lg font-bold text-primary">
                {team.score}pt
            </div>
        )}
    </div>
  );


  return (
    <Card className={cn(
      "flex flex-col h-full shadow-lg hover:shadow-primary/20 transition-shadow duration-300",
      borderClass
    )}>
      <CardHeader className={cn(
        "pt-4 px-4",
        isLeaderboardPodiumDisplay && "space-y-0 pb-3 border-b border-border",
        !isLeaderboardPodiumDisplay && "pb-3"
      )}>
        {isLeaderboardPodiumDisplay ? <PodiumHeader /> : <DefaultHeader />}
      </CardHeader>

      <CardContent className="flex-grow space-y-1 pt-3 pb-4 px-4">
        { renderDetailedView && allNations && allNations.length > 0 ? (
          <Accordion type="multiple" className="w-full" defaultValue={defaultOpenSections}>
            {/* Pronostici TreppoVision Section */}
            <AccordionItem value="treppovision" className={cn((!hasAnyEurovisionPredictions && !hasAnyTreppoScorePredictions && !hasAnyBonus) && "border-b-0")}>
              <AccordionTrigger asChild className="hover:no-underline">
                 <div className="group flex justify-between items-center w-full py-2 font-medium cursor-pointer">
                    <div className="flex items-center gap-1">
                        <p className="text-lg font-bold text-primary">
                          Pronostici TreppoVision
                        </p>
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </div>
                    {typeof team.primaSquadraScore === 'number' && !leaderboardLockedAdmin && (
                        <span className={cn(
                        "text-sm font-semibold ml-auto",
                        team.primaSquadraScore > 0 ? "text-primary" :
                        team.primaSquadraScore < 0 ? "text-destructive" :
                        "text-muted-foreground"
                        )}>
                        {team.primaSquadraScore >= 0 ? "+" : ""}{team.primaSquadraScore}pt
                        </span>
                    )}
                 </div>
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-0">
                <div className={cn("space-y-0.5", (hasAnyEurovisionPredictions || hasAnyTreppoScorePredictions || hasAnyBonus) && "pb-3 border-b border-border")}>
                  {sortedFounderNationsDetails.map((detail, index) => (
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
             
            {/* Pronostici Eurovision Section */}
            {hasAnyEurovisionPredictions && (
                <AccordionItem value="pronosticiEurovision" className={cn((!hasAnyTreppoScorePredictions && !hasAnyBonus) && "border-b-0")}>
                    <AccordionTrigger asChild className="hover:no-underline">
                        <div className="group flex justify-between items-center w-full py-2 font-medium cursor-pointer">
                            <div className="flex items-center gap-1">
                                <p className="text-lg font-bold text-primary">
                                Pronostici Eurovision
                                </p>
                                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                            </div>
                            {typeof team.eurovisionPicksScore === 'number' && !leaderboardLockedAdmin && (
                                <span className={cn(
                                "text-sm font-semibold ml-auto",
                                team.eurovisionPicksScore > 0 ? "text-primary" :
                                team.eurovisionPicksScore === 0 ? "text-muted-foreground" : 
                                "text-destructive" 
                                )}>
                                {team.eurovisionPicksScore >= 0 ? "+" : ""}{team.eurovisionPicksScore}pt
                                </span>
                            )}
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-1 pb-0">
                        <div className={cn("space-y-0.5", (hasAnyTreppoScorePredictions || hasAnyBonus) && "pb-3 border-b border-border")}>
                        {eurovisionPicksForDisplay.map((detail, index) => {
                            if (!detail) return null;
                            return (
                            <CategoryPickDisplayDetailPodium
                                key={`${team.id}-${detail.categoryName}-detail-${index}`}
                                detail={detail}
                                leaderboardLockedAdmin={leaderboardLockedAdmin}
                                isEvenRow={index % 2 !== 0}
                                allNations={allNations}
                            />
                            );
                        })}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            )}

            {/* Pronostici TreppoScore Section */}
            {hasAnyTreppoScorePredictions && (
              <AccordionItem value="trepposcore" className={cn((!hasAnyBonus) && "border-b-0")}>
                 <AccordionTrigger asChild className="hover:no-underline">
                    <div className="group flex justify-between items-center w-full py-2 font-medium cursor-pointer">
                        <div className="flex items-center gap-1">
                            <p className="text-lg font-bold text-primary">
                              Pronostici TreppoScore
                            </p>
                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </div>
                         {typeof team.treppoScoreCategoryPicksScore === 'number' && !leaderboardLockedAdmin && (
                            <span className={cn(
                            "text-sm font-semibold ml-auto",
                            team.treppoScoreCategoryPicksScore > 0 ? "text-primary" :
                            team.treppoScoreCategoryPicksScore === 0 ? "text-muted-foreground" : 
                            "text-destructive"
                            )}>
                            {team.treppoScoreCategoryPicksScore >= 0 ? "+" : ""}{team.treppoScoreCategoryPicksScore}pt
                            </span>
                        )}
                    </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-0">
                  <div className={cn("space-y-0.5", hasAnyBonus && "pb-3 border-b border-border")}>
                    {userVotePicksForDisplay.map((detail, index) => {
                         if (!detail) return null;
                        return (
                        <CategoryPickDisplayDetailPodium
                            key={`${team.id}-${detail.categoryName}-detail-${index}`}
                            detail={detail}
                            leaderboardLockedAdmin={leaderboardLockedAdmin}
                            isEvenRow={index % 2 !== 0}
                            allNations={allNations}
                        />
                        );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Bonus Section */}
            {(!leaderboardLockedAdmin && hasAnyBonus) && (
               <AccordionItem value="bonus" className="border-b-0">
                <AccordionTrigger asChild className="hover:no-underline">
                    <div className="group flex justify-between items-center w-full py-2 font-medium cursor-pointer">
                        <div className="flex items-center gap-1">
                            <p className="text-lg font-bold text-primary">
                              Bonus
                            </p>
                             <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </div>
                        {typeof team.bonusTotalScore === 'number' && !leaderboardLockedAdmin && (
                            <span className={cn(
                            "text-sm font-semibold ml-auto",
                            team.bonusTotalScore > 0 ? "text-primary" : "text-muted-foreground"
                            )}>
                            {team.bonusTotalScore > 0 ? `+${team.bonusTotalScore}` : `${team.bonusTotalScore}`}pt
                            </span>
                        )}
                    </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-0">
                    <div className="space-y-0.5">
                      {[
                        team.bonusGranCampionePronostici && { label: "Gran Campione di Pronostici", points: 30, Icon: Trophy, iconColor: "text-yellow-500" },
                        team.bonusCampionePronostici && !team.bonusGranCampionePronostici && { label: "Campione di Pronostici", points: 5, Icon: Trophy, iconColor: "text-yellow-500" },
                        team.bonusEnPleinTop5 && { label: "En Plein Top 5", points: 30, Icon: CheckCircle, iconColor: "text-green-500" },
                      ].filter(Boolean).map((bonusItem, index) => (
                        bonusItem && (
                          <div key={bonusItem.label} className={cn(
                            "flex items-center justify-between w-full pl-2 py-1 text-xs", 
                            (index % 2 !== 0) && "bg-muted/50 rounded-md"
                          )}>
                            <div className="flex items-center gap-1.5">
                              <bonusItem.Icon className={cn("w-5 h-5 shrink-0", bonusItem.iconColor)} />
                              <span className="font-medium text-foreground/90">{bonusItem.label}</span>
                            </div>
                            <span className="font-semibold text-primary ml-auto">+{bonusItem.points}pt</span>
                          </div>
                        )
                      ))}
                    </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        ) : (
          <div className="text-xs text-muted-foreground">
            Dettagli non disponibili o squadra non ancora completata.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
