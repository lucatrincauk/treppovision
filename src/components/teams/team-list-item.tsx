
"use client";

import type { Team, Nation, NationGlobalCategorizedScores, TeamWithScore } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCircle, Edit, Music2, Star, ThumbsDown, Shirt, Lock, BadgeCheck, Award, ListChecks, Loader2, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { getTeamsLockedStatus, getLeaderboardLockedStatus } from "@/lib/actions/admin-actions";
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SelectedNationDisplayProps {
  nation?: Nation;
  IconComponent: React.ElementType;
  label?: string;
  isEvenRow?: boolean;
  categoryRank?: number;
  isCorrectPick?: boolean;
  isOwnTeamCard?: boolean;
  leaderboardLocked?: boolean;
  allNations: Nation[];
}

const SelectedNationDisplay = React.memo(({
  nation: initialNation,
  IconComponent,
  label,
  isEvenRow,
  categoryRank,
  isCorrectPick,
  isOwnTeamCard,
  leaderboardLocked,
  allNations,
}: SelectedNationDisplayProps) => {
  const iconColorClass = isCorrectPick ? "text-accent" : "text-accent";

  const MedalIcon = ({ rank }: { rank?: number }) => {
    if (!rank || rank < 1 || rank > 3 || leaderboardLocked) return null;
    const colorClass = rank === 1 ? "text-yellow-400" : rank === 2 ? "text-slate-400" : "text-amber-500";
    return <Award className={cn("w-3.5 h-3.5 flex-shrink-0 ml-1", colorClass)} />;
  };

  const nation = initialNation ? allNations.find(n => n.id === initialNation.id) || initialNation : undefined;
  
  const nameForDisplay = nation?.name || "N/D";
  const artistAndSongForDisplay = nation ? `${nation.artistName} - ${nation.songTitle}` : "";

  let rankText = "";
  if (label && categoryRank && !leaderboardLocked) {
    if (label === "Peggior Canzone:") {
      rankText = ` (${categoryRank}° peggiore)`;
    } else if (label === "Miglior Canzone:") {
      rankText = ` (${categoryRank}°)`;
    } else {
      rankText = ` (${categoryRank}° in cat.)`;
    }
  } else if (!label && nation?.ranking && nation.ranking > 0 && !leaderboardLocked) {
    rankText = ` (${nation.ranking}°)`;
  }

  const titleText = `${nameForDisplay}${rankText} ${artistAndSongForDisplay}`;

  const mainContainerClasses = cn(
    "px-2 py-1.5",
    isEvenRow && "bg-muted/50 rounded-md",
    label ? "flex flex-col items-start sm:flex-row sm:items-center gap-1 sm:gap-1.5" : "flex items-center gap-1.5"
  );
  
  const labelAndIconContainerClasses = cn(
    "flex items-center gap-1.5",
    isOwnTeamCard && label && "w-full sm:w-auto"
  );

  const NationInfoContent = ({ nation, rank, score, categoryName, isMainPick }: { nation?: Nation; rank?: number; score?: number | null; categoryName?: string, isMainPick?: boolean }) => (
    <div className="flex flex-col items-start flex-grow min-w-0">
      <div className="flex items-center gap-1">
        {nation ? (
          <Link href={`/nations/${nation.id}`} className="group flex-grow flex items-center gap-1" title={titleText}>
            <Image
              src={`https://flagcdn.com/w40/${nation.countryCode.toLowerCase()}.png`}
              alt={`Bandiera ${nameForDisplay}`}
              width={24}
              height={16}
              className="rounded-sm border border-border/30 object-contain flex-shrink-0"
              data-ai-hint={`${nameForDisplay} flag`}
            />
            <div className="flex flex-col text-left flex-grow min-w-0">
              <div className="flex items-center">
                <span className="text-sm text-foreground/90 group-hover:underline group-hover:text-primary">
                  {nameForDisplay}
                </span>
                {isMainPick && !leaderboardLocked && nation?.ranking && [1, 2, 3].includes(nation.ranking) && <MedalIcon rank={nation.ranking} />}
                {!isMainPick && label && !leaderboardLocked && categoryRank && [1, 2, 3].includes(categoryRank) && <MedalIcon rank={categoryRank} />}
                
                {!leaderboardLocked && (
                  (isMainPick && nation?.ranking && nation.ranking > 0) || 
                  (!isMainPick && label && categoryRank)
                ) && (
                  <span className={cn("text-xs text-muted-foreground group-hover:text-primary/80 ml-0.5 whitespace-nowrap")}>
                    {isMainPick ? `(${nation?.ranking}°)` : rankText}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <UserCircle className="h-4 w-4 flex-shrink-0" />
            <span>Nessuna selezione</span>
          </div>
        )}
      </div>
      {nation && (
          <span className="text-xs text-muted-foreground group-hover:text-primary/80 block sm:ml-[calc(24px+0.25rem)]">
            {artistAndSongForDisplay}
          </span>
        )}
    </div>
  );

  const nationInfoContainerOuterClasses = cn(
    "flex-grow w-full",
    label && (isOwnTeamCard || !isOwnTeamCard) && "mt-1 sm:mt-0 sm:ml-[calc(1.25rem+0.375rem)]"
  );


  return (
    <div className={mainContainerClasses}>
      <div className={labelAndIconContainerClasses}>
        <IconComponent className={cn("h-5 w-5 flex-shrink-0", iconColorClass)} />
        {label && <span className="text-xs text-foreground/90 min-w-[120px] flex-shrink-0 font-medium">{label}</span>}
      </div>
      <div className={nationInfoContainerOuterClasses}>
        <NationInfoContent nation={nation} rank={label ? categoryRank : nation?.ranking} isMainPick={!label}/>
      </div>
    </div>
  );
});
SelectedNationDisplay.displayName = 'SelectedNationDisplay';


interface PrimaSquadraNationDisplayDetailPodiumProps {
  detail: { id: string; name: string; countryCode: string; artistName?: string; songTitle?: string; actualRank?: number; points: number };
  allNations: Nation[];
  leaderboardLocked?: boolean;
  isEvenRow?: boolean;
}

const PrimaSquadraNationDisplayDetailPodium = React.memo(({ detail, allNations, leaderboardLocked, isEvenRow }: PrimaSquadraNationDisplayDetailPodiumProps) => {
  const MedalIcon = ({ rank }: { rank?: number }) => {
    if (!rank || rank < 1 || rank > 3 || leaderboardLocked) return null;
    const colorClass = rank === 1 ? "text-yellow-400" : rank === 2 ? "text-slate-400" : "text-amber-500";
    return <Award className={cn("w-3.5 h-3.5 flex-shrink-0 ml-1", colorClass)} />;
  };
  const nationData = allNations.find(n => n.id === detail.id);

  return (
    <div className={cn("flex items-start gap-1.5 px-2 py-1 hover:bg-muted/30 rounded-md", isEvenRow && "bg-muted/50")}>
      <BadgeCheck className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
      <Image
        src={`https://flagcdn.com/w20/${detail.countryCode.toLowerCase()}.png`}
        alt={detail.name}
        width={20}
        height={13}
        className="rounded-sm border border-border/30 object-contain flex-shrink-0 mt-1"
        data-ai-hint={`${detail.name} flag`}
      />
      <div className="flex-grow">
        <Link
          href={`/nations/${detail.id}`}
          className="text-xs hover:underline hover:text-primary flex flex-col items-start"
          title={`${detail.name}${nationData?.artistName ? ` - ${nationData.artistName}` : ''}${nationData?.songTitle ? ` - ${nationData.songTitle}` : ''}${!leaderboardLocked && detail.actualRank ? ` (${detail.actualRank}°)` : ''} - Punti: ${detail.points}`}
        >
          <div className="flex items-center">
            <span className="font-medium">{detail.name}</span>
            <MedalIcon rank={detail.actualRank} />
            {!leaderboardLocked && detail.actualRank ? <span className="text-muted-foreground ml-1">({detail.actualRank}°)</span> : null}
          </div>
          {nationData?.artistName && nationData?.songTitle && (
            <p className="text-[10px] text-muted-foreground sm:text-xs block">
              {nationData.artistName} - {nationData.songTitle}
            </p>
          )}
        </Link>
      </div>
      {!leaderboardLocked && (
        <span className={cn(
          "text-xs ml-auto pl-1 mt-0.5",
          detail.points > 0 ? "font-semibold text-primary" : detail.points < 0 ? "font-semibold text-destructive" : "text-muted-foreground"
        )}>
          {detail.points > 0 ? `+${detail.points}pt` : `${detail.points}pt`}
        </span>
      )}
    </div>
  );
});
PrimaSquadraNationDisplayDetailPodium.displayName = 'PrimaSquadraNationDisplayDetailPodium';


interface CategoryPickDisplayDetailPodiumProps {
  detail: { categoryName: string; pickedNationId?: string; pickedNationName?: string; pickedNationCountryCode?: string; actualCategoryRank?: number; pointsAwarded: number; iconName: string; pickedNationScoreInCategory?: number | null; };
  allNations: Nation[];
  leaderboardLocked?: boolean;
  isEvenRow?: boolean;
}

const CategoryPickDisplayDetailPodium = React.memo(({ detail, allNations, leaderboardLocked, isEvenRow }: CategoryPickDisplayDetailPodiumProps) => {
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

  let rankText = "";
  if (!leaderboardLocked && detail.actualCategoryRank && detail.actualCategoryRank > 0) {
    let rankSuffix = "";
    if (detail.categoryName === "Miglior Canzone:") rankSuffix = "";
    else if (detail.categoryName === "Peggior Canzone:") rankSuffix = " peggiore";
    else rankSuffix = " in cat.";
    rankText = `(${detail.actualCategoryRank}°${rankSuffix})`;
  }

  const pickedNationFullDetails = detail.pickedNationId ? allNations.find(n => n.id === detail.pickedNationId) : undefined;
  const titleText = `${detail.pickedNationName || 'N/D'}${pickedNationFullDetails ? ` - ${pickedNationFullDetails.artistName} - ${pickedNationFullDetails.songTitle}` : ''} ${rankText} - Punti: ${detail.pointsAwarded}`;

  return (
    <div className={cn("px-2 py-1.5", isEvenRow && "bg-muted/50 rounded-md")}>
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

        <div className={cn("w-full mt-1 pl-4", "sm:ml-[calc(1.25rem+0.375rem)] sm:pl-0")}>
          <div className="flex items-center gap-1.5">
            {detail.pickedNationId && detail.pickedNationCountryCode && detail.pickedNationName && pickedNationFullDetails ? (
              <Link href={`/nations/${detail.pickedNationId}`}
                className="text-xs hover:underline hover:text-primary flex flex-col items-start gap-0.5"
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
                  {rankText && (
                    <span className="text-muted-foreground ml-0.5 text-xs flex items-center">
                      {rankText}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground block"> {/* Removed truncate */}
                  {pickedNationFullDetails.artistName} - {pickedNationFullDetails.songTitle}
                </span>
              </Link>
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
  team: TeamWithScore;
  allNations: Nation[];
  nationGlobalCategorizedScoresMap: Map<string, NationGlobalCategorizedScores>;
  isOwnTeamCard?: boolean;
  disableEdit?: boolean;
  isEvenRow?: boolean;
}

export function TeamListItem({
  team,
  allNations,
  nationGlobalCategorizedScoresMap,
  isOwnTeamCard = false,
  disableEdit = false,
  isEvenRow,
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
        const teamsLockStatus = await getTeamsLockedStatus();
        setTeamsLocked(teamsLockStatus);
      }
      const lbLockedStatus = await getLeaderboardLockedStatus();
      setLeaderboardLocked(lbLockedStatus);
    }
    fetchLockStatuses();
  }, [disableEdit]);


  useEffect(() => {
    if (!allNations || allNations.length === 0 || !nationGlobalCategorizedScoresMap || nationGlobalCategorizedScoresMap.size === 0) return;

    const getSortedList = (categoryKey: 'averageSongScore' | 'averagePerformanceScore' | 'averageOutfitScore', order: 'asc' | 'desc') => {
      return Array.from(nationGlobalCategorizedScoresMap.entries())
        .map(([nationId, scores]) => ({
          id: nationId,
          score: scores[categoryKey]
        }))
        .filter(item => item.score !== null && (nationGlobalCategorizedScoresMap.get(item.id)?.voteCount || 0) > 0)
        .sort((a, b) => {
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

    const bestSongList = getSortedList('averageSongScore', 'desc');
    const bestSongPick = getRankAndScore(team.bestSongNationId, bestSongList);
    newRanks['bestSong'] = { rank: bestSongPick.rank, isCorrectPick: team.bestSongNationId === bestSongList[0]?.id, globalScore: bestSongPick.score };

    const worstSongList = getSortedList('averageSongScore', 'asc');
    const worstSongPick = getRankAndScore(team.worstSongNationId, worstSongList);
    newRanks['worstSong'] = { rank: worstSongPick.rank, isCorrectPick: team.worstSongNationId === worstSongList[0]?.id, globalScore: worstSongPick.score };

    const bestPerfList = getSortedList('averagePerformanceScore', 'desc');
    const bestPerfPick = getRankAndScore(team.bestPerformanceNationId, bestPerfList);
    newRanks['bestPerf'] = { rank: bestPerfPick.rank, isCorrectPick: team.bestPerformanceNationId === bestPerfList[0]?.id, globalScore: bestPerfPick.score };

    const bestOutfitList = getSortedList('averageOutfitScore', 'desc');
    const bestOutfitPick = getRankAndScore(team.bestOutfitNationId, bestOutfitList);
    newRanks['bestOutfit'] = { rank: bestOutfitPick.rank, isCorrectPick: team.bestOutfitNationId === bestOutfitList[0]?.id, globalScore: bestOutfitPick.score };

    setCategoryRanksAndCorrectness(newRanks);
  }, [nationGlobalCategorizedScoresMap, allNations, team]);


  const getNationDetailsById = (id?: string): Nation | undefined => {
    if (!id || !allNations || allNations.length === 0) return undefined;
    return allNations.find(n => n.id === id);
  };

  const founderNationsDetails = (team.founderChoices || [])
    .map(id => getNationDetailsById(id))
    .filter((n): n is Nation => Boolean(n))
    .sort((a, b) => (a.ranking ?? Infinity) - (b.ranking ?? Infinity));

  const treppoScorePicks = [
    { id: 'bestSong', teamPickNationId: team.bestSongNationId, Icon: Music2, label: "Miglior Canzone:", rankInfo: categoryRanksAndCorrectness['bestSong'] },
    { id: 'bestPerf', teamPickNationId: team.bestPerformanceNationId, Icon: Star, label: "Miglior Performance:", rankInfo: categoryRanksAndCorrectness['bestPerf'] },
    { id: 'bestOutfit', teamPickNationId: team.bestOutfitNationId, Icon: Shirt, label: "Miglior Outfit:", rankInfo: categoryRanksAndCorrectness['bestOutfit'] },
    { id: 'worstSong', teamPickNationId: team.worstSongNationId, Icon: ThumbsDown, label: "Peggior Canzone:", rankInfo: categoryRanksAndCorrectness['worstSong'] },
  ];

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
          (isOwnTeamCard && isOwner && !disableEdit && (teamsLocked === false || teamsLocked === null) )
            ? "flex flex-row items-center gap-2" 
            : "flex flex-col items-end gap-1" 
        )}>
          {isOwnTeamCard && isOwner && !disableEdit && (teamsLocked === false || teamsLocked === null) && (
             <Button asChild variant="outline" size="sm">
                <Link href={`/teams/${team.id}/edit`}>
                  <Edit className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Modifica</span>
                </Link>
              </Button>
          )}
          {/* Removed "Modifica Squadra" button from here as per user request, edit is now via header dropdown */}
          {isOwnTeamCard && isOwner && !disableEdit && teamsLocked === true && (
            <Button variant="outline" size="sm" disabled>
              <Lock className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Bloccato</span>
            </Button>
          )}
          {typeof team.score === 'number' && !leaderboardLocked && (
            <div className={cn(
                "text-lg font-bold text-primary whitespace-nowrap",
                isOwnTeamCard && "text-right" 
            )}>
              {team.score} pt
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-1 pt-0 pb-4">
        {team.primaSquadraDetails && team.categoryPicksDetails && allNations ? (
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
            <p className="text-xl font-bold text-secondary mt-4 pt-3 border-t border-border/30 mb-1.5">
              Pronostici TreppoScore
            </p>
            {team.categoryPicksDetails.map((detail, index) => (
              <CategoryPickDisplayDetailPodium
                key={`${team.id}-${detail.categoryName}-detail`}
                detail={{...detail}}
                allNations={allNations}
                leaderboardLocked={leaderboardLocked || false}
                isEvenRow={index % 2 !== 0}
              />
            ))}
          </>
        ) : (
          // Fallback/Simpler view if detailed props are not available
          <>
            <p className="text-xl font-bold text-foreground mt-2 mb-1.5">
              Pronostici TreppoVision
            </p>
            {founderNationsDetails.map((nation, index) => (
              <SelectedNationDisplay
                key={`founder-${nation.id}`}
                nation={nation}
                IconComponent={BadgeCheck}
                isEvenRow={index % 2 !== 0}
                isOwnTeamCard={isOwnTeamCard}
                allNations={allNations}
                leaderboardLocked={leaderboardLocked || false}
              />
            ))}
            <p className="text-xl font-bold text-secondary mt-4 pt-3 border-t border-border/30 mb-1.5">
              Pronostici TreppoScore
            </p>
            {treppoScorePicks.map((category, index) => (
              <SelectedNationDisplay
                key={category.id}
                nation={allNations.find(n => n.id === category.teamPickNationId)}
                IconComponent={category.Icon}
                label={category.label}
                isEvenRow={index % 2 !== 0}
                categoryRank={!leaderboardLocked ? category.rankInfo?.rank : undefined}
                isCorrectPick={!leaderboardLocked ? category.rankInfo?.isCorrectPick : false}
                isOwnTeamCard={isOwnTeamCard}
                allNations={allNations}
                leaderboardLocked={leaderboardLocked || false}
              />
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}

