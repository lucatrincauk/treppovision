
import type { Team, Nation, NationGlobalCategorizedScores, GlobalCategoryPickDetail, GlobalPrimaSquadraDetail } from "@/types";
import { TeamListItem } from "./team-list-item";

interface TeamListProps {
  teams: (Team & { 
    primaSquadraDetails?: GlobalPrimaSquadraDetail[]; 
    categoryPicksDetails?: GlobalCategoryPickDetail[];
  })[];
  allNations: Nation[];
  nationGlobalCategorizedScoresArray: [string, NationGlobalCategorizedScores][]; // Changed from Map to Array
  disableListItemEdit?: boolean;
}

export function TeamList({ teams, allNations, nationGlobalCategorizedScoresArray, disableListItemEdit = false }: TeamListProps) {
  if (teams.length === 0) {
    return <p className="text-muted-foreground text-center py-10">Nessuna squadra trovata.</p>;
  }
  if (allNations.length === 0) { // Changed prop name to allNations
     return <p className="text-muted-foreground text-center py-10">Dati delle nazioni non disponibili per visualizzare le squadre.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {teams.map((team) => (
        <TeamListItem 
          key={team.id} 
          team={team} 
          allNations={allNations} // Changed prop name to allNations
          nationGlobalCategorizedScoresArray={nationGlobalCategorizedScoresArray} // Pass array
          disableEdit={disableListItemEdit} 
        />
      ))}
    </div>
  );
}

