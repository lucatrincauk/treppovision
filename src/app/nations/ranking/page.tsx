
import { getNations } from "@/lib/nation-service";
import type { Nation } from "@/types";
import { NationsSubNavigation } from "@/components/nations/nations-sub-navigation";
import { ListChecks, Award } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import React from 'react';

interface RankedNation extends Nation {
  isTied?: boolean;
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

export default async function NationsRankingPage() {
  const allNations = await getNations();
  
  let nationsToDisplay: RankedNation[] = allNations
    .filter(nation => nation.ranking && nation.ranking > 0)
    .sort((a, b) => (a.ranking || Infinity) - (b.ranking || Infinity));

  // Add tie information
  if (nationsToDisplay.length > 0) {
    let currentRank = 1;
    const rankedNationsWithTies: RankedNation[] = nationsToDisplay.map((nation, index, arr) => {
        if (index > 0 && (arr[index].ranking ?? Infinity) > (arr[index - 1].ranking ?? Infinity)) {
            currentRank = index + 1; // This logic might need adjustment if ranks are not contiguous from Firestore
                                     // For now, we assume ranks are already correctly assigned and we just detect ties on those ranks
        }
        // Simplified tie detection based on shared rank value. Assumes ranks are pre-assigned.
        let isTiedValue = false;
        if (index > 0 && nation.ranking === arr[index - 1].ranking) {
            isTiedValue = true;
        }
        if (index < arr.length - 1 && nation.ranking === arr[index + 1].ranking) {
            isTiedValue = true;
        }
        return { ...nation, isTied: isTiedValue };
    });
    nationsToDisplay = rankedNationsWithTies;
  }


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
      
      {nationsToDisplay.length === 0 ? (
        <div className="text-center text-muted-foreground py-10">
          <ListChecks className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-lg">Nessuna nazione con ranking specificato trovata.</p>
          <p>Il ranking può essere impostato dalla sezione admin per ciascuna nazione.</p>
        </div>
      ) : (
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
                  {nationsToDisplay.map((nation) => (
                    <TableRow key={nation.id}>
                      <TableCell className="font-medium text-center align-middle">
                        <div className="flex items-center justify-center">
                          <MedalIcon rank={nation.ranking} />
                          <span className={cn(
                            nation.ranking && [1,2,3].includes(nation.ranking) && 
                            (nation.ranking === 1 ? "text-yellow-400" : nation.ranking === 2 ? "text-slate-400" : "text-amber-500"),
                            "font-semibold"
                          )}>
                            {nation.ranking}{nation.isTied && "*"}
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
      )}
    </div>
  );
}
