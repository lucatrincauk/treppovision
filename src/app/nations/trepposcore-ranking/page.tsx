
"use client";

import * as React from "react";
import { getNations } from "@/lib/nation-service";
import { listenToAllVotesForAllNationsCategorized, getAllUserVotes } from "@/lib/voting-service";
import type { Nation, NationWithTreppoScore, Vote, NationGlobalCategorizedScores, RankingCategoryKey } from "@/types";
import { NationsSubNavigation } from "@/components/nations/nations-sub-navigation";
import { Users, BarChart3, Star, User, Loader2, TrendingUp, Lock as LockIcon, SlidersHorizontal, Music, Diamond } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { getLeaderboardLockedStatus } from "@/lib/actions/admin-actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const categoryOptions: { value: RankingCategoryKey; label: string; title: string; columnHeader: string; icon: React.ElementType }[] = [
  { value: 'overallAverageScore', label: 'Globale', title: "Classifica TreppoScore Globale", columnHeader: "TreppoScore Globale", icon: TrendingUp },
  { value: 'averageSongScore', label: 'Canzone', title: "Classifica Miglior Canzone", columnHeader: "Punteggio Canzone", icon: Music },
  { value: 'averagePerformanceScore', label: 'Performance', title: "Classifica Miglior Performance", columnHeader: "Punteggio Performance", icon: Star },
  { value: 'averageOutfitScore', label: 'Outfit', title: "Classifica Miglior Outfit", columnHeader: "Punteggio Outfit", icon: Diamond },
];

