
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
import type { LoginFormData } from "@/types";
import { Loader2, KeyRound } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email({ message: "Inserisci un indirizzo email valido." }),
  password: z.string().min(1, { message: "La password è richiesta." }),
});

const resetPasswordEmailSchema = z.object({
  resetEmail: z.string().email({ message: "Inserisci un indirizzo email valido per il reset." }),
});

interface LoginFormProps {
  onSuccess: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { loginWithEmail, sendPasswordReset, isLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmittingLogin, setIsSubmittingLogin] = React.useState(false);
  const [isSubmittingReset, setIsSubmittingReset] = React.useState(false);
  const [resetEmail, setResetEmail] = React.useState("");
  const [isResetDialogOpen, setIsResetDialogOpen] = React.useState(false);


  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmitLogin(values: LoginFormData) {
    setIsSubmittingLogin(true);
    const success = await loginWithEmail(values);
    if (success) {
      onSuccess();
    }
    setIsSubmittingLogin(false);
  }

  const handlePasswordResetRequest = async () => {
    if (!resetEmail) {
      toast({
        title: "Email Richiesta",
        description: "Inserisci un indirizzo email.",
        variant: "destructive",
      });
      return;
    }
    const validation = resetPasswordEmailSchema.safeParse({ resetEmail });
    if (!validation.success) {
       toast({
        title: "Email Non Valida",
        description: validation.error.errors[0]?.message || "Inserisci un indirizzo email valido.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingReset(true);
    const success = await sendPasswordReset(resetEmail);
    if (success) {
      setIsResetDialogOpen(false);
      setResetEmail(""); // Clear email after successful send
    }
    setIsSubmittingReset(false);
  };

  return (
    <Card className="border-none shadow-none">
      <CardHeader>
        <CardTitle>Accedi al tuo Account</CardTitle>
        <CardDescription>Inserisci le tue credenziali per continuare.</CardDescription>
      </CardHeader>
      <Form {...loginForm}>
        <form onSubmit={loginForm.handleSubmit(onSubmitLogin)}>
          <CardContent className="space-y-4">
            <FormField
              control={loginForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="tuamail@esempio.com" {...field} type="email" disabled={isLoading || isSubmittingLogin} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={loginForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input placeholder="••••••••" {...field} type="password" disabled={isLoading || isSubmittingLogin} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="text-right">
              <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="link" type="button" className="px-0 text-sm h-auto py-0 text-primary hover:text-primary/80">
                    Password dimenticata?
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reimposta Password</AlertDialogTitle>
                    <AlertDialogDescription>
                      Inserisci il tuo indirizzo email. Ti invieremo un link per reimpostare la tua password.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="resetEmail" className="text-right">
                        Email
                      </Label>
                      <Input
                        id="resetEmail"
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="col-span-3"
                        placeholder="tuamail@esempio.com"
                        disabled={isSubmittingReset}
                      />
                    </div>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isSubmittingReset} onClick={() => setResetEmail("")}>Annulla</AlertDialogCancel>
                    <AlertDialogAction onClick={handlePasswordResetRequest} disabled={isSubmittingReset || !resetEmail}>
                      {isSubmittingReset ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                      Invia Email di Reset
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading || isSubmittingLogin}>
              {(isLoading || isSubmittingLogin) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Accedi
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
