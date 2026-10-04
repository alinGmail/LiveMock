import express from "express";

/**
 * Read the configured trusted-proxy setting. Unset, empty or "false" disables
 * forwarding-header support entirely; any other value is a comma-separated
 * IP/CIDR list handed to Express's `trust proxy`.
 */
export function getTrustProxySetting(
  raw: string | undefined = process.env.LIVEMOCK_TRUST_PROXY
): string | false {
  const value = (raw ?? "").trim();
  if (value === "" || value.toLowerCase() === "false") {
    return false;
  }
  return value;
}

/**
 * Apply LIVEMOCK_TRUST_PROXY to the app. Invalid entries throw immediately so
 * the process fails startup instead of silently disabling the protection.
 */
export function applyTrustProxy(app: express.Express, raw?: string): void {
  const setting = getTrustProxySetting(raw);
  try {
    app.set("trust proxy", setting);
  } catch (err: any) {
    throw new Error(
      `invalid LIVEMOCK_TRUST_PROXY value "${setting}": ${err?.message ?? err}`
    );
  }
}
