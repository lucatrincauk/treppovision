
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
import React, { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const getRankText = (rank?: number): string => {
  if (rank === undefined || rank === null || rank <= 0) return "";
  switch (rank) {
    case 1: return "Primo Posto";
    case 2: return "Secondo Posto";
    case 3: return "Terzo Posto";
    default: return `${rank}° Posto`;
  }
};


// Helper for detailed nation display within "Pronostici TreppoVision" on podium cards
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

  const MedalIcon = ({ rank, className }: { rank?: number, className?: string }) => {
    if (leaderboardLocked || rank === undefined || rank === null || rank === 0 || rank > 3) return null;
    let colorClass = "";
    if (rank === 1) colorClass = "text-yellow-400";
    else if (rank === 2) colorClass = "text-slate-400";
    else if (rank === 3) colorClass = "text-amber-500";
    return <Award className={cn("w-3.5 h-3.5 flex-shrink-0", colorClass, className)} />;
  };

  const rankText = !leaderboardLocked && detail.actualRank && detail.actualRank > 0
    ? `(${detail.actualRank}°)`
    : "";
  const titleText = `${detail.name}${rankText ? ` ${rankText}` : ''}${nationData?.artistName ? ` - ${nationData.artistName}` : ''}${nationData?.songTitle ? ` - ${nationData.songTitle}` : ''}${!leaderboardLocked && typeof detail.points === 'number' ? ` Punti: ${detail.points}`: ''}`;

  return (
    <div className={cn(
      "px-2 py-1.5 flex items-center justify-between",
      isEvenRow && "bg-muted/50 rounded-md"
    )}>
      <div className="flex items-center gap-1.5"> {/* Icon + Text block container */}
        <BadgeCheck className="w-5 h-5 text-accent flex-shrink-0" /> {/* Icon */}
        <div className="flex flex-col items-start"> {/* Text block (Nation + Artist/Song) */}
          <Link // Nation Name/Rank Link
            href={`/nations/${detail.id}`}
            className="group text-xs hover:underline hover:text-primary flex items-center gap-1"
            title={titleText}
          >
            {nationData?.countryCode && (
              <Image
                src={`https://flagcdn.com/w20/${nationData.countryCode.toLowerCase()}.png`}
                alt={detail.name}
                width={20}
                height={13}
                className="rounded-sm border border-border/30 object-contain flex-shrink-0"
                data-ai-hint={`${detail.name} flag icon`}
              />
            )}
            <span className="font-medium">{detail.name}</span>
            <MedalIcon rank={detail.actualRank} className="ml-0.5" />
            {rankText && (
              <span className="text-muted-foreground text-xs ml-0.5">{rankText}</span>
            )}
          </Link>
          { (nationData?.artistName || nationData?.songTitle) && ( // Artist/Song line
            <span className="text-xs text-muted-foreground/80 block pl-6">
              {nationData.artistName}{nationData.artistName && nationData.songTitle && " - "}{nationData.songTitle}
            </span>
          )}
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


// Helper for detailed "Pronostici TreppoScore" display on podium cards
const CategoryPickDisplayDetailPodium = React.memo(({
  detail,
  allNations,
  leaderboardLocked,
  isEvenRow,
}: {
  detail: GlobalCategoryPickDetailType;
  allNations: Nation[];
  leaderboardLocked: boolean | null;
  isEvenRow?: boolean;
}) => {
  let IconComponent: React.ElementType;
  let iconColorClass = "text-accent"; // Default yellow

  switch (detail.iconName) {
    case 'Music2': IconComponent = Music2; break;
    case 'Star': IconComponent = Star; iconColorClass = "text-accent"; break; // Explicitly yellow
    case 'Shirt': IconComponent = Shirt; break;
    case 'ThumbsDown': IconComponent = ThumbsDown; break;
    default: IconComponent = Info;
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

  let rankInCategoryText = "";
  if (!leaderboardLocked && detail.actualCategoryRank && detail.actualCategoryRank > 0) {
    if (detail.categoryName === "Miglior Canzone") rankInCategoryText = `(${detail.actualCategoryRank}°)`;
    else if (detail.categoryName === "Peggior Canzone") rankInCategoryText = `(${detail.actualCategoryRank}° peggiore)`;
    else rankInCategoryText = `(${detail.actualCategoryRank}° in cat.)`;
  }
  const titleText = `${detail.categoryName}: ${pickedNationFullDetails?.name || 'N/D'}${rankInCategoryText}${!leaderboardLocked && detail.pickedNationScoreInCategory ? ` (Score: ${detail.pickedNationScoreInCategory.toFixed(2)})` : ''}${!leaderboardLocked ? ` Punti: ${detail.pointsAwarded}`: ''}`;

  return (
    <div className={cn(
      "px-2 py-1.5",
      isEvenRow && "bg-muted/50 rounded-md"
    )}>
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center justify-between w-full">
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
          "w-full mt-1",
          "pl-4 sm:ml-[calc(1.25rem+0.375rem)] sm:pl-0" // padding-left for mobile, margin-left for sm+
        )}>
          <div className="flex flex-col items-start gap-0">
            {pickedNationFullDetails ? (
              <>
                <Link href={`/nations/${pickedNationFullDetails.id}`}
                  className="text-xs hover:underline hover:text-primary flex items-center gap-1"
                  title={titleText}
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
                  <CategoryMedalIcon rank={detail.actualCategoryRank} className="ml-0.5" />
                  {rankInCategoryText && (
                      <span className="text-muted-foreground ml-0.5 text-xs">
                          {rankInCategoryText}
                      </span>
                  )}
                </Link>
                 {(pickedNationFullDetails.artistName || pickedNationFullDetails.songTitle) && (
                    <span className="text-xs text-muted-foreground/80 block pl-6">
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


// Fallback/Simpler display for "SelectedNationDisplay" when not on podium or detailed view
const SelectedNationDisplay = React.memo(({
  nation,
  IconComponent,
  label,
  isCorrectPick,
  categoryRank,
  isEvenRow,
  leaderboardLocked,
  actualEurovisionRank,
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
  globalScoreForCategory?: number | null;
}) => {
  const iconColor = isCorrectPick && !leaderboardLocked ? "text-accent" : "text-accent"; // Always accent for consistency now

  const mainContainerClasses = cn(
    "px-2 py-1",
    isEvenRow && "bg-muted/50 rounded-md",
    label ? "flex-col items-start gap-1 py-1.5" : "flex items-center gap-1.5", // Default flex-row for non-labeled
    label && "sm:flex-row sm:items-center sm:gap-1.5 sm:py-1" // Responsive for labeled
  );

  const labelAndIconContainerClasses = cn(
    "flex items-center gap-1.5",
    label && "w-full sm:w-auto"
  );

  const NationInfoContent = ({ nation, rank, isCategoryRank, scoreForCategory, euroRank, showEuroRank }: {
    nation?: Nation;
    rank?: number;
    isCategoryRank?: boolean;
    scoreForCategory?: number | null;
    euroRank?: number | null;
    showEuroRank?: boolean;
  }) => {
    if (!nation) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <UserCircle className="h-4 w-4 flex-shrink-0" />
          <span>Nessuna selezione</span>
        </div>
      );
    }

    let rankText = "";
    let scoreText = "";
    if (isCategoryRank && !leaderboardLocked && rank && rank > 0) {
      if (label === "Miglior Canzone") rankText = `(${rank}°)`;
      else if (label === "Peggior Canzone") rankText = `(${rank}° peggiore)`;
      else rankText = `(${rank}° in cat.)`;
    } else if (showEuroRank && !leaderboardLocked && euroRank && euroRank > 0) {
        rankText = `(${euroRank}°)`;
    }
    
    const titleText = `${nation.name}${rankText ? ` ${rankText}` : ''}${nation.artistName ? ` - ${nation.artistName}` : ''}${nation.songTitle ? ` - ${nation.songTitle}` : ''}${scoreForCategory ? ` Score: ${scoreForCategory.toFixed(2)}` : ''}`;

    const MedalIconDisplay = ({ rankValue, className }: { rankValue?: number, className?: string }) => {
      if (leaderboardLocked || rankValue === undefined || rankValue === null || rankValue === 0 || rankValue > 3) return null;
      let colorClass = "";
      if (rankValue === 1) colorClass = "text-yellow-400";
      else if (rankValue === 2) colorClass = "text-slate-400";
      else if (rankValue === 3) colorClass = "text-amber-500";
      return <Award className={cn("w-3.5 h-3.5 flex-shrink-0", colorClass, className)} />;
    };
    
    const rankToUseForMedal = isCategoryRank ? rank : euroRank;

    return (
      <div className="flex flex-col items-start gap-0">
        <Link
          href={`/nations/${nation.id}`}
          className="group text-xs hover:underline hover:text-primary flex items-center gap-1"
          title={titleText}
        >
          {nation.countryCode && (
            <Image
              src={`https://flagcdn.com/w20/${nation.countryCode.toLowerCase()}.png`}
              alt={nation.name || "Bandiera Nazione"}
              width={20}
              height={13}
              className="rounded-sm border border-border/30 object-contain flex-shrink-0"
              data-ai-hint={`${nation.name} flag icon`}
            />
          )}
          <span className="font-medium">{nation.name}</span>
          <MedalIconDisplay rankValue={rankToUseForMedal} className="ml-0.5" />
           {rankText && (
            <span className="text-muted-foreground text-xs ml-0.5">{rankText}</span>
          )}
        </Link>
        {(nation.artistName || nation.songTitle) && (
            <span className="text-xs text-muted-foreground/80 block pl-6">
                {nation.artistName}{nation.artistName && nation.songTitle && " - "}{nation.songTitle}
            </span>
        )}
      </div>
    );
  };
  
  const nationInfoContainerOuterClasses = cn(
    "w-full",
    label && "mt-1 sm:mt-0", // Creates newline on mobile for labeled items
    label && "sm:ml-[calc(1.25rem+0.375rem)]" // Indent beside label on sm+
  );

  return (
    <div className={mainContainerClasses}>
      <div className={labelAndIconContainerClasses}>
        <IconComponent className={cn("h-5 w-5 flex-shrink-0", iconColor)} />
        {label && <span className="text-xs text-foreground/90 min-w-[120px] flex-shrink-0 font-medium">{label}</span>}
      </div>
      <div className={nationInfoContainerOuterClasses}>
         <NationInfoContent 
            nation={nation} 
            rank={categoryRank} 
            isCategoryRank={!!label}
            scoreForCategory={globalScoreForCategory}
            euroRank={actualEurovisionRank}
            showEuroRank={!label} // Only show euro rank if it's not a category pick
          />
      </div>
    </div>
  );
});
SelectedNationDisplay.displayName = 'SelectedNationDisplay';


interface TeamListItemProps {
  team: TeamWithScore & {
    isTied?: boolean; // For leaderboard display
    isOwnTeamCard?: boolean; // To alter display for the user's own team card
    primaSquadraDetails?: GlobalPrimaSquadraDetail[]; // For detailed view (podium/own team)
    categoryPicksDetails?: GlobalCategoryPickDetailType[]; // For detailed view
  };
  allNations: Nation[];
  nationGlobalCategorizedScoresArray: [string, NationGlobalCategorizedScores][]; // Changed from Map to Array
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
  const [leaderboardLockedAdmin, setLeaderboardLockedAdmin] = useState<boolean | null>(null);
  const [isLoadingAdminSettings, setIsLoadingAdminSettings] = useState(true);

  const [categoryRanksAndCorrectness, setCategoryRanksAndCorrectness] = useState<{
    [key: string]: { rank?: number; isCorrectPick?: boolean; globalScore?: number | null };
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
        setTeamsLocked(false); // Default to unlocked on error
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

    const getRankAndScore = (nationId?: string, sortedList?: Array<{ id: string, score: number | null }>): { rank?: number; score?: number | null } => {
      if (!nationId || !sortedList || sortedList.length === 0) return { rank: undefined, score: null };
      const rankIndex = sortedList.findIndex(n => n.id === nationId);
      const actualRank = rankIndex !== -1 ? rankIndex + 1 : undefined;
      const actualScore = actualRank !== undefined && rankIndex < sortedList.length ? sortedList[rankIndex].score : null;
      return { rank: actualRank, score: actualScore };
    };

    const newRanks: typeof categoryRanksAndCorrectness = {};

    const bestSongNations = getSortedList('averageSongScore', 'desc');
    const worstSongNations = getSortedList('averageSongScore', 'asc');
    const bestPerfNations = getSortedList('averagePerformanceScore', 'desc');
    const bestOutfitNations = getSortedList('averageOutfitScore', 'desc');

    if (team.bestSongNationId) {
      const {rank, score} = getRankAndScore(team.bestSongNationId, bestSongNations);
      newRanks['Music2'] = { rank, isCorrectPick: rank === 1, globalScore: score };
    }
    if (team.worstSongNationId) {
      const {rank, score} = getRankAndScore(team.worstSongNationId, worstSongNations);
      newRanks['ThumbsDown'] = { rank, isCorrectPick: rank === 1, globalScore: score };
    }
    if (team.bestPerformanceNationId) {
      const {rank, score} = getRankAndScore(team.bestPerformanceNationId, bestPerfNations);
      newRanks['Star'] = { rank, isCorrectPick: rank === 1, globalScore: score };
    }
    if (team.bestOutfitNationId) {
      const {rank, score} = getRankAndScore(team.bestOutfitNationId, bestOutfitNations);
      newRanks['Shirt'] = { rank, isCorrectPick: rank === 1, globalScore: score };
    }
    setCategoryRanksAndCorrectness(newRanks);
  }, [nationGlobalCategorizedScoresMap, allNations, team.bestSongNationId, team.worstSongNationId, team.bestPerformanceNationId, team.bestOutfitNationId]);


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
  
  const MedalIcon = ({ rank, className }: { rank?: number, className?: string }) => {
    if (leaderboardLockedAdmin || rank === undefined || rank === null || rank === 0 || rank > 3) return null;
    let colorClass = "";
    if (rank === 1) colorClass = "text-yellow-400";
    else if (rank === 2) colorClass = "text-slate-400";
    else if (rank === 3) colorClass = "text-amber-500";
    return <Award className={cn("w-4 h-4 flex-shrink-0", colorClass, className)} />;
  };


  return (
    <Card className={cn(
      "flex flex-col h-full shadow-lg hover:shadow-primary/20 transition-shadow duration-300",
      borderClass
    )}>
       <CardHeader className={cn(
          "pb-3 pt-4 px-4",
           (isLeaderboardPodiumDisplay || isOwnTeamCard) && (team.primaSquadraDetails || team.categoryPicksDetails) && "border-b border-border"
        )}>
        {isLeaderboardPodiumDisplay ? (
           <div className="flex flex-col">
             {/* Row 1: Team Name & Score */}
            <div className="flex items-baseline justify-between w-full mb-1">
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
            {/* Row 2: Owner & Rank */}
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
                {getRankText(team.rank)}
                {team.isTied && <span className="ml-1.5 text-xs text-muted-foreground">(Pari merito)</span>}
              </div>
            </div>
          </div>
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
        { (isLeaderboardPodiumDisplay || (isOwnTeamCard && team.primaSquadraDetails && team.categoryPicksDetails)) ? (
          <>
            <div className={cn("pb-3", (isLeaderboardPodiumDisplay || isOwnTeamCard) && hasTreppoScorePredictions && "border-b border-border")}>
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
              <div className={cn( "pt-3")}>
                <p className="text-lg font-bold text-secondary mt-3 pt-0 mb-1">
                  Pronostici TreppoScore
                </p>
                {(team.categoryPicksDetails || []).map((detail, index) => (
                   <CategoryPickDisplayDetailPodium
                      key={`${team.id}-${detail.categoryName}-detail-${index}`}
                      detail={detail}
                      allNations={allNations}
                      leaderboardLocked={leaderboardLockedAdmin}
                      isEvenRow={index % 2 !== 0}
                    />
                ))}
              </div>
            )}
          </>
        ) : (
          // Fallback simpler display if detailed props are not available for non-podium/non-own-team cards
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
                        leaderboardLocked={leaderboardLockedAdmin}
                        actualEurovisionRank={nation?.ranking}
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
