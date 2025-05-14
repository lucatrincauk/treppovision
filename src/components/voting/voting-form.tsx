
"use client";

import { useState, useEffect, useTransition } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { submitVoteAction } from "@/lib/actions/vote-actions";
import { useToast } from "@/hooks/use-toast";
import { saveVote, getUserVoteForNation } from "@/lib/voting-service";
import type { Nation } from "@/types";
import { Loader2, Send, Star } from "lucide-react";

interface VotingFormProps {
  nation: Nation;
}

export function VotingForm({ nation }: VotingFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [songScore, setSongScore] = useState(5);
  const [performanceScore, setPerformanceScore] = useState(5);
  const [outfitScore, setOutfitScore] = useState(5);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    if (user) {
      const existingVote = getUserVoteForNation(nation.id, user.id);
      if (existingVote) {
        setSongScore(existingVote.scores.song);
        setPerformanceScore(existingVote.scores.performance);
        setOutfitScore(existingVote.scores.outfit);
        setHasVoted(true);
      } else {
        setSongScore(5);
        setPerformanceScore(5);
        setOutfitScore(5);
        setHasVoted(false);
      }
    }
  }, [nation.id, user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      toast({ title: "Autenticazione Richiesta", description: "Effettua il login per votare.", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      const result = await submitVoteAction({
        nationId: nation.id,
        userId: user.id,
        scores: {
          song: songScore,
          performance: performanceScore,
          outfit: outfitScore,
        },
      });

      if (result.success && result.vote) {
        saveVote(result.vote); // Client-side save to localStorage
        setHasVoted(true);
        toast({ title: "Voto Inviato!", description: `I tuoi punteggi per ${nation.name} sono stati registrati.` });
      } else {
        toast({ title: "Errore", description: result.message, variant: "destructive" });
      }
    });
  };

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

  return (
    <Card className="shadow-lg border-primary/30">
      <CardHeader>
        <CardTitle className="text-primary flex items-center"><Star className="mr-2 text-accent"/>Il Tuo Voto per {nation.name}</CardTitle>
        {hasVoted && <CardDescription>Hai già votato per {nation.name}. Puoi aggiornare i tuoi punteggi.</CardDescription>}
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
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
