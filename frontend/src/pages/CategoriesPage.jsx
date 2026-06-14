import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { LayoutGrid, AlertCircle } from 'lucide-react';
import { getTagList, getMangaList, getMangaCoverUrl } from '../api/mangadex';
import GenreCard from '../components/GenreCard';

// Groups we want to show, in order
const GROUP_ORDER = ['genre', 'theme', 'format', 'content'];

const GROUP_LABELS = {
  genre: 'Genres',
  theme: 'Themes',
  format: 'Format',
  content: 'Content',
};

// ─── Query 1: just tags — fast single request ───────────────────────────────
const fetchTags = async () => {
  const res = await getTagList();
  return res.data || [];
};

// ─── Query 2: cover assignments — heavy, runs after tags show ───────────────
const fetchCoverAssignments = async (tags) => {
  // Fetch top 100 most popular manga in parallel to get a big pool
  const [pop1, pop2] = await Promise.all([
    getMangaList({
      limit: 100,
      offset: 0,
      'order[followedCount]': 'desc',
      contentRating: ['safe', 'suggestive'],
    }),
    getMangaList({
      limit: 100,
      offset: 100,
      'order[followedCount]': 'desc',
      contentRating: ['safe', 'suggestive'],
    }),
  ]);

  const popularPool = [...(pop1.data || []), ...(pop2.data || [])];
  const assignments = {};
  const claimedMangaIds = new Set();

  // Map candidates from the pool for each tag
  const tagsWithCandidates = tags.map(tag => {
    const candidates = popularPool.filter(manga =>
      manga.attributes?.tags?.some(t => t.id === tag.id)
    );
    return { tag, candidates };
  });

  // Sort tags with fewer candidates first (rarest get first pick)
  tagsWithCandidates.sort((a, b) => {
    const aLen = a.candidates.length;
    const bLen = b.candidates.length;
    if (aLen === 0 && bLen > 0) return 1;
    if (bLen === 0 && aLen > 0) return -1;
    return aLen - bLen;
  });

  const remainingTags = [];

  // Greedy unique cover assignment from pool
  for (const { tag, candidates } of tagsWithCandidates) {
    let assignedManga = null;
    for (const manga of candidates) {
      if (!claimedMangaIds.has(manga.id)) {
        assignedManga = manga;
        break;
      }
    }
    if (assignedManga) {
      claimedMangaIds.add(assignedManga.id);
      assignments[tag.id] = getMangaCoverUrl(assignedManga, '256');
    } else {
      remainingTags.push(tag);
    }
  }

  // Fetch covers for tags not covered by the pool (done in parallel, not blocking)
  if (remainingTags.length > 0) {
    await Promise.all(
      remainingTags.map(async (tag) => {
        try {
          const res = await getMangaList({
            includedTags: [tag.id],
            limit: 10,
            'order[followedCount]': 'desc',
            contentRating: ['safe', 'suggestive'],
          });
          const candidates = res.data || [];
          let chosen = null;
          for (const manga of candidates) {
            if (!claimedMangaIds.has(manga.id)) {
              chosen = manga;
              break;
            }
          }
          if (!chosen && candidates.length > 0) chosen = candidates[0];
          if (chosen) {
            claimedMangaIds.add(chosen.id);
            assignments[tag.id] = getMangaCoverUrl(chosen, '256');
          }
        } catch (err) {
          // Non-fatal: card will just show without cover
        }
      })
    );
  }

  return assignments;
};

export const CategoriesPage = () => {
  // ── Phase 1: Fetch tags — shows the grid immediately ──────────────────────
  const {
    data: tags,
    isLoading: tagsLoading,
    isError: tagsError,
    refetch: refetchTags,
  } = useQuery({
    queryKey: ['mangaTags'],
    queryFn: fetchTags,
    staleTime: 1000 * 60 * 60 * 6, // 6 hours
  });

  // ── Phase 2: Fetch covers — runs in background after tags are shown ────────
  const { data: coverUrls = {} } = useQuery({
    queryKey: ['categoryCovers'],
    queryFn: () => fetchCoverAssignments(tags),
    enabled: !!tags && tags.length > 0,  // Only start once tags are loaded
    staleTime: 1000 * 60 * 60 * 6, // 6 hours
  });

  // Group tags by their group attribute
  const grouped = React.useMemo(() => {
    if (!tags) return {};
    return tags.reduce((acc, tag) => {
      const group = tag.attributes?.group || 'genre';
      if (!acc[group]) acc[group] = [];
      acc[group].push(tag);
      return acc;
    }, {});
  }, [tags]);

  return (
    <div className="categories-page">
      <div className="section-heading-wrapper" style={{ paddingTop: '2rem' }}>
        <h1 className="section-title">
          <LayoutGrid size={22} style={{ marginRight: '0.5rem', color: 'var(--accent-primary)' }} />
          Browse Categories
        </h1>
      </div>

      {/* ── Skeleton: only shown while tags haven't loaded yet ── */}
      {tagsLoading && (
        <div className="genre-grid">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="genre-card skeleton-genre-card">
              <div className="animate-shimmer" style={{ width: 48, height: 48, borderRadius: '50%', marginBottom: '0.5rem' }} />
              <div className="animate-shimmer" style={{ width: '70%', height: 14, borderRadius: 6 }} />
            </div>
          ))}
        </div>
      )}

      {tagsError && (
        <div className="empty-state">
          <AlertCircle size={48} />
          <h3>Failed to load categories</h3>
          <p>Could not fetch genres from MangaDex. Check your connection and try again.</p>
          <button onClick={() => refetchTags()}>Retry</button>
        </div>
      )}

      {/* ── Grid: shown as soon as tags load, covers fill in when ready ── */}
      {tags && GROUP_ORDER.map((groupKey) => {
        const groupTags = grouped[groupKey];
        if (!groupTags || groupTags.length === 0) return null;

        const sorted = [...groupTags].sort((a, b) => {
          const nameA = a.attributes?.name?.en || '';
          const nameB = b.attributes?.name?.en || '';
          return nameA.localeCompare(nameB);
        });

        return (
          <section key={groupKey} className="genre-group-section">
            <h2 className="genre-group-title">{GROUP_LABELS[groupKey] || groupKey}</h2>
            <div className="genre-grid">
              {sorted.map((tag, i) => (
                <div
                  key={tag.id}
                  className="animate-stagger-item"
                  style={{ animationDelay: `${i * 20}ms` }}
                >
                  <GenreCard tag={tag} coverUrl={coverUrls[tag.id]} />
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default CategoriesPage;
