
"use client";

import type { Team, Nation, NationGlobalCategorizedScores, GlobalPrimaSquadraDetail as GlobalPrimaSquadraDetailType, GlobalCategoryPickDetail as GlobalCategoryPickDetailType, TeamWithScore } from "@/types";
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

// Helper function to convert numerical rank to text
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

const MedalIcon = React.memo(({ rank, className }: { rank?: number, className?: string }) => {
  if (rank === undefined || rank === null || rank === 0 || rank > 3) return null;
  let colorClass = "";
  if (rank === 1) colorClass = "text-yellow-400";
  else if (rank === 2) colorClass = "text-slate-400";
  else if (rank === 3) colorClass = "text-amber-500";
  return <Award className={cn("w-3.5 h-3.5 shrink-0", colorClass, className)} />;
});
MedalIcon.displayName = 'MedalIcon';


const PrimaSquadraNationDisplayDetailPodium = React.memo(({
  detail,
  allNations,
  leaderboardLocked,
  isEvenRow,
}: {
  detail: GlobalPrimaSquadraDetailType;
  allNations: Nation[];
  leaderboardLocked: boolean | null;
  isEvenRow?: boolean;
}) => {
  const nationData = allNations.find(n => n.id === detail.id);
  const rankText = !leaderboardLocked && detail.actualRank && detail.actualRank > 0
    ? `(${detail.actualRank}°)`.trim()
    : "";
  const titleText = `${detail.name}${rankText ? ` ${rankText}` : ''}${nationData?.artistName ? ` - ${nationData.artistName}` : ''}${nationData?.songTitle ? ` - ${nationData.songTitle}` : ''}${!leaderboardLocked && typeof detail.points === 'number' ? ` Punti: ${detail.points}`: ''}`;

  return (
    <div className={cn(
      "px-2 py-1 flex items-start justify-between w-full",
      isEvenRow && "bg-muted/50 rounded-md"
    )}>
      <div className="flex items-center gap-1.5"> {/* Main container for icon, flag, text */}
          <BadgeCheck className="w-5 h-5 text-accent shrink-0" /> {/* Icon is a direct child */}
          
          {/* Container for Flag and Text Block, aligned with Icon */}
          <div className="flex items-center gap-1.5"> 
            {nationData?.countryCode ? (
                <Image
                    src={`https://flagcdn.com/w20/${nationData.countryCode.toLowerCase()}.png`}
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
                    {rankText && !leaderboardLocked && (
                    <span className="text-muted-foreground text-xs ml-0.5">{rankText}</span>
                    )}
                </Link>
                {(nationData?.artistName || nationData?.songTitle) && (
                     <span className="text-xs text-muted-foreground/80 block pl-0"> {/* No extra padding needed if flag handles spacing */}
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

  let rankSuffix = "";
  if (detail.categoryName === "Peggior Canzone") {
    rankSuffix = " peggiore";
  }
  
  const rankText = !leaderboardLockedAdmin && detail.actualCategoryRank && detail.actualCategoryRank > 0
    ? `(${detail.actualCategoryRank}°${rankSuffix})`.trim()
    : "";
  const titleText = `${detail.categoryName}: ${pickedNationFullDetails?.name || 'N/D'}${rankText}${!leaderboardLockedAdmin && typeof detail.pointsAwarded === 'number' ? ` Punti: ${detail.pointsAwarded}`: ''}`;

  return (
     <div className={cn(
        "px-2 py-1.5",
        isEvenRow && "bg-muted/50 rounded-md"
      )}>
      <div className="flex flex-col gap-0.5"> 
        <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5">
                <IconComponent className={cn("h-5 w-5 shrink-0", iconColorClass)} />
                <span className="text-xs text-foreground/90 min-w-[120px] shrink-0 font-medium">{detail.categoryName}</span>
            </div>
          {!leaderboardLockedAdmin && typeof detail.pointsAwarded === 'number' && (
             <span className={cn("text-xs ml-auto pl-1", detail.pointsAwarded > 0 ? "font-semibold text-primary" : "text-muted-foreground")}>
              {detail.pointsAwarded > 0 ? `+${detail.pointsAwarded}pt` : `${detail.pointsAwarded}pt`}
            </span>
          )}
        </div>

        <div className={cn("w-full mt-1 pl-[1.625rem]")}> {/* Consistent indent */}
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
                  <div className="w-5 h-[13px] shrink-0 bg-muted/20 rounded-sm"></div>
                )}
                <div className="flex flex-col items-start"> 
                    <Link href={`/nations/${pickedNationFullDetails.id}`}
                        className="group text-xs hover:underline hover:text-primary flex items-center gap-1"
                        title={titleText}
                    >
                        <span className="font-medium">
                          {pickedNationFullDetails.name}
                        </span>
                        {!leaderboardLockedAdmin && detail.actualCategoryRank && [1,2,3].includes(detail.actualCategoryRank) && <MedalIcon rank={detail.actualCategoryRank} className="ml-0.5"/>}
                        {!leaderboardLockedAdmin && rankText && (
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


interface SelectedNationDisplayProps {
  nation?: Nation;
  IconComponent: React.ElementType;
  label?: string;
  isCorrectPick?: boolean;
  categoryRank?: number | null;
  leaderboardLocked: boolean | null;
  actualEurovisionRank?: number | null;
  isEvenRow?: boolean;
  globalScoreForCategory?: number | null; 
  isOwnTeamCard?: boolean;
  isLeaderboardPodiumDisplay?: boolean;
}

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
  isOwnTeamCard,
  isLeaderboardPodiumDisplay,
}: SelectedNationDisplayProps) => {

  const iconColorClass = (isCorrectPick && !leaderboardLocked && !isLeaderboardPodiumDisplay) ? "text-accent" : "text-accent";


  const NationInfoContent = ({
    nationData,
    rankToShow, 
    isCategoryPick, 
  }: {
    nationData?: Nation;
    rankToShow?: number | null;
    isCategoryPick?: boolean;
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
    let specificRankSuffix = "";

    if (isCategoryPick) { 
      if (label === "Peggior Canzone") specificRankSuffix = " peggiore";
    }
    
    if (!leaderboardLocked && rankToShow && rankToShow > 0) {
      rankTextToDisplay = `(${rankToShow}°${specificRankSuffix})`.trim();
    }
    
    const titleText = `${nationData.name}${rankTextToDisplay ? ` ${rankTextToDisplay}` : ''}${nationData.artistName ? ` - ${nationData.artistName}` : ''}${nationData.songTitle ? ` - ${nationData.songTitle}` : ''}`;

    const nameAndRankDisplay = (
      <div className="flex items-center gap-1">
        <span className="font-medium">{nationData.name}</span>
        {!leaderboardLocked && rankToShow && [1,2,3].includes(rankToShow) && (
          <MedalIcon rank={rankToShow} className="ml-0.5" />
        )}
        {rankTextToDisplay && (
          <span className="text-muted-foreground text-xs ml-0.5">{rankTextToDisplay}</span>
        )}
      </div>
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
            {nameAndRankDisplay}
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
    "px-2 py-1", 
    isEvenRow && "bg-muted/50 rounded-md"
  );

  if (label) { // "Pronostici TreppoScore" items
    return (
      <div className={cn(mainContainerClasses, "flex flex-col items-start sm:flex-row sm:items-center gap-1 py-1.5 sm:gap-1.5 sm:py-1")}>
          <div className="flex items-center gap-1.5 w-full sm:w-auto"> 
              <IconComponent className={cn("h-5 w-5 shrink-0", iconColorClass)} />
              <span className="text-xs text-foreground/90 min-w-[120px] shrink-0 font-medium">{label}</span>
          </div>
          <div className={cn("w-full sm:w-auto mt-1 sm:mt-0", isOwnTeamCard && "sm:ml-[calc(1.25rem+0.375rem)]")}> 
              <NationInfoContent
                  nationData={nation}
                  rankToShow={categoryRank}
                  isCategoryPick={true}
              />
          </div>
      </div>
    );
  }

  // "Pronostici TreppoVision" items
  return (
    <div className={cn(mainContainerClasses, "flex items-center gap-1.5")}>
       <IconComponent className={cn("h-5 w-5 shrink-0", iconColorClass)} />
       <NationInfoContent
          nationData={nation}
          rankToShow={actualEurovisionRank}
          isCategoryPick={false}
        />
    </div>
  );
});
SelectedNationDisplay.displayName = 'SelectedNationDisplay';


interface TeamListItemProps {
  team: TeamWithScore & { 
    isOwnTeamCard?: boolean;
    disableEdit?: boolean;
    isLeaderboardPodiumDisplay?: boolean;
  };
  allNations: Nation[];
  nationGlobalCategorizedScoresArray: [string, NationGlobalCategorizedScores][];
}


export function TeamListItem({
  team,
  allNations = [], 
  nationGlobalCategorizedScoresArray = [], 
  disableEdit = false,
  isOwnTeamCard = false,
  isLeaderboardPodiumDisplay = false,
}: TeamListItemProps) {
  const { user } = useAuth();
  const [teamsLocked, setTeamsLocked] = useState<boolean | null>(null);
  const [leaderboardLockedAdmin, setLeaderboardLockedAdmin] = useState<boolean | null>(null);
  const [isLoadingAdminSettings, setIsLoadingAdminSettings] = useState(true);
  
  const [categoryRanksAndCorrectness, setCategoryRanksAndCorrectness] = useState<{
    [key: string]: { rank?: number | null; isCorrectPick?: boolean };
  }>({});

  const nationGlobalCategorizedScoresMap = useMemo(() => {
    if (!nationGlobalCategorizedScoresArray || nationGlobalCategorizedScoresArray.length === 0) {
        return new Map<string, NationGlobalCategorizedScores>();
    }
    return new Map(nationGlobalCategorizedScoresArray);
  }, [nationGlobalCategorizedScoresArray]);

  const sortedFounderNationsDetails = useMemo(() => {
    if (team.primaSquadraDetails && team.primaSquadraDetails.length > 0) {
      return [...team.primaSquadraDetails].sort((a, b) => (a.actualRank ?? Infinity) - (b.actualRank ?? Infinity));
    }
    return (team.founderChoices || []).map(id => {
        const nation = allNations.find(n => n.id === id);
        return {
            id: id,
            name: nation?.name || 'Sconosciuto',
            countryCode: nation?.countryCode || 'xx',
            artistName: nation?.artistName,
            songTitle: nation?.songTitle,
            actualRank: nation?.ranking,
            points: 0 
        } as GlobalPrimaSquadraDetailType;
      }).sort((a, b) => (a.actualRank ?? Infinity) - (b.actualRank ?? Infinity));
  }, [team.primaSquadraDetails, team.founderChoices, allNations]);

  const treppoScorePicksForDisplay = useMemo(() => [
    { teamPickNationId: team.bestSongNationId, Icon: Music2, label: "Miglior Canzone", rankInfoKey: 'Music2', categoryKey: 'averageSongScore' },
    { teamPickNationId: team.bestPerformanceNationId, Icon: Star, label: "Miglior Performance", rankInfoKey: 'Star', categoryKey: 'averagePerformanceScore' },
    { teamPickNationId: team.bestOutfitNationId, Icon: Shirt, label: "Miglior Outfit", rankInfoKey: 'Shirt', categoryKey: 'averageOutfitScore' },
    { teamPickNationId: team.worstSongNationId, Icon: ThumbsDown, label: "Peggior Canzone", rankInfoKey: 'ThumbsDown', categoryKey: 'averageSongScore' },
  ].map(pick => {
      const nation = pick.teamPickNationId && allNations ? allNations.find(n => n.id === pick.teamPickNationId) : undefined;
      const rankInfo = categoryRanksAndCorrectness[pick.rankInfoKey] || {};
      
      let globalScoreForCategory: number | null = null;
      if (nation && nationGlobalCategorizedScoresMap.size > 0) {
        const scores = nationGlobalCategorizedScoresMap.get(nation.id);
        if (scores) {
            globalScoreForCategory = scores[pick.categoryKey as keyof Omit<NationGlobalCategorizedScores, 'overallAverageScore' | 'voteCount'>];
        }
      }

      return {
          ...pick,
          nation: nation,
          actualCategoryRank: rankInfo.rank,
          isCorrectPick: rankInfo.isCorrectPick || false,
          pickedNationName: nation?.name,
          pickedNationCountryCode: nation?.countryCode,
          pointsAwarded: 0, 
          iconName: pick.rankInfoKey, 
          globalScoreForCategory: globalScoreForCategory,
      } as GlobalCategoryPickDetailType & { Icon: React.ElementType, label: string, globalScoreForCategory: number | null, isCorrectPick: boolean, actualCategoryRank?: number | null };
  }), [team, allNations, categoryRanksAndCorrectness, nationGlobalCategorizedScoresMap]);


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
        newRanks['Music2'] = { rank, isCorrectPick: !leaderboardLockedAdmin && rank !== undefined && rank <=3 };
        }
        if (team.worstSongNationId) {
        const rank = getRank(team.worstSongNationId, worstSongNations);
        newRanks['ThumbsDown'] = { rank, isCorrectPick: !leaderboardLockedAdmin && rank !== undefined && rank <=3 };
        }
        if (team.bestPerformanceNationId) {
        const rank = getRank(team.bestPerformanceNationId, bestPerfNations);
        newRanks['Star'] = { rank, isCorrectPick: !leaderboardLockedAdmin && rank !== undefined && rank <=3 };
        }
        if (team.bestOutfitNationId) {
        const rank = getRank(team.bestOutfitNationId, bestOutfitNations);
        newRanks['Shirt'] = { rank, isCorrectPick: !leaderboardLockedAdmin && rank !== undefined && rank <=3 };
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
  
  const rankTextColorClass =
    isLeaderboardPodiumDisplay && !leaderboardLockedAdmin && team.rank && team.rank <=3 ?
      (team.rank === 1 ? "text-yellow-400" :
       team.rank === 2 ? "text-slate-400" :
       "text-amber-500")
    : "text-muted-foreground";

  if (isLoadingAdminSettings || !allNations || (isLeaderboardPodiumDisplay && !team.primaSquadraDetails && !team.categoryPicksDetails && team.rank && team.rank <=3) ) { 
    // Added check for team.rank <=3 to ensure podium specific data is waited for
    return (
      <Card className={cn(
        "flex flex-col h-full shadow-lg p-4 items-center justify-center",
        borderClass
      )}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-2 text-xs">Caricamento dettagli team...</p>
      </Card>
    );
  }
  
  const hasTreppoScorePredictions = team.bestSongNationId || team.bestPerformanceNationId || team.bestOutfitNationId || team.worstSongNationId;
  const renderDetailedView = isLeaderboardPodiumDisplay && team.primaSquadraDetails && team.categoryPicksDetails;


  return (
    <Card className={cn(
      "flex flex-col h-full shadow-lg hover:shadow-primary/20 transition-shadow duration-300",
      borderClass
    )}>
      <CardHeader className={cn(
          "pb-3 pt-4 px-4 space-y-0", // Removed conditional border and space-y-0 always
          isLeaderboardPodiumDisplay && "border-b border-border" 
        )}>
        {isLeaderboardPodiumDisplay ? (
           <>
            {/* Row 1: Team Name and Score */}
            <div className="flex items-baseline justify-between w-full">
                <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-accent" />
                    <CardTitle className="text-xl text-primary">{team.name}</CardTitle>
                </div>
                {typeof team.score === 'number' && !leaderboardLockedAdmin && (
                    <div className="text-lg font-bold text-primary whitespace-nowrap ml-2 shrink-0">
                    {team.score} pt
                    </div>
                )}
            </div>
            {/* Row 2: Team Owner and Rank */}
            <div className="flex items-baseline justify-between w-full text-xs"> 
                <div className="flex items-center gap-1 text-muted-foreground">
                    {team.creatorDisplayName && (
                        <>
                            <UserCircle className="h-3 w-3" />
                            <span>{team.creatorDisplayName}</span>
                        </>
                    )}
                </div>
                {!leaderboardLockedAdmin && team.rank && (
                    <div className={cn("font-semibold flex items-center", rankTextColorClass)}>
                        <MedalIcon rank={team.rank} className="mr-1" />
                        {getRankText(team.rank)}{team.isTied && "*"}
                    </div>
                )}
            </div>
          </>
        ) : ( // Default header for /teams page "La Mia Squadra" card
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
            <div className="flex flex-col items-end">
                {typeof team.score === 'number' && !leaderboardLockedAdmin && (
                    <div className="text-lg font-bold text-primary ml-2 shrink-0">
                        {team.score} pt
                    </div>
                )}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-grow space-y-1 pt-2 pb-4 px-4">
        { renderDetailedView ? (
          <>
            <div className={cn("mb-[15px] pb-3", (isLeaderboardPodiumDisplay || isOwnTeamCard) && "border-b border-border")}>
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
              <div className={cn("pt-0", (isLeaderboardPodiumDisplay || isOwnTeamCard) && "border-b border-border pb-3")}>
                <p className="text-lg font-bold text-secondary mt-0">
                  Pronostici TreppoScore
                </p>
                {team.categoryPicksDetails?.map((detail, index) => ( 
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
          <>
            <p className="text-lg font-bold text-primary mt-2 mb-1">
             Pronostici TreppoVision
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
                        isOwnTeamCard={isOwnTeamCard}
                        isLeaderboardPodiumDisplay={isLeaderboardPodiumDisplay}
                    />
                );
            })}
             {hasTreppoScorePredictions && (
                <div className={cn("mt-4 pt-3", isOwnTeamCard && "border-t border-border")}>
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
                                globalScoreForCategory={category.globalScoreForCategory}
                                isOwnTeamCard={isOwnTeamCard}
                                isLeaderboardPodiumDisplay={isLeaderboardPodiumDisplay}
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

