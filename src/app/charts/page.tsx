
"use client"; // This page needs to be client-side to access localStorage

import { useEffect, useState } from "react";
import { NationVoteChart } from "@/components/charts/nation-vote-chart";
import { getVotes } from "@/lib/voting-service";
import { nations } from "@/data/nations";
import type { AggregatedScore, Vote } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const aggregateVotes = (votes: Vote[]): AggregatedScore[] => {
  const nationScores: Record<string, { song: number[]; performance: number[]; outfit: number[]; count: number }> = {};

  votes.forEach(vote => {
    if (!nationScores[vote.nationId]) {
      nationScores[vote.nationId] = { song: [], performance: [], outfit: [], count: 0 };
    }
    nationScores[vote.nationId].song.push(vote.scores.song);
    nationScores[vote.nationId].performance.push(vote.scores.performance);
    nationScores[vote.nationId].outfit.push(vote.scores.outfit);
    nationScores[vote.nationId].count++;
  });

  return nations.map(nation => {
    const scores = nationScores[nation.id];
    if (!scores || scores.count === 0) {
      return { 
        ...nation, 
        averageSong: 0, 
        averagePerformance: 0, 
        averageOutfit: 0, 
        totalScore: 0,
        voteCount: 0
      };
    }
    const avgSong = scores.song.reduce((a, b) => a + b, 0) / scores.count;
    const avgPerf = scores.performance.reduce((a, b) => a + b, 0) / scores.count;
    const avgOutfit = scores.outfit.reduce((a, b) => a + b, 0) / scores.count;
    
    return {
      ...nation,
      averageSong: parseFloat(avgSong.toFixed(2)),
      averagePerformance: parseFloat(avgPerf.toFixed(2)),
      averageOutfit: parseFloat(avgOutfit.toFixed(2)),
      totalScore: parseFloat((avgSong + avgPerf + avgOutfit).toFixed(2)),
      voteCount: scores.count
    };
  }).filter(agg => agg.voteCount > 0); // Only show nations with votes
};

export default function ChartsPage() {
  const [aggregatedData, setAggregatedData] = useState<AggregatedScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const votes = getVotes();
    const data = aggregateVotes(votes);
    setAggregatedData(data);
    setIsLoading(false);
  }, []); // Re-run if votes change (e.g. after a vote submission might require page reload or state management)


  return (
    <div className="space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary flex items-center justify-center">
          <BarChart3 className="w-10 h-10 mr-3 text-primary"/> Grafici TreppoVision
        </h1>
        <p className="text-xl text-muted-foreground">
          Guarda come si classificano le nazioni in base ai voti degli utenti!
        </p>
      </header>
      
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Classifiche Live</AlertTitle>
        <AlertDescription>
          Questi grafici riflettono i voti espressi dagli utenti all'interno di questa applicazione. I dati sono memorizzati localmente nel tuo browser. Per i risultati ufficiali dell'Eurovision, si prega di fare riferimento al sito ufficiale dell'Eurovision Song Contest.
        </AlertDescription>
      </Alert>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Punteggi Medi per Nazione</CardTitle>
          <CardDescription>I punteggi sono mediati da 1 a 10 per le categorie Canzone, Performance e Outfit.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center items-center min-h-[300px]">
                <p className="text-muted-foreground">Caricamento dati grafici...</p>
             </div>
          ) : (
            <NationVoteChart data={aggregatedData} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
