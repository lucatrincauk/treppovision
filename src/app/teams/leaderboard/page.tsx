
import { getTeams } from "@/lib/team-service";
import { getNations } from "@/lib/nation-service";
import type { Team, Nation } from "@/types";
import { TeamsSubNavigation } from "@/components/teams/teams-sub-navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, UserCircle, BarChartBig, Info, BadgeCheck, Flag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const dynamic = 'force-dynamic'; 

const getPointsForRank = (rank?: number): number => {
  if (rank === undefined || rank === null || rank === 0) return 0;
  switch (rank) {
    case 1: return 50;
    case 2: return 35;
    case 3: return 25;
    case 4: return 15;
    case 5: return 10;
  }
  if (rank >= 6 && rank <= 14) {
    return 10 - (rank - 5); 
  }
  if (rank === 15) return 0;
  if (rank >= 16 && rank <= 25) {
    return 0 - (rank - 15); 
  }
  if (rank === 26) return 25;

  return 0; 
};

interface NationScoreDetail {
  id: string;
  name: string;
  countryCode: string;
  actualRank?: number;
  points: number;
  type: 'founder'; // Only founder type remains
}

interface TeamWithScore extends Team {
  score: number;
  rank?: number;
  nationScoreDetails: NationScoreDetail[];
}

export default async function TeamsLeaderboardPage() {
  const allTeams = await getTeams();
  const allNations = await getNations();

  const nationsMap = new Map(allNations.map(nation => [nation.id, nation]));

  let teamsWithScores: TeamWithScore[] = allTeams.map(team => {
    let score = 0;
    const nationDetails: NationScoreDetail[] = [];

    const processNation = (nationId?: string): NationScoreDetail | null => {
      if (!nationId) return null;
      const nation = nationsMap.get(nationId);
      if (nation) {
        const points = getPointsForRank(nation.ranking);
        score += points;
        return {
          id: nation.id,
          name: nation.name,
          countryCode: nation.countryCode,
          actualRank: nation.ranking,
          points,
          type: 'founder'
        };
      }
      return null;
    };

    (team.founderChoices || []).forEach(nationId => {
      const detail = processNation(nationId);
      if (detail) nationDetails.push(detail);
    });

    return { ...team, score, nationScoreDetails: nationDetails };
  });

  teamsWithScores.sort((a, b) => {
    if (b.score === a.score) {
      return a.name.localeCompare(b.name);
    }
    return b.score - a.score;
  });

  let currentRank = 1;
  for (let i = 0; i < teamsWithScores.length; i++) {
    if (i > 0 && teamsWithScores[i].score < teamsWithScores[i-1].score) {
      currentRank = i + 1;
    }
    teamsWithScores[i].rank = currentRank;
  }

  const NationDetailDisplay = ({ detail }: { detail: NationScoreDetail }) => {
    const Icon = BadgeCheck; // All are now 'founder' type
    return (
      <div className="flex items-center gap-1.5 py-0.5">
        <Icon className="w-3.5 h-3.5 text-muted-foreground/80 flex-shrink-0" />
        <Image
          src={`https://flagcdn.com/w20/${detail.countryCode.toLowerCase()}.png`}
          alt={detail.name}
          width={15} 
          height={10}
          className="rounded-sm border border-border/30 object-contain flex-shrink-0"
          data-ai-hint={`${detail.name} flag`}
        />
        <Link href={`/nations/${detail.id}`} className="text-xs hover:underline hover:text-primary truncate" title={`${detail.name} (Classifica: ${detail.actualRank ?? 'N/D'}) - ${detail.points}pt`}>
          <span className="font-medium">{detail.name.substring(0,15)+(detail.name.length > 15 ? '...' : '')}</span>
          <span className="text-muted-foreground"> ({detail.actualRank ? `${detail.actualRank}°` : 'N/D'})</span>: {detail.points}pt
        </Link>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <TeamsSubNavigation />
      <header className="text-center sm:text-left space-y-2 mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary flex items-center">
          <BarChartBig className="mr-3 h-10 w-10" />
          Classifica Squadre
        </h1>
        <p className="text-xl text-muted-foreground">
          Punteggi delle squadre basati sulla classifica delle nazioni scelte.
        </p>
      </header>

      {teamsWithScores.length === 0 ? (
        <div className="text-center text-muted-foreground py-10">
          <Trophy className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-lg">Nessuna squadra trovata o nessun punteggio calcolabile.</p>
          <p>Assicurati che le squadre siano state create e che le nazioni abbiano un ranking.</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] text-center">Pos.</TableHead>
                  <TableHead>Squadra</TableHead>
                  <TableHead className="hidden md:table-cell">Creatore</TableHead>
                  <TableHead className="text-right">Punteggio Totale</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamsWithScores.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium text-center align-top">{team.rank}</TableCell>
                    <TableCell className="align-top">
                        <div className="font-medium truncate mb-1">{team.name}</div>
                        <div className="space-y-0.5 text-xs text-muted-foreground">
                            {team.nationScoreDetails.map(detail => (
                                <NationDetailDisplay key={detail.id + detail.type} detail={detail} />
                            ))}
                        </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell truncate align-top" title={team.creatorDisplayName}>
                      <div className="flex items-center gap-1.5 text-sm">
                        <UserCircle className="w-4 h-4 text-muted-foreground" />
                        {team.creatorDisplayName}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-lg text-primary align-top">{team.score}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      <Card className="mt-8 border-primary/20 bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-primary">Come Funziona il Punteggio?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Ogni squadra sceglie 3 nazioni per la "Prima Squadra".
                  Il punteggio totale della squadra è la somma dei punti ottenuti da ciascuna di queste 3 nazioni in base alla loro classifica finale nell'Eurovision.
                  Il sistema di punti per classifica è: 1°: 50pt, 2°: 35pt, 3°: 25pt, 4°: 15pt, 5°: 10pt, 6°-14°: da 9 a 1pt, 15°: 0pt, 16°-25°: da -1pt a -10pt, 26°: 25pt.
                  Le nazioni senza ranking o con ranking 0 non contribuiscono (0 punti).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
