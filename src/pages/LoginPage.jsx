import { useState } from 'react';
import { useApp } from '../store/AppContext';

export default function LoginPage() {
  const { navigate, login } = useApp();
  const [tab,      setTab]      = useState('login'); // 'login' | 'signup'
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');

  const handleLogin = () => {
    if (!nickname.trim()) { setError('닉네임을 입력하세요.'); return; }
    if (!password.trim()) { setError('비밀번호를 입력하세요.'); return; }
    login({ nickname: nickname.trim(), id: Date.now() });
    navigate('home');
  };

  const inputStyle = {
    width:'100%', background:'rgba(255,255,255,0.04)',
    border:'1px solid rgba(255,255,255,0.12)', borderRadius:8,
    color:'#e2e4ed', padding:'11px 14px', fontSize:14,
    fontFamily:'Noto Sans KR', outline:'none', boxSizing:'border-box',
    transition:'border-color 0.2s',
  };

  return (
    <div style={{
      minHeight:'calc(100vh - 56px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:16,
    }}>
      <div style={{ width:'100%', maxWidth:400, animation:'fadeInUp 0.35s ease' }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{
            width:52, height:52, borderRadius:14, margin:'0 auto 10px',
            background:'linear-gradient(135deg,#4a9eff,#7c5cfc)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:'Rajdhani', fontWeight:700, fontSize:22, color:'#fff',
          }}>GG</div>
          <div style={{
            fontFamily:'Rajdhani', fontWeight:700, fontSize:26,
            background:'linear-gradient(135deg,#4a9eff,#7c5cfc)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
          }}>GAME.GG</div>
          <div style={{ fontSize:13, color:'#8a8fa8', marginTop:4, fontFamily:'Noto Sans KR' }}>
            같이 게임하는 세상
          </div>
        </div>

        <div className="card p-6">
          {/* Tabs */}
          <div style={{ display:'flex', marginBottom:24, background:'rgba(255,255,255,0.04)', borderRadius:8, padding:3 }}>
            {['login','signup'].map(t => (
              <button key={t} onClick={() => { setTab(t); setError(''); }}
                style={{
                  flex:1, padding:'8px', border:'none', borderRadius:6,
                  background: tab === t ? 'rgba(74,158,255,0.2)' : 'transparent',
                  color: tab === t ? '#4a9eff' : '#8a8fa8',
                  fontSize:13, fontWeight:600, cursor:'pointer',
                  fontFamily:'Noto Sans KR', transition:'all 0.2s',
                }}
              >{t === 'login' ? '로그인' : '회원가입'}</button>
            ))}
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {tab === 'signup' && (
              <div>
                <div style={{ fontSize:12, color:'#8a8fa8', marginBottom:5 }}>이메일</div>
                <input placeholder="game@example.com" style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor='#4a9eff'}
                  onBlur={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'}
                />
              </div>
            )}

            <div>
              <div style={{ fontSize:12, color:'#8a8fa8', marginBottom:5 }}>닉네임</div>
              <input
                value={nickname} onChange={e => { setNickname(e.target.value); setError(''); }}
                placeholder="게임 닉네임"
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor='#4a9eff'}
                onBlur={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'}
                onKeyDown={e => e.key==='Enter' && handleLogin()}
              />
            </div>

            <div>
              <div style={{ fontSize:12, color:'#8a8fa8', marginBottom:5 }}>비밀번호</div>
              <input
                type="password" value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="비밀번호"
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor='#4a9eff'}
                onBlur={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'}
                onKeyDown={e => e.key==='Enter' && handleLogin()}
              />
            </div>

            {error && (
              <div style={{ fontSize:12, color:'#ff4757', background:'rgba(255,71,87,0.08)', padding:'8px 12px', borderRadius:6 }}>
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              style={{
                width:'100%', padding:'12px',
                background:'linear-gradient(135deg,#4a9eff,#7c5cfc)',
                border:'none', borderRadius:10, color:'#fff',
                fontSize:15, fontWeight:700, cursor:'pointer',
                fontFamily:'Noto Sans KR', marginTop:4, transition:'opacity 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity='0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity='1'}
            >{tab === 'login' ? '로그인' : '회원가입'}</button>

            <button
              onClick={() => navigate('home')}
              style={{
                background:'none', border:'none', color:'#8a8fa8',
                fontSize:12, cursor:'pointer', fontFamily:'Noto Sans KR', padding:4,
              }}
            >← 메인으로 돌아가기</button>
          </div>
        </div>
      </div>
      <style>{`@keyframes fadeInUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}
