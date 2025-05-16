
import { getNations } from "@/lib/nation-service";
import { AdminNationControls } from "@/components/admin/admin-nation-controls";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, ListMusic } from "lucide-react";
import { NationsSubNavigation } from "@/components/nations/nations-sub-navigation";
import { NationsDisplayClient } from "@/components/nations/nations-display-client";

export default async function NationsPage() {
  const nations = await getNations();
  const listTitle = "Elenco Nazioni";

  return (
    <div className="space-y-8">
      <NationsSubNavigation />
      <div className="flex flex-col sm:flex-row justify-end items-center gap-4 mb-8">
        {/* Header removed */}
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
        <NationsDisplayClient initialNations={nations} listTitle={listTitle} />
      )}
    </div>
  );
}
