
"use client";

import type { Nation, Vote } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Star, TrendingUp, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { getUserVoteForNationFromDB, listenToAllVotesForNation } from "@/lib/voting-service";
import { getLeaderboardLockedStatus } from "@/lib/actions/admin-actions";

interface NationListItemProps {
  nation: Nation & { userAverageScore?: number | null };
}

export function NationListItem({ nation }: NationListItemProps) {
  const { user, isLoading: authLoading } = useAuth();

  const localThumbnailUrl = `/${nation.id}.jpg`;
  const fallbackFlagUrl = `https://flagcdn.com/w160/${nation.countryCode.toLowerCase()}.png`;

  const [imageUrl, setImageUrl] = useState(localThumbnailUrl);
  const [imageAlt, setImageAlt] = useState(`Miniatura ${nation.name}`);

  const [fetchedUserAverageScore, setFetchedUserAverageScore] = useState<number | null>(null);
  const [isLoadingUserVote, setIsLoadingUserVote] = useState(true);

  const [globalAverageScore, setGlobalAverageScore] = useState<number | null>(null);
  const [globalVoteCount, setGlobalVoteCount] = useState<number>(0);
  const [isLoadingGlobalVote, setIsLoadingGlobalVote] = useState(true);
  const [leaderboardLocked, setLeaderboardLocked] = useState<boolean | null>(null);

  const userAverageScore = nation.userAverageScore !== undefined ? nation.userAverageScore : fetchedUserAverageScore;

  useEffect(() => {
    async function fetchLockStatus() {
      setIsLoadingGlobalVote(true); // Ensure loading state until lock status is known
      const status = await getLeaderboardLockedStatus();
      setLeaderboardLocked(status);
      if (status) { // If locked, don't proceed to fetch global scores
        setIsLoadingGlobalVote(false);
      }
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

  useEffect(() => {
    if (leaderboardLocked === null || leaderboardLocked) {
      setIsLoadingGlobalVote(false);
      return;
    }
    // setIsLoadingGlobalVote(true); // Already set by lock status fetch or initial state
    const unsubscribe = listenToAllVotesForNation(nation.id, (avgScore, count) => {
      setGlobalAverageScore(avgScore);
      setGlobalVoteCount(count);
      setIsLoadingGlobalVote(false);
    });

    return () => unsubscribe();
  }, [nation.id, leaderboardLocked]);

  const rankBorderClass =
    nation.ranking === 1 ? "border-yellow-400 border-2 shadow-yellow-400/30" :
    nation.ranking === 2 ? "border-slate-400 border-2 shadow-slate-400/30" :
    nation.ranking === 3 ? "border-amber-500 border-2 shadow-amber-500/30" :
    "border-border group-hover:border-primary/50";

  const displayUserScoreInContent = user && nation.ranking && [1, 2, 3].includes(nation.ranking) && userAverageScore !== null;
  const displayUserScoreOnThumbnail = user && !authLoading && userAverageScore !== null && !displayUserScoreInContent;

  return (
    <Link href={`/nations/${nation.id}`} className="group block h-full">
      <Card className={cn(
        "h-full flex flex-col overflow-hidden transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:scale-[1.02]",
        rankBorderClass
      )}>
        <CardHeader className="p-0 relative flex-grow"> {/* Added flex-grow here */}
          <div className="aspect-[3/2] w-full h-full relative"> {/* Added h-full */}
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
              <div className="mb-auto"> {/* Spacer to push content to bottom */}
                {/* Vote badges will be positioned absolutely at bottom-right */}
              </div>
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

              {leaderboardLocked === null || (isLoadingGlobalVote && !leaderboardLocked) ? (
                 <div className={cn(
                    "flex items-center justify-start bg-secondary/70 text-secondary-foreground/70 rounded-sm animate-pulse min-w-[70px]",
                    displayUserScoreInContent ? "px-2 py-1" : "px-1.5 py-0.5"
                 )}>
                    <TrendingUp className={cn("mr-1", displayUserScoreInContent ? "w-3.5 h-3.5" : "w-3 h-3")} />
                    <span className={cn("w-6 bg-secondary-foreground/30 rounded", displayUserScoreInContent ? "h-3.5" : "h-3")}></span>
                 </div>
              ) : leaderboardLocked === false && globalAverageScore !== null && globalVoteCount > 0 && (
                <div className={cn(
                  "flex items-center justify-start bg-secondary text-secondary-foreground rounded-sm min-w-[70px]",
                  displayUserScoreInContent ? "px-2 py-1" : "px-1.5 py-0.5"
                )}>
                  <TrendingUp className={cn("mr-1", displayUserScoreInContent ? "w-3.5 h-3.5" : "w-3 h-3")} />
                  <span className={cn("font-semibold", displayUserScoreInContent ? "text-sm" : "text-xs")}>
                    {globalAverageScore.toFixed(2)}
                  </span>
                   <span className={cn("ml-1 font-semibold text-secondary-foreground/80", displayUserScoreInContent ? "text-xs" : "text-[0.7rem]")}>
                    ({globalVoteCount})
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        {/* CardContent and CardFooter removed */}
      </Card>
    </Link>
  );
}
