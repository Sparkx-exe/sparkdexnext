import { getMangaList } from './mangadex';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Fallback recommendations if Gemini is unavailable or history is empty
export const getPopularFallbackList = async () => {
  try {
    const response = await getMangaList({
      limit: 10,
      offset: 0,
      'order[followedCount]': 'desc',
      'contentRating[]': ['safe', 'suggestive']
    });
    return response.data || [];
  } catch (error) {
    console.error('Failed to load fallback recommendations:', error);
    return [];
  }
};

export const fetchAiRecommendations = async (readingHistory) => {
  if (!GEMINI_API_KEY) {
    console.warn('VITE_GEMINI_API_KEY is not configured. Falling back to popular list.');
    return getPopularFallbackList();
  }

  if (!readingHistory || readingHistory.length === 0) {
    return getPopularFallbackList();
  }

  try {
    // 1. Fetch metadata for the user's reading history
    const historyIds = readingHistory.map((item) => item.mangaId);
    const historyMangaResponse = await getMangaList({
      ids: historyIds.slice(0, 5) // Limit history lookup to top 5 items to keep payload smaller
    });

    const historyMangas = historyMangaResponse.data || [];
    
    // Extract tags/genres and demographics
    const genresSet = new Set();
    const excludeIds = historyIds;
    const historySummary = historyMangas.map((manga) => {
      const title = manga.attributes?.title?.en || manga.attributes?.title?.['ja-ro'] || 'Unknown';
      const demographic = manga.attributes?.publicationDemographic || 'none';
      const tags = manga.attributes?.tags?.map((t) => t.attributes?.name?.en).filter(Boolean) || [];
      tags.forEach((tag) => genresSet.add(tag));
      return { title, genres: tags, demographic };
    });

    const genresList = Array.from(genresSet);

    // 2. Build the structured prompt
    const prompt = `You are a manga recommendation engine. Based on the user's reading history below, suggest 10 manga titles they would enjoy. Return ONLY a valid JSON array of MangaDex manga UUIDs. Do not include any explanation, markdown, or extra text.

Reading history genres: ${JSON.stringify(genresList)}
Recently read: ${JSON.stringify(historySummary)}
Exclude already-read: ${JSON.stringify(excludeIds)}

Return format: ["uuid1", "uuid2", ...]`;

    // 3. Request Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API responded with status ${response.status}`);
    }

    const result = await response.json();
    const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // 4. Parse response array
    // Clean potential markdown backticks
    const cleanedText = textResponse
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const uuids = JSON.parse(cleanedText);

    if (Array.isArray(uuids) && uuids.length > 0) {
      // 5. Fetch manga data for recommended UUIDs
      const recommendedResponse = await getMangaList({
        ids: uuids.slice(0, 10)
      });
      return recommendedResponse.data || [];
    }

    throw new Error('Gemini response is not a valid list of UUIDs');
  } catch (error) {
    console.error('Gemini recommendation failed, falling back:', error);
    return getPopularFallbackList();
  }
};
