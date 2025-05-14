
import type { Nation } from '@/types';

// THIS FILE IS NOW FOR REFERENCE OR SEEDING DATA ONLY.
// The application fetches nation data from Firebase Firestore.
// You will need to create a "nations" collection in your Firestore
// and add documents with the following structure. The document ID
// should be the nation's 'id' (e.g., 'gb', 'fr').

const YOUTUBE_PLACEHOLDER_ID = 'dQw4w9WgXcQ'; // Rick Astley - Never Gonna Give You Up

export const sampleNationsForSeeding: Nation[] = [
  // Founders
  { id: 'gb', name: 'Regno Unito', countryCode: 'gb', songTitle: 'Dominare le Onde', artistName: 'Voce di Britannia', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'founders', ranking: 1 },
  { id: 'fr', name: 'Francia', countryCode: 'fr', songTitle: 'Canzone d\'Amore', artistName: 'Notti Parigine', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'founders', ranking: 2 },
  { id: 'de', name: 'Germania', countryCode: 'de', songTitle: 'Ritmo di Berlino', artistName: 'Titani della Techno', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'founders', ranking: 3 },
  { id: 'it', name: 'Italia', countryCode: 'it', songTitle: 'Melodia Italiana', artistName: 'Romanzo Romano', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'founders', ranking: 4 },
  { id: 'ch', name: 'Svizzera', countryCode: 'ch', songTitle: 'Armonia Alpina', artistName: 'Echi Svizzeri', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'founders', ranking: 5 },
  { id: 'es', name: 'Spagna', countryCode: 'es', songTitle: 'Fiesta Del Sol', artistName: 'Suoni di Siviglia', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'founders', ranking: 6 },

  // Day 1 - Prima Semifinale
  { id: 'is', name: 'Islanda', countryCode: 'is', songTitle: 'Luci del Nord', artistName: 'Gelo Vichingo', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1', ranking: 7 },
  { id: 'pl', name: 'Polonia', countryCode: 'pl', songTitle: 'Melodia di Varsavia', artistName: 'Orgoglio Polacco', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1', ranking: 8 },
  { id: 'ee', name: 'Estonia', countryCode: 'ee', songTitle: 'Ballata Baltica', artistName: 'Racconti di Tallinn', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1', ranking: 9 },
  { id: 'ua', name: 'Ucraina', countryCode: 'ua', songTitle: 'Kiev Chiama', artistName: 'Cantanti della Libertà', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1', ranking: 10 },
  { id: 'se', name: 'Svezia', countryCode: 'se', songTitle: 'Sindrome di Stoccolma', artistName: 'ABBA Nuova Generazione', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1', ranking: 11 },
  { id: 'pt', name: 'Portogallo', countryCode: 'pt', songTitle: 'Fado di Lisbona', artistName: 'Anime Atlantiche', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1', ranking: 12 },
  { id: 'no', name: 'Norvegia', countryCode: 'no', songTitle: 'Festa dei Fiordi', artistName: 'Ritmi di Oslo', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1', ranking: 13 },
  { id: 'sm', name: 'San Marino', countryCode: 'sm', songTitle: 'Inno del Microstato', artistName: 'Serenissima', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1', ranking: 14 },
  { id: 'al', name: 'Albania', countryCode: 'al', songTitle: 'Grido dell\'Aquila', artistName: 'Rapsodia di Tirana', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1', ranking: 15 },
  { id: 'nl', name: 'Paesi Bassi', countryCode: 'nl', songTitle: 'Delizia Olandese', artistName: 'Groove dei Mulini a Vento', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1', ranking: 16 },
  
  // Day 2 - Seconda Semifinale
  { id: 'au', name: 'Australia', countryCode: 'au', songTitle: 'Pop dell\'Emisfero Australe', artistName: 'Stelle dell\'Outback', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2', ranking: 17 },
  { id: 'me', name: 'Montenegro', countryCode: 'me', songTitle: 'Bellezza Balcanica', artistName: 'Potenza di Podgorica', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2', ranking: 18 },
  { id: 'ie', name: 'Irlanda', countryCode: 'ie', songTitle: 'Echi di Smeraldo', artistName: 'Folk di Dublino', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2', ranking: 19 },
  { id: 'lv', name: 'Lettonia', countryCode: 'lv', songTitle: 'Ritmi di Riga', artistName: 'Onde d\'Ambra', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2', ranking: 20 },
  { id: 'am', name: 'Armenia', countryCode: 'am', songTitle: 'Suoni Antichi', artistName: 'Spirito di Yerevan', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2', ranking: 21 },
  { id: 'at', name: 'Austria', countryCode: 'at', songTitle: 'Valzer Viennese 2.0', artistName: 'Ritmi Alpini', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2', ranking: 22 },
  { id: 'gr', name: 'Grecia', countryCode: 'gr', songTitle: 'Melodia Mitica', artistName: 'Atene Chiama', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2', ranking: 23 },
  { id: 'lt', name: 'Lituania', countryCode: 'lt', songTitle: 'Vibrazioni di Vilnius', artistName: 'Ritmi Baltici', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2', ranking: 24 },
  { id: 'mt', name: 'Malta', countryCode: 'mt', songTitle: 'Magia Mediterranea', artistName: 'Voci della Valletta', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2', ranking: 25 },
  { id: 'ge', name: 'Georgia', countryCode: 'ge', songTitle: 'Cuore del Caucaso', artistName: 'Melodie di Tbilisi', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2', ranking: 26 },
  { id: 'dk', name: 'Danimarca', countryCode: 'dk', songTitle: 'Fascino di Copenaghen', artistName: 'Dinamiti Danesi', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2', ranking: 27 },
  { id: 'cz', name: 'Cechia', countryCode: 'cz', songTitle: 'Pop di Praga', artistName: 'Ritmi Boemi', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2', ranking: 28 },
  { id: 'lu', name: 'Lussemburgo', countryCode: 'lu', songTitle: 'Groove del Granducato', artistName: 'Ninna Nanna Lussemburghese', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2', ranking: 29 },
  { id: 'il', name: 'Israele', countryCode: 'il', songTitle: 'Ritmo di Tel Aviv', artistName: 'Danza del Deserto', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2', ranking: 30 },
  { id: 'rs', name: 'Serbia', countryCode: 'rs', songTitle: 'Ballata di Belgrado', artistName: 'Anima Serba', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2', ranking: 31 },
  { id: 'fi', name: 'Finlandia', countryCode: 'fi', songTitle: 'Rock di Helsinki', artistName: 'Metallo Artico', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2', ranking: 32 },
];

// This function is now superseded by nation-service.ts and should not be used for runtime fetching.
export const getNationById_DEPRECATED = (id: string): Nation | undefined => {
  console.warn("getNationById_DEPRECATED from data/nations.ts is called. Use nation-service.ts instead.");
  return sampleNationsForSeeding.find(nation => nation.id === id);
};
