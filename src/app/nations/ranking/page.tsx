
import { getNations } from "@/lib/nation-service";
import type { Nation } from "@/types";
import { NationList } from "@/components/nations/nation-list";
import { NationsSubNavigation } from "@/components/nations/nations-sub-navigation";
import { ListChecks, Award } from "lucide-react";

export default async function NationsRankingPage() {
  const allNations = await getNations();
  const rankedNations = allNations
    .filter(nation => nation.ranking && nation.ranking > 0)
    .sort((a, b) => (a.ranking || Infinity) - (b.ranking || Infinity));

  return (
    <div className="space-y-8">
      <NationsSubNavigation />
      <header className="text-center sm:text-left space-y-2 mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary flex items-center">
          <Award className="mr-3 h-10 w-10" />
          Classifica Finale
        </h1>
        <p className="text-xl text-muted-foreground">
          Le nazioni partecipanti a TreppoVision, ordinate in base alla loro posizione in classifica finale.
        </p>
      </header>
      
      {rankedNations.length === 0 ? (
        <div className="text-center text-muted-foreground py-10">
          <ListChecks className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-lg">Nessuna nazione con ranking specificato trovata.</p>
          <p>Il ranking può essere impostato dalla sezione admin per ciascuna nazione.</p>
        </div>
      ) : (
        <NationList nations={rankedNations} title="Classifica Finale (basata sul Ranking)" />
      )}
    </div>
  );
}
