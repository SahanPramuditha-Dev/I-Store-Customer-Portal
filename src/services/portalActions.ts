import { supabase } from '../supabase';
import { getStoredCustomerSession } from './customerAuth';

async function invoke(action: string, payload: Record<string, unknown> = {}) {
  const session = getStoredCustomerSession();
  if (!session?.session_token) throw new Error('Your secure session has expired. Please verify your number again.');
  const { data, error } = await supabase.functions.invoke('customer-portal', {
    body: { action, session_token: session.session_token, ...payload },
  });
  if (error || !data?.success) throw new Error(data?.error || error?.message || 'Request could not be completed.');
  return data;
}

export const getPortalState = () => invoke('get-portal-state');
export const getAuthorizedInvoices = () => invoke('get-invoices');
export const createRepairRequest = (payload: Record<string, unknown>) => invoke('create-repair', payload);
export const createAppointment = (payload: Record<string, unknown>) => invoke('create-appointment', payload);
export const createWarrantyClaim = (payload: Record<string, unknown>) => invoke('create-warranty-claim', payload);
export const submitFeedback = (payload: Record<string, unknown>) => invoke('submit-feedback', payload);
