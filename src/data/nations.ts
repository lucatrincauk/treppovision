
import type { Nation } from '@/types';

// THIS FILE IS NOW FOR REFERENCE OR SEEDING DATA ONLY.
// The application fetches nation data from Firebase Firestore.
// You will need to create a "nations" collection in your Firestore
// and add documents with the following structure. The document ID
// should be the nation's 'id' (e.g., 'gb', 'fr').

const YOUTUBE_PLACEHOLDER_ID = 'dQw4w9WgXcQ'; // Rick Astley - Never Gonna Give You Up

export const sampleNationsForSeeding: Nation[] = [
  // Founders
  { id: 'gb', name: 'Regno Unito', countryCode: 'gb', songTitle: 'Dominare le Onde', artistName: 'Voce di Britannia', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'founders', ranking: 1, performingOrder: 0 },
  { id: 'fr', name: 'Francia', countryCode: 'fr', songTitle: 'Canzone d\'Amore', artistName: 'Notti Parigine', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'founders', ranking: 2, performingOrder: 1 },
  { id: 'de', name: 'Germania', countryCode: 'de', songTitle: 'Ritmo di Berlino', artistName: 'Titani della Techno', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'founders', ranking: 3, performingOrder: 2 },
  { id: 'it', name: 'Italia', countryCode: 'it', songTitle: 'Melodia Italiana', artistName: 'Romanzo Romano', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'founders', ranking: 4, performingOrder: 3 },
  { id: 'ch', name: 'Svizzera', countryCode: 'ch', songTitle: 'Armonia Alpina', artistName: 'Echi Svizzeri', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'founders', ranking: 5, performingOrder: 4 },
  { id: 'es', name: 'Spagna', countryCode: 'es', songTitle: 'Fiesta Del Sol', artistName: 'Suoni di Siviglia', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'founders', ranking: 6, performingOrder: 5 },

  // Day 1 - Prima Semifinale
  { id: 'is', name: 'Islanda', countryCode: 'is', songTitle: 'Luci del Nord', artistName: 'Gelo Vichingo', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1', ranking: 7, performingOrder: 100 },
  { id: 'pl', name: 'Polonia', countryCode: 'pl', songTitle: 'Melodia di Varsavia', artistName: 'Orgoglio Polacco', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1', ranking: 8, performingOrder: 101 },
  { id: 'ee', name: 'Estonia', countryCode: 'ee', songTitle: 'Ballata Baltica', artistName: 'Racconti di Tallinn', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1', ranking: 9, performingOrder: 102 },
  { id: 'ua', name: 'Ucraina', countryCode: 'ua', songTitle: 'Kiev Chiama', artistName: 'Cantanti della Libertà', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1', ranking: 10, performingOrder: 103 },
  { id: 'se', name: 'Svezia', countryCode: 'se', songTitle: 'Sindrome di Stoccolma', artistName: 'ABBA Nuova Generazione', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1', ranking: 11, performingOrder: 104 },
  { id: 'pt', name: 'Portogallo', countryCode: 'pt', songTitle: 'Fado di Lisbona', artistName: 'Anime Atlantiche', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1', ranking: 12, performingOrder: 105 },
  { id: 'no', name: 'Norvegia', countryCode: 'no', songTitle: 'Festa dei Fiordi', artistName: 'Ritmi di Oslo', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1', ranking: 13, performingOrder: 106 },
  { id: 'sm', name: 'San Marino', countryCode: 'sm', songTitle: 'Inno del Microstato', artistName: 'Serenissima', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1', ranking: 14, performingOrder: 107 },
  { id: 'al', name: 'Albania', countryCode: 'al', songTitle: 'Grido dell\'Aquila', artistName: 'Rapsodia di Tirana', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1', ranking: 15, performingOrder: 108 },
  { id: 'nl', name: 'Paesi Bassi', countryCode: 'nl', songTitle: 'Delizia Olandese', artistName: 'Groove dei Mulini a Vento', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1', ranking: 16, performingOrder: 109 },

  // Day 2 - Seconda Semifinale
  { id: 'au', name: 'Australia', countryCode: 'au', songTitle: 'Pop dell\'Emisfero Australe', artistName: 'Stelle dell\'Outback', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2', ranking: 17, performingOrder: 200 },
  { id: 'me', name: 'Montenegro', countryCode: 'me', songTitle: 'Bellezza Balcanica', artistName: 'Potenza di Podgorica', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2', ranking: 18, performingOrder: 201 },
  { id: 'ie', name: 'Irlanda', countryCode: 'ie', songTitle: 'Echi di Smeraldo', artistName: 'Folk di Dublino', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2', ranking: 19, performingOrder: 202 },
  { id: 'lv', name: 'Lettonia', countryCode: 'lv', songTitle: 'Ritmi di Riga', artistName: 'Onde d\'Ambra', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2', ranking: 20, performingOrder: 203 },
  { id: 'am', name: 'Armenia', countryCode: 'am', songTitle: 'Suoni Antichi', artistName: 'Spirito di Yerevan', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2', ranking: 21, performingOrder: 204 },
  { id: 'at', name: 'Austria', countryCode: 'at', songTitle: 'Valzer Viennese 2.0', artistName: 'Ritmi Alpini', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2', ranking: 22, performingOrder: 205 },
  { id: 'gr', name: 'Grecia', countryCode: 'gr', songTitle: 'Melodia Mitica', artistName: 'Atene Chiama', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2', ranking: 23, performingOrder: 206 },
  { id: 'lt', name: 'Lituania', countryCode: 'lt', songTitle: 'Vibrazioni di Vilnius', artistName: 'Ritmi Baltici', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2', ranking: 24, performingOrder: 207 },
  { id: 'mt', name: 'Malta', countryCode: 'mt', songTitle: 'Magia Mediterranea', artistName: 'Voci della Valletta', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2', ranking: 25, performingOrder: 208 },
  { id: 'ge', name: 'Georgia', countryCode: 'ge', songTitle: 'Cuore del Caucaso', artistName: 'Melodie di Tbilisi', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2', ranking: 26, performingOrder: 209 },
  { id: 'dk', name: 'Danimarca', countryCode: 'dk', songTitle: 'Fascino di Copenaghen', artistName: 'Dinamiti Danesi', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2', ranking: 27, performingOrder: 210 },
  { id: 'cz', name: 'Cechia', countryCode: 'cz', songTitle: 'Pop di Praga', artistName: 'Ritmi Boemi', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2', ranking: 28, performingOrder: 211 },
  { id: 'lu', name: 'Lussemburgo', countryCode: 'lu', songTitle: 'Groove del Granducato', artistName: 'Ninna Nanna Lussemburghese', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2', ranking: 29, performingOrder: 212 },
  { id: 'il', name: 'Israele', countryCode: 'il', songTitle: 'Ritmo di Tel Aviv', artistName: 'Danza del Deserto', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2', ranking: 30, performingOrder: 213 },
  { id: 'rs', name: 'Serbia', countryCode: 'rs', songTitle: 'Ballata di Belgrado', artistName: 'Anima Serba', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2', ranking: 31, performingOrder: 214 },
  { id: 'fi', name: 'Finlandia', countryCode: 'fi', songTitle: 'Rock di Helsinki', artistName: 'Metallo Artico', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2', ranking: 32, performingOrder: 215 },
];

// This function is now superseded by nation-service.ts and should not be used for runtime fetching.
export const getNationById_DEPRECATED = (id: string): Nation | undefined => {
  console.warn("getNationById_DEPRECATED from data/nations.ts is called. Use nation-service.ts instead.");
  return sampleNationsForSeeding.find(nation => nation.id === id);
};
