
"use client";

import type { Team, Nation, NationGlobalCategorizedScores, GlobalPrimaSquadraDetail, GlobalCategoryPickDetail as GlobalCategoryPickDetailType, TeamWithScore } from "@/types";
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

// Helper function to convert rank number to Italian ordinal text
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
    return <Award className={cn("w-3.5 h-3.5 flex-shrink-0", colorClass, className)} />;
};


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
    ? `(${detail.actualRank}°)`
    : "";
  const titleText = `${detail.name}${rankText ? ` ${rankText}` : ''}${nationData?.artistName ? ` - ${nationData.artistName}` : ''}${nationData?.songTitle ? ` - ${nationData.songTitle}` : ''}${!leaderboardLocked && typeof detail.points === 'number' ? ` Punti: ${detail.points}`: ''}`;

  return (
    <div className={cn("px-2 py-1.5 flex justify-between items-start", isEvenRow && "bg-muted/50 rounded-md")}>
      <div className="flex items-center gap-1.5">
        <BadgeCheck className="w-5 h-5 text-accent flex-shrink-0" />
        <div className="flex items-center">
          {nationData?.countryCode ? (
            <Image
              src={`https://flagcdn.com/w20/${nationData.countryCode.toLowerCase()}.png`}
              alt={detail.name}
              width={20}
              height={13}
              className="rounded-sm border border-border/30 object-contain flex-shrink-0 mr-1.5"
              data-ai-hint={`${detail.name} flag icon`}
            />
          ) : (
            <div className="w-5 h-[13px] flex-shrink-0 bg-muted/20 rounded-sm mr-1.5"></div>
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
            {(nationData?.artistName || nationData?.songTitle) && (
              <span className="text-xs text-muted-foreground/80 block">
                {nationData.artistName}{nationData.artistName && nationData.songTitle && " - "}{nationData.songTitle}
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
  detail: GlobalCategoryPickDetailType;
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

  let rankSuffix = "in cat.";
  if (detail.categoryName === "Miglior Canzone") rankSuffix = "";
  else if (detail.categoryName === "Peggior Canzone") rankSuffix = "peggiore";

  const rankText = !leaderboardLockedAdmin && detail.actualCategoryRank && detail.actualCategoryRank > 0
    ? `(${detail.actualCategoryRank}°${rankSuffix})`
    : "";
  const titleText = `${detail.categoryName}: ${pickedNationFullDetails?.name || 'N/D'}${rankText}${!leaderboardLockedAdmin ? ` Punti: ${detail.pointsAwarded}`: ''}`;

  return (
    <div className={cn("px-2 py-1.5", isEvenRow && "bg-muted/50 rounded-md")}>
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5">
            <IconComponent className={cn("h-5 w-5 flex-shrink-0", iconColorClass)} />
            <span className="text-xs text-foreground/90 min-w-[120px] flex-shrink-0 font-medium">{detail.categoryName}</span>
          </div>
          {!leaderboardLockedAdmin && typeof detail.pointsAwarded === 'number' && (
            <span className={cn(
              "text-xs ml-auto pl-1",
              detail.pointsAwarded > 0 ? "font-semibold text-primary" : "text-muted-foreground"
            )}>
              {detail.pointsAwarded > 0 ? `+${detail.pointsAwarded}pt` : `${detail.pointsAwarded}pt`}
            </span>
          )}
        </div>
        <div className={cn(
          "w-full mt-1",
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
                  className="rounded-sm border border-border/30 object-contain flex-shrink-0 mr-1.5"
                  data-ai-hint={`${pickedNationFullDetails.name} flag icon`}
                />
              ) : (
                <div className="w-5 h-[13px] flex-shrink-0 bg-muted/20 rounded-sm mr-1.5"></div>
              )}
              <div className="flex flex-col items-start">
                <Link href={`/nations/${pickedNationFullDetails.id}`}
                  className="group text-xs hover:underline hover:text-primary flex items-center gap-1"
                  title={titleText}
                >
                  <span className="font-medium">{pickedNationFullDetails.name}</span>
                  {!leaderboardLockedAdmin && <MedalIcon rank={detail.actualCategoryRank} className="ml-0.5" />}
                  {rankText && (
                    <span className="text-muted-foreground ml-0.5 text-xs">{rankText}</span>
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
              <UserCircle className="h-4 w-4 flex-shrink-0" />
              <span>Nessuna selezione</span>
            </div>
          )}
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
  isEvenRow,
  leaderboardLocked,
  actualEurovisionRank,
  allNations,
  globalScoreForCategory,
}: {
  nation?: Nation;
  IconComponent: React.ElementType;
  label?: string;
  isCorrectPick?: boolean;
  categoryRank?: number;
  isEvenRow?: boolean;
  leaderboardLocked: boolean | null;
  actualEurovisionRank?: number | null;
  allNations: Nation[];
  globalScoreForCategory?: number | null;
}) => {
  const iconColor = isCorrectPick && !leaderboardLocked ? "text-accent" : "text-accent";

  const NationInfoContent = ({ nationData, rank, isCategoryRank, euroRank }: {
    nationData?: Nation;
    rank?: number;
    isCategoryRank?: boolean;
    euroRank?: number | null;
  }) => {
    if (!nationData) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <UserCircle className="h-4 w-4 flex-shrink-0" />
          <span>Nessuna selezione</span>
        </div>
      );
    }

    let rankTextToDisplay = "";
    let rankSuffix = "in cat.";
    if (isCategoryRank) {
      if (label === "Miglior Canzone") rankSuffix = "";
      else if (label === "Peggior Canzone") rankSuffix = "peggiore";
    }

    const currentRankToDisplay = isCategoryRank ? rank : euroRank;

    if (!leaderboardLocked && currentRankToDisplay && currentRankToDisplay > 0) {
      rankTextToDisplay = `(${currentRankToDisplay}°${isCategoryRank ? `${rankSuffix}` : ''})`;
    }

    const titleText = `${nationData.name}${rankTextToDisplay ? ` ${rankTextToDisplay}` : ''}${nationData.artistName ? ` - ${nationData.artistName}` : ''}${nationData.songTitle ? ` - ${nationData.songTitle}` : ''}`;

    return (
       <div className="flex items-center gap-1.5">
        {nationData.countryCode && (
          <Image
            src={`https://flagcdn.com/w20/${nationData.countryCode.toLowerCase()}.png`}
            alt={nationData.name || "Bandiera Nazione"}
            width={20}
            height={13}
            className="rounded-sm border border-border/30 object-contain flex-shrink-0"
            data-ai-hint={`${nationData.name} flag icon`}
          />
        )}
        <div className="flex flex-col items-start">
          <Link
            href={`/nations/${nationData.id}`}
            className="group text-xs hover:underline hover:text-primary flex items-center gap-1"
            title={titleText}
          >
            <span className="font-medium">{nationData.name}</span>
            {!leaderboardLocked && isCategoryRank && <MedalIcon rank={currentRankToDisplay} className="ml-0.5" />}
            {!leaderboardLocked && !isCategoryRank && <MedalIcon rank={euroRank} className="ml-0.5" />}
            {rankTextToDisplay && (
              <span className="text-muted-foreground text-xs ml-0.5">{rankTextToDisplay}</span>
            )}
          </Link>
           {(nationData.artistName || nationData.songTitle) && (
              <span className="text-xs text-muted-foreground/80 block">
                  {nationData.artistName}{nationData.artistName && nationData.songTitle && " - "}{nationData.songTitle}
              </span>
          )}
        </div>
      </div>
    );
  };
  
  const mainContainerClasses = cn(
    "px-2 py-1.5",
    isEvenRow && "bg-muted/50 rounded-md",
    label ? "flex flex-col items-start sm:flex-row sm:items-center gap-1" : "flex items-center gap-1.5"
  );
  
  const labelAndIconContainerClasses = cn(
    "flex items-center gap-1.5",
    label && "w-full sm:w-auto"
  );
  
  const nationInfoContainerOuterClasses = cn(
    "w-full",
    label && "mt-1 sm:mt-0",
    label && "sm:ml-[calc(1.25rem+0.375rem)]" // 1.25rem for icon w-5, 0.375rem for gap-1.5
  );


  return (
    <div className={mainContainerClasses}>
      <div className={labelAndIconContainerClasses}>
        <IconComponent className={cn("h-5 w-5 flex-shrink-0", iconColor)} />
        {label && <span className="text-xs text-foreground/90 min-w-[120px] flex-shrink-0 font-medium">{label}</span>}
      </div>
      <div className={nationInfoContainerOuterClasses}>
         <NationInfoContent 
            nationData={nation} 
            rank={categoryRank} 
            isCategoryRank={!!label}
            euroRank={actualEurovisionRank}
          />
      </div>
    </div>
  );
});
SelectedNationDisplay.displayName = 'SelectedNationDisplay';


interface TeamListItemProps {
  team: TeamWithScore & {
    isTied?: boolean;
    isOwnTeamCard?: boolean;
    primaSquadraDetails?: GlobalPrimaSquadraDetail[];
    categoryPicksDetails?: GlobalCategoryPickDetailType[];
  };
  allNations: Nation[];
  nationGlobalCategorizedScoresArray?: [string, NationGlobalCategorizedScores][];
  disableEdit?: boolean;
  isLeaderboardPodiumDisplay?: boolean;
}


export function TeamListItem({
  team,
  allNations,
  nationGlobalCategorizedScoresArray,
  disableEdit = false,
  isLeaderboardPodiumDisplay = false,
  isOwnTeamCard = false,
}: TeamListItemProps) {
  const { user } = useAuth();
  const [teamsLocked, setTeamsLocked] = useState<boolean | null>(null);
  const [leaderboardLockedAdmin, setLeaderboardLockedAdmin] = useState<boolean | null>(null);
  const [isLoadingAdminSettings, setIsLoadingAdminSettings] = useState(true);

  const [categoryRanksAndCorrectness, setCategoryRanksAndCorrectness] = useState<{
    [key: string]: { rank?: number; isCorrectPick?: boolean };
  }>({});

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

  const nationGlobalCategorizedScoresMap = useMemo(() => {
    if (!nationGlobalCategorizedScoresArray || nationGlobalCategorizedScoresArray.length === 0) {
        return new Map<string, NationGlobalCategorizedScores>();
    }
    return new Map(nationGlobalCategorizedScoresArray);
  }, [nationGlobalCategorizedScoresArray]);


  useEffect(() => {
    if (!nationGlobalCategorizedScoresMap || nationGlobalCategorizedScoresMap.size === 0 || !allNations || allNations.length === 0) {
        setCategoryRanksAndCorrectness({});
        return;
    }

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
      newRanks['Music2'] = { rank, isCorrectPick: !leaderboardLockedAdmin && rank === 1 };
    }
    if (team.worstSongNationId) {
      const rank = getRank(team.worstSongNationId, worstSongNations);
      newRanks['ThumbsDown'] = { rank, isCorrectPick: !leaderboardLockedAdmin && rank === 1 };
    }
    if (team.bestPerformanceNationId) {
      const rank = getRank(team.bestPerformanceNationId, bestPerfNations);
      newRanks['Star'] = { rank, isCorrectPick: !leaderboardLockedAdmin && rank === 1 };
    }
    if (team.bestOutfitNationId) {
      const rank = getRank(team.bestOutfitNationId, bestOutfitNations);
      newRanks['Shirt'] = { rank, isCorrectPick: !leaderboardLockedAdmin && rank === 1 };
    }
    setCategoryRanksAndCorrectness(newRanks);
  }, [nationGlobalCategorizedScoresMap, allNations, team.bestSongNationId, team.worstSongNationId, team.bestPerformanceNationId, team.bestOutfitNationId, leaderboardLockedAdmin]);


  const isOwner = user?.uid === team.userId;

  const borderClass =
    isLeaderboardPodiumDisplay && !leaderboardLockedAdmin && team.rank && team.rank <=3 ?
      (team.rank === 1 ? "border-yellow-400 border-2 shadow-yellow-400/30" :
       team.rank === 2 ? "border-slate-400 border-2 shadow-slate-400/30" :
       "border-amber-500 border-2 shadow-amber-500/30")
    : "border-border";

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
    { teamPickNationId: team.bestSongNationId, Icon: Music2, label: "Miglior Canzone", rankInfoKey: 'Music2' },
    { teamPickNationId: team.bestPerformanceNationId, Icon: Star, label: "Miglior Performance", rankInfoKey: 'Star' },
    { teamPickNationId: team.bestOutfitNationId, Icon: Shirt, label: "Miglior Outfit", rankInfoKey: 'Shirt' },
    { teamPickNationId: team.worstSongNationId, Icon: ThumbsDown, label: "Peggior Canzone", rankInfoKey: 'ThumbsDown' },
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
            <div className="flex items-baseline justify-between w-full">
                 <CardTitle className="text-xl text-primary flex items-center gap-2">
                    <Users className="h-5 w-5 text-accent" />
                    {team.name}
                </CardTitle>
                 {typeof team.score === 'number' && !leaderboardLockedAdmin && (
                  <div className="text-lg font-bold text-primary whitespace-nowrap">
                    {team.score} pt
                  </div>
                )}
            </div>
             <div className="flex items-baseline justify-between w-full">
                {team.creatorDisplayName && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <UserCircle className="h-3 w-3" />{team.creatorDisplayName}
                    </div>
                )}
                 <div className={cn("text-sm font-semibold flex items-center", rankTextColorClass)}>
                    <MedalIcon rank={team.rank} className="mr-1" />
                    {getRankText(team.rank)}
                    {team.isTied && <span className="ml-1.5 text-xs text-muted-foreground">(Pari merito)</span>}
                </div>
            </div>
          </>
        ) : (
          // DEFAULT CARD HEADER (e.g., for "La Mia Squadra" on /teams page)
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
                isOwnTeamCard && "flex-row items-center gap-2"
            )}>
                {typeof team.score === 'number' && !leaderboardLockedAdmin && (
                    <div className={cn(
                        "text-lg font-bold text-primary whitespace-nowrap",
                        isOwnTeamCard && "order-2"
                    )}>
                    {team.score} pt
                    </div>
                )}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-grow space-y-1 pt-2 pb-4 px-4">
        { (team.primaSquadraDetails && team.categoryPicksDetails) ? (
          <>
            <div className={cn("pb-3", hasTreppoScorePredictions && isLeaderboardPodiumDisplay && "border-b border-border")}>
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
              <div className={cn("pt-3", isLeaderboardPodiumDisplay && "mt-3 pt-0")}>
                <p className="text-lg font-bold text-secondary mt-0 mb-1">
                  Pronostici TreppoScore
                </p>
                {(team.categoryPicksDetails || []).map((detail, index) => (
                   <CategoryPickDisplayDetailPodium
                      key={`${team.id}-${detail.categoryName}-detail-${index}`}
                      detail={detail}
                      allNations={allNations}
                      leaderboardLockedAdmin={leaderboardLockedAdmin}
                      isEvenRow={index % 2 !== 0}
                    />
                ))}
              </div>
            )}
          </>
        ) : (
          // Simpler display for other contexts (e.g., general team list if details not pre-calculated)
          <>
            <p className="text-lg font-bold text-foreground mt-2 mb-1">
             {isOwnTeamCard ? "Pronostici TreppoVision" : "Scelte Principali"}
            </p>
            {sortedFounderNationsDetails.map((nationDetail, index) => {
                const nation = allNations.find(n => n.id === nationDetail.id);
                const rankInfo = categoryRanksAndCorrectness['BadgeCheck'] || {};
                return (
                    <SelectedNationDisplay
                        key={`founder-${nationDetail.id}-${index}`}
                        nation={nation}
                        IconComponent={BadgeCheck}
                        allNations={allNations}
                        isEvenRow={index % 2 !== 0}
                        leaderboardLocked={leaderboardLockedAdmin}
                        actualEurovisionRank={!leaderboardLockedAdmin && nation ? nation.ranking : undefined}
                        categoryRank={!leaderboardLockedAdmin ? rankInfo.rank : undefined}
                        isCorrectPick={rankInfo.isCorrectPick || false}
                    />
                );
            })}
             {hasTreppoScorePredictions && (
                <div className="mt-4 pt-3 border-t border-border/30">
                    <p className="text-lg font-bold text-secondary mb-1">
                        Pronostici TreppoScore
                    </p>
                    {treppoScorePicksForDisplay.map((category, index) => {
                        const nation = allNations.find(n => n.id === category.teamPickNationId);
                        const rankInfo = categoryRanksAndCorrectness[category.rankInfoKey] || {};
                        const nationScores = nation ? nationGlobalCategorizedScoresMap.get(nation.id) : null;
                        let globalScoreForCategory: number | null = null;
                        if (nationScores) {
                          switch (category.label) {
                            case "Miglior Canzone": globalScoreForCategory = nationScores.averageSongScore; break;
                            case "Miglior Performance": globalScoreForCategory = nationScores.averagePerformanceScore; break;
                            case "Miglior Outfit": globalScoreForCategory = nationScores.averageOutfitScore; break;
                            case "Peggior Canzone": globalScoreForCategory = nationScores.averageSongScore; break;
                          }
                        }

                        return (
                            <SelectedNationDisplay
                                key={category.label}
                                nation={nation}
                                IconComponent={category.Icon}
                                label={category.label}
                                allNations={allNations}
                                isEvenRow={index % 2 !== 0}
                                categoryRank={!leaderboardLockedAdmin ? rankInfo.rank : undefined}
                                isCorrectPick={rankInfo.isCorrectPick || false}
                                leaderboardLocked={leaderboardLockedAdmin}
                                globalScoreForCategory={globalScoreForCategory}
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
