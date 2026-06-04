import { useState, useEffect, useRef } from 'react';
import { gameListData } from '../mockData';

const RAWG_API_KEY = import.meta.env.VITE_RAWG_API_KEY || '';
const BASE_URL = 'https://api.rawg.io/api';
const PAGE_SIZE = 40;          // RAWG 최대
const TARGET_TOTAL = 1000;     // 목표 게임 수
const TOTAL_PAGES = Math.ceil(TARGET_TOTAL / PAGE_SIZE); // 25페이지
const PARALLEL_BATCH = 5;      // 한 번에 병렬 요청 수 (rate-limit 방지)

function getDateRange() {
  const now  = new Date();
  // 5년 범위로 넓혀서 1000개 확보가 쉽게
  const from = new Date(now.getFullYear() - 5, 0, 1);
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
    genres:     (raw.genres   || []).map(g => g.name),
    platforms:  (raw.platforms || []).map(p => p.platform.name),
    isApiData:  true,
  };
}

function normalizeFallback(m) {
  return { ...m, metacritic: null, rating: null, released: null, genres: [], platforms: [], isApiData: false };
}

async function fetchSinglePage(pageNum) {
  const { from, to } = getDateRange();
  const url = `${BASE_URL}/games?key=${RAWG_API_KEY}&dates=${from},${to}&ordering=-rating&page=${pageNum}&page_size=${PAGE_SIZE}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return {
    results: (data.results || []).map(normalizeGame),
    hasNext: !!data.next,
    count:   data.count || 0,
  };
}

export function useRawgGames() {
  const [games,       setGames]       = useState([]);
  const [loading,     setLoading]     = useState(true);   // 첫 배치 로딩 중
  const [loadingMore, setLoadingMore] = useState(false);  // 추가 배치 로딩 중
  const [offline,     setOffline]     = useState(false);
  const [totalCount,  setTotalCount]  = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);      // 현재 로드된 수
  const [done,        setDone]        = useState(false);  // 1000개 완료
  const initialized = useRef(false);
  const aborted     = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    aborted.current = false;
    loadAll();

    return () => { aborted.current = true; };
  }, []);

  async function loadAll() {
    if (!RAWG_API_KEY) {
      setGames(gameListData.map(normalizeFallback));
      setOffline(true);
      setLoading(false);
      setDone(true);
      return;
    }

    setLoading(true);

    try {
      // ── 1단계: 1페이지 먼저 로드 → 즉시 화면에 표시 ──────────────
      const first = await fetchSinglePage(1);
      if (aborted.current) return;

      setGames(first.results);
      setTotalCount(first.count);
      setLoadedCount(first.results.length);
      setLoading(false);

      if (!first.hasNext || first.results.length === 0) {
        setDone(true);
        return;
      }

      // ── 2단계: 나머지 페이지 배치 병렬 로드 (5개씩) ─────────────
      setLoadingMore(true);
      const remainingPages = Array.from({ length: TOTAL_PAGES - 1 }, (_, i) => i + 2);
      let allGames = [...first.results];
      let shouldStop = false;

      for (let i = 0; i < remainingPages.length; i += PARALLEL_BATCH) {
        if (aborted.current || shouldStop) break;

        const batch = remainingPages.slice(i, i + PARALLEL_BATCH);
        const results = await Promise.allSettled(batch.map(p => fetchSinglePage(p)));

        if (aborted.current) break;

        const newGames = [];
        for (const r of results) {
          if (r.status === 'fulfilled') {
            newGames.push(...r.value.results);
            if (!r.value.hasNext) shouldStop = true;
          }
        }

        if (newGames.length > 0) {
          allGames = [...allGames, ...newGames];
          // 중복 제거
          const seen = new Set();
          const deduped = allGames.filter(g => {
            if (seen.has(g.id)) return false;
            seen.add(g.id);
            return true;
          });
          allGames = deduped;
          setGames([...allGames]);
          setLoadedCount(allGames.length);
        }

        if (allGames.length >= TARGET_TOTAL || shouldStop) break;

        // 배치 간 짧은 딜레이 (rate-limit 방지)
        if (i + PARALLEL_BATCH < remainingPages.length && !shouldStop) {
          await new Promise(r => setTimeout(r, 150));
        }
      }

      setLoadingMore(false);
      setDone(true);

    } catch (err) {
      console.warn('[RAWG bulk]', err.message);
      if (games.length === 0) {
        setGames(gameListData.map(normalizeFallback));
        setOffline(true);
      }
      setLoading(false);
      setLoadingMore(false);
      setDone(true);
    }
  }

  // 하위 호환 (GameList에서 loadMore / hasMore 참조하는 부분 대응)
  const hasMore = false;
  const loadMore = () => {};

  return { games, loading, loadingMore, offline, hasMore, loadMore, totalCount, loadedCount, done };
}
