
"use client";

import type { Nation, Vote } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Music2, UserSquare2, Award, Loader2, Star, Users, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { getUserVoteForNationFromDB, listenToAllVotesForNation } from "@/lib/voting-service";

interface NationListItemProps {
  nation: Nation;
}

export function NationListItem({ nation }: NationListItemProps) {
  const { user, isLoading: authLoading } = useAuth();

  const localThumbnailUrl = `/${nation.id}.jpg`;
  const fallbackFlagUrl = `https://flagcdn.com/w160/${nation.countryCode.toLowerCase()}.png`;

  const [imageUrl, setImageUrl] = useState(localThumbnailUrl);
  const [imageAlt, setImageAlt] = useState(`Miniatura ${nation.name}`);

  const [userVote, setUserVote] = useState<Vote | null | undefined>(undefined); // undefined for loading, null for no vote
  const [userAverageScore, setUserAverageScore] = useState<string | null>(null);
  const [isLoadingUserVote, setIsLoadingUserVote] = useState(true);

  const [globalAverageScore, setGlobalAverageScore] = useState<number | null>(null);
  const [globalVoteCount, setGlobalVoteCount] = useState<number>(0);
  const [isLoadingGlobalVote, setIsLoadingGlobalVote] = useState(true);


  useEffect(() => {
    setImageUrl(localThumbnailUrl);
    setImageAlt(`Miniatura ${nation.name}`);
  }, [nation.id, localThumbnailUrl, nation.name]);

  const handleImageError = () => {
    if (imageUrl !== fallbackFlagUrl) {
      setImageUrl(fallbackFlagUrl);
      setImageAlt(`Bandiera ${nation.name}`);
    }
  };

  // Fetch user's vote
  useEffect(() => {
    if (authLoading) {
      setIsLoadingUserVote(true);
      return;
    }
    if (!user) {
      setUserVote(null);
      setUserAverageScore(null);
      setIsLoadingUserVote(false);
      return;
    }

    setIsLoadingUserVote(true);
    let isMounted = true;
    getUserVoteForNationFromDB(nation.id, user.uid)
      .then((vote) => {
        if (!isMounted) return;
        setUserVote(vote);
        if (vote) {
          const avg = (vote.scores.song + vote.scores.performance + vote.scores.outfit) / 3;
          setUserAverageScore(avg.toFixed(2));
        } else {
          setUserAverageScore(null);
        }
      })
      .catch(error => {
        if (!isMounted) return;
        console.error("Error fetching user vote for list item:", error);
        setUserVote(null);
        setUserAverageScore(null);
      })
      .finally(() => {
        if (isMounted) setIsLoadingUserVote(false);
      });
      return () => { isMounted = false; };
  }, [nation.id, user, authLoading]);

  // Listen to global votes
  useEffect(() => {
    setIsLoadingGlobalVote(true);
    const unsubscribe = listenToAllVotesForNation(nation.id, (avgScore, count) => {
      setGlobalAverageScore(avgScore);
      setGlobalVoteCount(count);
      setIsLoadingGlobalVote(false);
    });

    return () => unsubscribe();
  }, [nation.id]);


  const rankBorderClass =
    nation.ranking === 1 ? "border-yellow-400 border-2 shadow-yellow-400/30" :
    nation.ranking === 2 ? "border-slate-400 border-2 shadow-slate-400/30" :
    nation.ranking === 3 ? "border-amber-500 border-2 shadow-amber-500/30" :
    "border-border group-hover:border-primary/50";

  return (
    <Link href={`/nations/${nation.id}`} className="group block h-full">
      <Card className={cn(
        "h-full flex flex-col overflow-hidden transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:scale-[1.02]",
        rankBorderClass
      )}>
        <CardHeader className="p-0 relative">
          <div className="aspect-[3/2] w-full relative">
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
              priority={['gb', 'fr', 'de', 'it', 'es', 'ch'].includes(nation.id) && imageUrl === fallbackFlagUrl}
              onError={handleImageError}
              data-ai-hint={imageUrl === fallbackFlagUrl ? `${nation.name} flag` : `${nation.name} thumbnail`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
            <CardTitle className="absolute bottom-3 left-4 text-xl font-bold text-white drop-shadow-md flex items-center gap-2">
              <Image
                src={`https://flagcdn.com/w20/${nation.countryCode.toLowerCase()}.png`}
                alt={`Bandiera ${nation.name}`}
                width={20}
                height={13}
                className="rounded-sm object-contain border border-white/20 shadow-sm"
                data-ai-hint={`${nation.name} flag icon`}
              />
              <span>{nation.name}</span>
            </CardTitle>

            {/* Vote Scores on Thumbnail */}
            <div className="absolute bottom-2 right-2 flex flex-col items-end text-xs">
              {/* User's Vote */}
              {!isLoadingUserVote && user && userAverageScore && (
                <div className="flex items-center justify-start bg-accent text-accent-foreground px-1.5 py-0.5 rounded-sm min-w-[70px] mb-[2px]">
                  <Star className="w-3 h-3 mr-1 text-accent-foreground" />
                  <span className="font-semibold">{userAverageScore}</span>
                </div>
              )}

              {/* Global Vote */}
              {!isLoadingGlobalVote && globalAverageScore !== null && globalVoteCount > 0 && (
                <div className="flex items-center justify-start bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-sm min-w-[70px]">
                  <TrendingUp className="w-3 h-3 mr-1 text-secondary-foreground" />
                  <span className="font-semibold">{globalAverageScore.toFixed(2)}</span>
                  <span className="ml-0.5 text-secondary-foreground/80 font-semibold">({globalVoteCount})</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow flex flex-col justify-between">
          <div className="space-y-1 text-sm mb-3">
            <p className="flex items-center text-muted-foreground">
              <Music2 className="w-4 h-4 mr-2 text-accent flex-shrink-0" />
              <span className="font-medium text-foreground truncate" title={nation.songTitle}>{nation.songTitle}</span>
            </p>
            <p className="flex items-center text-muted-foreground">
              <UserSquare2 className="w-4 h-4 mr-2 text-accent flex-shrink-0" />
              <span className="truncate" title={nation.artistName}>{nation.artistName}</span>
            </p>
            {nation.ranking && nation.ranking > 0 && (
              <p className="flex items-center text-muted-foreground">
                <Award className="w-4 h-4 mr-2 text-accent flex-shrink-0" />
                <span className="font-medium text-foreground">Posizione: {nation.ranking}°</span>
              </p>
            )}
          </div>

          {/* Placeholder for alignment if scores were here - kept for structure but content moved */}
          <div className="space-y-1 mt-auto">
             <div className="h-5"></div> {/* Placeholder for user vote alignment */}
             <div className="h-5"></div> {/* Placeholder for global vote alignment */}
          </div>

        </CardContent>
        <CardFooter className="p-4 pt-2">
          <Button variant="outline" size="sm" className="w-full group-hover:bg-accent group-hover:text-accent-foreground">
            Vedi Dettagli <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}

