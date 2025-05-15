
"use client";

import { useState, useEffect, useTransition } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { submitVoteAction } from "@/lib/actions/vote-actions";
import { useToast } from "@/hooks/use-toast";
import { getUserVoteForNationFromDB } from "@/lib/voting-service";
import type { Nation, Vote } from "@/types";
import { Loader2, Send, Star, Info } from "lucide-react";

interface VotingFormProps {
  nation: Nation;
}

export function VotingForm({ nation }: VotingFormProps) {
  const { user, isLoading: authIsLoading } = useAuth(); // Get auth loading state
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  
  // isLoadingVote tracks the loading of the specific vote for this nation/user
  const [isLoadingVote, setIsLoadingVote] = useState(true); 

  const [songScore, setSongScore] = useState(5);
  const [performanceScore, setPerformanceScore] = useState(5);
  const [outfitScore, setOutfitScore] = useState(5);
  const [hasVoted, setHasVoted] = useState(false);
  const [averageScore, setAverageScore] = useState<number | null>(null);

  const resetScoresAndAverage = () => {
    setSongScore(5);
    setPerformanceScore(5);
    setOutfitScore(5);
    setHasVoted(false);
    setAverageScore(null);
  };

  const calculateAverage = (song: number, performance: number, outfit: number) => {
    const avg = (song + performance + outfit) / 3;
    setAverageScore(parseFloat(avg.toFixed(2)));
  };

  useEffect(() => {
    const fetchUserVote = async () => {
      if (authIsLoading) {
        // Auth state is not yet resolved, don't attempt to fetch vote.
        // The component will show a loader based on authIsLoading.
        return;
      }

      if (user && user.uid) {
        setIsLoadingVote(true); // Indicate vote fetching has started
        const existingVote = await getUserVoteForNationFromDB(nation.id, user.uid);
        if (existingVote) {
          setSongScore(existingVote.scores.song);
          setPerformanceScore(existingVote.scores.performance);
          setOutfitScore(existingVote.scores.outfit);
          setHasVoted(true);
          // Average will be calculated by the other useEffect
        } else {
          resetScoresAndAverage();
        }
        setIsLoadingVote(false);
      } else {
        // No user, or user.uid not available (even if !authIsLoading)
        resetScoresAndAverage();
        setIsLoadingVote(false); 
      }
    };

    fetchUserVote();
  }, [nation.id, user, authIsLoading]); // Add authIsLoading as a dependency

  useEffect(() => {
    // This effect calculates the average score whenever relevant inputs change
    if (user) { // Only calculate if there's a user, and scores are set
        calculateAverage(songScore, performanceScore, outfitScore);
    } else {
        setAverageScore(null); 
    }
  }, [songScore, performanceScore, outfitScore, user]);


  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      toast({ title: "Autenticazione Richiesta", description: "Effettua il login per votare.", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      const result = await submitVoteAction({
        nationId: nation.id,
        userId: user.uid,
        scores: {
          song: songScore,
          performance: performanceScore,
          outfit: outfitScore,
        },
      });

      if (result.success && result.vote) {
        setHasVoted(true); 
        toast({ title: "Voto Inviato!", description: `I tuoi punteggi per ${nation.name} sono stati registrati.` });
      } else {
        toast({ title: "Errore", description: result.message, variant: "destructive" });
      }
    });
  };

  if (authIsLoading) {
    return (
        <Card className="shadow-lg border-primary/30">
            <CardHeader>
                <CardTitle className="text-primary flex items-center"><Star className="mr-2 text-accent"/>Il Tuo Voto per {nation.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center min-h-[200px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                <p className="text-muted-foreground">Caricamento autenticazione...</p>
            </CardContent>
        </Card>
    );
  }

  if (!user) { // Auth is resolved, and no user
    return (
      <Card className="bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-accent">Accedi per Votare</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Devi aver effettuato l'accesso per esprimere il tuo voto per {nation.name}.</p>
        </CardContent>
      </Card>
    );
  }
  
  // User is present, auth is loaded. Now check if we are loading the specific vote.
  if (isLoadingVote) {
    return (
        <Card className="shadow-lg border-primary/30">
            <CardHeader>
                <CardTitle className="text-primary flex items-center"><Star className="mr-2 text-accent"/>Il Tuo Voto per {nation.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center min-h-[200px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                <p className="text-muted-foreground">Caricamento voto...</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="shadow-lg border-primary/30">
      <CardHeader>
        <CardTitle className="text-primary flex items-center"><Star className="mr-2 text-accent"/>Il Tuo Voto per {nation.name}</CardTitle>
        {hasVoted && <CardDescription>Hai già votato per {nation.name}. Puoi aggiornare i tuoi punteggi.</CardDescription>}
        {!hasVoted && <CardDescription>Esprimi i tuoi punteggi da 1 a 10 per ogni categoria.</CardDescription>}
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {averageScore !== null && (
            <div className="p-3 mb-4 text-center bg-muted/50 rounded-md border border-border">
              <p className="text-sm font-medium text-foreground">
                Il tuo voto medio per {nation.name}: 
                <span className="text-lg font-bold text-accent ml-1">{averageScore} / 10</span>
              </p>
            </div>
          )}
          <div>
            <Label htmlFor="songScore" className="text-lg">Canzone: <span className="font-bold text-accent">{songScore}</span>/10</Label>
            <Slider
              id="songScore"
              min={1}
              max={10}
              step={1}
              value={[songScore]}
              onValueChange={(value) => setSongScore(value[0])}
              className="mt-2 [&>span>span]:bg-primary"
              disabled={isPending}
            />
          </div>
          <div>
            <Label htmlFor="performanceScore" className="text-lg">Performance: <span className="font-bold text-accent">{performanceScore}</span>/10</Label>
            <Slider
              id="performanceScore"
              min={1}
              max={10}
              step={1}
              value={[performanceScore]}
              onValueChange={(value) => setPerformanceScore(value[0])}
              className="mt-2 [&>span>span]:bg-primary"
              disabled={isPending}
            />
          </div>
          <div>
            <Label htmlFor="outfitScore" className="text-lg">Outfit: <span className="font-bold text-accent">{outfitScore}</span>/10</Label>
            <Slider
              id="outfitScore"
              min={1}
              max={10}
              step={1}
              value={[outfitScore]}
              onValueChange={(value) => setOutfitScore(value[0])}
              className="mt-2 [&>span>span]:bg-primary"
              disabled={isPending}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {hasVoted ? "Aggiorna Voto" : "Invia Voto"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
