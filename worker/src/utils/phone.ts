export function normalizeSriLankanPhone(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  if (/^94\d{9}$/.test(digits)) return digits;
  if (/^0\d{9}$/.test(digits)) return `94${digits.slice(1)}`;
  if (/^\d{9}$/.test(digits)) return `94${digits}`;
  return null;
}

export function maskPhone(phone: string): string {
  return `+${phone.slice(0, 4)} *** **${phone.slice(-2)}`;
}
