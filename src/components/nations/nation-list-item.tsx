
"use client";

import type { Nation, Vote } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Music2, UserSquare2, Award, Loader2, Star, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { getUserVoteForNationFromDB, listenToAllVotesForNation } from "@/lib/voting-service";

interface NationListItemProps {
  nation: Nation & { userAverageScore?: number | null }; // Ensure userAverageScore can be passed
}

export function NationListItem({ nation }: NationListItemProps) {
  const { user, isLoading: authLoading } = useAuth();

  const localThumbnailUrl = `/${nation.id}.jpg`;
  const fallbackFlagUrl = `https://flagcdn.com/w160/${nation.countryCode.toLowerCase()}.png`;

  const [imageUrl, setImageUrl] = useState(localThumbnailUrl);
  const [imageAlt, setImageAlt] = useState(`Miniatura ${nation.name}`);

  // User's specific average score is now expected to be passed via nation.userAverageScore
  // The isLoadingUserVote state is removed as this component no longer fetches individual user votes here.
  // It relies on the parent component (like TreppoScoreRankingPage) to provide userAverageScore.

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

  const isTopRankedForScoreDisplay = nation.ranking && [1, 2, 3].includes(nation.ranking);

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

            {/* Global Vote Score on Thumbnail */}
            <div className="absolute bottom-2 right-2 flex flex-col items-end">
              {/* User's Vote is REMOVED from thumbnail */}

              {/* Global Vote */}
              {isLoadingGlobalVote ? (
                 <div className={cn(
                    "flex items-center justify-start bg-secondary/70 text-secondary-foreground/70 rounded-sm animate-pulse min-w-[70px]",
                    isTopRankedForScoreDisplay ? "px-2 py-1" : "px-1.5 py-0.5"
                 )}>
                    <TrendingUp className={cn("mr-1", isTopRankedForScoreDisplay ? "w-3.5 h-3.5" : "w-3 h-3")} />
                    <span className={cn("w-6 bg-secondary-foreground/30 rounded", isTopRankedForScoreDisplay ? "h-3.5" : "h-3")}></span>
                 </div>
              ) : globalAverageScore !== null && globalVoteCount > 0 && (
                <div className={cn(
                  "flex items-center justify-start bg-secondary text-secondary-foreground rounded-sm min-w-[70px]",
                  isTopRankedForScoreDisplay ? "px-2 py-1" : "px-1.5 py-0.5"
                )}>
                  <TrendingUp className={cn("mr-1", isTopRankedForScoreDisplay ? "w-3.5 h-3.5" : "w-3 h-3")} />
                  <span className={cn("font-semibold", isTopRankedForScoreDisplay ? "text-sm" : "text-xs")}>
                    {globalAverageScore.toFixed(2)}
                  </span>
                  <span className={cn("ml-1 font-semibold text-secondary-foreground/80", isTopRankedForScoreDisplay ? "text-xs" : "text-[0.7rem]")}> 
                    ({globalVoteCount})
                  </span>
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
            {/* Display User's Average Score here if it's a top 3 ranked item and score exists */}
            {user && nation.ranking && [1, 2, 3].includes(nation.ranking) && nation.userAverageScore !== null && nation.userAverageScore !== undefined && (
              <p className="flex items-center text-muted-foreground mt-1">
                <Star className="w-4 h-4 mr-2 text-accent flex-shrink-0" />
                <span className="font-medium text-foreground">Tuo Voto: {nation.userAverageScore.toFixed(2)}</span>
              </p>
            )}
          </div>
          
          <div className="space-y-1 mt-auto">
             <div className="h-5"></div> 
             <div className="h-5"></div> 
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
