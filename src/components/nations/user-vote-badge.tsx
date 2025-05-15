
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getUserVoteForNationFromDB } from '@/lib/voting-service';
import type { Vote } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Loader2, Edit3, Star } from 'lucide-react';

interface UserVoteBadgeProps {
  nationId: string;
  refreshTrigger?: number; // New prop to trigger re-fetch
}

export function UserVoteBadge({ nationId, refreshTrigger }: UserVoteBadgeProps) {
  const { user, isLoading: authLoading } = useAuth();
  const [userVote, setUserVote] = useState<Vote | null | undefined>(undefined); 
  const [averageScore, setAverageScore] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      setUserVote(undefined); 
      return;
    }

    if (!user) {
      setUserVote(null); 
      setAverageScore(null);
      return;
    }

    let isMounted = true;
    setUserVote(undefined); 

    getUserVoteForNationFromDB(nationId, user.uid)
      .then((vote) => {
        if (isMounted) {
          setUserVote(vote); 
          if (vote) {
            const avg = (vote.scores.song + vote.scores.performance + vote.scores.outfit) / 3;
            setAverageScore(avg.toFixed(2));
          } else {
            setAverageScore(null);
          }
        }
      })
      .catch(error => {
        console.error("Error fetching user vote for badge:", error);
        if (isMounted) {
          setUserVote(null); 
          setAverageScore(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [nationId, user, authLoading, refreshTrigger]); // Added refreshTrigger to dependencies

  if (userVote === undefined || authLoading) {
    return (
      <Badge variant="outline" className="text-sm py-1 px-3 animate-pulse min-w-[120px] text-center justify-center">
        <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
        Caricamento...
      </Badge>
    );
  }

  if (!user) { // User not logged in
    return null;
  }

  if (userVote && averageScore) { // User is logged in and has voted
    return (
      <Badge className="text-sm py-1 px-3 border-transparent bg-accent text-accent-foreground hover:bg-accent/90">
        <Star className="w-3 h-3 mr-1.5 text-accent-foreground" />
        Il tuo TreppoScore: {averageScore}
      </Badge>
    );
  }

  if (!userVote) { // User is logged in but has NOT voted for this nation
    return (
      <a href="#voting-form" className="inline-block">
        <Badge variant="default" className="text-sm py-1 px-3 cursor-pointer hover:bg-primary/80">
          <Edit3 className="w-3 h-3 mr-1.5" />
          Vota ora
        </Badge>
      </a>
    );
  }

  return null;
}
