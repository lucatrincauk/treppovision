
import type { Team, Nation } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Flag, BadgeCheck, HelpCircle, UserCircle, Edit } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

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
        width={32}
        height={21}
        className="rounded-sm border border-border/50 object-contain flex-shrink-0"
        data-ai-hint={`${nation.name} flag`}
      />
      <span className="text-sm text-foreground/90 truncate" title={nation.name}>{nation.name}</span>
    </div>
  );
};

export function TeamListItem({ team, nations }: TeamListItemProps) {
  const { user } = useAuth();
  const founderNation = getNationDetailsById(team.founderNationId, nations);
  const day1Nation = getNationDetailsById(team.day1NationId, nations);
  const day2Nation = getNationDetailsById(team.day2NationId, nations);

  const isOwner = user?.uid === team.userId;

  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
      <CardHeader className="pb-3 pt-4 flex flex-row justify-between items-start">
        <div>
          <CardTitle className="text-xl text-primary flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            {team.name}
          </CardTitle>
          {team.creatorDisplayName && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <UserCircle className="h-3 w-3" />
              Creato da: {team.creatorDisplayName}
            </p>
          )}
        </div>
        {isOwner && (
          <Button asChild variant="outline" size="sm" className="ml-auto">
            <Link href={`/teams/${team.id}/edit`}>
              <Edit className="h-3 w-3 mr-1.5" />
              Modifica
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-grow space-y-1.5 pt-0 pb-4">
        <SelectedNationDisplay nation={founderNation} IconComponent={BadgeCheck} />
        <SelectedNationDisplay nation={day1Nation} IconComponent={Flag} />
        <SelectedNationDisplay nation={day2Nation} IconComponent={Flag} />
      </CardContent>
    </Card>
  );
}
