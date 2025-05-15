
"use client";

import type { Team, Nation, NationGlobalCategorizedScores } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCircle, Edit, Music2, Star, ThumbsDown, Shirt, Lock, ListChecks, BadgeCheck } from "lucide-react";
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
  isCorrectPick?: boolean;
}

const SelectedNationDisplay = ({ nation, IconComponent, label, isCorrectPick }: SelectedNationDisplayProps) => {
  if (!nation) {
    return (
      <div className="flex items-center gap-2 py-1">
        <IconComponent className="h-5 w-5 text-muted-foreground/70 flex-shrink-0" />
        {label && <span className="text-xs text-foreground/90 mr-1 min-w-[120px] flex-shrink-0 font-medium">{label}</span>}
        {!label && <div className="h-5 w-5 flex-shrink-0 invisible" />} {/* Placeholder for alignment */}
        <UserCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <p className="text-sm text-muted-foreground">Nazione Sconosciuta</p>
      </div>
    );
  }

  const titleText = `${nation.name}${nation.ranking && nation.ranking > 0 ? ` (${nation.ranking}°)` : ''} - ${nation.songTitle} by ${nation.artistName}`;
  const displayName = `${nation.name}${nation.ranking && nation.ranking > 0 ? ` (${nation.ranking}°)` : ''}`;

  return (
    <div className="flex items-center gap-2 py-1">
      <IconComponent className={cn("h-5 w-5 flex-shrink-0", isCorrectPick ? "text-accent" : "text-muted-foreground/80")} />
      {label && <span className="text-xs text-foreground/90 mr-1 min-w-[120px] flex-shrink-0 font-medium">{label}</span>}
      {!label && <div className="h-5 w-5 flex-shrink-0 invisible" />} {/* Placeholder for alignment if no label */}
      <Link href={`/nations/${nation.id}`} className="flex items-center gap-2 group">
        <Image
          src={`https://flagcdn.com/w40/${nation.countryCode.toLowerCase()}.png`}
          alt={`Bandiera ${nation.name}`}
          width={24}
          height={16}
          className="rounded-sm border border-border/50 object-contain flex-shrink-0"
          data-ai-hint={`${nation.name} flag`}
        />
        <div className="flex flex-col">
            <span className="text-sm text-foreground/90 truncate group-hover:underline group-hover:text-primary" title={titleText}>
                {displayName}
            </span>
            <span className="text-xs text-muted-foreground truncate group-hover:text-primary/80" title={titleText}>
                {nation.artistName} - {nation.songTitle}
            </span>
        </div>
      </Link>
    </div>
  );
};

interface TeamListItemProps {
  team: Team;
  nations: Nation[];
  nationGlobalCategorizedScoresMap: Map<string, NationGlobalCategorizedScores>;
}

export function TeamListItem({ team, nations, nationGlobalCategorizedScoresMap }: TeamListItemProps) {
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
        if (scores.averageSongScore !== null && scores.averageSongScore > maxSongScore) {
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
        if (scores.averagePerformanceScore !== null && scores.averagePerformanceScore > maxPerfScore) {
          maxPerfScore = scores.averagePerformanceScore;
          tempBestPerfId = nationId;
        }
      });
      setBestPerformanceNationIdGlobal(tempBestPerfId);

      let maxOutfitScore = -Infinity;
      let tempBestOutfitId: string | null = null;
      nationGlobalCategorizedScoresMap.forEach((scores, nationId) => {
        if (scores.averageOutfitScore !== null && scores.averageOutfitScore > maxOutfitScore) {
          maxOutfitScore = scores.averageOutfitScore;
          tempBestOutfitId = nationId;
        }
      });
      setBestOutfitNationIdGlobal(tempBestOutfitId);
    }
  }, [nationGlobalCategorizedScoresMap]);


  const getNationDetailsById = (id: string, nationsList: Nation[]): Nation | undefined => {
    return nationsList.find(n => n.id === id);
  };

  const founderNationsDetails = (team.founderChoices || [])
    .map(id => getNationDetailsById(id, nations))
    .filter(Boolean) as Nation[];
    
  const bestSongNationDetails = getNationDetailsById(team.bestSongNationId, nations);
  const bestPerformanceNationDetails = getNationDetailsById(team.bestPerformanceNationId, nations);
  const bestOutfitNationDetails = getNationDetailsById(team.bestOutfitNationId, nations);
  const worstSongNationDetails = getNationDetailsById(team.worstSongNationId, nations);

  const isOwner = user?.uid === team.userId;

  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
      <CardHeader className="pb-3 pt-4 flex flex-row justify-between items-start">
        <div>
          <CardTitle className="text-xl text-primary flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            {team.name}
          </CardTitle>
          {team.creatorDisplayName && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <UserCircle className="h-3 w-3" />
              Creato da: {team.creatorDisplayName}
            </p>
          )}
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
        <p className="text-lg font-semibold text-foreground mt-2 mb-1.5">Nazioni:</p>
        {founderNationsDetails.map(nation => (
          <SelectedNationDisplay key={nation.id} nation={nation} IconComponent={BadgeCheck} />
        ))}

        {isOwner && (
          <>
            <p className="text-lg font-semibold text-secondary mt-3 mb-1.5 pt-2 border-t border-border/30 flex items-center">
                 Voti TreppoScore:
            </p>
            <SelectedNationDisplay 
                nation={bestSongNationDetails} 
                IconComponent={Music2} 
                label="Miglior Canzone:" 
                isCorrectPick={!!bestSongNationIdGlobal && bestSongNationDetails?.id === bestSongNationIdGlobal}
            />
            <SelectedNationDisplay 
                nation={bestPerformanceNationDetails} 
                IconComponent={Star} 
                label="Miglior Performance:"
                isCorrectPick={!!bestPerformanceNationIdGlobal && bestPerformanceNationDetails?.id === bestPerformanceNationIdGlobal}
            />
            <SelectedNationDisplay 
                nation={bestOutfitNationDetails} 
                IconComponent={Shirt} 
                label="Miglior Outfit:"
                isCorrectPick={!!bestOutfitNationIdGlobal && bestOutfitNationDetails?.id === bestOutfitNationIdGlobal}
            />
            <SelectedNationDisplay 
                nation={worstSongNationDetails} 
                IconComponent={ThumbsDown} 
                label="Peggior Canzone:"
                isCorrectPick={!!worstSongNationIdGlobal && worstSongNationDetails?.id === worstSongNationIdGlobal}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

    