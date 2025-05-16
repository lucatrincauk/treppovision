
import type { Team, Nation, NationGlobalCategorizedScores, GlobalCategoryPickDetail, GlobalPrimaSquadraDetail, TeamWithScore } from "@/types";
import { TeamListItem } from "./team-list-item";

interface TeamListProps {
  teams: (TeamWithScore & { 
    primaSquadraDetails?: GlobalPrimaSquadraDetail[]; 
    categoryPicksDetails?: GlobalCategoryPickDetail[];
    isTied?: boolean; 
  })[];
  allNations: Nation[];
  nationGlobalCategorizedScoresArray: [string, NationGlobalCategorizedScores][];
  disableListItemEdit?: boolean;
  isLeaderboardPodiumDisplay?: boolean; 
}

export function TeamList({ 
  teams, 
  allNations, 
  nationGlobalCategorizedScoresArray, 
  disableListItemEdit = false,
  isLeaderboardPodiumDisplay = false 
}: TeamListProps) {
  if (teams.length === 0) {
    return <p className="text-muted-foreground text-center py-10">Nessuna squadra trovata.</p>;
  }
  if (allNations.length === 0) {
     return <p className="text-muted-foreground text-center py-10">Dati delle nazioni non disponibili per visualizzare le squadre.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {teams.map((team) => (
        <TeamListItem 
          key={team.id} 
          team={team} 
          allNations={allNations} 
          nationGlobalCategorizedScoresArray={nationGlobalCategorizedScoresArray} 
          disableEdit={disableListItemEdit} 
          isLeaderboardPodiumDisplay={isLeaderboardPodiumDisplay} 
        />
      ))}
    </div>
  );
}
