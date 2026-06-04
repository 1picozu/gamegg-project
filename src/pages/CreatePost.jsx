import { useState } from 'react';
import { useApp } from '../store/AppContext';

// 1. 목록 끝에 '직접 적기' 항목을 추가했습니다.
const GAMES = ['리그오브레전드','발로란트','PUBG','오버워치 2','스타크래프트 2','디아블로 4','배틀그라운드','로스트아크','직접 적기'];
const TIERS = ['챌린저','마스터','다이아','에메랄드','플래티넘','골드','실버','브론즈','직접 적기'];

// 디스코드 링크 상수로 지정
const DISCORD_LINK = "https://discord.gg/aM5A46wkq";

export default function CreatePost() {
  const { state, navigate, addFriendsPost, addScrimPost } = useApp();
  const { pageParams, user } = state;
  const mode = pageParams.mode || 'friends'; // 'friends' | 'scrim'
  const isFriends = mode === 'friends';

  // 2. 상태(State)에 customGame과 customTier를 추가했습니다.
  const [form, setForm] = useState({
    game: '리그오브레전드',
    customGame: '',
    title: '',
    time: '', // 시간 입력을 위해 초기값을 비워둡니다
    maxSlots: isFriends ? 4 : 10,
    tier: '골드',
    customTier: '',
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