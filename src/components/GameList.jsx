import { useEffect, useRef } from 'react';
import { useRawgGames } from '../hooks/useRawgGames';
import SkeletonCard from './SkeletonCard';
import OfflineToast from './OfflineToast';

const GENRE_COLOR = {
  'Action':'#ff4757','RPG':'#7c5cfc','Shooter':'#f5a623','Strategy':'#4a9eff',
  'Adventure':'#00d68f','Sports':'#ff6b35','Racing':'#f99312','Puzzle':'#00e5ff',
  'Simulation':'#a0d468','Fighting':'#c8a84b','Arcade':'#ff9ff3','Platformer':'#54a0ff',
  'Indie':'#5f27cd','Casual':'#00d2d3','Card':'#ff9f43',
};

function getGenreColor(genres=[]) {
  for (const g of genres) if (GENRE_COLOR[g]) return GENRE_COLOR[g];
  return '#4a9eff';
}

function metaColor(score) {
  if (score >= 75) return { bg:'rgba(0,214,143,0.18)', border:'rgba(0,214,143,0.5)', text:'#00d68f' };
  if (score >= 50) return { bg:'rgba(245,166,35,0.18)', border:'rgba(245,166,35,0.5)', text:'#f5a623' };
  return { bg:'rgba(255,71,87,0.18)', border:'rgba(255,71,87,0.5)', text:'#ff4757' };
}

function GameCard({ game, idx }) {
  const color = getGenreColor(game.genres);
  const mc    = game.metacritic;
  const mcCol = mc ? metaColor(mc) : null;

  return (
    <div className="game-card" style={{ animationDelay:`${(idx%40)*0.025}s`, animation:'fadeInUp 0.4s ease both' }}>
      <div style={{ width:'100%', paddingBottom:'140%', position:'relative', overflow:'hidden' }}>
        <img
          src={game.img} alt={game.name}
          loading="lazy" decoding="async"
          style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.4s ease' }}
          onMouseEnter={e => e.currentTarget.style.transform='scale(1.08)'}
          onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
          onError={e => { e.currentTarget.src=`https://picsum.photos/seed/${game.id}/200/280`; }}
        />

        {/* 하단 그라디언트 */}
        <div style={{
          position:'absolute', bottom:0, left:0, right:0,
          background:'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
          padding:'28px 8px 8px', pointerEvents:'none',
        }}>
          {game.genres[0] && (
            <div style={{
              fontSize:9, fontWeight:700, letterSpacing:0.5,
              background:color+'22', border:`1px solid ${color}55`,
              color, borderRadius:4, padding:'2px 6px',
              display:'inline-block', marginBottom:3,
              fontFamily:'Rajdhani', textTransform:'uppercase',
            }}>{game.genres[0]}</div>
          )}
          {game.released && (
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.55)' }}>📅 {game.released}</div>
          )}
        </div>

        {/* 메타크리틱 배지 */}
        {mc && (
          <div style={{
            position:'absolute', top:7, right:7,
            background:mcCol.bg, border:`1px solid ${mcCol.border}`,
            borderRadius:6, padding:'3px 7px',
            display:'flex', flexDirection:'column', alignItems:'center',
            backdropFilter:'blur(6px)',
          }}>
            <span style={{ fontFamily:'Rajdhani', fontWeight:700, fontSize:15, color:mcCol.text, lineHeight:1 }}>{mc}</span>
            <span style={{ fontSize:7, color:mcCol.text, opacity:0.8, letterSpacing:0.3 }}>META</span>
          </div>
        )}

        {/* RAWG 배지 */}
        {game.isApiData && (
          <div style={{
            position:'absolute', top:7, left:7,
            background:'rgba(74,158,255,0.18)', border:'1px solid rgba(74,158,255,0.35)',
            borderRadius:4, padding:'2px 5px',
            fontSize:8, color:'#4a9eff', fontWeight:700,
            letterSpacing:0.5, backdropFilter:'blur(4px)',
          }}>RAWG</div>
        )}
      </div>

      <div style={{ padding:'8px 10px', background:'#161824', borderTop:`2px solid ${color}44` }}>
        <div style={{
          fontSize:11, fontWeight:600, color:'#e2e4ed',
          textAlign:'center', fontFamily:'Noto Sans KR',
          whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
        }} title={game.name}>{game.name}</div>

        {game.rating && (
          <div style={{ marginTop:5, position:'relative', height:3, background:'rgba(255,255,255,0.08)', borderRadius:999 }}>
            <div style={{
              position:'absolute', left:0, top:0, height:'100%',
              width:`${(game.rating/5)*100}%`,
              background:color, borderRadius:999, transition:'width 0.6s ease',
            }}/>
          </div>
        )}
        <div style={{ width:'50%', height:2, background:color, margin:'5px auto 0', borderRadius:999, opacity:0.5 }}/>
      </div>
    </div>
  );
}

