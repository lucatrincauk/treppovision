
"use client";

import type { Team, Nation, NationGlobalCategorizedScores, GlobalPrimaSquadraDetail, GlobalCategoryPickDetail as GlobalCategoryPickDetailType } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCircle, Edit, Music2, Star, ThumbsDown, Shirt, Lock, BadgeCheck, Award, ListOrdered, Loader2, TrendingUp, Info, ListChecks } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { getTeamsLockedStatus } from "@/lib/actions/team-actions";
import { getLeaderboardLockedStatus } from "@/lib/actions/admin-actions";
import React, { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const getRankText = (rank?: number): string => {
  if (rank === undefined || rank === null || rank === 0) return "";
  switch (rank) {
    case 1: return "Primo Posto";
    case 2: return "Secondo Posto";
    case 3: return "Terzo Posto";
    case 4: return "Quarto Posto";
    case 5: return "Quinto Posto";
    case 6: return "Sesto Posto";
    case 7: return "Settimo Posto";
    case 8: return "Ottavo Posto";
    case 9: return "Nono Posto";
    case 10: return "Decimo Posto";
    default: return `${rank}° Posto`;
  }
};

const MedalIcon = ({ rank, className }: { rank?: number, className?: string }) => {
  if (rank === undefined || rank === null || rank === 0 || rank > 3) return null;
  let colorClass = "";
  if (rank === 1) colorClass = "text-yellow-400";
  else if (rank === 2) colorClass = "text-slate-400";
  else if (rank === 3) colorClass = "text-amber-500";
  return <Award className={cn("w-3.5 h-3.5 shrink-0", colorClass, className)} />;
};

const SelectedNationDisplay = React.memo(({
  nation,
  IconComponent,
  label,
  isCorrectPick,
  categoryRank,
  leaderboardLocked,
  actualEurovisionRank,
  isEvenRow,
  globalScoreForCategory,
}: {
  nation?: Nation;
  IconComponent: React.ElementType;
  label?: string;
  isCorrectPick?: boolean;
  categoryRank?: number | null;
  leaderboardLocked: boolean | null;
  actualEurovisionRank?: number | null;
  isEvenRow?: boolean;
  globalScoreForCategory?: number | null;
}) => {
  const iconColor = isCorrectPick && !leaderboardLocked ? "text-accent" : "text-accent";

  const NationInfoContent = ({ nationData, rankToShow, rankSuffix, euroRankToShow, globalScore }: {
    nationData?: Nation;
    rankToShow?: number | null;
    rankSuffix?: string;
    euroRankToShow?: number | null;
    globalScore?: number | null;
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
    const currentDisplayRank = label ? rankToShow : euroRankToShow;

    if (!leaderboardLocked && currentDisplayRank && currentDisplayRank > 0) {
      rankTextToDisplay = `(${currentDisplayRank}°${label && rankSuffix ? `${rankSuffix}` : ''})`.trim();
    }
    
    const titleText = `${nationData.name}${rankTextToDisplay ? ` ${rankTextToDisplay}` : ''}${nationData.artistName ? ` - ${nationData.artistName}` : ''}${nationData.songTitle ? ` - ${nationData.songTitle}` : ''}${globalScore !== null && globalScore !== undefined ? ` Punteggio Globale: ${globalScore.toFixed(2)}`: ''}`;
    
    const nameAndRank = (
      <>
        <span className="font-medium">{nationData.name}</span>
        {!leaderboardLocked && <MedalIcon rank={currentDisplayRank} className="ml-0.5" />}
        {rankTextToDisplay && (
          <span className="text-muted-foreground text-xs ml-0.5">{rankTextToDisplay}</span>
        )}
      </>
    );

    return (
      <div className="flex items-center gap-1.5">
        {nationData.countryCode ? (
          <Image
            src={`https://flagcdn.com/w20/${nationData.countryCode.toLowerCase()}.png`}
            alt={nationData.name || "Bandiera Nazione"}
            width={20}
            height={13}
            className="rounded-sm border border-border/30 object-contain shrink-0"
            data-ai-hint={`${nationData.name} flag icon`}
          />
        ) : (
          <div className="w-5 h-[13px] bg-muted/20 rounded-sm shrink-0"></div>
        )}
        <div className="flex flex-col items-start">
            <Link
                href={`/nations/${nationData.id}`}
                className="group text-xs hover:underline hover:text-primary flex items-center gap-1"
                title={titleText}
            >
              {nameAndRank}
            </Link>
            {(nationData.artistName || nationData.songTitle) && (
              <span className="text-xs text-muted-foreground/80 block">
                  {nationData.artistName}{nationData.artistName && nationData.songTitle && " - "}{nationData.songTitle}
              </span>
            )}
            {label && globalScore !== null && globalScore !== undefined && !leaderboardLocked && (
                 <span className="text-xs text-primary font-medium mt-0.5">
                    Punteggio Globale: {globalScore.toFixed(2)}
                 </span>
            )}
        </div>
      </div>
    );
  };
  
  let rankSuffixForDisplay = " in cat.";
  if (label === "Miglior Canzone") rankSuffixForDisplay = "";
  else if (label === "Peggior Canzone") rankSuffixForDisplay = " peggiore";

  const mainContainerClasses = cn(
    "px-2",
    isEvenRow && "bg-muted/50 rounded-md",
    label && "flex flex-col items-start sm:flex-row sm:items-center gap-1 py-1.5", 
    !label && "flex items-center gap-1.5 py-1" 
  );

  const labelAndIconContainerClasses = cn(
    "flex items-center gap-1.5",
    label && "w-full sm:w-auto" 
  );
  
  const nationInfoContainerOuterClasses = cn(
    "w-full",
    label && "mt-1 sm:mt-0",
    label && "pl-4 sm:ml-[calc(1.25rem+0.375rem)] sm:pl-0" 
  );

  return (
    <div className={mainContainerClasses}>
      <div className={labelAndIconContainerClasses}>
        <IconComponent className={cn("h-5 w-5 shrink-0", iconColor)} />
        {label && <span className="text-xs text-foreground/90 min-w-[120px] shrink-0 font-medium">{label}</span>}
      </div>
      
      <div className={label ? nationInfoContainerOuterClasses : "flex-grow"}>
         <NationInfoContent
            nationData={nation}
            rankToShow={categoryRank}
            rankSuffix={rankSuffixForDisplay}
            euroRankToShow={actualEurovisionRank}
            globalScore={globalScoreForCategory}
          />
      </div>
    </div>
  );
});
SelectedNationDisplay.displayName = 'SelectedNationDisplay';

interface GlobalPrimaSquadraDetailPodium extends GlobalPrimaSquadraDetail {
   artistName?: string;
   songTitle?: string;
}

const PrimaSquadraNationDisplayDetailPodium = React.memo(({
  detail,
  allNations,
  leaderboardLocked,
  isEvenRow,
}: {
  detail: GlobalPrimaSquadraDetailPodium;
  allNations: Nation[];
  leaderboardLocked: boolean | null;
  isEvenRow?: boolean;
}) => {
  const nationData = allNations.find(n => n.id === detail.id);
  const rankText = !leaderboardLocked && detail.actualRank && detail.actualRank > 0
    ? `(${detail.actualRank}°)`
    : "";
  const titleText = `${detail.name}${rankText ? ` ${rankText}` : ''}${detail.artistName ? ` - ${detail.artistName}` : ''}${detail.songTitle ? ` - ${detail.songTitle}` : ''}${!leaderboardLocked && typeof detail.points === 'number' ? ` Punti: ${detail.points}`: ''}`;

  return (
    <div className={cn(
      "px-2 py-1 flex items-start", 
      isEvenRow && "bg-muted/50 rounded-md"
    )}>
      <div className="flex items-center gap-1.5"> 
        <BadgeCheck className="w-5 h-5 text-accent shrink-0" />
         <div className="flex items-center gap-1.5 ml-1.5">
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
            <div className="flex flex-col items-start"> 
                <Link
                    href={`/nations/${detail.id}`}
                    className="group text-xs hover:underline hover:text-primary flex items-center gap-1"
                    title={titleText}
                >
                    <span className="font-medium">{detail.name}</span>
                    {!leaderboardLocked && <MedalIcon rank={detail.actualRank} className="ml-0.5" />}
                    {rankText && (
                    <span className="text-muted-foreground text-xs ml-0.5">{rankText}</span>
                    )}
                </Link>
                {(detail.artistName || detail.songTitle) && (
                    <span className="text-xs text-muted-foreground/80 block">
                    {detail.artistName}{detail.artistName && detail.songTitle && " - "}{detail.songTitle}
                    </span>
                )}
            </div>
        </div>
      </div>
      {!leaderboardLocked && typeof detail.points === 'number' && (
        <span className={cn(
          "text-xs ml-auto pl-1",
          detail.points > 0 ? "font-semibold text-primary" : detail.points < 0 ? "font-semibold text-destructive" : "text-muted-foreground"
        )}>
          {detail.points > 0 ? `+${detail.points}` : `${detail.points}pt`}
        </span>
      )}
    </div>
  );
});
PrimaSquadraNationDisplayDetailPodium.displayName = 'PrimaSquadraNationDisplayDetailPodium';

interface GlobalCategoryPickDetailPodium extends GlobalCategoryPickDetailType {
   artistName?: string;
   songTitle?: string;
}

const CategoryPickDisplayDetailPodium = React.memo(({
  detail,
  allNations,
  leaderboardLockedAdmin,
  isEvenRow,
}: {
  detail: GlobalCategoryPickDetailPodium;
  allNations: Nation[];
  leaderboardLockedAdmin: boolean | null;
  isEvenRow?: boolean;
}) => {
  let IconComponent: React.ElementType;
  const iconColorClass = detail.isCorrectPick && !leaderboardLockedAdmin ? "text-accent" : "text-accent";

  switch (detail.iconName) {
    case 'Music2': IconComponent = Music2; break;
    case 'Star': IconComponent = Star; break;
    case 'Shirt': IconComponent = Shirt; break;
    case 'ThumbsDown': IconComponent = ThumbsDown; break;
    default: IconComponent = Info;
  }

  const pickedNationFullDetails = detail.pickedNationId ? allNations.find(n => n.id === detail.pickedNationId) : undefined;

  let rankSuffix = " in cat.";
  if (detail.categoryName === "Miglior Canzone") rankSuffix = "";
  else if (detail.categoryName === "Peggior Canzone") rankSuffix = " peggiore";

  const rankText = !leaderboardLockedAdmin && detail.actualCategoryRank && detail.actualCategoryRank > 0
    ? `(${detail.actualCategoryRank}°${rankSuffix ? `${rankSuffix}` : ''})`.trim()
    : "";
  const titleText = `${detail.categoryName}: ${pickedNationFullDetails?.name || 'N/D'}${rankText}${!leaderboardLockedAdmin ? ` Punti: ${detail.pointsAwarded}`: ''}`;

  return (
     <div className={cn(
        "px-2 py-1.5", 
        isEvenRow && "bg-muted/50 rounded-md"
      )}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-1"> 
        <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center gap-1.5">
                <IconComponent className={cn("h-5 w-5 shrink-0", iconColorClass)} />
                <span className="text-xs text-foreground/90 min-w-[120px] shrink-0 font-medium">{detail.categoryName}</span>
            </div>
          {!leaderboardLockedAdmin && typeof detail.pointsAwarded === 'number' && (
             <span className={cn("text-xs ml-auto pl-1 sm:ml-0", detail.pointsAwarded > 0 ? "font-semibold text-primary" : "text-muted-foreground")}>
              {detail.pointsAwarded > 0 ? `+${detail.pointsAwarded}pt` : `${detail.pointsAwarded}pt`}
            </span>
          )}
        </div>

        <div className={cn(
            "w-full mt-1 sm:mt-0",
            "pl-4 sm:ml-[calc(1.25rem+0.375rem)] sm:pl-0" 
        )}>
          {pickedNationFullDetails ? (
            <div className="flex items-center gap-1.5"> 
                {pickedNationFullDetails.countryCode ? (
                <Image
                    src={`https://flagcdn.com/w20/${pickedNationFullDetails.countryCode.toLowerCase()}.png`}
                    alt={pickedNationFullDetails.name}
                    width={20}
                    height={13}
                    className="rounded-sm border border-border/30 object-contain shrink-0"
                    data-ai-hint={`${pickedNationFullDetails.name} flag icon`}
                />
                ) : (
                  <div className="w-5 h-3.5 shrink-0 bg-muted/20 rounded-sm"></div>
                )}
                <div className="flex flex-col items-start">
                    <Link href={`/nations/${pickedNationFullDetails.id}`}
                    className="group text-xs hover:underline hover:text-primary flex items-center gap-1"
                    title={titleText}
                    >
                        <span className="font-medium">
                        {pickedNationFullDetails.name}
                        </span>
                        {!leaderboardLockedAdmin && <MedalIcon rank={detail.actualCategoryRank} className="ml-0.5" />}
                        {rankText && !leaderboardLockedAdmin && (
                           <span className="text-muted-foreground text-xs ml-0.5">{rankText}</span>
                        )}
                    </Link>
                     {(pickedNationFullDetails.artistName || pickedNationFullDetails.songTitle) && (
                        <span className="text-xs text-muted-foreground/80 block">
                        {pickedNationFullDetails.artistName}{pickedNationFullDetails.artistName && pickedNationFullDetails.songTitle && " - "}{pickedNationFullDetails.songTitle}
                        </span>
                    )}
                </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <UserCircle className="h-4 w-4 shrink-0" />
              <span>Nessuna selezione</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
CategoryPickDisplayDetailPodium.displayName = 'CategoryPickDisplayDetailPodium';

interface TeamListItemProps {
  team: Team & {
    isTied?: boolean;
    primaSquadraDetails?: GlobalPrimaSquadraDetailPodium[];
    categoryPicksDetails?: GlobalCategoryPickDetailPodium[];
    score?: number;
    rank?: number;
    isOwnTeamCard?: boolean; 
  };
  allNations: Nation[];
  nationGlobalCategorizedScoresArray?: [string, NationGlobalCategorizedScores][]; 
  disableEdit?: boolean;
  isLeaderboardPodiumDisplay?: boolean;
}


export function TeamListItem({
  team,
  allNations,
  nationGlobalCategorizedScoresArray = [],
  disableEdit = false,
  isLeaderboardPodiumDisplay = false,
  isOwnTeamCard = false,
}: TeamListItemProps) {
  const { user } = useAuth();
  const [teamsLocked, setTeamsLocked] = useState<boolean | null>(null);
  const [leaderboardLockedAdmin, setLeaderboardLockedAdmin] = useState<boolean | null>(null);
  const [isLoadingAdminSettings, setIsLoadingAdminSettings] = useState(true);
  
  const [categoryRanksAndCorrectness, setCategoryRanksAndCorrectness] = useState<{
    [key: string]: { rank?: number | null; isCorrectPick?: boolean, globalScore?: number | null };
  }>({});

  const nationGlobalCategorizedScoresMap = useMemo(() => {
    if (!nationGlobalCategorizedScoresArray || nationGlobalCategorizedScoresArray.length === 0) {
        return new Map<string, NationGlobalCategorizedScores>();
    }
    return new Map(nationGlobalCategorizedScoresArray);
  }, [nationGlobalCategorizedScoresArray]);


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
  
  const sortedFounderNationsDetails = useMemo(() => {
    if (team.primaSquadraDetails && team.primaSquadraDetails.length > 0) {
      return [...team.primaSquadraDetails].sort((a, b) => (a.actualRank ?? Infinity) - (b.actualRank ?? Infinity));
    }
    // Fallback for simpler display if detailed primaSquadraDetails are not available
    return (team.founderChoices || []).map(id => {
        const nation = allNations ? allNations.find(n => n.id === id) : undefined;
        return {
            id: id,
            name: nation?.name || "Sconosciuto",
            countryCode: nation?.countryCode || 'xx',
            artistName: nation?.artistName,
            songTitle: nation?.songTitle,
            actualRank: nation?.ranking,
            points: 0 
        } as GlobalPrimaSquadraDetailPodium;
      }).sort((a, b) => (a.actualRank ?? Infinity) - (b.actualRank ?? Infinity));
  }, [team.primaSquadraDetails, team.founderChoices, allNations]);

  useEffect(() => {
    if (nationGlobalCategorizedScoresMap && nationGlobalCategorizedScoresMap.size > 0 && allNations && allNations.length > 0) {
        const getSortedList = (categoryKey: 'averageSongScore' | 'averagePerformanceScore' | 'averageOutfitScore', order: 'asc' | 'desc') => {
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
            if (a.score === b.score) return a.name.localeCompare(b.name);
            return order === 'desc' ? (b.score as number) - (a.score as number) : (a.score as number) - (b.score as number);
            });
        };

        const getRankAndScore = (nationId?: string, sortedList?: Array<{ id: string, score: number | null }>): { rank?: number; score?: number | null } => {
        if (!nationId || !sortedList || sortedList.length === 0) return { rank: undefined, score: null };
        const rankIndex = sortedList.findIndex(n => n.id === nationId);
        const rank = rankIndex !== -1 ? rankIndex + 1 : undefined;
        const score = rankIndex !== -1 ? sortedList[rankIndex].score : null;
        return { rank, score };
        };

        const newRanks: typeof categoryRanksAndCorrectness = {};

        const bestSongNations = getSortedList('averageSongScore', 'desc');
        const worstSongNations = getSortedList('averageSongScore', 'asc');
        const bestPerfNations = getSortedList('averagePerformanceScore', 'desc');
        const bestOutfitNations = getSortedList('averageOutfitScore', 'desc');

        if (team.bestSongNationId) {
        const { rank, score } = getRankAndScore(team.bestSongNationId, bestSongNations);
        newRanks['Music2'] = { rank, isCorrectPick: !leaderboardLockedAdmin && rank === 1, globalScore: score };
        }
        if (team.worstSongNationId) {
        const { rank, score } = getRankAndScore(team.worstSongNationId, worstSongNations);
        newRanks['ThumbsDown'] = { rank, isCorrectPick: !leaderboardLockedAdmin && rank === 1, globalScore: score };
        }
        if (team.bestPerformanceNationId) {
        const { rank, score } = getRankAndScore(team.bestPerformanceNationId, bestPerfNations);
        newRanks['Star'] = { rank, isCorrectPick: !leaderboardLockedAdmin && rank === 1, globalScore: score };
        }
        if (team.bestOutfitNationId) {
        const { rank, score } = getRankAndScore(team.bestOutfitNationId, bestOutfitNations);
        newRanks['Shirt'] = { rank, isCorrectPick: !leaderboardLockedAdmin && rank === 1, globalScore: score };
        }
        setCategoryRanksAndCorrectness(newRanks);
    } else {
         setCategoryRanksAndCorrectness({});
    }
  }, [nationGlobalCategorizedScoresMap, allNations, team, leaderboardLockedAdmin]);


  const isOwner = user?.uid === team.userId;

  const borderClass =
    isLeaderboardPodiumDisplay && !leaderboardLockedAdmin && team.rank && team.rank <=3 ?
      (team.rank === 1 ? "border-yellow-400 border-2 shadow-yellow-400/30" :
       team.rank === 2 ? "border-slate-400 border-2 shadow-slate-400/30" :
       "border-amber-500 border-2 shadow-amber-500/30")
    : "border-border";

  if (isLoadingAdminSettings || !allNations) {
    return (
      <Card className={cn(
        "flex flex-col h-full shadow-lg hover:shadow-primary/20 transition-shadow duration-300 p-4 items-center justify-center",
        borderClass
      )}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-2">Caricamento dettagli team...</p>
      </Card>
    );
  }

  const treppoScorePicksForDisplay = useMemo(() => [
    { teamPickNationId: team.bestSongNationId, Icon: Music2, label: "Miglior Canzone", rankInfoKey: 'Music2', categoryKey: 'averageSongScore' },
    { teamPickNationId: team.bestPerformanceNationId, Icon: Star, label: "Miglior Performance", rankInfoKey: 'Star', categoryKey: 'averagePerformanceScore' },
    { teamPickNationId: team.bestOutfitNationId, Icon: Shirt, label: "Miglior Outfit", rankInfoKey: 'Shirt', categoryKey: 'averageOutfitScore' },
    { teamPickNationId: team.worstSongNationId, Icon: ThumbsDown, label: "Peggior Canzone", rankInfoKey: 'ThumbsDown', categoryKey: 'averageSongScore' },
  ].map(pick => {
      const nation = pick.teamPickNationId ? allNations.find(n => n.id === pick.teamPickNationId) : undefined;
      const rankInfo = categoryRanksAndCorrectness[pick.rankInfoKey] || {};
      return {
          ...pick,
          nation: nation,
          actualCategoryRank: rankInfo.rank,
          isCorrectPick: rankInfo.isCorrectPick || false,
          globalScoreForCategory: rankInfo.globalScore,
          artistName: nation?.artistName,
          songTitle: nation?.songTitle,
          countryCode: nation?.countryCode,
          pickedNationName: nation?.name,
      };
  }), [team, allNations, categoryRanksAndCorrectness]);

  const hasTreppoScorePredictions = treppoScorePicksForDisplay.some(p => p.teamPickNationId);

  const rankTextColorClass =
    !leaderboardLockedAdmin && team.rank === 1 ? "text-yellow-400" :
    !leaderboardLockedAdmin && team.rank === 2 ? "text-slate-400" :
    !leaderboardLockedAdmin && team.rank === 3 ? "text-amber-500" :
    "text-muted-foreground";


  return (
    <Card className={cn(
      "flex flex-col h-full shadow-lg hover:shadow-primary/20 transition-shadow duration-300",
      borderClass
    )}>
      <CardHeader className={cn(
          "pb-3 pt-4 px-4",
          isLeaderboardPodiumDisplay && "border-b border-border"
        )}>
        {isLeaderboardPodiumDisplay ? (
          <>
            {/* First Row: Team Name & Score */}
            <div className="flex items-baseline justify-between w-full">
                <CardTitle className="text-xl text-primary flex items-center gap-2">
                    <Users className="h-5 w-5 text-accent" />
                    {team.name}
                </CardTitle>
                {typeof team.score === 'number' && !leaderboardLockedAdmin && (
                <div className="text-lg font-bold text-primary whitespace-nowrap ml-2 shrink-0">
                    {team.score} pt
                </div>
                )}
            </div>
             {/* Second Row: Team Owner & Rank */}
            <div className="flex items-baseline justify-between w-full">
                 <div className="text-xs text-muted-foreground flex items-center gap-1">
                    {team.creatorDisplayName && (
                        <>
                        <UserCircle className="h-3 w-3" />{team.creatorDisplayName}
                        </>
                    )}
                </div>
                <div className={cn("text-sm font-semibold flex items-center", rankTextColorClass)}>
                    <MedalIcon rank={team.rank} className="mr-1" />
                    {getRankText(team.rank)}{team.isTied ? "*" : ""}
                </div>
            </div>
          </>
        ) : (
          // DEFAULT CARD HEADER (e.g., for "La Mia Squadra" on /teams page)
          <div className="flex flex-row justify-between items-start">
            <div className="flex-grow">
              <CardTitle className="text-xl text-primary flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                {team.name}
                 {team.creatorDisplayName && !isOwnTeamCard && (
                    <span className="ml-1 text-xs text-muted-foreground flex items-center gap-1" title={`Utente: ${team.creatorDisplayName}`}>
                        (<UserCircle className="h-3 w-3" />{team.creatorDisplayName})
                    </span>
                 )}
              </CardTitle>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-grow space-y-1 pt-2 pb-4 px-4">
        { (team.primaSquadraDetails && team.categoryPicksDetails && (isLeaderboardPodiumDisplay || isOwnTeamCard)) ? (
          // DETAILED DISPLAY (for Podium and Own Team card on /teams)
          <>
            <div className={cn("pb-3", hasTreppoScorePredictions && "border-b border-border")}>
              <p className="text-lg font-bold text-foreground mt-2 mb-1">
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

            {hasTreppoScorePredictions && (
              <div className={cn("pt-3", (isLeaderboardPodiumDisplay || isOwnTeamCard) && "mt-3 pt-0")}>
                <p className="text-lg font-bold text-secondary mt-3 pt-3">
                  Pronostici TreppoScore
                </p>
                {treppoScorePicksForDisplay.map((detail, index) => (
                   <CategoryPickDisplayDetailPodium
                      key={`${team.id}-${detail.label}-detail-${index}`}
                      detail={{
                        categoryName: detail.label,
                        pickedNationId: detail.teamPickNationId,
                        pickedNationName: detail.pickedNationName,
                        pickedNationCountryCode: detail.countryCode,
                        actualCategoryRank: detail.actualCategoryRank,
                        pickedNationScoreInCategory: detail.globalScoreForCategory,
                        pointsAwarded: categoryRanksAndCorrectness[detail.rankInfoKey]?.isCorrectPick ? (detail.actualCategoryRank === 1 ? 15 : detail.actualCategoryRank === 2 ? 10 : detail.actualCategoryRank === 3 ? 5: 0) : 0,
                        iconName: detail.Icon.displayName || detail.rankInfoKey,
                        isCorrectPick: detail.isCorrectPick,
                        artistName: detail.artistName,
                        songTitle: detail.songTitle,
                      }}
                      allNations={allNations}
                      leaderboardLockedAdmin={leaderboardLockedAdmin}
                      isEvenRow={index % 2 !== 0}
                    />
                ))}
              </div>
            )}
          </>
        ) : (
          // SIMPLER DISPLAY (for other teams on /teams page - now uses a table mostly, this might be dead code path)
          <>
            <p className="text-lg font-bold text-foreground mt-2 mb-1">
             {isOwnTeamCard ? "Pronostici TreppoVision" : "Scelte Principali"}
            </p>
            {sortedFounderNationsDetails.map((nationDetail, index) => {
                const nation = allNations.find(n => n.id === nationDetail.id);
                return (
                    <SelectedNationDisplay
                        key={`founder-${nationDetail.id}-${index}`}
                        nation={nation}
                        IconComponent={BadgeCheck}
                        isEvenRow={index % 2 !== 0}
                        leaderboardLocked={leaderboardLockedAdmin}
                        actualEurovisionRank={!leaderboardLockedAdmin && nation ? nation.ranking : undefined}
                        categoryRank={undefined}
                        isCorrectPick={false}
                    />
                );
            })}
             {hasTreppoScorePredictions && (
                <div className={cn("mt-3 pt-3", isOwnTeamCard ? "border-t border-border" : "")}>
                    <p className={cn("text-lg font-bold mb-1", isOwnTeamCard ? "text-secondary" : "text-foreground" )}>
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
                                globalScoreForCategory={rankInfo.globalScore}
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

    