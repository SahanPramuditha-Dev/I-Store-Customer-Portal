export interface Env {
  DELIVERY_ENCRYPTION_KEY: string;
  PC_BRIDGE_TOKEN: string;
  PC_BRIDGE_STORE_REF: string;
  PORTAL_ENABLED?: string;
  ENVIRONMENT: 'development' | 'staging' | 'production';
  PORTAL_DB: D1Database;
  RATE_LIMITS: KVNamespace;
  POS_SHARED_SECRET: string;
  RECEIPT_TOKEN_SECRET: string;
  TURNSTILE_SECRET_KEY: string;
  TURNSTILE_SITE_KEY?: string;
  PORTAL_ORIGIN: string;
  OTP_HMAC_SECRET: string;
  SESSION_SECRET: string;
  WHATSAPP_ACCESS_TOKEN: string;
  WHATSAPP_SERVICE_URL?: string;
  WHATSAPP_SERVICE_SECRET?: string;
  WHATSAPP_PHONE_NUMBER_ID: string;
  WHATSAPP_TEMPLATE_NAME: string;
  POS_API_BASE_URL: string;
  POS_PORTAL_API_TOKEN: string;
}
