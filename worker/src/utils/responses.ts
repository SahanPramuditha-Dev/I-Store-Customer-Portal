export function requestId(): string {
  return crypto.randomUUID();
}

export function json(body: unknown, requestIdValue: string, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Request-Id': requestIdValue,
    },
  });
}

export function error(code: string, message: string, requestIdValue: string, status: number): Response {
  return json({ success: false, error: { code, message }, requestId: requestIdValue }, requestIdValue, status);
}
