export const TOKEN_KEY = 'laudos_token';

export interface TokenPayload {
  uid: string;
  username: string;
  role: string;
  fullName: string;
  crm: string;
  exp: number;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const jsonString = new TextDecoder('utf-8').decode(bytes);
    const payload = JSON.parse(jsonString);
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

export function getCurrentUser(): TokenPayload | null {
  const token = getToken();
  if (!token) return null;
  const payload = decodeToken(token);
  if (!payload || payload.exp * 1000 < Date.now()) {
    removeToken();
    return null;
  }
  return payload;
}

export function isAdmin(): boolean {
  return getCurrentUser()?.role === 'Admin';
}
