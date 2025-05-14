
import { getNations } from "@/lib/nation-service";
import type { Nation } from "@/types";
import { NationList } from "@/components/nations/nation-list";
import { Separator } from "@/components/ui/separator";
import { AdminNationControls } from "@/components/admin/admin-nation-controls";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";


export default async function NationsPage() {
  const nations = await getNations();

  const founderNations = nations.filter(n => n.category === 'founders');
  const day1Nations = nations.filter(n => n.category === 'day1');
  const day2Nations = nations.filter(n => n.category === 'day2');

  return (
    <div className="space-y-8"> {/* Adjusted main vertical spacing */}
      {/* Header and Admin Action Button Container */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <header className="text-center sm:text-left space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary">
            Incontra le Nazioni
          </h1>
          <p className="text-xl text-muted-foreground">
            Esplora tutti i paesi partecipanti a TreppoVision.
          </p>
        </header>
        <AdminNationControls nationId={null}>
          <div className="flex-shrink-0">
              <Button asChild variant="outline" size="lg">
                  <Link href="/admin/nations/new">
                      <PlusCircle className="mr-2 h-5 w-5" />
                      Aggiungi Nuova Nazione
                  </Link>
              </Button>
          </div>
        </AdminNationControls>
      </div>
      
      {nations.length === 0 && (
        <p className="text-center text-muted-foreground py-10">Caricamento nazioni o nessuna nazione disponibile...</p>
      )}

      {nations.length > 0 && (
        <>
          <NationList nations={founderNations} title="Fondatori" />
          <Separator className="my-8 bg-border/50" />
          <NationList nations={day1Nations} title="Prima Semifinale" />
          <Separator className="my-8 bg-border/50" />
          <NationList nations={day2Nations} title="Seconda Semifinale" />
        </>
      )}
    </div>
  );
}

