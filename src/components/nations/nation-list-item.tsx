
"use client";

import type { Nation } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Star, TrendingUp, Lock, Award } from "lucide-react"; // TrendingUp might be unused now
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { getUserVoteForNationFromDB, listenToAllVotesForNation } from "@/lib/voting-service";
import { getLeaderboardLockedStatus } from "@/lib/actions/admin-actions";

interface NationListItemProps {
  nation: Nation & { userAverageScore?: number | null };
  // Add other props if NationListItem is used in different contexts that require them.
}

export function NationListItem({ nation }: NationListItemProps) {
  const { user, isLoading: authLoading } = useAuth();

  const localThumbnailUrl = `/${nation.id}.jpg`;
  const fallbackFlagUrl = `https://flagcdn.com/w160/${nation.countryCode.toLowerCase()}.png`;

  const [imageUrl, setImageUrl] = useState(localThumbnailUrl);
  const [imageAlt, setImageAlt] = useState(`Miniatura ${nation.name}`);

  const [fetchedUserAverageScore, setFetchedUserAverageScore] = useState<number | null>(null);
  const [isLoadingUserVote, setIsLoadingUserVote] = useState(true);

  // Global score state is no longer needed here for display on the card
  // const [globalAverageScore, setGlobalAverageScore] = useState<number | null>(null);
  // const [globalVoteCount, setGlobalVoteCount] = useState<number>(0);
  // const [isLoadingGlobalVote, setIsLoadingGlobalVote] = useState(true);
  const [leaderboardLocked, setLeaderboardLocked] = useState<boolean | null>(null);

  const userAverageScore = nation.userAverageScore !== undefined ? nation.userAverageScore : fetchedUserAverageScore;

  useEffect(() => {
    async function fetchLockStatus() {
      // setIsLoadingGlobalVote(true); // Not fetching global scores for display here anymore
      const status = await getLeaderboardLockedStatus();
      setLeaderboardLocked(status);
      // setIsLoadingGlobalVote(false);
    }
    fetchLockStatus();
  }, []);

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

  useEffect(() => {
    if (nation.userAverageScore !== undefined) {
      setIsLoadingUserVote(false);
      return;
    }

    if (authLoading) {
      setIsLoadingUserVote(true);
      return;
    }
    if (!user) {
      setFetchedUserAverageScore(null);
      setIsLoadingUserVote(false);
      return;
    }

    setIsLoadingUserVote(true);
    let isMounted = true;
    getUserVoteForNationFromDB(nation.id, user.uid)
      .then((vote) => {
        if (isMounted) {
          if (vote) {
            const avg = (vote.scores.song + vote.scores.performance + vote.scores.outfit) / 3;
            setFetchedUserAverageScore(parseFloat(avg.toFixed(2)));
          } else {
            setFetchedUserAverageScore(null);
          }
        }
      })
      .catch(error => console.error("Error fetching user vote for list item:", error))
      .finally(() => {
        if (isMounted) setIsLoadingUserVote(false);
      });

    return () => { isMounted = false; };
  }, [nation.id, nation.userAverageScore, user, authLoading]);


  const rankBorderClass =
    nation.ranking === 1 ? "border-yellow-400 border-2 shadow-yellow-400/30" :
    nation.ranking === 2 ? "border-slate-400 border-2 shadow-slate-400/30" :
    nation.ranking === 3 ? "border-amber-500 border-2 shadow-amber-500/30" :
    "border-border group-hover:border-primary/50";

  // Logic to display user score in content based on rank, only used in TreppoScore page for top 3
  const displayUserScoreInContent = nation.ranking && [1, 2, 3].includes(nation.ranking) && userAverageScore !== null;
  const displayUserScoreOnThumbnail = user && !authLoading && userAverageScore !== null && !displayUserScoreInContent;

  return (
    <Link href={`/nations/${nation.id}`} className="group block h-full">
      <Card className={cn(
        "h-full flex flex-col overflow-hidden transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:scale-[1.02]",
        rankBorderClass
      )}>
        <CardHeader className="p-0 relative flex-grow">
          <div className="aspect-[3/2] w-full h-full relative">
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col justify-end p-3">
              <div>
                <CardTitle className="text-lg font-bold text-white drop-shadow-md flex items-center gap-2">
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
                <p className="text-xs text-white/90 drop-shadow-sm truncate" title={`${nation.artistName} - ${nation.songTitle}`}>
                  {nation.artistName}
                </p>
                <p className="text-xs text-white/80 drop-shadow-sm truncate" title={nation.songTitle}>
                  {nation.songTitle}
                </p>
              </div>
            </div>

            <div className="absolute bottom-2 right-2 flex flex-col items-end">
              {(!user || (isLoadingUserVote && !nation.userAverageScore && !authLoading)) && (
                 <div className={cn(
                    "flex items-center justify-start bg-accent/70 text-accent-foreground/70 rounded-sm animate-pulse min-w-[70px] mb-[2px]",
                     "px-1.5 py-0.5"
                 )}>
                    <Star className={cn("mr-1 text-accent-foreground/70", "w-3 h-3")} />
                    <span className={cn("w-6 bg-accent-foreground/30 rounded", "h-3")}></span>
                 </div>
              )}
              {displayUserScoreOnThumbnail && userAverageScore !== null && (
                <div className={cn(
                  "flex items-center justify-start bg-accent text-accent-foreground rounded-sm min-w-[70px] mb-[2px]",
                  "px-1.5 py-0.5"
                )}>
                  <Star className={cn("mr-1", "w-3 h-3")} />
                  <span className={cn("font-semibold", "text-xs")}>
                    {userAverageScore.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Global score badge removed from here */}

            </div>
          </div>
        </CardHeader>
        {/* CardContent and CardFooter are removed for compact view */}
        {/* Display user's score in content for top 3 on TreppoScore page */}
        {displayUserScoreInContent && (
          <div className="px-3 py-2 border-t border-border/50 bg-card/70">
            <div className="flex items-center text-xs text-accent-foreground">
              <Star className="w-3 h-3 mr-1 text-accent" />
              <span className="font-medium">Il tuo Voto:</span>
              <span className="font-bold ml-1">{userAverageScore?.toFixed(2)}</span>
            </div>
          </div>
        )}
      </Card>
    </Link>
  );
}
