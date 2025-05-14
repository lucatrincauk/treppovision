
import type { Nation } from '@/types';

// Founders: United Kingdom, France, Germany, Italy, Switzerland, Spain.
// Day 1: Iceland, Poland, Estonia, Ukraine, Sweden, Portugal, Norway, Azerbaijan, San Marino, Albania, Netherlands, Croatia, Cyprus.
// Day 2: Australia, Montenegro, Ireland, Latvia, Armenia, Austria, Greece, Lithuania, Malta, Georgia, Denmark, Czechia, Luxembourg, Israel, Serbia, Finland.

const YOUTUBE_PLACEHOLDER_ID = 'dQw4w9WgXcQ'; // Rick Astley - Never Gonna Give You Up

export const nations: Nation[] = [
  // Founders
  { id: 'gb', name: 'Regno Unito', countryCode: 'gb', songTitle: 'Dominare le Onde', artistName: 'Voce di Britannia', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'founders' },
  { id: 'fr', name: 'Francia', countryCode: 'fr', songTitle: 'Canzone d\'Amore', artistName: 'Notti Parigine', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'founders' },
  { id: 'de', name: 'Germania', countryCode: 'de', songTitle: 'Ritmo di Berlino', artistName: 'Titani della Techno', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'founders' },
  { id: 'it', name: 'Italia', countryCode: 'it', songTitle: 'Melodia Italiana', artistName: 'Romanzo Romano', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'founders' },
  { id: 'ch', name: 'Svizzera', countryCode: 'ch', songTitle: 'Armonia Alpina', artistName: 'Echi Svizzeri', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'founders' },
  { id: 'es', name: 'Spagna', countryCode: 'es', songTitle: 'Fiesta Del Sol', artistName: 'Suoni di Siviglia', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'founders' },

  // Day 1
  { id: 'is', name: 'Islanda', countryCode: 'is', songTitle: 'Luci del Nord', artistName: 'Gelo Vichingo', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1' },
  { id: 'pl', name: 'Polonia', countryCode: 'pl', songTitle: 'Melodia di Varsavia', artistName: 'Orgoglio Polacco', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1' },
  { id: 'ee', name: 'Estonia', countryCode: 'ee', songTitle: 'Ballata Baltica', artistName: 'Racconti di Tallinn', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1' },
  { id: 'ua', name: 'Ucraina', countryCode: 'ua', songTitle: 'Kiev Chiama', artistName: 'Cantanti della Libertà', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1' },
  { id: 'se', name: 'Svezia', countryCode: 'se', songTitle: 'Sindrome di Stoccolma', artistName: 'ABBA Nuova Generazione', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1' },
  { id: 'pt', name: 'Portogallo', countryCode: 'pt', songTitle: 'Fado di Lisbona', artistName: 'Anime Atlantiche', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1' },
  { id: 'no', name: 'Norvegia', countryCode: 'no', songTitle: 'Festa dei Fiordi', artistName: 'Ritmi di Oslo', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1' },
  { id: 'sm', name: 'San Marino', countryCode: 'sm', songTitle: 'Inno del Microstato', artistName: 'Serenissima', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1' },
  { id: 'al', name: 'Albania', countryCode: 'al', songTitle: 'Grido dell\'Aquila', artistName: 'Rapsodia di Tirana', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1' },
  { id: 'nl', name: 'Paesi Bassi', countryCode: 'nl', songTitle: 'Delizia Olandese', artistName: 'Groove dei Mulini a Vento', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1' },
  
  // Day 2
  { id: 'au', name: 'Australia', countryCode: 'au', songTitle: 'Pop dell\'Emisfero Australe', artistName: 'Stelle dell\'Outback', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2' },
  { id: 'me', name: 'Montenegro', countryCode: 'me', songTitle: 'Bellezza Balcanica', artistName: 'Potenza di Podgorica', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2' },
  { id: 'ie', name: 'Irlanda', countryCode: 'ie', songTitle: 'Echi di Smeraldo', artistName: 'Folk di Dublino', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2' },
  { id: 'lv', name: 'Lettonia', countryCode: 'lv', songTitle: 'Ritmi di Riga', artistName: 'Onde d\'Ambra', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2' },
  { id: 'am', name: 'Armenia', countryCode: 'am', songTitle: 'Suoni Antichi', artistName: 'Spirito di Yerevan', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2' },
  { id: 'at', name: 'Austria', countryCode: 'at', songTitle: 'Valzer Viennese 2.0', artistName: 'Ritmi Alpini', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2' },
  { id: 'gr', name: 'Grecia', countryCode: 'gr', songTitle: 'Melodia Mitica', artistName: 'Atene Chiama', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2' },
  { id: 'lt', name: 'Lituania', countryCode: 'lt', songTitle: 'Vibrazioni di Vilnius', artistName: 'Ritmi Baltici', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2' },
  { id: 'mt', name: 'Malta', countryCode: 'mt', songTitle: 'Magia Mediterranea', artistName: 'Voci della Valletta', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2' },
  { id: 'ge', name: 'Georgia', countryCode: 'ge', songTitle: 'Cuore del Caucaso', artistName: 'Melodie di Tbilisi', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2' },
  { id: 'dk', name: 'Danimarca', countryCode: 'dk', songTitle: 'Fascino di Copenaghen', artistName: 'Dinamiti Danesi', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2' },
  { id: 'cz', name: 'Cechia', countryCode: 'cz', songTitle: 'Pop di Praga', artistName: 'Ritmi Boemi', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2' },
  { id: 'lu', name: 'Lussemburgo', countryCode: 'lu', songTitle: 'Groove del Granducato', artistName: 'Ninna Nanna Lussemburghese', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2' },
  { id: 'il', name: 'Israele', countryCode: 'il', songTitle: 'Ritmo di Tel Aviv', artistName: 'Danza del Deserto', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2' },
  { id: 'rs', name: 'Serbia', countryCode: 'rs', songTitle: 'Ballata di Belgrado', artistName: 'Anima Serba', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2' },
  { id: 'fi', name: 'Finlandia', countryCode: 'fi', songTitle: 'Rock di Helsinki', artistName: 'Metallo Artico', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2' },
];

export const getNationById = (id: string): Nation | undefined => {
  return nations.find(nation => nation.id === id);
};
