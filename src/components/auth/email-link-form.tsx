
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { EmailLinkFormData } from "@/types";
import { Loader2, Mail } from "lucide-react";

const emailLinkSchema = z.object({
  email: z.string().email({ message: "Inserisci un indirizzo email valido." }),
});

interface EmailLinkFormProps {
  onSuccess: () => void;
}

export function EmailLinkForm({ onSuccess }: EmailLinkFormProps) {
  const { sendLoginLink, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<EmailLinkFormData>({
    resolver: zodResolver(emailLinkSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: EmailLinkFormData) {
    setIsSubmitting(true);
    const success = await sendLoginLink(values.email);
    if (success) {
      // onSuccess will be called by AuthButton to close dialog
      // but we can keep the form in its current state showing email sent message
      form.reset(); 
      // No need to call onSuccess() here if we want the dialog to stay open
      // and show a message like "Check your email".
      // If dialog should close, then: onSuccess();
    }
    setIsSubmitting(false);
  }

  return (
    <Card className="border-none shadow-none">
      <CardHeader>
        <CardTitle>Accedi con Link Email</CardTitle>
        <CardDescription>Inserisci la tua email per ricevere un link di accesso.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="tuamail@esempio.com" {...field} type="email" disabled={authLoading || isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={authLoading || isSubmitting}>
              {(authLoading || isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Mail className="mr-2 h-4 w-4" />
              Invia Link di Accesso
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
