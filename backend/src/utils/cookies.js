import { config } from '../config/env.js';

export const getSessionCookieOptions = () => {
  return {
    httpOnly: true,
    // When backend is on Render and frontend is on Vercel/Render, cookies are cross-site, so sameSite must be 'none' and secure must be true
    secure: config.isProduction,
    sameSite: config.isProduction ? 'none' : 'lax',
    maxAge: config.jwt.cookieMaxAge,
    path: '/'
  };
};

export const getClearCookieOptions = () => {
  return {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'none' : 'lax',
    path: '/'
  };
};
