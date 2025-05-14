
import { nations } from "@/data/nations";
import type { Nation } from "@/types";
import { NationList } from "@/components/nations/nation-list";
import { Separator } from "@/components/ui/separator";

export default function NationsPage() {
  const founderNations = nations.filter(n => n.category === 'founders');
  const day1Nations = nations.filter(n => n.category === 'day1');
  const day2Nations = nations.filter(n => n.category === 'day2');

  return (
    <div className="space-y-12">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary">
          Incontra le Nazioni
        </h1>
        <p className="text-xl text-muted-foreground">
          Esplora tutti i paesi partecipanti a TreppoVision.
        </p>
      </header>
      
      <NationList nations={founderNations} title="Fondatori" />
      <Separator className="my-8 bg-border/50" />
      <NationList nations={day1Nations} title="Partecipanti Giorno 1" />
      <Separator className="my-8 bg-border/50" />
      <NationList nations={day2Nations} title="Partecipanti Giorno 2" />
    </div>
  );
}
