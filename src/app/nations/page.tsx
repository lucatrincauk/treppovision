
import { getNations } from "@/lib/nation-service";
import { AdminNationControls } from "@/components/admin/admin-nation-controls";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, ListMusic } from "lucide-react";
import { NationsSubNavigation } from "@/components/nations/nations-sub-navigation";
import { NationsDisplayClient } from "@/components/nations/nations-display-client";

export default async function NationsPage() {
  const nations = await getNations();
  // The listTitle prop is no longer used by NationsDisplayClient for the main title
  // const listTitle = "Elenco Nazioni";

  return (
    <div className="space-y-8">
      <NationsSubNavigation />
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <header className="text-center sm:text-left space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary flex items-center">
            <ListMusic className="mr-3 h-10 w-10" />
            Incontra le Nazioni
          </h1>
          <p className="text-xl text-muted-foreground">
            Esplora tutti i paesi partecipanti, i loro artisti e le loro canzoni.
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
        // Pass a prop that indicates this is the main list to show the sort order description
        <NationsDisplayClient initialNations={nations} showSortOrderDescription={true} />
      )}
    </div>
  );
}
