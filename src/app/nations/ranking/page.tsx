
import { getNations } from "@/lib/nation-service";
import type { Nation } from "@/types";
import { NationsSubNavigation } from "@/components/nations/nations-sub-navigation";
import { ListChecks, Award, Users, Flag } from "lucide-react"; // Added Users, Flag
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RankedNation extends Nation {
  isTied?: boolean;
  displayRank?: number; // For specific ranking types like jury/televote
}

const MedalIcon = React.memo(({ rank, isTied }: { rank?: number, isTied?: boolean }) => {
  if (rank === undefined || rank === null || rank === 0 || rank > 3) return null;
  let colorClass = "";
  if (rank === 1) colorClass = "text-yellow-400";
  else if (rank === 2) colorClass = "text-slate-400";
  else if (rank === 3) colorClass = "text-amber-500";
  return <Award className={cn("w-4 h-4 inline-block mr-1", colorClass)} />;
});
MedalIcon.displayName = 'MedalIcon';

const rankTextColorClass = (rank?: number) => {
  if (rank === undefined || rank === null || rank === 0 || rank > 3) return "text-muted-foreground";
  if (rank === 1) return "text-yellow-400";
  if (rank === 2) return "text-slate-400";
  if (rank === 3) return "text-amber-500";
  return "text-muted-foreground";
};

function processRankings(nations: Nation[], rankField: 'ranking' | 'juryRank' | 'televoteRank'): RankedNation[] {
  let ranked = nations
    .filter(nation => nation[rankField] && (nation[rankField] as number) > 0)
    .map(nation => ({...nation, displayRank: nation[rankField] as number}))
    .sort((a, b) => (a.displayRank || Infinity) - (b.displayRank || Infinity));

  if (ranked.length > 0) {
    return ranked.map((nation, index, arr) => {
      let isTiedValue = false;
      if (index > 0 && nation.displayRank === arr[index - 1].displayRank) {
        isTiedValue = true;
      }
      if (index < arr.length - 1 && nation.displayRank === arr[index + 1].displayRank) {
        isTiedValue = true;
      }
      return { ...nation, isTied: isTiedValue };
    });
  }
  return [];
}

function getTop3(rankedNations: RankedNation[]): RankedNation[] {
  if (rankedNations.length === 0) return [];
  const distinctRanks = Array.from(new Set(rankedNations.map(n => n.displayRank))).sort((a,b) => (a || Infinity) - (b || Infinity));
  if (distinctRanks.length === 0) return [];
  
  const thirdDistinctRankValue = distinctRanks.length > 2 ? distinctRanks[2] : distinctRanks[distinctRanks.length - 1];
  return rankedNations.filter(n => n.displayRank !== undefined && n.displayRank !== null && n.displayRank <= (thirdDistinctRankValue || 0) );
}


const RankingTable = ({ nations, title, rankField }: { nations: RankedNation[], title: string, rankField: 'ranking' | 'juryRank' | 'televoteRank' }) => {
  if (nations.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10">
        <ListChecks className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-lg">Nessuna nazione con ranking specificato per {title}.</p>
      </div>
    );
  }
  return (
    <section className="mt-6">
      <Card>
        <CardContent className="p-0">
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
              {nations.map((nation) => (
                <TableRow key={nation.id}>
                  <TableCell className="font-medium text-center align-middle">
                    <div className="flex items-center justify-center">
                      <MedalIcon rank={nation.displayRank} />
                      <span className={cn(
                        nation.displayRank && [1,2,3].includes(nation.displayRank) && 
                        (rankTextColorClass(nation.displayRank)),
                        "font-semibold"
                      )}>
                        {nation.displayRank}{nation.isTied && "*"}
                      </span>
                    </div>
                  </TableCell>
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
  );
};


export default async function NationsRankingPage() {
  const allNations = await getNations();
  
  const finalRankings = processRankings(allNations, 'ranking');
  const juryRankingsFull = processRankings(allNations, 'juryRank');
  const televoteRankingsFull = processRankings(allNations, 'televoteRank');

  const top3Jury = getTop3(juryRankingsFull);
  const top3Televote = getTop3(televoteRankingsFull);

  return (
    <div className="space-y-8">
      <NationsSubNavigation />
      <header className="text-center sm:text-left space-y-2 mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary flex items-center">
          <Award className="mr-3 h-10 w-10" />
          Classifiche
        </h1>
        <p className="text-xl text-muted-foreground">
          Le nazioni partecipanti a TreppoVision, ordinate in base alla loro posizione.
        </p>
      </header>
      
      <Tabs defaultValue="finale">
        <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto">
          <TabsTrigger value="finale"><Award className="mr-2 h-4 w-4"/>Classifica Finale</TabsTrigger>
          <TabsTrigger value="giuria"><Users className="mr-2 h-4 w-4"/>Top 3 Giuria</TabsTrigger>
          <TabsTrigger value="televoto"><Flag className="mr-2 h-4 w-4"/>Top 3 Televoto</TabsTrigger>
        </TabsList>

        <TabsContent value="finale">
           <RankingTable nations={finalRankings} title="Classifica Finale" rankField="ranking" />
        </TabsContent>
        <TabsContent value="giuria">
          <RankingTable nations={top3Jury} title="Top 3 Giuria" rankField="juryRank" />
        </TabsContent>
        <TabsContent value="televoto">
           <RankingTable nations={top3Televote} title="Top 3 Televoto" rankField="televoteRank" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

