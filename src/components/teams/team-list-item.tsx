
"use client";

import type { Team, Nation, NationGlobalCategorizedScores, GlobalPrimaSquadraDetail, GlobalCategoryPickDetail, TeamWithScore } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCircle, Edit, Music2, Star, ThumbsDown, Shirt, Lock, BadgeCheck, Award, ListOrdered, Loader2, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { getTeamsLockedStatus } from "@/lib/actions/team-actions";
import { getLeaderboardLockedStatus } from "@/lib/actions/admin-actions";
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Helper component for displaying a single nation selection with details
// This is used for both "Pronostici TreppoVision" and "Pronostici TreppoScore" items
const SelectedNationDisplay = React.memo(({
  nation,
  IconComponent,
  label,
  allNations,
  isEvenRow,
  categoryRank,
  isCorrectPick,
  leaderboardLocked,
}: {
  nation?: Nation;
  IconComponent: React.ElementType;
  label?: string;
  allNations: Nation[];
  isEvenRow?: boolean;
  categoryRank?: number;
  isCorrectPick?: boolean;
  leaderboardLocked?: boolean;
}) => {
  const iconColorClass = isCorrectPick ? "text-accent" : "text-accent"; // All icons are yellow now

  const MedalIcon = ({ rank, isCategoryRank }: { rank?: number, isCategoryRank?: boolean }) => {
    if (!rank || rank < 1 || rank > 3 || leaderboardLocked) return null;
    const colorClass = rank === 1 ? "text-yellow-400" : rank === 2 ? "text-slate-400" : "text-amber-500";
    return <Award className={cn("w-3.5 h-3.5 flex-shrink-0 ml-1", colorClass)} />;
  };
  
  const nationDetails = nation ? (allNations.find(n => n.id === nation.id) || nation) : undefined;
  
  const nationNameForDisplay = nationDetails?.name || "N/D";
  const artistNameForDisplay = nationDetails?.artistName;
  const songTitleForDisplay = nationDetails?.songTitle;
  const eurovisionRankForDisplay = (!label && !leaderboardLocked && nationDetails?.ranking && nationDetails.ranking > 0) ? nationDetails.ranking : null;

  let rankTextToDisplay = "";
  if (label && !leaderboardLocked && categoryRank && categoryRank > 0) {
    let suffix = " in cat.";
    if (label.startsWith("Miglior Canzone")) suffix = "";
    else if (label.startsWith("Peggior Canzone")) suffix = " peggiore";
    rankTextToDisplay = `(${categoryRank}°${suffix})`;
  } else if (!label && !leaderboardLocked && eurovisionRankForDisplay) {
    rankTextToDisplay = `(${eurovisionRankForDisplay}°)`;
  }
  
  const titleText = `${nationNameForDisplay} ${rankTextToDisplay} ${artistNameForDisplay ? `${artistNameForDisplay} - ` : ''}${songTitleForDisplay || ''}`;

  const mainContainerClasses = cn(
    "px-2 py-1",
    isEvenRow && "bg-muted/50 rounded-md",
    label && "flex flex-col items-start sm:flex-row sm:items-center gap-1 sm:py-1.5" 
  );
  
  const labelAndIconContainerClasses = cn(
    "flex items-center gap-1.5",
    label && "w-full sm:w-auto"
  );

  const nationInfoContainerOuterClasses = cn(
    "flex-grow",
    label && "w-full mt-1 sm:mt-0 pl-4 sm:pl-0 sm:ml-[calc(1.25rem+0.375rem)]" 
  );


  return (
    <div className={mainContainerClasses}>
      <div className={labelAndIconContainerClasses}>
        <IconComponent className={cn("h-5 w-5 flex-shrink-0", iconColorClass)} />
        {label && <span className="text-xs text-foreground/90 min-w-[120px] flex-shrink-0 font-medium">{label}</span>}
      </div>
      <div className={nationInfoContainerOuterClasses}>
        <div className="flex flex-col items-start flex-grow min-w-0">
          <div className="flex items-center gap-1">
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
                <MedalIcon rank={label ? categoryRank : eurovisionRankForDisplay} isCategoryRank={!!label} />
                {!leaderboardLocked && rankTextToDisplay && (
                  <span className={cn("text-xs text-muted-foreground group-hover:text-primary/80 ml-0.5 whitespace-nowrap")}>
                    {rankTextToDisplay}
                  </span>
                )}
              </Link>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <UserCircle className="h-4 w-4 flex-shrink-0" />
                <span>Nessuna selezione</span>
              </div>
            )}
          </div>
          {artistNameForDisplay && songTitleForDisplay && (
              <span className="text-xs text-muted-foreground group-hover:text-primary/80 block">
                {artistNameForDisplay} - {songTitleForDisplay}
              </span>
            )}
        </div>
      </div>
    </div>
  );
});
SelectedNationDisplay.displayName = 'SelectedNationDisplay';


