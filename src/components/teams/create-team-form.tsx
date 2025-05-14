
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { Nation, TeamFormData, Team } from "@/types";
import { getNations } from "@/lib/nation-service";
import { getTeamsByUserId } from "@/lib/team-service";
import { createTeamAction, updateTeamAction } from "@/lib/actions/team-actions";
import { useRouter } from "next/navigation";
import { Loader2, Save, Users, Info, Edit } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

const teamFormZodSchema = z.object({
  name: z.string().min(3, "Il nome del team deve contenere almeno 3 caratteri."),
  founderNationId: z.string().min(1, "Devi selezionare una nazione per la prima squadra."),
  day1NationId: z.string().min(1, "Devi selezionare una nazione per la seconda squadra."),
  day2NationId: z.string().min(1, "Devi selezionare una nazione per la terza squadra."),
  bestSongNationId: z.string().min(1, "Devi selezionare la migliore canzone."),
  bestPerformanceNationId: z.string().min(1, "Devi selezionare la migliore performance."),
  bestOutfitNationId: z.string().min(1, "Devi selezionare il migliore outfit."),
  worstSongNationId: z.string().min(1, "Devi selezionare la peggiore canzone."),
});

// Form values will not include creatorDisplayName directly from user input fields
type TeamFormValues = Omit<TeamFormData, 'creatorDisplayName'>;

interface CreateTeamFormProps {
  initialData?: TeamFormData;
  isEditMode?: boolean;
  teamId?: string;
}

