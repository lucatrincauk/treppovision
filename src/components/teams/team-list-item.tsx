
"use client";

import type { Team, Nation, NationGlobalCategorizedScores } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCircle, Edit, Music2, Star, ThumbsDown, Shirt, Lock, BadgeCheck, Award } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { getTeamsLockedStatus } from "@/lib/actions/team-actions";
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Helper component to display selected nations, adapted for various contexts
interface SelectedNationDisplayProps {
  nation?: Nation;
  IconComponent: React.ElementType;
  label?: string;
  isEvenRow?: boolean;
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
  const iconColor = isCorrectPick || !label ? "text-accent" : "text-accent"; // All icons yellow now

  const MedalIcon = ({ rank }: { rank?: number }) => {
    if (!rank || rank > 3 || rank < 1) return null;
    const colorClass = rank === 1 ? "text-yellow-400" : rank === 2 ? "text-slate-400" : "text-amber-500";
    return <Award className={cn("w-3.5 h-3.5 flex-shrink-0 ml-0.5", colorClass)} />;
  };

  const nameForDisplay = nation ? `${nation.name}` : "N/D";
  const artistAndSongForDisplay = nation ? `${nation.artistName} - ${nation.songTitle}` : "";
  
  let rankTextForDisplay = "";
  if (label && categoryRank) {
    const suffix = label === "Miglior Canzone:" ? "" : label === "Peggior Canzone:" ? " peggiore" : " in cat.";
    rankTextForDisplay = `(${categoryRank}°${suffix})`;
  } else if (!label && nation?.ranking && nation.ranking > 0) {
    rankTextForDisplay = `(${nation.ranking}°)`;
  }

