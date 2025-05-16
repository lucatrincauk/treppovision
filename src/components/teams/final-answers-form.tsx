
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
import { updateTeamFinalAnswersAction } from "@/lib/actions/team-actions"; // Removed getTeamsLockedStatus
import { useRouter } from "next/navigation";
import { Loader2, Save, Lock, Users, Info } from "lucide-react"; // Lock icon can be removed if not used elsewhere
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";

const finalAnswersFormZodSchema = z.object({
  bestSongNationId: z.string().min(1, "Devi selezionare la migliore canzone."),
  bestPerformanceNationId: z.string().min(1, "Devi selezionare la migliore performance."),
  bestOutfitNationId: z.string().min(1, "Devi selezionare il migliore outfit."),
  worstSongNationId: z.string().min(1, "Devi selezionare la peggiore canzone."),
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
  const [nations, setNations] = React.useState<Nation[]>([]);
  const [isLoadingNations, setIsLoadingNations] = React.useState(true);
  // Removed teamsLocked state and related useEffect

  React.useEffect(() => {
    async function fetchData() {
      setIsLoadingNations(true);
      try {
        const fetchedNations = await getNations();
        setNations(fetchedNations);
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
      bestSongNationId: "",
      bestPerformanceNationId: "",
      bestOutfitNationId: "",
      worstSongNationId: "",
    },
  });

  React.useEffect(() => {
    if (initialData) {
      form.reset({
        bestSongNationId: initialData.bestSongNationId || "",
        bestPerformanceNationId: initialData.bestPerformanceNationId || "",
        bestOutfitNationId: initialData.bestOutfitNationId || "",
        worstSongNationId: initialData.worstSongNationId || "",
      });
    }
  }, [initialData, form]);

  async function onSubmit(values: TeamFinalAnswersFormData) {
    if (!user) {
      toast({ title: "Autenticazione Richiesta", description: "Devi effettuare il login.", variant: "destructive" });
      return;
    }
    // Removed check for teamsLocked here
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

  if (authLoading || isLoadingNations) { // Removed teamsLocked === null check
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Caricamento...</p>
      </div>
    );
  }

  // Removed the Alert for teamsLocked as this form's access is controlled by parent page based on finalPredictionsEnabled
  
  if (nations.length === 0 && !isLoadingNations) {
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
    // This block handles the case where the form is read-only because predictions have already been submitted
    // The parent page `pronostici/page.tsx` will likely show a different message already,
    // but this provides a fallback if the form component is somehow rendered when read-only.
    return (
      <>
        <Alert variant="default" className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Pronostici Inviati</AlertTitle>
          <AlertDescription>
            I tuoi pronostici finali sono stati inviati e non possono essere modificati.
          </AlertDescription>
        </Alert>
        <Form {...form}>
          <form className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="bestSongNationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Migliore canzone</FormLabel>
                  <Select value={field.value || ""} disabled={true}>
                    <FormControl><SelectTrigger><SelectValue>{field.value && nations.find(n => n.id === field.value) ? renderNationSelectItem(nations.find(n => n.id === field.value)!) : "Nessuna selezione"}</SelectValue></SelectTrigger></FormControl>
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
                     <FormControl><SelectTrigger><SelectValue>{field.value && nations.find(n => n.id === field.value) ? renderNationSelectItem(nations.find(n => n.id === field.value)!) : "Nessuna selezione"}</SelectValue></SelectTrigger></FormControl>
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
                     <FormControl><SelectTrigger><SelectValue>{field.value && nations.find(n => n.id === field.value) ? renderNationSelectItem(nations.find(n => n.id === field.value)!) : "Nessuna selezione"}</SelectValue></SelectTrigger></FormControl>
                  </Select>
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="worstSongNationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Peggiore canzone</FormLabel>
                  <Select value={field.value || ""} disabled={true}>
                    <FormControl><SelectTrigger><SelectValue>{field.value && nations.find(n => n.id === field.value) ? renderNationSelectItem(nations.find(n => n.id === field.value)!) : "Nessuna selezione"}</SelectValue></SelectTrigger></FormControl>
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
          name="bestSongNationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Migliore canzone</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""} disabled={isSubmitting || nations.length === 0 || isReadOnly}>
                <FormControl>
                  <SelectTrigger>
                     <SelectValue placeholder={nations.length === 0 ? "Nessuna nazione" : "Seleziona nazione"}>
                      {field.value && nations.find(n => n.id === field.value) ? renderNationSelectItem(nations.find(n => n.id === field.value)!) : (nations.length === 0 ? "Nessuna nazione" : "Seleziona nazione")}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {nations.map((nation) => (
                    <SelectItem key={`${nation.id}-bestSong`} value={nation.id}>
                       {renderNationSelectItem(nation)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Scegli la migliore canzone secondo gli utenti di Treppovision.</FormDescription>
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
              <Select onValueChange={field.onChange} value={field.value || ""} disabled={isSubmitting || nations.length === 0 || isReadOnly}>
                <FormControl>
                  <SelectTrigger>
                     <SelectValue placeholder={nations.length === 0 ? "Nessuna nazione" : "Seleziona nazione"}>
                        {field.value && nations.find(n => n.id === field.value) ? renderNationSelectItem(nations.find(n => n.id === field.value)!) : (nations.length === 0 ? "Nessuna nazione" : "Seleziona nazione")}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {nations.map((nation) => (
                    <SelectItem key={`${nation.id}-bestPerf`} value={nation.id}>
                      {renderNationSelectItem(nation)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Scegli la migliore performance secondo gli utenti di Treppovision.</FormDescription>
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
              <Select onValueChange={field.onChange} value={field.value || ""} disabled={isSubmitting || nations.length === 0 || isReadOnly}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={nations.length === 0 ? "Nessuna nazione" : "Seleziona nazione"}>
                        {field.value && nations.find(n => n.id === field.value) ? renderNationSelectItem(nations.find(n => n.id === field.value)!) : (nations.length === 0 ? "Nessuna nazione" : "Seleziona nazione")}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {nations.map((nation) => (
                    <SelectItem key={`${nation.id}-bestOutfit`} value={nation.id}>
                      {renderNationSelectItem(nation)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Scegli l'outfit migliore secondo gli utenti di Treppovision.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="worstSongNationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Peggiore canzone</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""} disabled={isSubmitting || nations.length === 0 || isReadOnly}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={nations.length === 0 ? "Nessuna nazione" : "Seleziona nazione"}>
                        {field.value && nations.find(n => n.id === field.value) ? renderNationSelectItem(nations.find(n => n.id === field.value)!) : (nations.length === 0 ? "Nessuna nazione" : "Seleziona nazione")}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {nations.map((nation) => (
                    <SelectItem key={`${nation.id}-worstSong`} value={nation.id}>
                       {renderNationSelectItem(nation)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>La peggiore canzone secondo gli utenti di Treppovision.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
          disabled={isSubmitting || isLoadingNations || nations.length === 0 || isReadOnly}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Salva Pronostici
        </Button>
      </form>
    </Form>
  );
}
