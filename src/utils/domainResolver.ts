/**
 * domainResolver.ts
 * Resolves the active merchant / tenant store slug dynamically from:
 * 1. Explicit Route Parameter (e.g. /store/:storeSlug/...)
 * 2. URL Search Query Parameter (e.g. ?store=freshland)
 * 3. Custom Vanity Domain or Subdomain (e.g. freshland.e-store.lk or bills.freshland.com)
 */

export function resolveStoreSlug(routeSlug?: string): string {
  if (routeSlug && routeSlug.trim()) {
    return routeSlug.trim().toLowerCase();
  }

  // 1. Check URL query parameters (?store=...)
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const queryStore = params.get("store") || params.get("shop") || params.get("tenant");
    if (queryStore && queryStore.trim()) {
      return queryStore.trim().toLowerCase();
    }

    // 2. Resolve Custom Vanity Subdomain
    const hostname = window.location.hostname.toLowerCase();

    // Ignore direct IP addresses, localhost, and root platform domains
    const ignoreList = ["localhost", "127.0.0.1", "e-store.lk", "vercel.app", "pages.dev", "netlify.app"];
    if (!ignoreList.includes(hostname) && !/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      const parts = hostname.split(".");
      if (parts.length >= 3) {
        // e.g. freshland.e-store.lk -> "freshland"
        // e.g. bills.freshland.com -> "freshland" (if subdomain is a prefix)
        const sub = parts[0];
        if (sub === "bills" || sub === "portal" || sub === "receipts" || sub === "my") {
          return parts[1];
        }
        return sub;
      }
    }
  }

  return "default";
}
