import { useEffect, useRef, useState } from 'react';
import { useRawgGames } from '../hooks/useRawgGames';
import SkeletonCard from './SkeletonCard';
import OfflineToast from './OfflineToast';

const GENRE_COLOR = {
  'Action':'#ff4757','RPG':'#7c5cfc','Shooter':'#f5a623','Strategy':'#4a9eff',
  'Adventure':'#00d68f','Sports':'#ff6b35','Racing':'#f99312','Puzzle':'#00e5ff',
  'Simulation':'#a0d468','Fighting':'#c8a84b','Arcade':'#ff9ff3','Platformer':'#54a0ff',
  'Indie':'#5f27cd','Casual':'#00d2d3','Card':'#ff9f43','Massively Multiplayer':'#00e5ff',
};
function getGenreColor(genres=[]) { for(const g of genres) if(GENRE_COLOR[g]) return GENRE_COLOR[g]; return '#4a9eff'; }
function metaColor(s) {
  if(s>=75) return {bg:'rgba(0,214,143,0.18)',border:'rgba(0,214,143,0.5)',text:'#00d68f'};
  if(s>=50) return {bg:'rgba(245,166,35,0.18)',border:'rgba(245,166,35,0.5)',text:'#f5a623'};
  return {bg:'rgba(255,71,87,0.18)',border:'rgba(255,71,87,0.5)',text:'#ff4757'};
}

// ── 게임 구매 링크 ──────────────────────────────────────────────────
const STORE_LINKS = [
  { name:'Steam',    icon:'🟦', color:'#1b2838', textColor:'#c7d5e0', url:(n)=>`https://store.steampowered.com/search/?term=${encodeURIComponent(n)}` },
  { name:'Epic',     icon:'⬛', color:'#2d2d2d', textColor:'#fff',    url:(n)=>`https://store.epicgames.com/browse?q=${encodeURIComponent(n)}` },
  { name:'블리자드',  icon:'💙', color:'#00aeff', textColor:'#fff',    url:(n)=>`https://us.battle.net/shop/en/catalog?f.productTypes=game&q=${encodeURIComponent(n)}` },
  { name:'GOG',      icon:'🟣', color:'#6d318b', textColor:'#fff',    url:(n)=>`https://www.gog.com/games?search=${encodeURIComponent(n)}` },
];

// ── 카테고리 정의 ────────────────────────────────────────────────────
const CATEGORIES = [
  { id:'all',        label:'전체',       icon:'🎮', filter:()=>true },
  { id:'fps',        label:'FPS',        icon:'🔫', filter:(g)=>g.genres.some(x=>/Shooter/i.test(x)) || g.tags?.includes('fps') },
  { id:'rpg',        label:'RPG',        icon:'⚔️',  filter:(g)=>g.genres.some(x=>/RPG/i.test(x)) },
  { id:'multi',      label:'멀티플레이',  icon:'👥', filter:(g)=>g.genres.some(x=>/Massively Multiplayer/i.test(x)) || g.tags?.includes('multiplayer') },
  { id:'action',     label:'액션',       icon:'💥', filter:(g)=>g.genres.some(x=>/Action/i.test(x)) },
  { id:'strategy',   label:'전략',       icon:'🧠', filter:(g)=>g.genres.some(x=>/Strategy/i.test(x)) },
  { id:'adventure',  label:'어드벤처',   icon:'🗺️',  filter:(g)=>g.genres.some(x=>/Adventure/i.test(x)) },
  { id:'sports',     label:'스포츠',     icon:'⚽', filter:(g)=>g.genres.some(x=>/Sports|Racing/i.test(x)) },
  { id:'indie',      label:'인디',       icon:'🎨', filter:(g)=>g.genres.some(x=>/Indie/i.test(x)) },
];

