import type { CookieOptions, Response } from 'express';

export const authCookieName = 'mybopkri_session';

function cookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
  };
}

export function setAuthCookie(response: Response, token: string) {
  response.cookie(authCookieName, token, cookieOptions());
}

export function clearAuthCookie(response: Response) {
  const options = cookieOptions();
  delete options.maxAge;
  response.clearCookie(authCookieName, options);
}

export function readAuthCookie(cookieHeader?: string) {
  if (!cookieHeader) return undefined;

  return cookieHeader.split(';').reduce<string | undefined>((token, item) => {
    if (token) return token;
    const [name, ...value] = item.trim().split('=');

    return name === authCookieName
      ? decodeURIComponent(value.join('='))
      : undefined;
  }, undefined);
}
