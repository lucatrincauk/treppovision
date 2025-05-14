
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, ListMusic, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-8">
      <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden shadow-2xl">
        <Image 
            src="https://placehold.co/1200x400.png" 
            alt="Banner Eurovision Song Contest"
            layout="fill" 
            objectFit="cover"
            priority
            data-ai-hint="Eurovision banner"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent flex flex-col items-center justify-end p-8">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-primary animate-pulse">
            TreppoVision
          </h1>
          <p className="mt-4 text-xl md:text-2xl text-foreground/80">
            Il Tuo Compagno Eurovision Definitivo!
          </p>
        </div>
      </div>

      <p className="max-w-2xl text-lg text-muted-foreground">
        Tuffati nel mondo dell'Eurovision. Esplora nazioni, scopri canzoni ed esprimi i tuoi voti per i tuoi preferiti. Preparati per un viaggio musicale!
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <Card className="hover:shadow-primary/20 hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2"><ListMusic className="text-accent" /> Esplora Nazioni</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Scopri tutti i paesi partecipanti, i loro artisti e le loro canzoni.</CardDescription>
          </CardContent>
        </Card>
        <Card className="hover:shadow-primary/20 hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2"><Star className="text-accent"/> Esprimi i Tuoi Voti</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Valuta le partecipazioni per canzone, performance e outfit. Fai sentire la tua voce!</CardDescription>
          </CardContent>
        </Card>
        <Card className="hover:shadow-primary/20 hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2"><Flame className="text-accent" /> Guarda i Grafici</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Consulta le classifiche in tempo reale basate sui voti degli utenti e scopri chi è in testa.</CardDescription>
          </CardContent>
        </Card>
      </div>

      <Link href="/nations">
        <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground animate-bounce mt-8">
          Inizia a Esplorare le Nazioni
          <ListMusic className="ml-2 h-5 w-5" />
        </Button>
      </Link>
    </div>
  );
}
