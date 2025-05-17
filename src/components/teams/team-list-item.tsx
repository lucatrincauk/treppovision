
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

const MedalIcon = React.memo(({ rank, className }: { rank?: number, className?: string }) => {
  if (rank === undefined || rank === null || rank === 0 || rank > 3) return null;
  let colorClass = "";
  if (rank === 1) colorClass = "text-yellow-400";
  else if (rank === 2) colorClass = "text-slate-400";
  else if (rank === 3) colorClass = "text-amber-500";
  return <Award className={cn("w-4 h-4 shrink-0", colorClass, className)} />;
});
MedalIcon.displayName = 'MedalIcon';

const rankTextColorClass = (rank?: number) => {
  if (rank === undefined || rank === null || rank === 0 || rank > 3) return "text-muted-foreground";
  if (rank === 1) return "text-yellow-400";
  if (rank === 2) return "text-slate-400";
  if (rank === 3) return "text-amber-500";
  return "text-muted-foreground";
};

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

interface PrimaSquadraNationDisplayDetailPodiumProps {
  detail: GlobalPrimaSquadraDetail;
  leaderboardLockedAdmin: boolean | null;
  isEvenRow?: boolean;
}
const PrimaSquadraNationDisplayDetailPodium = React.memo(({ detail, leaderboardLockedAdmin, isEvenRow }: PrimaSquadraNationDisplayDetailPodiumProps) => {
  const nationRank = detail.actualRank;
  const rankText = !leaderboardLockedAdmin && nationRank && nationRank > 0 ? `(${nationRank}º)` : "";
  const titleText = `${detail.name}${rankText ? ` ${rankText}` : ''}${detail.artistName ? ` - ${detail.artistName}` : ''}${detail.songTitle ? ` - ${detail.songTitle}` : ''}${!leaderboardLockedAdmin && typeof detail.points === 'number' ? ` Punti: ${detail.points}` : ''}`;

  return (
    <div className={cn(
      "w-full flex items-center", 
      isEvenRow ? "bg-muted/50 rounded-md" : "",
      "pl-2 py-1.5" 
    )}>
      <div className="flex items-center gap-1.5 mr-1.5 shrink-0">
        <BadgeCheck className="w-5 h-5 text-accent shrink-0" />
      </div>
      
      <div className="flex items-center gap-1.5">
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
                className="group text-sm hover:underline hover:text-primary flex items-center"
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
            {(!leaderboardLockedAdmin && (detail.artistName || detail.songTitle)) && (
                <span className="text-[11px] text-muted-foreground/80 block">
                    {detail.artistName}{detail.artistName && detail.songTitle && " - "}{detail.songTitle}
                </span>
            )}
        </div>
      </div>

      {!leaderboardLockedAdmin && typeof detail.points === 'number' && (
        <span className={cn(
          "text-sm ml-auto pl-1 shrink-0 self-center",
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
  detail: GlobalCategoryPickDetail;
  leaderboardLockedAdmin: boolean | null;
  isEvenRow?: boolean;
}
const CategoryPickDisplayDetailPodium = React.memo(({
  detail,
  leaderboardLockedAdmin,
  isEvenRow,
}: CategoryPickDisplayDetailPodiumProps) => {
  
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
  const iconColor = "text-accent";

  const actualCategoryRank = detail.actualCategoryRank;
  
  let rankSuffix = "";
    if (detail.categoryName === "Peggior TreppoScore") {
    rankSuffix = " peggiore";
  }

  const rankText = !leaderboardLockedAdmin && actualCategoryRank && actualCategoryRank > 0 
    ? `(${actualCategoryRank}°${rankSuffix})`
    : "";
  const titleText = `${detail.categoryName}: ${detail.pickedNationName || 'N/D'}${rankText} ${typeof detail.pointsAwarded === 'number' && !leaderboardLockedAdmin ? `Punti: ${detail.pointsAwarded}` : ''}`;
  
  return (
    <div className={cn(
      "w-full", 
      isEvenRow ? "bg-muted/50 rounded-md" : "",
      "pl-2 py-1" 
    )}>
      <div className="flex items-center w-full justify-between">
        <div className="flex items-center gap-1.5"> 
          <IconComponent className={cn("h-5 w-5 flex-shrink-0", iconColor)} />
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

      <div className={cn(
        "w-full mt-1", 
        "pl-[calc(1.25rem+0.375rem)]" // Indent to align with text after icon
      )}>
        {detail.pickedNationId ? (
          <div className="flex items-center gap-1.5">
            {detail.pickedNationCountryCode ? (
            <Image
                src={`https://flagcdn.com/w20/${detail.pickedNationCountryCode.toLowerCase()}.png`}
                alt={detail.pickedNationName || "Nazione"}
                width={20}
                height={13}
                className="rounded-sm border border-border/30 object-contain flex-shrink-0"
                data-ai-hint={`${detail.pickedNationName} flag icon`}
            />
            ) : (
            <div className="w-5 h-[13px] shrink-0 bg-muted/20 rounded-sm"></div>
            )}
            <div className="flex flex-col items-start flex-grow min-w-0">
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
                {(!leaderboardLockedAdmin && (detail.artistName || detail.songTitle)) && (
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

  const nationGlobalCategorizedScoresMap = useMemo(() => {
    if (nationGlobalCategorizedScoresArray && nationGlobalCategorizedScoresArray.length > 0) {
      return new Map(nationGlobalCategorizedScoresArray);
    }
    return new Map<string, NationGlobalCategorizedScores>();
  }, [nationGlobalCategorizedScoresArray]);

  const treppoScoreCategoriesConfig = useMemo(() => [
    { teamPickNationId: team.eurovisionWinnerPickNationId, iconName: "EurovisionWinner", label: "Vincitore Eurovision", rankInfoKey: 'EurovisionWinner', rankSourceField: 'ranking' as keyof Nation, sortOrder: 'asc' },
    { teamPickNationId: team.juryWinnerPickNationId, iconName: "JuryWinner", label: "Vincitore Giuria", rankInfoKey: 'JuryWinner', rankSourceField: 'juryRank' as keyof Nation, sortOrder: 'asc' },
    { teamPickNationId: team.televoteWinnerPickNationId, iconName: "TelevoteWinner", label: "Vincitore Televoto", rankInfoKey: 'TelevoteWinner', rankSourceField: 'televoteRank' as keyof Nation, sortOrder: 'asc' },
    { teamPickNationId: team.bestTreppoScoreNationId, iconName: "Award", label: "Miglior TreppoScore", rankInfoKey: 'TreppoScore', categoryKey: 'overallAverageScore' as keyof Omit<NationGlobalCategorizedScores, 'voteCount'>, sortOrder: 'desc' },
    { teamPickNationId: team.bestSongNationId, iconName: "Music2", label: "Miglior Canzone", rankInfoKey: 'Music2', categoryKey: 'averageSongScore' as keyof Omit<NationGlobalCategorizedScores, 'voteCount'>, sortOrder: 'desc' },
    { teamPickNationId: team.bestPerformanceNationId, iconName: "Star", label: "Miglior Performance", rankInfoKey: 'Star', categoryKey: 'averagePerformanceScore' as keyof Omit<NationGlobalCategorizedScores, 'voteCount'>, sortOrder: 'desc' },
    { teamPickNationId: team.bestOutfitNationId, iconName: "Shirt", label: "Miglior Outfit", rankInfoKey: 'Shirt', categoryKey: 'averageOutfitScore' as keyof Omit<NationGlobalCategorizedScores, 'voteCount'>, sortOrder: 'desc' },
    { teamPickNationId: team.worstTreppoScoreNationId, iconName: "ThumbsDown", label: "Peggior TreppoScore", rankInfoKey: 'ThumbsDown', categoryKey: 'overallAverageScore' as keyof Omit<NationGlobalCategorizedScores, 'voteCount'>, sortOrder: 'asc' },
  ], [team.eurovisionWinnerPickNationId, team.juryWinnerPickNationId, team.televoteWinnerPickNationId, team.bestTreppoScoreNationId, team.bestSongNationId, team.bestPerformanceNationId, team.bestOutfitNationId, team.worstTreppoScoreNationId]);

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
            artistName: nation?.artistName,
            songTitle: nation?.songTitle,
            actualRank: nation?.ranking,
            points: 0, 
        };
    }).sort((a, b) => (a.actualRank ?? Infinity) - (b.actualRank ?? Infinity));
  }, [team.primaSquadraDetails, team.founderChoices, allNations]);
  
  const treppoScorePicksForDisplay = useMemo(() => {
    if (!allNations || allNations.length === 0) return [];
    return treppoScoreCategoriesConfig.map(pick => {
      const nation = pick.teamPickNationId && allNations ? allNations.find(n => n.id === pick.teamPickNationId) : undefined;
      const rankInfo = categoryRanksAndCorrectness[pick.rankInfoKey] || {};
      const originalDetail = team.categoryPicksDetails?.find(d => d.categoryName === pick.label);
      
      let scoreForCategory: number | null = null;
      if (nation && nationGlobalCategorizedScoresMap && nationGlobalCategorizedScoresMap.size > 0) {
        const nationScores = nationGlobalCategorizedScoresMap.get(nation.id);
        if (nationScores && pick.categoryKey) {
            const scoreValue = nationScores[pick.categoryKey];
            if (typeof scoreValue === 'number') {
                scoreForCategory = scoreValue;
            }
        } else if (pick.rankSourceField && nation) { // For official rank based categories
             const rankValue = nation[pick.rankSourceField];
             if (typeof rankValue === 'number') {
                 scoreForCategory = rankValue;
             }
        }
      }
      return {
        categoryName: pick.label,
        pickedNationId: pick.teamPickNationId || "",
        pickedNationName: nation?.name,
        pickedNationCountryCode: nation?.countryCode,
        artistName: nation?.artistName,
        songTitle: nation?.songTitle,
        actualCategoryRank: rankInfo.rank,
        pointsAwarded: originalDetail?.pointsAwarded ?? 0,
        iconName: pick.iconName,
        pickedNationScoreInCategory: scoreForCategory,
      };
    });
  }, [treppoScoreCategoriesConfig, categoryRanksAndCorrectness, allNations, nationGlobalCategorizedScoresMap, team.categoryPicksDetails]);


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
  
  useEffect(() => {
    if (
        (!nationGlobalCategorizedScoresMap || nationGlobalCategorizedScoresMap.size === 0) &&
        !treppoScoreCategoriesConfig.some(c => c.rankSourceField) 
      ) {
        setCategoryRanksAndCorrectness({});
        return;
      }
    if (!allNations || allNations.length === 0) {
        setCategoryRanksAndCorrectness({});
        return;
    }

    const getSortedList = (categoryKeyOrRankField: keyof Omit<NationGlobalCategorizedScores, 'voteCount'> | keyof Nation, type: 'score' | 'rank', order: 'asc' | 'desc') => {
      if (type === 'score') {
          if (!nationGlobalCategorizedScoresMap || nationGlobalCategorizedScoresMap.size === 0) return [];
          return Array.from(nationGlobalCategorizedScoresMap.entries())
            .map(([nationId, scores]) => {
                const currentNation = allNations.find(n => n.id === nationId);
                return {
                  id: nationId,
                  name: currentNation?.name || 'Sconosciuto',
                  score: scores[categoryKeyOrRankField as keyof Omit<NationGlobalCategorizedScores, 'voteCount'>]
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
        } else { // type === 'rank'
            return [...allNations]
                .filter(nation => typeof nation[categoryKeyOrRankField as keyof Nation] === 'number' && (nation[categoryKeyOrRankField as keyof Nation] as number) > 0)
                .sort((a, b) => {
                    const rankA = a[categoryKeyOrRankField as keyof Nation] as number ?? Infinity;
                    const rankB = b[categoryKeyOrRankField as keyof Nation] as number ?? Infinity;
                    return order === 'asc' ? rankA - rankB : rankB - rankA;
                })
                .map(n => ({ id: n.id, name: n.name, score: n[categoryKeyOrRankField as keyof Nation] as number | null }));
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

  }, [nationGlobalCategorizedScoresMap, allNations, team, leaderboardLockedAdmin, treppoScoreCategoriesConfig]); 

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
  
  const renderDetailedView = (isOwnTeamCard || isLeaderboardPodiumDisplay) && allNations && allNations.length > 0 && (team.primaSquadraDetails || team.categoryPicksDetails) ;

  const borderClass =
    isLeaderboardPodiumDisplay && !leaderboardLockedAdmin && team.rank && team.rank <=3 ?
      (team.rank === 1 ? "border-yellow-400 border-2 shadow-yellow-400/30" :
       team.rank === 2 ? "border-slate-400 border-2 shadow-slate-400/30" :
       "border-amber-500 border-2 shadow-amber-500/30")
    : "border-border";
    
  const hasAnyTreppoScorePredictions = !!(team.eurovisionWinnerPickNationId || team.juryWinnerPickNationId || team.televoteWinnerPickNationId || team.bestTreppoScoreNationId || team.bestSongNationId || team.bestPerformanceNationId || team.bestOutfitNationId || team.worstTreppoScoreNationId);
  const hasAnyBonus = !!(team.bonusCampionePronostici || team.bonusGranCampionePronostici || team.bonusEnPleinTop5);


  const PodiumHeader = () => (
    <>
       <div className="flex items-baseline justify-between w-full">
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
      <div className="flex items-baseline justify-between w-full">
        {team.creatorDisplayName && !isOwnTeamCard && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <UserCircle className="h-3 w-3" />
            <span>{team.creatorDisplayName}</span>
          </div>
        )}
        {!leaderboardLockedAdmin && team.rank && (
          <div className={cn("font-semibold flex items-center", rankTextColorClass(team.rank), "ml-auto")}>
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
        isLeaderboardPodiumDisplay ? "space-y-0 border-b border-border" : "space-y-1.5"
      )}>
        {isLeaderboardPodiumDisplay ? <PodiumHeader /> : <DefaultHeader />}
      </CardHeader>

      <CardContent className="flex-grow space-y-1 pt-3 pb-4 px-4">
        { renderDetailedView && allNations && allNations.length > 0 ? (
          <Accordion type="multiple" className="w-full" defaultValue={defaultOpenSections}>
            <AccordionItem value="treppovision">
              <AccordionTrigger asChild className="hover:no-underline">
                 <div className="group flex justify-between items-center w-full py-2 font-medium cursor-pointer">
                    <div className="flex items-center gap-1">
                        <p className="text-lg font-bold text-primary">
                        Pronostici TreppoVision
                        </p>
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </div>
                    {!leaderboardLockedAdmin && typeof team.primaSquadraScore === 'number' && (
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
              <AccordionContent className="pt-1 pb-3">
                <div className="space-y-0.5">
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

            {(hasAnyTreppoScorePredictions) && (
              <AccordionItem value="trepposcore">
                 <AccordionTrigger asChild className="hover:no-underline">
                    <div className="group flex justify-between items-center w-full py-2 font-medium cursor-pointer">
                        <div className="flex items-center gap-1">
                            <p className="text-lg font-bold text-primary">
                            Pronostici TreppoScore
                            </p>
                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </div>
                         {!leaderboardLockedAdmin && typeof team.treppoScoreCategoryPicksScore === 'number' && (
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
                <AccordionContent className="pt-1 pb-3">
                  <div className="space-y-0.5">
                    {treppoScorePicksForDisplay.map((detail, index) => {
                      if (!detail.pickedNationId && !isOwnTeamCard && !isLeaderboardPodiumDisplay) return null; 
                      return (
                        <CategoryPickDisplayDetailPodium
                          key={`${team.id}-${detail.categoryName}-detail-${index}`}
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
                        {!leaderboardLockedAdmin && typeof team.bonusTotalScore === 'number' && (
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
                      ].filter(Boolean).map((bonusItem, index, arr) => (
                        bonusItem && (
                          <div key={bonusItem.label} className={cn("flex items-center justify-between px-2 py-1 text-xs", (index % 2 !== 0) && "bg-muted/50 rounded-md")}>
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
            {isOwnTeamCard ? "Completa la tua squadra e fai i tuoi pronostici finali!" : "Dettagli non disponibili."}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
