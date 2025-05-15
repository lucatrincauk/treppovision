
"use client";

import { useState, useEffect } from 'react';
import { listenToAllVotesForNation } from '@/lib/voting-service';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Users } from 'lucide-react'; // Using Users icon for vote count

interface AllUsersAverageVoteBadgeProps {
  nationId: string;
}

export function AllUsersAverageVoteBadge({ nationId }: AllUsersAverageVoteBadgeProps) {
  const [globalAverage, setGlobalAverage] = useState<number | null>(null);
  const [voteCount, setVoteCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!nationId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = listenToAllVotesForNation(nationId, (avgScore, count) => {
      setGlobalAverage(avgScore);
      setVoteCount(count);
      setIsLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener on component unmount
  }, [nationId]);

  if (isLoading) {
    return (
      <Badge variant="outline" className="text-sm py-1 px-3 animate-pulse min-w-[160px] text-center justify-center">
        <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
        Caricamento Globale...
      </Badge>
    );
  }

  if (voteCount === 0 || globalAverage === null) {
    return (
      <Badge variant="outline" className="text-sm py-1 px-3">
        <Users className="w-3 h-3 mr-1.5" />
        Nessun voto globale
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="text-sm py-1 px-3">
      <TrendingUp className="w-3 h-3 mr-1.5" />
      TreppoScore Globale: {globalAverage.toFixed(2)} 
      <span className="ml-1.5 flex items-center text-secondary-foreground/80">
         <Users className="w-3 h-3 mr-0.5" /> 
         {voteCount}
      </span>
    </Badge>
  );
}
