
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
            src="https://picsum.photos/seed/eurovision_stage/1200/600" 
            alt="Eurovision Stage" 
            layout="fill" 
            objectFit="cover"
            priority
            data-ai-hint="concert stage lights"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent flex flex-col items-center justify-end p-8">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-primary animate-pulse">
            TreppoVision
          </h1>
          <p className="mt-4 text-xl md:text-2xl text-foreground/80">
            Your Ultimate Eurovision Companion!
          </p>
        </div>
      </div>

      <p className="max-w-2xl text-lg text-muted-foreground">
        Dive into the world of Eurovision. Explore nations, discover songs, and cast your votes for your favorites. Get ready for a musical journey!
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <Card className="hover:shadow-primary/20 hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2"><ListMusic className="text-accent" /> Explore Nations</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Discover all participating countries, their artists, and their songs.</CardDescription>
          </CardContent>
        </Card>
        <Card className="hover:shadow-primary/20 hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2"><Star className="text-accent"/> Cast Your Votes</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Rate entries on song, performance, and outfit. Make your voice heard!</CardDescription>
          </CardContent>
        </Card>
        <Card className="hover:shadow-primary/20 hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2"><Flame className="text-accent" /> See The Charts</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Check out real-time rankings based on user votes and see who's leading.</CardDescription>
          </CardContent>
        </Card>
      </div>

      <Link href="/nations">
        <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground animate-bounce mt-8">
          Start Exploring Nations
          <ListMusic className="ml-2 h-5 w-5" />
        </Button>
      </Link>
    </div>
  );
}
