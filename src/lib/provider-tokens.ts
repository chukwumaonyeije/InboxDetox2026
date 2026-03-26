import { google } from "googleapis";
import { prisma } from "./prisma";

const GOOGLE_SCOPE =
  "openid email profile https://www.googleapis.com/auth/gmail.readonly";
const MICROSOFT_SCOPE = "openid profile email offline_access Mail.Read";
const EXPIRY_BUFFER_MS = 60_000;

function isExpired(expiresAt: number | null | undefined) {
  if (!expiresAt) return false;
  return expiresAt * 1000 <= Date.now() + EXPIRY_BUFFER_MS;
}

async function refreshGoogleAccessToken(accountId: string, refreshToken: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth environment variables are not set");
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const { credentials } = await oauth2Client.refreshAccessToken();
  if (!credentials.access_token) {
    throw new Error("Failed to refresh Google access token");
  }

  await prisma.account.update({
    where: { id: accountId },
    data: {
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token ?? refreshToken,
      expires_at: credentials.expiry_date
        ? Math.floor(credentials.expiry_date / 1000)
        : null,
      scope: credentials.scope ?? GOOGLE_SCOPE,
      token_type: credentials.token_type ?? "Bearer",
    },
  });

  return credentials.access_token;
}

interface MicrosoftRefreshResponse {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
}

async function refreshMicrosoftAccessToken(accountId: string, refreshToken: string) {
  const clientId = process.env.AZURE_AD_CLIENT_ID;
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Microsoft OAuth environment variables are not set");
  }

  const response = await fetch(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        scope: MICROSOFT_SCOPE,
      }),
    }
  );

  const data = (await response.json()) as MicrosoftRefreshResponse;
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || "Failed to refresh Microsoft access token");
  }

  await prisma.account.update({
    where: { id: accountId },
    data: {
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? refreshToken,
      expires_at: data.expires_in
        ? Math.floor(Date.now() / 1000) + data.expires_in
        : null,
      scope: data.scope ?? MICROSOFT_SCOPE,
      token_type: data.token_type ?? "Bearer",
    },
  });

  return data.access_token;
}

export async function getGoogleAccessToken(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  });

  if (!account) {
    throw new Error("No Gmail account connected");
  }

  if (account.access_token && !isExpired(account.expires_at)) {
    return account.access_token;
  }

  if (!account.refresh_token) {
    throw new Error("Google account needs to be reconnected");
  }

  return refreshGoogleAccessToken(account.id, account.refresh_token);
}

export async function getMicrosoftAccessToken(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "microsoft-entra-id" },
  });

  if (!account) {
    throw new Error("No Outlook account connected");
  }

  if (account.access_token && !isExpired(account.expires_at)) {
    return account.access_token;
  }

  if (!account.refresh_token) {
    throw new Error("Microsoft account needs to be reconnected");
  }

  return refreshMicrosoftAccessToken(account.id, account.refresh_token);
}
