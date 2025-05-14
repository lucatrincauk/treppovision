
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
import { getTeamsByUserId } from "@/lib/team-service"; // Import new service
import { createTeamAction } from "@/lib/actions/team-actions";
import { useRouter } from "next/navigation";
import { Loader2, Save, Users, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

const teamFormZodSchema = z.object({
  name: z.string().min(3, "Il nome del team deve contenere almeno 3 caratteri."),
  founderNationId: z.string().min(1, "Devi selezionare una nazione Fondatrice."),
  day1NationId: z.string().min(1, "Devi selezionare una nazione per il Giorno 1."),
  day2NationId: z.string().min(1, "Devi selezionare una nazione per il Giorno 2."),
  creatorDisplayName: z.string(), // No validation needed here, will be set internally
});

// Use Omit for the form values since creatorDisplayName is handled internally
type TeamFormValues = Omit<TeamFormData, 'creatorDisplayName'>;


export function CreateTeamForm() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [nations, setNations] = React.useState<Nation[]>([]);
  const [isLoadingNations, setIsLoadingNations] = React.useState(true);
  const [userHasTeam, setUserHasTeam] = React.useState<boolean | null>(null); // null: loading, true: has team, false: no team
  const [isLoadingUserTeamCheck, setIsLoadingUserTeamCheck] = React.useState(true);


  React.useEffect(() => {
    async function fetchInitialData() {
      setIsLoadingNations(true);
      setIsLoadingUserTeamCheck(true);

      if (user) {
        try {
          const [fetchedNations, userTeams] = await Promise.all([
            getNations(),
            getTeamsByUserId(user.uid)
          ]);
          setNations(fetchedNations);
          setUserHasTeam(userTeams.length > 0);
        } catch (error) {
          console.error("Failed to fetch initial data for team form:", error);
          toast({
            title: "Errore Caricamento Dati",
            description: "Impossibile caricare i dati necessari. Riprova più tardi.",
            variant: "destructive",
          });
          // Set nations to empty and assume no team to allow form to show if nations fail
          setNations([]);
          setUserHasTeam(false); 
        } finally {
          setIsLoadingNations(false);
          setIsLoadingUserTeamCheck(false);
        }
      } else {
        // If no user, just fetch nations if needed or set defaults
        try {
            const fetchedNations = await getNations();
            setNations(fetchedNations);
        } catch (error) {
            console.error("Failed to fetch nations:", error);
            setNations([]);
        }
        setUserHasTeam(false); // No user means no team
        setIsLoadingNations(false);
        setIsLoadingUserTeamCheck(false);
      }
    }
    if (!authLoading) { // Only run if auth state is resolved
        fetchInitialData();
    }
  }, [toast, user, authLoading]);

  const form = useForm<TeamFormValues>({ // Use Omit<TeamFormData, 'creatorDisplayName'> for form values
    resolver: zodResolver(teamFormZodSchema.omit({ creatorDisplayName: true })), // Omit for Zod schema too
    defaultValues: {
      name: "",
      founderNationId: "",
      day1NationId: "",
      day2NationId: "",
    },
  });

  async function onSubmit(values: TeamFormValues) {
    if (!user) {
      toast({ title: "Autenticazione Richiesta", description: "Devi effettuare il login per creare un team.", variant: "destructive" });
      return;
    }
    if (userHasTeam) {
      toast({ title: "Limite Team Raggiunto", description: "Puoi creare un solo team per account.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    const fullTeamData: TeamFormData = {
      ...values,
      creatorDisplayName: user.displayName || user.email || "Utente Anonimo",
    };

    const result = await createTeamAction(fullTeamData, user.uid);

    if (result.success) {
      toast({
        title: "Team Creato!",
        description: `Il tuo team "${values.name}" è stato creato con successo.`,
      });
      setUserHasTeam(true); // Update client-side state
      router.push("/teams"); 
      router.refresh(); 
    } else {
      toast({
        title: "Errore Creazione Team",
        description: result.message || "Si è verificato un errore.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  }

  if (authLoading || isLoadingNations || isLoadingUserTeamCheck) {
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
                    // Attempt to click the AuthButton in the header
                    const authButtonDialogTrigger = document.querySelector('button[aria-label="Open authentication dialog"], button>svg.lucide-log-in') as HTMLElement | null;
                    if (authButtonDialogTrigger) {
                        if (authButtonDialogTrigger.tagName === 'BUTTON') {
                        authButtonDialogTrigger.click();
                        } else if (authButtonDialogTrigger.parentElement && authButtonDialogTrigger.parentElement.tagName === 'BUTTON'){
                        (authButtonDialogTrigger.parentElement as HTMLElement).click();
                        }
                    }
                }}>login</Link> per creare una squadra.
            </AlertDescription>
        </Alert>
    );
  }

  if (userHasTeam) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Team Già Creato</AlertTitle>
        <AlertDescription>
          Hai già creato un team per il tuo account. Puoi creare un solo team.
          Visualizza il <Link href="/teams" className="font-bold hover:underline">tuo team e gli altri qui</Link>.
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
                Impossibile caricare l'elenco delle nazioni. Assicurati che ci siano nazioni in Firestore per poter creare un team.
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
              <FormLabel>Nazione Fondatrice (1)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting || founderNations.length === 0}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={founderNations.length === 0 ? "Nessuna nazione fondatrice disponibile" : "Seleziona nazione fondatrice"} />
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
              <FormLabel>Nazione Giorno 1 (1)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting || day1Nations.length === 0}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={day1Nations.length === 0 ? "Nessuna nazione Giorno 1 disponibile" : "Seleziona nazione Giorno 1"} />
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
              <FormLabel>Nazione Giorno 2 (1)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting || day2Nations.length === 0}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={day2Nations.length === 0 ? "Nessuna nazione Giorno 2 disponibile" : "Seleziona nazione Giorno 2"} />
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

        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting || isLoadingNations || userHasTeam === true}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Crea Team
        </Button>
      </form>
    </Form>
  );
}
