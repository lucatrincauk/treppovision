
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
import { Loader2, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getUserRegistrationEnabledStatus } from "@/lib/actions/admin-actions";

const signupSchema = z.object({
  displayName: z.string().min(2, { message: "Il nome visualizzato deve contenere almeno 2 caratteri." }).optional(),
  email: z.string().email({ message: "Inserisci un indirizzo email valido." }),
  password: z.string().min(6, { message: "La password deve contenere almeno 6 caratteri." }),
});

interface SignupFormProps {
  onSuccess: () => void;
}

export function SignupForm({ onSuccess }: SignupFormProps) {
  const { signupWithEmail, isLoading: authIsLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [registrationEnabled, setRegistrationEnabled] = React.useState<boolean | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = React.useState(true);

  React.useEffect(() => {
    async function fetchStatus() {
      setIsLoadingStatus(true);
      try {
        const status = await getUserRegistrationEnabledStatus();
        setRegistrationEnabled(status);
      } catch (error) {
        console.error("Failed to fetch registration status:", error);
        setRegistrationEnabled(false); // Default to disabled on error
      } finally {
        setIsLoadingStatus(false);
      }
    }
    fetchStatus();
  }, []);

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: SignupFormData) {
    if (!registrationEnabled) {
      // This should ideally not be reachable if form is disabled, but as a safeguard
      return;
    }
    setIsSubmitting(true);
    const success = await signupWithEmail(values);
    if (success) {
      onSuccess();
    }
    setIsSubmitting(false);
  }

  if (isLoadingStatus) {
    return (
      <div className="flex justify-center items-center p-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (registrationEnabled === false) {
    return (
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle>Registrazione Disabilitata</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Registrazione Non Attiva</AlertTitle>
            <AlertDescription>
              La registrazione di nuovi utenti è temporaneamente disabilitata dall'amministratore.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
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
                    <Input placeholder="Il Tuo Nome" {...field} disabled={authIsLoading || isSubmitting}/>
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
                    <Input placeholder="tuamail@esempio.com" {...field} type="email" disabled={authIsLoading || isSubmitting}/>
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
                    <Input placeholder="••••••••" {...field} type="password" disabled={authIsLoading || isSubmitting}/>
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
            <Button type="submit" className="w-full" disabled={authIsLoading || isSubmitting}>
              {(authIsLoading || isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrati
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
