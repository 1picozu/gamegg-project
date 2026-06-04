import { useEffect, useRef, useState } from 'react';
import { useRawgGames } from '../hooks/useRawgGames';
import SkeletonCard from './SkeletonCard';
import OfflineToast from './OfflineToast';

const GENRE_COLOR = {
  'Action':'#ff4757','RPG':'#7c5cfc','Shooter':'#f5a623','Strategy':'#4a9eff',
  'Adventure':'#00d68f','Sports':'#ff6b35','Racing':'#f99312','Puzzle':'#00e5ff',
  'Simulation':'#a0d468','Fighting':'#c8a84b','Arcade':'#ff9ff3','Platformer':'#54a0ff',
  'Indie':'#5f27cd','Casual':'#00d2d3','Card':'#ff9f43',
};
function getGenreColor(genres=[]) { for(const g of genres) if(GENRE_COLOR[g]) return GENRE_COLOR[g]; return '#4a9eff'; }
function metaColor(s) {
  if(s>=75) return {bg:'rgba(0,214,143,0.18)',border:'rgba(0,214,143,0.5)',text:'#00d68f'};
  if(s>=50) return {bg:'rgba(245,166,35,0.18)',border:'rgba(245,166,35,0.5)',text:'#f5a623'};
  return {bg:'rgba(255,71,87,0.18)',border:'rgba(255,71,87,0.5)',text:'#ff4757'};
}

// ── AI 추천 검색바 ──────────────────────────────────────────────────
async function fetchAIRecommendation(query, games) {
  // OpenAI 연동 준비된 함수 틀 — 현재는 키워드 필터링으로 모의 구현
  // 실제 연동 시: const res = await fetch('https://api.openai.com/v1/chat/completions', {...})
  await new Promise(r => setTimeout(r, 1800)); // 로딩 시뮬레이션
  const q = query.toLowerCase();
  const keywords = q.split(/\s+/);
  return games.filter(g => {
    const target = [g.name, ...(g.genres||[]), ...(g.platforms||[])].join(' ').toLowerCase();
    return keywords.some(k => k.length > 1 && target.includes(k));
  }).slice(0, 15);
}

