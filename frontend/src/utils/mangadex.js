/**
 * Utility functions for extracting and formatting data from the MangaDex API response.
 */

export const getMangaTitle = (manga) => {
  if (!manga) return 'Unknown Title';
  if (manga.title) return manga.title;
  const titleObj = manga.attributes?.title;
  if (!titleObj) return 'Unknown Title';
  return titleObj.en || titleObj['ja-ro'] || titleObj.ja || Object.values(titleObj)[0] || 'Unknown Title';
};

export const getMangaDescription = (manga) => {
  if (!manga) return '';
  if (manga.description) return manga.description;
  const descObj = manga.attributes?.description;
  if (!descObj) return '';
  return descObj.en || descObj.ja || Object.values(descObj)[0] || '';
};

export const getMangaCoverUrl = (manga) => {
  if (!manga) return null;
  if (manga.coverUrl) return manga.coverUrl;
  const coverArt = manga.relationships?.find((r) => r.type === 'cover_art');
  if (!coverArt || !coverArt.attributes) return null;
  const fileName = coverArt.attributes.fileName;
  if (!fileName) return null;
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const uploadsBase = isLocal ? '/api/uploads' : 'https://uploads.mangadex.org';
  return `${uploadsBase}/covers/${manga.id}/${fileName}.256.jpg`;
};

export const getMangaAuthor = (manga) => {
  if (!manga) return 'Unknown Author';
  if (manga.author) return manga.author;
  const author = manga.relationships?.find((r) => r.type === 'author');
  if (!author || !author.attributes) return 'Unknown Author';
  return author.attributes.name || 'Unknown Author';
};

export const getMangaStatusLabel = (status) => {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1);
};
