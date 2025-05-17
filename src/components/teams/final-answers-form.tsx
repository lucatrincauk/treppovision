
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { Nation, TeamFinalAnswersFormData } from "@/types";
import { getNations } from "@/lib/nation-service";
import { updateTeamFinalAnswersAction } from "@/lib/actions/team-actions"; 
import { useRouter } from "next/navigation";
import { Loader2, Save, Users, Info, AlertTriangle } from "lucide-react"; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; 
import Image from "next/image";

const finalAnswersFormZodSchema = z.object({
  bestTreppoScoreNationId: z.string().min(1, "Devi selezionare la nazione per Miglior TreppoScore."),
  bestSongNationId: z.string().min(1, "Devi selezionare la migliore canzone."),
  bestPerformanceNationId: z.string().min(1, "Devi selezionare la migliore performance."),
  bestOutfitNationId: z.string().min(1, "Devi selezionare il migliore outfit."),
  worstTreppoScoreNationId: z.string().min(1, "Devi selezionare il Peggior TreppoScore."),
});

interface FinalAnswersFormProps {
  initialData: TeamFinalAnswersFormData;
  teamId: string;
  isReadOnly?: boolean;
}

export function FinalAnswersForm({ initialData, teamId, isReadOnly = false }: FinalAnswersFormProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [allNations, setAllNations] = React.useState<Nation[]>([]);
  const [isLoadingNations, setIsLoadingNations] = React.useState(true);

  const sortedNations = React.useMemo(() => {
    return [...allNations].sort((a, b) => a.name.localeCompare(b.name));
  }, [allNations]);
  
  React.useEffect(() => {
    async function fetchData() {
      setIsLoadingNations(true);
      try {
        const fetchedNations = await getNations();
        setAllNations(fetchedNations);
      } catch (error) {
        console.error("Failed to fetch data for final answers form:", error);
        toast({
          title: "Errore Caricamento Dati",
          description: "Impossibile caricare i dati necessari. Riprova più tardi.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingNations(false);
      }
    }
    fetchData();
  }, [toast]);

  const form = useForm<TeamFinalAnswersFormData>({
    resolver: zodResolver(finalAnswersFormZodSchema),
    defaultValues: initialData || {
      bestTreppoScoreNationId: "",
      bestSongNationId: "",
      bestPerformanceNationId: "",
      bestOutfitNationId: "",
      worstTreppoScoreNationId: "",
    },
  });

  React.useEffect(() => {
    if (initialData) {
      form.reset({
        bestTreppoScoreNationId: initialData.bestTreppoScoreNationId || "",
        bestSongNationId: initialData.bestSongNationId || "",
        bestPerformanceNationId: initialData.bestPerformanceNationId || "",
        bestOutfitNationId: initialData.bestOutfitNationId || "",
        worstTreppoScoreNationId: initialData.worstTreppoScoreNationId || "",
      });
    }
  }, [initialData, form]);

  async function onSubmit(values: TeamFinalAnswersFormData) {
    if (!user) {
      toast({ title: "Autenticazione Richiesta", description: "Devi effettuare il login.", variant: "destructive" });
      return;
    }
    if (isReadOnly) {
      toast({ title: "Modifica Bloccata", description: "I pronostici sono già stati inviati e non possono essere modificati.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const result = await updateTeamFinalAnswersAction(teamId, values, user.uid);

    if (result.success) {
      toast({
        title: "Pronostici Finali Aggiornati!",
        description: "I tuoi pronostici sono stati salvati.",
      });
      router.push('/teams'); 
    } else {
      toast({
        title: "Errore Aggiornamento Pronostici",
        description: result.message || "Si è verificato un errore.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  }

  if (authLoading || isLoadingNations) { 
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Caricamento...</p>
      </div>
    );
  }
  
  if (sortedNations.length === 0 && !isLoadingNations) {
    return (
         <Alert variant="destructive">
            <Users className="h-4 w-4" />
            <AlertTitle>Nazioni Mancanti</AlertTitle>
            <AlertDescription>
                Impossibile caricare l'elenco delle nazioni. Assicurati che ci siano nazioni in Firestore per popolare le selezioni.
            </AlertDescription>
        </Alert>
    )
  }

  const renderNationSelectItem = (nation: Nation) => (
    <div className="flex items-center space-x-2 py-1 w-full text-left">
      <Image
        src={`https://flagcdn.com/w20/${nation.countryCode.toLowerCase()}.png`}
        alt={`Bandiera ${nation.name}`}
        width={20}
        height={13}
        className="rounded-sm border border-border/30 object-contain flex-shrink-0"
        data-ai-hint={`${nation.name} flag icon`}
      />
      <div className="flex flex-col text-left">
        <span className="font-semibold">{nation.name}</span>
        <span className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-[250px]" title={`${nation.artistName} - ${nation.songTitle}`}>
          {`${nation.artistName} - ${nation.songTitle}`}
        </span>
      </div>
    </div>
  );
  
  if (isReadOnly) {
    return (
      <>
        <Form {...form}>
          <form className="space-y-6 py-4">
             <FormField
              control={form.control}
              name="bestTreppoScoreNationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Miglior TreppoScore</FormLabel>
                   <Select value={field.value || ""} disabled={true}>
                     <FormControl><SelectTrigger><SelectValue>{field.value && sortedNations.find(n => n.id === field.value) ? renderNationSelectItem(sortedNations.find(n => n.id === field.value)!) : "Nessuna selezione"}</SelectValue></SelectTrigger></FormControl>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bestSongNationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Migliore canzone</FormLabel>
                  <Select value={field.value || ""} disabled={true}>
                    <FormControl><SelectTrigger><SelectValue>{field.value && sortedNations.find(n => n.id === field.value) ? renderNationSelectItem(sortedNations.find(n => n.id === field.value)!) : "Nessuna selezione"}</SelectValue></SelectTrigger></FormControl>
                  </Select>
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="bestPerformanceNationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Migliore performance</FormLabel>
                   <Select value={field.value || ""} disabled={true}>
                     <FormControl><SelectTrigger><SelectValue>{field.value && sortedNations.find(n => n.id === field.value) ? renderNationSelectItem(sortedNations.find(n => n.id === field.value)!) : "Nessuna selezione"}</SelectValue></SelectTrigger></FormControl>
                  </Select>
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="bestOutfitNationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Migliore outfit</FormLabel>
                   <Select value={field.value || ""} disabled={true}>
                     <FormControl><SelectTrigger><SelectValue>{field.value && sortedNations.find(n => n.id === field.value) ? renderNationSelectItem(sortedNations.find(n => n.id === field.value)!) : "Nessuna selezione"}</SelectValue></SelectTrigger></FormControl>
                  </Select>
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="worstTreppoScoreNationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Peggior TreppoScore</FormLabel>
                  <Select value={field.value || ""} disabled={true}>
                    <FormControl><SelectTrigger><SelectValue>{field.value && sortedNations.find(n => n.id === field.value) ? renderNationSelectItem(sortedNations.find(n => n.id === field.value)!) : "Nessuna selezione"}</SelectValue></SelectTrigger></FormControl>
                  </Select>
                </FormItem>
              )}
            />
          </form>
        </Form>
      </>
    );
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
         <FormField
          control={form.control}
          name="bestTreppoScoreNationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Miglior TreppoScore</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""} disabled={isSubmitting || sortedNations.length === 0 || isReadOnly}>
                <FormControl>
                  <SelectTrigger>
                     <SelectValue placeholder={sortedNations.length === 0 ? "Nessuna nazione" : "Seleziona nazione"}>
                      {field.value && sortedNations.find(n => n.id === field.value) ? renderNationSelectItem(sortedNations.find(n => n.id === field.value)!) : (sortedNations.length === 0 ? "Nessuna nazione" : "Seleziona nazione")}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {sortedNations.map((nation) => (
                    <SelectItem key={`${nation.id}-bestTreppo`} value={nation.id}>
                       {renderNationSelectItem(nation)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Scegli la nazione che otterrà il TreppoScore più alto (media voti utenti).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bestSongNationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Migliore canzone</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""} disabled={isSubmitting || sortedNations.length === 0 || isReadOnly}>
                <FormControl>
                  <SelectTrigger>
                     <SelectValue placeholder={sortedNations.length === 0 ? "Nessuna nazione" : "Seleziona nazione"}>
                      {field.value && sortedNations.find(n => n.id === field.value) ? renderNationSelectItem(sortedNations.find(n => n.id === field.value)!) : (sortedNations.length === 0 ? "Nessuna nazione" : "Seleziona nazione")}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {sortedNations.map((nation) => (
                    <SelectItem key={`${nation.id}-bestSong`} value={nation.id}>
                       {renderNationSelectItem(nation)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Scegli la migliore canzone secondo gli utenti di TreppoVision.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bestPerformanceNationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Migliore performance</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""} disabled={isSubmitting || sortedNations.length === 0 || isReadOnly}>
                <FormControl>
                  <SelectTrigger>
                     <SelectValue placeholder={sortedNations.length === 0 ? "Nessuna nazione" : "Seleziona nazione"}>
                        {field.value && sortedNations.find(n => n.id === field.value) ? renderNationSelectItem(sortedNations.find(n => n.id === field.value)!) : (sortedNations.length === 0 ? "Nessuna nazione" : "Seleziona nazione")}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {sortedNations.map((nation) => (
                    <SelectItem key={`${nation.id}-bestPerf`} value={nation.id}>
                      {renderNationSelectItem(nation)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Scegli la migliore performance secondo gli utenti di TreppoVision.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bestOutfitNationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Migliore outfit</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""} disabled={isSubmitting || sortedNations.length === 0 || isReadOnly}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={sortedNations.length === 0 ? "Nessuna nazione" : "Seleziona nazione"}>
                        {field.value && sortedNations.find(n => n.id === field.value) ? renderNationSelectItem(sortedNations.find(n => n.id === field.value)!) : (sortedNations.length === 0 ? "Nessuna nazione" : "Seleziona nazione")}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {sortedNations.map((nation) => (
                    <SelectItem key={`${nation.id}-bestOutfit`} value={nation.id}>
                      {renderNationSelectItem(nation)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Scegli l'outfit migliore secondo gli utenti di TreppoVision.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="worstTreppoScoreNationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Peggior TreppoScore</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""} disabled={isSubmitting || sortedNations.length === 0 || isReadOnly}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={sortedNations.length === 0 ? "Nessuna nazione" : "Seleziona nazione"}>
                        {field.value && sortedNations.find(n => n.id === field.value) ? renderNationSelectItem(sortedNations.find(n => n.id === field.value)!) : (sortedNations.length === 0 ? "Nessuna nazione" : "Seleziona nazione")}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {sortedNations.map((nation) => (
                    <SelectItem key={`${nation.id}-worstTreppo`} value={nation.id}>
                       {renderNationSelectItem(nation)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>La nazione con il peggior TreppoScore secondo gli utenti di TreppoVision.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {!isReadOnly && (
           <Alert variant="destructive" className="mt-6 mb-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Attenzione</AlertTitle>
                <AlertDescription>
                    I pronostici finali, una volta inviati, non possono essere modificati.
                </AlertDescription>
            </Alert>
        )}

        <Button
          type="submit"
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
          disabled={isSubmitting || isLoadingNations || sortedNations.length === 0 || isReadOnly}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Salva Pronostici
        </Button>
      </form>
    </Form>
  );
}
