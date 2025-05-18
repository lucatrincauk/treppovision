
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
import { Loader2, Send, Star, Info, Lock } from "lucide-react";
import { getLeaderboardLockedStatus } from "@/lib/actions/admin-actions";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VotingFormProps {
  nation: Nation;
  onVoteSuccess: () => void; // Callback prop
}

export function VotingForm({ nation, onVoteSuccess }: VotingFormProps) {
  const { user, isLoading: authIsLoading } = useAuth();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  
  const [isLoadingVote, setIsLoadingVote] = useState(true); 
  const [leaderboardLocked, setLeaderboardLocked] = useState<boolean | null>(null);
  const [isLoadingLockStatus, setIsLoadingLockStatus] = useState(true);

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
    async function fetchLockStatus() {
      setIsLoadingLockStatus(true);
      try {
        const status = await getLeaderboardLockedStatus();
        setLeaderboardLocked(status);
      } catch (error) {
        console.error("Error fetching leaderboard lock status for voting form:", error);
        setLeaderboardLocked(false); // Default to unlocked if status fetch fails
      } finally {
        setIsLoadingLockStatus(false);
      }
    }
    fetchLockStatus();
  }, []);

  useEffect(() => {
    if (authIsLoading || isLoadingLockStatus) {
      setIsLoadingVote(true);
      return;
    }

    if (!user || !user.uid) {
      resetScoresAndAverage();
      setIsLoadingVote(false);
      return;
    }

    setIsLoadingVote(true); 
    const fetchUserVote = async () => {
      try {
        const existingVote = await getUserVoteForNationFromDB(nation.id, user.uid);
        if (existingVote) {
          setSongScore(existingVote.scores.song);
          setPerformanceScore(existingVote.scores.performance);
          setOutfitScore(existingVote.scores.outfit);
          setHasVoted(true);
        } else {
          resetScoresAndAverage();
        }
      } catch (error) {
        console.error("Error fetching user vote in VotingForm:", error);
        toast({
          title: "Errore Caricamento Voto",
          description: "Impossibile caricare il tuo voto precedente. Riprova.",
          variant: "destructive",
        });
        resetScoresAndAverage();
      } finally {
        setIsLoadingVote(false);
      }
    };

    fetchUserVote();

  }, [nation.id, user, authIsLoading, toast, isLoadingLockStatus]);

  useEffect(() => {
    if (user) { 
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
    if (leaderboardLocked === false) {
      toast({ title: "Votazione Chiusa", description: "Le votazioni sono chiuse perché le classifiche sono attive.", variant: "destructive" });
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
        onVoteSuccess(); // Call the callback on successful vote
      } else {
        toast({ title: "Errore", description: result.message, variant: "destructive" });
      }
    });
  };

  const isVotingDisabled = isPending || leaderboardLocked === false || isLoadingLockStatus;

  if (authIsLoading || isLoadingLockStatus) {
    return (
        <Card className="shadow-lg border-primary/30">
            <CardHeader>
                <CardTitle className="text-primary flex items-center"><Star className="mr-2 text-accent"/>Il Tuo Voto per {nation.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center min-h-[200px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                <p className="text-muted-foreground">Caricamento...</p>
            </CardContent>
        </Card>
    );
  }

  if (!user) { 
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
        {hasVoted && <CardDescription>Hai già votato per {nation.name}. {leaderboardLocked === false ? "Le votazioni sono chiuse." : "Puoi aggiornare i tuoi punteggi."}</CardDescription>}
        {!hasVoted && <CardDescription>{leaderboardLocked === false ? "Le votazioni sono chiuse." : "Esprimi i tuoi punteggi da 1 a 10 per ogni categoria."}</CardDescription>}
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
          {leaderboardLocked === false && (
            <Alert variant="destructive" className="mb-4">
              <Lock className="h-4 w-4" />
              <AlertDescription>
                Le votazioni sono chiuse perché le classifiche sono attive. Non è possibile modificare i voti.
              </AlertDescription>
            </Alert>
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
              disabled={isVotingDisabled}
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
              disabled={isVotingDisabled}
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
              disabled={isVotingDisabled}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isVotingDisabled}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {hasVoted ? "Aggiorna Voto" : "Invia Voto"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
