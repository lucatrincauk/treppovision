
"use client";

import type { Nation, Vote } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Star, Users, TrendingUp, Award } from "lucide-react"; // TrendingUp might be unused now
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
  const [leaderboardLocked, setLeaderboardLocked] = useState<boolean | null>(null);

  // This prop-based score is primarily for the TreppoScore page's top 3 cards
  const userAverageScoreToDisplay = nation.userAverageScore !== undefined ? nation.userAverageScore : fetchedUserAverageScore;

  useEffect(() => {
    async function fetchLockStatus() {
      const status = await getLeaderboardLockedStatus();
      setLeaderboardLocked(status);
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
    // If userAverageScore is already passed via props, don't re-fetch
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

  const displayUserScoreInContent = nation.ranking && [1, 2, 3].includes(nation.ranking) && userAverageScoreToDisplay !== null;
  // const displayUserScoreOnThumbnail = user && !authLoading && userAverageScoreToDisplay !== null && !displayUserScoreInContent;


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
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/20 flex flex-col justify-end p-3">
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
                <p className="text-xs text-white/90 drop-shadow-sm truncate" title={nation.artistName}>
                  {nation.artistName}
                </p>
                <p className="text-xs text-white/80 drop-shadow-sm truncate" title={nation.songTitle}>
                  {nation.songTitle}
                </p>
              </div>
            </div>
            {/* Badges on thumbnail removed */}
          </div>
        </CardHeader>
        
        {displayUserScoreInContent && (
          <div className="px-3 py-2 border-t border-border/50 bg-card/70">
            <div className="flex items-center text-xs text-accent-foreground">
              <Star className="w-3 h-3 mr-1 text-accent" />
              <span className="font-medium">Il tuo Voto:</span>
              <span className="font-bold ml-1">{userAverageScoreToDisplay?.toFixed(2)}</span>
            </div>
          </div>
        )}
      </Card>
    </Link>
  );
}
