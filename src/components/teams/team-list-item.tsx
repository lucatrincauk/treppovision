
import type { Team, Nation } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Flag, CalendarDays, BadgeCheck, CircleUserRound } from "lucide-react";
import Image from "next/image";

interface TeamListItemProps {
  team: Team;
  nations: Nation[];
}

const getNationDetailsById = (id: string, nations: Nation[]): Nation | undefined => {
  return nations.find(n => n.id === id);
};

export function TeamListItem({ team, nations }: TeamListItemProps) {
  const founderNation = getNationDetailsById(team.founderNationId, nations);
  const day1Nation = getNationDetailsById(team.day1NationId, nations);
  const day2Nation = getNationDetailsById(team.day2NationId, nations);

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

  const renderNationSelection = (nation: Nation | undefined, categoryTitle: string, IconComponent: React.ElementType) => {
    return (
      <div>
        <h4 className="font-semibold text-secondary flex items-center mb-1">
          <IconComponent className="h-4 w-4 mr-1.5 text-secondary" />
          {categoryTitle}:
        </h4>
        {nation ? (
          <div className="pl-6 flex items-center gap-2">
            <Image 
              src={`https://flagcdn.com/w40/${nation.countryCode.toLowerCase()}.png`} 
              alt={`Bandiera ${nation.name}`} 
              width={30} // Small width for inline display
              height={20} // Corresponding height (3:2 ratio approx for w40)
              className="rounded-sm border border-border/50"
              data-ai-hint={`${nation.name} flag`}
            />
            <span className="text-foreground/90">{nation.name}</span>
          </div>
        ) : (
          <p className="pl-6 text-muted-foreground">Nazione Sconosciuta</p>
        )}
      </div>
    );
  };

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
      <CardContent className="flex-grow space-y-4 text-sm pt-4"> {/* Added pt-4 for spacing after header */}
        {renderNationSelection(founderNation, "Scelta Fondatori", BadgeCheck)}
        {renderNationSelection(day1Nation, "Scelta Giorno 1", Flag)}
        {renderNationSelection(day2Nation, "Scelta Giorno 2", Flag)}
      </CardContent>
      {/* CardFooter with Team ID has been removed */}
    </Card>
  );
}

