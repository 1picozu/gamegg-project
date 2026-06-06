import { useState, useEffect, useRef } from 'react';
import { useApp } from '../store/AppContext';
import { useRawgGames, FEATURED_GAMES } from '../hooks/useRawgGames';

// ── 유틸 ──────────────────────────────────────────────────────────────
const GENRE_COLOR = { Action:'#ff4757',RPG:'#7c5cfc',Shooter:'#f5a623',Strategy:'#4a9eff',Adventure:'#00d68f',Sports:'#ff6b35',Racing:'#f99312',Puzzle:'#00e5ff',MOBA:'#c8a84b','Battle Royale':'#ff4757',Tactical:'#6ecbce',Indie:'#9b7ffe' };
function gcolor(genres=[]) { for(const g of genres) if(GENRE_COLOR[g]) return GENRE_COLOR[g]; return '#4a9eff'; }

// ── 할인 정보 (Steam/Epic 모의 데이터 + 링크) ─────────────────────────
const DEALS = [
  { game:'엘든 링',         platform:'Steam', discount:40, original:59900, current:35940, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/capsule_616x353.jpg', url:'https://store.steampowered.com/app/1245620/', end:'6/15', badge:'역대최저' },
  { game:'사이버펑크 2077',  platform:'Epic',  discount:60, original:69900, current:27960, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/capsule_616x353.jpg', url:'https://store.epicgames.com/ko/p/cyberpunk-2077', end:'6/12', badge:'추천' },
  { game:'레드 데드 리뎀션 2',platform:'Steam', discount:50, original:59900, current:29950, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/capsule_616x353.jpg', url:'https://store.steampowered.com/app/1174180/', end:'6/20', badge:'' },
  { game:'호그와트 레거시',   platform:'Steam', discount:35, original:69900, current:45435, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/990080/capsule_616x353.jpg',  url:'https://store.steampowered.com/app/990080/', end:'6/18', badge:'인기' },
  { game:'갓 오브 워',        platform:'Steam', discount:30, original:59900, current:41930, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/1593500/capsule_616x353.jpg', url:'https://store.steampowered.com/app/1593500/', end:'6/22', badge:'' },
  { game:'스파이더맨 리마스터드',platform:'Epic', discount:45, original:59900, current:32945, img:'https://cdn.cloudflare.steamstatic.com/steam/apps/1817070/capsule_616x353.jpg', url:'https://store.epicgames.com/ko/p/marvels-spider-man-remastered', end:'6/14', badge:'EPIC무료예정' },
];

// ── 출시 예정·이벤트 (AI 웹검색 모의 데이터) ──────────────────────────
const UPCOMING = [
  { title:'GTA VI',        date:'2025년 하반기', genre:'Action/Open World', img:'https://images.igdb.com/igdb/image/upload/t_cover_big/co8mjk.jpg', desc:'록스타 게임즈의 차세대 오픈월드. 플로리다를 배경으로 한 역대 최대 규모.', youtubeId:'QdBZExpgErs', hot:true },
  { title:'Monster Hunter Wilds', date:'2025 Q2', genre:'Action/RPG', img:'https://images.igdb.com/igdb/image/upload/t_cover_big/co8nc8.jpg', desc:'몬스터헌터 시리즈 최신작. 살아 숨쉬는 생태계와 날씨 시스템 도입.', youtubeId:'8ZKc6S4sOgU', hot:true },
  { title:'Hollow Knight: Silksong', date:'2025 TBD', genre:'Action/Indie', img:'https://images.igdb.com/igdb/image/upload/t_cover_big/co1rgi.jpg', desc:'인디 명작 홀로우 나이트의 후속작. 수년간 기다려온 팬들의 기대작.', youtubeId:'pFBt_HhRMJc', hot:false },
  { title:'Elden Ring DLC: Shadow of the Erdtree', date:'출시됨', genre:'Action/RPG', img:'https://cdn.cloudflare.steamstatic.com/steam/apps/2778580/capsule_616x353.jpg', desc:'엘든 링 첫 번째 DLC. 신규 지역, 무기, 보스 추가. 역대 최고평점 DLC.', youtubeId:'t5P9RVTLJBk', hot:false },
];

const EVENTS = [
  { title:'스팀 여름 세일 2025',     date:'6/26 ~ 7/10', platform:'Steam', desc:'연중 최대 할인 행사. 수천 개 게임 최대 90% 할인 예정.', color:'#4a9eff', icon:'💰' },
  { title:'에픽 무료 게임 주간',     date:'매주 목요일', platform:'Epic',  desc:'매주 무료 게임 1~2개 배포 중. 이번 주 배포 확인 필수.', color:'#00d68f', icon:'🎁' },
  { title:'오버워치2 시즌 15 시작',  date:'6/18',       platform:'게임내', desc:'신규 영웅, 맵, 배틀패스 업데이트 예정.', color:'#f99312', icon:'⚔️' },
  { title:'리그오브레전드 미드시즌', date:'6월 말',      platform:'게임내', desc:'MSI 시즌 기념 이벤트 및 특별 스킨 출시 예정.', color:'#c8a84b', icon:'🏆' },
];

// ── AI 취향 추천 스와이프 ────────────────────────────────────────────
const TASTE_QUESTIONS = [
  { q:'선호하는 플레이 스타일은?',        options:['혼자 집중해서', '친구들이랑 같이', '커뮤니티와 함께', '상관없음'] },
  { q:'선호하는 플레이 시간은?',           options:['30분 이내 짧게', '1~2시간 적당히', '4시간+ 몰입', '상관없음'] },
  { q:'좋아하는 장르는?',                  options:['액션/FPS', 'RPG/어드벤처', '전략/시뮬', '스포츠/레이싱'] },
  { q:'그래픽 스타일 선호는?',             options:['사실적 고품질', '아기자기 아트', '픽셀/레트로', '상관없음'] },
  { q:'스토리 중요도는?',                  options:['스토리가 핵심', '적당히 있으면', '스토리 불필요', '상관없음'] },
];

function AISwipeRecommend({ games }) {
  const [step,     setStep]     = useState(0);   // 0=취향질문, 1=결과스와이프
  const [answers,  setAnswers]  = useState([]);
  const [recs,     setRecs]     = useState([]);
  const [cardIdx,  setCardIdx]  = useState(0);
  const [liked,    setLiked]    = useState([]);
  const [passed,   setPassed]   = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [drag,     setDrag]     = useState(null);  // 드래그 offset
  const [anim,     setAnim]     = useState(null);  // 'left'|'right'
  const cardRef = useRef(null);

  const pickAnswer = (ans) => {
    const next = [...answers, ans];
    setAnswers(next);
    if (next.length < TASTE_QUESTIONS.length) return;
    // 취향 분석 후 게임 추천
    setLoading(true);
    setTimeout(() => {
      const keywords = next.join(' ').toLowerCase();
      let filtered = games.filter(g => {
        const t = [g.name,...(g.genres||[])].join(' ').toLowerCase();
        // 장르 힌트 매칭
        if (keywords.includes('fps') || keywords.includes('액션')) return (g.genres||[]).some(gr=>/action|shooter/i.test(gr));
        if (keywords.includes('rpg')) return (g.genres||[]).some(gr=>/rpg|adventure/i.test(gr));
        if (keywords.includes('전략')) return (g.genres||[]).some(gr=>/strategy|simulation/i.test(gr));
        if (keywords.includes('스포츠')) return (g.genres||[]).some(gr=>/sports|racing/i.test(gr));
        return g.rating && g.rating >= 3.5;
      });
      if (filtered.length < 5) filtered = games.filter(g => g.rating && g.rating >= 4.0);
      setRecs(filtered.slice(0, 20));
      setLoading(false);
      setStep(1);
    }, 2000);
  };

  const currentCard = recs[cardIdx];

  const swipe = (dir) => {
    setAnim(dir);
    setTimeout(() => {
      if (dir === 'right') setLiked(l => [...l, currentCard]);
      else setPassed(p => [...p, currentCard]);
      setAnim(null);
      setDrag(null);
      setCardIdx(i => i + 1);
    }, 350);
  };

  const reset = () => { setStep(0); setAnswers([]); setRecs([]); setCardIdx(0); setLiked([]); setPassed([]); setAnim(null); setDrag(null); };

  if (loading) return (
    <div style={{ textAlign:'center', padding:'60px 20px' }}>
      <div style={{ fontSize:40, marginBottom:16, animation:'spin 1s linear infinite', display:'inline-block' }}>🤖</div>
      <div style={{ fontFamily:'Noto Sans KR', fontWeight:700, fontSize:18, color:'#7c5cfc', marginBottom:8 }}>AI가 취향을 분석 중입니다...</div>
      <div style={{ width:280, height:6, background:'rgba(255,255,255,0.08)', borderRadius:999, margin:'16px auto 0', overflow:'hidden' }}>
        <div style={{ height:'100%', background:'linear-gradient(90deg,#7c5cfc,#4a9eff)', borderRadius:999, animation:'progress 2s ease forwards' }}/>
      </div>
    </div>
  );

  if (step === 0) return (
    <div>
      <div style={{ marginBottom:20 }}>
        {/* 프로그레스 */}
        <div style={{ display:'flex', gap:4, marginBottom:16 }}>
          {TASTE_QUESTIONS.map((_, i) => (
            <div key={i} style={{ flex:1, height:3, borderRadius:999, background: i < answers.length ? '#7c5cfc' : 'rgba(255,255,255,0.1)', transition:'background 0.3s' }}/>
          ))}
        </div>
        <div style={{ fontSize:12, color:'#8a8fa8', marginBottom:8, fontFamily:'Noto Sans KR' }}>질문 {answers.length+1} / {TASTE_QUESTIONS.length}</div>
        <div style={{ fontFamily:'Noto Sans KR', fontWeight:700, fontSize:17, color:'#e2e4ed', marginBottom:16 }}>{TASTE_QUESTIONS[answers.length].q}</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {TASTE_QUESTIONS[answers.length].options.map(opt => (
            <button key={opt} onClick={()=>pickAnswer(opt)} style={{ padding:'12px 8px', background:'rgba(124,92,252,0.1)', border:'1px solid rgba(124,92,252,0.3)', borderRadius:10, color:'#c8cce0', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Noto Sans KR', transition:'all 0.2s' }}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(124,92,252,0.25)';e.currentTarget.style.color='#fff';}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(124,92,252,0.1)';e.currentTarget.style.color='#c8cce0';}}
            >{opt}</button>
          ))}
        </div>
      </div>
    </div>
  );

  if (cardIdx >= recs.length) return (
    <div>
      <div style={{ textAlign:'center', marginBottom:20 }}>
        <div style={{ fontSize:32, marginBottom:10 }}>🎮</div>
        <div style={{ fontFamily:'Noto Sans KR', fontWeight:700, fontSize:18, color:'#e2e4ed', marginBottom:4 }}>
          취향 분석 완료!
        </div>
        <div style={{ fontSize:13, color:'#8a8fa8', fontFamily:'Noto Sans KR' }}>❤️ 찜한 게임 {liked.length}개</div>
      </div>
      {liked.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:10, marginBottom:16 }}>
          {liked.map(g => {
            const color = gcolor(g.genres);
            return (
              <div key={g.id} style={{ borderRadius:10, overflow:'hidden', border:`1px solid ${color}44` }}>
                <img src={g.img} alt={g.name} style={{ width:'100%', aspectRatio:'2/3', objectFit:'cover', display:'block' }} onError={e=>{e.currentTarget.src=`https://picsum.photos/seed/${g.id}/150/220`;}}/>
                <div style={{ padding:'6px 8px', background:'#161824', fontSize:11, fontWeight:700, color:'#e2e4ed', fontFamily:'Noto Sans KR', textAlign:'center' }}>{g.name}</div>
              </div>
            );
          })}
        </div>
      )}
      <button onClick={reset} style={{ width:'100%', padding:'11px', background:'linear-gradient(135deg,#7c5cfc,#4a9eff)', border:'none', borderRadius:10, color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'Noto Sans KR' }}>🔄 다시 추천받기</button>
    </div>
  );

  if (!currentCard) return null;
  const color = gcolor(currentCard.genres);

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <span style={{ fontSize:13, color:'#8a8fa8', fontFamily:'Noto Sans KR' }}>❤️ {liked.length} · ⏭ {passed.length} · 남은 카드 {recs.length - cardIdx}장</span>
        <button onClick={reset} style={{ fontSize:11, color:'#5a5f78', background:'none', border:'none', cursor:'pointer', fontFamily:'Noto Sans KR' }}>처음부터</button>
      </div>

      {/* 카드 */}
      <div style={{ position:'relative', height:360, marginBottom:20 }}>
        {/* 다음 카드 미리보기 */}
        {recs[cardIdx+1] && (
          <div style={{ position:'absolute', top:8, left:'50%', transform:'translateX(-50%) scale(0.94)', width:240, height:340, borderRadius:16, overflow:'hidden', opacity:0.5 }}>
            <img src={recs[cardIdx+1].img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{e.currentTarget.src=`https://picsum.photos/seed/${recs[cardIdx+1].id}/240/340`;}}/>
          </div>
        )}

        {/* 현재 카드 */}
        <div ref={cardRef} style={{
          position:'absolute', top:0, left:'50%',
          transform: anim==='right' ? 'translateX(120%) rotate(20deg)' : anim==='left' ? 'translateX(-120%) rotate(-20deg)' : `translateX(-50%) rotate(${(drag||0)*0.08}deg) translateX(${drag||0}px)`,
          width:240, height:340, borderRadius:16, overflow:'hidden', cursor:'grab',
          boxShadow:'0 16px 48px rgba(0,0,0,0.5)',
          border:`2px solid ${color}66`,
          transition: anim ? 'transform 0.35s cubic-bezier(0.4,0.2,0.2,1)' : 'none',
          zIndex:2,
        }}>
          <img src={currentCard.img} alt={currentCard.name} style={{ width:'100%', height:'65%', objectFit:'cover', display:'block' }} onError={e=>{e.currentTarget.src=`https://picsum.photos/seed/${currentCard.id}/240/340`;}}/>
          <div style={{ padding:'12px 14px', background:'linear-gradient(160deg,#1c1e26,#10121a)', height:'35%', display:'flex', flexDirection:'column', justifyContent:'center' }}>
            <div style={{ fontFamily:'Noto Sans KR', fontWeight:700, fontSize:14, color:'#fff', marginBottom:4, lineHeight:1.3 }}>{currentCard.name}</div>
            <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:4 }}>
              {(currentCard.genres||[]).slice(0,2).map(g=>(
                <span key={g} style={{ fontSize:9, padding:'1px 5px', borderRadius:3, background:GENRE_COLOR[g]?`${GENRE_COLOR[g]}22`:'rgba(255,255,255,0.08)', color:GENRE_COLOR[g]||'#8a8fa8', border:`1px solid ${GENRE_COLOR[g]||'rgba(255,255,255,0.1)'}44` }}>{g}</span>
              ))}
            </div>
            {currentCard.metacritic && <span style={{ fontSize:11, fontFamily:'Rajdhani', fontWeight:700, color:'#00d68f' }}>META {currentCard.metacritic}</span>}
          </div>

          {/* 스와이프 힌트 오버레이 */}
          {drag && drag > 30 && <div style={{ position:'absolute', inset:0, background:'rgba(0,214,143,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:48 }}>❤️</div>}
          {drag && drag < -30 && <div style={{ position:'absolute', inset:0, background:'rgba(255,71,87,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:48 }}>⏭</div>}
        </div>
      </div>

      {/* 버튼 */}
      <div style={{ display:'flex', gap:16, justifyContent:'center' }}>
        <button onClick={()=>swipe('left')} style={{ width:64, height:64, borderRadius:'50%', background:'rgba(255,71,87,0.12)', border:'2px solid rgba(255,71,87,0.4)', fontSize:26, cursor:'pointer', transition:'all 0.2s', color:'#ff4757' }}
          onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,71,87,0.25)';e.currentTarget.style.transform='scale(1.08)';}}
          onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,71,87,0.12)';e.currentTarget.style.transform='scale(1)';}}
          title="패스">⏭</button>
        <button onClick={()=>swipe('right')} style={{ width:64, height:64, borderRadius:'50%', background:'rgba(0,214,143,0.12)', border:'2px solid rgba(0,214,143,0.4)', fontSize:26, cursor:'pointer', transition:'all 0.2s', color:'#00d68f' }}
          onMouseEnter={e=>{e.currentTarget.style.background='rgba(0,214,143,0.25)';e.currentTarget.style.transform='scale(1.08)';}}
          onMouseLeave={e=>{e.currentTarget.style.background='rgba(0,214,143,0.12)';e.currentTarget.style.transform='scale(1)';}}
          title="찜하기">❤️</button>
      </div>
      <div style={{ textAlign:'center', marginTop:8, fontSize:11, color:'#5a5f78', fontFamily:'Noto Sans KR' }}>← 패스 &nbsp;&nbsp; 찜하기 →</div>
    </div>
  );
}

// ── 메인 GameInfoPage ────────────────────────────────────────────────
export default function GameInfoPage() {
  const { navigate } = useApp();
  const { games, loading } = useRawgGames();
  const [activeTab, setActiveTab] = useState('deals'); // deals | upcoming | recommend

  const TABS = [
    { id:'deals',     label:'🔥 게임 할인 정보' },
    { id:'upcoming',  label:'🚀 출시 예정·이벤트' },
    { id:'recommend', label:'🤖 AI 취향 추천' },
  ];

  return (
    <div style={{ maxWidth:1200, margin:'0 auto', padding:'28px 16px', animation:'fadeInUp 0.3s ease' }}>
      {/* 헤더 */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
        <button onClick={()=>navigate('home')} style={{ background:'none', border:'none', color:'#8a8fa8', fontSize:13, cursor:'pointer', fontFamily:'Noto Sans KR', padding:0 }}
          onMouseEnter={e=>e.currentTarget.style.color='#4a9eff'} onMouseLeave={e=>e.currentTarget.style.color='#8a8fa8'}
        >← 메인으로</button>
        <span style={{ color:'#3a3d52' }}>/</span>
        <span className="section-title">🎮 게임 정보 센터</span>
      </div>

      {/* 탭 */}
      <div style={{ display:'flex', gap:4, marginBottom:24, background:'rgba(255,255,255,0.03)', borderRadius:12, padding:4, border:'1px solid rgba(255,255,255,0.07)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{
            flex:1, padding:'10px 8px', border:'none', borderRadius:8,
            background: activeTab===t.id ? 'linear-gradient(135deg,rgba(74,158,255,0.25),rgba(124,92,252,0.25))' : 'transparent',
            color: activeTab===t.id ? '#fff' : '#8a8fa8',
            fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Noto Sans KR', transition:'all 0.2s',
            borderBottom: activeTab===t.id ? '2px solid #7c5cfc' : '2px solid transparent',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── 할인 정보 탭 ── */}
      {activeTab === 'deals' && (
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
            <span className="section-title">💸 현재 진행 중인 할인</span>
            <span style={{ fontSize:11, background:'rgba(74,158,255,0.1)', color:'#4a9eff', border:'1px solid rgba(74,158,255,0.25)', padding:'2px 8px', borderRadius:999, fontFamily:'Noto Sans KR' }}>실시간 업데이트</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
            {DEALS.map((d,i) => (
              <a key={i} href={d.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none' }}>
                <div style={{ borderRadius:12, overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)', background:'#1c1e26', cursor:'pointer', transition:'all 0.25s' }}
                  onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.borderColor='rgba(74,158,255,0.35)';}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.borderColor='rgba(255,255,255,0.08)';}}
                >
                  <div style={{ position:'relative', height:140, overflow:'hidden' }}>
                    <img src={d.img} alt={d.game} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{e.currentTarget.style.background='#252840';}}/>
                    <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(0,0,0,0.8) 0%,transparent 50%)' }}/>
                    {/* 할인율 뱃지 */}
                    <div style={{ position:'absolute', top:10, right:10, background:'#ff4757', borderRadius:6, padding:'4px 10px', fontFamily:'Rajdhani', fontWeight:700, fontSize:18, color:'#fff' }}>-{d.discount}%</div>
                    {/* 플랫폼 */}
                    <div style={{ position:'absolute', top:10, left:10, background: d.platform==='Steam'?'rgba(23,139,176,0.9)':'rgba(0,0,0,0.8)', borderRadius:5, padding:'3px 8px', fontSize:11, fontWeight:700, color:'#fff' }}>
                      {d.platform==='Steam'?'🟦 Steam':'🟣 Epic'}
                    </div>
                    {d.badge && <div style={{ position:'absolute', bottom:10, left:10, background:'rgba(0,214,143,0.9)', borderRadius:5, padding:'2px 7px', fontSize:10, fontWeight:700, color:'#fff' }}>{d.badge}</div>}
                  </div>
                  <div style={{ padding:'12px 14px' }}>
                    <div style={{ fontFamily:'Noto Sans KR', fontWeight:700, fontSize:14, color:'#fff', marginBottom:8 }}>{d.game}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontFamily:'Rajdhani', fontWeight:700, fontSize:22, color:'#ff4757' }}>₩{d.current.toLocaleString()}</span>
                      <span style={{ fontSize:12, color:'#5a5f78', textDecoration:'line-through' }}>₩{d.original.toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize:11, color:'#8a8fa8', marginTop:5, fontFamily:'Noto Sans KR' }}>⏰ ~{d.end} 종료</div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── 출시 예정·이벤트 탭 ── */}
      {activeTab === 'upcoming' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
          {/* 출시 예정 */}
          <div>
            <div className="section-title" style={{ marginBottom:16 }}>🚀 기대작 출시 일정</div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {UPCOMING.map((u,i) => (
                <div key={i} className="card" style={{ padding:'14px', border: u.hot ? '1px solid rgba(255,71,87,0.35)' : '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                    <img src={u.img} alt={u.title} style={{ width:70, height:95, objectFit:'cover', borderRadius:8, flexShrink:0 }} onError={e=>{e.currentTarget.style.background='#252840';}}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                        {u.hot && <span style={{ fontSize:10, background:'rgba(255,71,87,0.2)', color:'#ff4757', border:'1px solid rgba(255,71,87,0.4)', padding:'1px 6px', borderRadius:999, fontWeight:700 }}>🔥 HOT</span>}
                        <span style={{ fontSize:11, color:'#8a8fa8', fontFamily:'Noto Sans KR' }}>{u.genre}</span>
                      </div>
                      <div style={{ fontFamily:'Noto Sans KR', fontWeight:700, fontSize:14, color:'#fff', marginBottom:4 }}>{u.title}</div>
                      <div style={{ fontSize:12, color:'#4a9eff', fontWeight:700, marginBottom:6, fontFamily:'Noto Sans KR' }}>📅 {u.date}</div>
                      <div style={{ fontSize:12, color:'#a0a8c0', lineHeight:1.6, fontFamily:'Noto Sans KR' }}>{u.desc}</div>
                      {u.youtubeId && (
                        <a href={`https://www.youtube.com/watch?v=${u.youtubeId}`} target="_blank" rel="noopener noreferrer"
                          style={{ display:'inline-flex', alignItems:'center', gap:5, marginTop:8, fontSize:11, color:'#ff4757', textDecoration:'none', fontFamily:'Noto Sans KR', fontWeight:700 }}
                        >▶ 트레일러 보기</a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 이벤트 */}
          <div>
            <div className="section-title" style={{ marginBottom:16 }}>🎉 게임 이벤트</div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {EVENTS.map((ev,i) => (
                <div key={i} style={{ borderRadius:12, padding:'16px', background:'#1c1e26', border:`1px solid ${ev.color}33` }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                    <div style={{ width:40, height:40, borderRadius:10, background:`${ev.color}22`, border:`1px solid ${ev.color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{ev.icon}</div>
                    <div>
                      <div style={{ fontFamily:'Noto Sans KR', fontWeight:700, fontSize:14, color:'#fff' }}>{ev.title}</div>
                      <div style={{ fontSize:11, color:ev.color, fontWeight:700, marginTop:2 }}>📅 {ev.date} · {ev.platform}</div>
                    </div>
                  </div>
                  <div style={{ fontSize:13, color:'#a0a8c0', lineHeight:1.6, fontFamily:'Noto Sans KR' }}>{ev.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── AI 취향 추천 탭 ── */}
      {activeTab === 'recommend' && (
        <div style={{ maxWidth:560, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:24 }}>
            <div style={{ fontSize:36, marginBottom:8 }}>🤖</div>
            <div style={{ fontFamily:'Noto Sans KR', fontWeight:700, fontSize:20, color:'#e2e4ed', marginBottom:6 }}>AI 취향 게임 추천</div>
            <div style={{ fontSize:13, color:'#8a8fa8', fontFamily:'Noto Sans KR' }}>취향 질문에 답하면 AI가 맞춤 게임을 추천해드려요.<br/>마음에 들면 ❤️, 별로면 ⏭ 로 계속 탐색하세요!</div>
          </div>
          {loading ? (
            <div style={{ textAlign:'center', padding:40, color:'#8a8fa8', fontFamily:'Noto Sans KR' }}>게임 데이터 로딩 중...</div>
          ) : (
            <AISwipeRecommend games={games} />
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes progress{from{width:0}to{width:100%}}
      `}</style>
    </div>
  );
}
