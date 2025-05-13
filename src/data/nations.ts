
import type { Nation } from '@/types';

// Founders: United Kingdom, France, Germany, Italy, Switzerland, Spain.
// Day 1: Iceland, Poland, Slovenia, Estonia, Ukraine, Sweden, Portugal, Norway, Belgium, Azerbaijan, San Marino, Albania, Netherlands, Croatia, Cyprus.
// Day 2: Australia, Montenegro, Ireland, Latvia, Armenia, Austria, Greece, Lithuania, Malta, Georgia, Denmark, Czechia, Luxembourg, Israel, Serbia, Finland.

// Note: Germany is listed as both founder and day 2. Assuming founder is primary.
// Note: Spain is listed as founder.

const YOUTUBE_PLACEHOLDER_ID = 'dQw4w9WgXcQ'; // Rick Astley - Never Gonna Give You Up

export const nations: Nation[] = [
  // Founders
  { id: 'gb', name: 'United Kingdom', countryCode: 'gb', songTitle: 'Rule the Waves', artistName: 'Britannia\'s Voice', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'founders' },
  { id: 'fr', name: 'France', countryCode: 'fr', songTitle: 'Chanson d\'Amour', artistName: 'Parisian Nights', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'founders' },
  { id: 'de', name: 'Germany', countryCode: 'de', songTitle: 'Berlin Beat', artistName: 'Techno Titans', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'founders' },
  { id: 'it', name: 'Italy', countryCode: 'it', songTitle: 'Melodia Italiana', artistName: 'Roman Romance', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'founders' },
  { id: 'ch', name: 'Switzerland', countryCode: 'ch', songTitle: 'Alpine Harmony', artistName: 'Swiss Echoes', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'founders' },
  { id: 'es', name: 'Spain', countryCode: 'es', songTitle: 'Fiesta Del Sol', artistName: 'Seville Sounds', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'founders' },

  // Day 1
  { id: 'is', name: 'Iceland', countryCode: 'is', songTitle: 'Northern Lights', artistName: 'Viking Frost', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1' },
  { id: 'pl', name: 'Poland', countryCode: 'pl', songTitle: 'Warsaw Melody', artistName: 'Polish Pride', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1' },
  { id: 'si', name: 'Slovenia', countryCode: 'si', songTitle: 'Ljubljana Song', artistName: 'Adriatic Gems', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1' },
  { id: 'ee', name: 'Estonia', countryCode: 'ee', songTitle: 'Baltic Ballad', artistName: 'Tallinn Tales', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1' },
  { id: 'ua', name: 'Ukraine', countryCode: 'ua', songTitle: 'Kyiv Calling', artistName: 'Freedom Singers', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1' },
  { id: 'se', name: 'Sweden', countryCode: 'se', songTitle: 'Stockholm Syndrome', artistName: 'ABBA Next Gen', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1' },
  { id: 'pt', name: 'Portugal', countryCode: 'pt', songTitle: 'Lisbon Fado', artistName: 'Atlantic Souls', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1' },
  { id: 'no', name: 'Norway', countryCode: 'no', songTitle: 'Fjord Fiesta', artistName: 'Oslo Beats', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1' },
  { id: 'be', name: 'Belgium', countryCode: 'be', songTitle: 'Brussels Sprouts Funk', artistName: 'Euro Waffles', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1' },
  { id: 'az', name: 'Azerbaijan', countryCode: 'az', songTitle: 'Land of Fire', artistName: 'Baku Flames', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1' },
  { id: 'sm', name: 'San Marino', countryCode: 'sm', songTitle: 'Microstate Anthem', artistName: 'Serenissima', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1' },
  { id: 'al', name: 'Albania', countryCode: 'al', songTitle: 'Eagle\'s Cry', artistName: 'Tirana Rhapsody', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1' },
  { id: 'nl', name: 'Netherlands', countryCode: 'nl', songTitle: 'Dutch Delight', artistName: 'Windmill Grooves', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1' },
  { id: 'hr', name: 'Croatia', countryCode: 'hr', songTitle: 'Adriatic Dreams', artistName: 'Zagreb Vibes', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1' },
  { id: 'cy', name: 'Cyprus', countryCode: 'cy', songTitle: 'Island Heartbeat', artistName: 'Aphrodite\'s Call', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day1' },

  // Day 2
  { id: 'au', name: 'Australia', countryCode: 'au', songTitle: 'Down Under Pop', artistName: 'Outback Stars', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2' },
  { id: 'me', name: 'Montenegro', countryCode: 'me', songTitle: 'Balkan Beauty', artistName: 'Podgorica Power', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2' },
  { id: 'ie', name: 'Ireland', countryCode: 'ie', songTitle: 'Emerald Echoes', artistName: 'Dublin Folk', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2' },
  { id: 'lv', name: 'Latvia', countryCode: 'lv', songTitle: 'Riga Rhythms', artistName: 'Amber Waves', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2' },
  { id: 'am', name: 'Armenia', countryCode: 'am', songTitle: 'Ancient Sounds', artistName: 'Yerevan Spirit', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2' },
  { id: 'at', name: 'Austria', countryCode: 'at', songTitle: 'Vienna Waltz 2.0', artistName: 'Alpine Beats', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2' },
  { id: 'gr', name: 'Greece', countryCode: 'gr', songTitle: 'Mythic Melody', artistName: 'Athens Calling', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2' },
  { id: 'lt', name: 'Lithuania', countryCode: 'lt', songTitle: 'Vilnius Vibes', artistName: 'Baltic Beats', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2' },
  { id: 'mt', name: 'Malta', countryCode: 'mt', songTitle: 'Mediterranean Magic', artistName: 'Valletta Voices', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2' },
  { id: 'ge', name: 'Georgia', countryCode: 'ge', songTitle: 'Caucasus Heart', artistName: 'Tbilisi Tunes', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2' },
  { id: 'dk', name: 'Denmark', countryCode: 'dk', songTitle: 'Copenhagen Cool', artistName: 'Danish Dynamites', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2' },
  { id: 'cz', name: 'Czechia', countryCode: 'cz', songTitle: 'Prague Pop', artistName: 'Bohemian Beats', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2' },
  { id: 'lu', name: 'Luxembourg', countryCode: 'lu', songTitle: 'Grand Duchy Groove', artistName: 'Luxembourgish Lullaby', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2' },
  { id: 'il', name: 'Israel', countryCode: 'il', songTitle: 'Tel Aviv Tempo', artistName: 'Desert Dance', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2' },
  { id: 'rs', name: 'Serbia', countryCode: 'rs', songTitle: 'Belgrade Ballad', artistName: 'Serbian Soul', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2' },
  { id: 'fi', name: 'Finland', countryCode: 'fi', songTitle: 'Helsinki Rock', artistName: 'Arctic Metal', youtubeVideoId: YOUTUBE_PLACEHOLDER_ID, category: 'day2' },
];

export const getNationById = (id: string): Nation | undefined => {
  return nations.find(nation => nation.id === id);
};