export function CreateTeamForm({ initialData, isEditMode = false, teamId }: CreateTeamFormProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [nations, setNations] = React.useState<Nation[]>([]);
  const [isLoadingNations, setIsLoadingNations] = React.useState(true);
  const [userHasTeam, setUserHasTeam] = React.useState<boolean | null>(null);
  const [isLoadingUserTeamCheck, setIsLoadingUserTeamCheck] = React.useState(true);

  React.useEffect(() => {
    async function fetchInitialData() {
      setIsLoadingNations(true);
      if (!isEditMode) { 
        setIsLoadingUserTeamCheck(true);
      }

      if (user) {
        try {
          const fetchedNations = await getNations();
          setNations(fetchedNations);

          if (!isEditMode) {
            const userTeams = await getTeamsByUserId(user.uid);
            setUserHasTeam(userTeams.length > 0);
          } else {
            setUserHasTeam(true); 
          }
        } catch (error) {
          console.error("Failed to fetch initial data for team form:", error);
          toast({
            title: "Errore Caricamento Dati",
            description: "Impossibile caricare i dati necessari. Riprova più tardi.",
            variant: "destructive",
          });
          setNations([]);
          if (!isEditMode) setUserHasTeam(false);
        } finally {
          setIsLoadingNations(false);
          if (!isEditMode) setIsLoadingUserTeamCheck(false);
        }
      } else {
        try {
            const fetchedNations = await getNations();
            setNations(fetchedNations);
        } catch (error) {
            console.error("Failed to fetch nations:", error);
            setNations([]);
        }
        if (!isEditMode) setUserHasTeam(false);
        setIsLoadingNations(false);
        if (!isEditMode) setIsLoadingUserTeamCheck(false);
      }
    }
    if (!authLoading) {
        fetchInitialData();
    }
  }, [toast, user, authLoading, isEditMode]);

  const form = useForm<TeamFormValues>({ 
    resolver: zodResolver(teamFormZodSchema),
    defaultValues: initialData 
      ? {
          name: initialData.name,
          founderNationId: initialData.founderNationId,
          day1NationId: initialData.day1NationId,
          day2NationId: initialData.day2NationId,
          bestSongNationId: initialData.bestSongNationId || "",
          bestPerformanceNationId: initialData.bestPerformanceNationId || "",
          bestOutfitNationId: initialData.bestOutfitNationId || "",
          worstSongNationId: initialData.worstSongNationId || "",
        }
      : {
          name: "",
          founderNationId: "",
          day1NationId: "",
          day2NationId: "",
          bestSongNationId: "",
          bestPerformanceNationId: "",
          bestOutfitNationId: "",
          worstSongNationId: "",
        },
  });

  React.useEffect(() => {
    if (initialData) {
      form.reset({ 
        name: initialData.name,
        founderNationId: initialData.founderNationId,
        day1NationId: initialData.day1NationId,
        day2NationId: initialData.day2NationId,
        bestSongNationId: initialData.bestSongNationId || "",
        bestPerformanceNationId: initialData.bestPerformanceNationId || "",
        bestOutfitNationId: initialData.bestOutfitNationId || "",
        worstSongNationId: initialData.worstSongNationId || "",
      });
    }
  }, [initialData, form]);

  async function onSubmit(values: TeamFormValues) {
    if (!user) {
      toast({ title: "Autenticazione Richiesta", description: "Devi effettuare il login per creare o modificare un team.", variant: "destructive" });
      return;
    }
    if (!isEditMode && userHasTeam) {
      toast({ title: "Limite Team Raggiunto", description: "Puoi creare un solo team per account.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    const fullTeamData: TeamFormData = {
      ...values,
      creatorDisplayName: user.displayName || user.email || "Utente Anonimo",
    };

    let result;
    if (isEditMode && teamId) {
      result = await updateTeamAction(teamId, fullTeamData, user.uid);
    } else {
      result = await createTeamAction(fullTeamData, user.uid);
    }

    if (result.success) {
      toast({
        title: isEditMode ? "Team Aggiornato!" : "Team Creato!",
        description: `Il team "${values.name}" è stato ${isEditMode ? 'aggiornato' : 'creato'} con successo.`,
      });
      if (!isEditMode) setUserHasTeam(true);
      router.push("/teams"); 
      router.refresh(); 
    } else {
      toast({
        title: isEditMode ? "Errore Aggiornamento Team" : "Errore Creazione Team",
        description: result.message || "Si è verificato un errore.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  }

  if (authLoading || isLoadingNations || (!isEditMode && isLoadingUserTeamCheck)) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Caricamento...</p>
      </div>
    );
  }

  if (!user) {
    return (
        <Alert variant="destructive">
            <Users className="h-4 w-4" />
            <AlertTitle>Accesso Richiesto</AlertTitle>
            <AlertDescription>
                Devi effettuare il <Link href="#" className="font-bold hover:underline" onClick={() => {
                    const authButtonDialogTrigger = document.querySelector('button[aria-label="Open authentication dialog"], button>svg.lucide-log-in') as HTMLElement | null;
                    if (authButtonDialogTrigger) {
                        if (authButtonDialogTrigger.tagName === 'BUTTON') { authButtonDialogTrigger.click(); }
                        else if (authButtonDialogTrigger.parentElement?.tagName === 'BUTTON') { (authButtonDialogTrigger.parentElement as HTMLElement).click(); }
                    }
                }}>login</Link> per {isEditMode ? 'modificare' : 'creare'} una squadra.
            </AlertDescription>
        </Alert>
    );
  }

  if (!isEditMode && userHasTeam === true) { 
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Team Già Creato</AlertTitle>
        <AlertDescription>
          Hai già creato un team. Puoi creare un solo team.
          Visualizza o <Link href="/teams" className="font-bold hover:underline">modifica il tuo team qui</Link>.
        </AlertDescription>
      </Alert>
    );
  }
  
  const founderNations = nations.filter(n => n.category === 'founders');
  const day1Nations = nations.filter(n => n.category === 'day1');
  const day2Nations = nations.filter(n => n.category === 'day2');

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
   if ((founderNations.length === 0 || day1Nations.length === 0 || day2Nations.length === 0) && !isLoadingNations) {
     return (
        <Alert variant="destructive">
            <Users className="h-4 w-4" />
            <AlertTitle>Categorie Nazioni Incomplete</AlertTitle>
            <AlertDescription>
                Per creare un team, devono essere disponibili nazioni per tutte e tre le categorie (Fondatrici, Prima Semifinale, Seconda Semifinale). Controlla i dati delle nazioni in Firestore.
                 Oppure, se sono disponibili nazioni in generale ma non per queste categorie, le selezioni qui sotto potrebbero essere vuote.
            </AlertDescription>
        </Alert>
     )
   }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome del Team</FormLabel>
              <FormControl>
                <Input placeholder="Es. Gli EuroVincenti" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormDescription>
                Scegli un nome epico per la tua squadra!
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="founderNationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prima squadra (nazioni fondatrici)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""} disabled={isSubmitting || founderNations.length === 0}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={founderNations.length === 0 ? "Nessuna nazione fondatrice disponibile" : "Seleziona nazione"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {founderNations.map((nation) => (
                    <SelectItem key={nation.id} value={nation.id}>
                      {nation.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="day1NationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Seconda squadra (Prima semifinale)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""} disabled={isSubmitting || day1Nations.length === 0}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={day1Nations.length === 0 ? "Nessuna nazione disponibile (Prima Semifinale)" : "Seleziona nazione"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {day1Nations.map((nation) => (
                    <SelectItem key={nation.id} value={nation.id}>
                      {nation.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="day2NationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Terza squadra (Seconda semifinale)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""} disabled={isSubmitting || day2Nations.length === 0}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={day2Nations.length === 0 ? "Nessuna nazione disponibile (Seconda Semifinale)" : "Seleziona nazione"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {day2Nations.map((nation) => (
                    <SelectItem key={nation.id} value={nation.id}>
                      {nation.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* New Fields */}
        <FormField
          control={form.control}
          name="bestSongNationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Migliore canzone</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""} disabled={isSubmitting || nations.length === 0}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={nations.length === 0 ? "Nessuna nazione disponibile" : "Seleziona nazione"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {nations.map((nation) => (
                    <SelectItem key={nation.id} value={nation.id}>
                      {nation.name} - {nation.songTitle}
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
              <Select onValueChange={field.onChange} value={field.value || ""} disabled={isSubmitting || nations.length === 0}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={nations.length === 0 ? "Nessuna nazione disponibile" : "Seleziona nazione"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {nations.map((nation) => (
                    <SelectItem key={nation.id} value={nation.id}>
                      {nation.name} - {nation.artistName}
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
              <Select onValueChange={field.onChange} value={field.value || ""} disabled={isSubmitting || nations.length === 0}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={nations.length === 0 ? "Nessuna nazione disponibile" : "Seleziona nazione"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {nations.map((nation) => (
                    <SelectItem key={nation.id} value={nation.id}>
                      {nation.name}
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
              <Select onValueChange={field.onChange} value={field.value || ""} disabled={isSubmitting || nations.length === 0}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={nations.length === 0 ? "Nessuna nazione disponibile" : "Seleziona nazione"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {nations.map((nation) => (
                    <SelectItem key={nation.id} value={nation.id}>
                      {nation.name} - {nation.songTitle}
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
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" 
            disabled={isSubmitting || isLoadingNations || (!isEditMode && userHasTeam === true) || founderNations.length === 0 || day1Nations.length === 0 || day2Nations.length === 0 || nations.length === 0}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditMode ? <Edit className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
          {isEditMode ? "Salva Modifiche" : "Crea Team"}
        </Button>
      </form>
    </Form>
  );
}
