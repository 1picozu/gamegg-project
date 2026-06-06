import { useState, useEffect, useRef } from 'react';

const RAWG_KEY = import.meta.env.VITE_RAWG_API_KEY || '';
const BASE = 'https://api.rawg.io/api';

const STORE_LINKS = [
  { name:'Steam',    icon:'🟦', color:'#1b2838', url:(n)=>`https://store.steampowered.com/search/?term=${encodeURIComponent(n)}` },
  { name:'Epic',     icon:'⬛', color:'#333',    url:(n)=>`https://store.epicgames.com/browse?q=${encodeURIComponent(n)}` },
  { name:'블리자드',  icon:'💙', color:'#0080ff', url:(n)=>`https://us.battle.net/shop/en/catalog?q=${encodeURIComponent(n)}` },
  { name:'GOG',      icon:'🟣', color:'#6d318b', url:(n)=>`https://www.gog.com/games?search=${encodeURIComponent(n)}` },
  { name:'PlayStation', icon:'🎮', color:'#003087', url:(n)=>`https://store.playstation.com/search/${encodeURIComponent(n)}` },
  { name:'Xbox',     icon:'🟢', color:'#107c10', url:(n)=>`https://www.xbox.com/search?q=${encodeURIComponent(n)}` },
];

// ── RAWG 상세 데이터 fetch ─────────────────────────────────────────
async function fetchGameDetail(id) {
  const [detail, screenshots, movies, additions] = await Promise.allSettled([
    fetch(`${BASE}/games/${id}?key=${RAWG_KEY}`).then(r=>r.json()),
    fetch(`${BASE}/games/${id}/screenshots?key=${RAWG_KEY}&page_size=8`).then(r=>r.json()),
    fetch(`${BASE}/games/${id}/movies?key=${RAWG_KEY}`).then(r=>r.json()),
    fetch(`${BASE}/games/${id}/additions?key=${RAWG_KEY}&page_size=5`).then(r=>r.json()),
  ]);
  return {
    detail:      detail.status==='fulfilled'      ? detail.value      : null,
    screenshots: screenshots.status==='fulfilled' ? screenshots.value?.results||[] : [],
    movies:      movies.status==='fulfilled'      ? movies.value?.results||[]      : [],
    additions:   additions.status==='fulfilled'   ? additions.value?.results||[]   : [],
  };
}

// ── Anthropic AI 정보 수집 ────────────────────────────────────────
async function fetchAIGameInfo(gameName, genres) {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages:[{
          role:'user',
          content: `게임 "${gameName}" (장르: ${genres.join(', ')})에 대해 다음을 한국어로 간결하게 알려줘. JSON만 반환해:
{
  "summary": "2-3문장 게임 소개",
  "features": ["핵심 특징 3가지"],
  "tips": ["플레이 팁 3가지"],
  "similar": ["비슷한 게임 3가지"],
  "verdict": "한줄 총평"
}`
        }]
      })
    });
    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    const clean = text.replace(/```json|```/g,'').trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

// ── 별점 컴포넌트 ─────────────────────────────────────────────────
function Stars({ rating, max=5 }) {
  const pct = (rating/max)*100;
  return (
    <div style={{ position:'relative', display:'inline-block', fontSize:18 }}>
      <span style={{ color:'rgba(255,255,255,0.15)' }}>{'★'.repeat(5)}</span>
      <span style={{ position:'absolute', left:0, top:0, overflow:'hidden', width:`${pct}%`, color:'#f5a623', whiteSpace:'nowrap' }}>{'★'.repeat(5)}</span>
    </div>
  );
}

// ── 메타크리틱 뱃지 ──────────────────────────────────────────────
function MetaBadge({ score }) {
  if (!score) return null;
  const color = score>=75?'#00d68f':score>=50?'#f5a623':'#ff4757';
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', background:`${color}18`, border:`2px solid ${color}`, borderRadius:8, padding:'8px 14px', minWidth:60 }}>
      <span style={{ fontFamily:'Rajdhani', fontWeight:700, fontSize:28, color, lineHeight:1 }}>{score}</span>
      <span style={{ fontSize:9, color, opacity:0.8, fontWeight:700 }}>METACRITIC</span>
    </div>
  );
}

