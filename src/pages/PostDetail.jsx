import { useApp } from '../store/AppContext';
import { GAME_BADGE_CLASS, TIER_CLASS, TIER_SCORES } from '../mockData';

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)   return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff/60)}분 전`;
  return `${Math.floor(diff/3600)}시간 전`;
}

export default function PostDetail() {
  const { state, navigate, joinPost } = useApp();
  const { pageParams, user } = state;
  const { post, feed } = pageParams;

  if (!post) { navigate('home'); return null; }

  // 최신 상태 반영 (join 후 갱신)
  const livePost = (feed === 'friends' ? state.friendsPosts : state.scrimPosts)
    .find(p => p.id === post.id) || post;

  const [cur, max]  = livePost.slots.split('/').map(Number);
  const isFull      = cur >= max;
  const pct         = Math.round((cur / max) * 100);
  const badgeClass  = GAME_BADGE_CLASS[livePost.game] || 'badge-default';
  const tierClass   = TIER_CLASS[livePost.tier]       || '';
  const backPage    = feed === 'friends' ? 'friends' : 'scrim';

  const handleJoin = () => {
    if (!user) { navigate('login'); return; }
    if (isFull) return;
    joinPost(livePost.id, feed);
  };

  return (
    <div style={{ maxWidth:700, margin:'0 auto', padding:'32px 16px', animation:'fadeInUp 0.3s ease' }}>
      <button
        onClick={() => navigate(backPage)}
        style={{
          display:'flex', alignItems:'center', gap:6, background:'transparent', border:'none',
          color:'#8a8fa8', fontSize:13, cursor:'pointer', marginBottom:20, fontFamily:'Noto Sans KR',
          padding:0,
        }}
        onMouseEnter={e => e.currentTarget.style.color='#4a9eff'}
        onMouseLeave={e => e.currentTarget.style.color='#8a8fa8'}
      >← {feed === 'friends' ? '게임친구 찾기' : '게임 내전 찾기'}로 돌아가기</button>

      <div className="card p-6">
        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:20 }}>
          <span className={badgeClass} style={{ fontSize:12, padding:'3px 8px', borderRadius:5, flexShrink:0, fontWeight:600 }}>
            {livePost.game}
          </span>
          <h2 style={{ fontFamily:'Noto Sans KR', fontWeight:700, fontSize:20, lineHeight:1.4, flex:1, margin:0 }}>
            {livePost.title}
          </h2>
        </div>

        {/* Meta grid */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
          {[
            { label:'작성자', value:
              <span>
                <span className={tierClass} style={{ fontWeight:700 }}>[{livePost.tier}]</span>{' '}
                {livePost.author}
              </span>
            },
            { label:'플레이 시간', value: livePost.time },
            { label:'모집 인원',   value: livePost.slots },
            { label:'등록',        value: timeAgo(livePost.createdAt) },
          ].map(r => (
            <div key={r.label} style={{
              background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)',
              borderRadius:8, padding:'10px 14px',
            }}>
              <div style={{ fontSize:11, color:'#8a8fa8', marginBottom:4 }}>{r.label}</div>
              <div style={{ fontSize:13, color:'#e2e4ed' }}>{r.value}</div>
            </div>
          ))}
        </div>

        {/* 모집 진행바 */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#8a8fa8', marginBottom:6 }}>
            <span>모집 현황</span>
            <span style={{ color: isFull ? '#ff4757' : '#00d68f', fontWeight:700 }}>
              {livePost.slots} {isFull ? '(마감)' : `(${max - cur}자리 남음)`}
            </span>
          </div>
          <div style={{ height:6, background:'rgba(255,255,255,0.07)', borderRadius:999, overflow:'hidden' }}>
            <div style={{
              height:'100%', width:`${pct}%`,
              background: isFull ? '#ff4757' : 'linear-gradient(90deg,#4a9eff,#00d68f)',
              borderRadius:999, transition:'width 0.6s ease',
            }}/>
          </div>
        </div>

        {/* 설명 */}
        {livePost.desc && (
          <div style={{
            background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)',
            borderRadius:10, padding:'14px 16px', marginBottom:24,
            fontSize:14, lineHeight:1.8, color:'#c8cce0', fontFamily:'Noto Sans KR',
          }}>{livePost.desc}</div>
        )}

        {/* 태그 */}
        {livePost.tag && (
          <div style={{ marginBottom:20 }}>
            <span style={{
              fontSize:12, background:'rgba(124,92,252,0.15)', color:'#9b7ffe',
              border:'1px solid rgba(124,92,252,0.3)', padding:'4px 10px', borderRadius:999,
            }}>🏷 {livePost.tag}</span>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display:'flex', gap:10 }}>
          <button
            onClick={handleJoin}
            disabled={isFull}
            style={{
              flex:1, padding:'13px',
              background: isFull ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#4a9eff,#7c5cfc)',
              border: isFull ? '1px solid rgba(255,255,255,0.1)' : 'none',
              borderRadius:10, color: isFull ? '#5a5f78' : '#fff',
              fontSize:15, fontWeight:700, cursor: isFull ? 'not-allowed' : 'pointer',
              fontFamily:'Noto Sans KR', transition:'opacity 0.2s',
            }}
            onMouseEnter={e => { if (!isFull) e.currentTarget.style.opacity='0.88'; }}
            onMouseLeave={e => e.currentTarget.style.opacity='1'}
          >
            {isFull ? '모집 마감' : !user ? '🔐 로그인 후 참가' : '✋ 참가 신청'}
          </button>
          <button
            onClick={() => navigate(backPage)}
            style={{
              padding:'13px 20px', background:'transparent',
              border:'1px solid rgba(255,255,255,0.1)', borderRadius:10,
              color:'#8a8fa8', fontSize:14, cursor:'pointer', fontFamily:'Noto Sans KR',
            }}
          >목록으로</button>
        </div>
      </div>

      <style>{`@keyframes fadeInUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}
