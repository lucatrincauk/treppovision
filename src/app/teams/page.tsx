
import { getTeams } from "@/lib/team-service";
import { getNations } from "@/lib/nation-service";
import { TeamList } from "@/components/teams/team-list";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AuthProviderClientComponent } from "@/components/auth/auth-provider-client-component";


export default async function TeamsPage() {
  const teams = await getTeams();
  const nations = await getNations();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <header className="text-center sm:text-left space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary flex items-center">
            <Users className="mr-3 h-10 w-10" />
            Squadre TreppoVision
          </h1>
          <p className="text-xl text-muted-foreground">
            Scopri tutte le squadre create dagli utenti e le loro scelte.
          </p>
        </header>
        <AuthProviderClientComponent>
          {(user) => user ? (
            <Button asChild variant="outline" size="lg">
              <Link href="/teams/new">
                <PlusCircle className="mr-2 h-5 w-5" />
                Crea Nuova Squadra
              </Link>
            </Button>
          ) : null}
        </AuthProviderClientComponent>
      </div>

      {teams.length === 0 && nations.length > 0 && (
         <Alert>
          <Users className="h-4 w-4" />
          <AlertTitle>Nessuna Squadra Ancora!</AlertTitle>
          <AlertDescription>
            Non ci sono ancora squadre. Sii il primo a crearne una!
          </AlertDescription>
        </Alert>
      )}
      
      {nations.length === 0 && (
         <Alert variant="destructive">
          <Users className="h-4 w-4" />
          <AlertTitle>Dati Nazioni Mancanti</AlertTitle>
          <AlertDescription>
            Impossibile caricare i dati delle nazioni. Le squadre non possono essere visualizzate correttamente senza questi dati. Controlla la configurazione di Firestore.
          </AlertDescription>
        </Alert>
      )}

      {teams.length > 0 && nations.length > 0 ? (
        <TeamList teams={teams} nations={nations} />
      ) : teams.length > 0 && nations.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">Caricamento squadre... i dati delle nazioni sono necessari per visualizzarle.</p>
      ) : null}
    </div>
  );
}
