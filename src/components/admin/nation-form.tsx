
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import type { NationFormData, NationCategory, AdminNationPayload } from "@/types";
import { addNationAction, updateNationAction } from "@/lib/actions/admin-actions";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

// This schema is for the form's internal values (NationFormData)
const nationFormInternalSchema = z.object({
  id: z.string().min(2, "L'ID Nazione è richiesto (es. 'it').").max(3, "L'ID Nazione deve essere di 2-3 caratteri."),
  name: z.string().min(1, "Il nome della nazione è richiesto."),
  countryCode: z.string().min(2, "Il codice paese è richiesto (es. 'it').").max(3, "Il codice paese deve essere di 2-3 caratteri."),
  songTitle: z.string().min(1, "Il titolo della canzone è richiesto."),
  artistName: z.string().min(1, "Il nome dell'artista è richiesto."),
  youtubeVideoId: z.string().min(1, "L'ID video YouTube è richiesto."),
  category: z.enum(["founders", "day1", "day2"], {
    required_error: "La categoria è richiesta.",
  }),
  ranking: z.string().optional(),
  juryRank: z.string().optional(), // New field for form
  televoteRank: z.string().optional(), // New field for form
  performingOrder: z.coerce.number().int().min(0, "L'ordine di esibizione deve essere un numero intero non negativo."),
  songDescription: z.string().optional(),
  songLyrics: z.string().optional(),
});

// This schema is for the actual data payload (AdminNationPayload) sent to server actions
const nationPayloadSchema = nationFormInternalSchema.extend({
  ranking: z.any().transform((val, ctx) => {
    if (val === undefined || val === null || String(val).trim() === "") {
      return undefined;
    }
    const num = Number(String(val));
    if (isNaN(num) || !Number.isInteger(num)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La posizione deve essere un numero intero valido o vuota.",
      });
      return z.NEVER;
    }
    return num;
  }),
  juryRank: z.any().transform((val, ctx) => { // New transformation
    if (val === undefined || val === null || String(val).trim() === "") {
      return undefined;
    }
    const num = Number(String(val));
    if (isNaN(num) || !Number.isInteger(num)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La Posizione Giuria deve essere un numero intero valido o vuota.",
      });
      return z.NEVER;
    }
    return num;
  }),
  televoteRank: z.any().transform((val, ctx) => { // New transformation
    if (val === undefined || val === null || String(val).trim() === "") {
      return undefined;
    }
    const num = Number(String(val));
    if (isNaN(num) || !Number.isInteger(num)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La Posizione Televoto deve essere un numero intero valido o vuota.",
      });
      return z.NEVER;
    }
    return num;
  }),
});


interface NationFormProps {
  initialData?: NationFormData;
  isEditMode?: boolean;
}

export function NationForm({ initialData, isEditMode = false }: NationFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof nationFormInternalSchema>>({
    resolver: zodResolver(nationPayloadSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          ranking: initialData.ranking ?? undefined,
          juryRank: initialData.juryRank ?? undefined, // New field default
          televoteRank: initialData.televoteRank ?? undefined, // New field default
          performingOrder: initialData.performingOrder || 0,
          songDescription: initialData.songDescription || "",
          songLyrics: initialData.songLyrics || "",
        }
      : {
          id: "",
          name: "",
          countryCode: "",
          songTitle: "",
          artistName: "",
          youtubeVideoId: "dQw4w9WgXcQ",
          category: "day1",
          ranking: undefined,
          juryRank: undefined, // New field default
          televoteRank: undefined, // New field default
          performingOrder: 0,
          songDescription: "",
          songLyrics: "",
        },
  });

  async function onSubmit(values: z.infer<typeof nationPayloadSchema>) {
    setIsSubmitting(true);
    const payloadForAction: AdminNationPayload = {
      ...values,
      ranking: values.ranking && values.ranking > 0 ? values.ranking : undefined,
      juryRank: values.juryRank && values.juryRank > 0 ? values.juryRank : undefined, // Prepare for payload
      televoteRank: values.televoteRank && values.televoteRank > 0 ? values.televoteRank : undefined, // Prepare for payload
      songDescription: values.songDescription || undefined,
      songLyrics: values.songLyrics || undefined,
    };

    const action = isEditMode ? updateNationAction : addNationAction;
    const result = await action(payloadForAction);

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
    { value: "founders", label: "Fondatori (Finalisti Automatici)" },
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
              <FormLabel>Posizione Complessiva (Ranking Finale)</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="es. 1 (lasciare vuoto se non applicabile)"
                  {...field}
                  onChange={event => field.onChange(event.target.value)}
                  value={field.value ?? ""}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                La posizione finale della nazione. Lasciare vuoto se non si desidera specificare.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="juryRank"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Posizione Giuria (Opzionale)</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="es. 1 (lasciare vuoto se non applicabile)"
                  {...field}
                  onChange={event => field.onChange(event.target.value)}
                  value={field.value ?? ""}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                La posizione assegnata dalla giuria.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="televoteRank"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Posizione Televoto (Opzionale)</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="es. 1 (lasciare vuoto se non applicabile)"
                  {...field}
                  onChange={event => field.onChange(event.target.value)}
                  value={field.value ?? ""}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                La posizione assegnata dal televoto.
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
                <Input
                  type="number"
                  placeholder="es. 0, 1, 2..."
                  {...field}
                  disabled={isSubmitting}
                  onChange={event => {
                     const num = parseInt(event.target.value, 10);
                     field.onChange(isNaN(num) ? 0 : num);
                  }}
                  value={field.value ?? 0}
                />
              </FormControl>
              <FormDescription>
                Numero per ordinare le nazioni (0 per primo).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="songDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrizione Artista/Canzone (Opzionale)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Breve descrizione o aneddoti sull'artista o sulla canzone..."
                  className="resize-y min-h-[100px]"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="songLyrics"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Testo Canzone (Opzionale)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Incolla qui il testo della canzone..."
                  className="resize-y min-h-[200px] font-mono text-sm"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
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
