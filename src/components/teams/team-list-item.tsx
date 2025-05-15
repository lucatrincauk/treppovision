
"use client";

import type { Team, Nation, NationGlobalCategorizedScores } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCircle, Edit, Music2, Star, ThumbsDown, Shirt, Lock, BadgeCheck, TrendingUp, Award, ListChecks } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { getTeamsLockedStatus } from "@/lib/actions/team-actions";
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";


interface SelectedNationDisplayProps {
  nation?: Nation;
  IconComponent: React.ElementType;
  label?: string;
  isCorrectPick?: boolean;
  globalScoreForCategory?: number | null;
  isEvenRow?: boolean;
  isOwnTeamCard?: boolean; // Added to control rank display for Scelte Principali
}

const SelectedNationDisplay = ({ nation, IconComponent, label, isCorrectPick, globalScoreForCategory, isEvenRow }: SelectedNationDisplayProps) => {
  if (!nation) {
    return (
      <div className={cn("flex items-center gap-1.5 px-2 py-1", isEvenRow && "bg-muted/50 rounded-md")}>
        <IconComponent className={cn("h-5 w-5 flex-shrink-0 text-accent", isCorrectPick && "text-yellow-400 font-bold")} />
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
  
  const rankText = nation.ranking && nation.ranking > 0 ? `(${nation.ranking}°)` : '';
  const nameForDisplay = `${nation.name}${!label && rankText ? ` ${rankText}` : ''}`;
  const titleText = `${nation.name}${rankText} - ${nation.artistName} - ${nation.songTitle}`;


  return (
    <div className={cn(
        "flex gap-1.5 px-2 py-1 items-center",
        isEvenRow && "bg-muted/50 rounded-md",
        label && "flex-col sm:flex-row sm:items-center sm:gap-1.5 py-1.5" // Stacking for labeled items on mobile
    )}>
        <div className={cn("flex items-center gap-1.5", label && "w-full sm:w-auto")}>
            <IconComponent className={cn("h-5 w-5 flex-shrink-0", isCorrectPick ? "text-yellow-400 font-bold" : "text-accent")} />
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
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                           <span className="text-sm text-foreground/90 group-hover:underline group-hover:text-primary truncate" title={titleText}>
                                {nation.name}
                            </span>
                            {!label && nation.ranking && nation.ranking > 0 && (
                                <>
                                    <MedalIcon rank={nation.ranking} />
                                    <span className="text-xs text-muted-foreground group-hover:text-primary/80 ml-0.5">
                                        ({nation.ranking}°)
                                    </span>
                                </>
                            )}
                        </div>
                        <span className="text-xs text-muted-foreground truncate group-hover:text-primary/80 sm:inline" title={`${nation.artistName} - ${nation.songTitle}`}>
                            {nation.artistName} - {nation.songTitle}
                        </span>
                        {label && globalScoreForCategory !== null && globalScoreForCategory !== undefined && (
                            <p className="text-xs text-primary font-medium mt-0.5">
                                Punteggio Globale: {globalScoreForCategory.toFixed(2)}
                            </p>
                        )}
                    </div>
                </div>
            </Link>
        </div>
    </div>
  );
};

interface TeamListItemProps {
  team: Team;
  nations: Nation[];
  nationGlobalCategorizedScoresMap: Map<string, NationGlobalCategorizedScores>;
  isOwnTeamCard?: boolean;
}

export function TeamListItem({ team, nations, nationGlobalCategorizedScoresMap, isOwnTeamCard = false }: TeamListItemProps) {
  const { user } = useAuth();
  const [teamsLocked, setTeamsLocked] = useState<boolean | null>(null);

  const [bestSongNationIdGlobal, setBestSongNationIdGlobal] = useState<string | null>(null);
  const [worstSongNationIdGlobal, setWorstSongNationIdGlobal] = useState<string | null>(null);
  const [bestPerformanceNationIdGlobal, setBestPerformanceNationIdGlobal] = useState<string | null>(null);
  const [bestOutfitNationIdGlobal, setBestOutfitNationIdGlobal] = useState<string | null>(null);


  useEffect(() => {
    async function fetchLockStatus() {
      const status = await getTeamsLockedStatus();
      setTeamsLocked(status);
    }
    fetchLockStatus();
  }, []);

  useEffect(() => {
    if (nationGlobalCategorizedScoresMap.size > 0) {
      let maxSongScore = -Infinity;
      let tempBestSongId: string | null = null;
      nationGlobalCategorizedScoresMap.forEach((scores, nationId) => {
        if (scores.averageSongScore !== null && scores.voteCount > 0 && scores.averageSongScore > maxSongScore) {
          maxSongScore = scores.averageSongScore;
          tempBestSongId = nationId;
        }
      });
      setBestSongNationIdGlobal(tempBestSongId);

      let minSongScore = Infinity;
      let tempWorstSongId: string | null = null;
      nationGlobalCategorizedScoresMap.forEach((scores, nationId) => {
        if (scores.averageSongScore !== null && scores.voteCount > 0 && scores.averageSongScore < minSongScore) {
          minSongScore = scores.averageSongScore;
          tempWorstSongId = nationId;
        }
      });
      setWorstSongNationIdGlobal(tempWorstSongId);
      
      let maxPerfScore = -Infinity;
      let tempBestPerfId: string | null = null;
      nationGlobalCategorizedScoresMap.forEach((scores, nationId) => {
        if (scores.averagePerformanceScore !== null && scores.voteCount > 0 && scores.averagePerformanceScore > maxPerfScore) {
          maxPerfScore = scores.averagePerformanceScore;
          tempBestPerfId = nationId;
        }
      });
      setBestPerformanceNationIdGlobal(tempBestPerfId);

      let maxOutfitScore = -Infinity;
      let tempBestOutfitId: string | null = null;
      nationGlobalCategorizedScoresMap.forEach((scores, nationId) => {
        if (scores.averageOutfitScore !== null && scores.voteCount > 0 && scores.averageOutfitScore > maxOutfitScore) {
          maxOutfitScore = scores.averageOutfitScore;
          tempBestOutfitId = nationId;
        }
      });
      setBestOutfitNationIdGlobal(tempBestOutfitId);
    }
  }, [nationGlobalCategorizedScoresMap]);


  const getNationDetailsById = (id?: string, nationsList?: Nation[]): Nation | undefined => {
    if (!id || !nationsList) return undefined;
    return nationsList.find(n => n.id === id);
  };

  const getGlobalScoreForCategory = (nationId?: string, category?: 'song' | 'performance' | 'outfit'): number | null => {
    if (!nationId || !category || !nationGlobalCategorizedScoresMap.has(nationId)) return null;
    const scores = nationGlobalCategorizedScoresMap.get(nationId);
    if (!scores) return null;
    switch (category) {
      case 'song': return scores.averageSongScore;
      case 'performance': return scores.averagePerformanceScore;
      case 'outfit': return scores.averageOutfitScore;
      default: return null;
    }
  };

  const founderNationsDetails = (team.founderChoices || [])
    .map(id => getNationDetailsById(id, nations))
    .filter(Boolean) as Nation[];

  founderNationsDetails.sort((a, b) => {
      const rankA = a.ranking ?? Infinity;
      const rankB = b.ranking ?? Infinity;
      return rankA - rankB;
  });
    
  const bestSongNationDetails = getNationDetailsById(team.bestSongNationId, nations);
  const bestPerformanceNationDetails = getNationDetailsById(team.bestPerformanceNationId, nations);
  const bestOutfitNationDetails = getNationDetailsById(team.bestOutfitNationId, nations);
  const worstSongNationDetails = getNationDetailsById(team.worstSongNationId, nations);

  const isOwner = user?.uid === team.userId;

  return (
    <Card className={cn("flex flex-col h-full shadow-lg hover:shadow-primary/20 transition-shadow duration-300")}>
      <CardHeader className="pb-3 pt-4 flex flex-row justify-between items-start">
        <div>
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
        {isOwner && teamsLocked === false && (
          <Button asChild variant="outline" size="sm" className="ml-auto">
            <Link href={`/teams/${team.id}/edit`}>
              <Edit className="h-3 w-3 mr-1.5" />
              Modifica
            </Link>
          </Button>
        )}
        {isOwner && teamsLocked === true && (
            <Button variant="outline" size="sm" className="ml-auto" disabled>
                <Lock className="h-3 w-3 mr-1.5 text-destructive"/>
                Bloccato
            </Button>
        )}
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
            isCorrectPick={false} // Eurovision rank is shown, not "correct pick" status
            isEvenRow={index % 2 !== 0} 
            isOwnTeamCard={isOwnTeamCard}
          />
        ))}

        {isOwner && (
          <>
            <p className="text-xl font-bold text-secondary mt-4 mb-1.5 pt-3 border-t border-border/30">
                Voti TreppoScore
            </p>
            <SelectedNationDisplay 
                nation={bestSongNationDetails} 
                IconComponent={Music2} 
                label="Miglior Canzone:" 
                isCorrectPick={!!bestSongNationIdGlobal && bestSongNationDetails?.id === bestSongNationIdGlobal}
                globalScoreForCategory={getGlobalScoreForCategory(bestSongNationDetails?.id, 'song')}
                isEvenRow={false}
            />
            <SelectedNationDisplay 
                nation={bestPerformanceNationDetails} 
                IconComponent={Star} 
                label="Miglior Performance:"
                isCorrectPick={!!bestPerformanceNationIdGlobal && bestPerformanceNationDetails?.id === bestPerformanceNationIdGlobal}
                globalScoreForCategory={getGlobalScoreForCategory(bestPerformanceNationDetails?.id, 'performance')}
                isEvenRow={true}
            />
            <SelectedNationDisplay 
                nation={bestOutfitNationDetails} 
                IconComponent={Shirt} 
                label="Miglior Outfit:"
                isCorrectPick={!!bestOutfitNationIdGlobal && bestOutfitNationDetails?.id === bestOutfitNationIdGlobal}
                globalScoreForCategory={getGlobalScoreForCategory(bestOutfitNationDetails?.id, 'outfit')}
                isEvenRow={false}
            />
            <SelectedNationDisplay 
                nation={worstSongNationDetails} 
                IconComponent={ThumbsDown} 
                label="Peggior Canzone:"
                isCorrectPick={!!worstSongNationIdGlobal && worstSongNationDetails?.id === worstSongNationIdGlobal}
                globalScoreForCategory={getGlobalScoreForCategory(worstSongNationDetails?.id, 'song')}
                isEvenRow={true}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
