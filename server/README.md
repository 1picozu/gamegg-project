# GAME.GG 백엔드 서버 설정 가이드

## 📦 패키지 설치

```bash
cd server
npm install
```

## ⚙️ 환경변수 설정

```bash
# .env.example 을 복사해서 .env 만들기
cp .env.example .env
```

`.env` 파일을 열어서 아래 값들을 채워주세요:

| 변수명 | 설명 | 어디서 받나요 |
|--------|------|--------------|
| `STEAM_API_KEY` | Steam Web API 키 | https://steamcommunity.com/dev/apikey |
| `SESSION_SECRET` | 세션 암호화 키 | 아무 랜덤 문자열 |
| `STEAM_RETURN_URL` | OpenID 콜백 URL | 로컬: http://localhost:3001/auth/steam/return |
| `CLIENT_URL` | 프론트엔드 주소 | 로컬: http://localhost:5173 |

## 🚀 실행 방법

### 개발 모드 (nodemon 자동 재시작)
```bash
cd server
npm run dev
```

### 프로덕션
```bash
cd server
npm start
```

## 📡 API 엔드포인트

### 인증
| Method | URL | 설명 |
|--------|-----|------|
| GET | `/auth/steam` | Steam 로그인 시작 |
| GET | `/auth/steam/return` | OpenID 콜백 (자동) |
| GET | `/auth/me` | 현재 로그인 상태 확인 |
| GET | `/auth/logout` | 로그아웃 |

### 라이브러리
| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/library` | 내 게임 라이브러리 (로그인 필요) |
| GET | `/api/library/:steamId` | 특정 유저 라이브러리 (공개) |

### 리뷰
| Method | URL | 설명 |
|--------|-----|------|
| POST | `/api/reviews/mine` | 내 리뷰 목록 `{ vanityId }` |
| GET | `/api/reviews/:vanityId` | 특정 유저 리뷰 목록 |
| GET | `/api/reviewer/:vanityId/stats` | 리뷰어 통계 |

### 리뷰어 랭킹
| Method | URL | 설명 |
|--------|-----|------|
| POST | `/api/reviewer/register` | 리뷰어 등록 `{ vanityId }` |
| GET | `/api/reviewers/ranking` | 상위 50명 랭킹 |

## 🖥️ 프론트엔드 설정

프론트엔드 `.env` (루트 폴더)에 추가:
```
VITE_SERVER_URL=http://localhost:3001
```

## 🔄 동시 실행 (프론트 + 백엔드)

터미널 2개 열어서:
```bash
# 터미널 1 — 프론트엔드
npm run dev

# 터미널 2 — 백엔드
cd server && npm run dev
```

## ⚠️ 주의사항

- Steam API Key는 절대 Git에 올리지 마세요 (`.gitignore`에 `.env` 추가)
- 실서비스 배포 시 `SESSION_SECRET`을 반드시 변경하세요
- 리뷰 스크래핑은 Steam 서버 부하를 줄이기 위해 10분 캐싱됩니다
- 현재 리뷰어 랭킹은 메모리 저장 → 서버 재시작 시 초기화됩니다 (DB 연동 권장)
