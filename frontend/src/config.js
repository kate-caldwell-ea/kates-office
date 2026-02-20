// API configuration - uses relative URLs so it works with any domain
const isDev = import.meta.env.DEV;

export const API_URL = isDev ? 'http://localhost:3001/api' : '/api';
export const WS_URL = isDev 
  ? 'ws://localhost:3001/ws' 
  : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;
