
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
import type { Nation, TeamFormData } from "@/types";
import { getNations } from "@/lib/nation-service";
import { createTeamAction } from "@/lib/actions/team-actions";
import { useRouter } from "next/navigation";
import { Loader2, Save, Users } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

const teamFormSchema = z.object({
  name: z.string().min(3, "Il nome del team deve contenere almeno 3 caratteri."),
  founderNationId: z.string().min(1, "Devi selezionare una nazione Fondatrice."),
  day1NationId: z.string().min(1, "Devi selezionare una nazione per il Giorno 1."),
  day2NationId: z.string().min(1, "Devi selezionare una nazione per il Giorno 2."),
});

export function CreateTeamForm() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [nations, setNations] = React.useState<Nation[]>([]);
  const [isLoadingNations, setIsLoadingNations] = React.useState(true);

  React.useEffect(() => {
    async function fetchNations() {
      setIsLoadingNations(true);
      try {
        const fetchedNations = await getNations();
        setNations(fetchedNations);
      } catch (error) {
        console.error("Failed to fetch nations for team form:", error);
        toast({
          title: "Errore Caricamento Nazioni",
          description: "Impossibile caricare l'elenco delle nazioni. Riprova più tardi.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingNations(false);
      }
    }
    fetchNations();
  }, [toast]);

  const form = useForm<TeamFormData>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: "",
      founderNationId: "",
      day1NationId: "",
      day2NationId: "",
    },
  });

  async function onSubmit(values: TeamFormData) {
    if (!user) {
      toast({ title: "Autenticazione Richiesta", description: "Devi effettuare il login per creare un team.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const result = await createTeamAction(values, user.uid);

    if (result.success) {
      toast({
        title: "Team Creato!",
        description: `Il tuo team "${values.name}" è stato creato con successo.`,
      });
      router.push("/teams"); // Redirect to the teams list page (to be created)
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

  if (authLoading || isLoadingNations) {
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
                    // This is a bit of a hack to trigger the auth dialog.
                    // Ideally, the auth dialog would be globally accessible via context/store.
                    const authButton = document.querySelector('button[aria-label="Open authentication dialog"]') as HTMLElement | null;
                    authButton?.click();
                }}>login</Link> per creare una squadra.
            </AlertDescription>
        </Alert>
    );
  }
  
  const founderNations = nations.filter(n => n.category === 'founders');
  const day1Nations = nations.filter(n => n.category === 'day1');
  const day2Nations = nations.filter(n => n.category === 'day2');

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

        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting || isLoadingNations}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Crea Team
        </Button>
      </form>
    </Form>
  );
}
