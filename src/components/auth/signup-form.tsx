
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { SignupFormData } from "@/types";
import { Loader2 } from "lucide-react";

const signupSchema = z.object({
  displayName: z.string().min(2, { message: "Il nome visualizzato deve contenere almeno 2 caratteri." }).optional(),
  email: z.string().email({ message: "Inserisci un indirizzo email valido." }),
  password: z.string().min(6, { message: "La password deve contenere almeno 6 caratteri." }),
});

interface SignupFormProps {
  onSuccess: () => void;
}

export function SignupForm({ onSuccess }: SignupFormProps) {
  const { signupWithEmail, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: SignupFormData) {
    setIsSubmitting(true);
    const success = await signupWithEmail(values);
    if (success) {
      onSuccess();
    }
    setIsSubmitting(false);
  }

  return (
    <Card className="border-none shadow-none">
      <CardHeader>
        <CardTitle>Crea un Nuovo Account</CardTitle>
        <CardDescription>Fornisci i tuoi dettagli per iniziare.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Visualizzato (Opzionale)</FormLabel>
                  <FormControl>
                    <Input placeholder="Il Tuo Nome" {...field} disabled={isLoading || isSubmitting}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="tuamail@esempio.com" {...field} type="email" disabled={isLoading || isSubmitting}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input placeholder="••••••••" {...field} type="password" disabled={isLoading || isSubmitting}/>
                  </FormControl>
                  <FormDescription>
                    Minimo 6 caratteri.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading || isSubmitting}>
              {(isLoading || isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrati
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
