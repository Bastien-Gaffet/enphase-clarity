import type { EnphaseCredentials } from "./types";

const AUTHORIZE_URL = "https://api.enphaseenergy.com/oauth/authorize";
const TOKEN_URL = "https://api.enphaseenergy.com/oauth/token";

export class EnphaseAuthError extends Error {}

function basicAuthHeader(clientId: string, clientSecret: string): string {
  return `Basic ${btoa(`${clientId}:${clientSecret}`)}`;
}

export function buildAuthorizeUrl(clientId: string, redirectUri: string): string {
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  return url.toString();
}

export interface TokenResult {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // unix seconds
}

/** Exchanges an authorization code (from the browser redirect) for an access/refresh token pair. */
export async function exchangeAuthorizationCode(
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  code: string
): Promise<TokenResult> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuthHeader(clientId, clientSecret),
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }).toString(),
  });

  if (!res.ok) {
    throw new EnphaseAuthError(`Échange du code d'autorisation refusé (${res.status})`);
  }

  const json = await res.json();
  const nowSec = Math.floor(Date.now() / 1000);
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: nowSec + json.expires_in,
  };
}

/** Refreshes an access token using the stored refresh token. */
export async function refreshAccessToken(creds: EnphaseCredentials): Promise<TokenResult> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuthHeader(creds.clientId, creds.clientSecret),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: creds.refreshToken,
    }).toString(),
  });

  if (!res.ok) {
    throw new EnphaseAuthError(`Renouvellement du jeton refusé (${res.status})`);
  }

  const json = await res.json();
  const nowSec = Math.floor(Date.now() / 1000);
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? creds.refreshToken,
    expiresAt: nowSec + json.expires_in,
  };
}

/** Extracts `?code=...` from the URL the browser redirects to after login. */
export function extractAuthorizationCode(redirectedUrl: string): string | null {
  try {
    const url = new URL(redirectedUrl);
    return url.searchParams.get("code");
  } catch {
    return null;
  }
}
