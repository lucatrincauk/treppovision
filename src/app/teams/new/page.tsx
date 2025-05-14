
import { CreateTeamForm } from "@/components/teams/create-team-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function NewTeamPage() {
  return (
    <div className="space-y-6">
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-primary">
            <Users className="mr-2 h-6 w-6" />
            Crea la Tua Squadra TreppoVision
          </CardTitle>
          <CardDescription>
            Scegli un nome per la tua squadra e seleziona una nazione partecipante per ogni categoria.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateTeamForm />
        </CardContent>
      </Card>
    </div>
  );
}
