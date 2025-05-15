
"use client";

import type { Nation, Vote } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Music2, UserSquare2, Award, Loader2, Star, Users } from "lucide-react";
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
  }, [nation.id, localThumbnailUrl, nation.name]); // Added nation.name to dependencies

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
    <Link href={`/nations/${nation.id}`} className="group block h-full"> {/* Ensure Link takes full height for card */}
      <Card className={cn(
        "h-full flex flex-col overflow-hidden transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:scale-[1.02]",
        rankBorderClass
      )}>
        <CardHeader className="p-0 relative">
          <div className="aspect-[3/2] w-full relative">
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill // Use fill for aspect ratio container
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
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow flex flex-col justify-between"> {/* Allow content to grow and manage space */}
          <div className="space-y-1 text-sm mb-3"> {/* Add mb-3 for spacing */}
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

          <div className="space-y-1 mt-auto"> {/* Scores pushed to bottom */}
            {/* User's Vote Section */}
            <div className="text-xs">
              {isLoadingUserVote ? (
                <div className="flex items-center text-muted-foreground h-5"> {/* Fixed height for loading state */}
                  <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Caricamento tuo voto...
                </div>
              ) : user && userAverageScore ? (
                <p className="flex items-center text-accent font-semibold h-5">
                  <Star className="w-3 h-3 mr-1.5" />
                  Il Tuo Voto: {userAverageScore}
                </p>
              ) : user ? (
                  <p className="text-muted-foreground h-5">Non hai votato</p>
              ) : <div className="h-5"></div> /* Placeholder for alignment when user not logged in */}
            </div>

            {/* Global Vote Section */}
            <div className="text-xs">
              {isLoadingGlobalVote ? (
                <div className="flex items-center text-muted-foreground h-5"> {/* Fixed height */}
                  <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Caricamento voto globale...
                </div>
              ) : globalAverageScore !== null ? (
                <p className="flex items-center text-primary font-semibold h-5">
                  <Users className="w-3 h-3 mr-1.5" />
                  Globale: {globalAverageScore.toFixed(2)} <span className="text-muted-foreground font-normal ml-1">({globalVoteCount} voti)</span>
                </p>
              ) : (
                <p className="text-muted-foreground h-5">Nessun voto globale</p>
              )}
            </div>
          </div>

        </CardContent>
        <CardFooter className="p-4 pt-2"> {/* Reduced top padding for footer */}
          <Button variant="outline" size="sm" className="w-full group-hover:bg-accent group-hover:text-accent-foreground">
            Vedi Dettagli <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
