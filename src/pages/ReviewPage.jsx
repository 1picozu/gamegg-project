import { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';

const SERVER = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

function getExpertTier(score, totalReviews) {
  if (score >= 80 && totalReviews >= 20) return { label:'🏆 마스터 리뷰어', color:'#f5a623', bg:'rgba(245,166,35,0.15)' };
  if (score >= 60 && totalReviews >= 10) return { label:'💎 다이아 리뷰어', color:'#4a9eff', bg:'rgba(74,158,255,0.15)' };
  if (score >= 40 && totalReviews >= 5)  return { label:'🥈 실버 리뷰어',   color:'#a0a8c8', bg:'rgba(160,168,200,0.15)' };
  return { label:'🌱 새내기 리뷰어', color:'#00d68f', bg:'rgba(0,214,143,0.12)' };
}

// ── 리뷰 카드 ────────────────────────────────────────────────────
function ReviewCard({ review }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.reviewText?.length > 150;
  return (
    <div style={{ padding:'14px 16px', background:'rgba(255,255,255,0.02)', border:`1px solid ${review.recommended?'rgba(0,214,143,0.2)':'rgba(255,71,87,0.2)'}`, borderRadius:10, borderLeft:`4px solid ${review.recommended?'#00d68f':'#ff4757'}` }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8, flexWrap:'wrap', gap:6 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {review.gameImg && <img src={review.gameImg} alt="" style={{ width:24, height:24, borderRadius:4, objectFit:'cover' }}/>}
          <span style={{ fontSize:14, fontWeight:700, color:'#e2e4ed', fontFamily:'Noto Sans KR' }}>{review.gameName}</span>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          {review.playtime_at_review > 0 && <span style={{ fontSize:11, color:'#5a5f78' }}>⏱️ {review.playtime_at_review}시간</span>}
          {review.votes_up > 0 && <span style={{ fontSize:11, color:'#5a5f78' }}>👍 {review.votes_up}명 도움됨</span>}
          <span style={{ fontSize:12, fontWeight:700, color:review.recommended?'#00d68f':'#ff4757' }}>
            {review.recommended ? '👍 추천' : '👎 비추천'}
          </span>
        </div>
      </div>
      {review.reviewText && (
        <div>
          <div style={{ fontSize:13, color:'#a0a8c0', lineHeight:1.7, fontFamily:'Noto Sans KR' }}>
            {expanded || !isLong ? review.reviewText : review.reviewText.slice(0,150)+'...'}
          </div>
          {isLong && (
            <button onClick={()=>setExpanded(e=>!e)} style={{ background:'none', border:'none', color:'#7c5cfc', fontSize:12, cursor:'pointer', padding:'4px 0', fontFamily:'Noto Sans KR' }}>
              {expanded ? '접기 ▲' : '더 보기 ▼'}
            </button>
          )}
        </div>
      )}
      <div style={{ marginTop:6, fontSize:11, color:'#3a3d52' }}>
        {new Date(review.timestamp).toLocaleDateString('ko-KR')}
      </div>
    </div>
  );
}

// ── 리뷰어 카드 ──────────────────────────────────────────────────
function ReviewerCard({ reviewer, rank }) {
  const tier = getExpertTier(reviewer.expertScore, reviewer.totalReviews);
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ background:'#151720', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, overflow:'hidden', transition:'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(0,0,0,0.4)'; }}
      onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}>
      <div style={{ padding:'16px 18px', display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ width:32, height:32, borderRadius:'50%', background:rank<=3?'linear-gradient(135deg,#f5a623,#ff6b35)':'rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:rank<=3?16:13, fontWeight:700, color:rank<=3?'#fff':'#5a5f78', flexShrink:0, fontFamily:'Rajdhani' }}>
          {rank<=3 ? ['🥇','🥈','🥉'][rank-1] : rank}
        </div>
        <img src={reviewer.avatar} alt={reviewer.displayName}
          style={{ width:48, height:48, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.1)', flexShrink:0 }}
          onError={e=>e.currentTarget.src='https://avatars.akamai.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'}/>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:15, fontWeight:700, color:'#e2e4ed', fontFamily:'Noto Sans KR', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{reviewer.displayName}</div>
          <div style={{ fontSize:11, padding:'2px 8px', background:tier.bg, color:tier.color, borderRadius:20, display:'inline-block', marginTop:3, fontFamily:'Noto Sans KR', fontWeight:600 }}>{tier.label}</div>
        </div>
        <div style={{ textAlign:'center', flexShrink:0 }}>
          <div style={{ fontSize:24, fontWeight:700, color:'#7c5cfc', fontFamily:'Rajdhani', lineHeight:1 }}>{reviewer.expertScore}</div>
          <div style={{ fontSize:10, color:'#5a5f78', fontFamily:'Noto Sans KR' }}>전문가 점수</div>
        </div>
      </div>
      <div style={{ padding:'0 18px 14px', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
        {[
          { label:'총 리뷰', value:reviewer.totalReviews, color:'#4a9eff', icon:'📝' },
          { label:'추천',    value:reviewer.positive,     color:'#00d68f', icon:'👍' },
          { label:'긍정률',  value:`${reviewer.positiveRate}%`, color:'#f5a623', icon:'📊' },
        ].map(s=>(
          <div key={s.label} style={{ background:'rgba(255,255,255,0.03)', borderRadius:8, padding:'8px 10px', textAlign:'center' }}>
            <div style={{ fontSize:9, marginBottom:3 }}>{s.icon}</div>
            <div style={{ fontSize:16, fontWeight:700, color:s.color, fontFamily:'Rajdhani', lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:10, color:'#5a5f78', fontFamily:'Noto Sans KR', marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      {reviewer.recentReviews?.length > 0 && (
        <>
          <button onClick={()=>setExpanded(e=>!e)}
            style={{ width:'100%', background:'rgba(255,255,255,0.03)', border:'none', borderTop:'1px solid rgba(255,255,255,0.06)', padding:'10px 18px', color:'#8a8fa8', fontSize:12, cursor:'pointer', fontFamily:'Noto Sans KR', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span>최근 리뷰 보기</span><span>{expanded?'▲':'▼'}</span>
          </button>
          {expanded && (
            <div style={{ padding:'10px 18px 16px', display:'flex', flexDirection:'column', gap:8 }}>
              {reviewer.recentReviews.slice(0,3).map((r,i)=>(
                <div key={i} style={{ padding:'10px 12px', background:'rgba(255,255,255,0.02)', borderRadius:8, borderLeft:`3px solid ${r.recommended?'#00d68f':'#ff4757'}` }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:'#c8cce0', fontFamily:'Noto Sans KR' }}>{r.gameName}</span>
                    <span style={{ fontSize:11, color:r.recommended?'#00d68f':'#ff4757' }}>{r.recommended?'👍 추천':'👎 비추천'}</span>
                  </div>
                  <div style={{ fontSize:12, color:'#8a8fa8', fontFamily:'Noto Sans KR', lineHeight:1.6 }}>{r.reviewText?.slice(0,100)}{r.reviewText?.length>100?'...':''}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── 내 리뷰 탭 ───────────────────────────────────────────────────
function MyReviewTab({ steamUser }) {
  const [reviews,  setReviews]  = useState([]);
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [fetched,  setFetched]  = useState(false);
  const [registered, setRegistered] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  const fetchMyReviews = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${SERVER}/api/reviews/mine`, { credentials:'include' });
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews);
        setStats({ totalReviews:data.totalReviews, positive:data.positive, negative:data.negative, positiveRate:data.positiveRate, expertScore:data.expertScore });
        setFetched(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const registerReviewer = async () => {
    setRegLoading(true);
    try {
      const res  = await fetch(`${SERVER}/api/reviewer/register`, { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body:'{}' });
      const data = await res.json();
      if (data.success) setRegistered(true);
    } catch {}
    finally { setRegLoading(false); }
  };

  return (
    <div>
      {/* 리뷰 불러오기 버튼 */}
      {!fetched && (
        <div style={{ textAlign:'center', padding:'40px 0' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🎮</div>
          <div style={{ fontSize:15, fontWeight:700, color:'#e2e4ed', marginBottom:8, fontFamily:'Noto Sans KR' }}>
            {steamUser.displayName}님의 Steam 리뷰
          </div>
          <div style={{ fontSize:13, color:'#5a5f78', marginBottom:24, fontFamily:'Noto Sans KR', lineHeight:1.7 }}>
            보유 게임에서 작성한 리뷰를 자동으로 가져옵니다.<br/>
            게임 수에 따라 1~2분 정도 걸릴 수 있어요.
          </div>
          <button onClick={fetchMyReviews} disabled={loading}
            style={{ padding:'13px 32px', background:'linear-gradient(135deg,#1b2838,#2a3f5f)', border:'1px solid #4a9eff', borderRadius:10, color:'#fff', fontSize:15, fontWeight:700, cursor:loading?'wait':'pointer', fontFamily:'Noto Sans KR', opacity:loading?0.8:1 }}>
            {loading ? (
              <span style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ display:'inline-block', animation:'spin 1s linear infinite' }}>⚙️</span>
                리뷰 수집 중...
              </span>
            ) : '🔍 내 리뷰 불러오기'}
          </button>
          {loading && (
            <div style={{ marginTop:16, fontSize:12, color:'#5a5f78', fontFamily:'Noto Sans KR' }}>
              Steam 보유 게임에서 리뷰를 검색하고 있어요. 잠시만 기다려주세요...
            </div>
          )}
        </div>
      )}

      {fetched && stats && (
        <>
          {/* 통계 */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:12, marginBottom:20 }}>
            {[
              { label:'총 리뷰',    value:stats.totalReviews,    color:'#4a9eff', icon:'📝' },
              { label:'추천',       value:stats.positive,        color:'#00d68f', icon:'👍' },
              { label:'비추천',     value:stats.negative,        color:'#ff4757', icon:'👎' },
              { label:'긍정률',     value:`${stats.positiveRate}%`, color:'#f5a623', icon:'📊' },
              { label:'전문가 점수', value:stats.expertScore,    color:'#7c5cfc', icon:'🏆' },
            ].map(s=>(
              <div key={s.label} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'14px', textAlign:'center' }}>
                <div style={{ fontSize:18, marginBottom:4 }}>{s.icon}</div>
                <div style={{ fontSize:22, fontWeight:700, color:s.color, fontFamily:'Rajdhani', lineHeight:1 }}>{s.value}</div>
                <div style={{ fontSize:11, color:'#5a5f78', fontFamily:'Noto Sans KR', marginTop:3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* 랭킹 등록 버튼 */}
          {!registered && reviews.length > 0 && (
            <div style={{ marginBottom:20, padding:'14px 18px', background:'rgba(124,92,252,0.08)', border:'1px solid rgba(124,92,252,0.25)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
              <div style={{ fontSize:13, color:'#9b7ffe', fontFamily:'Noto Sans KR' }}>리뷰어 랭킹에 등록해서 다른 유저들에게 보여주세요!</div>
              <button onClick={registerReviewer} disabled={regLoading}
                style={{ padding:'8px 20px', background:'linear-gradient(135deg,#7c5cfc,#4a9eff)', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Noto Sans KR', opacity:regLoading?0.7:1, whiteSpace:'nowrap' }}>
                {regLoading ? '등록 중...' : '🎖️ 랭킹 등록'}
              </button>
            </div>
          )}
          {registered && (
            <div style={{ marginBottom:20, padding:'12px 18px', background:'rgba(0,214,143,0.08)', border:'1px solid rgba(0,214,143,0.3)', borderRadius:10, fontSize:13, color:'#00d68f', fontFamily:'Noto Sans KR' }}>
              ✅ 리뷰어 랭킹에 등록됐어요!
            </div>
          )}

          {/* 리뷰 목록 */}
          {reviews.length === 0 ? (
            <div style={{ textAlign:'center', padding:40, color:'#5a5f78', fontFamily:'Noto Sans KR' }}>
              작성한 리뷰가 없거나 게임 라이브러리가 비공개예요.<br/>
              <span style={{ fontSize:12 }}>Steam 프로필을 공개로 설정해야 리뷰를 가져올 수 있어요.</span>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {reviews.map((r,i)=><ReviewCard key={i} review={r}/>)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  메인 ReviewPage
// ══════════════════════════════════════════════════════════════════
export default function ReviewPage() {
  const { navigate } = useApp();
  const [steamUser,    setSteamUser]    = useState(null);
  const [ranking,      setRanking]      = useState([]);
  const [loadingAuth,  setLoadingAuth]  = useState(true);
  const [loadingRank,  setLoadingRank]  = useState(true);
  const [tab,          setTab]          = useState('ranking');

  useEffect(() => {
    fetch(`${SERVER}/auth/me`, { credentials:'include' })
      .then(r=>r.json())
      .then(d=>{ if(d.loggedIn) setSteamUser(d.user); })
      .catch(()=>{})
      .finally(()=>setLoadingAuth(false));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('steam') === 'success') {
      window.history.replaceState({}, '', window.location.pathname);
      fetch(`${SERVER}/auth/me`, { credentials:'include' })
        .then(r=>r.json())
        .then(d=>{ if(d.loggedIn) { setSteamUser(d.user); setTab('my'); } });
    }
  }, []);

  useEffect(() => {
    fetch(`${SERVER}/api/reviewers/ranking`)
      .then(r=>r.json())
      .then(d=>{ if(d.success) setRanking(d.ranking); })
      .catch(()=>{})
      .finally(()=>setLoadingRank(false));
  }, []);

  const handleLogin  = () => { window.location.href = `${SERVER}/auth/steam`; };
  const handleLogout = async () => {
    await fetch(`${SERVER}/auth/logout`, { credentials:'include' });
    setSteamUser(null);
  };

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'28px 16px', fontFamily:'Noto Sans KR', animation:'fadeInUp 0.3s ease' }}>

      {/* 헤더 */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
        <button onClick={()=>navigate('home')} style={{ background:'none', border:'none', color:'#8a8fa8', fontSize:13, cursor:'pointer', padding:0 }}>← 메인으로</button>
        <span style={{ color:'#3a3d52' }}>/</span>
        <span className="section-title">게임 리뷰어 랭킹</span>
      </div>

      {/* Steam 로그인 배너 */}
      <div style={{ marginBottom:24, padding:'20px 24px', background:'linear-gradient(135deg,rgba(23,37,71,0.8),rgba(30,25,60,0.8))', border:'1px solid rgba(74,158,255,0.2)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
        <div>
          <div style={{ fontSize:16, fontWeight:700, color:'#e2e4ed', marginBottom:4 }}>🎮 Steam 리뷰어 랭킹</div>
          <div style={{ fontSize:13, color:'#8a8fa8', lineHeight:1.6 }}>
            Steam 로그인 후 내 리뷰를 불러오면 전문가 점수를 받아요.<br/>
            리뷰가 많을수록 다른 유저들에게 신뢰받는 리뷰어가 됩니다!
          </div>
        </div>
        {loadingAuth ? (
          <div style={{ fontSize:13, color:'#5a5f78' }}>확인 중...</div>
        ) : steamUser ? (
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <img src={steamUser.avatar} alt="" style={{ width:36, height:36, borderRadius:'50%', border:'2px solid #4a9eff' }}/>
            <span style={{ fontSize:13, color:'#4a9eff', fontWeight:700 }}>{steamUser.displayName}</span>
            <button onClick={handleLogout}
              style={{ padding:'7px 14px', background:'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#8a8fa8', fontSize:12, cursor:'pointer' }}>
              로그아웃
            </button>
          </div>
        ) : (
          <button onClick={handleLogin}
            style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 24px', background:'#1b2838', border:'1px solid #4a9eff', borderRadius:10, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', transition:'background 0.2s' }}
            onMouseEnter={e=>e.currentTarget.style.background='#2a3f5f'}
            onMouseLeave={e=>e.currentTarget.style.background='#1b2838'}>
            <svg width="20" height="20" viewBox="0 0 32 32" fill="white"><circle cx="16" cy="16" r="16" fill="#1b2838"/><path d="M16 4C9.4 4 4 9.4 4 16c0 5.5 3.5 10.2 8.5 11.9l4.8-7.1c-.3 0-.6.1-.9.1-3.6 0-6.5-2.9-6.5-6.5S15.8 7.9 19.4 7.9s6.5 2.9 6.5 6.5c0 3-2 5.5-4.8 6.3l-4.7 7c.5.1 1 .1 1.6.1 6.6 0 12-5.4 12-12S22.6 4 16 4z" fill="white"/></svg>
            Steam으로 로그인
          </button>
        )}
      </div>

      {/* 탭 */}
      <div style={{ display:'flex', gap:0, marginBottom:20, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        {[
          { id:'ranking', label:'🏆 리뷰어 랭킹' },
          { id:'my',      label:'📋 내 리뷰',   locked:!steamUser },
        ].map(t=>(
          <button key={t.id}
            onClick={()=>{ if(t.locked){ alert('Steam 로그인이 필요합니다'); return; } setTab(t.id); }}
            style={{ padding:'10px 20px', background:'transparent', border:'none', borderBottom:`2px solid ${tab===t.id?'#7c5cfc':'transparent'}`, color:tab===t.id?'#7c5cfc':t.locked?'#3a3d52':'#5a5f78', fontSize:13, fontWeight:tab===t.id?700:400, cursor:t.locked?'not-allowed':'pointer', marginBottom:-1, transition:'all 0.2s' }}>
            {t.label}{t.locked&&' 🔒'}
          </button>
        ))}
      </div>

      {/* 랭킹 탭 */}
      {tab === 'ranking' && (
        loadingRank ? (
          <div style={{ textAlign:'center', padding:60, color:'#5a5f78' }}>랭킹 로딩 중...</div>
        ) : ranking.length === 0 ? (
          <div style={{ textAlign:'center', padding:60 }}>
            <div style={{ fontSize:48, marginBottom:16 }}>🏆</div>
            <div style={{ fontSize:16, fontWeight:700, color:'#e2e4ed', marginBottom:8 }}>아직 등록된 리뷰어가 없어요</div>
            <div style={{ fontSize:13, color:'#5a5f78' }}>Steam 로그인 후 첫 번째 리뷰어가 되어보세요!</div>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
            {ranking.map((r,i)=><ReviewerCard key={r.steamId} reviewer={r} rank={i+1}/>)}
          </div>
        )
      )}

      {/* 내 리뷰 탭 */}
      {tab === 'my' && steamUser && <MyReviewTab steamUser={steamUser}/>}

      <style>{`
        @keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
}
