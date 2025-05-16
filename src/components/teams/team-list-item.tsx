
"use client";

import type { Team, Nation, NationGlobalCategorizedScores, GlobalPrimaSquadraDetail, GlobalCategoryPickDetail as GlobalCategoryPickDetailType, TeamWithScore } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCircle, Edit, Music2, Star, ThumbsDown, Shirt, Lock, BadgeCheck, Award, ListOrdered, Loader2, TrendingUp, Info } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { getTeamsLockedStatus } from "@/lib/actions/team-actions";
import { getLeaderboardLockedStatus } from "@/lib/actions/admin-actions";
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Helper function to convert numerical rank to Italian ordinal text
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

const PrimaSquadraNationDisplayDetailPodium = React.memo(({
  detail,
  allNations,
  leaderboardLocked,
  isEvenRow
}: {
  detail: GlobalPrimaSquadraDetail;
  allNations: Nation[];
  leaderboardLocked: boolean;
  isEvenRow?: boolean;
}) => {
  const nationData = allNations.find(n => n.id === detail.id);

  const MedalIcon = ({ rank, className }: { rank?: number, className?: string }) => {
    if (leaderboardLocked || rank === undefined || rank === null || rank === 0 || rank > 3) return null;
    let colorClass = "";
    if (rank === 1) colorClass = "text-yellow-400";
    else if (rank === 2) colorClass = "text-slate-400";
    else if (rank === 3) colorClass = "text-amber-500";
    return <Award className={cn("w-3.5 h-3.5 flex-shrink-0", colorClass, className)} />;
  };

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
            title={`${detail.name}${nationData?.artistName ? ` - ${nationData.artistName}` : ''}${nationData?.songTitle ? ` - ${nationData.songTitle}` : ''}${!leaderboardLocked && detail.actualRank ? ` (${detail.actualRank}°)` : ''} - Punti: ${detail.points}`}
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
            <MedalIcon rank={detail.actualRank} />
            {!leaderboardLocked && detail.actualRank && (
              <span className="text-muted-foreground text-xs ml-0.5">({detail.actualRank}°)</span>
            )}
          </Link>
          {nationData && (
            <span className="text-xs text-muted-foreground/80 block">
                {nationData.artistName} - {nationData.songTitle}
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
  isEvenRow
}: {
  detail: GlobalCategoryPickDetailType;
  allNations: Nation[];
  leaderboardLocked: boolean;
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

  let rankTextSuffix = "";
  if (!leaderboardLocked && detail.actualCategoryRank && detail.actualCategoryRank > 0) {
      if (detail.categoryName === "Miglior Canzone") rankTextSuffix = "";
      else if (detail.categoryName === "Peggior Canzone") rankTextSuffix = " peggiore";
      else rankTextSuffix = " in cat.";
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

  const mainContainerClasses = cn(
    "px-2 py-1.5",
    isEvenRow && "bg-muted/50 rounded-md"
  );

  return (
    <div className={mainContainerClasses}>
      <div className="flex flex-col">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5">
            <IconComponent className={cn("h-5 w-5 flex-shrink-0", iconColorClass)} />
            <span className="text-xs text-foreground/90 min-w-[120px] flex-shrink-0 font-medium">{detail.categoryName}</span>
          </div>
          {!leaderboardLocked && (
              <span className={cn("text-xs sm:ml-auto sm:pl-2", detail.pointsAwarded > 0 ? "font-semibold text-primary" : "text-muted-foreground")}>
              {detail.pointsAwarded > 0 ? `+${detail.pointsAwarded}pt` : `${detail.pointsAwarded}pt`}
              </span>
          )}
        </div>
        <div className={cn("w-full mt-1", "pl-[calc(1.25rem+0.375rem)]")}>
          <div className="flex flex-col items-start gap-0.5">
              {pickedNationFullDetails ? (
                <>
                <Link href={`/nations/${pickedNationFullDetails.id}`}
                  className="text-xs hover:underline hover:text-primary flex items-center gap-1"
                  title={`${pickedNationFullDetails.name} - ${pickedNationFullDetails.artistName} - ${pickedNationFullDetails.songTitle}${!leaderboardLocked && detail.actualCategoryRank ? ` (${detail.actualCategoryRank}°${rankTextSuffix})` : ''} - Punti: ${detail.pointsAwarded}`}
                >
                  {pickedNationFullDetails.countryCode && (
                    <Image
                      src={`https://flagcdn.com/w20/${pickedNationFullDetails.countryCode.toLowerCase()}.png`}
                      alt={pickedNationFullDetails.name}
                      width={20}
                      height={13}
                      className="rounded-sm border border-border/30 object-contain flex-shrink-0"
                      data-ai-hint={`${pickedNationFullDetails.name} flag`}
                    />
                  )}
                  <span className="font-medium">
                    {pickedNationFullDetails.name}
                  </span>
                  <CategoryMedalIcon rank={detail.actualCategoryRank} />
                  {!leaderboardLocked && detail.actualCategoryRank && (
                      <span className="text-muted-foreground ml-0.5 text-xs">
                          ({detail.actualCategoryRank}°{rankTextSuffix})
                      </span>
                  )}
                </Link>
                 <span className="text-xs text-muted-foreground/80 block">
                    {pickedNationFullDetails.artistName} - {pickedNationFullDetails.songTitle}
                  </span>
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


const SelectedNationDisplay = React.memo(({
  nation,
  IconComponent,
  label,
  allNations,
  leaderboardLocked,
  categoryRank,
  isEvenRow,
  isCorrectPick,
  globalScoreForCategory
}: {
  nation?: Nation;
  IconComponent: React.ElementType;
  label?: string;
  allNations: Nation[];
  leaderboardLocked?: boolean | null;
  categoryRank?: number;
  isEvenRow?: boolean;
  isCorrectPick?: boolean;
  globalScoreForCategory?: number | null;
}) => {
  const iconColor = isCorrectPick ? "text-accent" : "text-accent"; // Correct pick is yellow, default also yellow
  const nationDetails = nation ? (allNations.find(n => n.id === nation.id) || nation) : undefined;
  const nameForDisplay = nationDetails?.name || "N/D";

  let rankTextSuffix = "";
  if (label && !leaderboardLocked && categoryRank && categoryRank > 0) {
      if (label.startsWith("Miglior Canzone")) rankTextSuffix = "";
      else if (label.startsWith("Peggior Canzone")) rankTextSuffix = " peggiore";
      else rankTextSuffix = " in cat.";
  }

  const MedalIcon = ({ rank, className }: { rank?: number, className?: string }) => {
    if (leaderboardLocked || rank === undefined || rank === null || rank === 0 || rank > 3) return null;
    let colorClass = "";
    if (rank === 1) colorClass = "text-yellow-400";
    else if (rank === 2) colorClass = "text-slate-400";
    else if (rank === 3) colorClass = "text-amber-500";
    return <Award className={cn("w-3.5 h-3.5 flex-shrink-0", colorClass, className)} />;
  };

  const mainContainerClasses = cn(
    "px-2 py-1.5",
    label && "flex flex-col items-start sm:flex-row sm:items-center gap-1 sm:gap-1.5",
    !label && "flex items-center gap-1.5",
    isEvenRow && "bg-muted/50 rounded-md"
  );

  const labelAndIconContainerClasses = cn(
    "flex items-center gap-1.5",
    label && "w-full sm:w-auto"
  );

  const nationInfoContainerOuterClasses = cn(
    "flex-grow",
    label && "w-full mt-1 sm:mt-0 sm:ml-[calc(1.25rem+0.375rem)] pl-4 sm:pl-0"
  );

  const NationInfoContent = () => (
    <div className={cn("flex flex-col items-start gap-0")}>
      {nationDetails ? (
        <>
          <Link href={`/nations/${nationDetails.id}`} className="group text-xs hover:underline hover:text-primary flex items-center gap-1"
                title={`${nameForDisplay}${nationDetails.artistName ? ` - ${nationDetails.artistName}` : ''}${nationDetails.songTitle ? ` - ${nationDetails.songTitle}` : ''}${!label && !leaderboardLocked && nationDetails.ranking && nationDetails.ranking > 0 ? ` (${nationDetails.ranking}°)` : ''}${label && !leaderboardLocked && categoryRank ? ` (${categoryRank}°${rankTextSuffix})` : ''}`}
          >
            {nationDetails.countryCode && (
            <Image
              src={`https://flagcdn.com/w20/${nationDetails.countryCode.toLowerCase()}.png`}
              alt={`Bandiera ${nameForDisplay}`}
              width={20}
              height={13}
              className="rounded-sm border border-border/30 object-contain flex-shrink-0"
              data-ai-hint={`${nameForDisplay} flag`}
            />
            )}
            <span className="font-medium">
              {nameForDisplay}
            </span>
            <MedalIcon rank={label ? categoryRank : nationDetails.ranking} />
            {!label && !leaderboardLocked && nationDetails.ranking && nationDetails.ranking > 0 && (
              <span className="text-muted-foreground ml-0.5 text-xs whitespace-nowrap">
              ({nationDetails.ranking}°)
              </span>
            )}
             {label && !leaderboardLocked && categoryRank && (
                <span className="text-muted-foreground ml-0.5 text-xs whitespace-nowrap">
                ({categoryRank}°{rankTextSuffix})
                </span>
            )}
          </Link>
          {(nationDetails.artistName || nationDetails.songTitle) && (
              <span className="text-xs text-muted-foreground/80 block">
                  {nationDetails.artistName && nationDetails.songTitle ? `${nationDetails.artistName} - ${nationDetails.songTitle}` : nationDetails.artistName || nationDetails.songTitle}
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
  );

  return (
    <div className={mainContainerClasses}>
      <div className={labelAndIconContainerClasses}>
        <IconComponent className={cn("h-5 w-5 flex-shrink-0", iconColor)} />
        {label && <span className="text-xs text-foreground/90 min-w-[120px] flex-shrink-0 font-medium">{label}</span>}
      </div>
      <div className={nationInfoContainerOuterClasses}>
        <NationInfoContent />
      </div>
    </div>
  );
});
SelectedNationDisplay.displayName = 'SelectedNationDisplay';


interface TeamListItemProps {
  team: TeamWithScore & {
    primaSquadraDetails?: GlobalPrimaSquadraDetail[];
    categoryPicksDetails?: GlobalCategoryPickDetailType[];
    isTied?: boolean;
  };
  allNations: Nation[];
  nationGlobalCategorizedScoresArray: [string, NationGlobalCategorizedScores][];
  isOwnTeamCard?: boolean;
  disableEdit?: boolean;
}

export function TeamListItem({
  team,
  allNations,
  nationGlobalCategorizedScoresArray,
  isOwnTeamCard = false,
  disableEdit = false,
}: TeamListItemProps) {
  const { user } = useAuth();
  const [teamsLocked, setTeamsLocked] = useState<boolean | null>(null);
  const [leaderboardLocked, setLeaderboardLocked] = useState<boolean | null>(null);

  const [categoryRanksAndCorrectness, setCategoryRanksAndCorrectness] = useState<{
    [key: string]: { rank?: number; isCorrectPick?: boolean, globalScore?: number | null };
  }>({});

  useEffect(() => {
    async function fetchLockStatuses() {
      if (!disableEdit) {
        try {
          const teamsLockStatus = await getTeamsLockedStatus();
          setTeamsLocked(teamsLockStatus);
        } catch (error) {
          console.error("Failed to fetch teams lock status:", error);
          setTeamsLocked(false);
        }
      }
      try {
        const lbLockedStatus = await getLeaderboardLockedStatus();
        setLeaderboardLocked(lbLockedStatus);
      } catch (error)
      {
        console.error("Failed to fetch leaderboard lock status:", error);
        setLeaderboardLocked(false);
      }
    }
    fetchLockStatuses();
  }, [disableEdit]);

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

    const getRankAndScore = (nationId?: string, sortedList?: Array<{ id: string, score: number | null }>): { rank?: number, score?: number | null } => {
      if (!nationId || !sortedList || sortedList.length === 0) return { rank: undefined, score: null };
      const rankIndex = sortedList.findIndex(n => n.id === nationId);
      const actualRank = rankIndex !== -1 ? rankIndex + 1 : undefined;
      const actualScore = actualRank !== undefined && rankIndex < sortedList.length ? sortedList[rankIndex].score : null;
      return { rank: actualRank, score: actualScore };
    };

    const newRanks: typeof categoryRanksAndCorrectness = {};

    if (team.bestSongNationId) {
      const bestSongList = getSortedList('averageSongScore', 'desc');
      const { rank, score } = getRankAndScore(team.bestSongNationId, bestSongList);
      newRanks['Music2'] = { rank, isCorrectPick: rank === 1, globalScore: score };
    }
    if (team.worstSongNationId) {
      const worstSongList = getSortedList('averageSongScore', 'asc');
      const { rank, score } = getRankAndScore(team.worstSongNationId, worstSongList);
      newRanks['ThumbsDown'] = { rank, isCorrectPick: rank === 1, globalScore: score };
    }
    if (team.bestPerformanceNationId) {
      const bestPerfList = getSortedList('averagePerformanceScore', 'desc');
      const { rank, score } = getRankAndScore(team.bestPerformanceNationId, bestPerfList);
      newRanks['Star'] = { rank, isCorrectPick: rank === 1, globalScore: score };
    }
    if (team.bestOutfitNationId) {
      const bestOutfitList = getSortedList('averageOutfitScore', 'desc');
      const { rank, score } = getRankAndScore(team.bestOutfitNationId, bestOutfitList);
      newRanks['Shirt'] = { rank, isCorrectPick: rank === 1, globalScore: score };
    }

    setCategoryRanksAndCorrectness(newRanks);

  }, [nationGlobalCategorizedScoresArray, allNations, team.bestSongNationId, team.worstSongNationId, team.bestPerformanceNationId, team.bestOutfitNationId]);

  const isOwner = user?.uid === team.userId;

  const borderClass =
    !leaderboardLocked && team.rank === 1 ? "border-yellow-400 border-2 shadow-yellow-400/30" :
    !leaderboardLocked && team.rank === 2 ? "border-slate-400 border-2 shadow-slate-400/30" :
    !leaderboardLocked && team.rank === 3 ? "border-amber-500 border-2 shadow-amber-500/30" :
    "border-border";

  const HeaderMedalIcon = ({ rank, className }: { rank?: number, className?: string }) => {
    if (leaderboardLocked || rank === undefined || rank === null || rank === 0 || rank > 3) return null;
    let colorClass = "";
    if (rank === 1) colorClass = "text-yellow-400";
    else if (rank === 2) colorClass = "text-slate-400";
    else if (rank === 3) colorClass = "text-amber-500";
    return <Award className={cn("w-4 h-4 flex-shrink-0", colorClass, className)} />;
  };

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
    { teamPickNationId: team.bestSongNationId, Icon: Music2, label: "Miglior Canzone:", rankInfoKey: 'Music2' },
    { teamPickNationId: team.bestPerformanceNationId, Icon: Star, label: "Miglior Performance:", rankInfoKey: 'Star' },
    { teamPickNationId: team.bestOutfitNationId, Icon: Shirt, label: "Miglior Outfit:", rankInfoKey: 'Shirt' },
    { teamPickNationId: team.worstSongNationId, Icon: ThumbsDown, label: "Peggior Canzone:", rankInfoKey: 'ThumbsDown' },
  ];

  const hasTreppoScorePredictions = team.bestSongNationId || team.bestPerformanceNationId || team.bestOutfitNationId || team.worstSongNationId;

  const sortedFounderNationsDetails = team.primaSquadraDetails
    ? [...team.primaSquadraDetails].sort((a, b) => (a.actualRank ?? Infinity) - (b.actualRank ?? Infinity))
    : (team.founderChoices || []).map(id => {
        const nation = allNations.find(n => n.id === id);
        return {
            id: id,
            name: nation?.name || "Sconosciuto",
            countryCode: nation?.countryCode || "xx",
            artistName: nation?.artistName,
            songTitle: nation?.songTitle,
            actualRank: nation?.ranking,
            points: 0 // Points not typically shown in summary card
        } as GlobalPrimaSquadraDetail;
      }).sort((a, b) => (a.actualRank ?? Infinity) - (b.actualRank ?? Infinity));


  return (
    <Card className={cn(
      "flex flex-col h-full shadow-lg hover:shadow-primary/20 transition-shadow duration-300",
      borderClass
    )}>
      <CardHeader className={cn(
        "pb-3 pt-4"
        // Removed thick top border logic
      )}>
        <div className="flex flex-row justify-between items-start">
            <div className="flex-grow">
                {!leaderboardLocked && team.rank && (
                 <div className={cn(
                    "text-sm font-semibold mb-0.5 flex items-center",
                    team.rank === 1 && "text-yellow-400",
                    team.rank === 2 && "text-slate-400",
                    team.rank === 3 && "text-amber-500",
                    !(team.rank >=1 && team.rank <=3) && "text-muted-foreground"
                  )}>
                    <HeaderMedalIcon rank={team.rank} className="mr-1.5"/>
                    {getRankText(team.rank)}
                    {team.isTied && <span className="ml-1.5 text-muted-foreground">(Pari merito)</span>}
                </div>
                )}
                <CardTitle className="text-xl text-primary flex items-center gap-2">
                    <Users className="h-5 w-5 text-accent" />
                    {team.name}
                </CardTitle>
                {team.creatorDisplayName && !isOwnTeamCard && (
                  <div className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1" title={`Utente: ${team.creatorDisplayName}`}>
                      <UserCircle className="h-3 w-3" />{team.creatorDisplayName}
                  </div>
                )}
            </div>
            <div className={cn(
                "ml-2 flex-shrink-0",
                 isOwnTeamCard && isOwner && !disableEdit
                    ? "flex flex-row items-center gap-2"
                    : "flex flex-col items-end gap-1"
                )}>
                 {typeof team.score === 'number' && !leaderboardLocked && (
                    <div className={cn(
                        "text-lg font-bold text-primary whitespace-nowrap",
                        (isOwnTeamCard) && "text-right"
                    )}>
                    {team.score} pt
                    </div>
                )}
                {/* "Modifica" button is now handled by parent page for "La Mia Squadra" */}
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-1 pt-0 pb-4">
        {team.primaSquadraDetails && team.categoryPicksDetails && allNations.length > 0 ? (
          // Detailed display (Podium cards, User's own team card if details are calculated)
          <>
            <p className="text-xl font-bold text-foreground mt-2 mb-1.5">
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

            {hasTreppoScorePredictions && (
              <>
                <p className="text-xl font-bold text-secondary mt-4 pt-3 border-t border-border/30 mb-1.5">
                  Pronostici TreppoScore
                </p>
                {team.categoryPicksDetails.map((detail, index) => (
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
        ) : allNations.length > 0 ? (
          // Simpler display for general teams list (no detailed breakdown initially)
          <>
            <p className="text-xl font-bold text-foreground mt-2 mb-1.5">
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
                    <p className="text-xl font-bold text-secondary mt-3 pt-3 border-t border-border/30 mb-1.5">
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
                                globalScoreForCategory={rankInfo.globalScore}
                            />
                        );
                    })}
                </>
            )}
          </>
        ) : (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