function useSentinel(callback, enabled) {
  const ref = useRef(null);
  useEffect(() => {
    if (!enabled || !ref.current) return;
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) callback(); },
      { rootMargin:'300px' }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [callback, enabled]);
  return ref;
}

export default function GameList({ fullPage = false }) {
  const { games, loading, loadingMore, offline, hasMore, loadMore, totalCount } = useRawgGames();
  const sentinelRef = useSentinel(loadMore, hasMore && !loadingMore && !loading);
  const displayGames = fullPage ? games : games.slice(0, 18);

  return (
    <>
      <OfflineToast show={offline} />

      <div className="card p-5 mb-8">
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
          <span className="section-title">{fullPage ? '전체 게임 목록' : '이달의 인기 게임'}</span>

          {offline ? (
            <span style={{ fontSize:11, background:'rgba(245,166,35,0.12)', color:'#f5a623', border:'1px solid rgba(245,166,35,0.3)', padding:'2px 8px', borderRadius:999 }}>
              오프라인 모드
            </span>
          ) : (
            <span style={{ fontSize:11, background:'rgba(74,158,255,0.1)', color:'#4a9eff', border:'1px solid rgba(74,158,255,0.25)', padding:'2px 8px', borderRadius:999 }}>
              RAWG API
            </span>
          )}

          {totalCount > 0 && (
            <span style={{ fontSize:11, color:'#5a5f78', fontFamily:'Noto Sans KR' }}>
              총 {totalCount.toLocaleString()}개
            </span>
          )}

          <span style={{ marginLeft:'auto', fontSize:11, color:'#5a5f78', fontFamily:'Noto Sans KR' }}>
            {!loading && `${games.length}개 로드됨`}
          </span>
        </div>

        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(auto-fill, minmax(130px, 1fr))',
          gap:12,
        }}>
          {displayGames.map((game, idx) => (
            <GameCard key={game.id} game={game} idx={idx} />
          ))}

          {(loading || (loadingMore && fullPage)) && Array.from({ length: fullPage ? 12 : 6 }).map((_, i) => (
            <SkeletonCard key={`sk-${i}`} />
          ))}
        </div>

        {/* 무한 스크롤 센티넬: fullPage에서만 동작 */}
        {fullPage && <div ref={sentinelRef} style={{ height:1, marginTop:16 }} />}

        {fullPage && !hasMore && !loading && games.length > 0 && (
          <div style={{ textAlign:'center', marginTop:24, fontSize:12, color:'#3a3d52', fontFamily:'Noto Sans KR' }}>
            — {games.length}개 게임을 모두 불러왔습니다 —
          </div>
        )}

        {fullPage && loadingMore && (
          <div style={{ textAlign:'center', marginTop:12, fontSize:12, color:'#4a9eff' }}>
            <span style={{ display:'inline-block', animation:'spin 0.8s linear infinite' }}>⟳</span>
            {' '}게임 불러오는 중...
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </>
  );
}
