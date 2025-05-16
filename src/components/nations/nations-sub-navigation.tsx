
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ListMusic, Award, TrendingUp, Lock as LockIcon, Loader2 } from "lucide-react"; 
import React, { useState, useEffect } from "react";
import { getLeaderboardLockedStatus, checkIfAnyNationIsRankedAction } from "@/lib/actions/admin-actions";

const subNavItems = [
  { href: "/nations", label: "Elenco Completo", icon: ListMusic, id: "all" },
  { href: "/nations/ranking", label: "Classifica Finale", icon: Award, id: "final" },
  { href: "/nations/trepposcore-ranking", label: "Classifica TreppoScore", icon: TrendingUp, id: "trepposcore" },
];

export function NationsSubNavigation() {
  const pathname = usePathname();
  const [leaderboardLocked, setLeaderboardLocked] = useState<boolean | null>(null);
  const [isFinalRankingAvailable, setIsFinalRankingAvailable] = useState<boolean | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = React.useState(true);

  useEffect(() => {
    async function fetchStatus() {
      setIsLoadingStatus(true);
      try {
        const [leaderboardStatus, finalRankingStatus] = await Promise.all([
          getLeaderboardLockedStatus(),
          checkIfAnyNationIsRankedAction()
        ]);
        setLeaderboardLocked(leaderboardStatus);
        setIsFinalRankingAvailable(finalRankingStatus);
      } catch (error) {
        console.error("Failed to fetch nation sub-nav statuses:", error);
        setLeaderboardLocked(false); 
        setIsFinalRankingAvailable(true); // Default to available on error to not block unnecessarily
      } finally {
        setIsLoadingStatus(false);
      }
    }
    fetchStatus();
  }, []);

  if (isLoadingStatus) {
    return (
      <nav className="mb-8 flex items-center justify-center space-x-1 rounded-md bg-muted p-1 sm:space-x-2 animate-pulse">
        {subNavItems.map((item) => (
          <div
            key={item.id}
            className="flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium bg-background/30 text-muted-foreground/50 h-[38px]"
          >
            <item.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{item.label}</span>
             <span className="sm:hidden">{
              item.href === "/nations" ? "Elenco" : 
              item.href === "/nations/ranking" ? "Finale" : "TreppoScore"
            }</span>
          </div>
        ))}
      </nav>
    );
  }

  return (
    <nav className="mb-8 flex items-center justify-center space-x-1 rounded-md bg-muted p-1 sm:space-x-2">
      {subNavItems.map((item) => {
        const isTreppoScoreLink = item.id === "trepposcore";
        const isFinalRankingLink = item.id === "final";
        
        const isTreppoScoreLocked = isTreppoScoreLink && leaderboardLocked;
        const isFinalRankingLocked = isFinalRankingLink && !isFinalRankingAvailable;

        const isDisabled = isTreppoScoreLocked || isFinalRankingLocked;

        return (
          <Link
            key={item.id}
            href={isDisabled ? "#" : item.href}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
              pathname === item.href && !isDisabled
                ? "bg-background text-primary shadow-sm"
                : "text-muted-foreground hover:bg-background/50 hover:text-primary",
              isDisabled && "opacity-50 cursor-not-allowed hover:bg-muted hover:text-muted-foreground"
            )}
            aria-disabled={isDisabled}
            onClick={(e) => { if (isDisabled) e.preventDefault(); }}
            title={isDisabled ? (isFinalRankingLocked ? "La classifica finale non è disponibile finché almeno una nazione non ha un ranking." : "Questa classifica è temporaneamente bloccata dall'amministratore.") : item.label}
          >
            {isDisabled ? <LockIcon className="h-3 w-3 mr-1" /> : <item.icon className="h-4 w-4" />}
            <span className="hidden sm:inline">{item.label}</span>
            <span className="sm:hidden">{
              item.href === "/nations" ? "Elenco" : 
              item.href === "/nations/ranking" ? "Finale" : "TreppoScore"
            }</span>
          </Link>
        );
      })}
    </nav>
  );
}
