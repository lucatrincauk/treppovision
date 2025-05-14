
import type { Team, Nation } from "@/types";
import { TeamListItem } from "./team-list-item";

interface TeamListProps {
  teams: Team[];
  nations: Nation[];
}

export function TeamList({ teams, nations }: TeamListProps) {
  if (teams.length === 0) {
    // This case should be handled by the parent page, but good to have a fallback.
    return <p className="text-muted-foreground text-center py-10">Nessuna squadra trovata.</p>;
  }
  if (nations.length === 0) {
     return <p className="text-muted-foreground text-center py-10">Dati delle nazioni non disponibili per visualizzare le squadre.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {teams.map((team) => (
        <TeamListItem key={team.id} team={team} nations={nations} />
      ))}
    </div>
  );
}
