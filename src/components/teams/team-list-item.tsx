
"use client";

import type { Team, Nation, NationGlobalCategorizedScores } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCircle, Edit, Music2, Star, ThumbsDown, Shirt, Lock, BadgeCheck, Award, ListChecks, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { getTeamsLockedStatus } from "@/lib/actions/team-actions";
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Adapted PrimaSquadraNationDisplayDetail for podium cards
const PrimaSquadraNationDisplayDetailPodium = ({ detail }: { detail: { id: string; name: string; countryCode: string; actualRank?: number; points: number } }) => {
  const MedalIcon = ({ rank }: { rank?: number }) => {
    if (rank === 1) return <Award className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 ml-1" />;
    if (rank === 2) return <Award className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 ml-1" />;
    if (rank === 3) return <Award className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 ml-1" />;
    return null;
  };

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 hover:bg-muted/30 rounded-md">
      <BadgeCheck className="w-4 h-4 text-accent flex-shrink-0" />
      <Image
        src={`https://flagcdn.com/w20/${detail.countryCode.toLowerCase()}.png`}
        alt={detail.name}
        width={20}
        height={13}
        className="rounded-sm border border-border/30 object-contain flex-shrink-0"
        data-ai-hint={`${detail.name} flag`}
      />
      <Link
        href={`/nations/${detail.id}`}
        className="text-xs hover:underline hover:text-primary truncate flex-grow flex items-center"
        title={`${detail.name} (Classifica Finale: ${detail.actualRank ?? 'N/D'}) - Punti: ${detail.points}`}
      >
        <span className="font-medium">{detail.name.substring(0, 15) + (detail.name.length > 15 ? '...' : '')}</span>
        <MedalIcon rank={detail.actualRank} />
        <span className="text-muted-foreground ml-1">({detail.actualRank ? `${detail.actualRank}°` : 'N/D'})</span>
      </Link>
      <span className={cn(
        "text-xs ml-auto pl-1",
        detail.points > 0 ? "font-semibold text-primary" : detail.points < 0 ? "font-semibold text-destructive" : "text-muted-foreground"
      )}>
        {detail.points > 0 ? `+${detail.points}pt` : `${detail.points}pt`}
      </span>
    </div>
  );
};

// Adapted CategoryPickDisplayDetail for podium cards
const CategoryPickDisplayDetailPodium = ({ detail }: { detail: { categoryName: string; pickedNationId?: string; pickedNationName?: string; pickedNationCountryCode?: string; actualCategoryRank?: number; pickedNationScoreInCategory?: number | null; pointsAwarded: number; iconName: string; } }) => {
  let IconComponent: React.ElementType;
  switch (detail.iconName) {
    case 'Music2': IconComponent = Music2; break;
    case 'Star': IconComponent = Star; break;
    case 'Shirt': IconComponent = Shirt; break;
    case 'ThumbsDown': IconComponent = ThumbsDown; break;
    default: IconComponent = Users; // Fallback icon
  }

  const CategoryMedalIcon = ({ rank }: { rank?: number }) => {
    if (rank === 1) return <Award className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 ml-1" />;
    if (rank === 2) return <Award className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 ml-1" />;
    if (rank === 3) return <Award className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 ml-1" />;
    return null;
  };

  const iconColor = detail.categoryName === "Miglior Performance" ? "text-secondary" : "text-accent";

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 hover:bg-muted/30 rounded-md">
      <IconComponent className={cn("w-4 h-4 flex-shrink-0", iconColor)} />
       <span className="text-xs text-foreground/90 min-w-[120px] flex-shrink-0 font-medium">{detail.categoryName}:</span>
      <Link href={detail.pickedNationId ? `/nations/${detail.pickedNationId}` : '#'}
        className={cn("text-xs hover:underline hover:text-primary truncate flex-grow flex items-center gap-1", !detail.pickedNationId && "pointer-events-none")}
        title={detail.pickedNationName ? `${detail.pickedNationName}${detail.actualCategoryRank ? ` (${detail.actualCategoryRank}° ${detail.categoryName === "Peggior Canzone" ? "peggiore" : (detail.categoryName === "Miglior Canzone" ? "" : "in cat.")})` : ''} - Punti: ${detail.pointsAwarded}` : `Punti: ${detail.pointsAwarded}`}
      >
         {detail.pickedNationCountryCode && detail.pickedNationName ? (
          <Image
            src={`https://flagcdn.com/w20/${detail.pickedNationCountryCode.toLowerCase()}.png`}
            alt={detail.pickedNationName}
            width={20}
            height={13}
            className="rounded-sm border border-border/30 object-contain flex-shrink-0"
            data-ai-hint={`${detail.pickedNationName} flag`}
          />
        ) : (
          <div className="w-[20px] h-[13px] bg-muted rounded-sm border border-border/30 flex-shrink-0"></div>
        )}
        <span className="font-medium">
          {detail.pickedNationName ? (detail.pickedNationName.substring(0, 12) + (detail.pickedNationName.length > 12 ? '...' : '')) : "N/D"}
        </span>
        <CategoryMedalIcon rank={detail.actualCategoryRank} />
        {detail.actualCategoryRank && (
             <span className="text-muted-foreground ml-0.5 text-xs flex items-center">
                ({detail.actualCategoryRank}°
                {detail.categoryName === "Miglior Canzone" ? "" :
                 detail.categoryName === "Peggior Canzone" ? " peggiore" :
                 " in cat."}
                )
            </span>
        )}
      </Link>
      <span className={cn("text-xs ml-auto pl-1", detail.pointsAwarded > 0 ? "font-semibold text-primary" : "text-muted-foreground")}>
        {detail.pointsAwarded > 0 ? `+${detail.pointsAwarded}pt` : `${detail.pointsAwarded}pt`}
      </span>
    </div>
  );
};


