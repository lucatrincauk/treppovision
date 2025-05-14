
import { NationForm } from "@/components/admin/nation-form";
import { AdminNationControls } from "@/components/admin/admin-nation-controls";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function NewNationPage() {
  return (
    <AdminNationControls nationId={null}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/nations" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Torna all'Elenco Nazioni
          </Link>
        </div>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Aggiungi Nuova Nazione</CardTitle>
            <CardDescription>
              Compila i dettagli della nuova nazione partecipante. L'ID Nazione dovrebbe essere il codice paese di due lettere (es. 'it' per Italia).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NationForm />
          </CardContent>
        </Card>
      </div>
    </AdminNationControls>
  );
}
