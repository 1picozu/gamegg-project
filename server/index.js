require('dotenv').config();

const express    = require('express');
const session    = require('express-session');
const passport   = require('passport');
const cors       = require('cors');
const axios      = require('axios');
const NodeCache  = require('node-cache');
const SteamStrategy = require('passport-steam').Strategy;

const app  = express();
const PORT = process.env.PORT || 3001;
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

// ── 미들웨어 ─────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      process.env.CLIENT_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://localhost:3000',
    ].filter(Boolean);
    // Vercel 프리뷰 도메인 허용
    if (!origin || allowed.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('CORS 차단: ' + origin));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'gamegg_dev_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24,
  },
}));
app.use(passport.initialize());
app.use(passport.session());

// ── Passport Steam ────────────────────────────────────────────────
passport.use(new SteamStrategy(
  {
    returnURL: process.env.STEAM_RETURN_URL || 'http://localhost:3001/auth/steam/return',
    realm:     process.env.STEAM_REALM      || 'http://localhost:3001',
    apiKey:    process.env.STEAM_API_KEY    || '',
  },
  async (identifier, profile, done) => {
    const steamId = profile.id;
    try {
      const library = await getSteamLibrary(steamId);
      return done(null, {
        steamId,
        displayName: profile.displayName,
        avatar:      profile.photos?.[2]?.value || profile.photos?.[0]?.value,
        profileUrl:  profile._json?.profileurl,
        library,
        loginAt: new Date().toISOString(),
      });
    } catch {
      return done(null, {
        steamId,
        displayName: profile.displayName,
        avatar:      profile.photos?.[0]?.value,
        profileUrl:  profile._json?.profileurl,
        library: [],
        loginAt: new Date().toISOString(),
      });
    }
  }
));
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// ══════════════════════════════════════════════════════════════════
//  Steam API 헬퍼
// ══════════════════════════════════════════════════════════════════

// 보유 게임 목록
async function getSteamLibrary(steamId) {
  const key = `lib_${steamId}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const { data } = await axios.get(
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/` +
    `?key=${process.env.STEAM_API_KEY}&steamid=${steamId}` +
    `&include_appinfo=true&include_played_free_games=true&format=json`,
    { timeout: 8000 }
  );
  const games = (data.response?.games || [])
    .map(g => ({
      appid:           g.appid,
      name:            g.name,
      playtime_hours:  Math.round((g.playtime_forever || 0) / 60 * 10) / 10,
      playtime_2weeks: Math.round((g.playtime_2weeks  || 0) / 60 * 10) / 10,
      img_icon: g.img_icon_url
        ? `https://media.steampowered.com/steamcommunity/public/images/apps/${g.appid}/${g.img_icon_url}.jpg`
        : null,
    }))
    .sort((a, b) => b.playtime_hours - a.playtime_hours);

  cache.set(key, games);
  return games;
}

// 유저 프로필
async function getSteamProfile(steamId) {
  const key = `profile_${steamId}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const { data } = await axios.get(
    `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/` +
    `?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`,
    { timeout: 6000 }
  );
  const p = data.response?.players?.[0] || {};
  const result = {
    steamId,
    displayName:  p.personaname,
    avatar:       p.avatarfull || p.avatar,
    profileUrl:   p.profileurl,
    countryCode:  p.loccountrycode,
    memberSince:  p.timecreated ? new Date(p.timecreated * 1000).getFullYear() : null,
    visibility:   p.communityvisibilitystate,
  };
  cache.set(key, result);
  return result;
}

// ── 핵심: 공식 API로 유저가 쓴 리뷰 가져오기 ────────────────────
// Steam의 appreviews API는 게임별로만 조회 가능
// → 유저가 보유한 게임들을 순회하면서 해당 유저의 리뷰를 찾음
async function getUserReviews(steamId, maxGames = 100) {
  const cacheKey = `reviews_${steamId}`;
  const hit = cache.get(cacheKey);
  if (hit) return hit;

  // 1) 보유 게임 목록 (플레이타임 많은 순 상위 N개만 조회)
  let library = [];
  try {
    library = await getSteamLibrary(steamId);
  } catch {
    return [];
  }

  const topGames = library.slice(0, maxGames);
  const reviews  = [];

  // 2) 배치로 병렬 조회 (한 번에 10개씩)
  const BATCH = 10;
  for (let i = 0; i < topGames.length; i += BATCH) {
    const batch = topGames.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map(async (game) => {
        try {
          const { data } = await axios.get(
            `https://store.steampowered.com/appreviews/${game.appid}` +
            `?json=1&filter=all&language=all&review_type=all&purchase_type=all&num_per_page=100`,
            { timeout: 5000 }
          );
          // steamId 가 쓴 리뷰만 필터
          const mine = (data.reviews || []).find(
            r => r.author?.steamid === steamId
          );
          if (!mine) return null;
          return {
            appid:        game.appid,
            gameName:     game.name,
            gameImg:      game.img_icon,
            recommended:  mine.voted_up,
            reviewText:   mine.review?.slice(0, 600) || '',
            playtime_at_review: Math.round((mine.author?.playtime_at_review || 0) / 60),
            playtime_total:     game.playtime_hours,
            votes_up:     mine.votes_up     || 0,
            votes_funny:  mine.votes_funny  || 0,
            timestamp:    new Date((mine.timestamp_created || 0) * 1000).toISOString(),
          };
        } catch {
          return null;
        }
      })
    );
    results.forEach(r => { if (r.status === 'fulfilled' && r.value) reviews.push(r.value); });
    // 게임이 많으면 Steam rate-limit 방지
    if (i + BATCH < topGames.length) await new Promise(r => setTimeout(r, 300));
  }

  // 최신순 정렬
  reviews.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  cache.set(cacheKey, reviews, 300); // 5분 캐시
  return reviews;
}

