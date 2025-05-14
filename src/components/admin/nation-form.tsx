
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
import type { NationFormData, NationCategory } from "@/types";
import { addNationAction, updateNationAction } from "@/lib/actions/admin-actions";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

const nationFormSchema = z.object({
  id: z.string().min(2, "L'ID Nazione è richiesto (es. 'it').").max(3, "L'ID Nazione deve essere di 2-3 caratteri."),
  name: z.string().min(1, "Il nome della nazione è richiesto."),
  countryCode: z.string().min(2, "Il codice paese è richiesto (es. 'it').").max(3, "Il codice paese deve essere di 2-3 caratteri."),
  songTitle: z.string().min(1, "Il titolo della canzone è richiesto."),
  artistName: z.string().min(1, "Il nome dell'artista è richiesto."),
  youtubeVideoId: z.string().min(1, "L'ID video YouTube è richiesto."),
  category: z.enum(["founders", "day1", "day2"], {
    required_error: "La categoria è richiesta.",
  }),
  ranking: z.coerce.number().int().positive("La posizione deve essere un numero intero positivo."),
  performingOrder: z.coerce.number().int().min(0, "L'ordine di esibizione deve essere un numero intero non negativo."),
});

interface NationFormProps {
  initialData?: NationFormData;
  isEditMode?: boolean;
}

export function NationForm({ initialData, isEditMode = false }: NationFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<NationFormData>({
    resolver: zodResolver(nationFormSchema),
    defaultValues: initialData
      ? { 
          ...initialData, 
          ranking: initialData.ranking || 1,
          performingOrder: initialData.performingOrder || 0, // Ensure performingOrder has a default
        }
      : {
          id: "",
          name: "",
          countryCode: "",
          songTitle: "",
          artistName: "",
          youtubeVideoId: "dQw4w9WgXcQ",
          category: "day1",
          ranking: 1,
          performingOrder: 0, // Default performingOrder for new nations
        },
  });

  async function onSubmit(values: NationFormData) {
    setIsSubmitting(true);
    const action = isEditMode ? updateNationAction : addNationAction;
    const result = await action(values);

    if (result.success) {
      toast({
        title: isEditMode ? "Nazione Aggiornata" : "Nazione Aggiunta",
        description: `${values.name} ${isEditMode ? 'aggiornata' : 'aggiunta'} con successo.`,
      });
      router.push(`/nations/${result.nationId || values.id}`);
      router.refresh();
    } else {
      toast({
        title: "Errore",
        description: result.message || "Si è verificato un errore.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  }

  const categories: { value: NationCategory; label: string }[] = [
    { value: "founders", label: "Fondatori" },
    { value: "day1", label: "Prima Semifinale" },
    { value: "day2", label: "Seconda Semifinale" },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID Nazione (Codice Paese)</FormLabel>
              <FormControl>
                <Input placeholder="es. it, gb, fr" {...field} disabled={isEditMode || isSubmitting} />
              </FormControl>
              <FormDescription>
                Il codice paese di 2 lettere (es. 'it'). Questo sarà usato come ID unico. Non modificabile dopo la creazione.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Nazione</FormLabel>
              <FormControl>
                <Input placeholder="es. Italia" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="countryCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Codice Paese per Bandiera (flagcdn)</FormLabel>
              <FormControl>
                <Input placeholder="es. it" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormDescription>
                Il codice paese di 2 lettere per recuperare la bandiera (es. 'it' per flagcdn.com/w160/it.png).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="songTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titolo Canzone</FormLabel>
              <FormControl>
                <Input placeholder="Titolo della canzone" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="artistName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Artista</FormLabel>
              <FormControl>
                <Input placeholder="Nome dell'artista" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="youtubeVideoId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID Video YouTube</FormLabel>
              <FormControl>
                <Input placeholder="es. dQw4w9WgXcQ" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormDescription>
                L'ID del video da YouTube (es. l'ID in youtube.com/watch?v=ID_VIDEO).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona una categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
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
          name="ranking"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Posizione (Ranking)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="es. 1" {...field} disabled={isSubmitting}
                  onChange={event => field.onChange(+event.target.value)} // Ensure value is number
                />
              </FormControl>
              <FormDescription>
                La posizione iniziale o prevista della nazione.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="performingOrder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ordine di Esibizione</FormLabel>
              <FormControl>
                <Input type="number" placeholder="es. 0, 1, 2..." {...field} disabled={isSubmitting} 
                  onChange={event => field.onChange(+event.target.value)} // Ensure value is number
                />
              </FormControl>
              <FormDescription>
                Numero per ordinare le nazioni (0 per primo). Non visibile agli utenti.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          {isEditMode ? "Salva Modifiche" : "Aggiungi Nazione"}
        </Button>
      </form>
    </Form>
  );
}
