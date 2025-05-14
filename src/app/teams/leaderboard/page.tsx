
import { getTeams } from "@/lib/team-service";
import { getNations } from "@/lib/nation-service";
import type { Team, Nation } from "@/types";
import { TeamsSubNavigation } from "@/components/teams/teams-sub-navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card"; // Removed CardHeader, CardTitle as they are not used directly here
import { Trophy, UserCircle, BarChartBig, Info } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const getPointsForRank = (rank?: number): number => {
  if (rank === undefined || rank === null || rank === 0) return 0;
  switch (rank) {
    case 1: return 50;
    case 2: return 35;
    case 3: return 25;
    case 4: return 15;
    case 5: return 10;
    case 6: return 9;
    case 7: return 8;
    case 8: return 7;
    case 9: return 6;
    case 10: return 5;
    case 11: return 4;
    case 12: return 3;
    case 13: return 2;
    case 14: return 1;
    case 15: return 0;
    case 16: return -1;
    case 17: return -2;
    case 18: return -3;
    case 19: return -4;
    case 20: return -5;
    case 21: return -6;
    case 22: return -7;
    case 23: return -8;
    case 24: return -9;
    case 25: return -10;
    case 26: return 25; 
    default: return 0; 
  }
};

interface NationScoreDetail {
  id: string;
  name: string;
  countryCode: string;
  actualRank?: number; 
  points: number;     
}

interface TeamWithScore extends Team {
  score: number;
  rank?: number; // Assigned rank in the leaderboard
  nationScoreDetails: {
    founder: NationScoreDetail | null;
    day1: NationScoreDetail | null;
    day2: NationScoreDetail | null;
  };
}

export default async function TeamsLeaderboardPage() {
  const allTeams = await getTeams();
  const allNations = await getNations();

  const nationsMap = new Map(allNations.map(nation => [nation.id, nation]));

  let teamsWithScores: TeamWithScore[] = allTeams.map(team => {
    let score = 0;
    const nationDetails: TeamWithScore['nationScoreDetails'] = {
      founder: null,
      day1: null,
      day2: null,
    };

    const processNation = (nationId: string, category: 'founder' | 'day1' | 'day2'): NationScoreDetail | null => {
      const nation = nationsMap.get(nationId);
      if (nation) {
        const points = getPointsForRank(nation.ranking);
        score += points;
        return { 
          id: nation.id, 
          name: nation.name, 
          countryCode: nation.countryCode, 
          actualRank: nation.ranking, 
          points 
        };
      }
      return null;
    };

    nationDetails.founder = processNation(team.founderNationId, 'founder');
    nationDetails.day1 = processNation(team.day1NationId, 'day1');
    nationDetails.day2 = processNation(team.day2NationId, 'day2');
    
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

  const NationDetailDisplay = ({ detail }: { detail: NationScoreDetail | null }) => {
    if (!detail) return <div className="text-xs text-muted-foreground">Nazione non trovata</div>;
    return (
      <div className="flex items-center gap-1.5 py-0.5">
        <Image
          src={`https://flagcdn.com/w20/${detail.countryCode.toLowerCase()}.png`}
          alt={detail.name}
          width={20}
          height={13}
          className="rounded-sm border border-border/30 object-contain"
          data-ai-hint={`${detail.name} flag`}
        />
        <Link href={`/nations/${detail.id}`} className="text-xs hover:underline hover:text-primary truncate" title={`${detail.name} (Pos: ${detail.actualRank ?? 'N/D'}) - ${detail.points}pt`}>
          <span className="font-medium">{detail.name}</span>
          <span className="text-muted-foreground"> (Pos: {detail.actualRank ?? 'N/D'})</span>: {detail.points}pt
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
                  <TableHead className="hidden lg:table-cell min-w-[250px]">Dettaglio Punteggio</TableHead>
                  <TableHead className="text-right">Punteggio Totale</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamsWithScores.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium text-center">{team.rank}</TableCell>
                    <TableCell>
                        <span className="font-medium truncate"> {/* Removed Link here, as details are shown */}
                            {team.name}
                        </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell truncate" title={team.creatorDisplayName}>
                      <div className="flex items-center gap-1.5 text-sm">
                        <UserCircle className="w-4 h-4 text-muted-foreground" />
                        {team.creatorDisplayName}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="space-y-0.5">
                        <NationDetailDisplay detail={team.nationScoreDetails.founder} />
                        <NationDetailDisplay detail={team.nationScoreDetails.day1} />
                        <NationDetailDisplay detail={team.nationScoreDetails.day2} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-lg text-primary">{team.score}</TableCell>
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
                  Ogni squadra sceglie 3 nazioni (una per categoria: Fondatrici, Prima Semifinale, Seconda Semifinale).
                  Il punteggio totale della squadra è la somma dei punti ottenuti da ciascuna di queste 3 nazioni in base alla loro classifica finale nell'Eurovision.
                  Il sistema di punti per classifica è: 1°: 50pt, 2°: 35pt, 3°: 25pt, 4°: 15pt, 5°: 10pt, 6°-10°: 9-5pt, 11°-14°: 4-1pt, 15°: 0pt, 16°-25°: da -1pt a -10pt, 26°: 25pt.
                  Le nazioni senza ranking o con ranking 0 non contribuiscono (0 punti).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
