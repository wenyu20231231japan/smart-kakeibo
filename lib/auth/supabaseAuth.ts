export type AuthUser = {
  id: string;
  email: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: AuthUser;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const AUTH_STORAGE_KEY = "smart-kakeibo-auth-session";

function getSupabaseConfig() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase is not configured.");
  }

  return {
    url: SUPABASE_URL.replace(/\/$/, ""),
    key: SUPABASE_ANON_KEY
  };
}

function getRedirectUrl() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.location.origin;
}

function persistSession(session: AuthSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

async function parseAuthResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Supabase auth failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function fetchAuthUser(accessToken: string): Promise<AuthUser> {
  const { url, key } = getSupabaseConfig();
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${accessToken}`
    }
  });
  const user = await parseAuthResponse<{ id: string; email?: string }>(response);

  return {
    id: user.id,
    email: user.email ?? ""
  };
}

export function isAuthConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function readStoredSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function clearStoredSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export async function sendLoginEmail(email: string) {
  const { url, key } = getSupabaseConfig();
  const response = await fetch(`${url}/auth/v1/otp`, {
    method: "POST",
    headers: {
      apikey: key,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      create_user: true,
      options: {
        email_redirect_to: getRedirectUrl()
      }
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Supabase login failed with status ${response.status}`);
  }
}

export async function readSessionFromUrl(): Promise<AuthSession | null> {
  if (typeof window === "undefined" || !window.location.hash.includes("access_token")) {
    return null;
  }

  const params = new URLSearchParams(window.location.hash.slice(1));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const expiresAt = Number(params.get("expires_at") ?? 0);
  const expiresIn = Number(params.get("expires_in") ?? 0);

  if (!accessToken || !refreshToken) {
    return null;
  }

  const session: AuthSession = {
    accessToken,
    refreshToken,
    expiresAt: expiresAt || Math.floor(Date.now() / 1000) + expiresIn,
    user: await fetchAuthUser(accessToken)
  };

  persistSession(session);
  window.history.replaceState(null, document.title, window.location.pathname);

  return session;
}

export async function refreshSessionIfNeeded(session: AuthSession | null): Promise<AuthSession | null> {
  if (!session) {
    return null;
  }

  const expiresSoon = session.expiresAt * 1000 - Date.now() < 60_000;
  if (!expiresSoon) {
    return session;
  }

  const { url, key } = getSupabaseConfig();
  const response = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: {
      apikey: key,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      refresh_token: session.refreshToken
    })
  });
  const refreshed = await parseAuthResponse<{
    access_token: string;
    refresh_token: string;
    expires_at?: number;
    expires_in?: number;
    user?: { id: string; email?: string };
  }>(response);

  const nextSession: AuthSession = {
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token,
    expiresAt: refreshed.expires_at ?? Math.floor(Date.now() / 1000) + (refreshed.expires_in ?? 3600),
    user: {
      id: refreshed.user?.id ?? session.user.id,
      email: refreshed.user?.email ?? session.user.email
    }
  };

  persistSession(nextSession);
  return nextSession;
}