const PrimaSquadraNationDisplayDetailPodium = React.memo(({ detail, allNations, leaderboardLocked, isEvenRow }: { detail: GlobalPrimaSquadraDetail; allNations: Nation[]; leaderboardLocked?: boolean; isEvenRow?: boolean }) => {
  const MedalIcon = ({ rank }: { rank?: number }) => {
    if (!rank || rank < 1 || rank > 3 || leaderboardLocked) return null;
    const colorClass = rank === 1 ? "text-yellow-400" : rank === 2 ? "text-slate-400" : "text-amber-500";
    return <Award className={cn("w-3.5 h-3.5 flex-shrink-0 ml-1", colorClass)} />;
  };
  const nationData = allNations.find(n => n.id === detail.id);

  return (
    <div className={cn(
      "px-2 py-1",
      isEvenRow && "bg-muted/50 rounded-md"
    )}>
      <div className="flex items-center gap-1.5">
        <BadgeCheck className="w-4 h-4 text-accent flex-shrink-0" />
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
            {!leaderboardLocked && detail.actualRank ? <span className="text-muted-foreground ml-1 text-xs">({detail.actualRank}°)</span> : null}
          </Link>
          {nationData?.artistName && nationData?.songTitle && (
             <p className="text-[10px] text-muted-foreground block pl-[calc(20px+0.25rem+0.375rem)]">
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

const CategoryPickDisplayDetailPodium = React.memo(({ detail, allNations, leaderboardLocked, isEvenRow }: { detail: GlobalCategoryPickDetail; allNations: Nation[]; leaderboardLocked?: boolean; isEvenRow?: boolean }) => {
  let IconComponent: React.ElementType;
  switch (detail.iconName) {
    case 'Music2': IconComponent = Music2; break;
    case 'Star': IconComponent = Star; break;
    case 'Shirt': IconComponent = Shirt; break;
    case 'ThumbsDown': IconComponent = ThumbsDown; break;
    default: IconComponent = Users;
  }

  const CategoryMedalIcon = ({ rank }: { rank?: number }) => {
    if (!rank || rank < 1 || rank > 3 || leaderboardLocked) return null;
    const colorClass = rank === 1 ? "text-yellow-400" : rank === 2 ? "text-slate-400" : "text-amber-500";
    return <Award className={cn("w-3.5 h-3.5 flex-shrink-0 ml-1", colorClass)} />;
  };

  const iconColorClass = "text-accent";

  let rankSuffix = "";
  if (detail.categoryName === "Miglior Canzone") rankSuffix = "";
  else if (detail.categoryName === "Peggior Canzone") rankSuffix = " peggiore";
  else rankSuffix = " in cat.";
  
  const rankText = !leaderboardLocked && detail.actualCategoryRank && detail.actualCategoryRank > 0
    ? `(${detail.actualCategoryRank}°${rankSuffix})`
    : "";

  const pickedNationFullDetails = detail.pickedNationId ? allNations.find(n => n.id === detail.pickedNationId) : undefined;
  const titleText = `${detail.pickedNationName || 'N/D'}${pickedNationFullDetails ? ` - ${pickedNationFullDetails.artistName} - ${pickedNationFullDetails.songTitle}` : ''} ${rankText} - Punti: ${detail.pointsAwarded}`;

  const mainContainerClasses = cn(
    "px-2 py-1.5",
    isEvenRow && "bg-muted/50 rounded-md",
    "flex flex-col items-start sm:flex-row sm:items-center gap-1 sm:gap-1.5"
  );
  
  const labelAndIconContainerClasses = cn(
    "flex items-center gap-1.5 w-full sm:w-auto"
  );

  const nationInfoContainerOuterClasses = cn(
    "flex-grow w-full mt-1 sm:mt-0 pl-4 sm:pl-0 sm:ml-[calc(1.25rem+0.375rem)]"
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
                  <CategoryMedalIcon rank={detail.actualCategoryRank} />
                  {!leaderboardLocked && rankText && (
                    <span className="text-muted-foreground ml-0.5 text-xs flex items-center">
                      {rankText}
                    </span>
                  )}
                </div>
                {pickedNationFullDetails.artistName && pickedNationFullDetails.songTitle && (
                   <p className="text-[10px] text-muted-foreground block">
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

interface TeamListItemProps {
  team: TeamWithScore;
  allNations: Nation[];
  nationGlobalCategorizedScoresMap: Map<string, NationGlobalCategorizedScores>;
  isOwnTeamCard?: boolean;
  disableEdit?: boolean;
}

export function TeamListItem({
  team,
  allNations,
  nationGlobalCategorizedScoresMap,
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

  const getNationDetailsById = (id?: string): Nation | undefined => {
    if (!id || !allNations || allNations.length === 0) return undefined;
    return allNations.find(n => n.id === id);
  };

 useEffect(() => {
    if (!nationGlobalCategorizedScoresMap || nationGlobalCategorizedScoresMap.size === 0 || !allNations || allNations.length === 0) {
      setCategoryRanksAndCorrectness({});
      return;
    }

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

  }, [nationGlobalCategorizedScoresMap, allNations, team.bestSongNationId, team.worstSongNationId, team.bestPerformanceNationId, team.bestOutfitNationId]);


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
    { id: 'bestSong', teamPickNationId: team.bestSongNationId, Icon: Music2, label: "Miglior Canzone:", rankInfo: categoryRanksAndCorrectness['bestSong'] },
    { id: 'bestPerf', teamPickNationId: team.bestPerformanceNationId, Icon: Star, label: "Miglior Performance:", rankInfo: categoryRanksAndCorrectness['bestPerf'] },
    { id: 'bestOutfit', teamPickNationId: team.bestOutfitNationId, Icon: Shirt, label: "Miglior Outfit:", rankInfo: categoryRanksAndCorrectness['bestOutfit'] },
    { id: 'worstSong', teamPickNationId: team.worstSongNationId, Icon: ThumbsDown, label: "Peggior Canzone:", rankInfo: categoryRanksAndCorrectness['worstSong'] },
  ];
  
  let founderNationsDetails: Nation[] = [];
  if (team.founderChoices && allNations) {
    founderNationsDetails = (team.founderChoices)
      .map(nationId => allNations.find(n => n.id === nationId))
      .filter(Boolean) as Nation[];

    if (!leaderboardLocked) {
      founderNationsDetails.sort((a, b) => (a.ranking ?? Infinity) - (b.ranking ?? Infinity));
    }
  }

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
          (isOwnTeamCard && isOwner && !disableEdit ) 
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
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-1 pt-0 pb-4">
        {team.primaSquadraDetails && team.categoryPicksDetails && allNations.length > 0 ? (
          // Detailed display for podium on leaderboard and user's own team card on /teams
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
          // Simpler display for other teams on /teams (if not on leaderboard podium)
          <>
            <p className="text-xl font-bold text-foreground mt-2 mb-1.5">
              Pronostici TreppoVision
            </p>
            {founderNationsDetails.map((nation, index) => (
                <SelectedNationDisplay
                    key={`founder-${nation.id}-${index}`}
                    nation={nation}
                    IconComponent={BadgeCheck}
                    allNations={allNations}
                    isEvenRow={index % 2 !== 0}
                    leaderboardLocked={leaderboardLocked || false}
                />
            ))}
             {hasTreppoScorePredictions && (
                <>
                    <p className="text-xl font-bold text-secondary mt-4 pt-3 border-t border-border/30 mb-1.5">
                        Pronostici TreppoScore
                    </p>
                    {treppoScorePicksForDisplay.map((category, index) => {
                        const nation = getNationDetailsById(category.teamPickNationId);
                        const rankInfo = categoryRanksAndCorrectness[category.id] || {};
                        if (!nation && !category.teamPickNationId) { 
                            return (
                                <SelectedNationDisplay
                                    key={category.id}
                                    nation={undefined}
                                    IconComponent={category.Icon}
                                    label={category.label}
                                    allNations={allNations}
                                    isEvenRow={index % 2 !== 0}
                                    categoryRank={undefined}
                                    isCorrectPick={false}
                                    leaderboardLocked={leaderboardLocked || false}
                                />
                            );
                        }
                        return nation ? (
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
                        ) : null;
                    })}
                </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
