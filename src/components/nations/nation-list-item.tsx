
import type { Nation } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Music2, UserSquare2, Award } from "lucide-react";

interface NationListItemProps {
  nation: Nation;
}

export function NationListItem({ nation }: NationListItemProps) {
  const flagUrl = `https://flagcdn.com/w160/${nation.countryCode.toLowerCase()}.png`;

  return (
    <Link href={`/nations/${nation.id}`} className="group">
      <Card className="h-full flex flex-col overflow-hidden transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:border-primary/50 group-hover:scale-[1.02]">
        <CardHeader className="p-0 relative">
          <div className="aspect-[3/2] w-full relative">
            <Image
              src={flagUrl}
              alt={`Bandiera ${nation.name}`}
              width={160}
              height={107} // Approximate 3:2 ratio for w160
              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
              priority={['gb', 'fr', 'de', 'it', 'es', 'ch'].includes(nation.id)} // Prioritize founder flags
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            <CardTitle className="absolute bottom-2 left-4 text-xl font-bold text-white drop-shadow-md">
              {nation.name}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <div className="space-y-2 text-sm">
            <p className="flex items-center text-muted-foreground">
              <Music2 className="w-4 h-4 mr-2 text-accent" />
              <span className="font-medium text-foreground truncate" title={nation.songTitle}>{nation.songTitle}</span>
            </p>
            <p className="flex items-center text-muted-foreground">
              <UserSquare2 className="w-4 h-4 mr-2 text-accent" />
              <span className="truncate" title={nation.artistName}>{nation.artistName}</span>
            </p>
            <p className="flex items-center text-muted-foreground">
              <Award className="w-4 h-4 mr-2 text-accent" />
              <span className="font-medium text-foreground">Posizione: {nation.ranking}</span>
            </p>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button variant="outline" size="sm" className="w-full group-hover:bg-accent group-hover:text-accent-foreground">
            Vedi Dettagli <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
