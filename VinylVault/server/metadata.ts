import axios from 'axios';

// Discogs API for metadata lookup
interface DiscogsRelease {
  title: string;
  year: string;
  genres?: string[];
  styles?: string[];
}

interface DiscogsSearchResponse {
  results: {
    title: string;
    year: string;
    genre?: string[];
    style?: string[];
  }[];
}

export async function searchRecordMetadata(artist: string, title: string): Promise<{ year?: string; genres?: string[] }> {
  try {
    // Use the Discogs API to search for records
    const query = encodeURIComponent(`${artist} ${title}`);
    const discogsToken = process.env.DISCOGS_TOKEN || '';
    
    const response = await axios.get<DiscogsSearchResponse>(
      `https://api.discogs.com/database/search?q=${query}&type=release&per_page=3`,
      {
        headers: {
          'Authorization': `Discogs token=${discogsToken}`,
          'User-Agent': 'VinylVault/1.0'
        }
      }
    );

    // If we have results, extract the year and genre
    if (response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      return {
        year: result.year,
        genres: result.genre || result.style
      };
    }

    return {}; // No results found
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return {}; // Return empty data on error
  }
}