// 리뷰어 통계 계산
function calcStats(reviews) {
  const positive     = reviews.filter(r => r.recommended).length;
  const negative     = reviews.length - positive;
  const positiveRate = reviews.length > 0 ? Math.round((positive / reviews.length) * 100) : 0;
  const totalVotes   = reviews.reduce((s, r) => s + r.votes_up, 0);
  const expertScore  = Math.min(100, Math.round(
    (reviews.length * 4) + (positiveRate * 0.3) + (Math.min(totalVotes, 50) * 0.5)
  ));
  return { totalReviews: reviews.length, positive, negative, positiveRate, totalVotes, expertScore };
}

// ══════════════════════════════════════════════════════════════════
//  인증 라우터
// ══════════════════════════════════════════════════════════════════
app.get('/auth/steam',
  passport.authenticate('steam', { failureRedirect: '/' })
);
app.get('/auth/steam/return',
  passport.authenticate('steam', { failureRedirect: '/auth/fail' }),
  (req, res) => {
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/reviews?steam=success`);
  }
);
app.get('/auth/fail', (req, res) => res.status(401).json({ error: 'Steam 로그인 실패' }));
app.get('/auth/logout', (req, res) => {
  req.logout(() => { req.session.destroy(); res.json({ success: true }); });
});
app.get('/auth/me', (req, res) => {
  if (!req.user) return res.json({ loggedIn: false });
  res.json({
    loggedIn: true,
    user: {
      steamId:     req.user.steamId,
      displayName: req.user.displayName,
      avatar:      req.user.avatar,
      profileUrl:  req.user.profileUrl,
      loginAt:     req.user.loginAt,
    },
  });
});

// ══════════════════════════════════════════════════════════════════
//  리뷰 API
// ══════════════════════════════════════════════════════════════════

// 내 리뷰 — 로그인된 SteamID로 자동 조회
app.get('/api/reviews/mine', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: '로그인 필요' });
  try {
    console.log(`[리뷰] ${req.user.displayName}(${req.user.steamId}) 리뷰 수집 시작...`);
    const reviews = await getUserReviews(req.user.steamId);
    const stats   = calcStats(reviews);
    console.log(`[리뷰] ${reviews.length}개 수집 완료`);
    res.json({ success: true, ...stats, reviews });
  } catch (err) {
    console.error('[리뷰 에러]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 특정 유저 리뷰 (SteamID64로 조회)
app.get('/api/reviews/:steamId', async (req, res) => {
  try {
    const reviews = await getUserReviews(req.params.steamId);
    const stats   = calcStats(reviews);
    res.json({ success: true, ...stats, reviews });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════
//  라이브러리 API
// ══════════════════════════════════════════════════════════════════
app.get('/api/library', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: '로그인 필요' });
  try {
    const library = await getSteamLibrary(req.user.steamId);
    res.json({ success: true, count: library.length, games: library });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════
//  리뷰어 랭킹
// ══════════════════════════════════════════════════════════════════
let registeredReviewers = [];

// 리뷰어 등록 (로그인 후 자동으로 본인 SteamID 사용)
app.post('/api/reviewer/register', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: '로그인 필요' });
  try {
    console.log(`[등록] ${req.user.displayName} 리뷰어 등록 중...`);
    const reviews = await getUserReviews(req.user.steamId);
    const stats   = calcStats(reviews);

    const reviewer = {
      steamId:      req.user.steamId,
      displayName:  req.user.displayName,
      avatar:       req.user.avatar,
      profileUrl:   req.user.profileUrl,
      ...stats,
      registeredAt:  new Date().toISOString(),
      recentReviews: reviews.slice(0, 3),
    };

    const idx = registeredReviewers.findIndex(r => r.steamId === req.user.steamId);
    if (idx >= 0) registeredReviewers[idx] = reviewer;
    else registeredReviewers.push(reviewer);
    registeredReviewers.sort((a, b) => b.expertScore - a.expertScore);

    res.json({ success: true, reviewer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reviewers/ranking', (req, res) => {
  res.json({ success: true, total: registeredReviewers.length, ranking: registeredReviewers.slice(0, 50) });
});

// ── 헬스체크 ──────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`\n🎮 GAME.GG 서버: http://localhost:${PORT}`);
  console.log(`   Steam 로그인: http://localhost:${PORT}/auth/steam\n`);
});
