import { useState } from 'react';
import { useApp } from '../store/AppContext';

const GAMES = ['리그오브레전드','발로란트','PUBG','오버워치 2','스타크래프트 2','디아블로 4','배틀그라운드','로스트아크'];
const TIERS = ['챌린저','마스터','다이아','에메랄드','플래티넘','골드','실버','브론즈'];
const TIMES = ['지금 바로','30분 후','1시간 후','오늘 저녁 7시','오늘 저녁 8시','오늘 저녁 9시','오늘 저녁 10시','오늘 밤 11시','내일 오전'];

export default function CreatePost() {
  const { state, navigate, addFriendsPost, addScrimPost } = useApp();
  const { pageParams, user } = state;
  const mode = pageParams.mode || 'friends'; // 'friends' | 'scrim'
  const isFriends = mode === 'friends';

  const [form, setForm] = useState({
    game: '리그오브레전드',
    title: '',
    time: '지금 바로',
    maxSlots: isFriends ? 4 : 10,
    tier: '골드',
    tag: '',
    desc: '',
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = '방 제목을 입력해주세요.';
    if (form.title.trim().length < 5) e.title = '제목은 5자 이상 입력해주세요.';
    return e;
  };

  const handleSubmit = () => {
    if (!user) { navigate('login'); return; }
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    const post = {
      game:   form.game,
      title:  form.title.trim(),
      time:   form.time,
      slots:  `1/${form.maxSlots}`,
      tier:   form.tier,
      tag:    form.tag.trim() || null,
      desc:   form.desc.trim(),
      author: user.nickname,
    };

    if (isFriends) addFriendsPost(post);
    else           addScrimPost(post);

    setSubmitted(true);
    setTimeout(() => navigate(isFriends ? 'friends' : 'scrim'), 1200);
  };

  const Label = ({ children, htmlFor }) => (
    <label htmlFor={htmlFor} style={{ fontSize:12, color:'#8a8fa8', marginBottom:5, display:'block', fontFamily:'Noto Sans KR' }}>
      {children}
    </label>
  );

  const inputStyle = {
    width:'100%', background:'rgba(255,255,255,0.04)',
    border:'1px solid rgba(255,255,255,0.1)', borderRadius:8,
    color:'#e2e4ed', padding:'10px 12px', fontSize:13,
    fontFamily:'Noto Sans KR', transition:'border-color 0.2s', outline:'none',
    boxSizing:'border-box',
  };

  const accentColor = isFriends ? '#4a9eff' : '#ff4757';

  return (
    <div style={{ maxWidth:640, margin:'0 auto', padding:'32px 16px', animation:'fadeInUp 0.3s ease' }}>
      <button
        onClick={() => navigate(isFriends ? 'friends' : 'scrim')}
        style={{
          display:'flex', alignItems:'center', gap:6, background:'transparent', border:'none',
          color:'#8a8fa8', fontSize:13, cursor:'pointer', marginBottom:20, fontFamily:'Noto Sans KR', padding:0,
        }}
        onMouseEnter={e => e.currentTarget.style.color=accentColor}
        onMouseLeave={e => e.currentTarget.style.color='#8a8fa8'}
      >← {isFriends ? '게임친구 찾기' : '게임 내전 찾기'}로 돌아가기</button>

      {/* 성공 메시지 */}
      {submitted && (
        <div style={{
          textAlign:'center', padding:'40px 20px',
          background:'rgba(0,214,143,0.08)', border:'1px solid rgba(0,214,143,0.3)',
          borderRadius:14, marginBottom:20,
          animation:'fadeInUp 0.4s ease',
        }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🎉</div>
          <div style={{ fontFamily:'Noto Sans KR', fontWeight:700, fontSize:18, color:'#00d68f', marginBottom:6 }}>
            {isFriends ? '파티' : '내전 방'}이 생성되었습니다!
          </div>
          <div style={{ fontSize:13, color:'#8a8fa8' }}>잠시 후 목록으로 이동합니다...</div>
        </div>
      )}

      {!submitted && (
        <div className="card p-6">
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
            <div style={{
              width:36, height:36, borderRadius:8, fontSize:18,
              background:`${accentColor}22`, border:`1px solid ${accentColor}44`,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>{isFriends ? '🎮' : '⚔️'}</div>
            <div>
              <div className="section-title">{isFriends ? '새 파티 만들기' : '내전 방 만들기'}</div>
              <div style={{ fontSize:12, color:'#8a8fa8', marginTop:2 }}>
                {isFriends ? '같이 게임할 파티원을 모집해보세요' : '5대5 내전 참가자를 모집해보세요'}
              </div>
            </div>
          </div>

          {!user && (
            <div style={{
              padding:'12px 16px', background:'rgba(255,166,35,0.08)',
              border:'1px solid rgba(255,166,35,0.3)', borderRadius:8, marginBottom:20,
              fontSize:13, color:'#f5a623', fontFamily:'Noto Sans KR',
            }}>
              ⚠️ 로그인 후 글을 작성할 수 있습니다.{' '}
              <button onClick={() => navigate('login')} style={{ color:'#4a9eff', background:'none', border:'none', cursor:'pointer', fontFamily:'Noto Sans KR', fontSize:13 }}>
                로그인하기 →
              </button>
            </div>
          )}

          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* 게임 선택 */}
            <div>
              <Label>게임 *</Label>
              <select
                className="ggg-select"
                value={form.game}
                onChange={e => set('game', e.target.value)}
                style={{ ...inputStyle }}
              >
                {GAMES.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>

            {/* 방 제목 */}
            <div>
              <Label>방 제목 *</Label>
              <input
                className="ggg-input"
                value={form.title}
                onChange={e => { set('title', e.target.value); setErrors({}); }}
                placeholder={isFriends ? '예) 실버 이상 솔랭 같이 하실 분~' : '예) 에메랄드+ 5대5 내전 참가자 모집'}
                style={{ ...inputStyle, borderColor: errors.title ? '#ff4757' : undefined }}
              />
              {errors.title && <div style={{ fontSize:11, color:'#ff4757', marginTop:4 }}>{errors.title}</div>}
            </div>

            {/* 2열 */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <Label>플레이 시간</Label>
                <select className="ggg-select" value={form.time} onChange={e => set('time', e.target.value)} style={inputStyle}>
                  {TIMES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <Label>최대 인원 ({form.maxSlots}명)</Label>
                <input
                  type="range"
                  min={isFriends ? 2 : 4}
                  max={isFriends ? 6 : 10}
                  step={isFriends ? 1 : 2}
                  value={form.maxSlots}
                  onChange={e => set('maxSlots', Number(e.target.value))}
                  style={{ width:'100%', accentColor }}
                />
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#5a5f78' }}>
                  <span>{isFriends ? '2명' : '4명'}</span><span>{isFriends ? '6명' : '10명'}</span>
                </div>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <Label>최소 티어</Label>
                <select className="ggg-select" value={form.tier} onChange={e => set('tier', e.target.value)} style={inputStyle}>
                  {TIERS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <Label>태그 (선택)</Label>
                <input
                  className="ggg-input"
                  value={form.tag}
                  onChange={e => set('tag', e.target.value)}
                  placeholder="예) 마이크 필수, 즐겜"
                  style={inputStyle}
                  maxLength={15}
                />
              </div>
            </div>

            {/* 상세 설명 */}
            <div>
              <Label>상세 설명 (선택)</Label>
              <textarea
                value={form.desc}
                onChange={e => set('desc', e.target.value)}
                placeholder="추가로 전달할 내용을 자유롭게 작성해주세요."
                rows={3}
                style={{ ...inputStyle, resize:'vertical', lineHeight:1.6 }}
              />
            </div>

            <button
              onClick={handleSubmit}
              style={{
                width:'100%', padding:'13px',
                background:`linear-gradient(135deg, ${accentColor}, ${isFriends ? '#7c5cfc' : '#ff6b35'})`,
                border:'none', borderRadius:10, color:'#fff',
                fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'Noto Sans KR',
                transition:'opacity 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity='0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity='1'}
            >
              {isFriends ? '🎮 파티 만들기' : '⚔️ 내전 방 만들기'}
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes fadeInUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}