interface SelectedNationDisplayProps {
  nation?: Nation;
  IconComponent: React.ElementType;
  label?: string;
  isEvenRow?: boolean;
  isOwnTeamCard?: boolean;
  categoryRank?: number; 
  isCorrectPick?: boolean; 
}

const SelectedNationDisplay = React.memo(({
  nation,
  IconComponent,
  label,
  isEvenRow,
  categoryRank,
  isCorrectPick,
}: SelectedNationDisplayProps) => {
  if (!nation) {
    return (
      <div className={cn(
        "flex px-2 py-1.5 items-center gap-1.5",
        isEvenRow && label && "bg-muted/50 rounded-md"
      )}>
        <IconComponent className={cn("h-5 w-5 flex-shrink-0", isCorrectPick ? "text-accent" : "text-accent")} />
        {label && <span className="text-xs text-foreground/90 min-w-[120px] flex-shrink-0 font-medium">{label}</span>}
        <UserCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <p className="text-sm text-muted-foreground">Nazione non selezionata</p>
      </div>
    );
  }

  const MedalIcon = ({ rank }: { rank?: number }) => {
    if (rank === 1) return <Award className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 ml-0.5" />;
    if (rank === 2) return <Award className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 ml-0.5" />;
    if (rank === 3) return <Award className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 ml-0.5" />;
    return null;
  };

  let rankText = "";

  if (label) { // For "Pronostici TreppoScore" items
    if (categoryRank && categoryRank > 0) {
      let suffix = " in cat.";
      if (label === "Miglior Canzone:") suffix = "";
      else if (label === "Peggior Canzone:") suffix = " peggiore";
      rankText = `(${categoryRank}°${suffix})`;
    }
  } else if (nation.ranking && nation.ranking > 0) { // For "Scelte Principali"
    rankText = `(${nation.ranking}°)`;
  }
  
  const iconColor = isCorrectPick ? "text-accent" : "text-accent";

  const mainContainerClasses = cn(
    "flex px-2 py-1 items-center gap-1.5",
    label ? "flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5 py-1.5" : "items-center gap-1.5",
    isEvenRow && "bg-muted/50 rounded-md"
  );

  const labelAndIconContainerClasses = cn(
    "flex items-center gap-1.5",
    label && "w-full sm:w-auto" 
  );

  const nationInfoContainerOuterClasses = cn(
    "flex-grow flex items-center gap-2",
    label && "w-full sm:w-auto pl-0 sm:pl-0" 
  );
  
  const nationInfoContainerInnerClasses = cn(
    "flex flex-col text-left",
    label && "flex-grow" 
  );

  return (
    <div className={mainContainerClasses}>
      <div className={labelAndIconContainerClasses}>
        <IconComponent className={cn("h-5 w-5 flex-shrink-0", iconColor)} />
        {label && <span className="text-xs text-foreground/90 min-w-[120px] flex-shrink-0 font-medium">{label}</span>}
      </div>

      <div className={nationInfoContainerOuterClasses}>
        <Link href={`/nations/${nation.id}`} className="group flex-grow">
          <div className="flex items-center gap-1.5">
            <Image
              src={`https://flagcdn.com/w40/${nation.countryCode.toLowerCase()}.png`}
              alt={`Bandiera ${nation.name}`}
              width={24}
              height={16}
              className="rounded-sm border border-border/50 object-contain flex-shrink-0"
              data-ai-hint={`${nation.name} flag`}
            />
            <div className={nationInfoContainerInnerClasses}>
              <div className="flex items-center">
                <span className="text-sm text-foreground/90 group-hover:underline group-hover:text-primary truncate" title={`${nation.name} ${rankText} - ${nation.artistName} - ${nation.songTitle}`}>
                  {nation.name}
                </span>
                {(label && categoryRank) ? <MedalIcon rank={categoryRank} /> : null}
                {(!label && nation.ranking) ? <MedalIcon rank={nation.ranking} /> : null}
                {rankText && (
                  <span className="text-xs text-muted-foreground group-hover:text-primary/80 ml-0.5">
                    {rankText}
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground truncate group-hover:text-primary/80 hidden sm:inline" title={`${nation.artistName} - ${nation.songTitle}`}>
                {nation.artistName} - {nation.songTitle}
              </span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
});
SelectedNationDisplay.displayName = 'SelectedNationDisplay';


interface TeamListItemProps {
  team: Team & {
    score?: number;
    primaSquadraDetails?: Array<{ id: string; name: string; countryCode: string; actualRank?: number; points: number }>;
    categoryPicksDetails?: Array<{ categoryName: string; pickedNationId?: string; pickedNationName?: string; pickedNationCountryCode?: string; actualCategoryRank?: number; pickedNationScoreInCategory?: number | null; pointsAwarded: number; iconName: string; }>;
    rank?: number; 
  };
  nations: Nation[];
  nationGlobalCategorizedScoresMap: Map<string, NationGlobalCategorizedScores>;
  isOwnTeamCard?: boolean;
  disableEdit?: boolean;
}

export function TeamListItem({ team, nations, nationGlobalCategorizedScoresMap, isOwnTeamCard = false, disableEdit = false }: TeamListItemProps) {
  const { user } = useAuth();
  const [teamsLocked, setTeamsLocked] = useState<boolean | null>(null);

  const [categoryRanksAndCorrectness, setCategoryRanksAndCorrectness] = useState<{
    bestSongNationId?: string;
    worstSongNationId?: string;
    bestPerfNationId?: string;
    bestOutfitNationId?: string;
    bestSongRank?: number;
    worstSongRank?: number;
    bestPerfRank?: number;
    bestOutfitRank?: number;
    isBestSongCorrect?: boolean;
    isWorstSongCorrect?: boolean;
    isBestPerfCorrect?: boolean;
    isBestOutfitCorrect?: boolean;
  }>({});

  useEffect(() => {
    async function fetchLockStatus() {
      const status = await getTeamsLockedStatus();
      setTeamsLocked(status);
    }
    if (!disableEdit) {
        fetchLockStatus();
    }
  }, [disableEdit]);

  useEffect(() => {
    if (nationGlobalCategorizedScoresMap.size > 0 && nations.length > 0) {
      const getSortedList = (categoryKey: 'averageSongScore' | 'averagePerformanceScore' | 'averageOutfitScore', order: 'asc' | 'desc') => {
        return Array.from(nationGlobalCategorizedScoresMap.entries())
          .map(([nationId, scores]) => ({
            id: nationId,
            score: scores[categoryKey]
          }))
          .filter(item => item.score !== null && (nationGlobalCategorizedScoresMap.get(item.id)?.voteCount || 0) > 0)
          .sort((a, b) => order === 'desc' ? (b.score as number) - (a.score as number) : (a.score as number) - (b.score as number));
      };
      
      const getRank = (nationId?: string, sortedList?: Array<{id: string}>): number | undefined => {
        if (!nationId || !sortedList) return undefined;
        const rankIndex = sortedList.findIndex(n => n.id === nationId);
        return rankIndex !== -1 ? rankIndex + 1 : undefined;
      };

      const bestSongList = getSortedList('averageSongScore', 'desc');
      const worstSongList = getSortedList('averageSongScore', 'asc');
      const bestPerfList = getSortedList('averagePerformanceScore', 'desc');
      const bestOutfitList = getSortedList('averageOutfitScore', 'desc');

      setCategoryRanksAndCorrectness({
        bestSongNationId: bestSongList[0]?.id,
        worstSongNationId: worstSongList[0]?.id,
        bestPerfNationId: bestPerfList[0]?.id,
        bestOutfitNationId: bestOutfitList[0]?.id,
        bestSongRank: getRank(team.bestSongNationId, bestSongList),
        worstSongRank: getRank(team.worstSongNationId, worstSongList),
        bestPerfRank: getRank(team.bestPerformanceNationId, bestPerfList),
        bestOutfitRank: getRank(team.bestOutfitNationId, bestOutfitList),
        isBestSongCorrect: team.bestSongNationId === bestSongList[0]?.id,
        isWorstSongCorrect: team.worstSongNationId === worstSongList[0]?.id,
        isBestPerfCorrect: team.bestPerformanceNationId === bestPerfList[0]?.id,
        isBestOutfitCorrect: team.bestOutfitNationId === bestOutfitList[0]?.id,
      });
    }
  }, [nationGlobalCategorizedScoresMap, nations, team]);


  const getNationDetailsById = (id?: string, nationsList?: Nation[]): Nation | undefined => {
    if (!id || !nationsList) return undefined;
    return nationsList.find(n => n.id === id);
  };

  const founderNationsDetails = (team.founderChoices || [])
    .map(id => getNationDetailsById(id, nations))
    .filter(Boolean) as Nation[];
  
  founderNationsDetails.sort((a, b) => {
      const rankA = a.ranking ?? Infinity;
      const rankB = b.ranking ?? Infinity;
      if (rankA === rankB) return a.name.localeCompare(b.name);
      return rankA - rankB;
  });

  const bestSongNationDetails = getNationDetailsById(team.bestSongNationId, nations);
  const bestPerformanceNationDetails = getNationDetailsById(team.bestPerformanceNationId, nations);
  const bestOutfitNationDetails = getNationDetailsById(team.bestOutfitNationId, nations);
  const worstSongNationDetails = getNationDetailsById(team.worstSongNationId, nations);

  const isOwner = user?.uid === team.userId;
  const isLeaderboardPodiumCard = !!(team.primaSquadraDetails && team.categoryPicksDetails);

  const borderClass =
    team.rank === 1 ? "border-yellow-400 border-2 shadow-yellow-400/30" :
    team.rank === 2 ? "border-slate-400 border-2 shadow-slate-400/30" :
    team.rank === 3 ? "border-amber-500 border-2 shadow-amber-500/30" :
    "border-border";


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
             <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5" title={team.creatorDisplayName}>
                <UserCircle className="h-3 w-3" />{team.creatorDisplayName}
             </div>
           )}
        </div>
        <div className={cn(
            "ml-2 flex-shrink-0",
            (isOwnTeamCard && !disableEdit) ? "flex flex-row-reverse items-center gap-2" : "flex flex-col items-end gap-1"
        )}>
          {typeof team.score === 'number' && (
            <div className="text-lg font-bold text-primary whitespace-nowrap">
              {team.score} pt
            </div>
          )}
          {isOwner && teamsLocked === false && !disableEdit && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/teams/${team.id}/edit`}>
                <Edit className="h-3 w-3 mr-1.5" />
                Modifica
              </Link>
            </Button>
          )}
          {isOwner && teamsLocked === true && !disableEdit && (
              <Button variant="outline" size="sm" disabled>
                  <Lock className="h-3 w-3 mr-1.5 text-destructive"/>
                  Bloccato
              </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-1 pt-0 pb-4">
        {isLeaderboardPodiumCard && team.primaSquadraDetails && team.categoryPicksDetails ? (
          <>
            <p className="text-xl font-bold text-foreground mt-2 mb-1.5">
                Pronostici TreppoVision
            </p>
            {team.primaSquadraDetails.map((detail) => (
              <PrimaSquadraNationDisplayDetailPodium key={`${team.id}-${detail.id}-prima-detail`} detail={detail} />
            ))}
            <p className="text-xl font-bold text-secondary mt-4 pt-3 border-t border-border/30 mb-1.5">
                Pronostici TreppoScore
            </p>
            {team.categoryPicksDetails.map((detail) => (
              <CategoryPickDisplayDetailPodium key={`${team.id}-${detail.categoryName}-detail`} detail={detail} />
            ))}
          </>
        ) : (
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
              />
            ))}
            <p className="text-xl font-bold text-secondary mt-4 pt-3 border-t border-border/30 mb-1.5">
                Pronostici TreppoScore
            </p>
            <SelectedNationDisplay
                nation={bestSongNationDetails}
                IconComponent={Music2}
                label="Miglior Canzone:"
                isEvenRow={false}
                categoryRank={categoryRanksAndCorrectness.bestSongRank}
                isCorrectPick={categoryRanksAndCorrectness.isBestSongCorrect}
            />
            <SelectedNationDisplay
                nation={bestPerformanceNationDetails}
                IconComponent={Star}
                label="Miglior Performance:"
                isEvenRow={true}
                categoryRank={categoryRanksAndCorrectness.bestPerfRank}
                isCorrectPick={categoryRanksAndCorrectness.isBestPerfCorrect}
            />
            <SelectedNationDisplay
                nation={bestOutfitNationDetails}
                IconComponent={Shirt}
                label="Miglior Outfit:"
                isEvenRow={false}
                categoryRank={categoryRanksAndCorrectness.bestOutfitRank}
                isCorrectPick={categoryRanksAndCorrectness.isBestOutfitCorrect}
            />
            <SelectedNationDisplay
                nation={worstSongNationDetails}
                IconComponent={ThumbsDown}
                label="Peggior Canzone:"
                isEvenRow={true}
                categoryRank={categoryRanksAndCorrectness.worstSongRank}
                isCorrectPick={categoryRanksAndCorrectness.isWorstSongCorrect}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
  