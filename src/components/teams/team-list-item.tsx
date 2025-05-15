
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

interface SelectedNationDisplayProps {
  nation?: Nation;
  IconComponent: React.ElementType;
  label?: string;
  isEvenRow?: boolean;
  isOwnTeamCard?: boolean; // To control specific UI elements for the owner
  categoryRank?: number; // Rank within the specific category (e.g., 1st best song)
  isCorrectPick?: boolean; // If the user's pick matched the global #1 for that category
  showEurovisionRank?: boolean; // New prop to control display of Eurovision rank
  globalScoreForCategory?: number | null; // New prop to pass the actual score in category
}

const SelectedNationDisplay = ({ 
  nation, 
  IconComponent, 
  label, 
  isEvenRow, 
  categoryRank, 
  isCorrectPick,
  showEurovisionRank = true, // Default to true
  globalScoreForCategory
}: SelectedNationDisplayProps) => {
  if (!nation) {
    // Simplified rendering for when a nation is not picked or data is missing
    return (
      <div className={cn("flex items-center gap-1.5 px-2 py-1", isEvenRow && "bg-muted/50 rounded-md")}>
        <IconComponent className={cn("h-5 w-5 flex-shrink-0", isCorrectPick ? "text-accent" : "text-accent")} />
        {label && <span className="text-xs text-foreground/90 mr-1 min-w-[120px] flex-shrink-0 font-medium">{label}</span>}
        <UserCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <p className="text-sm text-muted-foreground">Nazione non selezionata</p>
      </div>
    );
  }

  const EurovisionMedalIcon = ({ rank }: { rank?: number }) => {
    if (rank === 1) return <Award className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 ml-0.5" />;
    if (rank === 2) return <Award className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 ml-0.5" />;
    if (rank === 3) return <Award className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 ml-0.5" />;
    return null;
  };
  
  const CategoryMedalIcon = ({ rank }: { rank?: number }) => {
    if (rank === 1) return <Award className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 ml-0.5" />;
    if (rank === 2) return <Award className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 ml-0.5" />;
    if (rank === 3) return <Award className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 ml-0.5" />;
    return null;
  };


  let rankText = "";
  let titleText = `${nation.name} - ${nation.artistName} - ${nation.songTitle}`;

  if (label) { // For "Voti TreppoScore" items
    if (categoryRank && categoryRank > 0) {
      let categorySuffix = "in cat.";
      if (label === "Peggior Canzone:") categorySuffix = "peggiore";
      else if (label === "Miglior Canzone:") categorySuffix = ""; // No suffix for best song
      rankText = `(${categoryRank}°${categorySuffix ? ' ' + categorySuffix : ''})`;
    }
    titleText = `${nation.name}${rankText} - ${nation.artistName} - ${nation.songTitle}`;
  } else if (showEurovisionRank && nation.ranking && nation.ranking > 0) { // For "Scelte Principali"
    rankText = `(${nation.ranking}°)`;
    titleText = `${nation.name}${rankText} - ${nation.artistName} - ${nation.songTitle}`;
  }
  
  const iconColor = isCorrectPick ? "text-accent" : "text-accent";

  const mainContainerClasses = cn(
    "flex gap-1.5 px-2 py-1",
    label ? "flex-col sm:flex-row sm:items-center" : "items-center",
    isEvenRow && "bg-muted/50 rounded-md"
  );

  const labelAndIconContainerClasses = cn(
    "flex items-center gap-1.5",
    label && "w-full sm:w-auto"
  );
  
  const nationInfoContainerClasses = cn(
    "flex-grow flex items-center gap-2", // Added gap-2 here for flag and text
    label && "w-full sm:w-auto"
  );

  return (
    <div className={mainContainerClasses}>
      <div className={labelAndIconContainerClasses}>
        <IconComponent className={cn("h-5 w-5 flex-shrink-0", iconColor)} />
        {label && <span className="text-xs text-foreground/90 mr-1 min-w-[120px] flex-shrink-0 font-medium">{label}</span>}
      </div>
      
      <div className={nationInfoContainerClasses}>
         <Link href={`/nations/${nation.id}`} className="group flex-grow">
          <div className="flex items-center gap-2"> {/* Container for flag + text details */}
            <Image
              src={`https://flagcdn.com/w40/${nation.countryCode.toLowerCase()}.png`}
              alt={`Bandiera ${nation.name}`}
              width={24}
              height={16}
              className="rounded-sm border border-border/50 object-contain flex-shrink-0"
              data-ai-hint={`${nation.name} flag`}
            />
            <div className="flex flex-col text-left"> 
              <div className="flex items-center">
                <span className="text-sm text-foreground/90 group-hover:underline group-hover:text-primary truncate" title={titleText}>
                  {nation.name}
                </span>
                {label && categoryRank && <CategoryMedalIcon rank={categoryRank} />}
                {!label && showEurovisionRank && <EurovisionMedalIcon rank={nation.ranking} />}
                {rankText && (
                  <span className="text-xs text-muted-foreground group-hover:text-primary/80 ml-0.5">
                    {rankText}
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground truncate group-hover:text-primary/80 sm:inline" title={`${nation.artistName} - ${nation.songTitle}`}>
                {nation.artistName} - {nation.songTitle}
              </span>
               {label && globalScoreForCategory !== null && globalScoreForCategory !== undefined && (
                <span className="text-xs text-primary font-medium">
                  Punteggio Globale: {globalScoreForCategory.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};


// Specific display components for Leaderboard card details
const PrimaSquadraNationDisplayDetail = ({ detail }: { detail: { id: string; name: string; countryCode: string; actualRank?: number; points: number } }) => {
  const EurovisionMedalIcon = ({ rank }: { rank?: number }) => {
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
        <EurovisionMedalIcon rank={detail.actualRank} />
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

const CategoryPickDisplayDetail = ({ detail }: { detail: { categoryName: string; pickedNationId?: string; pickedNationName?: string; pickedNationCountryCode?: string; actualCategoryRank?: number; pickedNationScoreInCategory?: number | null; pointsAwarded: number; iconName: string; } }) => {
  let IconComponent: React.ElementType;
  switch (detail.iconName) {
    case 'Music2': IconComponent = Music2; break;
    case 'Star': IconComponent = Star; break;
    case 'Shirt': IconComponent = Shirt; break;
    case 'ThumbsDown': IconComponent = ThumbsDown; break;
    default: IconComponent = Info;
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
      <span className="text-xs text-muted-foreground min-w-[100px] flex-shrink-0">{detail.categoryName}:</span>
      <Link href={detail.pickedNationId ? `/nations/${detail.pickedNationId}` : '#'}
        className={cn("text-xs hover:underline hover:text-primary truncate flex-grow flex items-center", !detail.pickedNationId && "pointer-events-none")}
        title={detail.pickedNationName ? `${detail.pickedNationName}${detail.actualCategoryRank ? ` (${detail.actualCategoryRank}° ${detail.categoryName === "Peggior Canzone" ? "peggiore" : (detail.categoryName === "Miglior Canzone" ? "" : "in cat.")})` : ''} - Punti: ${detail.pointsAwarded}` : `Punti: ${detail.pointsAwarded}`}
      >
        <span className="font-medium">
          {detail.pickedNationName ? (detail.pickedNationName.substring(0, 12) + (detail.pickedNationName.length > 12 ? '...' : '')) : "N/D"}
        </span>
        <CategoryMedalIcon rank={detail.actualCategoryRank} />
        {detail.actualCategoryRank && (
          <span className="text-muted-foreground ml-0.5 text-xs flex items-center">
            (
            {detail.actualCategoryRank}°
            {detail.pickedNationScoreInCategory !== null && detail.pickedNationScoreInCategory !== undefined && (
              <span className="ml-1 flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5 text-primary" />
                {detail.pickedNationScoreInCategory.toFixed(2)}
              </span>
            )}
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


interface TeamListItemProps {
  team: Team & { 
    score?: number; 
    primaSquadraDetails?: Array<{ id: string; name: string; countryCode: string; actualRank?: number; points: number }>;
    categoryPicksDetails?: Array<{ categoryName: string; pickedNationId?: string; pickedNationName?: string; pickedNationCountryCode?: string; actualCategoryRank?: number; pickedNationScoreInCategory?: number | null; pointsAwarded: number; iconName: string; }>;
  };
  nations: Nation[];
  nationGlobalCategorizedScoresMap: Map<string, NationGlobalCategorizedScores>;
  isOwnTeamCard?: boolean;
  disableEdit?: boolean;
}

export function TeamListItem({ team, nations, nationGlobalCategorizedScoresMap, isOwnTeamCard = false, disableEdit = false }: TeamListItemProps) {
  const { user } = useAuth();
  const [teamsLocked, setTeamsLocked] = useState<boolean | null>(null);

  const [sortedCategoryNations, setSortedCategoryNations] = useState<{
    bestSong: Array<{ id: string; score: number | null }>;
    worstSong: Array<{ id: string; score: number | null }>;
    bestPerf: Array<{ id: string; score: number | null }>;
    bestOutfit: Array<{ id: string; score: number | null }>;
  } | null>(null);

  useEffect(() => {
    async function fetchLockStatus() {
      const status = await getTeamsLockedStatus();
      setTeamsLocked(status);
    }
    fetchLockStatus();
  }, []);

  useEffect(() => {
    if (nationGlobalCategorizedScoresMap.size > 0 && nations.length > 0) {
      const nationsMap = new Map(nations.map(n => [n.id, n]));
      
      const getSortedList = (categoryKey: 'averageSongScore' | 'averagePerformanceScore' | 'averageOutfitScore', order: 'asc' | 'desc') => {
        return Array.from(nationGlobalCategorizedScoresMap.entries())
          .map(([nationId, scores]) => ({
            id: nationId,
            name: nationsMap.get(nationId)?.name || 'Sconosciuto',
            score: scores[categoryKey]
          }))
          .filter(item => item.score !== null && (nationGlobalCategorizedScoresMap.get(item.id)?.voteCount || 0) > 0)
          .sort((a, b) => order === 'desc' ? (b.score as number) - (a.score as number) : (a.score as number) - (b.score as number));
      };

      setSortedCategoryNations({
        bestSong: getSortedList('averageSongScore', 'desc'),
        worstSong: getSortedList('averageSongScore', 'asc'),
        bestPerf: getSortedList('averagePerformanceScore', 'desc'),
        bestOutfit: getSortedList('averageOutfitScore', 'desc'),
      });
    }
  }, [nationGlobalCategorizedScoresMap, nations]);

  const getNationDetailsById = (id?: string, nationsList?: Nation[]): Nation | undefined => {
    if (!id || !nationsList) return undefined;
    return nationsList.find(n => n.id === id);
  };

  const getCategoryRank = (nationId?: string, sortedList?: Array<{ id: string }>): number | undefined => {
    if (!nationId || !sortedList) return undefined;
    const rankIndex = sortedList.findIndex(n => n.id === nationId);
    return rankIndex !== -1 ? rankIndex + 1 : undefined;
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

  const bestSongPickRank = sortedCategoryNations ? getCategoryRank(team.bestSongNationId, sortedCategoryNations.bestSong) : undefined;
  const worstSongPickRank = sortedCategoryNations ? getCategoryRank(team.worstSongNationId, sortedCategoryNations.worstSong) : undefined;
  const bestPerfPickRank = sortedCategoryNations ? getCategoryRank(team.bestPerformanceNationId, sortedCategoryNations.bestPerf) : undefined;
  const bestOutfitPickRank = sortedCategoryNations ? getCategoryRank(team.bestOutfitNationId, sortedCategoryNations.bestOutfit) : undefined;

  const isLeaderboardPodiumCard = !!(team.primaSquadraDetails && team.categoryPicksDetails);


  return (
    <Card className={cn("flex flex-col h-full shadow-lg hover:shadow-primary/20 transition-shadow duration-300")}>
      <CardHeader className="pb-3 pt-4 flex flex-row justify-between items-start">
        <div className="flex-grow"> 
          <CardTitle className="text-xl text-primary flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            {team.name}
             {team.creatorDisplayName && !isOwnTeamCard && (
              <span className="ml-1 text-xs text-muted-foreground flex items-center gap-1" title={team.creatorDisplayName}>
                (<UserCircle className="h-3 w-3" />{team.creatorDisplayName})
              </span>
            )}
          </CardTitle>
        </div>
        <div className={cn(
            "ml-2 flex-shrink-0",
            isOwnTeamCard ? "flex flex-row-reverse items-center gap-2" : "flex flex-col items-end gap-1" 
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
                {isOwnTeamCard ? "Modifica Squadra" : "Modifica"}
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
        {isLeaderboardPodiumCard && team.primaSquadraDetails ? (
          <>
            <p className="text-xl font-bold text-foreground mt-2 mb-1.5">
                Pronostici Treppovision:
            </p>
            {team.primaSquadraDetails.map((detail) => (
              <PrimaSquadraNationDisplayDetail key={`${team.id}-${detail.id}-prima-detail`} detail={detail} />
            ))}
          </>
        ) : (
          <>
            <p className="text-xl font-bold text-foreground mt-2 mb-1.5">
                Scelte Principali:
            </p>
            {founderNationsDetails.map((nation, index) => (
              <SelectedNationDisplay 
                key={`founder-${nation.id}`} 
                nation={nation} 
                IconComponent={BadgeCheck}
                isEvenRow={index % 2 !== 0}
                showEurovisionRank={true}
              />
            ))}
          </>
        )}

        { (isOwnTeamCard || user?.isAdmin || isLeaderboardPodiumCard) && ( 
          <>
            <p className="text-xl font-bold text-secondary mt-4 pt-3 border-t border-border/30 mb-1.5">
                Voti TreppoScore:
            </p>
            {isLeaderboardPodiumCard && team.categoryPicksDetails ? (
              <>
                {team.categoryPicksDetails.map((detail, index) => (
                  <CategoryPickDisplayDetail key={`${team.id}-${detail.categoryName}-detail`} detail={detail} />
                ))}
              </>
            ) : (
              <>
                <SelectedNationDisplay 
                    nation={bestSongNationDetails} 
                    IconComponent={Music2} 
                    label="Miglior Canzone:" 
                    isEvenRow={false}
                    categoryRank={bestSongPickRank}
                    isCorrectPick={bestSongPickRank === 1}
                    showEurovisionRank={false}
                    globalScoreForCategory={bestSongNationDetails && sortedCategoryNations?.bestSong.find(n => n.id === bestSongNationDetails.id)?.score}
                />
                <SelectedNationDisplay 
                    nation={bestPerformanceNationDetails} 
                    IconComponent={Star} 
                    label="Miglior Performance:"
                    isEvenRow={true}
                    categoryRank={bestPerfPickRank}
                    isCorrectPick={bestPerfPickRank === 1}
                    showEurovisionRank={false}
                    globalScoreForCategory={bestPerformanceNationDetails && sortedCategoryNations?.bestPerf.find(n => n.id === bestPerformanceNationDetails.id)?.score}
                />
                <SelectedNationDisplay 
                    nation={bestOutfitNationDetails} 
                    IconComponent={Shirt} 
                    label="Miglior Outfit:"
                    isEvenRow={false}
                    categoryRank={bestOutfitPickRank}
                    isCorrectPick={bestOutfitPickRank === 1}
                    showEurovisionRank={false}
                    globalScoreForCategory={bestOutfitNationDetails && sortedCategoryNations?.bestOutfit.find(n => n.id === bestOutfitNationDetails.id)?.score}
                />
                <SelectedNationDisplay 
                    nation={worstSongNationDetails} 
                    IconComponent={ThumbsDown} 
                    label="Peggior Canzone:"
                    isEvenRow={true}
                    categoryRank={worstSongPickRank}
                    isCorrectPick={worstSongPickRank === 1}
                    showEurovisionRank={false}
                    globalScoreForCategory={worstSongNationDetails && sortedCategoryNations?.worstSong.find(n => n.id === worstSongNationDetails.id)?.score}
                />
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
