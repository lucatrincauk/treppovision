
"use client";

import type { Team, Nation, NationGlobalCategorizedScores, GlobalPrimaSquadraDetail, GlobalCategoryPickDetail as GlobalCategoryPickDetailType, TeamWithScore } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCircle, Edit, Music2, Star, ThumbsDown, Shirt, Lock, BadgeCheck, Award, ListOrdered, Loader2, TrendingUp, Info, ListChecks, AlertTriangle, Link2Icon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { getTeamsLockedStatus } from "@/lib/actions/team-actions"; 
import { getLeaderboardLockedStatus } from "@/lib/actions/admin-actions";
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const getRankText = (rank?: number): string => {
  if (rank === undefined || rank === null || rank <= 0) return "";
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
  return <Award className={cn("w-4 h-4 flex-shrink-0", colorClass, className)} />;
};

interface SelectedNationDisplayProps {
  nation?: Nation;
  IconComponent: React.ElementType;
  label?: string;
  allNations: Nation[];
  leaderboardLocked?: boolean | null;
  categoryRank?: number;
  isCorrectPick?: boolean;
  isEvenRow?: boolean;
  globalScoreForCategory?: number | null;
  hideRankAndScore?: boolean; 
}

const SelectedNationDisplay = React.memo(({
  nation,
  IconComponent,
  label,
  allNations,
  leaderboardLocked,
  categoryRank,
  isCorrectPick,
  isEvenRow,
  globalScoreForCategory,
  hideRankAndScore = false,
}: SelectedNationDisplayProps) => {
  const iconColor = isCorrectPick ? "text-accent" : "text-accent";
  const nationDetails = nation ? (allNations.find(n => n.id === nation.id) || nation) : undefined;
  const nameForDisplay = nationDetails?.name || "N/D";

  const rankToUseForMedal = label ? categoryRank : nationDetails?.ranking;

  const mainContainerClasses = cn(
    "px-2 py-1.5",
    isEvenRow && "bg-muted/50 rounded-md"
  );

  const labelAndIconContainerClasses = cn(
    "flex items-center gap-1.5",
    label ? "w-full sm:w-auto" : ""
  );

  const nationInfoContainerOuterClasses = cn(
    "w-full",
    label ? "mt-1 sm:mt-0 sm:ml-[calc(1.25rem+0.375rem)]" : ""
  );
  
  return (
    <div className={cn(
      mainContainerClasses,
      label ? "flex flex-col items-start sm:flex-row sm:items-center gap-1 sm:gap-1.5" : "flex items-center gap-1.5"
    )}>
      <div className={labelAndIconContainerClasses}>
        <IconComponent className={cn("h-5 w-5 flex-shrink-0", iconColor)} />
        {label && <span className="text-xs text-foreground/90 min-w-[120px] flex-shrink-0 font-medium">{label}</span>}
      </div>
      
      <div className={cn(
        nationInfoContainerOuterClasses,
        label && "pl-4 sm:pl-0"
      )}>
        {nationDetails ? (
          <div className="flex flex-col items-start gap-0">
            <Link
              href={`/nations/${nationDetails.id}`}
              className="group text-xs hover:underline hover:text-primary flex items-center gap-1"
              title={`${nameForDisplay}${nationDetails.artistName ? ` - ${nationDetails.artistName}` : ''}${nationDetails.songTitle ? ` - ${nationDetails.songTitle}` : ''}${!label && !leaderboardLocked && nationDetails.ranking && nationDetails.ranking > 0 ? ` (Eurovision Rank: ${nationDetails.ranking}°) ` : ''}${label && !leaderboardLocked && categoryRank ? ` (Category Rank: ${categoryRank}°) ` : ''}`}
            >
              {nationDetails.countryCode && (
                <Image
                  src={`https://flagcdn.com/w20/${nationDetails.countryCode.toLowerCase()}.png`}
                  alt={nameForDisplay}
                  width={20}
                  height={13}
                  className="rounded-sm border border-border/30 object-contain flex-shrink-0"
                  data-ai-hint={`${nameForDisplay} flag icon`}
                />
              )}
              <span className="font-medium">{nameForDisplay}</span>
              {!hideRankAndScore && (
                <>
                  <MedalIcon rank={rankToUseForMedal} className="ml-0.5" />
                  {!label && !leaderboardLocked && nationDetails.ranking && nationDetails.ranking > 0 && (
                    <span className="text-muted-foreground text-xs ml-0.5">({nationDetails.ranking}°)</span>
                  )}
                  {label && !leaderboardLocked && categoryRank && (
                    <span className="text-muted-foreground text-xs ml-0.5">
                      ({categoryRank}°{label === "Peggior Canzone:" ? " peggiore" : (label === "Miglior Canzone:" ? "" : " in cat.")})
                    </span>
                  )}
                </>
              )}
            </Link>
            {(nationDetails.artistName || nationDetails.songTitle) && (
                <span className="text-xs text-muted-foreground/80 block">
                    {nationDetails.artistName}{nationDetails.artistName && nationDetails.songTitle && " - "}{nationDetails.songTitle}
                </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <UserCircle className="h-4 w-4 flex-shrink-0" />
            <span>Nessuna selezione</span>
          </div>
        )}
      </div>
    </div>
  );
});
SelectedNationDisplay.displayName = 'SelectedNationDisplay';


const PrimaSquadraNationDisplayDetailPodium = React.memo(({
  detail,
  allNations,
  leaderboardLocked,
  isEvenRow,
}: {
  detail: GlobalPrimaSquadraDetail;
  allNations: Nation[];
  leaderboardLocked: boolean;
  isEvenRow?: boolean;
}) => {
  const nationData = allNations.find(n => n.id === detail.id);

  return (
    <div className={cn(
      "px-2 py-1.5",
      isEvenRow && "bg-muted/50 rounded-md"
    )}>
      <div className="flex items-center gap-1.5">
        <BadgeCheck className="w-5 h-5 text-accent flex-shrink-0" />
        <div className="flex-grow flex flex-col items-start">
          <Link
            href={`/nations/${detail.id}`}
            className="text-xs hover:underline hover:text-primary flex items-center gap-1"
            title={`${detail.name}${nationData?.artistName ? ` - ${nationData.artistName}` : ''}${nationData?.songTitle ? ` - ${nationData.songTitle}` : ''}${!leaderboardLocked && detail.actualRank ? ` (Eurovision Rank: ${detail.actualRank}°) ` : ''}${!leaderboardLocked ? `Punti: ${detail.points}`: ''}`}
          >
            {nationData?.countryCode && (
              <Image
                src={`https://flagcdn.com/w20/${nationData.countryCode.toLowerCase()}.png`}
                alt={detail.name}
                width={20}
                height={13}
                className="rounded-sm border border-border/30 object-contain flex-shrink-0"
                data-ai-hint={`${detail.name} flag`}
              />
            )}
            <span className="font-medium">{detail.name}</span>
            {!leaderboardLocked && <MedalIcon rank={detail.actualRank} className="ml-0.5" />}
            {!leaderboardLocked && detail.actualRank && (
              <span className="text-muted-foreground text-xs ml-0.5">({detail.actualRank}°)</span>
            )}
          </Link>
          {nationData && (nationData.artistName || nationData.songTitle) && (
            <span className="text-xs text-muted-foreground/80 block">
                {nationData.artistName}{nationData.artistName && nationData.songTitle && " - "}{nationData.songTitle}
            </span>
           )}
        </div>
        {!leaderboardLocked && (
          <span className={cn(
            "text-xs ml-auto pl-1",
            detail.points > 0 ? "font-semibold text-primary" : detail.points < 0 ? "font-semibold text-destructive" : "text-muted-foreground"
          )}>
            {detail.points > 0 ? `+${detail.points}pt` : `${detail.points}pt`}
          </span>
        )}
      </div>
    </div>
  );
});
PrimaSquadraNationDisplayDetailPodium.displayName = 'PrimaSquadraNationDisplayDetailPodium';


const CategoryPickDisplayDetailPodium = React.memo(({
  detail,
  allNations,
  leaderboardLocked,
  isEvenRow,
}: {
  detail: GlobalCategoryPickDetailType;
  allNations: Nation[];
  leaderboardLocked: boolean;
  isEvenRow?: boolean;
}) => {
  let IconComponent: React.ElementType;
  const iconColorClass = detail.isCorrectPick ? "text-accent" : "text-accent";

  switch (detail.iconName) {
    case 'Music2': IconComponent = Music2; break;
    case 'Star': IconComponent = Star; break;
    case 'Shirt': IconComponent = Shirt; break;
    case 'ThumbsDown': IconComponent = ThumbsDown; break;
    default: IconComponent = Info;
  }

  let rankText = "";
  if (!leaderboardLocked && detail.actualCategoryRank && detail.actualCategoryRank > 0) {
      if (detail.categoryName === "Miglior Canzone") rankText = `(${detail.actualCategoryRank}°)`;
      else if (detail.categoryName === "Peggior Canzone") rankText = `(${detail.actualCategoryRank}° peggiore)`;
      else rankText = `(${detail.actualCategoryRank}° in cat.)`;
  }

  const pickedNationFullDetails = detail.pickedNationId ? allNations.find(n => n.id === detail.pickedNationId) : undefined;

  const CategoryMedalIcon = ({ rank, className }: { rank?: number, className?: string }) => {
    if (leaderboardLocked || rank === undefined || rank === null || rank === 0 || rank > 3) return null;
    let colorClass = "";
    if (rank === 1) colorClass = "text-yellow-400";
    else if (rank === 2) colorClass = "text-slate-400";
    else if (rank === 3) colorClass = "text-amber-500";
    return <Award className={cn("w-3.5 h-3.5 flex-shrink-0", colorClass, className)} />;
  };

  const rootDivClasses = cn(
    "px-2 py-1.5",
    isEvenRow && "bg-muted/50 rounded-md"
  );

  return (
    <div className={rootDivClasses}>
      <div className="flex flex-col"> {/* Always stack vertically */}
        <div className="flex items-center justify-between w-full"> {/* Label and points on one line */}
          <div className="flex items-center gap-1.5">
            <IconComponent className={cn("h-5 w-5 flex-shrink-0", iconColorClass)} />
            <span className="text-xs text-foreground/90 min-w-[120px] flex-shrink-0 font-medium">{detail.categoryName}</span>
          </div>
          {!leaderboardLocked && (
            <span className={cn("text-xs", detail.pointsAwarded > 0 ? "font-semibold text-primary" : "text-muted-foreground")}>
              {detail.pointsAwarded > 0 ? `+${detail.pointsAwarded}pt` : `${detail.pointsAwarded}pt`}
            </span>
          )}
        </div>

        <div className={cn(
          "w-full mt-1", // margin-top to ensure it's on a new line
          "pl-[calc(1.25rem+0.375rem)]" // Indentation based on icon (w-5 = 1.25rem) + gap (gap-1.5 = 0.375rem)
        )}>
          <div className="flex flex-col items-start gap-0">
            {pickedNationFullDetails ? (
              <>
                <Link href={`/nations/${pickedNationFullDetails.id}`}
                  className="text-xs hover:underline hover:text-primary flex items-center gap-1"
                   title={`${pickedNationFullDetails.name}${!leaderboardLocked && detail.actualCategoryRank ? ` ${rankText}` : ''}${!leaderboardLocked ? ` Punti: ${detail.pointsAwarded}`: ''}`}
                >
                  {pickedNationFullDetails.countryCode && (
                    <Image
                      src={`https://flagcdn.com/w20/${pickedNationFullDetails.countryCode.toLowerCase()}.png`}
                      alt={pickedNationFullDetails.name}
                      width={20}
                      height={13}
                      className="rounded-sm border border-border/30 object-contain flex-shrink-0"
                      data-ai-hint={`${pickedNationFullDetails.name} flag icon`}
                    />
                  )}
                  <span className="font-medium">
                    {pickedNationFullDetails.name}
                  </span>
                  {!leaderboardLocked && <CategoryMedalIcon rank={detail.actualCategoryRank} className="ml-0.5" />}
                  {!leaderboardLocked && rankText && (
                      <span className="text-muted-foreground ml-0.5 text-xs">
                          {rankText}
                      </span>
                  )}
                </Link>
                 {(pickedNationFullDetails.artistName || pickedNationFullDetails.songTitle) && (
                    <span className="text-xs text-muted-foreground/80 block">
                        {pickedNationFullDetails.artistName}{pickedNationFullDetails.artistName && pickedNationFullDetails.songTitle && " - "}{pickedNationFullDetails.songTitle}
                    </span>
                 )}
                </>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <UserCircle className="h-4 w-4 flex-shrink-0" />
                <span>Nessuna selezione</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
CategoryPickDisplayDetailPodium.displayName = 'CategoryPickDisplayDetailPodium';


interface TeamListItemProps {
  team: TeamWithScore & {
    primaSquadraDetails?: GlobalPrimaSquadraDetail[];
    categoryPicksDetails?: GlobalCategoryPickDetailType[];
    isTied?: boolean;
  };
  allNations: Nation[];
  nationGlobalCategorizedScoresArray?: [string, NationGlobalCategorizedScores][]; // Changed from Map
  isOwnTeamCard?: boolean;
  disableEdit?: boolean;
  isLeaderboardPodiumDisplay?: boolean;
}

export function TeamListItem({
  team,
  allNations,
  nationGlobalCategorizedScoresArray,
  isOwnTeamCard = false,
  disableEdit = false,
  isLeaderboardPodiumDisplay = false,
}: TeamListItemProps) {
  const { user } = useAuth();
  const [teamsLocked, setTeamsLocked] = useState<boolean | null>(null);
  const [leaderboardLocked, setLeaderboardLocked] = useState<boolean | null>(null);

  const [categoryRanksAndCorrectness, setCategoryRanksAndCorrectness] = useState<{
    [key: string]: { rank?: number; isCorrectPick?: boolean };
  }>({});

  useEffect(() => {
    async function fetchLockStatuses() {
      if (teamsLocked === null) {
        try {
          const teamsLockStatus = await getTeamsLockedStatus();
          setTeamsLocked(teamsLockStatus);
        } catch (error) {
          console.error("Failed to fetch teams lock status:", error);
          setTeamsLocked(false);
        }
      }
      if (leaderboardLocked === null) {
        try {
          const lbLockedStatus = await getLeaderboardLockedStatus();
          setLeaderboardLocked(lbLockedStatus);
        } catch (error) {
          console.error("Failed to fetch leaderboard lock status:", error);
          setLeaderboardLocked(false);
        }
      }
    }
    fetchLockStatuses();
  }, [teamsLocked, leaderboardLocked]);

  useEffect(() => {
    if (!nationGlobalCategorizedScoresArray || nationGlobalCategorizedScoresArray.length === 0 || !allNations || allNations.length === 0) {
      setCategoryRanksAndCorrectness({});
      return;
    }
    const nationGlobalCategorizedScoresMap = new Map(nationGlobalCategorizedScoresArray);

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

    const getRank = (nationId?: string, sortedList?: Array<{ id: string }>): number | undefined => {
      if (!nationId || !sortedList || sortedList.length === 0) return undefined;
      const rankIndex = sortedList.findIndex(n => n.id === nationId);
      return rankIndex !== -1 ? rankIndex + 1 : undefined;
    };

    const newRanks: typeof categoryRanksAndCorrectness = {};

    const bestSongNations = getSortedList('averageSongScore', 'desc');
    const worstSongNations = getSortedList('averageSongScore', 'asc');
    const bestPerfNations = getSortedList('averagePerformanceScore', 'desc');
    const bestOutfitNations = getSortedList('averageOutfitScore', 'desc');

    if (team.bestSongNationId) {
      const rank = getRank(team.bestSongNationId, bestSongNations);
      newRanks['Music2'] = { rank, isCorrectPick: rank === 1 };
    }
    if (team.worstSongNationId) {
      const rank = getRank(team.worstSongNationId, worstSongNations);
      newRanks['ThumbsDown'] = { rank, isCorrectPick: rank === 1 };
    }
    if (team.bestPerformanceNationId) {
      const rank = getRank(team.bestPerformanceNationId, bestPerfNations);
      newRanks['Star'] = { rank, isCorrectPick: rank === 1 };
    }
    if (team.bestOutfitNationId) {
      const rank = getRank(team.bestOutfitNationId, bestOutfitNations);
      newRanks['Shirt'] = { rank, isCorrectPick: rank === 1 };
    }
    setCategoryRanksAndCorrectness(newRanks);
  }, [nationGlobalCategorizedScoresArray, allNations, team.bestSongNationId, team.worstSongNationId, team.bestPerformanceNationId, team.bestOutfitNationId]);

  const isOwner = user?.uid === team.userId;

  const borderClass =
    !leaderboardLocked && team.rank === 1 ? "border-yellow-400 border-2 shadow-yellow-400/30" :
    !leaderboardLocked && team.rank === 2 ? "border-slate-400 border-2 shadow-slate-400/30" :
    !leaderboardLocked && team.rank === 3 ? "border-amber-500 border-2 shadow-amber-500/30" :
    "border-border";

  if (!allNations || allNations.length === 0) {
    return (
      <Card className={cn(
        "flex flex-col h-full shadow-lg hover:shadow-primary/20 transition-shadow duration-300 p-4 items-center justify-center",
        borderClass
      )}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-2">Caricamento dati nazioni...</p>
      </Card>
    );
  }

  const treppoScorePicksForDisplay = [
    { teamPickNationId: team.bestSongNationId, Icon: Music2, label: "Miglior Canzone:", rankInfoKey: 'Music2', iconName: "Music2", globalScoreKey: 'averageSongScore' },
    { teamPickNationId: team.bestPerformanceNationId, Icon: Star, label: "Miglior Performance:", rankInfoKey: 'Star', iconName: "Star", globalScoreKey: 'averagePerformanceScore' },
    { teamPickNationId: team.bestOutfitNationId, Icon: Shirt, label: "Miglior Outfit:", rankInfoKey: 'Shirt', iconName: "Shirt", globalScoreKey: 'averageOutfitScore' },
    { teamPickNationId: team.worstSongNationId, Icon: ThumbsDown, label: "Peggior Canzone:", rankInfoKey: 'ThumbsDown', iconName: "ThumbsDown", globalScoreKey: 'averageSongScore' },
  ];

  const hasTreppoScorePredictions = team.bestSongNationId || team.bestPerformanceNationId || team.bestOutfitNationId || team.worstSongNationId;

  const sortedFounderNationsDetails = useMemo(() => {
    if (team.primaSquadraDetails && team.primaSquadraDetails.length > 0) {
      return [...team.primaSquadraDetails].sort((a, b) => (a.actualRank ?? Infinity) - (b.actualRank ?? Infinity));
    }
    return (team.founderChoices || []).map(id => {
        const nation = allNations.find(n => n.id === id);
        return {
            id: id,
            name: nation?.name || "Sconosciuto",
            countryCode: nation?.countryCode || 'xx',
            artistName: nation?.artistName,
            songTitle: nation?.songTitle,
            actualRank: nation?.ranking,
            points: 0 
        } as GlobalPrimaSquadraDetail;
      }).sort((a, b) => (a.actualRank ?? Infinity) - (b.actualRank ?? Infinity));
  }, [team.primaSquadraDetails, team.founderChoices, allNations]);

  const rankTextColorClass =
    !leaderboardLocked && team.rank === 1 ? "text-yellow-400" :
    !leaderboardLocked && team.rank === 2 ? "text-slate-400" :
    !leaderboardLocked && team.rank === 3 ? "text-amber-500" :
    "text-muted-foreground";

  return (
    <Card className={cn(
      "flex flex-col h-full shadow-lg hover:shadow-primary/20 transition-shadow duration-300",
      borderClass
    )}>
       <CardHeader className={cn(
        "pb-3 pt-4 px-4",
        isLeaderboardPodiumDisplay && "border-b border-border/30" // Apply border for podium cards
      )}>
        {isLeaderboardPodiumDisplay ? (
           <div className="space-y-1">
            <div className="flex items-baseline justify-between w-full">
              <CardTitle className="text-xl text-primary flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                {team.name}
              </CardTitle>
              {typeof team.score === 'number' && !leaderboardLocked && (
                <div className="text-lg font-bold text-primary whitespace-nowrap">
                  {team.score} pt
                </div>
              )}
            </div>
            <div className="flex items-baseline justify-between w-full">
              {team.creatorDisplayName && (
                <div className="text-xs text-muted-foreground flex items-center gap-1 self-start" title={`Utente: ${team.creatorDisplayName}`}>
                  <UserCircle className="h-3 w-3" />{team.creatorDisplayName}
                </div>
              )}
              {team.rank && (
                <div className={cn("text-sm font-semibold flex items-center", rankTextColorClass)}>
                  <MedalIcon rank={team.rank} className="mr-1.5" />
                  {getRankText(team.rank)}
                  {team.isTied && <span className="ml-1.5 text-xs text-muted-foreground">(Pari merito)</span>}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Default Card Header Layout (e.g., for "La Mia Squadra" on /teams page)
          <div className="flex flex-row justify-between items-start">
            <div className="flex-grow">
              {team.creatorDisplayName && !isOwnTeamCard && (
                <div className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5" title={`Utente: ${team.creatorDisplayName}`}>
                  <UserCircle className="h-3 w-3" />{team.creatorDisplayName}
                </div>
              )}
              <CardTitle className="text-xl text-primary flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                {team.name}
              </CardTitle>
            </div>
             <div className={cn("ml-2 flex-shrink-0 flex", 
                isOwnTeamCard ? "flex-row items-center gap-2" : "flex-col items-end gap-1"
             )}>
                 {typeof team.score === 'number' && !leaderboardLocked && (
                    <div className={cn(
                        "text-lg font-bold text-primary whitespace-nowrap",
                        isOwnTeamCard && "order-2" // Score appears after button on own team card
                    )}>
                    {team.score} pt
                    </div>
                )}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-grow space-y-1 pt-2 pb-4 px-4">
        {(team.primaSquadraDetails && team.categoryPicksDetails) ? (
          <>
            <div className={cn(isLeaderboardPodiumDisplay && "pb-3 border-b border-border/30")}>
              <p className="text-lg font-bold text-foreground mt-2 mb-1">
                Pronostici TreppoVision
              </p>
              {sortedFounderNationsDetails.map((detail, index) => (
                <PrimaSquadraNationDisplayDetailPodium
                  key={`${team.id}-${detail.id}-prima-detail`}
                  detail={detail}
                  allNations={allNations}
                  leaderboardLocked={leaderboardLocked || false}
                  isEvenRow={index % 2 !== 0}
                />
              ))}
            </div>

            {hasTreppoScorePredictions && (
              <>
                <p className="text-lg font-bold text-secondary mt-3 pt-0 mb-1">
                  Pronostici TreppoScore
                </p>
                {(team.categoryPicksDetails || []).map((detail, index) => (
                   <CategoryPickDisplayDetailPodium
                      key={`${team.id}-${detail.categoryName}-detail`}
                      detail={detail}
                      allNations={allNations}
                      leaderboardLocked={leaderboardLocked || false}
                      isEvenRow={index % 2 !== 0}
                    />
                ))}
              </>
            )}
          </>
        ) : (
          <>
            <p className="text-lg font-bold text-foreground mt-2 mb-1">
             Pronostici TreppoVision
            </p>
            {sortedFounderNationsDetails.map((nationDetail, index) => {
                const nation = allNations.find(n => n.id === nationDetail.id);
                return (
                    <SelectedNationDisplay
                        key={`founder-${nationDetail.id}-${index}`}
                        nation={nation}
                        IconComponent={BadgeCheck}
                        allNations={allNations}
                        isEvenRow={index % 2 !== 0}
                        leaderboardLocked={leaderboardLocked}
                    />
                );
            })}
             {hasTreppoScorePredictions && (
                <>
                    <p className="text-lg font-bold text-secondary mt-3 mb-1">
                        Pronostici TreppoScore
                    </p>
                    {treppoScorePicksForDisplay.map((category, index) => {
                        const nation = allNations.find(n => n.id === category.teamPickNationId);
                        const rankInfo = categoryRanksAndCorrectness[category.rankInfoKey] || {};
                        
                        return (
                            <SelectedNationDisplay
                                key={category.label}
                                nation={nation}
                                IconComponent={category.Icon}
                                label={category.label}
                                allNations={allNations}
                                isEvenRow={index % 2 !== 0}
                                categoryRank={rankInfo.rank}
                                isCorrectPick={rankInfo.isCorrectPick || false}
                                leaderboardLocked={leaderboardLocked}
                            />
                        );
                    })}
                </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
