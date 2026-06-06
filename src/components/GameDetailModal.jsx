import { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';

const GENRE_COLOR = {
  'Action':'#ff4757','RPG':'#7c5cfc','Shooter':'#f5a623','Strategy':'#4a9eff',
  'Adventure':'#00d68f','Sports':'#ff6b35','Racing':'#f99312','Puzzle':'#00e5ff',
  'Simulation':'#a0d468','Fighting':'#c8a84b','Arcade':'#ff9ff3','Platformer':'#54a0ff',
  'Indie':'#5f27cd','Casual':'#00d2d3','Massively Multiplayer':'#00e5ff',
};
function gcolor(g=[]) { for(const x of g) if(GENRE_COLOR[x]) return GENRE_COLOR[x]; return '#4a9eff'; }

// 플랫폼 → 스토어 링크 매핑
function getStoreLinks(game) {
  const name = encodeURIComponent(game.name);
  const platforms = (game.platforms||[]).join(' ').toLowerCase();
  const links = [];
  if (/pc|windows/i.test(platforms) || game.genres.some(g=>/Shooter|RPG|Strategy|Indie/i.test(g))) {
    links.push({ name:'Steam', icon:'🟦', color:'#1b2838', textColor:'#c7d5e0', url:`https://store.steampowered.com/search/?term=${name}` });
    links.push({ name:'Epic Games', icon:'⬛', color:'#2d2d2d', textColor:'#ffffff', url:`https://store.epicgames.com/browse?q=${name}` });
  }
  if (/playstation|ps4|ps5/i.test(platforms)) {
    links.push({ name:'PlayStation Store', icon:'🔵', color:'#003087', textColor:'#ffffff', url:`https://store.playstation.com/search/${name}` });
  }
  if (/xbox/i.test(platforms)) {
    links.push({ name:'Xbox Store', icon:'🟢', color:'#107c10', textColor:'#ffffff', url:`https://www.xbox.com/games/all-games?q=${name}` });
  }
  if (/nintendo|switch/i.test(platforms)) {
    links.push({ name:'Nintendo eShop', icon:'🔴', color:'#e60012', textColor:'#ffffff', url:`https://www.nintendo.com/search/?q=${name}` });
  }
  if (links.length === 0) {
    links.push({ name:'Steam', icon:'🟦', color:'#1b2838', textColor:'#c7d5e0', url:`https://store.steampowered.com/search/?term=${name}` });
    links.push({ name:'Epic Games', icon:'⬛', color:'#2d2d2d', textColor:'#ffffff', url:`https://store.epicgames.com/browse?q=${name}` });
  }
  return links;
}

function metaColor(s) {
  if(s>=75) return {bg:'rgba(0,214,143,0.18)',border:'rgba(0,214,143,0.5)',text:'#00d68f'};
  if(s>=50) return {bg:'rgba(245,166,35,0.18)',border:'rgba(245,166,35,0.5)',text:'#f5a623'};
  return {bg:'rgba(255,71,87,0.18)',border:'rgba(255,71,87,0.5)',text:'#ff4757'};
}

// AI 게임 정보 수집 (Claude API 연동 or 모의 데이터)
async function fetchGameAIInfo(gameName) {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `게임 "${gameName}"에 대해 JSON 형식으로만 답하세요. 다른 텍스트 없이 오직 JSON만:
{
  "description": "게임 설명 2~3문장 (한국어)",
  "developer": "개발사",
  "publisher": "퍼블리셔",
  "features": ["특징1","특징2","특징3"],
  "recentNews": "최근 업데이트/패치/이슈 한 줄 요약 (한국어)",
  "youtubeQuery": "유튜브 공식 트레일러 검색어 (영어)"
}`
        }]
      })
    });
    if (!res.ok) throw new Error('api fail');
    const data = await res.json();
    const text = data.content?.map(c => c.text||'').join('') || '';
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    // Fallback 데이터
    return {
      description: `${gameName}은(는) 전 세계 수백만 명의 게이머들에게 사랑받는 타이틀입니다. 다양한 플랫폼에서 즐길 수 있으며, 정기적인 업데이트로 새로운 콘텐츠를 제공합니다.`,
      developer: '정보 없음',
      publisher: '정보 없음',
      features: ['멀티플레이 지원', '정기 업데이트', '글로벌 서버'],
      recentNews: '최신 패치 및 업데이트 정보는 공식 사이트를 확인해 주세요.',
      youtubeQuery: `${gameName} official trailer`,
    };
  }
}

