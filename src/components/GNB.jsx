import { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';

const NAV_ITEMS = [
  { label:'메인화면',       page:'home' },
  { label:'게임 목록',      page:'games' },
  { label:'게임친구 찾기',  page:'friends' },
  { label:'게임 내전 찾기', page:'scrim' },
  { label:'게임 게시판',    page:'board' },
  { label:'밸런스 생성기',  page:'balancer' },
];

export default function GNB({ darkMode, toggleDark }) {
  const { state, navigate, logout } = useApp();
  const { page, user } = state;
  const [scrolled,     setScrolled]     = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // 외부 클릭 시 유저 메뉴 닫기
  useEffect(() => {
    if (!showUserMenu) return;
    const fn = () => setShowUserMenu(false);
    setTimeout(() => document.addEventListener('click', fn), 0);
    return () => document.removeEventListener('click', fn);
  }, [showUserMenu]);

  return (
    <nav className="gnb sticky top-0 z-50 w-full"
      style={{ boxShadow: scrolled?'0 4px 24px rgba(0,0,0,0.4)':'none', transition:'box-shadow 0.3s' }}>
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        {/* 로고 */}
        <button onClick={()=>navigate('home')} style={{ display:'flex', alignItems:'center', gap:8, background:'none', border:'none', cursor:'pointer', flexShrink:0 }}>
          <div style={{ background:'linear-gradient(135deg,#4a9eff,#7c5cfc)', borderRadius:8, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Rajdhani', fontWeight:700, fontSize:14, color:'#fff' }}>GG</div>
          <span style={{ fontFamily:'Rajdhani', fontWeight:700, fontSize:20, background:'linear-gradient(135deg,#4a9eff,#7c5cfc)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', letterSpacing:1 }}>GAME.GG</span>
        </button>

        {/* 네비 */}
        <div className="flex items-center gap-0.5 overflow-x-auto flex-1" style={{ scrollbarWidth:'none', minWidth:0 }}>
          {NAV_ITEMS.map(item => (
            <button key={item.page} className={`nav-btn ${page===item.page?'active':''}`} onClick={()=>navigate(item.page)}>
              {item.label}
            </button>
          ))}
        </div>

        {/* 우측 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={toggleDark} title={darkMode?'라이트 모드':'다크 모드'} style={{ width:34, height:34, borderRadius:'50%', border:'1px solid rgba(255,255,255,0.1)', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, transition:'background 0.2s' }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.08)'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}
          >{darkMode?'☀️':'🌙'}</button>

          {user ? (
            <div style={{ position:'relative' }} onClick={e=>e.stopPropagation()}>
              <button onClick={()=>setShowUserMenu(m=>!m)} style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(74,158,255,0.12)', border:'1px solid rgba(74,158,255,0.3)', borderRadius:8, padding:'5px 12px', cursor:'pointer', color:'#4a9eff', fontSize:13, fontWeight:600, fontFamily:'Noto Sans KR' }}>
                <span style={{ width:22, height:22, borderRadius:'50%', background:'linear-gradient(135deg,#4a9eff,#7c5cfc)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#fff', fontWeight:700 }}>{user.nickname[0]}</span>
                {user.nickname}
              </button>
              {showUserMenu && (
                <div style={{ position:'absolute', top:42, right:0, background:'#1e2130', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:6, minWidth:130, zIndex:999, boxShadow:'0 8px 24px rgba(0,0,0,0.5)' }}>
                  <button onClick={()=>{logout();setShowUserMenu(false);}} style={{ width:'100%', textAlign:'left', padding:'8px 12px', background:'transparent', border:'none', color:'#ff4757', fontSize:13, cursor:'pointer', borderRadius:6, fontFamily:'Noto Sans KR' }}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,71,87,0.1)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                  >로그아웃</button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={()=>navigate('login')} style={{ background:'linear-gradient(135deg,#4a9eff,#7c5cfc)', border:'none', borderRadius:6, color:'#fff', padding:'6px 16px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Noto Sans KR', transition:'opacity 0.2s' }}
              onMouseEnter={e=>e.currentTarget.style.opacity='0.85'}
              onMouseLeave={e=>e.currentTarget.style.opacity='1'}
            >로그인</button>
          )}
        </div>
      </div>
    </nav>
  );
}
