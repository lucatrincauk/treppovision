
import type { Team, Nation } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Flag, BadgeCheck, HelpCircle } from "lucide-react"; // Added HelpCircle for unknown
import Image from "next/image";

interface TeamListItemProps {
  team: Team;
  nations: Nation[];
}

const getNationDetailsById = (id: string, nations: Nation[]): Nation | undefined => {
  return nations.find(n => n.id === id);
};

const SelectedNationDisplay = ({ nation, IconComponent }: { nation?: Nation, IconComponent: React.ElementType }) => {
  if (!nation) {
    return (
      <div className="flex items-center gap-2 py-1">
        <HelpCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <p className="text-sm text-muted-foreground">Nazione Sconosciuta</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-1">
      <IconComponent className="h-5 w-5 text-accent flex-shrink-0" />
      <Image
        src={`https://flagcdn.com/w40/${nation.countryCode.toLowerCase()}.png`}
        alt={`Bandiera ${nation.name}`}
        width={32} // Slightly smaller for a more compact list
        height={21} // Approximate 3:2 ratio for w40
        className="rounded-sm border border-border/50 object-contain flex-shrink-0"
        data-ai-hint={`${nation.name} flag`}
      />
      <span className="text-sm text-foreground/90 truncate" title={nation.name}>{nation.name}</span>
    </div>
  );
};

export function TeamListItem({ team, nations }: TeamListItemProps) {
  const founderNation = getNationDetailsById(team.founderNationId, nations);
  const day1Nation = getNationDetailsById(team.day1NationId, nations);
  const day2Nation = getNationDetailsById(team.day2NationId, nations);

  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
      <CardHeader className="pb-4"> {/* Adjusted padding */}
        <CardTitle className="text-xl text-primary flex items-center gap-2"> {/* Slightly smaller title */}
          <Users className="h-5 w-5 text-accent" />
          {team.name}
        </CardTitle>
        {/* Removed CardDescription with "Creato da" and date */}
      </CardHeader>
      <CardContent className="flex-grow space-y-2 pt-0"> {/* Adjusted spacing and pt */}
        <SelectedNationDisplay nation={founderNation} IconComponent={BadgeCheck} />
        <SelectedNationDisplay nation={day1Nation} IconComponent={Flag} />
        <SelectedNationDisplay nation={day2Nation} IconComponent={Flag} />
      </CardContent>
    </Card>
  );
}