function AISearchBar({ games, onResult, onReset }) {
  const [query,    setQuery]   = useState('');
  const [loading,  setLoading] = useState(false);
  const [progress, setProgress]= useState(0);

  const handleSearch = async () => {
    if (!query.trim() || loading) return;
    setLoading(true); setProgress(0);
    const iv = setInterval(() => setProgress(p => Math.min(p+8, 90)), 120);
    try {
      const results = await fetchAIRecommendation(query, games);
      clearInterval(iv); setProgress(100);
      setTimeout(() => { setLoading(false); onResult(results, query); }, 300);
    } catch {
      clearInterval(iv); setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontSize:12, color:'#8a8fa8', marginBottom:8, fontFamily:'Noto Sans KR' }}>
        🤖 AI 게임 추천 <span style={{ fontSize:10, color:'#5a5f78' }}>(OpenAI 연동 준비됨 · 현재 키워드 필터 모의 구현)</span>
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSearch()}
          placeholder='예) "친구랑 같이 할 FPS" "무료 RPG" "멀티 전략 게임"'
          style={{ flex:1, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(124,92,252,0.3)', borderRadius:8, color:'#e2e4ed', padding:'10px 14px', fontSize:13, fontFamily:'Noto Sans KR', outline:'none' }}
          onFocus={e=>e.currentTarget.style.borderColor='#7c5cfc'} onBlur={e=>e.currentTarget.style.borderColor='rgba(124,92,252,0.3)'}
        />
        <button onClick={handleSearch} disabled={loading} style={{ padding:'10px 20px', background:'linear-gradient(135deg,#7c5cfc,#4a9eff)', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:700, cursor:loading?'wait':'pointer', fontFamily:'Noto Sans KR', opacity:loading?0.7:1, whiteSpace:'nowrap' }}>
          {loading ? '분석 중...' : '🔍 AI 추천'}
        </button>
        <button onClick={onReset} style={{ padding:'10px 14px', background:'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#8a8fa8', fontSize:13, cursor:'pointer', fontFamily:'Noto Sans KR' }}>전체</button>
      </div>

      {loading && (
        <div style={{ marginTop:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <span style={{ fontSize:12, color:'#7c5cfc', fontFamily:'Noto Sans KR', animation:'pulse 1s ease infinite' }}>🤖 AI가 취향을 분석 중입니다...</span>
          </div>
          <div style={{ height:4, background:'rgba(255,255,255,0.06)', borderRadius:999, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${progress}%`, background:'linear-gradient(90deg,#7c5cfc,#4a9eff)', borderRadius:999, transition:'width 0.15s ease' }}/>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 3D 플립 카드 ────────────────────────────────────────────────────
function FlipCard({ game, idx }) {
  const [flipped, setFlipped] = useState(false);
  const color  = getGenreColor(game.genres);
  const mc     = game.metacritic;
  const mcCol  = mc ? metaColor(mc) : null;

  const platforms = (game.platforms||[]).slice(0,4).map(p => {
    if (/pc|windows/i.test(p))    return '💻 PC';
    if (/playstation|ps/i.test(p)) return '🎮 PS';
    if (/xbox/i.test(p))          return '🟢 Xbox';
    if (/nintendo|switch/i.test(p))return '🔴 Switch';
    if (/mac/i.test(p))           return '🍎 Mac';
    if (/android|ios|mobile/i.test(p)) return '📱 모바일';
    return p.slice(0,10);
  });

  const summary = game.genres.length
    ? `${game.genres.slice(0,3).join(' · ')} 장르의 게임입니다.${game.released ? ` ${game.released} 출시.` : ''}`
    : '다양한 장르를 아우르는 게임입니다.';

  return (
    <div
      onClick={() => setFlipped(f => !f)}
      title="클릭하면 뒤집혀요"
      style={{
        perspective: 900,
        cursor: 'pointer',
        animationDelay: `${(idx%20)*0.03}s`,
        animation: 'fadeInUp 0.4s ease both',
      }}
    >
      <div style={{
        position: 'relative',
        width: '100%',
        paddingBottom: '170%',
        transformStyle: 'preserve-3d',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        transition: 'transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1)',
      }}>

        {/* 앞면 */}
        <div style={{
          position:'absolute', inset:0,
          backfaceVisibility:'hidden', WebkitBackfaceVisibility:'hidden',
          borderRadius:12, overflow:'hidden',
          border:`1px solid rgba(255,255,255,0.06)`,
          boxShadow: flipped ? 'none' : '0 4px 20px rgba(0,0,0,0.3)',
        }}>
          <img src={game.img} alt={game.name} loading="lazy" decoding="async"
            style={{ width:'100%', height:'75%', objectFit:'cover', display:'block' }}
            onError={e=>{e.currentTarget.src=`https://picsum.photos/seed/${game.id}/200/280`;}}
          />
          <div style={{ position:'absolute', top:0, left:0, right:0, height:'75%', background:'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)', pointerEvents:'none' }}>
            {mc && (
              <div style={{ position:'absolute', top:8, right:8, background:mcCol.bg, border:`1px solid ${mcCol.border}`, borderRadius:6, padding:'3px 7px', display:'flex', flexDirection:'column', alignItems:'center', backdropFilter:'blur(6px)' }}>
                <span style={{ fontFamily:'Rajdhani', fontWeight:700, fontSize:15, color:mcCol.text, lineHeight:1 }}>{mc}</span>
                <span style={{ fontSize:7, color:mcCol.text, opacity:0.8 }}>META</span>
              </div>
            )}
            {game.genres[0] && (
              <div style={{ position:'absolute', bottom:8, left:8, fontSize:9, fontWeight:700, background:color+'22', border:`1px solid ${color}55`, color, borderRadius:4, padding:'2px 6px', fontFamily:'Rajdhani', textTransform:'uppercase', letterSpacing:0.5 }}>{game.genres[0]}</div>
            )}
          </div>
          <div style={{ height:'25%', background:'#161824', borderTop:`2px solid ${color}44`, display:'flex', flexDirection:'column', justifyContent:'center', padding:'0 10px' }}>
            <div style={{ fontSize:11, fontWeight:600, color:'#e2e4ed', fontFamily:'Noto Sans KR', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:3 }} title={game.name}>{game.name}</div>
            {game.rating && (
              <div style={{ position:'relative', height:3, background:'rgba(255,255,255,0.08)', borderRadius:999 }}>
                <div style={{ position:'absolute', left:0, top:0, height:'100%', width:`${(game.rating/5)*100}%`, background:color, borderRadius:999 }}/>
              </div>
            )}
            <div style={{ fontSize:9, color:'#5a5f78', marginTop:3, fontFamily:'Noto Sans KR' }}>클릭해서 상세 정보 보기 ↩</div>
          </div>
        </div>

        {/* 뒷면 */}
        <div style={{
          position:'absolute', inset:0,
          backfaceVisibility:'hidden', WebkitBackfaceVisibility:'hidden',
          transform:'rotateY(180deg)',
          borderRadius:12, overflow:'hidden',
          background:'linear-gradient(160deg, #161824 0%, #0e1020 100%)',
          border:`1px solid ${color}44`,
          boxShadow: flipped ? `0 8px 30px rgba(0,0,0,0.4), 0 0 0 1px ${color}22` : 'none',
          padding:'16px 14px',
          display:'flex', flexDirection:'column', gap:10,
        }}>
          <div style={{ fontFamily:'Noto Sans KR', fontWeight:700, fontSize:13, color:'#e2e4ed', lineHeight:1.4 }}>{game.name}</div>

          {mc && (
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ background:mcCol.bg, border:`1px solid ${mcCol.border}`, borderRadius:6, padding:'4px 10px', fontFamily:'Rajdhani', fontWeight:700, fontSize:18, color:mcCol.text }}>
                {mc} <span style={{ fontSize:10, opacity:0.8 }}>META</span>
              </div>
            </div>
          )}

          {game.released && (
            <div style={{ fontSize:11, color:'#8a8fa8', fontFamily:'Noto Sans KR' }}>
              <span style={{ color:'#5a5f78' }}>출시일</span><br/>
              <span style={{ color:'#c8cce0', fontWeight:600 }}>📅 {game.released}</span>
            </div>
          )}

          {game.genres.length > 0 && (
            <div style={{ fontSize:11, fontFamily:'Noto Sans KR' }}>
              <span style={{ color:'#5a5f78' }}>장르</span><br/>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:4 }}>
                {game.genres.slice(0,4).map(g => (
                  <span key={g} style={{ fontSize:10, padding:'2px 7px', borderRadius:4, background:GENRE_COLOR[g]?`${GENRE_COLOR[g]}22`:'rgba(255,255,255,0.06)', color:GENRE_COLOR[g]||'#8a8fa8', border:`1px solid ${GENRE_COLOR[g]||'rgba(255,255,255,0.1)'}44` }}>{g}</span>
                ))}
              </div>
            </div>
          )}

          {platforms.length > 0 && (
            <div style={{ fontSize:11, fontFamily:'Noto Sans KR' }}>
              <span style={{ color:'#5a5f78' }}>플랫폼</span><br/>
              <div style={{ display:'flex', flexWrap:'wrap', gap:3, marginTop:4 }}>
                {[...new Set(platforms)].map(p => (
                  <span key={p} style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background:'rgba(255,255,255,0.05)', color:'#c8cce0', border:'1px solid rgba(255,255,255,0.1)' }}>{p}</span>
                ))}
              </div>
            </div>
          )}

          <div style={{ fontSize:11, color:'#8a8fa8', lineHeight:1.6, fontFamily:'Noto Sans KR', marginTop:'auto' }}>{summary}</div>
          <div style={{ fontSize:10, color:'#3a3d52', textAlign:'center', marginTop:4 }}>↩ 다시 클릭하면 앞면</div>
        </div>
      </div>
    </div>
  );
}

