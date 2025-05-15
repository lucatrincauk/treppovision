
import { getNationById } from "@/lib/nation-service";
import NationPageClient from './nation-page-client';
import { notFound } from 'next/navigation';
import type { Nation } from "@/types";

interface NationPageProps {
  params: { id: string };
}

// This function runs on the server and generates metadata for the page.
export async function generateMetadata({ params }: NationPageProps) {
  const nationData = await getNationById(params.id); // Fetch data for metadata
  if (!nationData) {
    return { title: "Nazione Non Trovata" };
  }
  let description = `Scopri la partecipazione di ${nationData.name} a TreppoVision: "${nationData.songTitle}" di ${nationData.artistName}.`;
  if (nationData.songDescription) {
    description += ` ${nationData.songDescription.substring(0, 100)}...`;
  }
  if (nationData.ranking && nationData.ranking > 0) {
    description += ` Posizione: ${nationData.ranking}°.`;
  }
  description += ` Ordine Esibizione: ${nationData.performingOrder}. Esprimi il tuo voto!`;
  
  return {
    title: `${nationData.name} - ${nationData.songTitle} | TreppoVision`,
    description: description,
  };
}

/*
// generateStaticParams can be re-enabled if needed, ensure it fetches data server-side.
export async function generateStaticParams() {
  // const nations = await getNations(); // This would need to be a server-compatible fetch
  // return nations.map((nation) => ({
  //   id: nation.id,
  // }));
}
*/

// This is the main Server Component for the page.
export default async function NationPageServer({ params }: NationPageProps) {
  const nation = await getNationById(params.id);

  if (!nation) {
    notFound(); // Triggers the not-found.tsx page
  }

  // Render the Client Component, passing initial data as props.
  return <NationPageClient initialNation={nation} params={params} />;
}
