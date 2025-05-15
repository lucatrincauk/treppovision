
import { getTeams } from "@/lib/team-service";
import { getNations } from "@/lib/nation-service";
import { getAllNationsGlobalCategorizedScores } from "@/lib/voting-service";
import type { Team, Nation, NationGlobalCategorizedScores } from "@/types";
import { TeamsSubNavigation } from "@/components/teams/teams-sub-navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, UserCircle, BarChartBig, Info, BadgeCheck, Music2, Star, Shirt, ThumbsDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic'; 

const getPointsForRank = (rank?: number): number => {
  if (rank === undefined || rank === null || rank === 0) return 0;
  switch (rank) {
    case 1: return 50;
    case 2: return 35;
    case 3: return 25;
    case 4: return 15;
    case 5: return 10;
  }
  if (rank >= 6 && rank <= 14) {
    return 10 - (rank - 5); 
  }
  if (rank === 15) return 0;
  if (rank >= 16 && rank <= 25) {
    return 0 - (rank - 15); 
  }
  if (rank === 26) return 25;

  return 0; 
};

interface NationScoreDetail {
  id: string;
  name: string;
  countryCode: string;
  actualRank?: number;
  points: number;
}

interface CategoryPickDetail {
  categoryName: string;
  pickedNationId?: string;
  pickedNationName?: string;
  pickedNationCountryCode?: string;
  actualCategoryRank?: number; // 1st, 2nd, 3rd in this category based on global votes
  pointsAwarded: number;
  icon: React.ElementType;
}

interface TeamWithScore extends Team {
  score: number;
  rank?: number;
  primaSquadraDetails: NationScoreDetail[];
  categoryPicksDetails: CategoryPickDetail[];
}

const getTopNationsForCategory = (
  scoresMap: Map<string, NationGlobalCategorizedScores>,
  nationsMap: Map<string, Nation>,
  categoryKey: 'averageSongScore' | 'averagePerformanceScore' | 'averageOutfitScore',
  sortOrder: 'desc' | 'asc' = 'desc' // 'desc' for best, 'asc' for worst
): Array<{ nationId: string; nationName: string; score: number | null }> => {
  return Array.from(scoresMap.entries())
    .map(([nationId, scores]) => ({
      nationId,
      nationName: nationsMap.get(nationId)?.name || 'Sconosciuto',
      score: scores[categoryKey]
    }))
    .filter(item => item.score !== null && (scoresMap.get(item.nationId)?.voteCount || 0) > 0) // Ensure there are votes
    .sort((a, b) => {
      if (sortOrder === 'desc') {
        return (b.score as number) - (a.score as number);
      }
      return (a.score as number) - (b.score as number);
    })
    .slice(0, 3);
};

const getCategoryPickPointsAndRank = (
  pickedNationId: string | undefined,
  topNationsInCategory: Array<{ nationId: string }>
): { points: number; rank?: number } => {
  if (!pickedNationId) return { points: 0, rank: undefined };
  const rankIndex = topNationsInCategory.findIndex(n => n.nationId === pickedNationId);
  if (rankIndex === 0) return { points: 15, rank: 1 };
  if (rankIndex === 1) return { points: 10, rank: 2 };
  if (rankIndex === 2) return { points: 5, rank: 3 };
  return { points: 0, rank: undefined };
};


