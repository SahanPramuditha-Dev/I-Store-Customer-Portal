export function clientIp(request: Request): string {
  return request.headers.get('CF-Connecting-IP') || 'unknown';
}

export function userAgent(request: Request): string {
  return request.headers.get('User-Agent') || 'unknown';
}
