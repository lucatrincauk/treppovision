
"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { Nation, TeamFormData, Team } from "@/types";
import { getNations } from "@/lib/nation-service";
import { getTeamsByUserId } from "@/lib/team-service";
import { createTeamAction, updateTeamAction } from "@/lib/actions/team-actions";
import { useRouter } from "next/navigation";
import { Loader2, Save, Users, Info, Edit, Lock, ListChecks } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Image from "next/image"; // Added Image import

const teamFormZodSchema = z.object({
  name: z.string().min(3, "Il nome del team deve contenere almeno 3 caratteri."),
  founderChoices: z.array(z.string())
    .length(3, "Devi selezionare esattamente 3 nazioni per la prima squadra.")
    .refine(items => new Set(items).size === items.length, {
      message: "Le tre nazioni scelte per la prima squadra devono essere diverse.",
    }),
  day1NationId: z.string().min(1, "Devi selezionare una nazione per la seconda squadra."),
  day2NationId: z.string().min(1, "Devi selezionare una nazione per la terza squadra."),
  bestSongNationId: z.string().min(1, "Devi selezionare la migliore canzone."),
  bestPerformanceNationId: z.string().min(1, "Devi selezionare la migliore performance."),
  bestOutfitNationId: z.string().min(1, "Devi selezionare il migliore outfit."),
  worstSongNationId: z.string().min(1, "Devi selezionare la peggiore canzone."),
});

type TeamFormValues = Omit<TeamFormData, 'creatorDisplayName'>;

interface CreateTeamFormProps {
  initialData?: TeamFormData;
  isEditMode?: boolean;
  teamId?: string;
  teamsLocked?: boolean | null;
}