export default function GameDetailModal({ game, onClose }) {
  const [tab, setTab]           = useState('info');
  const [detail, setDetail]     = useState(null);
  const [screenshots, setScreenshots] = useState([]);
  const [movies, setMovies]     = useState([]);
  const [aiInfo, setAiInfo]     = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeImg, setActiveImg] = useState(game.img);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const modalRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // ESC 닫기
  useEffect(() => {
    const fn = (e) => { if(e.key==='Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  // RAWG 상세 데이터 로드
  useEffect(() => {
    fetchGameDetail(game.id).then(({ detail, screenshots, movies }) => {
      setDetail(detail);
      setScreenshots(screenshots);
      setMovies(movies);
      setLoadingDetail(false);
      if (screenshots.length > 0) setActiveImg(screenshots[0].image);
    });
  }, [game.id]);

  // AI 정보 (info 탭 클릭 시 로드)
  useEffect(() => {
    if (tab === 'ai' && !aiInfo && !aiLoading) {
      setAiLoading(true);
      fetchAIGameInfo(game.name, game.genres).then(info => {
        setAiInfo(info);
        setAiLoading(false);
      });
    }
  }, [tab]);

  const platforms = (game.platforms||[]).slice(0,6).map(p=>{
    if(/pc|windows/i.test(p)) return {label:'PC', icon:'💻'};
    if(/playstation5/i.test(p)) return {label:'PS5', icon:'🎮'};
    if(/playstation4/i.test(p)) return {label:'PS4', icon:'🎮'};
    if(/playstation/i.test(p)) return {label:'PlayStation', icon:'🎮'};
    if(/xbox series/i.test(p)) return {label:'Xbox Series', icon:'🟢'};
    if(/xbox/i.test(p)) return {label:'Xbox', icon:'🟢'};
    if(/nintendo|switch/i.test(p)) return {label:'Switch', icon:'🔴'};
    if(/mac/i.test(p)) return {label:'Mac', icon:'🍎'};
    if(/android|ios|mobile/i.test(p)) return {label:'모바일', icon:'📱'};
    return {label:p.slice(0,10), icon:'🕹️'};
  });

  const TABS = [
    { id:'info',    label:'게임 정보', icon:'📋' },
    { id:'media',   label:'미디어',    icon:'🎬' },
    { id:'ai',      label:'AI 분석',   icon:'🤖' },
    { id:'buy',     label:'구매',      icon:'🛒' },
  ];

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', backdropFilter:'blur(8px)' }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}
    >
      <div ref={modalRef}
        style={{ background:'#111320', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, width:'100%', maxWidth:1000, maxHeight:'92vh', overflow:'hidden', display:'flex', flexDirection:'column', animation:'modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1)', boxShadow:'0 32px 80px rgba(0,0,0,0.7)' }}>

        {/* ── 히어로 섹션 ── */}
        <div style={{ position:'relative', height:260, flexShrink:0, overflow:'hidden' }}>
          <img src={activeImg} alt={game.name}
            style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
            onError={e=>e.currentTarget.src=`https://picsum.photos/seed/${game.id}/900/300`}
          />
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(17,19,32,0.95) 100%)' }}/>

          {/* 닫기 버튼 */}
          <button onClick={onClose} style={{ position:'absolute', top:16, right:16, width:36, height:36, borderRadius:'50%', background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)', zIndex:10 }}>✕</button>

          {/* 트레일러 재생 버튼 */}
          {movies.length > 0 && (
            <button onClick={()=>{ setTab('media'); }}
              style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:60, height:60, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'2px solid rgba(255,255,255,0.4)', color:'#fff', fontSize:22, cursor:'pointer', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.25)'}
              onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.15)'}
              title="트레일러 보기"
            >▶</button>
          )}

          {/* 게임 기본 정보 오버레이 */}
          <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'16px 24px', display:'flex', alignItems:'flex-end', gap:16, flexWrap:'wrap' }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:26, fontWeight:700, color:'#fff', fontFamily:'Noto Sans KR', lineHeight:1.2, textShadow:'0 2px 8px rgba(0,0,0,0.8)' }}>{game.name}</div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:6, flexWrap:'wrap' }}>
                {game.released && <span style={{ fontSize:12, color:'rgba(255,255,255,0.7)', fontFamily:'Noto Sans KR' }}>📅 {game.released}</span>}
                {game.rating && (
                  <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <Stars rating={game.rating}/>
                    <span style={{ fontSize:12, color:'rgba(255,255,255,0.7)' }}>{game.rating}</span>
                  </span>
                )}
                {game.genres.slice(0,3).map(g=>(
                  <span key={g} style={{ fontSize:11, padding:'2px 8px', background:'rgba(255,255,255,0.15)', borderRadius:20, color:'#fff', backdropFilter:'blur(4px)' }}>{g}</span>
                ))}
              </div>
            </div>
            <MetaBadge score={game.metacritic}/>
          </div>
        </div>

        {/* 썸네일 스트립 */}
        {screenshots.length > 0 && (
          <div style={{ display:'flex', gap:6, padding:'8px 24px', background:'#0d0f1a', overflowX:'auto', scrollbarWidth:'none', flexShrink:0 }}>
            {[{image:game.img}, ...screenshots].slice(0,8).map((s,i)=>(
              <img key={i} src={s.image} alt="" onClick={()=>setActiveImg(s.image)}
                style={{ width:80, height:50, objectFit:'cover', borderRadius:6, cursor:'pointer', flexShrink:0, border:`2px solid ${activeImg===s.image?'#7c5cfc':'transparent'}`, transition:'border-color 0.2s', opacity:activeImg===s.image?1:0.6 }}
              />
            ))}
          </div>
        )}

        {/* ── 탭 ── */}
        <div style={{ display:'flex', gap:0, borderBottom:'1px solid rgba(255,255,255,0.07)', flexShrink:0, background:'#111320' }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{ padding:'12px 20px', background:'transparent', border:'none', borderBottom:`2px solid ${tab===t.id?'#7c5cfc':'transparent'}`, color:tab===t.id?'#c8b4ff':'#5a5f78', fontSize:13, fontWeight:tab===t.id?700:400, cursor:'pointer', fontFamily:'Noto Sans KR', transition:'all 0.2s', marginBottom:-1, display:'flex', alignItems:'center', gap:5 }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── 탭 콘텐츠 ── */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>

          {/* ────── 게임 정보 탭 ────── */}
          {tab==='info' && (
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              {loadingDetail ? (
                <div style={{ textAlign:'center', padding:40, color:'#5a5f78', fontFamily:'Noto Sans KR' }}>게임 정보 불러오는 중...</div>
              ) : (
                <>
                  {/* 설명 */}
                  {detail?.description_raw && (
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:'#8a8fa8', marginBottom:8, fontFamily:'Noto Sans KR', textTransform:'uppercase', letterSpacing:1 }}>게임 소개</div>
                      <div style={{ fontSize:13, color:'#c8cce0', lineHeight:1.8, fontFamily:'Noto Sans KR' }}>
                        {detail.description_raw.slice(0,600)}{detail.description_raw.length>600?'...':''}
                      </div>
                    </div>
                  )}

                  {/* 플랫폼 */}
                  {platforms.length > 0 && (
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:'#8a8fa8', marginBottom:8, fontFamily:'Noto Sans KR', textTransform:'uppercase', letterSpacing:1 }}>지원 플랫폼</div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                        {[...new Map(platforms.map(p=>[p.label,p])).values()].map(p=>(
                          <span key={p.label} style={{ padding:'6px 14px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, fontSize:12, color:'#c8cce0', fontFamily:'Noto Sans KR', display:'flex', alignItems:'center', gap:5 }}>
                            {p.icon} {p.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 게임 통계 */}
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#8a8fa8', marginBottom:8, fontFamily:'Noto Sans KR', textTransform:'uppercase', letterSpacing:1 }}>게임 통계</div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:12 }}>
                      {[
                        { label:'평균 플레이타임', value: detail?.playtime ? `${detail.playtime}시간` : '-', icon:'⏱️' },
                        { label:'추가 수',          value: detail?.added?.toLocaleString() || '-',            icon:'🔖' },
                        { label:'리뷰 수',           value: detail?.reviews_count?.toLocaleString() || '-',   icon:'💬' },
                        { label:'평점',              value: game.rating ? `${game.rating} / 5` : '-',         icon:'⭐' },
                      ].map(stat=>(
                        <div key={stat.label} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'12px 14px' }}>
                          <div style={{ fontSize:18, marginBottom:4 }}>{stat.icon}</div>
                          <div style={{ fontSize:16, fontWeight:700, color:'#e2e4ed', fontFamily:'Rajdhani' }}>{stat.value}</div>
                          <div style={{ fontSize:11, color:'#5a5f78', fontFamily:'Noto Sans KR', marginTop:2 }}>{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 개발사 / 배급사 */}
                  {detail && (
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                      {detail.developers?.length>0 && (
                        <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'12px 14px' }}>
                          <div style={{ fontSize:11, color:'#5a5f78', fontFamily:'Noto Sans KR', marginBottom:4 }}>개발사</div>
                          <div style={{ fontSize:13, color:'#e2e4ed', fontFamily:'Noto Sans KR', fontWeight:600 }}>{detail.developers.map(d=>d.name).join(', ')}</div>
                        </div>
                      )}
                      {detail.publishers?.length>0 && (
                        <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'12px 14px' }}>
                          <div style={{ fontSize:11, color:'#5a5f78', fontFamily:'Noto Sans KR', marginBottom:4 }}>배급사</div>
                          <div style={{ fontSize:13, color:'#e2e4ed', fontFamily:'Noto Sans KR', fontWeight:600 }}>{detail.publishers.map(p=>p.name).join(', ')}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 태그 */}
                  {detail?.tags?.length>0 && (
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:'#8a8fa8', marginBottom:8, fontFamily:'Noto Sans KR', textTransform:'uppercase', letterSpacing:1 }}>태그</div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                        {detail.tags.slice(0,20).map(t=>(
                          <span key={t.id} style={{ fontSize:11, padding:'3px 10px', background:'rgba(124,92,252,0.1)', border:'1px solid rgba(124,92,252,0.2)', borderRadius:20, color:'#9b7ffe', fontFamily:'Noto Sans KR' }}>{t.name}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 웹사이트 */}
                  {detail?.website && (
                    <a href={detail.website} target="_blank" rel="noopener noreferrer"
                      style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 18px', background:'rgba(74,158,255,0.1)', border:'1px solid rgba(74,158,255,0.3)', borderRadius:8, color:'#4a9eff', fontSize:13, textDecoration:'none', fontFamily:'Noto Sans KR', fontWeight:600, width:'fit-content' }}>
                      🌐 공식 웹사이트 방문
                    </a>
                  )}
                </>
              )}
            </div>
          )}

          {/* ────── 미디어 탭 ────── */}
          {tab==='media' && (
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              {/* 트레일러 영상 */}
              {movies.length > 0 ? (
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#8a8fa8', marginBottom:12, fontFamily:'Noto Sans KR', textTransform:'uppercase', letterSpacing:1 }}>🎬 트레일러 / 영상</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                    {movies.slice(0,3).map(m=>(
                      <div key={m.id}>
                        <div style={{ fontSize:13, color:'#c8cce0', fontFamily:'Noto Sans KR', marginBottom:8, fontWeight:600 }}>{m.name}</div>
                        <video controls poster={m.preview}
                          style={{ width:'100%', borderRadius:10, background:'#000', maxHeight:360 }}>
                          <source src={m.data?.max || m.data?.['480']} type="video/mp4"/>
                          <source src={m.data?.['480']} type="video/mp4"/>
                        </video>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#8a8fa8', marginBottom:12, fontFamily:'Noto Sans KR', textTransform:'uppercase', letterSpacing:1 }}>🎬 트레일러 / 영상</div>
                  {/* YouTube 검색 링크로 대체 */}
                  <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(game.name+' trailer')}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 20px', background:'rgba(255,0,0,0.08)', border:'1px solid rgba(255,0,0,0.2)', borderRadius:10, color:'#ff4444', textDecoration:'none', fontFamily:'Noto Sans KR', fontSize:14, fontWeight:600 }}>
                    ▶ YouTube에서 "{game.name}" 트레일러 보기
                  </a>
                </div>
              )}

              {/* 스크린샷 */}
              {screenshots.length > 0 && (
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#8a8fa8', marginBottom:12, fontFamily:'Noto Sans KR', textTransform:'uppercase', letterSpacing:1 }}>📸 스크린샷</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:10 }}>
                    {screenshots.map((s,i)=>(
                      <img key={i} src={s.image} alt={`screenshot ${i+1}`}
                        style={{ width:'100%', aspectRatio:'16/9', objectFit:'cover', borderRadius:8, cursor:'pointer', transition:'transform 0.2s, opacity 0.2s', border:'1px solid rgba(255,255,255,0.06)' }}
                        onClick={()=>setActiveImg(s.image)}
                        onMouseEnter={e=>{ e.currentTarget.style.transform='scale(1.02)'; e.currentTarget.style.opacity='0.85'; }}
                        onMouseLeave={e=>{ e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.opacity='1'; }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ────── AI 분석 탭 ────── */}
          {tab==='ai' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background:'rgba(124,92,252,0.08)', border:'1px solid rgba(124,92,252,0.2)', borderRadius:10 }}>
                <span style={{ fontSize:20 }}>🤖</span>
                <div style={{ fontFamily:'Noto Sans KR', fontSize:12, color:'#9b7ffe' }}>AI가 "{game.name}"에 대한 정보를 분석합니다.</div>
              </div>

              {aiLoading && (
                <div style={{ textAlign:'center', padding:40 }}>
                  <div style={{ fontSize:32, marginBottom:12, animation:'spin 1s linear infinite', display:'inline-block' }}>⚙️</div>
                  <div style={{ fontSize:14, color:'#7c5cfc', fontFamily:'Noto Sans KR', animation:'pulse 1.5s ease infinite' }}>AI가 게임 정보를 수집하고 있습니다...</div>
                </div>
              )}

              {!aiLoading && aiInfo && (
                <>
                  {/* 한줄 총평 */}
                  <div style={{ padding:'16px 20px', background:'linear-gradient(135deg,rgba(124,92,252,0.12),rgba(74,158,255,0.08))', border:'1px solid rgba(124,92,252,0.25)', borderRadius:12 }}>
                    <div style={{ fontSize:11, color:'#7c5cfc', marginBottom:6, fontFamily:'Noto Sans KR', fontWeight:700, textTransform:'uppercase', letterSpacing:1 }}>AI 총평</div>
                    <div style={{ fontSize:15, color:'#e2e4ed', fontFamily:'Noto Sans KR', fontWeight:600, lineHeight:1.6 }}>"{aiInfo.verdict}"</div>
                  </div>

                  {/* 게임 소개 */}
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#8a8fa8', marginBottom:8, fontFamily:'Noto Sans KR', textTransform:'uppercase', letterSpacing:1 }}>📝 게임 소개</div>
                    <div style={{ fontSize:13, color:'#c8cce0', lineHeight:1.8, fontFamily:'Noto Sans KR' }}>{aiInfo.summary}</div>
                  </div>

                  {/* 핵심 특징 */}
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#8a8fa8', marginBottom:10, fontFamily:'Noto Sans KR', textTransform:'uppercase', letterSpacing:1 }}>⚡ 핵심 특징</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {(aiInfo.features||[]).map((f,i)=>(
                        <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'10px 14px', background:'rgba(74,158,255,0.06)', border:'1px solid rgba(74,158,255,0.15)', borderRadius:8 }}>
                          <span style={{ color:'#4a9eff', fontWeight:700, minWidth:20, fontFamily:'Rajdhani' }}>{i+1}.</span>
                          <span style={{ fontSize:13, color:'#c8cce0', fontFamily:'Noto Sans KR', lineHeight:1.6 }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 플레이 팁 */}
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#8a8fa8', marginBottom:10, fontFamily:'Noto Sans KR', textTransform:'uppercase', letterSpacing:1 }}>💡 플레이 팁</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {(aiInfo.tips||[]).map((t,i)=>(
                        <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'10px 14px', background:'rgba(0,214,143,0.06)', border:'1px solid rgba(0,214,143,0.15)', borderRadius:8 }}>
                          <span style={{ fontSize:14 }}>💡</span>
                          <span style={{ fontSize:13, color:'#c8cce0', fontFamily:'Noto Sans KR', lineHeight:1.6 }}>{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 비슷한 게임 */}
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#8a8fa8', marginBottom:10, fontFamily:'Noto Sans KR', textTransform:'uppercase', letterSpacing:1 }}>🎮 비슷한 게임 추천</div>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      {(aiInfo.similar||[]).map((s,i)=>(
                        <span key={i} style={{ padding:'8px 16px', background:'rgba(124,92,252,0.1)', border:'1px solid rgba(124,92,252,0.25)', borderRadius:20, fontSize:13, color:'#9b7ffe', fontFamily:'Noto Sans KR', fontWeight:600 }}>🎮 {s}</span>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {!aiLoading && !aiInfo && (
                <div style={{ textAlign:'center', padding:40, color:'#5a5f78', fontFamily:'Noto Sans KR' }}>
                  AI 정보를 불러오지 못했습니다.
                </div>
              )}
            </div>
          )}

          {/* ────── 구매 탭 ────── */}
          {tab==='buy' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ fontSize:13, color:'#8a8fa8', fontFamily:'Noto Sans KR', lineHeight:1.7 }}>
                아래 스토어에서 <strong style={{ color:'#e2e4ed' }}>{game.name}</strong>을 검색합니다. 실제 가격은 각 스토어에서 확인하세요.
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
                {STORE_LINKS.map(store=>(
                  <a key={store.name} href={store.url(game.name)} target="_blank" rel="noopener noreferrer"
                    style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 18px', background:`${store.color}22`, border:`1px solid ${store.color}44`, borderRadius:12, textDecoration:'none', color:'#e2e4ed', fontFamily:'Noto Sans KR', fontWeight:600, fontSize:14, transition:'all 0.2s' }}
                    onMouseEnter={e=>{ e.currentTarget.style.background=`${store.color}44`; e.currentTarget.style.transform='translateY(-2px)'; }}
                    onMouseLeave={e=>{ e.currentTarget.style.background=`${store.color}22`; e.currentTarget.style.transform='translateY(0)'; }}
                  >
                    <span style={{ fontSize:24 }}>{store.icon}</span>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700 }}>{store.name}</div>
                      <div style={{ fontSize:11, color:'#8a8fa8', marginTop:2 }}>클릭하여 검색</div>
                    </div>
                    <span style={{ marginLeft:'auto', color:'#5a5f78', fontSize:14 }}>→</span>
                  </a>
                ))}
              </div>

              {/* 가격 비교 안내 */}
              <div style={{ padding:'14px 16px', background:'rgba(245,166,35,0.07)', border:'1px solid rgba(245,166,35,0.2)', borderRadius:10, fontSize:12, color:'#8a8fa8', fontFamily:'Noto Sans KR', lineHeight:1.7 }}>
                💡 <strong style={{ color:'#f5a623' }}>팁:</strong> Steam, Epic Games는 정기적으로 할인 행사를 진행해요. IsThereAnyDeal.com에서 가격 비교를 해보세요.
                <a href={`https://isthereanydeal.com/search/?q=${encodeURIComponent(game.name)}`} target="_blank" rel="noopener noreferrer"
                  style={{ display:'block', marginTop:8, color:'#4a9eff', textDecoration:'none', fontWeight:600 }}>
                  → IsThereAnyDeal에서 가격 비교하기
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes modalIn { from{opacity:0;transform:scale(0.92) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </div>
  );
}
