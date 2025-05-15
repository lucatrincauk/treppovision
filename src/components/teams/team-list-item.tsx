
"use client";

import type { Team, Nation } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Flag, BadgeCheck, HelpCircle, UserCircle, Edit, Music2, Star, ThumbsDown, Shirt, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { getTeamsLockedStatus } from "@/lib/actions/team-actions";
import React from "react";

interface TeamListItemProps {
  team: Team;
  nations: Nation[];
}

const getNationDetailsById = (id: string, nations: Nation[]): Nation | undefined => {
  return nations.find(n => n.id === id);
};

const SelectedNationDisplay = ({ nation, IconComponent, label }: { nation?: Nation, IconComponent: React.ElementType, label?: string }) => {
  if (!nation) {
    return (
      <div className="flex items-center gap-2 py-1">
        <IconComponent className="h-5 w-5 text-muted-foreground/70 flex-shrink-0" />
        {label && <span className="text-xs text-foreground/90 mr-1 min-w-[120px] flex-shrink-0 font-medium">{label}</span>}
        {!label && <IconComponent className="h-5 w-5 text-muted-foreground/70 flex-shrink-0 invisible" />}
        <HelpCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <p className="text-sm text-muted-foreground">Nazione Sconosciuta</p>
      </div>
    );
  }

  const titleText = `${nation.name} - ${nation.songTitle}${nation.ranking && nation.ranking > 0 ? ` (${nation.ranking}°)` : ''}`;

  return (
    <div className="flex items-center gap-2 py-1">
      <IconComponent className="h-5 w-5 text-accent flex-shrink-0" />
      {label && <span className="text-xs text-foreground/90 mr-1 min-w-[120px] flex-shrink-0 font-medium">{label}</span>}
      <Link href={`/nations/${nation.id}`} className="flex items-center gap-2 group">
        <Image
          src={`https://flagcdn.com/w40/${nation.countryCode.toLowerCase()}.png`}
          alt={`Bandiera ${nation.name}`}
          width={24}
          height={16}
          className="rounded-sm border border-border/50 object-contain flex-shrink-0"
          data-ai-hint={`${nation.name} flag`}
        />
        <span className="text-sm text-foreground/90 truncate group-hover:underline group-hover:text-primary" title={titleText}>
          {nation.name} <span className="text-xs text-muted-foreground hidden sm:inline">({nation.songTitle})</span>
          {nation.ranking && nation.ranking > 0 && (
            <span className="ml-1 text-xs text-accent font-semibold">({nation.ranking}°)</span>
          )}
        </span>
      </Link>
    </div>
  );
};

export function TeamListItem({ team, nations }: TeamListItemProps) {
  const { user } = useAuth();
  const [teamsLocked, setTeamsLocked] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    async function fetchLockStatus() {
      const status = await getTeamsLockedStatus();
      setTeamsLocked(status);
    }
    fetchLockStatus();
  }, []);

  const founderNationsDetails = (team.founderChoices || [])
    .map(id => getNationDetailsById(id, nations))
    .filter(Boolean) as Nation[];
    
  const day1Nation = getNationDetailsById(team.day1NationId, nations);
  const day2Nation = getNationDetailsById(team.day2NationId, nations);

  const bestSongNation = getNationDetailsById(team.bestSongNationId, nations);
  const bestPerformanceNation = getNationDetailsById(team.bestPerformanceNationId, nations);
  const bestOutfitNation = getNationDetailsById(team.bestOutfitNationId, nations);
  const worstSongNation = getNationDetailsById(team.worstSongNationId, nations);

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
        <p className="text-lg font-semibold text-foreground mt-2 mb-1.5">Scelte Principali:</p>
        {founderNationsDetails.map(nation => (
          <SelectedNationDisplay key={nation.id} nation={nation} IconComponent={BadgeCheck} />
        ))}
        <SelectedNationDisplay nation={day1Nation} IconComponent={Flag} />
        <SelectedNationDisplay nation={day2Nation} IconComponent={Flag} />

        {isOwner && (
          <>
            <p className="text-lg font-semibold text-secondary mt-3 mb-1.5 pt-2 border-t border-border/30">Voti Treppovision:</p>
            <SelectedNationDisplay nation={bestSongNation} IconComponent={Music2} label="Miglior Canzone:" />
            <SelectedNationDisplay nation={bestPerformanceNation} IconComponent={Star} label="Miglior Performance:" />
            <SelectedNationDisplay nation={bestOutfitNation} IconComponent={Shirt} label="Miglior Outfit:" />
            <SelectedNationDisplay nation={worstSongNation} IconComponent={ThumbsDown} label="Peggior Canzone:" />
          </>
        )}
      </CardContent>
    </Card>
  );
}
