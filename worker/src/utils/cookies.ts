export function getCookie(request: Request, name: string): string | null {
  const value = request.headers.get('Cookie') || '';
  const match = value.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export function sessionCookie(token: string, maxAgeSeconds = 1800): string {
  return `portal_session=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`;
}

export function clearSessionCookie(): string {
  return 'portal_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0';
}
