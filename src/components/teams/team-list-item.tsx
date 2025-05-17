
"use client";

import type { TeamWithScore, Nation, NationGlobalCategorizedScores, GlobalPrimaSquadraDetail as GlobalPrimaSquadraDetailType, GlobalCategoryPickDetail as GlobalCategoryPickDetailTypeRaw } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCircle, Music2, Star, ThumbsDown, Shirt, Lock, BadgeCheck, Award, ListOrdered, Loader2, Info, CheckCircle, Trophy, ChevronDown, Edit } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { getTeamsLockedStatus } from "@/lib/actions/team-actions";
import { getLeaderboardLockedStatus } from "@/lib/actions/admin-actions";
import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

interface LocalCategoryPickDetail extends GlobalCategoryPickDetailTypeRaw {
  Icon: React.ElementType;
  label: string;
  teamPickNationId: string;
  categoryKey: keyof Omit<NationGlobalCategorizedScores, 'voteCount'>; // Only scoring keys
  isCorrectPick?: boolean;
  actualCategoryRank?: number | null;
  categoryRankText?: string;
  pointsAwarded: number;
  pickedNationName?: string;
  pickedNationCountryCode?: string;
  artistName?: string;
  songTitle?: string;
  pickedNationScoreInCategory?: number | null;
}

const MedalIcon = React.memo(({ rank, className }: { rank?: number, className?: string }) => {
  if (rank === undefined || rank === null || rank === 0 || rank > 3) return null;
  let colorClass = "";
  if (rank === 1) colorClass = "text-yellow-400";
  else if (rank === 2) colorClass = "text-slate-400";
  else if (rank === 3) colorClass = "text-amber-500";
  return <Award className={cn("w-3.5 h-3.5 shrink-0", colorClass, className)} />;
});
MedalIcon.displayName = 'MedalIconLocal';

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

interface PrimaSquadraNationDisplayDetailPodiumProps {
  detail: GlobalPrimaSquadraDetailType;
  leaderboardLockedAdmin: boolean | null;
  isEvenRow?: boolean;
}

const PrimaSquadraNationDisplayDetailPodium = React.memo(({
  detail,
  leaderboardLockedAdmin,
  isEvenRow,
}: PrimaSquadraNationDisplayDetailPodiumProps) => {
  const nationRank = detail.actualRank;
  let rankText = "";
  if (!leaderboardLockedAdmin && nationRank && nationRank > 0) {
    rankText = `(${nationRank}°)`;
  }
  const titleText = `${detail.name}${rankText ? ` ${rankText}` : ''}${detail.artistName ? ` - ${detail.artistName}` : ''}${detail.songTitle ? ` - ${detail.songTitle}` : ''}${!leaderboardLockedAdmin && typeof detail.points === 'number' ? ` Punti: ${detail.points}`: ''}`;

  return (
     <div className={cn("flex items-center py-1", isEvenRow ? "bg-muted/50 rounded-md px-2" : "px-2")}>
        <div className="flex items-center gap-1.5 mr-1.5 shrink-0">
            <BadgeCheck className="w-5 h-5 text-accent shrink-0" />
        </div>
         <div className="flex items-center gap-1.5 flex-grow min-w-0">
            {detail.countryCode ? (
                <Image
                    src={`https://flagcdn.com/w20/${detail.countryCode.toLowerCase()}.png`}
                    alt={detail.name}
                    width={20}
                    height={13}
                    className="rounded-sm border border-border/30 object-contain shrink-0"
                    data-ai-hint={`${detail.name} flag`}
                />
            ) : (
                <div className="w-5 h-[13px] shrink-0 bg-muted/20 rounded-sm"></div>
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
                        nationRank === 1 ? "text-yellow-400" :
                        nationRank === 2 ? "text-slate-400" :
                        nationRank === 3 ? "text-amber-500" :
                        "text-muted-foreground/80"
                    )}>
                        {rankText}
                    </span>
                  )}
              </Link>
              {(!leaderboardLockedAdmin && (detail.artistName || detail.songTitle)) && (
                  <span className="text-xs text-muted-foreground/80 block">
                    {detail.artistName}{detail.artistName && detail.songTitle && " - "}{detail.songTitle}
                  </span>
              )}
            </div>
        </div>
       {!leaderboardLockedAdmin && typeof detail.points === 'number' && (
            <span className={cn(
                "text-xs ml-auto pl-1 shrink-0 self-center", 
                detail.points > 0 ? "font-semibold text-primary" : detail.points < 0 ? "font-semibold text-destructive" : "font-medium text-muted-foreground"
            )}>
                {detail.points > 0 ? `+${detail.points}` : (detail.points === 0 ? "0pt" : `${detail.points}pt`)}
            </span>
        )}
    </div>
  );
});
PrimaSquadraNationDisplayDetailPodium.displayName = 'PrimaSquadraNationDisplayDetailPodium';