// ── 게임 태그 매핑 ───────────────────────────────────────────────────
function getGameTags(game) {
  const tags = [];
  const name = (game.name||'').toLowerCase();
  const genres = game.genres||[];

  if (genres.some(g=>/Shooter/i.test(g))) tags.push({ label:'FPS', color:'#f5a623' });
  if (genres.some(g=>/RPG/i.test(g))) tags.push({ label:'RPG', color:'#7c5cfc' });
  if (genres.some(g=>/Massively Multiplayer/i.test(g))) tags.push({ label:'멀티', color:'#00d68f' });
  if (genres.some(g=>/Action/i.test(g)) && !tags.find(t=>t.label==='FPS')) tags.push({ label:'액션', color:'#ff4757' });
  if (genres.some(g=>/Strategy/i.test(g))) tags.push({ label:'전략', color:'#4a9eff' });
  if (genres.some(g=>/Adventure/i.test(g))) tags.push({ label:'어드벤처', color:'#00d68f' });
  if (genres.some(g=>/Sports/i.test(g))) tags.push({ label:'스포츠', color:'#ff6b35' });
  if (genres.some(g=>/Racing/i.test(g))) tags.push({ label:'레이싱', color:'#f99312' });
  if (genres.some(g=>/Indie/i.test(g))) tags.push({ label:'인디', color:'#5f27cd' });
  if (genres.some(g=>/Puzzle/i.test(g))) tags.push({ label:'퍼즐', color:'#00e5ff' });
  if (genres.some(g=>/Simulation/i.test(g))) tags.push({ label:'시뮬', color:'#a0d468' });

  // 멀티플레이 추가 감지
  if (/multiplayer|online|warzone|apex|fortnite|pubg|overwatch|valorant|rainbow|battlefield|cod|call of duty/i.test(name)) {
    if (!tags.find(t=>t.label==='멀티')) tags.push({ label:'멀티', color:'#00d68f' });
  }
  if (/fps|first.person|counter.strike|cs2|valorant|rainbow/i.test(name)) {
    if (!tags.find(t=>t.label==='FPS')) tags.push({ label:'FPS', color:'#f5a623' });
  }
  if (/rpg|witcher|elder.scroll|baldur|cyberpunk|elden|dark.soul|final.fantasy/i.test(name)) {
    if (!tags.find(t=>t.label==='RPG')) tags.push({ label:'RPG', color:'#7c5cfc' });
  }
  return tags.slice(0, 3);
}

// ── AI 추천 (개선된 버전) ────────────────────────────────────────────
const AI_KEYWORD_MAP = {
  'fps': { genres:['Shooter'], nameKeywords:['fps','first-person','counter-strike','cs2','valorant','rainbow','warzone','apex','battlefield','cod','call of duty'] },
  '슈터': { genres:['Shooter'], nameKeywords:[] },
  'rpg': { genres:['RPG'], nameKeywords:['rpg','witcher','elder','baldur','cyberpunk','elden','dark souls','final fantasy','diablo'] },
  '롤플레잉': { genres:['RPG'], nameKeywords:[] },
  '멀티': { genres:['Massively Multiplayer'], nameKeywords:['multiplayer','online','co-op','warzone','apex','fortnite','pubg','overwatch','valorant'] },
  '멀티플레이': { genres:['Massively Multiplayer'], nameKeywords:['multiplayer','online','co-op'] },
  'multiplayer': { genres:['Massively Multiplayer'], nameKeywords:['multiplayer','online'] },
  '액션': { genres:['Action'], nameKeywords:['action'] },
  'action': { genres:['Action'], nameKeywords:[] },
  '전략': { genres:['Strategy'], nameKeywords:['strategy','civilization','command','rts'] },
  'strategy': { genres:['Strategy'], nameKeywords:[] },
  '인디': { genres:['Indie'], nameKeywords:['indie'] },
  'indie': { genres:['Indie'], nameKeywords:[] },
  '스포츠': { genres:['Sports'], nameKeywords:['fifa','nba','football','soccer','baseball'] },
  '레이싱': { genres:['Racing'], nameKeywords:['racing','race','drift','gran turismo','forza'] },
  '어드벤처': { genres:['Adventure'], nameKeywords:['adventure','quest','journey'] },
  '퍼즐': { genres:['Puzzle'], nameKeywords:['puzzle','tetris'] },
  '무료': { genres:[], nameKeywords:['free','f2p'] },
  '친구': { genres:['Massively Multiplayer'], nameKeywords:['multiplayer','co-op','party'] },
  '같이': { genres:['Massively Multiplayer'], nameKeywords:['multiplayer','co-op'] },
  'cooperative': { genres:['Massively Multiplayer'], nameKeywords:['co-op','cooperative'] },
};

async function fetchAIRecommendation(query, games) {
  await new Promise(r => setTimeout(r, 1000));
  const q = query.toLowerCase().trim();
  const words = q.split(/\s+/);

  let matchedGenres = new Set();
  let matchedNameKeys = new Set();

  words.forEach(word => {
    Object.keys(AI_KEYWORD_MAP).forEach(key => {
      if (word.includes(key) || key.includes(word)) {
        AI_KEYWORD_MAP[key].genres.forEach(g => matchedGenres.add(g));
        AI_KEYWORD_MAP[key].nameKeywords.forEach(k => matchedNameKeys.add(k));
      }
    });
  });

  // 직접 키워드 매칭도 추가
  words.forEach(w => { if (w.length > 1) matchedNameKeys.add(w); });

  return games.filter(g => {
    const nameLower = (g.name||'').toLowerCase();
    const genreMatch = matchedGenres.size > 0 && g.genres.some(genre =>
      [...matchedGenres].some(mg => genre.toLowerCase().includes(mg.toLowerCase()))
    );
    const nameMatch = [...matchedNameKeys].some(k => k.length > 1 && nameLower.includes(k));
    return genreMatch || nameMatch;
  }).slice(0, 20);
}