export default async function TeamsLeaderboardPage() {
  const allTeams = await getTeams();
  const allNations = await getNations();
  const globalCategorizedScoresMap = await getAllNationsGlobalCategorizedScores();

  const nationsMap = new Map(allNations.map(nation => [nation.id, nation]));

  const topSongNations = getTopNationsForCategory(globalCategorizedScoresMap, nationsMap, 'averageSongScore', 'desc');
  const bottomSongNations = getTopNationsForCategory(globalCategorizedScoresMap, nationsMap, 'averageSongScore', 'asc'); // For worst song
  const topPerformanceNations = getTopNationsForCategory(globalCategorizedScoresMap, nationsMap, 'averagePerformanceScore', 'desc');
  const topOutfitNations = getTopNationsForCategory(globalCategorizedScoresMap, nationsMap, 'averageOutfitScore', 'desc');

  let teamsWithScores: TeamWithScore[] = allTeams.map(team => {
    let score = 0;
    const primaSquadraDetails: NationScoreDetail[] = [];
    const categoryPicksDetails: CategoryPickDetail[] = [];

    // Calculate points from Prima Squadra (Eurovision Ranks)
    (team.founderChoices || []).forEach(nationId => {
      const nation = nationsMap.get(nationId);
      if (nation) {
        const points = getPointsForRank(nation.ranking);
        score += points;
        primaSquadraDetails.push({
          id: nation.id,
          name: nation.name,
          countryCode: nation.countryCode,
          actualRank: nation.ranking,
          points,
        });
      }
    });

    // Calculate points from Category Picks (User Votes)
    const bestSongPick = getCategoryPickPointsAndRank(team.bestSongNationId, topSongNations);
    score += bestSongPick.points;
    const bestSongNation = team.bestSongNationId ? nationsMap.get(team.bestSongNationId) : undefined;
    categoryPicksDetails.push({
      categoryName: "Miglior Canzone",
      pickedNationId: team.bestSongNationId,
      pickedNationName: bestSongNation?.name,
      pickedNationCountryCode: bestSongNation?.countryCode,
      actualCategoryRank: bestSongPick.rank,
      pointsAwarded: bestSongPick.points,
      icon: Music2,
    });

    const bestPerformancePick = getCategoryPickPointsAndRank(team.bestPerformanceNationId, topPerformanceNations);
    score += bestPerformancePick.points;
    const bestPerformanceNation = team.bestPerformanceNationId ? nationsMap.get(team.bestPerformanceNationId) : undefined;
    categoryPicksDetails.push({
      categoryName: "Miglior Performance",
      pickedNationId: team.bestPerformanceNationId,
      pickedNationName: bestPerformanceNation?.name,
      pickedNationCountryCode: bestPerformanceNation?.countryCode,
      actualCategoryRank: bestPerformancePick.rank,
      pointsAwarded: bestPerformancePick.points,
      icon: Star,
    });

    const bestOutfitPick = getCategoryPickPointsAndRank(team.bestOutfitNationId, topOutfitNations);
    score += bestOutfitPick.points;
    const bestOutfitNation = team.bestOutfitNationId ? nationsMap.get(team.bestOutfitNationId) : undefined;
    categoryPicksDetails.push({
      categoryName: "Miglior Outfit",
      pickedNationId: team.bestOutfitNationId,
      pickedNationName: bestOutfitNation?.name,
      pickedNationCountryCode: bestOutfitNation?.countryCode,
      actualCategoryRank: bestOutfitPick.rank,
      pointsAwarded: bestOutfitPick.points,
      icon: Shirt,
    });
    
    const worstSongPick = getCategoryPickPointsAndRank(team.worstSongNationId, bottomSongNations);
    score += worstSongPick.points;
    const worstSongNation = team.worstSongNationId ? nationsMap.get(team.worstSongNationId) : undefined;
     categoryPicksDetails.push({
      categoryName: "Peggior Canzone",
      pickedNationId: team.worstSongNationId,
      pickedNationName: worstSongNation?.name,
      pickedNationCountryCode: worstSongNation?.countryCode,
      actualCategoryRank: worstSongPick.rank, 
      pointsAwarded: worstSongPick.points,
      icon: ThumbsDown,
    });


    return { ...team, score, primaSquadraDetails, categoryPicksDetails };
  });

  teamsWithScores.sort((a, b) => {
    if (b.score === a.score) {
      return a.name.localeCompare(b.name);
    }
    return b.score - a.score;
  });

  let currentRank = 1;
  for (let i = 0; i < teamsWithScores.length; i++) {
    if (i > 0 && teamsWithScores[i].score < teamsWithScores[i-1].score) {
      currentRank = i + 1;
    }
    teamsWithScores[i].rank = currentRank;
  }

  const PrimaSquadraNationDisplay = ({ detail }: { detail: NationScoreDetail }) => (
    <div className="flex items-center gap-1.5 py-0.5"> 
      <BadgeCheck className="w-3.5 h-3.5 text-accent flex-shrink-0" />
      <Image
        src={`https://flagcdn.com/w20/${detail.countryCode.toLowerCase()}.png`}
        alt={detail.name}
        width={15} 
        height={10}
        className="rounded-sm border border-border/30 object-contain flex-shrink-0"
        data-ai-hint={`${detail.name} flag`}
      />
      <Link 
        href={`/nations/${detail.id}`} 
        className="text-xs hover:underline hover:text-primary truncate flex-grow" 
        title={`${detail.name} (Classifica Finale: ${detail.actualRank ?? 'N/D'}) - Punti: ${detail.points}`}
      >
        <span className="font-medium">{detail.name.substring(0,15)+(detail.name.length > 15 ? '...' : '')}</span>
        <span className="text-muted-foreground"> ({detail.actualRank ? `${detail.actualRank}°` : 'N/D'})</span>
      </Link>
      <span className={cn(
        "text-xs ml-auto pl-1", 
        detail.points > 0 ? "font-semibold text-primary" : detail.points < 0 ? "font-semibold text-destructive" : "text-muted-foreground"
      )}>
        {detail.points > 0 ? `+${detail.points}pt` : `${detail.points}pt`}
      </span>
    </div>
  );

  const CategoryPickDisplay = ({ detail }: { detail: CategoryPickDetail }) => {
    const Icon = detail.icon;
    return (
      <div className="flex items-center gap-1.5 py-0.5">
        <Icon className={cn("w-3.5 h-3.5 flex-shrink-0 text-accent")} />
        {detail.pickedNationCountryCode && detail.pickedNationName ? (
            <Image
            src={`https://flagcdn.com/w20/${detail.pickedNationCountryCode.toLowerCase()}.png`}
            alt={detail.pickedNationName}
            width={15}
            height={10}
            className="rounded-sm border border-border/30 object-contain flex-shrink-0"
            data-ai-hint={`${detail.pickedNationName} flag`}
            />
        ) : (
            <div className="w-[15px] h-[10px] bg-muted rounded-sm border border-border/30 flex-shrink-0"></div>
        )}
        
        <span className="text-xs text-muted-foreground min-w-[120px] flex-shrink-0">{detail.categoryName}:</span>
        <Link href={detail.pickedNationId ? `/nations/${detail.pickedNationId}` : '#'} className={cn("text-xs hover:underline hover:text-primary truncate flex-grow", !detail.pickedNationId && "pointer-events-none")}>
          <span className="font-medium">
            {detail.pickedNationName ? (detail.pickedNationName.substring(0,12)+(detail.pickedNationName.length > 12 ? '...' : '')) : "N/D"}
          </span>
          {detail.actualCategoryRank && detail.pointsAwarded > 0 && ( 
            <span className="text-muted-foreground"> ({detail.actualCategoryRank}° in cat.)</span>
          )}
        </Link>
         <span className={cn("text-xs ml-auto pl-1", detail.pointsAwarded > 0 ? "font-semibold text-primary" : "text-muted-foreground")}>
            {detail.pointsAwarded > 0 ? `+${detail.pointsAwarded}pt` : `${detail.pointsAwarded}pt`}
        </span>
      </div>
    );
  };


  return (
    <div className="space-y-8">
      <TeamsSubNavigation />
      <header className="text-center sm:text-left space-y-2 mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary flex items-center">
          <BarChartBig className="mr-3 h-10 w-10" />
          Classifica Squadre
        </h1>
        <p className="text-xl text-muted-foreground">
          Punteggi basati sulla classifica finale e sui pronostici degli utenti.
        </p>
      </header>

      {teamsWithScores.length === 0 ? (
        <div className="text-center text-muted-foreground py-10">
          <Trophy className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-lg">Nessuna squadra trovata o nessun punteggio calcolabile.</p>
          <p>Assicurati che le squadre siano state create e che le nazioni abbiano un ranking e voti utente.</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] text-center">Pos.</TableHead>
                  <TableHead>Squadra</TableHead>
                  <TableHead className="text-right">Punteggio Totale</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamsWithScores.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium text-center align-top">{team.rank}</TableCell>
                    <TableCell className="align-top">
                        <div className="font-medium truncate mb-1 text-base flex items-center">
                          <span>{team.name}</span>
                          <span className="ml-2 text-xs text-muted-foreground flex items-center gap-1" title={team.creatorDisplayName}>
                            (<UserCircle className="w-3 h-3" />{team.creatorDisplayName})
                          </span>
                        </div>
                        
                        <div className="mb-2">
                            <p className="text-xs font-semibold text-muted-foreground mb-0.5">Pronostici Treppovision:</p>
                            {team.primaSquadraDetails.map(detail => (
                                <PrimaSquadraNationDisplay key={`${detail.id}-prima`} detail={detail} />
                            ))}
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-0.5">Pronostici Voti TreppoScore:</p>
                            {team.categoryPicksDetails.map(detail => (
                                <CategoryPickDisplay key={`${team.id}-${detail.categoryName}`} detail={detail} />
                            ))}
                        </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-lg text-primary align-top">{team.score}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      <Card className="mt-8 border-primary/20 bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-primary">Come Funziona il Punteggio?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Il punteggio totale di una squadra è composto da due parti:
                </p>
                <ul className="list-disc pl-5 mt-2 text-sm text-muted-foreground space-y-1">
                    <li>
                        <strong>Pronostici Treppovision (3 Nazioni)</strong>: Punti basati sulla classifica finale Eurovision.
                        Sistema: 1°: 50pt, 2°: 35pt, 3°: 25pt, 4°: 15pt, 5°: 10pt, 6°-14°: da 9 a 1pt, 15°: 0pt, 16°-25°: da -1pt a -10pt, 26°: 25pt.
                        Nazioni senza ranking valido ottengono 0 punti.
                    </li>
                    <li>
                        <strong>Pronostici Voti TreppoScore</strong>: Punti per aver indovinato le nazioni più o meno votate dagli utenti nelle categorie Miglior Canzone, Miglior Performance, Miglior Outfit e Peggior Canzone.
                        Per ogni categoria (Migliore/Peggiore): 1° posto corretto: +15pt, 2°: +10pt, 3°: +5pt.
                    </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
