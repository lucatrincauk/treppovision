
import type { Team, Nation, NationGlobalCategorizedScores } from "@/types";
import { TeamListItem } from "./team-list-item";

interface TeamListProps {
  teams: Team[];
  nations: Nation[];
  nationGlobalCategorizedScoresMap: Map<string, NationGlobalCategorizedScores>;
}

export function TeamList({ teams, nations, nationGlobalCategorizedScoresMap }: TeamListProps) {
  if (teams.length === 0) {
    return <p className="text-muted-foreground text-center py-10">Nessuna squadra trovata.</p>;
  }
  if (nations.length === 0) {
     return <p className="text-muted-foreground text-center py-10">Dati delle nazioni non disponibili per visualizzare le squadre.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {teams.map((team) => (
        <TeamListItem 
          key={team.id} 
          team={team} 
          nations={nations} 
          nationGlobalCategorizedScoresMap={nationGlobalCategorizedScoresMap}
        />
      ))}
    </div>
  );
}