function AISearchBar({ games, onResult, onReset }) {
  const [query,    setQuery]   = useState('');
  const [loading,  setLoading] = useState(false);
  const [progress, setProgress]= useState(0);

  const handleSearch = async () => {
    if (!query.trim() || loading) return;
    setLoading(true); setProgress(0);
    const iv = setInterval(() => setProgress(p => Math.min(p+12, 90)), 100);
    try {
      const results = await fetchAIRecommendation(query, games);
      clearInterval(iv); setProgress(100);
      setTimeout(() => { setLoading(false); onResult(results, query); }, 300);
    } catch {
      clearInterval(iv); setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:12, color:'#8a8fa8', marginBottom:8, fontFamily:'Noto Sans KR' }}>
        🤖 AI 게임 추천
        <span style={{ fontSize:10, color:'#5a5f78', marginLeft:6 }}>FPS · RPG · 멀티플레이 · 액션 · 전략 등 검색</span>
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSearch()}
          placeholder='예) "FPS" "RPG" "멀티플레이" "친구랑 같이 할 게임"'
          style={{ flex:1, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(124,92,252,0.3)', borderRadius:8, color:'#e2e4ed', padding:'10px 14px', fontSize:13, fontFamily:'Noto Sans KR', outline:'none' }}
          onFocus={e=>e.currentTarget.style.borderColor='#7c5cfc'} onBlur={e=>e.currentTarget.style.borderColor='rgba(124,92,252,0.3)'}
        />
        <button onClick={handleSearch} disabled={loading} style={{ padding:'10px 20px', background:'linear-gradient(135deg,#7c5cfc,#4a9eff)', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:700, cursor:loading?'wait':'pointer', fontFamily:'Noto Sans KR', opacity:loading?0.7:1, whiteSpace:'nowrap' }}>
          {loading ? '분석 중...' : '🔍 AI 추천'}
        </button>
        <button onClick={()=>{ onReset(); setQuery(''); }} style={{ padding:'10px 14px', background:'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#8a8fa8', fontSize:13, cursor:'pointer', fontFamily:'Noto Sans KR' }}>전체</button>
      </div>
      {loading && (
        <div style={{ marginTop:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <span style={{ fontSize:12, color:'#7c5cfc', fontFamily:'Noto Sans KR', animation:'pulse 1s ease infinite' }}>🤖 AI가 취향을 분석 중입니다...</span>
          </div>
          <div style={{ height:4, background:'rgba(255,255,255,0.06)', borderRadius:999, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${progress}%`, background:'linear-gradient(90deg,#7c5cfc,#4a9eff)', borderRadius:999, transition:'width 0.1s ease' }}/>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 카테고리 필터 바 ─────────────────────────────────────────────────
function CategoryBar({ selected, onSelect, gameCounts }) {
  return (
    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
      {CATEGORIES.map(cat => (
        <button key={cat.id} onClick={()=>onSelect(cat.id)}
          style={{
            padding:'6px 14px', borderRadius:20, fontSize:12, fontFamily:'Noto Sans KR', cursor:'pointer',
            fontWeight: selected===cat.id ? 700 : 400,
            background: selected===cat.id ? 'linear-gradient(135deg,#7c5cfc,#4a9eff)' : 'rgba(255,255,255,0.04)',
            border: selected===cat.id ? '1px solid transparent' : '1px solid rgba(255,255,255,0.1)',
            color: selected===cat.id ? '#fff' : '#8a8fa8',
            transition:'all 0.2s',
          }}
          onMouseEnter={e=>{ if(selected!==cat.id) e.currentTarget.style.borderColor='rgba(124,92,252,0.4)'; }}
          onMouseLeave={e=>{ if(selected!==cat.id) e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; }}
        >
          {cat.icon} {cat.label}
          {gameCounts[cat.id] !== undefined && (
            <span style={{ marginLeft:4, fontSize:10, opacity:0.7 }}>({gameCounts[cat.id]})</span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── 구매 링크 버튼 ───────────────────────────────────────────────────
function StoreButtons({ gameName }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ marginTop:8 }} onClick={e=>e.stopPropagation()}>
      <button
        onClick={()=>setExpanded(e=>!e)}
        style={{ width:'100%', padding:'6px 8px', background:'rgba(74,158,255,0.12)', border:'1px solid rgba(74,158,255,0.3)', borderRadius:6, color:'#4a9eff', fontSize:10, fontFamily:'Noto Sans KR', cursor:'pointer', fontWeight:600, transition:'all 0.2s' }}
        onMouseEnter={e=>e.currentTarget.style.background='rgba(74,158,255,0.2)'}
        onMouseLeave={e=>e.currentTarget.style.background='rgba(74,158,255,0.12)'}
      >
        🛒 구매 링크 {expanded ? '▲' : '▼'}
      </button>
      {expanded && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4, marginTop:4 }}>
          {STORE_LINKS.map(store => (
            <a key={store.name} href={store.url(gameName)} target="_blank" rel="noopener noreferrer"
              style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 7px', background:store.color+'33', border:`1px solid ${store.color}55`, borderRadius:5, color:store.textColor, fontSize:10, fontFamily:'Noto Sans KR', textDecoration:'none', fontWeight:600, transition:'all 0.2s' }}
              onMouseEnter={e=>{ e.currentTarget.style.background=store.color+'55'; e.currentTarget.style.transform='scale(1.03)'; }}
              onMouseLeave={e=>{ e.currentTarget.style.background=store.color+'33'; e.currentTarget.style.transform='scale(1)'; }}
            >
              {store.icon} {store.name}
            </a>
          ))}
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
  const tags   = getGameTags(game);

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
            style={{ width:'100%', height:'65%', objectFit:'cover', display:'block' }}
            onError={e=>{e.currentTarget.src=`https://picsum.photos/seed/${game.id}/200/280`;}}
          />
          <div style={{ position:'absolute', top:0, left:0, right:0, height:'65%', background:'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)', pointerEvents:'none' }}>
            {mc && (
              <div style={{ position:'absolute', top:8, right:8, background:mcCol.bg, border:`1px solid ${mcCol.border}`, borderRadius:6, padding:'3px 7px', display:'flex', flexDirection:'column', alignItems:'center', backdropFilter:'blur(6px)' }}>
                <span style={{ fontFamily:'Rajdhani', fontWeight:700, fontSize:15, color:mcCol.text, lineHeight:1 }}>{mc}</span>
                <span style={{ fontSize:7, color:mcCol.text, opacity:0.8 }}>META</span>
              </div>
            )}
            {/* 태그 */}
            {tags.length > 0 && (
              <div style={{ position:'absolute', top:8, left:8, display:'flex', flexDirection:'column', gap:3 }}>
                {tags.slice(0,2).map(tag=>(
                  <span key={tag.label} style={{ fontSize:9, fontWeight:700, background:tag.color+'33', border:`1px solid ${tag.color}66`, color:tag.color, borderRadius:4, padding:'2px 5px', fontFamily:'Rajdhani', textTransform:'uppercase', letterSpacing:0.5, backdropFilter:'blur(4px)' }}>{tag.label}</span>
                ))}
              </div>
            )}
          </div>
          <div style={{ height:'35%', background:'#161824', borderTop:`2px solid ${color}44`, display:'flex', flexDirection:'column', justifyContent:'center', padding:'6px 10px' }}>
            <div style={{ fontSize:11, fontWeight:600, color:'#e2e4ed', fontFamily:'Noto Sans KR', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:3 }} title={game.name}>{game.name}</div>
            {game.rating && (
              <div style={{ position:'relative', height:3, background:'rgba(255,255,255,0.08)', borderRadius:999, marginBottom:4 }}>
                <div style={{ position:'absolute', left:0, top:0, height:'100%', width:`${(game.rating/5)*100}%`, background:color, borderRadius:999 }}/>
              </div>
            )}
            {/* 구매 링크 버튼 */}
            <StoreButtons gameName={game.name} />
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
          display:'flex', flexDirection:'column', gap:8,
          overflowY:'auto',
        }}>
          <div style={{ fontFamily:'Noto Sans KR', fontWeight:700, fontSize:13, color:'#e2e4ed', lineHeight:1.4 }}>{game.name}</div>

          {/* 태그 */}
          {tags.length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
              {tags.map(tag=>(
                <span key={tag.label} style={{ fontSize:10, padding:'2px 7px', borderRadius:4, background:tag.color+'22', color:tag.color, border:`1px solid ${tag.color}44`, fontFamily:'Rajdhani', fontWeight:700 }}>{tag.label}</span>
              ))}
            </div>
          )}

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
              <span style={{ color:'#5a5f78' }}>장르</span>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:4 }}>
                {game.genres.slice(0,4).map(g => (
                  <span key={g} style={{ fontSize:10, padding:'2px 7px', borderRadius:4, background:GENRE_COLOR[g]?`${GENRE_COLOR[g]}22`:'rgba(255,255,255,0.06)', color:GENRE_COLOR[g]||'#8a8fa8', border:`1px solid ${GENRE_COLOR[g]||'rgba(255,255,255,0.1)'}44` }}>{g}</span>
                ))}
              </div>
            </div>
          )}

          {platforms.length > 0 && (
            <div style={{ fontSize:11, fontFamily:'Noto Sans KR' }}>
              <span style={{ color:'#5a5f78' }}>플랫폼</span>
              <div style={{ display:'flex', flexWrap:'wrap', gap:3, marginTop:4 }}>
                {[...new Set(platforms)].map(p => (
                  <span key={p} style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background:'rgba(255,255,255,0.05)', color:'#c8cce0', border:'1px solid rgba(255,255,255,0.1)' }}>{p}</span>
                ))}
              </div>
            </div>
          )}

          <div style={{ fontSize:11, color:'#8a8fa8', lineHeight:1.6, fontFamily:'Noto Sans KR', marginTop:'auto' }}>{summary}</div>

          {/* 뒷면 구매 링크 */}
          <div onClick={e=>e.stopPropagation()} style={{ marginTop:4 }}>
            <div style={{ fontSize:10, color:'#5a5f78', marginBottom:5, fontFamily:'Noto Sans KR' }}>🛒 구매하기</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
              {STORE_LINKS.map(store => (
                <a key={store.name} href={store.url(game.name)} target="_blank" rel="noopener noreferrer"
                  style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 7px', background:store.color+'33', border:`1px solid ${store.color}55`, borderRadius:5, color:store.textColor, fontSize:10, fontFamily:'Noto Sans KR', textDecoration:'none', fontWeight:600 }}
                  onMouseEnter={e=>e.currentTarget.style.background=store.color+'55'}
                  onMouseLeave={e=>e.currentTarget.style.background=store.color+'33'}
                >
                  {store.icon} {store.name}
                </a>
              ))}
            </div>
          </div>

          <div style={{ fontSize:10, color:'#3a3d52', textAlign:'center' }}>↩ 다시 클릭하면 앞면</div>
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

  const [aiResults,  setAiResults]  = useState(null);
  const [aiQuery,    setAiQuery]    = useState('');
  const [category,   setCategory]   = useState('all');

  const displayAll = fullPage ? games : games.slice(0, 10);

  // 카테고리 필터 적용
  const categoryFiltered = category === 'all'
    ? displayAll
    : displayAll.filter(CATEGORIES.find(c=>c.id===category)?.filter || (()=>true));

  // AI 결과가 있으면 AI 결과에서 카테고리 필터 적용
  const displayGames = aiResults !== null
    ? (category === 'all' ? aiResults : aiResults.filter(CATEGORIES.find(c=>c.id===category)?.filter || (()=>true)))
    : categoryFiltered;

  // 카테고리별 게임 수 계산
  const gameCounts = {};
  CATEGORIES.forEach(cat => {
    gameCounts[cat.id] = cat.id === 'all' ? displayAll.length : displayAll.filter(cat.filter).length;
  });

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

        {/* 카테고리 바 */}
        {fullPage && games.length > 0 && (
          <CategoryBar selected={category} onSelect={setCategory} gameCounts={gameCounts} />
        )}

        {/* AI 검색바 */}
        {games.length > 0 && (
          <AISearchBar
            games={displayAll}
            onResult={(r, q) => { setAiResults(r); setAiQuery(q); }}
            onReset={() => { setAiResults(null); setAiQuery(''); }}
          />
        )}

        {/* AI 결과 안내 */}
        {aiResults !== null && (
          <div style={{ marginBottom:14, padding:'10px 14px', background:'rgba(124,92,252,0.08)', border:'1px solid rgba(124,92,252,0.25)', borderRadius:8, fontSize:13, color:'#9b7ffe', fontFamily:'Noto Sans KR' }}>
            🤖 "{aiQuery}" 검색 결과: <strong>{displayGames.length}개</strong> 게임
            {displayGames.length===0 && ' — 조건에 맞는 게임이 없습니다. 다른 키워드를 시도해보세요.'}
          </div>
        )}

        {/* 5열 그리드 */}
        <div style={{
          display:'grid',
          gridTemplateColumns: fullPage ? 'repeat(5, 1fr)' : 'repeat(5, 1fr)',
          gap:16,
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