export default function GameDetailModal({ game, onClose }) {
  const color = gcolor(game.genres);
  const mc    = game.metacritic;
  const mcCol = mc ? metaColor(mc) : null;
  const storeLinks = getStoreLinks(game);

  const [aiInfo, setAiInfo]   = useState(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [tab, setTab]         = useState('info'); // 'info' | 'news' | 'buy'

  const platforms = [...new Set((game.platforms||[]).slice(0,6).map(p => {
    if (/pc|windows/i.test(p))         return '💻 PC';
    if (/playstation 5|ps5/i.test(p))  return '🎮 PS5';
    if (/playstation 4|ps4/i.test(p))  return '🎮 PS4';
    if (/xbox one/i.test(p))           return '🟢 Xbox One';
    if (/xbox series/i.test(p))        return '🟢 Xbox Series';
    if (/xbox/i.test(p))               return '🟢 Xbox';
    if (/nintendo|switch/i.test(p))    return '🔴 Switch';
    if (/mac/i.test(p))                return '🍎 Mac';
    if (/android/i.test(p))            return '📱 Android';
    if (/ios|iphone/i.test(p))         return '📱 iOS';
    return p.slice(0, 14);
  }))];

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    fetchGameAIInfo(game.name).then(info => {
      setAiInfo(info);
      setAiLoading(false);
    });
    return () => { document.body.style.overflow = ''; };
  }, [game.name]);

  // ESC 닫기
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  const youtubeSearchUrl = aiInfo?.youtubeQuery
    ? `https://www.youtube.com/results?search_query=${encodeURIComponent(aiInfo.youtubeQuery)}`
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(game.name + ' official trailer')}`;

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div style={{
        width: '100%', maxWidth: 860,
        maxHeight: '90vh',
        background: '#13141c',
        borderRadius: 20,
        border: `1px solid ${color}44`,
        boxShadow: `0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px ${color}22`,
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      }}>

        {/* ── 상단 히어로 이미지 ──────────────────────────────── */}
        <div style={{ position: 'relative', height: 240, flexShrink: 0, overflow: 'hidden' }}>
          <img src={game.img} alt={game.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.currentTarget.src = `https://picsum.photos/seed/${game.id}/860/240`; }}
          />
          {/* 그라디언트 오버레이 */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(19,20,28,0.95) 100%)' }} />

          {/* 닫기 */}
          <button onClick={onClose} style={{
            position: 'absolute', top: 14, right: 14,
            width: 34, height: 34, borderRadius: '50%',
            background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(255,71,87,0.5)'}
          onMouseLeave={e => e.currentTarget.style.background='rgba(0,0,0,0.6)'}
          >✕</button>

          {/* 메타크리틱 */}
          {mc && (
            <div style={{ position: 'absolute', top: 14, left: 14, background: mcCol.bg, border: `1px solid ${mcCol.border}`, borderRadius: 10, padding: '6px 12px', backdropFilter: 'blur(8px)' }}>
              <div style={{ fontFamily: 'Rajdhani', fontWeight: 800, fontSize: 24, color: mcCol.text, lineHeight: 1 }}>{mc}</div>
              <div style={{ fontSize: 9, color: mcCol.text, opacity: 0.8, letterSpacing: 1 }}>METACRITIC</div>
            </div>
          )}

          {/* 타이틀 */}
          <div style={{ position: 'absolute', bottom: 20, left: 24, right: 24 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
              {game.genres.slice(0,3).map(g => (
                <span key={g} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: GENRE_COLOR[g]?`${GENRE_COLOR[g]}33`:'rgba(255,255,255,0.15)', color: GENRE_COLOR[g]||'#c8cce0', border: `1px solid ${GENRE_COLOR[g]||'rgba(255,255,255,0.2)'}55`, fontWeight: 700, letterSpacing: 0.5 }}>{g}</span>
              ))}
            </div>
            <h2 style={{ fontFamily: 'Noto Sans KR', fontWeight: 800, fontSize: 26, color: '#fff', margin: 0, lineHeight: 1.2, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>{game.name}</h2>
            {game.released && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4, fontFamily: 'Noto Sans KR' }}>📅 출시일: {game.released}</div>}
          </div>
        </div>

        {/* ── 탭 바 ───────────────────────────────────────────── */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0, padding: '0 24px' }}>
          {[['info','📋 게임 정보'], ['news','📰 최근 소식'], ['buy','🛒 구매하기']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              padding: '12px 18px', background: 'transparent', border: 'none',
              borderBottom: tab===id ? `2px solid ${color}` : '2px solid transparent',
              color: tab===id ? '#e8eaf2' : '#5a5f78',
              fontSize: 13, fontWeight: tab===id ? 700 : 500,
              cursor: 'pointer', fontFamily: 'Noto Sans KR',
              transition: 'all 0.2s', marginBottom: -1,
            }}>{label}</button>
          ))}
        </div>

        {/* ── 탭 콘텐츠 ──────────────────────────────────────── */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px 24px' }}>

          {/* 정보 탭 */}
          {tab === 'info' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* 기본 스탯 카드 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: 10 }}>
                {[
                  { label: '출시일',   value: game.released || '미정', icon: '📅' },
                  { label: '평점',     value: game.rating ? `⭐ ${game.rating} / 5.0` : '-', icon: '⭐' },
                  { label: '개발사',   value: aiLoading ? '로딩...' : aiInfo?.developer || '-', icon: '🏢' },
                  { label: '퍼블리셔', value: aiLoading ? '로딩...' : aiInfo?.publisher || '-', icon: '📦' },
                ].map(r => (
                  <div key={r.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, color: '#5a5f78', fontFamily: 'Noto Sans KR', marginBottom: 5 }}>{r.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#e8eaf2', fontFamily: 'Noto Sans KR' }}>{r.value}</div>
                  </div>
                ))}
              </div>

              {/* 설명 */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${color}33`, borderRadius: 12, padding: '16px 18px' }}>
                <div style={{ fontSize: 12, color: color, fontWeight: 700, marginBottom: 8, fontFamily: 'Noto Sans KR' }}>📝 게임 소개</div>
                {aiLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#5a5f78', fontSize: 13, fontFamily: 'Noto Sans KR' }}>
                    <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span> AI가 게임 정보를 수집 중...
                  </div>
                ) : (
                  <p style={{ fontSize: 14, color: '#c8cce0', lineHeight: 1.8, margin: 0, fontFamily: 'Noto Sans KR', fontWeight: 500 }}>{aiInfo?.description}</p>
                )}
              </div>

              {/* 게임 특징 */}
              {!aiLoading && aiInfo?.features && (
                <div>
                  <div style={{ fontSize: 12, color: '#8a8fa8', fontWeight: 700, marginBottom: 10, fontFamily: 'Noto Sans KR' }}>✨ 주요 특징</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {aiInfo.features.map((f, i) => (
                      <span key={i} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 999, background: `${color}18`, border: `1px solid ${color}44`, color, fontFamily: 'Noto Sans KR', fontWeight: 600 }}>✓ {f}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* 플랫폼 */}
              {platforms.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, color: '#8a8fa8', fontWeight: 700, marginBottom: 10, fontFamily: 'Noto Sans KR' }}>🖥️ 지원 플랫폼</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {platforms.map(p => (
                      <span key={p} style={{ fontSize: 12, padding: '5px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#e8eaf2', fontFamily: 'Noto Sans KR', fontWeight: 600 }}>{p}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* 트레일러 링크 */}
              <div style={{ background: 'linear-gradient(135deg, rgba(255,0,0,0.08), rgba(255,0,0,0.04))', border: '1px solid rgba(255,0,0,0.25)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontFamily: 'Noto Sans KR', fontWeight: 700, fontSize: 14, color: '#fff', marginBottom: 3 }}>🎬 공식 트레일러</div>
                  <div style={{ fontSize: 12, color: '#8a8fa8', fontFamily: 'Noto Sans KR' }}>YouTube에서 공식 영상 보기</div>
                </div>
                <a href={youtubeSearchUrl} target="_blank" rel="noopener noreferrer" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', background: '#ff0000', border: 'none',
                  borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700,
                  textDecoration: 'none', fontFamily: 'Noto Sans KR',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity='0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity='1'}
                >▶ YouTube에서 보기</a>
              </div>
            </div>
          )}

          {/* 최근 소식 탭 */}
          {tab === 'news' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 12, color: '#5a5f78', fontFamily: 'Noto Sans KR' }}>🤖 AI가 수집한 최근 정보</div>

              {aiLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ fontSize: 28, marginBottom: 12, animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</div>
                  <div style={{ fontSize: 13, color: '#5a5f78', fontFamily: 'Noto Sans KR' }}>AI가 최신 정보를 수집 중...</div>
                </div>
              ) : (
                <>
                  <div style={{ background: 'rgba(74,158,255,0.06)', border: '1px solid rgba(74,158,255,0.2)', borderRadius: 12, padding: '16px 18px' }}>
                    <div style={{ fontSize: 11, color: '#4a9eff', fontWeight: 700, marginBottom: 8, fontFamily: 'Noto Sans KR' }}>📌 최근 업데이트 / 소식</div>
                    <p style={{ fontSize: 14, color: '#c8cce0', lineHeight: 1.8, margin: 0, fontFamily: 'Noto Sans KR', fontWeight: 500 }}>{aiInfo?.recentNews}</p>
                  </div>

                  {/* 커뮤니티 링크 */}
                  <div>
                    <div style={{ fontSize: 12, color: '#8a8fa8', fontWeight: 700, marginBottom: 10, fontFamily: 'Noto Sans KR' }}>🔗 관련 링크</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        { label: 'YouTube 최신 영상', url: `https://www.youtube.com/results?search_query=${encodeURIComponent(game.name + ' 2025')}`, color: '#ff0000', icon: '▶' },
                        { label: '나무위키 게임 정보', url: `https://namu.wiki/w/${encodeURIComponent(game.name)}`, color: '#00c060', icon: '📖' },
                        { label: 'Reddit 커뮤니티',   url: `https://www.reddit.com/search/?q=${encodeURIComponent(game.name)}`, color: '#ff4500', icon: '🔴' },
                        { label: 'RAWG 상세 정보',    url: `https://rawg.io/games/${encodeURIComponent(game.name.toLowerCase().replace(/\s/g,'-'))}`, color: '#4a9eff', icon: '🎮' },
                      ].map(l => (
                        <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer" style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '12px 16px', background: `${l.color}11`,
                          border: `1px solid ${l.color}33`, borderRadius: 10,
                          color: '#e8eaf2', textDecoration: 'none', fontFamily: 'Noto Sans KR',
                          fontSize: 13, fontWeight: 600, transition: 'background 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background=`${l.color}22`}
                        onMouseLeave={e => e.currentTarget.style.background=`${l.color}11`}
                        >
                          <span style={{ color: l.color, fontSize: 16 }}>{l.icon}</span>
                          {l.label}
                          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#5a5f78' }}>→</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 구매하기 탭 */}
          {tab === 'buy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 13, color: '#8a8fa8', fontFamily: 'Noto Sans KR' }}>
                지원 플랫폼에 맞는 스토어에서 구매하세요. 링크는 검색 결과로 연결됩니다.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {storeLinks.map(store => (
                  <a key={store.name} href={store.url} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '16px 20px',
                      background: `${store.color}cc`,
                      border: `1px solid ${store.color}`,
                      borderRadius: 12, color: store.textColor,
                      textDecoration: 'none', fontFamily: 'Noto Sans KR',
                      fontSize: 15, fontWeight: 700,
                      transition: 'transform 0.15s, opacity 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform='translateX(4px)'; e.currentTarget.style.opacity='0.9'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform='translateX(0)'; e.currentTarget.style.opacity='1'; }}
                  >
                    <span style={{ fontSize: 24 }}>{store.icon}</span>
                    <div>
                      <div>{store.name}</div>
                      <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 400, marginTop: 2 }}>에서 "{game.name}" 검색하기 →</div>
                    </div>
                    <span style={{ marginLeft: 'auto', opacity: 0.7, fontSize: 18 }}>→</span>
                  </a>
                ))}
              </div>

              {mc && (
                <div style={{ marginTop: 8, padding: '14px 18px', background: mcCol.bg, border: `1px solid ${mcCol.border}`, borderRadius: 12 }}>
                  <div style={{ fontSize: 12, color: mcCol.text, fontWeight: 700, fontFamily: 'Noto Sans KR', marginBottom: 4 }}>메타크리틱 평점</div>
                  <div style={{ fontFamily: 'Rajdhani', fontWeight: 800, fontSize: 36, color: mcCol.text, lineHeight: 1 }}>{mc}<span style={{ fontSize: 16, opacity: 0.7 }}>/100</span></div>
                  <div style={{ fontSize: 12, color: mcCol.text, opacity: 0.8, marginTop: 4, fontFamily: 'Noto Sans KR' }}>
                    {mc>=90?'압도적으로 긍정적':mc>=75?'매우 긍정적':mc>=60?'긍정적':'보통'}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(30px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
