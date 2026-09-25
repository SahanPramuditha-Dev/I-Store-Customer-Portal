/**
 * customerAuth.ts
 * WhatsApp OTP authentication adapter for the legacy Supabase portal.
 */

import { supabase } from '../supabase';
const SESSION_STORAGE_KEY = 'istore_customer_session';

export interface CustomerSession {
  phone: string;
  name?: string;
  store_id: string;
  invoice_id?: string;
  session_token: string;
  authenticated_at: string;
}

export interface VerifiedPortalAccess {
  success: boolean;
  session?: CustomerSession;
  invoices?: unknown[];
  customer_name?: string;
  error?: string;
}

export function getStoredCustomerSession(): CustomerSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_e) {
    return null;
  }
}

export function setStoredCustomerSession(session: CustomerSession): void {
  // This is an opaque, short-lived server-issued session. Never persist it
  // beyond the current browser tab.
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearCustomerSession(): void {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

/**
 * Requests a 6-digit verification code sent via WhatsApp.
 */
export async function requestVerificationOtp(
  phone: string,
  channel: 'whatsapp' = 'whatsapp',
  storeName: string = 'I-Store',
  storeId: string = 'default'
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('customer-portal', {
      body: { action: 'request-otp', phone, channel, store_name: storeName, store_id: storeId },
    });
    if (error || !data?.success) {
      return { success: false, error: data?.error || error?.message || 'Could not send verification code.' };
    }
    return { success: true, message: data.message };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to connect to authentication server.' };
  }
}

/**
 * Verifies customer OTP code and establishes authenticated session.
 */
export async function verifyCustomerOtpCode(
  phone: string,
  code: string,
  storeId: string = 'default'
): Promise<VerifiedPortalAccess> {
  try {
    const { data, error } = await supabase.functions.invoke('customer-portal', {
      body: { action: 'verify-otp', phone, code, store_id: storeId },
    });
    if (error || !data?.success) {
      return { success: false, error: data?.error || error?.message || 'Incorrect verification code.' };
    }

    const session: CustomerSession = {
      phone: phone,
      store_id: storeId,
      session_token: data.session_token,
      authenticated_at: new Date().toISOString(),
    };
    setStoredCustomerSession(session);
    return { success: true, session, invoices: data.invoices || [], customer_name: data.customer_name };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'OTP verification request failed.' };
  }
}