export function CreateTeamForm({ initialData, isEditMode = false, teamId, teamsLocked }: CreateTeamFormProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [nations, setNations] = React.useState<Nation[]>([]);
  const [isLoadingNations, setIsLoadingNations] = React.useState(true);
  const [userHasTeam, setUserHasTeam] = React.useState<boolean | null>(null);
  const [isLoadingUserTeamCheck, setIsLoadingUserTeamCheck] = React.useState(true);
  const [founderPopoverOpen, setFounderPopoverOpen] = React.useState(false);


  React.useEffect(() => {
    async function fetchInitialData() {
      setIsLoadingNations(true);
      if (!isEditMode) {
        setIsLoadingUserTeamCheck(true);
      }

      if (user || !authLoading) { // Fetch nations even if user is not logged in initially
        try {
          const fetchedNations = await getNations();
          setNations(fetchedNations);

          if (user && !isEditMode) {
            const userTeams = await getTeamsByUserId(user.uid);
            setUserHasTeam(userTeams.length > 0);
          } else if (isEditMode && user) {
            setUserHasTeam(true); // If editing, user must have a team
          } else {
             if (!isEditMode) setUserHasTeam(false);
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
        // Handles case where auth is still loading and no user yet
        setIsLoadingNations(false);
        if (!isEditMode) setIsLoadingUserTeamCheck(false);
        if (!isEditMode) setUserHasTeam(false);
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
          founderChoices: initialData.founderChoices || [],
          day1NationId: initialData.day1NationId,
          day2NationId: initialData.day2NationId,
          bestSongNationId: initialData.bestSongNationId || "",
          bestPerformanceNationId: initialData.bestPerformanceNationId || "",
          bestOutfitNationId: initialData.bestOutfitNationId || "",
          worstSongNationId: initialData.worstSongNationId || "",
        }
      : {
          name: "",
          founderChoices: [],
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
        founderChoices: initialData.founderChoices || [],
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
    if (teamsLocked) {
      toast({ title: "Modifica Bloccata", description: "La modifica delle squadre è temporaneamente bloccata.", variant: "destructive" });
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

  if (authLoading || isLoadingNations || (!isEditMode && isLoadingUserTeamCheck) || teamsLocked === null) {
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

  if (teamsLocked) {
    return (
      <Alert variant="destructive">
        <Lock className="h-4 w-4" />
        <AlertTitle>Modifica Squadre Bloccata</AlertTitle>
        <AlertDescription>
          L'amministratore ha temporaneamente bloccato la {isEditMode ? 'modifica' : 'creazione'} delle squadre. Riprova più tardi.
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
   if ((day1Nations.length === 0 || day2Nations.length === 0) && !isLoadingNations) { 
     return (
        <Alert variant="destructive">
            <Users className="h-4 w-4" />
            <AlertTitle>Categorie Nazioni Incomplete</AlertTitle>
            <AlertDescription>
                Per creare un team, devono essere disponibili almeno una nazione per Prima Semifinale e Seconda Semifinale. Controlla i dati delle nazioni in Firestore.
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
                <Input placeholder="Es. Gli EuroVincenti" {...field} disabled={isSubmitting || teamsLocked} />
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
          name="founderChoices"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prima squadra - Seleziona 3</FormLabel>
              <Popover open={founderPopoverOpen} onOpenChange={setFounderPopoverOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        !field.value?.length && "text-muted-foreground"
                      )}
                      disabled={isSubmitting || teamsLocked || nations.length < 3}
                    >
                      {field.value?.length > 0
                        ? field.value
                            .map(val => nations.find(n => n.id === val)?.name) 
                            .filter(Boolean)
                            .join(", ")
                        : (nations.length < 3 ? "Nazioni insufficienti" : "Seleziona 3 nazioni")}
                      <ListChecks className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <ScrollArea className="h-72">
                    <div className="p-2 space-y-1">
                      {nations.map((nation) => ( 
                        <div key={nation.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md">
                          <Checkbox
                            id={`founder-${nation.id}`}
                            checked={(field.value || []).includes(nation.id)}
                            onCheckedChange={(checked) => {
                              const currentSelections = field.value || [];
                              if (checked) {
                                if (currentSelections.length < 3) {
                                  field.onChange([...currentSelections, nation.id]);
                                } else {
                                  toast({ title: "Limite Raggiunto", description: "Puoi selezionare solo 3 nazioni.", variant: "default", duration: 2000 });
                                  return false; 
                                }
                              } else {
                                field.onChange(currentSelections.filter(id => id !== nation.id));
                              }
                            }}
                            disabled={ (field.value || []).length >= 3 && !(field.value || []).includes(nation.id) }
                          />
                          <label
                            htmlFor={`founder-${nation.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-grow flex items-center gap-2 cursor-pointer"
                          >
                            <Image
                              src={`https://flagcdn.com/w20/${nation.countryCode.toLowerCase()}.png`}
                              alt={`Bandiera ${nation.name}`}
                              width={20}
                              height={13}
                              className="rounded-sm border border-border/30 object-contain"
                              data-ai-hint={`${nation.name} flag icon`}
                            />
                            <div className="flex flex-col">
                                <span className="font-semibold">{nation.name}</span>
                                <span className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-[250px]" title={`${nation.artistName} - ${nation.songTitle}`}>
                                    {nation.artistName} - {nation.songTitle}
                                </span>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              <FormDescription>
                Scegli esattamente 3 nazioni per la tua prima squadra.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />


        <FormField
          control={form.control}
          name="day1NationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Seconda squadra (Prima Semifinale)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""} disabled={isSubmitting || teamsLocked || day1Nations.length === 0}>
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
              <FormLabel>Terza squadra (Seconda Semifinale)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""} disabled={isSubmitting || teamsLocked || day2Nations.length === 0}>
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

        <FormField
          control={form.control}
          name="bestSongNationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Migliore canzone</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""} disabled={isSubmitting || teamsLocked || nations.length === 0}>
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
              <Select onValueChange={field.onChange} value={field.value || ""} disabled={isSubmitting || teamsLocked || nations.length === 0}>
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
              <Select onValueChange={field.onChange} value={field.value || ""} disabled={isSubmitting || teamsLocked || nations.length === 0}>
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
              <Select onValueChange={field.onChange} value={field.value || ""} disabled={isSubmitting || teamsLocked || nations.length === 0}>
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
            disabled={isSubmitting || isLoadingNations || teamsLocked || (!isEditMode && userHasTeam === true) || nations.length < 3 || day1Nations.length === 0 || day2Nations.length === 0}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {teamsLocked ? <Lock className="mr-2 h-4 w-4" /> : (isEditMode ? <Edit className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />)}
          {teamsLocked ? "Modifiche Bloccate" : (isEditMode ? "Salva Modifiche" : "Crea Team")}
        </Button>
      </form>
    </Form>
  );
}

    

    