export default function TreppoScoreRankingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [allNations, setAllNations] = React.useState<Nation[]>([]);
  const [globalScoresMap, setGlobalScoresMap] = React.useState<Map<string, NationGlobalCategorizedScores>>(new Map());
  const [userVotesMap, setUserVotesMap] = React.useState<Map<string, Vote | null>>(new Map());
  
  const [nationsWithScores, setNationsWithScores] = React.useState<NationWithTreppoScore[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  const [isLoadingNationsData, setIsLoadingNationsData] = React.useState(true);
  const [isLoadingUserVotes, setIsLoadingUserVotes] = React.useState(false);

  const [leaderboardLocked, setLeaderboardLocked] = React.useState<boolean | null>(null);
  const [isLoadingLockStatus, setIsLoadingLockStatus] = React.useState(true);

  const [selectedCategoryKey, setSelectedCategoryKey] = React.useState<RankingCategoryKey>('overallAverageScore');
  const [currentRankingTitle, setCurrentRankingTitle] = React.useState("Classifica TreppoScore Globale");
  const [currentScoreColumnHeader, setCurrentScoreColumnHeader] = React.useState("TreppoScore Globale");

  React.useEffect(() => {
    async function fetchLockStatus() {
      setIsLoadingLockStatus(true);
      try {
        const status = await getLeaderboardLockedStatus();
        setLeaderboardLocked(status);
      } catch (error) {
        console.error("Failed to fetch leaderboard lock status:", error);
        setLeaderboardLocked(false); 
      } finally {
        setIsLoadingLockStatus(false);
      }
    }
    fetchLockStatus();
  }, []);

  React.useEffect(() => {
    if (leaderboardLocked) return; 
    async function fetchInitialNations() {
      setIsLoadingNationsData(true);
      try {
        const nationsData = await getNations();
        setAllNations(nationsData);
      } catch (error) {
        console.error("Error fetching nations data:", error);
        setAllNations([]);
      } finally {
        setIsLoadingNationsData(false);
      }
    }
    fetchInitialNations();
  }, [leaderboardLocked]);

  React.useEffect(() => {
    if (leaderboardLocked) return; 
    if (authLoading) {
      setIsLoadingUserVotes(true);
      return;
    }
    if (!user) {
      setUserVotesMap(new Map());
      setIsLoadingUserVotes(false);
      return;
    }

    async function fetchUserVotes() {
      setIsLoadingUserVotes(true);
      try {
        const votes = await getAllUserVotes(user.uid);
        setUserVotesMap(votes);
      } catch (error) {
        console.error("Error fetching user votes:", error);
        setUserVotesMap(new Map());
      } finally {
        setIsLoadingUserVotes(false);
      }
    }
    fetchUserVotes();
  }, [user, authLoading, leaderboardLocked]);

  React.useEffect(() => {
    if (leaderboardLocked) return; 
    
    setIsLoadingData(true); 
    
    const unsubscribe = listenToAllVotesForAllNationsCategorized((scores) => {
      setGlobalScoresMap(scores);
      if (!isLoadingNationsData && !isLoadingUserVotes) {
          setIsLoadingData(false);
      }
    });

    return () => unsubscribe(); 
  }, [isLoadingNationsData, isLoadingUserVotes, leaderboardLocked]);

  React.useEffect(() => {
    if (leaderboardLocked) {
      setNationsWithScores([]); 
      return;
    }
    if (allNations.length > 0 && globalScoresMap.size > 0) {
      const processedNations: NationWithTreppoScore[] = allNations
        .map(nation => {
          const scoreData = globalScoresMap.get(nation.id);
          const userVote = user ? userVotesMap.get(nation.id) : null;
          const userAverageScore = userVote
            ? (userVote.scores.song + userVote.scores.performance + userVote.scores.outfit) / 3
            : null;
          
          const scoreForRanking = scoreData ? scoreData[selectedCategoryKey] : null;

          return {
            ...nation,
            globalScores: scoreData || null,
            scoreForRanking: scoreForRanking,
            voteCount: scoreData?.voteCount ?? 0,
            userAverageScore: userAverageScore,
          };
        })
        .filter(n => n.scoreForRanking !== null && n.voteCount > 0)
        .sort((a, b) => (b.scoreForRanking ?? 0) - (a.scoreForRanking ?? 0));
      
      // Assign rank
      let currentRank = 1;
      const rankedNations = processedNations.map((nation, index, arr) => {
        if (index > 0 && (arr[index].scoreForRanking ?? -Infinity) < (arr[index - 1].scoreForRanking ?? -Infinity)) {
          currentRank = index + 1;
        }
        return { ...nation, rank: currentRank };
      });
      
      setNationsWithScores(rankedNations);
    } else if (allNations.length > 0) {
        const processedNationsWithNoScores: NationWithTreppoScore[] = allNations.map(nation => ({
            ...nation,
            globalScores: null,
            scoreForRanking: null,
            voteCount: 0,
            userAverageScore: user ? (userVotesMap.get(nation.id) ? ((userVotesMap.get(nation.id)!.scores.song + userVotesMap.get(nation.id)!.scores.performance + userVotesMap.get(nation.id)!.scores.outfit) / 3) : null) : null,
        }));
        setNationsWithScores(processedNationsWithNoScores);
    } else {
      setNationsWithScores([]);
    }
  }, [allNations, globalScoresMap, userVotesMap, user, leaderboardLocked, selectedCategoryKey]);

  React.useEffect(() => {
    if (leaderboardLocked) {
      setIsLoadingData(false);
      return;
    }
    if (!isLoadingNationsData && !isLoadingUserVotes && globalScoresMap.size > 0) {
      setIsLoadingData(false);
    } else if (!isLoadingNationsData && !isLoadingUserVotes && globalScoresMap.size === 0 && allNations.length > 0) {
      setIsLoadingData(false);
    } else if (!isLoadingNationsData && !isLoadingUserVotes && allNations.length === 0){
        setIsLoadingData(false);
    } else {
        setIsLoadingData(true);
    }
  }, [isLoadingNationsData, isLoadingUserVotes, globalScoresMap, allNations, leaderboardLocked]);

  const handleCategoryChange = (value: string) => {
    const newKey = value as RankingCategoryKey;
    setSelectedCategoryKey(newKey);
    const selectedOption = categoryOptions.find(opt => opt.value === newKey);
    if (selectedOption) {
      setCurrentRankingTitle(selectedOption.title);
      setCurrentScoreColumnHeader(selectedOption.columnHeader);
    }
  };

  if (authLoading || isLoadingLockStatus) {
    return (
      <div className="space-y-8">
        <NationsSubNavigation />
        <header className="text-center sm:text-left space-y-2 mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary flex items-center">
            <TrendingUp className="mr-3 h-10 w-10" />
            {currentRankingTitle}
          </h1>
          <p className="text-xl text-muted-foreground">
            Caricamento...
          </p>
        </header>
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (leaderboardLocked) {
    return (
      <div className="space-y-8">
        <NationsSubNavigation />
        <Alert variant="destructive" className="max-w-lg mx-auto">
          <LockIcon className="h-4 w-4" />
          <AlertTitle>Classifica Bloccata</AlertTitle>
          <AlertDescription>
            L'amministratore ha temporaneamente bloccato l'accesso a questa classifica.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (isLoadingData) {
     return (
      <div className="space-y-8">
        <NationsSubNavigation />
        <header className="text-center sm:text-left space-y-2 mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary flex items-center">
            <TrendingUp className="mr-3 h-10 w-10" />
            {currentRankingTitle}
          </h1>
          <p className="text-xl text-muted-foreground">
            Caricamento classifica...
          </p>
        </header>
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <NationsSubNavigation />
      <header className="text-center sm:text-left space-y-2 mb-8">
         <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary flex items-center">
            {React.createElement(categoryOptions.find(opt => opt.value === selectedCategoryKey)?.icon || TrendingUp, { className: "mr-3 h-10 w-10" })}
            {currentRankingTitle}
          </h1>
        <p className="text-xl text-muted-foreground">
          Le nazioni partecipanti, ordinate in base alla categoria selezionata.
        </p>
      </header>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
        <div className="w-full sm:w-auto sm:max-w-xs">
            <Label htmlFor="category-select" className="text-sm font-medium text-muted-foreground sr-only">
                Filtra Classifica
            </Label>
            <Select value={selectedCategoryKey} onValueChange={handleCategoryChange}>
                <SelectTrigger id="category-select" className="w-full">
                <SelectValue placeholder="Seleziona categoria..." />
                </SelectTrigger>
                <SelectContent>
                {categoryOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        {React.createElement(option.icon, { className: "h-4 w-4 text-muted-foreground"})}
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>
        </div>
      </div>

      {nationsWithScores.length === 0 ? (
        <div className="text-center text-muted-foreground py-10">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-lg">{allNations.length === 0 ? "Nessuna nazione trovata." : "Nessun voto ancora registrato per questa categoria."}</p>
          <p>{allNations.length > 0 && "Quando gli utenti voteranno, questa classifica si popolerà."}</p>
        </div>
      ) : (
        <>
          {nationsWithScores.length > 0 && (
            <section className="mt-12">
              <h2 className="text-3xl font-bold tracking-tight mb-6 text-primary border-b-2 border-primary/30 pb-2">
                Classifica Completa - {categoryOptions.find(opt => opt.value === selectedCategoryKey)?.label || 'Globale'}
              </h2>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px] text-center">Pos.</TableHead>
                        <TableHead>Nazione</TableHead>
                        <TableHead className="text-right w-[140px]">{currentScoreColumnHeader}</TableHead>
                        <TableHead className="text-right w-[100px] hidden sm:table-cell">N. Voti</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {nationsWithScores.map((nation) => (
                        <TableRow key={nation.id}>
                          <TableCell className="font-medium text-center">{nation.rank}</TableCell>
                          <TableCell>
                            <Link href={`/nations/${nation.id}`} className="flex items-center gap-3 group">
                              <Image
                                src={`https://flagcdn.com/w40/${nation.countryCode.toLowerCase()}.png`}
                                alt={`Bandiera ${nation.name}`}
                                width={30}
                                height={20}
                                className="rounded-sm border border-border/50 object-contain"
                                data-ai-hint={`${nation.name} flag`}
                              />
                              <div>
                                <span className="group-hover:underline group-hover:text-primary font-medium truncate">
                                  {nation.name}
                                </span>
                                <p className="text-xs text-muted-foreground truncate hidden sm:block" title={`${nation.artistName} - ${nation.songTitle}`}>
                                  {nation.artistName} - {nation.songTitle}
                                </p>
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end">
                                <div className="flex items-center font-semibold text-accent">
                                    {React.createElement(categoryOptions.find(opt => opt.value === selectedCategoryKey)?.icon || TrendingUp, { className: "w-4 h-4 mr-1 text-yellow-400"})}
                                    {nation.scoreForRanking?.toFixed(2) ?? 'N/A'}
                                </div>
                                {user && nation.userAverageScore !== null && nation.userAverageScore !== undefined && (
                                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                                        <User className="w-3 h-3 mr-1 text-primary" />
                                        <span>{nation.userAverageScore.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground hidden sm:table-cell">{nation.voteCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </section>
          )}
        </>
      )}
    </div>
  );
}

