
import { getNations } from "@/lib/nation-service";
import { getAllNationsGlobalScores } from "@/lib/voting-service";
import type { Nation, NationWithTreppoScore } from "@/types";
import { NationList } from "@/components/nations/nation-list";
import { NationsSubNavigation } from "@/components/nations/nations-sub-navigation";
import { Users, BarChart3, Star } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

export const dynamic = 'force-dynamic'; // Ensure fresh data on each request

export default async function TreppoScoreRankingPage() {
  const allNations = await getNations();
  const globalScoresMap = await getAllNationsGlobalScores();

  const nationsWithScores: NationWithTreppoScore[] = allNations.map(nation => {
    const scoreData = globalScoresMap.get(nation.id);
    return {
      ...nation,
      globalTreppoScore: scoreData?.averageScore ?? null,
      globalVoteCount: scoreData?.voteCount ?? 0,
    };
  }).filter(n => n.globalTreppoScore !== null && n.globalVoteCount > 0) // Only include nations with votes
    .sort((a, b) => (b.globalTreppoScore ?? 0) - (a.globalTreppoScore ?? 0));

  const top3Nations = nationsWithScores.slice(0, 3);
  const otherRankedNations = nationsWithScores.slice(3);

  return (
    <div className="space-y-8">
      <NationsSubNavigation />
      <header className="text-center sm:text-left space-y-2 mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary flex items-center">
          <Users className="mr-3 h-10 w-10" />
          Classifica TreppoScore
        </h1>
        <p className="text-xl text-muted-foreground">
          Le nazioni partecipanti, ordinate in base al voto medio degli utenti (TreppoScore).
        </p>
      </header>
      
      {nationsWithScores.length === 0 ? (
        <div className="text-center text-muted-foreground py-10">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-lg">Nessun voto ancora registrato.</p>
          <p>Quando gli utenti voteranno, questa classifica si popolerà.</p>
        </div>
      ) : (
        <>
          {top3Nations.length > 0 && (
            <NationList
              nations={top3Nations.map((nation, index) => ({
                ...nation,
                ranking: index + 1, // Assign 1st, 2nd, 3rd for styling
              }))}
              title="Il Podio TreppoScore"
            />
          )}

          {otherRankedNations.length > 0 && (
            <section className="mt-12">
              <h2 className="text-3xl font-bold tracking-tight mb-6 text-primary border-b-2 border-primary/30 pb-2">
                Classifica Completa TreppoScore (dal 4° posto)
              </h2>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px] text-center">Pos.</TableHead>
                        <TableHead>Nazione</TableHead>
                        <TableHead className="text-right w-[150px]">TreppoScore</TableHead>
                        <TableHead className="text-right w-[120px]">N. Voti</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {otherRankedNations.map((nation, index) => (
                        <TableRow key={nation.id}>
                          <TableCell className="font-medium text-center">{index + 4}</TableCell>
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
                              <div>
                                <span className="group-hover:underline group-hover:text-primary font-medium truncate">
                                  {nation.name}
                                </span>
                                <p className="text-xs text-muted-foreground truncate hidden sm:block" title={`${nation.artistName} - ${nation.songTitle}`}>
                                  {nation.artistName} - {nation.songTitle}
                                </p>
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-accent">
                            <div className="flex items-center justify-end">
                              <Star className="w-4 h-4 mr-1 text-yellow-400"/>
                              {nation.globalTreppoScore?.toFixed(2) ?? 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">{nation.globalVoteCount}</TableCell>
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
