
import { getNationById } from "@/lib/nation-service";
import { NationForm } from "@/components/admin/nation-form";
import { AdminNationControls } from "@/components/admin/admin-nation-controls";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import type { NationFormData } from "@/types";

interface EditNationPageProps {
  params: {
    id: string;
  };
}

export default async function EditNationPage({ params }: EditNationPageProps) {
  const nation = await getNationById(params.id);

  if (!nation) {
    notFound();
  }

  const initialData: NationFormData = {
    id: nation.id,
    name: nation.name,
    countryCode: nation.countryCode,
    songTitle: nation.songTitle,
    artistName: nation.artistName,
    youtubeVideoId: nation.youtubeVideoId,
    category: nation.category,
    ranking: (nation.ranking === 0 || nation.ranking === undefined || nation.ranking === null) ? undefined : String(nation.ranking),
    performingOrder: nation.performingOrder || 0,
    songDescription: nation.songDescription || "",
    songLyrics: nation.songLyrics || "",
  };

  return (
    <AdminNationControls nationId={nation.id}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link href={`/nations/${nation.id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Torna a {nation.name}
          </Link>
        </div>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Modifica Nazione: {nation.name}</CardTitle>
            <CardDescription>
              Aggiorna i dettagli della nazione partecipante.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NationForm initialData={initialData} isEditMode={true} />
          </CardContent>
        </Card>
      </div>
    </AdminNationControls>
  );
}
