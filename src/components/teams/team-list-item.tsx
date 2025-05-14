
import type { Team, Nation } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Users, Flag, CalendarDays, ShieldQuestion, BadgeCheck, CircleUserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TeamListItemProps {
  team: Team;
  nations: Nation[];
}

const getNationNameById = (id: string, nations: Nation[]): string => {
  const nation = nations.find(n => n.id === id);
  return nation ? nation.name : "Nazione Sconosciuta";
};

export function TeamListItem({ team, nations }: TeamListItemProps) {
  const founderNationName = getNationNameById(team.founderNationId, nations);
  const day1NationName = getNationNameById(team.day1NationId, nations);
  const day2NationName = getNationNameById(team.day2NationId, nations);

  // Attempt to format the date, handle potential issues
  let formattedDate = "Data non disponibile";
  if (team.createdAt && typeof team.createdAt.seconds === 'number') {
    try {
      formattedDate = new Date(team.createdAt.seconds * 1000).toLocaleDateString('it-IT', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch (e) {
      console.error("Error formatting date for team:", team.id, e);
    }
  }


  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="text-2xl text-primary flex items-center gap-2">
          <Users className="h-6 w-6 text-accent" /> 
          {team.name}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
            <CircleUserRound className="h-3 w-3"/> Creato da: {team.userId.substring(0,8)}... 
            <span className="mx-1">|</span>
            <CalendarDays className="h-3 w-3" /> {formattedDate}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-3 text-sm">
        <div>
          <h4 className="font-semibold text-secondary flex items-center mb-1">
            <BadgeCheck className="h-4 w-4 mr-1.5 text-secondary" />
            Scelta Fondatori:
          </h4>
          <p className="pl-6 text-foreground/90">{founderNationName}</p>
        </div>
        <div>
          <h4 className="font-semibold text-secondary flex items-center mb-1">
             <Flag className="h-4 w-4 mr-1.5 text-secondary" />
            Scelta Giorno 1:
          </h4>
          <p className="pl-6 text-foreground/90">{day1NationName}</p>
        </div>
        <div>
          <h4 className="font-semibold text-secondary flex items-center mb-1">
             <Flag className="h-4 w-4 mr-1.5 text-secondary" />
            Scelta Giorno 2:
          </h4>
          <p className="pl-6 text-foreground/90">{day2NationName}</p>
        </div>
      </CardContent>
       <CardFooter>
        <Badge variant="outline">ID Team: {team.id.substring(0,10)}...</Badge>
      </CardFooter>
    </Card>
  );
}