  const NationInfoContent = () => (
    <>
      <Image
        src={`https://flagcdn.com/w40/${nation!.countryCode.toLowerCase()}.png`}
        alt={`Bandiera ${nation!.name}`}
        width={24}
        height={16}
        className="rounded-sm border border-border/50 object-contain flex-shrink-0"
        data-ai-hint={`${nation!.name} flag`}
      />
      <div className="flex flex-col text-left flex-grow">
        <div className="flex items-center">
          <span className="text-sm text-foreground/90 group-hover:underline group-hover:text-primary truncate" title={`${nameForDisplay} ${rankTextForDisplay} - ${artistAndSongForDisplay}`}>
            {nation!.name}
          </span>
          {label && categoryRank && [1, 2, 3].includes(categoryRank) && <MedalIcon rank={categoryRank} />}
          {!label && nation?.ranking && [1, 2, 3].includes(nation.ranking) && <MedalIcon rank={nation.ranking} />}
          {rankTextForDisplay && (
             <span className="text-xs text-muted-foreground group-hover:text-primary/80 ml-0.5 whitespace-nowrap">
                {rankTextForDisplay}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground truncate group-hover:text-primary/80" title={artistAndSongForDisplay}>
          {artistAndSongForDisplay}
        </span>
      </div>
    </>
  );

  if (label) { // For "Pronostici TreppoScore" items
    return (
      <div className={cn(
        "px-2 py-1.5", // Common padding for the whole item
        isEvenRow && "bg-muted/50 rounded-md" // Zebra striping
      )}>
        {/* Row 1 (always): Icon and Label */}
        <div className="flex items-center gap-1.5">
          <IconComponent className={cn("h-5 w-5 flex-shrink-0", iconColor)} />
          <span className="text-xs text-foreground/90 min-w-[120px] flex-shrink-0 font-medium">{label}</span>
        </div>

        {/* Row 2 (on mobile, indented on desktop): Nation Details */}
        <div className={cn(
          "mt-1 sm:mt-0", // Margin top on mobile for separation, none on desktop
          "sm:ml-[calc(1.25rem+0.375rem)]" // Indent on sm+ screens (icon width + gap approx)
        )}>
          <div className="flex items-center gap-1.5"> {/* Inner flex for flag + text block */}
            {nation ? (
              <Link href={`/nations/${nation.id}`} className="group flex-grow flex items-center gap-1">
                <NationInfoContent />
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
    );
  }

  // For "Scelte Principali" items (no label)
  return (
    <div className={cn(
      "flex items-center gap-1.5 py-1",
      "px-2", // Consistent horizontal padding
      isEvenRow && "bg-muted/50 rounded-md" // Conditional background
    )}>
      <IconComponent className={cn("h-5 w-5 flex-shrink-0", iconColor)} />
      {nation ? (
        <Link href={`/nations/${nation.id}`} className="group flex-grow flex items-center gap-1">
           <NationInfoContent />
        </Link>
      ) : (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <UserCircle className="h-4 w-4 flex-shrink-0" />
          <span>Nessuna selezione</span>
        </div>
      )}
    </div>
  );
});
SelectedNationDisplay.displayName = 'SelectedNationDisplay';


interface TeamListItemProps {
  team: Team & {
    primaSquadraDetails?: Array<{ id: string; name: string; countryCode: string; actualRank?: number; points: number }>;
    categoryPicksDetails?: Array<{ categoryName: string; pickedNationId?: string; pickedNationName?: string; pickedNationCountryCode?: string; actualCategoryRank?: number; pointsAwarded: number; iconName: string; }>;
    rank?: number; // For leaderboard podium cards
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
    [key: string]: { rank?: number; isCorrectPick?: boolean };
  }>({});

  useEffect(() => {
    async function fetchLockStatus() {
      if (!disableEdit) { // Only fetch if editing is potentially allowed
        const status = await getTeamsLockedStatus();
        setTeamsLocked(status);
      }
    }
    fetchLockStatus();
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
          .sort((a, b) => {
            if (a.score === null && b.score === null) return 0;
            if (a.score === null) return 1;
            if (b.score === null) return -1;
            return order === 'desc' ? b.score - a.score : a.score - b.score;
          });
      };
      
      const getRank = (nationId?: string, sortedList?: Array<{id: string, score: number | null}>): number | undefined => {
        if (!nationId || !sortedList) return undefined;
        const rankIndex = sortedList.findIndex(n => n.id === nationId);
        return rankIndex !== -1 ? rankIndex + 1 : undefined;
      };

      const bestSongList = getSortedList('averageSongScore', 'desc');
      const worstSongList = getSortedList('averageSongScore', 'asc');
      const bestPerfList = getSortedList('averagePerformanceScore', 'desc');
      const bestOutfitList = getSortedList('averageOutfitScore', 'desc');
      
      const newRanks: { [key: string]: { rank?: number; isCorrectPick?: boolean } } = {};
      
      newRanks['bestSong'] = { rank: getRank(team.bestSongNationId, bestSongList), isCorrectPick: team.bestSongNationId === bestSongList[0]?.id };
      newRanks['worstSong'] = { rank: getRank(team.worstSongNationId, worstSongList), isCorrectPick: team.worstSongNationId === worstSongList[0]?.id };
      newRanks['bestPerf'] = { rank: getRank(team.bestPerformanceNationId, bestPerfList), isCorrectPick: team.bestPerformanceNationId === bestPerfList[0]?.id };
      newRanks['bestOutfit'] = { rank: getRank(team.bestOutfitNationId, bestOutfitList), isCorrectPick: team.bestOutfitNationId === bestOutfitList[0]?.id };
      
      setCategoryRanksAndCorrectness(newRanks);
    }
  }, [nationGlobalCategorizedScoresMap, nations, team]);


  const getNationDetailsById = (id?: string): Nation | undefined => {
    if (!id) return undefined;
    return nations.find(n => n.id === id);
  };

  const founderNationsDetails = (team.founderChoices || [])
    .map(id => getNationDetailsById(id))
    .filter((n): n is Nation => Boolean(n))
    .sort((a, b) => (a.ranking ?? Infinity) - (b.ranking ?? Infinity));
  
  const treppoScorePicks = [
    { id: 'bestSong', details: getNationDetailsById(team.bestSongNationId), Icon: Music2, label: "Miglior Canzone:", rankInfo: categoryRanksAndCorrectness['bestSong'] },
    { id: 'bestPerf', details: getNationDetailsById(team.bestPerformanceNationId), Icon: Star, label: "Miglior Performance:", rankInfo: categoryRanksAndCorrectness['bestPerf'] },
    { id: 'bestOutfit', details: getNationDetailsById(team.bestOutfitNationId), Icon: Shirt, label: "Miglior Outfit:", rankInfo: categoryRanksAndCorrectness['bestOutfit'] },
    { id: 'worstSong', details: getNationDetailsById(team.worstSongNationId), Icon: ThumbsDown, label: "Peggior Canzone:", rankInfo: categoryRanksAndCorrectness['worstSong'] },
  ];

  const isOwner = user?.uid === team.userId;
  const isLeaderboardPodiumCard = !!(team.primaSquadraDetails && team.categoryPicksDetails);

  const borderClass =
    team.rank === 1 ? "border-yellow-400 border-2 shadow-yellow-400/30" :
    team.rank === 2 ? "border-slate-400 border-2 shadow-slate-400/30" :
    team.rank === 3 ? "border-amber-500 border-2 shadow-amber-500/30" :
    "border-border";

  const PrimaSquadraNationDisplayDetailPodium = ({ detail }: { detail: { id: string; name: string; countryCode: string; actualRank?: number; points: number } }) => {
      const MedalIcon = ({ rank }: { rank?: number }) => {
        if (!rank || rank < 1 || rank > 3) return null;
        const colorClass = rank === 1 ? "text-yellow-400" : rank === 2 ? "text-slate-400" : "text-amber-500";
        return <Award className={cn("w-3.5 h-3.5 flex-shrink-0 ml-1", colorClass)} />;
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

  const CategoryPickDisplayDetailPodium = ({ detail }: { detail: { categoryName: string; pickedNationId?: string; pickedNationName?: string; pickedNationCountryCode?: string; actualCategoryRank?: number; pointsAwarded: number; iconName: string; } }) => {
    let IconComponent: React.ElementType;
    switch (detail.iconName) {
        case 'Music2': IconComponent = Music2; break;
        case 'Star': IconComponent = Star; break;
        case 'Shirt': IconComponent = Shirt; break;
        case 'ThumbsDown': IconComponent = ThumbsDown; break;
        default: IconComponent = Users; 
    }

    const CategoryMedalIcon = ({ rank }: { rank?: number }) => {
        if (!rank || rank < 1 || rank > 3) return null;
        const colorClass = rank === 1 ? "text-yellow-400" : rank === 2 ? "text-slate-400" : "text-amber-500";
        return <Award className={cn("w-3.5 h-3.5 flex-shrink-0 ml-1", colorClass)} />;
    };
    
    const iconColorClass = "text-accent";
    
    let rankText = "";
    let rankSuffix = "";
    if (detail.actualCategoryRank && detail.actualCategoryRank > 0) {
        if (detail.categoryName === "Miglior Canzone") rankSuffix = "";
        else if (detail.categoryName === "Peggior Canzone") rankSuffix = " peggiore";
        else rankSuffix = " in cat.";
        rankText = `(${detail.actualCategoryRank}°${rankSuffix})`;
    }

    return (
      <div className={cn(
        "px-2 py-1.5"
      )}>
         <div className="flex items-center gap-1.5">
            <IconComponent className={cn("w-5 h-5 flex-shrink-0", iconColorClass)} />
            <span className="text-xs text-foreground/90 min-w-[120px] flex-shrink-0 font-medium">{detail.categoryName}</span>
        </div>
        <div className={cn(
            "mt-1 sm:mt-0",
            "sm:ml-[calc(1.25rem+0.375rem)]"
        )}>
            <div className="flex items-center gap-1.5">
                {detail.pickedNationId && detail.pickedNationCountryCode && detail.pickedNationName ? (
                <Link href={`/nations/${detail.pickedNationId}`}
                        className={cn("text-xs hover:underline hover:text-primary truncate flex-grow flex items-center gap-1")}
                        title={`${detail.pickedNationName || 'N/D'} ${rankText} - Punti: ${detail.pointsAwarded}`}
                >
                    <Image
                    src={`https://flagcdn.com/w20/${detail.pickedNationCountryCode.toLowerCase()}.png`}
                    alt={detail.pickedNationName}
                    width={20}
                    height={13}
                    className="rounded-sm border border-border/30 object-contain flex-shrink-0"
                    data-ai-hint={`${detail.pickedNationName} flag`}
                    />
                    <span className="font-medium">
                    {detail.pickedNationName ? (detail.pickedNationName.substring(0, 12) + (detail.pickedNationName.length > 12 ? '...' : '')) : "N/D"}
                    </span>
                    <CategoryMedalIcon rank={detail.actualCategoryRank} />
                    {rankText && (
                        <span className="text-muted-foreground ml-0.5 text-xs flex items-center">
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
                <span className={cn("text-xs ml-auto pl-1", detail.pointsAwarded > 0 ? "font-semibold text-primary" : "text-muted-foreground")}>
                    {detail.pointsAwarded > 0 ? `+${detail.pointsAwarded}pt` : `${detail.pointsAwarded}pt`}
                </span>
            </div>
        </div>
      </div>
    );
  };

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
            (isOwnTeamCard && !disableEdit && teamsLocked === false) 
              ? "flex flex-row-reverse items-center gap-2" 
              : "flex flex-col items-end gap-1"
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
            {team.categoryPicksDetails.map((detail, index) => (
              <CategoryPickDisplayDetailPodium 
                key={`${team.id}-${detail.categoryName}-detail`} 
                detail={detail} 
              />
            ))}
          </>
        ) : (
          <>
            <p className="text-xl font-bold text-foreground mt-2 mb-1.5">
                Scelte Principali
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
            {treppoScorePicks.map((category, index) => (
              <SelectedNationDisplay
                key={category.id}
                nation={category.details}
                IconComponent={category.Icon}
                label={category.label}
                isEvenRow={index % 2 !== 0}
                categoryRank={category.rankInfo?.rank}
                isCorrectPick={category.rankInfo?.isCorrectPick}
              />
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}

    