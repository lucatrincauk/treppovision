
import { getNations } from "@/lib/nation-service";
import type { Nation } from "@/types";
import { NationList } from "@/components/nations/nation-list";
import { NationsSubNavigation } from "@/components/nations/nations-sub-navigation";
import { ListChecks, Award } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

export default async function NationsRankingPage() {
  const allNations = await getNations();
  const rankedNations = allNations
    .filter(nation => nation.ranking && nation.ranking > 0)
    .sort((a, b) => (a.ranking || Infinity) - (b.ranking || Infinity));

  const top3Nations = rankedNations.slice(0, 3);
  const otherRankedNations = rankedNations.slice(3);

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
        <>
          {top3Nations.length > 0 && (
            <NationList nations={top3Nations} title="Il Podio di TreppoVision" />
          )}

          {otherRankedNations.length > 0 && (
            <section className="mt-12">
              <h2 className="text-3xl font-bold tracking-tight mb-6 text-primary border-b-2 border-primary/30 pb-2">
                Classifica Completa (dal 4° posto)
              </h2>
              <Card>
                <CardContent className="p-0"> {/* Remove padding for table to fit edge to edge */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px] text-center">Pos.</TableHead>
                        <TableHead>Nazione</TableHead>
                        <TableHead className="hidden md:table-cell">Artista</TableHead>
                        <TableHead className="hidden sm:table-cell">Canzone</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {otherRankedNations.map((nation) => (
                        <TableRow key={nation.id}>
                          <TableCell className="font-medium text-center">{nation.ranking}</TableCell>
                          <TableCell>
                            <Link href={`/nations/${nation.id}`} className="flex items-center gap-3 group">
                              <Image
                                src={`https://flagcdn.com/w40/${nation.countryCode.toLowerCase()}.png`}
                                alt={`Bandiera ${nation.name}`}
                                width={30}
                                height={20}
                                className="rounded-sm border border-border/50 object-contain"
                                data-ai-hint={`${nation.name} flag`}
                              />
                              <span className="group-hover:underline group-hover:text-primary font-medium truncate">
                                {nation.name}
                              </span>
                            </Link>
                          </TableCell>
                          <TableCell className="hidden md:table-cell truncate" title={nation.artistName}>{nation.artistName}</TableCell>
                          <TableCell className="hidden sm:table-cell truncate" title={nation.songTitle}>{nation.songTitle}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </section>
          )}
        </>
      )}
    </div>
  );
}
