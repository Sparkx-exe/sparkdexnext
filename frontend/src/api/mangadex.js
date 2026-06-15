/**
 * MangaDex API client with request queuing, concurrency limit, and rate-limit handling.
 */

const apiUrl = import.meta.env.VITE_API_URL;
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const BASE_URL = (isLocal || apiUrl)
  ? '/api'
  : 'https://api.mangadex.org';

// Cover art URL cache (in-memory + localStorage)
const COVER_CACHE_KEY = 'sparkdex_cover_cache';
let coverCache = {};
try {
  const cached = localStorage.getItem(COVER_CACHE_KEY);
  if (cached) coverCache = JSON.parse(cached);
} catch (e) {
  console.error('Failed to load cover cache', e);
}

const saveCoverToCache = (mangaId, url) => {
  coverCache[mangaId] = url;
  try {
    localStorage.setItem(COVER_CACHE_KEY, JSON.stringify(coverCache));
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      coverCache = { [mangaId]: url };
      localStorage.setItem(COVER_CACHE_KEY, JSON.stringify(coverCache));
    }
  }
};

// Queue configuration
const CONCURRENCY_LIMIT = 8;
const queue = [];
let activeRequestsCount = 0;

const processQueue = () => {
  if (queue.length === 0 || activeRequestsCount >= CONCURRENCY_LIMIT) return;

  const { url, options, resolve, reject, retries } = queue.shift();
  activeRequestsCount++;

  fetch(url, options)
    .then(async (res) => {
      activeRequestsCount--;

      if (res.status === 429) {
        const delay = Math.pow(2, retries) * 1000 + Math.random() * 1000;
        console.warn(`MangaDex API Rate Limit (429). Retrying ${url} in ${delay.toFixed(0)}ms...`);
        setTimeout(() => {
          queue.push({ url, options, resolve, reject, retries: retries + 1 });
          processQueue();
        }, delay);
        return;
      }

      if (!res.ok) {
        throw new Error(`MangaDex API error: Status ${res.status}`);
      }

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        resolve(data);
      } else {
        const text = await res.text();
        resolve(text);
      }
    })
    .catch((err) => {
      activeRequestsCount--;
      if (retries < 3) {
        const delay = Math.pow(2, retries) * 1000;
        setTimeout(() => {
          queue.push({ url, options, resolve, reject, retries: retries + 1 });
          processQueue();
        }, delay);
      } else {
        reject(err);
      }
    })
    .finally(() => {
      processQueue();
    });
};

const queuedFetch = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    queue.push({ url, options, resolve, reject, retries: 0 });
    processQueue();
  });
};

// --- API Methods ---

export const getMangaList = async (params = {}) => {
  const query = new URLSearchParams();

  query.append('includes[]', 'cover_art');
  query.append('includes[]', 'author');
  query.append('includes[]', 'artist');

  Object.entries(params).forEach(([key, val]) => {
    if (Array.isArray(val)) {
      const arrayKey = key.endsWith('[]') ? key : `${key}[]`;
      val.forEach((v) => query.append(arrayKey, v));
    } else if (val !== undefined && val !== null) {
      query.append(key, val);
    }
  });

  return queuedFetch(`${BASE_URL}/manga?${query.toString()}`);
};

export const getMangaDetail = async (id) => {
  return queuedFetch(`${BASE_URL}/manga/${id}?includes[]=cover_art&includes[]=author&includes[]=artist`);
};

export const getMangaFeed = async (id, params = {}) => {
  const query = new URLSearchParams();
  query.append('limit', params.limit || '100');
  query.append('offset', params.offset || '0');

  // If languages are specified, filter by them. Empty array = 'all languages' (no filter).
  if (params.languages && params.languages.length > 0) {
    // Special sentinel: ['all'] means fetch all languages, so skip filter
    if (!(params.languages.length === 1 && params.languages[0] === 'all')) {
      params.languages.forEach((lang) => query.append('translatedLanguage[]', lang));
    }
  } else {
    // Default to English when nothing specified to maintain backward compat
    query.append('translatedLanguage[]', 'en');
  }

  query.append('includes[]', 'scanlation_group');
  query.append('order[chapter]', params.order || 'desc');

  return queuedFetch(`${BASE_URL}/manga/${id}/feed?${query.toString()}`);
};

export const getChapterImages = async (chapterId) => {
  const url = `${BASE_URL}/at-home/server/${chapterId}`;
  return queuedFetch(url);
};

export const getTagList = async () => {
  return queuedFetch(`${BASE_URL}/manga/tag`);
};

// Cover helper functions
export const getMangaCoverUrl = (manga, size = '256') => {
  if (!manga) return null;
  const mangaId = manga.id;

  if (coverCache[mangaId]) {
    const cachedUrl = coverCache[mangaId];
    if (size === '256') return `${cachedUrl}.256.jpg`;
    if (size === '512') return `${cachedUrl}.512.jpg`;
    return cachedUrl;
  }

  const coverArt = manga.relationships?.find((r) => r.type === 'cover_art');
  const fileName = coverArt?.attributes?.fileName;

  if (!fileName) return null;

  const uploadsBase = isLocal
    ? '/api/uploads'
    : apiUrl
      ? `${apiUrl}/api/uploads`
      : 'https://uploads.mangadex.org';

  const fullUrl = `${uploadsBase}/covers/${mangaId}/${fileName}`;
  saveCoverToCache(mangaId, fullUrl);

  if (size === '256') return `${fullUrl}.256.jpg`;
  if (size === '512') return `${fullUrl}.512.jpg`;
  return fullUrl;
};

export const getMangaTitle = (manga, languageSetting = 'romaji') => {
  if (!manga) return 'Unknown Title';
  const attributes = manga.attributes || {};
  const titleObj = attributes.title || {};
  const altTitles = attributes.altTitles || [];

  if (languageSetting === 'english') {
    if (titleObj.en) return titleObj.en;
    const enAlt = altTitles.find((alt) => alt.en);
    if (enAlt) return enAlt.en;
  } else if (languageSetting === 'original') {
    const origLang = attributes.originalLanguage || 'ja';
    if (titleObj[origLang]) return titleObj[origLang];
    const origAlt = altTitles.find((alt) => alt[origLang]);
    if (origAlt) return origAlt[origLang];
  }

  return titleObj.en || titleObj['ja-ro'] || titleObj.ja || Object.values(titleObj)[0] || 'Unknown Title';
};

export const getMangaAltTitle = (manga) => {
  if (!manga) return '';
  const attributes = manga.attributes || {};
  const titleObj = attributes.title || {};

  const altTitles = attributes.altTitles || [];
  const nativeAlt = altTitles.find((alt) => alt.ja || alt.ko || alt.zh || alt['ja-ro']);
  if (nativeAlt) return Object.values(nativeAlt)[0];

  const fallback = titleObj.ja || titleObj.ko || titleObj.zh;
  return fallback || '';
};

export const getMangaAuthor = (manga) => {
  if (!manga) return 'Unknown Author';
  const authorObj = manga.relationships?.find((r) => r.type === 'author');
  return authorObj?.attributes?.name || 'Unknown Author';
};

export const getMangaArtist = (manga) => {
  if (!manga) return 'Unknown Artist';
  const artistObj = manga.relationships?.find((r) => r.type === 'artist');
  return artistObj?.attributes?.name || 'Unknown Artist';
};

export const getMangaDescription = (manga) => {
  if (!manga) return '';
  const descObj = manga.attributes?.description || {};
  const text = descObj.en || descObj.ja || Object.values(descObj)[0] || '';
  return text.replace(/\[\/?[a-z]+\]/gi, '').trim();
};