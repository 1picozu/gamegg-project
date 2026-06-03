import { useState, useEffect, useCallback, useRef } from 'react';
import { gameListData } from '../mockData';

const RAWG_API_KEY = import.meta.env.VITE_RAWG_API_KEY || '';
const BASE_URL = 'https://api.rawg.io/api';

// 최근 1년 범위로 확장 → 게임 수백 개 확보
function getDateRange() {
  const now  = new Date();
  const from = new Date(now.getFullYear() - 1, now.getMonth(), 1);
  const fmt  = d => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(now) };
}

function normalizeGame(raw) {
  return {
    id:         raw.id,
    name:       raw.name,
    img:        raw.background_image || `https://picsum.photos/seed/${raw.id}/200/280`,
    metacritic: raw.metacritic ?? null,
    rating:     raw.rating ? Math.round(raw.rating * 10) / 10 : null,
    released:   raw.released ?? null,
    genres:     (raw.genres  || []).map(g => g.name),
    platforms:  (raw.platforms || []).map(p => p.platform.name),
    isApiData:  true,
  };
}

function normalizeFallback(m) {
  return { ...m, metacritic: null, rating: null, released: null, genres: [], platforms: [], isApiData: false };
}

export function useRawgGames() {
  const [games,       setGames]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offline,     setOffline]     = useState(false);
  const [page,        setPage]        = useState(2);   // 다음 요청은 2페이지부터
  const [hasMore,     setHasMore]     = useState(true);
  const [totalCount,  setTotalCount]  = useState(0);
  const isFetching = useRef(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    fetchPage(1, true);
  }, []);

  const fetchPage = useCallback(async (pageNum, isFirst = false) => {
    if (isFetching.current) return;
    isFetching.current = true;

    if (isFirst) setLoading(true);
    else         setLoadingMore(true);

    try {
      if (!RAWG_API_KEY) throw new Error('no key');

      const { from, to } = getDateRange();
      // page_size=40으로 키워서 한 번에 더 많이 받음
      const url = `${BASE_URL}/games?key=${RAWG_API_KEY}&dates=${from},${to}&ordering=-rating&page=${pageNum}&page_size=40`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const normalized = (data.results || []).map(normalizeGame);

      setGames(prev => isFirst ? normalized : [...prev, ...normalized]);
      setHasMore(!!data.next);
      setTotalCount(data.count || 0);
      setPage(pageNum + 1);
      setOffline(false);
    } catch (err) {
      console.warn('[RAWG]', err.message);
      if (isFirst) {
        setGames(gameListData.map(normalizeFallback));
        setOffline(true);
        setHasMore(false);
      }
    } finally {
      if (isFirst) setLoading(false);
      else         setLoadingMore(false);
      isFetching.current = false;
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) fetchPage(page);
  }, [page, loadingMore, hasMore, loading, fetchPage]);

  return { games, loading, loadingMore, offline, hasMore, loadMore, totalCount };
}
