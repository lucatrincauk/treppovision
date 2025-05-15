
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

interface SelectedNationDisplayProps {
  nation?: Nation;
  IconComponent: React.ElementType;
  label?: string;
  isEvenRow?: boolean;
  isOwnTeamCard?: boolean;
  categoryRank?: number; 
  isCorrectPick?: boolean;
  globalScoreForCategory?: number | null;
}

const SelectedNationDisplay = ({ nation, IconComponent, label, isEvenRow, categoryRank, isCorrectPick, globalScoreForCategory }: SelectedNationDisplayProps) => {
  if (!nation) {
    return (
      <div className={cn("flex items-center gap-1.5 px-2 py-1", isEvenRow && "bg-muted/50 rounded-md")}>
        <IconComponent className={cn("h-5 w-5 flex-shrink-0", isCorrectPick ? "text-accent" : "text-accent")} />
        {label && <span className="text-xs text-foreground/90 mr-1 min-w-[120px] flex-shrink-0 font-medium">{label}</span>}
        <UserCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <p className="text-sm text-muted-foreground">Nazione Sconosciuta</p>
      </div>
    );
  }

  const MedalIcon = ({ rank }: { rank?: number }) => {
    if (rank === 1) return <Award className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 ml-1" />;
    if (rank === 2) return <Award className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 ml-1" />;
    if (rank === 3) return <Award className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 ml-1" />;
    return null;
  };

  let rankText = "";
  if (label && categoryRank && categoryRank > 0) { 
    let categorySuffix = "in cat.";
    if (label === "Peggior Canzone:") categorySuffix = "peggiore";
    else if (label === "Miglior Canzone:") categorySuffix = "";
    
    rankText = `(${categoryRank}°${categorySuffix ? ' ' + categorySuffix : ''})`;
  } else if (!label && nation.ranking && nation.ranking > 0) { 
    rankText = `(${nation.ranking}°)`;
  }
  
  const nameForDisplay = nation.name;
  const titleText = `${nation.name}${rankText} - ${nation.artistName} - ${nation.songTitle}${globalScoreForCategory ? ` (Punteggio Globale: ${globalScoreForCategory.toFixed(2)})` : ''}`;
  const iconColor = isCorrectPick ? "text-accent" : "text-accent";

  return (
    <div className={cn(
        "flex items-center gap-1.5 px-2 py-1", 
        isEvenRow && "bg-muted/50 rounded-md",
        label && "flex-col sm:flex-row sm:items-center sm:gap-1.5 py-1.5" 
    )}>
      <div className={cn("flex items-center gap-1.5", label && "w-full sm:w-auto")}>
        <IconComponent className={cn("h-5 w-5 flex-shrink-0", iconColor)} />
        {label && <span className="text-xs text-foreground/90 mr-1 min-w-[120px] flex-shrink-0 font-medium">{label}</span>}
      </div>
      
      <div className={cn("flex-grow flex items-center justify-between", label && "w-full sm:w-auto")}>
         <Link href={`/nations/${nation.id}`} className="group flex-grow">
          <div className="flex items-center gap-2">
            <Image
              src={`https://flagcdn.com/w40/${nation.countryCode.toLowerCase()}.png`}
              alt={`Bandiera ${nation.name}`}
              width={24}
              height={16}
              className="rounded-sm border border-border/50 object-contain flex-shrink-0"
              data-ai-hint={`${nation.name} flag`}
            />
            <div className="flex flex-col text-left"> 
              <div className="flex items-center gap-1">
                <span className="text-sm text-foreground/90 group-hover:underline group-hover:text-primary truncate" title={titleText}>
                  {nameForDisplay}
                </span>
                {!label && nation.ranking && <MedalIcon rank={nation.ranking} />}
                {label && categoryRank && <MedalIcon rank={categoryRank} />}
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
                <span className="text-xs text-primary font-medium mt-0.5">
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


interface TeamListItemProps {
  team: Team & { score?: number }; 
  nations: Nation[];
  nationGlobalCategorizedScoresMap: Map<string, NationGlobalCategorizedScores>;
  isOwnTeamCard?: boolean;
}

export function TeamListItem({ team, nations, nationGlobalCategorizedScoresMap, isOwnTeamCard = false }: TeamListItemProps) {
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

  const getGlobalScoreForCategory = (nationId?: string, category?: 'song' | 'performance' | 'outfit'): number | null | undefined => {
    if (!nationId || !category || !nationGlobalCategorizedScoresMap.has(nationId)) return undefined;
    const scores = nationGlobalCategorizedScoresMap.get(nationId);
    if (!scores) return undefined;
    switch (category) {
      case 'song': return scores.averageSongScore;
      case 'performance': return scores.averagePerformanceScore;
      case 'outfit': return scores.averageOutfitScore;
      default: return undefined;
    }
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

  const teamScore = team.score; 

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
        <div className="flex flex-col items-end ml-2 flex-shrink-0"> {/* Added flex-shrink-0 */}
          {typeof teamScore === 'number' && (
            <div className="text-lg font-bold text-primary mb-1 whitespace-nowrap">
              {teamScore} pt
            </div>
          )}
          {isOwner && teamsLocked === false && !isOwnTeamCard && ( // Hide general edit button if it's the own team card shown on /teams page
            <Button asChild variant="outline" size="sm">
              <Link href={`/teams/${team.id}/edit`}>
                <Edit className="h-3 w-3 mr-1.5" />
                Modifica
              </Link>
            </Button>
          )}
           {isOwner && teamsLocked === false && isOwnTeamCard && ( // Specific placement for own team card edit
            <Button asChild variant="outline" size="sm">
              <Link href={`/teams/${team.id}/edit`}>
                <Edit className="h-3 w-3 mr-1.5" />
                Modifica Squadra
              </Link>
            </Button>
          )}
          {isOwner && teamsLocked === true && (
              <Button variant="outline" size="sm" disabled>
                  <Lock className="h-3 w-3 mr-1.5 text-destructive"/>
                  Bloccato
              </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-1 pt-0 pb-4">
        <p className="text-xl font-bold text-foreground mt-2 mb-1.5">
            Scelte Principali:
        </p>
        {founderNationsDetails.map((nation, index) => (
          <SelectedNationDisplay 
            key={`founder-${nation.id}`} 
            nation={nation} 
            IconComponent={BadgeCheck} 
            isEvenRow={index % 2 !== 0}
          />
        ))}

        { (isOwnTeamCard || user?.isAdmin) && ( 
          <>
            <p className="text-xl font-bold text-secondary mt-4 mb-1.5 pt-3 border-t border-border/30">
                Voti TreppoScore:
            </p>
            <SelectedNationDisplay 
                nation={bestSongNationDetails} 
                IconComponent={Music2} 
                label="Miglior Canzone:" 
                isEvenRow={false}
                categoryRank={bestSongPickRank}
                isCorrectPick={bestSongPickRank !== undefined && bestSongPickRank <= 3}
                globalScoreForCategory={getGlobalScoreForCategory(team.bestSongNationId, 'song')}
            />
            <SelectedNationDisplay 
                nation={bestPerformanceNationDetails} 
                IconComponent={Star} 
                label="Miglior Performance:"
                isEvenRow={true}
                categoryRank={bestPerfPickRank}
                isCorrectPick={bestPerfPickRank !== undefined && bestPerfPickRank <=3 }
                globalScoreForCategory={getGlobalScoreForCategory(team.bestPerformanceNationId, 'performance')}
            />
            <SelectedNationDisplay 
                nation={bestOutfitNationDetails} 
                IconComponent={Shirt} 
                label="Miglior Outfit:"
                isEvenRow={false}
                categoryRank={bestOutfitPickRank}
                isCorrectPick={bestOutfitPickRank !== undefined && bestOutfitPickRank <= 3}
                globalScoreForCategory={getGlobalScoreForCategory(team.bestOutfitNationId, 'outfit')}

            />
            <SelectedNationDisplay 
                nation={worstSongNationDetails} 
                IconComponent={ThumbsDown} 
                label="Peggior Canzone:"
                isEvenRow={true}
                categoryRank={worstSongPickRank}
                isCorrectPick={worstSongPickRank !== undefined && worstSongPickRank <= 3} 
                globalScoreForCategory={getGlobalScoreForCategory(team.worstSongNationId, 'song')} 
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

    