function useSentinel(cb, enabled) {
  const ref = useRef(null);
  useEffect(() => {
    if (!enabled||!ref.current) return;
    const ob = new IntersectionObserver(([e])=>{ if(e.isIntersecting) cb(); },{ rootMargin:'300px' });
    ob.observe(ref.current);
    return ()=>ob.disconnect();
  },[cb,enabled]);
  return ref;
}

export default function GameList({ fullPage=false }) {
  const { games, loading, loadingMore, offline, hasMore, loadMore, totalCount } = useRawgGames();
  const sentinelRef = useSentinel(loadMore, hasMore && !loadingMore && !loading && fullPage);

  const [aiResults,  setAiResults]  = useState(null);  // null=전체, []~=AI결과
  const [aiQuery,    setAiQuery]    = useState('');

  const displayAll   = fullPage ? games : games.slice(0, 10); // 홈 5행×2col=10
  const displayGames = aiResults !== null ? aiResults : displayAll;

  return (
    <>
      <OfflineToast show={offline} />

      <div className="card p-5 mb-8">
        {/* 헤더 */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          <span className="section-title">{fullPage ? '전체 게임 목록' : '이달의 인기 게임'}</span>
          {offline
            ? <span style={{ fontSize:11, background:'rgba(245,166,35,0.12)', color:'#f5a623', border:'1px solid rgba(245,166,35,0.3)', padding:'2px 8px', borderRadius:999 }}>오프라인 모드</span>
            : <span style={{ fontSize:11, background:'rgba(74,158,255,0.1)', color:'#4a9eff', border:'1px solid rgba(74,158,255,0.25)', padding:'2px 8px', borderRadius:999 }}>RAWG API</span>
          }
          {totalCount>0 && <span style={{ fontSize:11, color:'#5a5f78', fontFamily:'Noto Sans KR' }}>총 {totalCount.toLocaleString()}개</span>}
          <span style={{ marginLeft:'auto', fontSize:11, color:'#5a5f78', fontFamily:'Noto Sans KR' }}>{!loading&&`${games.length}개 로드됨`}</span>
        </div>

        {/* AI 검색바 (항상 표시) */}
        {games.length > 0 && (
          <AISearchBar
            games={games}
            onResult={(r, q) => { setAiResults(r); setAiQuery(q); }}
            onReset={() => { setAiResults(null); setAiQuery(''); }}
          />
        )}

        {/* AI 결과 안내 */}
        {aiResults !== null && (
          <div style={{ marginBottom:14, padding:'10px 14px', background:'rgba(124,92,252,0.08)', border:'1px solid rgba(124,92,252,0.25)', borderRadius:8, fontSize:13, color:'#9b7ffe', fontFamily:'Noto Sans KR' }}>
            🤖 "{aiQuery}" 검색 결과: <strong>{aiResults.length}개</strong> 게임
            {aiResults.length===0 && ' — 조건에 맞는 게임이 없습니다. 다른 키워드를 시도해보세요.'}
          </div>
        )}

        {/* 그리드: 5행 × 자동 열 */}
        <div style={{
          display:'grid',
          gridTemplateColumns: fullPage ? 'repeat(auto-fill, minmax(160px,1fr))' : 'repeat(5, 1fr)',
          gap:14,
        }}>
          {displayGames.map((game,idx) => <FlipCard key={game.id} game={game} idx={idx} />)}
          {(loading||(loadingMore&&fullPage)) && Array.from({length:fullPage?10:5}).map((_,i)=><SkeletonCard key={`sk-${i}`}/>)}
        </div>

        {fullPage && <div ref={sentinelRef} style={{height:1,marginTop:16}}/>}
        {fullPage&&!hasMore&&!loading&&games.length>0 && <div style={{textAlign:'center',marginTop:24,fontSize:12,color:'#3a3d52',fontFamily:'Noto Sans KR'}}>— {games.length}개 게임을 모두 불러왔습니다 —</div>}
        {fullPage&&loadingMore && <div style={{textAlign:'center',marginTop:12,fontSize:12,color:'#4a9eff'}}><span style={{display:'inline-block',animation:'spin 0.8s linear infinite'}}>⟳</span> 불러오는 중...</div>}
      </div>

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
      `}</style>
    </>
  );
}
