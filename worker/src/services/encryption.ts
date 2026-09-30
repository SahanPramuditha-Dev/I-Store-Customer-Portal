// Separate 256-bit key, stored as a Worker secret (64 hex characters).
async function key(secret: string) {
  if (!/^[a-f0-9]{64}$/i.test(secret || '')) throw new Error('Encryption not configured');
  return crypto.subtle.importKey('raw', Uint8Array.from(secret.match(/../g)!, x => parseInt(x, 16)), 'AES-GCM', false, ['encrypt', 'decrypt']);
}
export async function seal(value: string, secret: string, context: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(context) }, await key(secret), new TextEncoder().encode(value));
  return btoa(String.fromCharCode(...iv, ...new Uint8Array(data)));
}
export async function unseal(value: string, secret: string, context: string) {
  const bytes = Uint8Array.from(atob(value), x => x.charCodeAt(0));
  return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12), additionalData: new TextEncoder().encode(context) }, await key(secret), bytes.slice(12)));
}
