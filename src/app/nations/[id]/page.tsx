
import { getNationById, getNations } from "@/lib/nation-service";
import { YouTubeEmbed } from "@/components/nations/youtube-embed";
import { VotingForm } from "@/components/voting/voting-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Music2, UserSquare2, Tag, ChevronLeft, Edit, Award, FileText, Info, ListOrdered, PlayCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminNationControls } from "@/components/admin/admin-nation-controls";
import { cn } from "@/lib/utils";

interface NationPageProps {
  params: {
    id: string;
  };
}

export async function generateStaticParams() {
  const nations = await getNations();
  return nations.map((nation) => ({
    id: nation.id,
  }));
}

export default async function NationPage({ params }: NationPageProps) {
  const nation = await getNationById(params.id);

  if (!nation) {
    notFound();
  }
  
  const flagUrl = `https://flagcdn.com/w320/${nation.countryCode.toLowerCase()}.png`;
  const isPlaceholderVideo = nation.youtubeVideoId === 'dQw4w9WgXcQ';
  const youtubeThumbnailUrl = isPlaceholderVideo 
    ? `https://placehold.co/480x360.png`
    : `https://i.ytimg.com/vi/${nation.youtubeVideoId}/hqdefault.jpg`;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-4">
        <Link href="/nations" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Torna all'Elenco Nazioni
        </Link>
        <AdminNationControls nationId={nation.id}>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/nations/${nation.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Modifica
              </Link>
            </Button>
          </div>
        </AdminNationControls>
      </div>

      <header className="relative rounded-lg overflow-hidden shadow-2xl border border-border">
        <div className="absolute inset-0">
           <Image
            src={youtubeThumbnailUrl}
            alt={`Miniatura YouTube ${nation.name}`}
            fill // Changed from layout="fill"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Example sizes, adjust as needed
            style={{ objectFit: "cover" }} // Changed from objectFit="cover"
            className="opacity-30 blur-sm scale-110"
            data-ai-hint={isPlaceholderVideo ? "music stage" : `youtube thumbnail ${nation.artistName}`}
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
              data-ai-hint={`${nation.name} flag`}
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
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-sm py-1 px-3 bg-accent text-accent-foreground">
              <Tag className="w-3 h-3 mr-1.5" />
              {nation.category === 'founders' ? 'Fondatori' : nation.category === 'day1' ? 'Prima Semifinale' : 'Seconda Semifinale'}
            </Badge>
             <Badge variant="outline" className="text-sm py-1 px-3">
              <ListOrdered className="w-3 h-3 mr-1.5" />
              Ordine Esibizione: {nation.performingOrder}
            </Badge>
            {nation.ranking && nation.ranking > 0 && (
              <Badge
                variant={ ![1,2,3].includes(nation.ranking) ? "outline" : undefined }
                className={cn(
                  "text-sm py-1 px-3",
                  nation.ranking === 1 && "bg-yellow-400 border-yellow-500 text-yellow-900 hover:bg-yellow-400/90 font-semibold",
                  nation.ranking === 2 && "bg-slate-300 border-slate-400 text-slate-900 hover:bg-slate-300/90 font-semibold",
                  nation.ranking === 3 && "bg-amber-400 border-amber-500 text-amber-900 hover:bg-amber-400/90 font-semibold"
                )}
              >
                <Award className="w-3 h-3 mr-1.5" />
                Posizione: {nation.ranking}
                {nation.ranking === 1 && " (Vincitore!)"}
              </Badge>
            )}
          </div>
        </div>
      </header>
      
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          {nation.songDescription && (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-secondary flex items-center">
                  <Info className="w-5 h-5 mr-2" />
                  L'artista
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">{nation.songDescription}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-secondary flex items-center">
                <PlayCircle className="w-5 h-5 mr-2" />
                Guarda la Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <YouTubeEmbed videoId={nation.youtubeVideoId} title={`${nation.artistName} - ${nation.songTitle}`} />
            </CardContent>
          </Card>

          {nation.songLyrics && (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-secondary flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Testo della Canzone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm text-muted-foreground whitespace-pre-line bg-muted/30 p-4 rounded-md font-mono overflow-x-auto">
                  {nation.songLyrics}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="md:col-span-1">
          <VotingForm nation={nation} />
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: NationPageProps) {
  const nation = await getNationById(params.id);
  if (!nation) {
    return { title: "Nazione Non Trovata" };
  }
  let description = `Scopri la partecipazione di ${nation.name} a TreppoVision: "${nation.songTitle}" di ${nation.artistName}.`;
  if (nation.songDescription) {
    description += ` ${nation.songDescription.substring(0, 100)}...`;
  }
  if (nation.ranking && nation.ranking > 0) {
    description += ` Posizione: ${nation.ranking}.`;
  }
  description += ` Ordine Esibizione: ${nation.performingOrder}. Esprimi il tuo voto!`;
  
  return {
    title: `${nation.name} - ${nation.songTitle} | TreppoVision`,
    description: description,
  };
}
