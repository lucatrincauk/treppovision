
import { getTeams } from "@/lib/team-service";
import { getNations } from "@/lib/nation-service";
import type { Team, Nation } from "@/types";
import { TeamsSubNavigation } from "@/components/teams/teams-sub-navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, UserCircle, BarChartBig } from "lucide-react"; // Changed to BarChartBig
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
    case 26: return 25; // As specified
    default: return 0; // For ranks outside the defined range
  }
};

interface TeamWithScore extends Team {
  score: number;
  rank?: number;
}

export default async function TeamsLeaderboardPage() {
  const allTeams = await getTeams();
  const allNations = await getNations();

  const nationsMap = new Map(allNations.map(nation => [nation.id, nation]));

  let teamsWithScores: TeamWithScore[] = allTeams.map(team => {
    let score = 0;
    const nation1 = nationsMap.get(team.founderNationId);
    const nation2 = nationsMap.get(team.day1NationId);
    const nation3 = nationsMap.get(team.day2NationId);

    if (nation1) score += getPointsForRank(nation1.ranking);
    if (nation2) score += getPointsForRank(nation2.ranking);
    if (nation3) score += getPointsForRank(nation3.ranking);
    
    return { ...team, score };
  });

  // Sort teams by score in descending order, then by name alphabetically for ties
  teamsWithScores.sort((a, b) => {
    if (b.score === a.score) {
      return a.name.localeCompare(b.name);
    }
    return b.score - a.score;
  });

  // Assign ranks
  let currentRank = 1;
  for (let i = 0; i < teamsWithScores.length; i++) {
    if (i > 0 && teamsWithScores[i].score < teamsWithScores[i-1].score) {
      currentRank = i + 1;
    }
    teamsWithScores[i].rank = currentRank;
  }


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
                  <TableHead className="w-[80px] text-center">Pos.</TableHead>
                  <TableHead>Squadra</TableHead>
                  <TableHead className="hidden sm:table-cell">Creatore</TableHead>
                  <TableHead className="text-right">Punteggio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamsWithScores.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium text-center">{team.rank}</TableCell>
                    <TableCell>
                        <span className="font-medium truncate hover:underline">
                            {team.name}
                        </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell truncate" title={team.creatorDisplayName}>
                      <div className="flex items-center gap-1.5">
                        <UserCircle className="w-4 h-4 text-muted-foreground" />
                        {team.creatorDisplayName}
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
    </div>
  );
}

