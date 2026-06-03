import { createContext, useContext, useReducer } from 'react';
import { friendsFeedData, scrimFeedData } from '../mockData';

let nextId = 1000;

const initialState = {
  page: 'home',      // 'home'|'friends'|'scrim'|'games'|'balancer'|'login'|'post-detail'|'create-post'
  pageParams: {},

  friendsPosts: friendsFeedData.map(p => ({
    ...p, id: nextId++,
    createdAt: new Date(Date.now() - Math.random() * 7200000).toISOString(),
    author: p.author || ['Shadow', 'IronWolf', 'StarBurst', 'NightOwl', 'BlueFire'][Math.floor(Math.random()*5)],
    tier: p.tier || ['골드','실버','플래티넘','다이아'][Math.floor(Math.random()*4)],
    desc: p.desc || '',
  })),
  scrimPosts: scrimFeedData.map(p => ({
    ...p, id: nextId++,
    createdAt: new Date(Date.now() - Math.random() * 7200000).toISOString(),
    author: p.author || ['NightHawk','IceDragon','BlazeKing','StormRider','VoidWalker'][Math.floor(Math.random()*5)],
    tier: p.tier || ['에메랄드','다이아','마스터','플래티넘'][Math.floor(Math.random()*4)],
    desc: p.desc || '',
  })),

  user: null,
  toast: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'NAVIGATE':
      return { ...state, page: action.page, pageParams: action.params || {} };

    case 'ADD_FRIENDS_POST': {
      const post = { ...action.post, id: ++nextId, createdAt: new Date().toISOString() };
      return { ...state, friendsPosts: [post, ...state.friendsPosts] };
    }
    case 'ADD_SCRIM_POST': {
      const post = { ...action.post, id: ++nextId, createdAt: new Date().toISOString() };
      return { ...state, scrimPosts: [post, ...state.scrimPosts] };
    }

    case 'JOIN_POST': {
      const { postId, feed } = action;
      const key = feed === 'friends' ? 'friendsPosts' : 'scrimPosts';
      return {
        ...state,
        [key]: state[key].map(p => {
          if (p.id !== postId) return p;
          const [cur, max] = p.slots.split('/').map(Number);
          if (cur >= max) return p;
          return { ...p, slots: `${cur+1}/${max}` };
        }),
      };
    }

    case 'LOGIN':
      return { ...state, user: action.user, toast: { msg: `${action.user.nickname}님 환영합니다! 🎮`, type: 'success' } };
    case 'LOGOUT':
      return { ...state, user: null, toast: { msg: '로그아웃되었습니다.', type: 'info' } };
    case 'CLEAR_TOAST':
      return { ...state, toast: null };

    default:
      return state;
  }
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const navigate      = (page, params={}) => dispatch({ type:'NAVIGATE', page, params });
  const addFriendsPost = post => dispatch({ type:'ADD_FRIENDS_POST', post });
  const addScrimPost   = post => dispatch({ type:'ADD_SCRIM_POST',   post });
  const joinPost  = (postId, feed) => dispatch({ type:'JOIN_POST', postId, feed });
  const login     = user => dispatch({ type:'LOGIN', user });
  const logout    = ()   => dispatch({ type:'LOGOUT' });
  const clearToast= ()   => dispatch({ type:'CLEAR_TOAST' });

  return (
    <AppContext.Provider value={{ state, navigate, addFriendsPost, addScrimPost, joinPost, login, logout, clearToast }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
