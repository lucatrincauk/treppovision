
"use client";

import * as React from "react";
import { getNations } from "@/lib/nation-service";
import { listenToAllVotesForAllNationsCategorized, getAllUserVotes } from "@/lib/voting-service";
import type { Nation, NationWithTreppoScore, Vote, NationGlobalCategorizedScores } from "@/types";
import { NationList } from "@/components/nations/nation-list";
import { NationsSubNavigation } from "@/components/nations/nations-sub-navigation";
import { Users, BarChart3, Star, User, Loader2, TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

export default function TreppoScoreRankingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [allNations, setAllNations] = React.useState<Nation[]>([]);
  const [globalScoresMap, setGlobalScoresMap] = React.useState<Map<string, NationGlobalCategorizedScores>>(new Map());
  const [userVotesMap, setUserVotesMap] = React.useState<Map<string, Vote | null>>(new Map());
  
  const [nationsWithScores, setNationsWithScores] = React.useState<NationWithTreppoScore[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  const [isLoadingNationsData, setIsLoadingNationsData] = React.useState(true);
  const [isLoadingUserVotes, setIsLoadingUserVotes] = React.useState(false);


  // Fetch initial nations data
  React.useEffect(() => {
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
  }, []);

  // Fetch user-specific votes
  React.useEffect(() => {
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
  }, [user, authLoading]);


  // Listen to global scores in real-time
  React.useEffect(() => {
    // Initial overall loading state
    setIsLoadingData(true); 
    
    const unsubscribe = listenToAllVotesForAllNationsCategorized((scores) => {
      setGlobalScoresMap(scores);
      // Set loading to false after first data received from listener,
      // or if nations/user votes are still loading, wait for them.
      if (!isLoadingNationsData && !isLoadingUserVotes) {
          setIsLoadingData(false);
      }
    });

    return () => unsubscribe(); // Cleanup listener on component unmount
  }, [isLoadingNationsData, isLoadingUserVotes]); // Re-run if these initial loads complete after listener setup

  // Process and sort nations when data changes
  React.useEffect(() => {
    if (allNations.length > 0 && globalScoresMap.size > 0) {
      const processedNations: NationWithTreppoScore[] = allNations
        .map(nation => {
          const scoreData = globalScoresMap.get(nation.id);
          const userVote = user ? userVotesMap.get(nation.id) : null;
          const userAverageScore = userVote
            ? (userVote.scores.song + userVote.scores.performance + userVote.scores.outfit) / 3
            : null;

          return {
            ...nation,
            globalTreppoScore: scoreData?.overallAverageScore ?? null, // Use overallAverageScore from new type
            globalVoteCount: scoreData?.voteCount ?? 0,
            userAverageScore: userAverageScore,
          };
        })
        .filter(n => n.globalTreppoScore !== null && n.globalVoteCount > 0)
        .sort((a, b) => (b.globalTreppoScore ?? 0) - (a.globalTreppoScore ?? 0));
      
      setNationsWithScores(processedNations);
    } else if (allNations.length > 0) {
        // Handle case where nations are loaded but no scores yet (e.g. no votes)
        const processedNationsWithNoScores: NationWithTreppoScore[] = allNations.map(nation => ({
            ...nation,
            globalTreppoScore: null,
            globalVoteCount: 0,
            userAverageScore: user ? (userVotesMap.get(nation.id) ? ((userVotesMap.get(nation.id)!.scores.song + userVotesMap.get(nation.id)!.scores.performance + userVotesMap.get(nation.id)!.scores.outfit) / 3) : null) : null,
        }));
        setNationsWithScores(processedNationsWithNoScores);
    } else {
      setNationsWithScores([]);
    }
  }, [allNations, globalScoresMap, userVotesMap, user]);

  // Consolidate overall loading state
  React.useEffect(() => {
    if (!isLoadingNationsData && !isLoadingUserVotes && globalScoresMap.size > 0) {
      setIsLoadingData(false);
    } else if (!isLoadingNationsData && !isLoadingUserVotes && globalScoresMap.size === 0 && allNations.length > 0) {
      // Nations loaded, user votes loaded (or not applicable), but still no global scores received (listener might be empty at first)
      // We can consider loading finished if we expect no votes might be present.
      setIsLoadingData(false);
    } else if (!isLoadingNationsData && !isLoadingUserVotes && allNations.length === 0){
        // No nations, so nothing to rank.
        setIsLoadingData(false);
    } else {
        setIsLoadingData(true);
    }
  }, [isLoadingNationsData, isLoadingUserVotes, globalScoresMap, allNations]);


  if (isLoadingData || authLoading) {
    return (
      <div className="space-y-8">
        <NationsSubNavigation />
        <header className="text-center sm:text-left space-y-2 mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary flex items-center">
            <TrendingUp className="mr-3 h-10 w-10" />
            Classifica TreppoScore
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

  const top3Nations = nationsWithScores.slice(0, 3);
  const otherRankedNations = nationsWithScores.slice(3);

  return (
    <div className="space-y-8">
      <NationsSubNavigation />
      <header className="text-center sm:text-left space-y-2 mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary flex items-center">
          <TrendingUp className="mr-3 h-10 w-10" />
          Classifica TreppoScore
        </h1>
        <p className="text-xl text-muted-foreground">
          Le nazioni partecipanti, ordinate in base al voto medio degli utenti (TreppoScore).
        </p>
      </header>

      {nationsWithScores.length === 0 ? (
        <div className="text-center text-muted-foreground py-10">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-lg">{allNations.length === 0 ? "Nessuna nazione trovata." : "Nessun voto ancora registrato."}</p>
          <p>{allNations.length > 0 && "Quando gli utenti voteranno, questa classifica si popolerà."}</p>
        </div>
      ) : (
        <>
          {top3Nations.length > 0 && (
            <NationList
              nations={top3Nations.map((nation, index) => ({
                ...nation,
                ranking: index + 1, 
                userAverageScore: nation.userAverageScore 
              }))}
              title="Il Podio TreppoScore"
            />
          )}

          {otherRankedNations.length > 0 && (
            <section className="mt-12">
              <h2 className="text-3xl font-bold tracking-tight mb-6 text-primary border-b-2 border-primary/30 pb-2">
                Classifica Completa TreppoScore (dal 4° posto)
              </h2>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px] text-center">Pos.</TableHead>
                        <TableHead>Nazione</TableHead>
                        {user && (
                          <TableHead className="text-right w-[120px] hidden md:table-cell">Il Tuo Voto</TableHead>
                        )}
                        <TableHead className="text-right w-[140px]">TreppoScore Globale</TableHead>
                        <TableHead className="text-right w-[100px] hidden sm:table-cell">N. Voti</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {otherRankedNations.map((nation, index) => (
                        <TableRow key={nation.id}>
                          <TableCell className="font-medium text-center">{index + 4}</TableCell>
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
                          {user && (
                            <TableCell className="text-right hidden md:table-cell">
                              {nation.userAverageScore !== null && nation.userAverageScore !== undefined ? (
                                <span className="font-medium text-primary">{nation.userAverageScore.toFixed(2)}</span>
                              ) : (
                                <span className="text-muted-foreground">N/D</span>
                              )}
                            </TableCell>
                          )}
                          <TableCell className="text-right font-semibold text-accent">
                            <div className="flex items-center justify-end">
                              <Star className="w-4 h-4 mr-1 text-yellow-400"/>
                              {nation.globalTreppoScore?.toFixed(2) ?? 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground hidden sm:table-cell">{nation.globalVoteCount}</TableCell>
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
