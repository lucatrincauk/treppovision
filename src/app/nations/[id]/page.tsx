
import { getNationById, nations as allNations } from "@/data/nations";
import { YouTubeEmbed } from "@/components/nations/youtube-embed";
import { VotingForm } from "@/components/voting/voting-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Music2, UserSquare2, Tag, CalendarDays } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface NationPageProps {
  params: {
    id: string;
  };
}

// Pre-generate paths for all nations
export async function generateStaticParams() {
  return allNations.map((nation) => ({
    id: nation.id,
  }));
}

export default function NationPage({ params }: NationPageProps) {
  const nation = getNationById(params.id);

  if (!nation) {
    notFound();
  }
  
  const flagUrl = `https://flagcdn.com/w320/${nation.countryCode.toLowerCase()}.png`;
  const youtubeThumbnailUrl = `https://i.ytimg.com/vi/${nation.youtubeVideoId}/hqdefault.jpg`;

  return (
    <div className="space-y-8">
      <Link href="/nations" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
        <ChevronLeft className="w-4 h-4 mr-1" />
        Torna all'Elenco Nazioni
      </Link>

      <header className="relative rounded-lg overflow-hidden shadow-2xl border border-border">
        <div className="absolute inset-0">
           <Image
            src={youtubeThumbnailUrl}
            alt={`Miniatura YouTube ${nation.name}`}
            layout="fill"
            objectFit="cover"
            className="opacity-30 blur-sm scale-110"
            data-ai-hint="music concert background"
          />
        </div>
        <div className="relative p-8 md:p-12 bg-gradient-to-tr from-background/90 via-background/70 to-transparent">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <Image
              src={flagUrl}
              alt={`Bandiera ${nation.name}`}
              width={160}
              height={107}
              className="rounded-md shadow-lg border-2 border-white/20 object-contain"
            />
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-primary mb-2 drop-shadow-sm">
                {nation.name}
              </h1>
              <div className="flex items-center space-x-2 mb-1">
                <Music2 className="w-5 h-5 text-accent" />
                <p className="text-xl md:text-2xl text-foreground font-semibold">{nation.songTitle}</p>
              </div>
              <div className="flex items-center space-x-2">
                <UserSquare2 className="w-5 h-5 text-accent" />
                <p className="text-lg text-foreground/80">{nation.artistName}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Badge variant="secondary" className="text-sm py-1 px-3 bg-accent text-accent-foreground">
              <Tag className="w-3 h-3 mr-1.5" />
              {nation.category.charAt(0).toUpperCase() + nation.category.slice(1)}
            </Badge>
             <Badge variant="outline" className="text-sm py-1 px-3">
              <CalendarDays className="w-3 h-3 mr-1.5" />
              {nation.category === 'founders' ? 'Finalista Automatico' : `Si esibisce il Giorno ${nation.category.replace('day', '')}`}
            </Badge>
          </div>
        </div>
      </header>
      
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-secondary">Guarda la Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <YouTubeEmbed videoId={nation.youtubeVideoId} title={`${nation.artistName} - ${nation.songTitle}`} />
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <VotingForm nation={nation} />
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: NationPageProps) {
  const nation = getNationById(params.id);
  if (!nation) {
    return { title: "Nazione Non Trovata" };
  }
  return {
    title: `${nation.name} - ${nation.songTitle} | TreppoVision`,
    description: `Scopri la partecipazione di ${nation.name} a TreppoVision: "${nation.songTitle}" di ${nation.artistName}. Esprimi il tuo voto!`,
  };
}