interface CategoryPickDisplayDetailPodiumProps {
  detail: LocalCategoryPickDetail;
  leaderboardLockedAdmin: boolean | null;
  isEvenRow?: boolean;
  allNations: Nation[]; // Added for artist/song lookup
}

const CategoryPickDisplayDetailPodium = React.memo(({
  detail,
  leaderboardLockedAdmin,
  isEvenRow,
  allNations,
}: CategoryPickDisplayDetailPodiumProps) => {
  const { Icon, label, pickedNationId, actualCategoryRank, pointsAwarded, isCorrectPick } = detail;
  
  const pickedNationFullDetails = pickedNationId && allNations ? allNations.find(n => n.id === pickedNationId) : undefined;
  const pickedNationName = pickedNationFullDetails?.name;
  const pickedNationCountryCode = pickedNationFullDetails?.countryCode;
  const artistName = pickedNationFullDetails?.artistName;
  const songTitle = pickedNationFullDetails?.songTitle;

  const iconColorClass = isCorrectPick && !leaderboardLockedAdmin ? "text-accent" : "text-accent";
  
  let rankTextSuffix = "";
  if (label === "Peggior TreppoScore") { // Corrected from "Peggior Canzone"
    rankSuffix = " peggiore";
  }

  const rankText = !leaderboardLockedAdmin && actualCategoryRank && actualCategoryRank > 0 
    ? `(${actualCategoryRank}°${rankSuffix})`
    : "";

  return (
    <div className={cn("px-2 py-1.5", isEvenRow && "bg-muted/50 rounded-md")}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5">
            <Icon className={cn("h-5 w-5 flex-shrink-0", iconColorClass)} />
            <span className="text-sm text-foreground/90 min-w-[120px] shrink-0 font-medium">
              {label}
            </span>
          </div>
            {typeof pointsAwarded === 'number' && !leaderboardLockedAdmin && (
            <span
                className={cn(
                "text-xs ml-auto", 
                pointsAwarded > 0 ? "font-semibold text-primary" :
                pointsAwarded === 0 ? "font-medium text-muted-foreground" : 
                "font-semibold text-destructive"
                )}
            >
                {pointsAwarded > 0 ? `+${pointsAwarded}pt` : (pointsAwarded === 0 ? "0pt" : `${pointsAwarded}pt`)}
            </span>
            )}
        </div>
      
        <div className={cn(
            "w-full mt-1",
            "pl-[calc(1.25rem+0.375rem)]" // Equivalent to pl-[1.625rem]
          )}>
            <div className="flex items-center gap-1.5 flex-grow min-w-0">
                {pickedNationCountryCode ? (
                <Image
                    src={`https://flagcdn.com/w20/${pickedNationCountryCode.toLowerCase()}.png`}
                    alt={pickedNationName || "Nazione"}
                    width={20}
                    height={13}
                    className="rounded-sm border border-border/30 object-contain flex-shrink-0"
                    data-ai-hint={`${pickedNationName} flag icon`}
                />
                ) : (
                <div className="w-5 h-[13px] flex-shrink-0 bg-muted/20 rounded-sm"></div>
                )}
                <div className="flex flex-col items-start flex-grow min-w-0"> 
                    <Link href={`/nations/${pickedNationId || '#'}`}
                        className={cn("group text-xs hover:underline hover:text-primary flex items-center gap-0.5", !pickedNationId && "pointer-events-none")}
                    >
                        <span className="font-medium">
                          {pickedNationName || "Nessuna selezione"}
                        </span>
                        {!leaderboardLockedAdmin && actualCategoryRank && [1,2,3].includes(actualCategoryRank) && <MedalIcon rank={actualCategoryRank} />}
                        {rankText && !leaderboardLockedAdmin && (
                            <span className={cn(
                                "text-xs ml-0.5", // Base style
                                // Color based on rank
                                detail.actualCategoryRank === 1 ? "text-yellow-400" :
                                detail.actualCategoryRank === 2 ? "text-slate-400" :
                                detail.actualCategoryRank === 3 ? "text-amber-500" :
                                "text-muted-foreground/80"
                            )}>
                                {rankText}
                            </span>
                        )}
                    </Link>
                    {(!leaderboardLockedAdmin && (artistName || songTitle)) && (
                    <span className="text-xs text-muted-foreground/80 block">
                        {artistName}{artistName && songTitle && " - "}{songTitle}
                    </span>
                    )}
                </div>
            </div>
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

  const sortedFounderNationsDetails = useMemo(() => {
    if (!allNations || allNations.length === 0) return [];
    if (team.primaSquadraDetails && team.primaSquadraDetails.length > 0) {
      return [...team.primaSquadraDetails].sort((a, b) => (a.actualRank ?? Infinity) - (b.actualRank ?? Infinity));
    }
    // Fallback if primaSquadraDetails is not provided (e.g. on /teams page for other teams before full processing)
    return (team.founderChoices || []).map(id => {
        const nation = allNations.find(n => n.id === id);
        return {
            id,
            name: nation?.name || 'Sconosciuto',
            countryCode: nation?.countryCode || 'xx',
            artistName: nation?.artistName || undefined,
            songTitle: nation?.songTitle || undefined,
            actualRank: nation?.ranking,
            points: 0, // Points are calculated by parent for leaderboard/detail
        };
    }).sort((a, b) => (a.actualRank ?? Infinity) - (b.actualRank ?? Infinity));
  }, [team.primaSquadraDetails, team.founderChoices, allNations]);


  const treppoScoreCategoriesConfig = useMemo(() => [
    { teamPickNationId: team.bestTreppoScoreNationId, Icon: Award, label: "Miglior TreppoScore", rankInfoKey: 'TreppoScore', categoryKey: 'overallAverageScore' as keyof Omit<NationGlobalCategorizedScores, 'voteCount'> },
    { teamPickNationId: team.bestSongNationId, Icon: Music2, label: "Miglior Canzone", rankInfoKey: 'Music2', categoryKey: 'averageSongScore' as keyof Omit<NationGlobalCategorizedScores, 'voteCount'> },
    { teamPickNationId: team.bestPerformanceNationId, Icon: Star, label: "Miglior Performance", rankInfoKey: 'Star', categoryKey: 'averagePerformanceScore' as keyof Omit<NationGlobalCategorizedScores, 'voteCount'> },
    { teamPickNationId: team.bestOutfitNationId, Icon: Shirt, label: "Miglior Outfit", rankInfoKey: 'Shirt', categoryKey: 'averageOutfitScore' as keyof Omit<NationGlobalCategorizedScores, 'voteCount'> },
    { teamPickNationId: team.worstTreppoScoreNationId, Icon: ThumbsDown, label: "Peggior TreppoScore", rankInfoKey: 'ThumbsDown', categoryKey: 'overallAverageScore' as keyof Omit<NationGlobalCategorizedScores, 'voteCount'> },
  ], [team.bestTreppoScoreNationId, team.bestSongNationId, team.bestPerformanceNationId, team.bestOutfitNationId, team.worstTreppoScoreNationId]);


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
          if (!allNations || allNations.length === 0) return [];
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

        const getRankAndText = (nationId?: string, sortedList?: Array<{ id: string }>, categoryLabel?: string): { rank?: number | null; categoryRankText?: string } => {
            if (!nationId || !sortedList || sortedList.length === 0) return { rank: undefined, categoryRankText: undefined };
            const rankIndex = sortedList.findIndex(n => n.id === nationId);
            const rank = rankIndex !== -1 ? rankIndex + 1 : undefined;

            let rankSuffix = "";
             if (categoryLabel === "Peggior TreppoScore") {
               rankSuffix = " peggiore";
            } else if (categoryLabel === "Miglior Canzone" || categoryLabel === "Miglior Performance" || categoryLabel === "Miglior Outfit" || categoryLabel === "Miglior TreppoScore"){
               // No suffix for these
            }

            return { rank, categoryRankText: rank ? `(${rank}°${rankSuffix})` : undefined };
        };

        const newRanks: typeof categoryRanksAndCorrectness = {};

        treppoScoreCategoriesConfig.forEach(config => {
          if (config.teamPickNationId) {
            const sortOrder = config.label === "Peggior TreppoScore" ? 'asc' : 'desc';
            const sortedList = getSortedList(config.categoryKey, sortOrder);
            const { rank, categoryRankText } = getRankAndText(config.teamPickNationId, sortedList, config.label);
            newRanks[config.rankInfoKey] = { rank, isCorrectPick: !leaderboardLockedAdmin && rank !== undefined && rank <= 3, categoryRankText };
          }
        });
        setCategoryRanksAndCorrectness(newRanks);
    } else {
         setCategoryRanksAndCorrectness({});
    }
  }, [nationGlobalCategorizedScoresMap, allNations, team, leaderboardLockedAdmin, treppoScoreCategoriesConfig]);


  const treppoScorePicksForDisplay = useMemo(() => {
    if (!allNations || allNations.length === 0) return treppoScoreCategoriesConfig.map(pick => ({
      ...pick,
      pickedNationId: pick.teamPickNationId || "",
      actualCategoryRank: undefined,
      isCorrectPick: false,
      categoryRankText: undefined,
      pointsAwarded: 0,
      pickedNationName: "N/D",
      pickedNationCountryCode: "xx",
      artistName: undefined,
      songTitle: undefined,
      pickedNationScoreInCategory: null,
    }));

    return treppoScoreCategoriesConfig.map(pick => {
      const nation = pick.teamPickNationId ? allNations.find(n => n.id === pick.teamPickNationId) : undefined;
      const rankInfo = categoryRanksAndCorrectness[pick.rankInfoKey] || {};
      const originalDetail = team.categoryPicksDetails?.find(d => d.categoryName === pick.label);
      
      let scoreForCategory: number | null = null;
      if (nation && nationGlobalCategorizedScoresMap.size > 0) {
        const nationScores = nationGlobalCategorizedScoresMap.get(nation.id);
        if (nationScores && pick.categoryKey) {
            const scoreValue = nationScores[pick.categoryKey];
            if (typeof scoreValue === 'number') {
                scoreForCategory = scoreValue;
            }
        }
      }

      return {
        ...pick,
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
  }, [treppoScoreCategoriesConfig, categoryRanksAndCorrectness, allNations, nationGlobalCategorizedScoresMap, team.categoryPicksDetails]);

  if (isLoadingAdminSettings || (!allNations && isLeaderboardPodiumDisplay)) { // Ensure allNations is loaded for podium display
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

  const renderDetailedView = isOwnTeamCard || isLeaderboardPodiumDisplay;
  const hasAnyTreppoScorePredictions = !!(team.bestTreppoScoreNationId || team.bestSongNationId || team.bestPerformanceNationId || team.bestOutfitNationId || team.worstTreppoScoreNationId);
  const hasAnyBonus = team.bonusCampionePronostici || team.bonusGranCampionePronostici || team.bonusEnPleinTop5;


  const PodiumHeader = () => (
    <>
      <div className="flex items-end justify-between w-full"> {/* Team Name & Score Row */}
        <div className="flex items-baseline gap-2 text-primary">
            <Users className="h-5 w-5 text-accent shrink-0 self-center" />
            <CardTitle className="text-xl">{team.name}</CardTitle>
        </div>
        {typeof team.score === 'number' && !leaderboardLockedAdmin && (
          <div className="text-2xl font-bold text-primary whitespace-nowrap">
            {team.score}pt
          </div>
        )}
      </div>
      <div className="flex items-baseline justify-between w-full"> {/* Team Owner & Rank Row */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {team.creatorDisplayName && !isOwnTeamCard && (
                <>
                    <UserCircle className="h-3 w-3" />
                    <span>{team.creatorDisplayName}</span>
                </>
            )}
          </div>
          {!leaderboardLockedAdmin && team.rank && (
              <div className={cn("font-semibold flex items-center", rankTextColorClass(team.rank))}>
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
        "pt-4 px-4 pb-3 space-y-0",
        isLeaderboardPodiumDisplay && "pb-3 border-b border-border" 
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
                  {typeof team.primaSquadraScore === 'number' && !leaderboardLockedAdmin && (
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
                <div className="space-y-1">
                  { (sortedFounderNationsDetails).map((detail, index) => (
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
                    {typeof team.treppoScoreCategoryPicksScore === 'number' && !leaderboardLockedAdmin && (
                        <span className={cn(
                        "text-sm font-semibold",
                        team.treppoScoreCategoryPicksScore > 0 ? "text-primary" :
                        team.treppoScoreCategoryPicksScore < 0 ? "text-destructive" : // Should not happen for these
                        "text-muted-foreground"
                        )}>
                        {team.treppoScoreCategoryPicksScore >= 0 ? "+" : ""}{team.treppoScoreCategoryPicksScore}pt
                        </span>
                    )}
                    </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-2">
                  <div className="space-y-1">
                    {treppoScorePicksForDisplay.map((detailConfig, index) => {
                      if (!detailConfig.pickedNationId && !isOwnTeamCard && !isLeaderboardPodiumDisplay && !renderDetailedView) return null;
                      return (
                        <CategoryPickDisplayDetailPodium
                          key={`${team.id}-${detailConfig.label}-detail-${index}`}
                          detail={detailConfig}
                          leaderboardLockedAdmin={leaderboardLockedAdmin}
                          isEvenRow={index % 2 !== 0}
                          allNations={allNations}
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
                    {typeof team.bonusTotalScore === 'number' && !leaderboardLockedAdmin && (
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
                        <div className={cn("flex items-center justify-between px-2 py-1 text-xs", false && "bg-muted/50 rounded-md")}>
                            <div className="flex items-center gap-1.5">
                            <Trophy className="w-5 h-5 text-yellow-500 shrink-0" />
                            <span className="font-medium text-foreground/90">Gran Campione di Pronostici</span>
                            </div>
                            <span className="font-semibold text-primary ml-auto">+30pt</span>
                        </div>
                        )}
                        {team.bonusCampionePronostici && !team.bonusGranCampionePronostici && (
                        <div className={cn("flex items-center justify-between px-2 py-1 text-xs", (team.bonusGranCampionePronostici) && "bg-muted/50 rounded-md")}>
                            <div className="flex items-center gap-1.5">
                            <Trophy className="w-5 h-5 text-yellow-500 shrink-0" />
                            <span className="font-medium text-foreground/90">Campione di Pronostici</span>
                            </div>
                            <span className="font-semibold text-primary ml-auto">+5pt</span>
                        </div>
                        )}
                        {team.bonusEnPleinTop5 && (
                        <div className={cn("flex items-center justify-between px-2 py-1 text-xs",
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
          <div className="text-xs text-muted-foreground">Dettagli non disponibili o Nazioni non caricate.</div>
        )}
      </CardContent>
    </Card>
  );
}
