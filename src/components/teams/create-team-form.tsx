
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { Nation, TeamCoreFormData } from "@/types";
import { getNations } from "@/lib/nation-service";
import { getTeamsByUserId } from "@/lib/team-service";
import { createTeamAction, updateTeamAction, getTeamsLockedStatus } from "@/lib/actions/team-actions";
import { useRouter } from "next/navigation";
import { Loader2, Save, Users, Info, Edit, Lock, ListChecks } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Image from "next/image";

// This schema is now only for the core team details
const teamCoreFormZodSchema = z.object({
  name: z.string().min(3, "Il nome del team deve contenere almeno 3 caratteri."),
  founderChoices: z.array(z.string())
    .length(3, "Devi selezionare esattamente 3 nazioni.")
    .refine(items => new Set(items).size === items.length, {
      message: "Le tre nazioni scelte devono essere diverse.",
    }),
});

// This form now only handles TeamCoreFormValues
type TeamCoreFormValues = Omit<TeamCoreFormData, 'creatorDisplayName'>;

interface CreateTeamFormProps {
  initialData?: TeamCoreFormData; // Expects only core data now
  isEditMode?: boolean;
  teamId?: string;
  teamsLocked?: boolean | null;
}

export function CreateTeamForm({ initialData, isEditMode = false, teamId, teamsLocked: propTeamsLocked }: CreateTeamFormProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [nations, setNations] = React.useState<Nation[]>([]);
  const [isLoadingNations, setIsLoadingNations] = React.useState(true);
  const [userHasTeam, setUserHasTeam] = React.useState<boolean | null>(null);
  const [isLoadingUserTeamCheck, setIsLoadingUserTeamCheck] = React.useState(true);
  const [founderPopoverOpen, setFounderPopoverOpen] = React.useState(false);
  const [teamsLocked, setTeamsLocked] = React.useState<boolean | null>(propTeamsLocked);


  React.useEffect(() => {
    async function fetchInitialData() {
      setIsLoadingNations(true);
      if (!isEditMode) {
        setIsLoadingUserTeamCheck(true);
      }
      if (teamsLocked === null && propTeamsLocked === null) {
        const lockStatus = await getTeamsLockedStatus();
        setTeamsLocked(lockStatus);
      }

      if (user || !authLoading) {
        try {
          const fetchedNations = await getNations();
          setNations(fetchedNations);

          if (user && !isEditMode) {
            const userTeams = await getTeamsByUserId(user.uid);
            setUserHasTeam(userTeams.length > 0);
          } else if (isEditMode && user) {
            setUserHasTeam(true); 
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
        setIsLoadingNations(false);
        if (!isEditMode) setIsLoadingUserTeamCheck(false);
        if (!isEditMode) setUserHasTeam(false);
      }
    }
    if (!authLoading) {
        fetchInitialData();
    }
  }, [toast, user, authLoading, isEditMode, propTeamsLocked]);

  const form = useForm<TeamCoreFormValues>({
    resolver: zodResolver(teamCoreFormZodSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          founderChoices: initialData.founderChoices || [],
        }
      : {
          name: "",
          founderChoices: [],
        },
  });

  React.useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        founderChoices: initialData.founderChoices || [],
      });
    }
  }, [initialData, form]);

  async function onSubmit(values: TeamCoreFormValues) {
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

    const teamDataPayload: TeamCoreFormData = {
      ...values,
      creatorDisplayName: user.displayName || user.email || "Utente Anonimo",
    };

    let result;
    if (isEditMode && teamId) {
      result = await updateTeamAction(teamId, teamDataPayload, user.uid);
    } else {
      result = await createTeamAction(teamDataPayload, user.uid);
    }

    if (result.success) {
      toast({
        title: isEditMode ? "Dettagli Team Aggiornati!" : "Team Creato!",
        description: `Il team "${values.name}" è stato ${isEditMode ? 'aggiornato' : 'creato'} con successo. Puoi ora inserire i tuoi pronostici finali dalla pagina Squadre.`,
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
                }}>login</Link> per {isEditMode ? 'modificare i dettagli' : 'creare'} una squadra.
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
          L'amministratore ha temporaneamente bloccato la {isEditMode ? 'modifica dei dettagli' : 'creazione'} delle squadre. Riprova più tardi.
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
          Hai già creato un team. Puoi creare un solo team per account.
          Puoi <Link href="/teams" className="font-bold hover:underline">modificare i dettagli del tuo team o inserire i pronostici finali qui</Link>.
        </AlertDescription>
      </Alert>
    );
  }


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
   if (nations.length < 3 && !isLoadingNations) { 
     return (
        <Alert variant="destructive">
            <Users className="h-4 w-4" />
            <AlertTitle>Nazioni Insufficienti</AlertTitle>
            <AlertDescription>
                Per creare un team, devono essere disponibili almeno 3 nazioni in totale. Controlla i dati delle nazioni in Firestore.
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
              <FormLabel>Nazioni</FormLabel>
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
                            disabled={(field.value || []).length >=3 && !(field.value || []).includes(nation.id)}
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
                Scegli esattamente 3 nazioni per la tua squadra principale. Questi sono i tuoi pronostici per la classifica finale Eurovision.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Category prediction fields (Migliore canzone, etc.) are removed from this form */}
        <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isSubmitting || isLoadingNations || teamsLocked || (!isEditMode && userHasTeam === true) || nations.length < 3 }
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {teamsLocked ? <Lock className="mr-2 h-4 w-4" /> : (isEditMode ? <Edit className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />)}
          {teamsLocked ? "Modifiche Bloccate" : (isEditMode ? "Salva Dettagli Team" : "Crea Team")}
        </Button>
      </form>
    </Form>
  );
}
