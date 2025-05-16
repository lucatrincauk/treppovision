
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

// Helper component for displaying a single nation selection with details (for "Pronostici TreppoVision")
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
  const MedalIcon = ({ rank }: { rank?: number }) => {
    if (leaderboardLocked || rank === undefined || rank === null || rank === 0) return null;
    if (rank === 1) return <Award className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 ml-1" />;
    if (rank === 2) return <Award className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 ml-1" />;
    if (rank === 3) return <Award className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 ml-1" />; 
    return null;
  };
  const nationData = allNations.find(n => n.id === detail.id);

  return (
    <div className={cn(
      "px-2 py-1.5", // Consistent padding
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
            {!leaderboardLocked && detail.actualRank ? <span className="text-muted-foreground ml-0.5 text-xs">({detail.actualRank}°)</span> : null}
          </Link>
          {nationData?.artistName && nationData?.songTitle && (
             <p className="text-[10px] text-muted-foreground block pl-[calc(20px+0.25rem+0.375rem)]" title={`${nationData.artistName} - ${nationData.songTitle}`}>
                {nationData.artistName} - {nationData.songTitle}
             </p>
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


// Helper component for displaying a single category pick with details (for "Pronostici TreppoScore")
const CategoryPickDisplayDetailPodium = React.memo(({ 
  detail, 
  allNations, 
  leaderboardLocked,
  categoryRankInfo,
  isEvenRow
}: { 
  detail: GlobalCategoryPickDetailType; 
  allNations: Nation[]; 
  leaderboardLocked: boolean;
  categoryRankInfo: { rank?: number; isCorrectPick?: boolean; globalScore?: number | null };
  isEvenRow?: boolean;
}) => {
  let IconComponent: React.ElementType;
  switch (detail.iconName) {
    case 'Music2': IconComponent = Music2; break;
    case 'Star': IconComponent = Star; break;
    case 'Shirt': IconComponent = Shirt; break;
    case 'ThumbsDown': IconComponent = ThumbsDown; break;
    default: IconComponent = Info; 
  }

  const CategoryMedalIcon = ({ rank }: { rank?: number }) => {
    if (leaderboardLocked || !rank || rank < 1 || rank > 3) return null;
    const colorClass = rank === 1 ? "text-yellow-400" : rank === 2 ? "text-slate-400" : "text-amber-500";
    return <Award className={cn("w-3.5 h-3.5 flex-shrink-0 ml-1", colorClass)} />;
  };
  
  const iconColorClass = categoryRankInfo.isCorrectPick ? "text-accent" : "text-accent";

  let rankText = "";
  let rankSuffix = "";
  if (!leaderboardLocked && categoryRankInfo.rank && categoryRankInfo.rank > 0) {
      if (detail.categoryName === "Miglior Canzone") rankSuffix = "";
      else if (detail.categoryName === "Peggior Canzone") rankSuffix = " peggiore";
      else rankSuffix = " in cat.";
      rankText = `(${categoryRankInfo.rank}°${rankSuffix})`;
  }
  
  const pickedNationFullDetails = detail.pickedNationId ? allNations.find(n => n.id === detail.pickedNationId) : undefined;
  const titleText = `${detail.pickedNationName || 'N/D'}${pickedNationFullDetails ? ` - ${pickedNationFullDetails.artistName} - ${pickedNationFullDetails.songTitle}` : ''} ${rankText} - Punti: ${detail.pointsAwarded}`;

  const mainContainerClasses = cn(
    "px-2 py-1.5",
    isEvenRow && "bg-muted/50 rounded-md",
    "flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5"
  );
  
  const labelAndIconContainerClasses = cn(
    "flex items-center gap-1.5 w-full sm:w-auto"
  );

  const nationInfoContainerOuterClasses = cn(
    "flex-grow w-full mt-1 sm:mt-0 pl-4 sm:pl-0 sm:ml-[1.625rem]"
  );

  return (
    <div className={mainContainerClasses}>
      <div className={labelAndIconContainerClasses}>
        <IconComponent className={cn("h-5 w-5 flex-shrink-0", iconColorClass)} />
        <span className="text-xs text-foreground/90 min-w-[120px] flex-shrink-0 font-medium">{detail.categoryName}</span>
      </div>
      <div className={nationInfoContainerOuterClasses}>
        <div className="flex items-center justify-between w-full">
          <div className="flex-grow flex flex-col items-start gap-0.5">
            {detail.pickedNationId && detail.pickedNationCountryCode && detail.pickedNationName && pickedNationFullDetails ? (
              <Link href={`/nations/${detail.pickedNationId}`}
                className="text-xs hover:underline hover:text-primary flex flex-col items-start"
                title={titleText}
              >
                <div className="flex items-center gap-1">
                  <Image
                    src={`https://flagcdn.com/w20/${detail.pickedNationCountryCode.toLowerCase()}.png`}
                    alt={detail.pickedNationName}
                    width={20}
                    height={13}
                    className="rounded-sm border border-border/30 object-contain flex-shrink-0"
                    data-ai-hint={`${detail.pickedNationName} flag`}
                  />
                  <span className="font-medium">
                    {detail.pickedNationName}
                  </span>
                  <CategoryMedalIcon rank={categoryRankInfo.rank} />
                  {!leaderboardLocked && rankText && (
                    <span className="text-muted-foreground ml-0.5 text-xs flex items-center">
                      {rankText}
                    </span>
                  )}
                </div>
                {pickedNationFullDetails.artistName && pickedNationFullDetails.songTitle && (
                   <p className="text-[10px] text-muted-foreground block" title={`${pickedNationFullDetails.artistName} - ${pickedNationFullDetails.songTitle}`}>
                      {pickedNationFullDetails.artistName} - {pickedNationFullDetails.songTitle}
                   </p>
                )}
              </Link>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <UserCircle className="h-4 w-4 flex-shrink-0" />
                <span>Nessuna selezione</span>
              </div>
            )}
          </div>
          {!leaderboardLocked && (
            <span className={cn("text-xs ml-2 flex-shrink-0", detail.pointsAwarded > 0 ? "font-semibold text-primary" : "text-muted-foreground")}>
              {detail.pointsAwarded > 0 ? `+${detail.pointsAwarded}pt` : `${detail.pointsAwarded}pt`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
CategoryPickDisplayDetailPodium.displayName = 'CategoryPickDisplayDetailPodium';


// Simpler display for non-podium cards, e.g., on /teams page for other teams
const SelectedNationDisplay = React.memo(({
  nation,
  IconComponent,
  label,
  allNations,
  isCorrectPick,
  leaderboardLocked,
  categoryRank,
  isEvenRow,
}: {
  nation?: Nation;
  IconComponent: React.ElementType;
  label?: string;
  allNations: Nation[];
  isCorrectPick?: boolean;
  leaderboardLocked?: boolean;
  categoryRank?: number;
  isEvenRow?: boolean;
}) => {
  const iconColorClass = isCorrectPick ? "text-accent" : "text-accent";

  const MedalIcon = ({ rank }: { rank?: number }) => {
    if (leaderboardLocked || rank === undefined || rank === null || rank === 0) return null;
    if (rank === 1) return <Award className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 ml-1" />;
    if (rank === 2) return <Award className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 ml-1" />;
    if (rank === 3) return <Award className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 ml-1" />;
    return null;
  };

  const nationDetails = nation ? (allNations.find(n => n.id === nation.id) || nation) : undefined;
  const nationNameForDisplay = nationDetails?.name || "N/D";
  
  let rankText = "";
  if (label && !leaderboardLocked && categoryRank && categoryRank > 0) {
    let suffix = " in cat.";
    if (label.startsWith("Miglior Canzone")) suffix = "";
    else if (label.startsWith("Peggior Canzone")) suffix = " peggiore";
    rankText = `(${categoryRank}°${suffix})`;
  } else if (!label && !leaderboardLocked && nationDetails?.ranking && nationDetails.ranking > 0) {
    rankText = `(${nationDetails.ranking}°)`;
  }

  const titleText = `${nationNameForDisplay} ${rankText} ${nationDetails?.artistName ? `${nationDetails.artistName} - ` : ''}${nationDetails?.songTitle || ''}`;
  
  const mainContainerClasses = cn(
    "px-2 py-1",
    isEvenRow && "bg-muted/50 rounded-md",
    label && "flex flex-col items-start sm:flex-row sm:items-center gap-1 sm:gap-1.5 sm:py-1.5"
  );
  
  const labelAndIconContainerClasses = cn(
    "flex items-center gap-1.5",
    label && "w-full sm:w-auto"
  );

  const nationInfoContainerOuterClasses = cn(
    "flex-grow",
    label && "w-full mt-1 sm:mt-0 pl-0 sm:pl-[calc(1.25rem+0.375rem)]" 
  );

  const nationInfoContainerInnerClasses = cn(
    "flex items-center gap-1",
    label ? "flex-col items-start" : "items-center" // Stack name/artist/song if label present
  );

  return (
    <div className={mainContainerClasses}>
      <div className={labelAndIconContainerClasses}>
        <IconComponent className={cn("h-5 w-5 flex-shrink-0", iconColorClass)} />
        {label && <span className="text-xs text-foreground/90 min-w-[120px] flex-shrink-0 font-medium">{label}</span>}
      </div>
      <div className={nationInfoContainerOuterClasses}>
        <div className={nationInfoContainerInnerClasses}>
            {nationDetails ? (
              <Link href={`/nations/${nationDetails.id}`} className="group flex items-center gap-1" title={titleText}>
                {nationDetails.countryCode && (
                <Image
                  src={`https://flagcdn.com/w40/${nationDetails.countryCode.toLowerCase()}.png`}
                  alt={`Bandiera ${nationNameForDisplay}`}
                  width={24}
                  height={16}
                  className="rounded-sm border border-border/30 object-contain flex-shrink-0"
                  data-ai-hint={`${nationNameForDisplay} flag`}
                />
                )}
                <span className="text-sm text-foreground/90 group-hover:underline group-hover:text-primary">
                  {nationNameForDisplay}
                </span>
                <MedalIcon rank={label ? categoryRank : nationDetails.ranking} />
                {!leaderboardLocked && rankText && (
                  <span className="text-xs text-muted-foreground group-hover:text-primary/80 ml-0.5 whitespace-nowrap">
                    {rankText}
                  </span>
                )}
              </Link>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <UserCircle className="h-4 w-4 flex-shrink-0" />
                <span>Nessuna selezione</span>
              </div>
            )}
          {nationDetails?.artistName && nationDetails?.songTitle && (
              <span className="text-xs text-muted-foreground group-hover:text-primary/80 block" title={`${nationDetails.artistName} - ${nationDetails.songTitle}`}>
                {nationDetails.artistName} - {nationDetails.songTitle}
              </span>
            )}
        </div>
      </div>
    </div>
  );
});
SelectedNationDisplay.displayName = 'SelectedNationDisplay';


interface TeamListItemProps {
  team: TeamWithScore & {
    primaSquadraDetails?: GlobalPrimaSquadraDetail[];
    categoryPicksDetails?: GlobalCategoryPickDetailType[];
  };
  allNations: Nation[];
  nationGlobalCategorizedScoresArray: [string, NationGlobalCategorizedScores][]; // Changed from Map
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
    [key: string]: { rank?: number; isCorrectPick?: boolean; globalScore?: number | null };
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
          score: scores[categoryKey]
        }))
        .filter(item => item.score !== null && (nationGlobalCategorizedScoresMap.get(item.id)?.voteCount || 0) > 0)
        .sort((a, b) => {
          if (a.score === null && b.score === null) return 0;
          if (a.score === null) return 1; 
          if (b.score === null) return -1; 
          return order === 'desc' ? (b.score as number) - (a.score as number) : (a.score as number) - (b.score as number);
        });
    };
    
    const getRankAndScore = (nationId?: string, sortedList?: Array<{ id: string, score: number | null }>): { rank?: number; score?: number | null } => {
      if (!nationId || !sortedList || sortedList.length === 0) return { rank: undefined, score: null };
      const rankIndex = sortedList.findIndex(n => n.id === nationId);
      const rank = rankIndex !== -1 ? rankIndex + 1 : undefined;
      const scoreVal = rank !== undefined && rankIndex < sortedList.length ? sortedList[rankIndex].score : null;
      return { rank, score: scoreVal };
    };

    const newRanks: typeof categoryRanksAndCorrectness = {};

    if (team.bestSongNationId) {
      const bestSongList = getSortedList('averageSongScore', 'desc');
      const pick = getRankAndScore(team.bestSongNationId, bestSongList);
      newRanks['bestSong'] = { rank: pick.rank, isCorrectPick: team.bestSongNationId === bestSongList[0]?.id, globalScore: pick.score };
    }
    if (team.worstSongNationId) {
      const worstSongList = getSortedList('averageSongScore', 'asc');
      const pick = getRankAndScore(team.worstSongNationId, worstSongList);
      newRanks['worstSong'] = { rank: pick.rank, isCorrectPick: team.worstSongNationId === worstSongList[0]?.id, globalScore: pick.score };
    }
    if (team.bestPerformanceNationId) {
      const bestPerfList = getSortedList('averagePerformanceScore', 'desc');
      const pick = getRankAndScore(team.bestPerformanceNationId, bestPerfList);
      newRanks['bestPerf'] = { rank: pick.rank, isCorrectPick: team.bestPerformanceNationId === bestPerfList[0]?.id, globalScore: pick.score };
    }
    if (team.bestOutfitNationId) {
      const bestOutfitList = getSortedList('averageOutfitScore', 'desc');
      const pick = getRankAndScore(team.bestOutfitNationId, bestOutfitList);
      newRanks['bestOutfit'] = { rank: pick.rank, isCorrectPick: team.bestOutfitNationId === bestOutfitList[0]?.id, globalScore: pick.score };
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
    { id: 'bestSong', teamPickNationId: team.bestSongNationId, Icon: Music2, label: "Miglior Canzone:", rankInfoKey: 'bestSong' },
    { id: 'bestPerf', teamPickNationId: team.bestPerformanceNationId, Icon: Star, label: "Miglior Performance:", rankInfoKey: 'bestPerf' },
    { id: 'bestOutfit', teamPickNationId: team.bestOutfitNationId, Icon: Shirt, label: "Miglior Outfit:", rankInfoKey: 'bestOutfit' },
    { id: 'worstSong', teamPickNationId: team.worstSongNationId, Icon: ThumbsDown, label: "Peggior Canzone:", rankInfoKey: 'worstSong' },
  ];
  
  const hasTreppoScorePredictions = team.bestSongNationId || team.bestPerformanceNationId || team.bestOutfitNationId || team.worstSongNationId;

  return (
    <Card className={cn(
      "flex flex-col h-full shadow-lg hover:shadow-primary/20 transition-shadow duration-300",
      borderClass
    )}>
      <CardHeader className="pb-3 pt-4 flex flex-row justify-between items-start">
        <div className="flex-grow">
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
          (isOwnTeamCard && isOwner && !disableEdit && !teamsLocked) 
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
          {/* Edit button logic removed from here as per previous request */}
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-1 pt-0 pb-4">
        {team.primaSquadraDetails && team.categoryPicksDetails && allNations && allNations.length > 0 ? (
          // DETAILED DISPLAY FOR PODIUM AND OWN TEAM CARD
          <>
            <p className="text-xl font-bold text-foreground mt-2 mb-1.5">
              Pronostici TreppoVision
            </p>
            {team.primaSquadraDetails.map((detail, index) => (
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
                   <div key={`${team.id}-${detail.categoryName}-detail`} className={cn("pl-4", "sm:pl-0")}>
                    <CategoryPickDisplayDetailPodium
                      detail={detail}
                      allNations={allNations}
                      leaderboardLocked={leaderboardLocked || false}
                      isEvenRow={index % 2 !== 0}
                      categoryRankInfo={categoryRanksAndCorrectness[detail.iconName.toLowerCase().replace('2','').replace('down','').replace('up','')] || {}}
                    />
                   </div>
                ))}
              </>
            )}
          </>
        ) : (
          // SIMPLER DISPLAY FOR OTHER TEAMS (e.g. on /teams page in table, this part might not be used much now)
          // Or for own team card if detailed data is not yet loaded/calculated.
          <>
            <p className="text-xl font-bold text-foreground mt-2 mb-1.5">
              Pronostici TreppoVision
            </p>
            {(team.founderChoices || []).map((nationId, index) => {
                const nation = allNations.find(n => n.id === nationId);
                return nation ? (
                    <SelectedNationDisplay
                        key={`founder-${nation.id}-${index}`}
                        nation={nation}
                        IconComponent={BadgeCheck}
                        allNations={allNations}
                        isEvenRow={index % 2 !== 0}
                        leaderboardLocked={leaderboardLocked || false}
                    />
                ) : null;
            })}
             {hasTreppoScorePredictions && (
                <>
                    <p className="text-xl font-bold text-secondary mt-4 pt-3 border-t border-border/30 mb-1.5">
                        Pronostici TreppoScore
                    </p>
                    {treppoScorePicksForDisplay.map((category, index) => {
                        const nation = allNations.find(n => n.id === category.teamPickNationId);
                        const rankInfo = categoryRanksAndCorrectness[category.rankInfoKey] || {};
                        return (
                            <SelectedNationDisplay
                                key={category.id}
                                nation={nation}
                                IconComponent={category.Icon}
                                label={category.label}
                                allNations={allNations}
                                isEvenRow={index % 2 !== 0}
                                categoryRank={rankInfo.rank}
                                isCorrectPick={rankInfo.isCorrectPick || false}
                                leaderboardLocked={leaderboardLocked || false}
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

