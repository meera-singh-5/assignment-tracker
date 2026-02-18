import { google } from 'googleapis';
import { safeStorage, shell } from 'electron';
import http from 'http';
import url from 'url';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { OAUTH_CONFIG } from '../config/oauth';
import { addAccount as dbAddAccount, removeAccount as dbRemoveAccount, setAccountEnabled, getAccounts } from './database';

const ACCOUNTS_TOKEN_FILE = 'oauth-accounts.enc';
const LEGACY_TOKEN_FILE = 'oauth-tokens.enc';

function getAccountsTokenPath(): string {
  return path.join(app.getPath('userData'), ACCOUNTS_TOKEN_FILE);
}

function getLegacyTokenPath(): string {
  return path.join(app.getPath('userData'), LEGACY_TOKEN_FILE);
}

function getOAuth2Client() {
  return new google.auth.OAuth2(
    OAUTH_CONFIG.clientId,
    OAUTH_CONFIG.clientSecret,
    OAUTH_CONFIG.redirectUri,
  );
}

// ---- Multi-account token storage ----

function loadAllTokens(): Record<string, Record<string, unknown>> {
  const tokenPath = getAccountsTokenPath();
  if (!fs.existsSync(tokenPath)) return {};

  try {
    const data = fs.readFileSync(tokenPath);
    let json: string;
    if (safeStorage.isEncryptionAvailable()) {
      json = safeStorage.decryptString(data);
    } else {
      json = data.toString('utf-8');
    }
    return JSON.parse(json);
  } catch {
    return {};
  }
}

function saveAllTokens(allTokens: Record<string, Record<string, unknown>>): void {
  const json = JSON.stringify(allTokens);
  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(json);
    fs.writeFileSync(getAccountsTokenPath(), encrypted);
  } else {
    fs.writeFileSync(getAccountsTokenPath(), json, 'utf-8');
  }
}

function saveTokensForAccount(email: string, tokens: Record<string, unknown>): void {
  const all = loadAllTokens();
  all[email] = tokens;
  saveAllTokens(all);
}

function loadTokensForAccount(email: string): Record<string, unknown> | null {
  const all = loadAllTokens();
  return all[email] || null;
}

function removeTokensForAccount(email: string): void {
  const all = loadAllTokens();
  delete all[email];
  saveAllTokens(all);
}

// ---- Legacy migration ----

function loadLegacyTokens(): Record<string, unknown> | null {
  const tokenPath = getLegacyTokenPath();
  if (!fs.existsSync(tokenPath)) return null;

  try {
    const data = fs.readFileSync(tokenPath);
    if (safeStorage.isEncryptionAvailable()) {
      const json = safeStorage.decryptString(data);
      return JSON.parse(json);
    } else {
      return JSON.parse(data.toString('utf-8'));
    }
  } catch {
    return null;
  }
}

export async function migrateFromSingleAccount(): Promise<void> {
  const legacyPath = getLegacyTokenPath();
  if (!fs.existsSync(legacyPath)) return;

  // Already migrated if new file exists with content
  const existing = loadAllTokens();
  if (Object.keys(existing).length > 0) return;

  const legacyTokens = loadLegacyTokens();
  if (!legacyTokens) return;

  try {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials(legacyTokens);

    // Refresh if expired
    if (legacyTokens.expiry_date && (legacyTokens.expiry_date as number) < Date.now()) {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
      Object.assign(legacyTokens, credentials);
    }

    const email = await getUserEmail(oauth2Client);
    if (email) {
      saveTokensForAccount(email, legacyTokens);
      dbAddAccount(email, email.split('@')[0]);

      // Backfill account_email on existing assignments and email_cache
      // (they were all from this single account)
      // This is handled via the database migration defaults — existing rows have account_email=''
      // We update them to the migrated email
      const Database = require('better-sqlite3');
      const dbPath = path.join(app.getPath('userData'), 'assignment-tracker.db');
      const db = new Database(dbPath);
      db.prepare("UPDATE assignments SET account_email = ? WHERE account_email = ''").run(email);
      db.prepare("UPDATE email_cache SET account_email = ? WHERE account_email = ''").run(email);
      db.close();
    }

    // Remove legacy file after successful migration
    fs.unlinkSync(legacyPath);
  } catch (err) {
    console.error('Failed to migrate single account:', err);
  }
}

// ---- Public API ----

export interface AccountInfo {
  email: string;
  display_name: string;
  enabled: boolean;
}

export async function login(): Promise<{ accounts: AccountInfo[] }> {
  const oauth2Client = getOAuth2Client();
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: OAUTH_CONFIG.scopes,
    prompt: 'consent select_account',
  });

  const code = await openBrowserAndWaitForCode(authUrl);
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const email = await getUserEmail(oauth2Client);
  const displayName = email.split('@')[0];

  saveTokensForAccount(email, tokens as Record<string, unknown>);
  dbAddAccount(email, displayName);

  return getAuthStatus();
}

export async function logout(email: string): Promise<void> {
  removeTokensForAccount(email);
  dbRemoveAccount(email);
}

export async function getAuthStatus(): Promise<{ accounts: AccountInfo[] }> {
  const dbAccounts = getAccounts();
  const accounts: AccountInfo[] = [];

  for (const acc of dbAccounts) {
    const tokens = loadTokensForAccount(acc.email);
    if (tokens) {
      accounts.push({
        email: acc.email,
        display_name: acc.display_name,
        enabled: acc.enabled,
      });
    } else {
      // Token missing — remove stale account record
      dbRemoveAccount(acc.email);
    }
  }

  return { accounts };
}

export function getAuthenticatedClient(email: string) {
  const tokens = loadTokensForAccount(email);
  if (!tokens) return null;

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials(tokens);

  oauth2Client.on('tokens', (newTokens) => {
    const current = loadTokensForAccount(email) || {};
    saveTokensForAccount(email, { ...current, ...newTokens });
  });

  return oauth2Client;
}

export function toggleAccount(email: string, enabled: boolean): void {
  setAccountEnabled(email, enabled);
}

async function getUserEmail(auth: ReturnType<typeof getOAuth2Client>): Promise<string> {
  const oauth2 = google.oauth2({ version: 'v2', auth });
  const { data } = await oauth2.userinfo.get();
  return data.email || '';
}

// Track active OAuth server so we can close it if a new login starts
let activeOAuthServer: http.Server | null = null;

function openBrowserAndWaitForCode(authUrl: string): Promise<string> {
  // Close any lingering server from a previous attempt
  if (activeOAuthServer) {
    activeOAuthServer.close();
    activeOAuthServer = null;
  }

  return new Promise((resolve, reject) => {
    const parsedRedirect = new URL(OAUTH_CONFIG.redirectUri);
    const port = parseInt(parsedRedirect.port, 10);

    const server = http.createServer((req, res) => {
      const parsed = url.parse(req.url || '', true);
      const code = parsed.query.code as string | undefined;
      const error = parsed.query.error as string | undefined;

      if (error) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<html><body><h1>Authentication failed</h1><p>You can close this window.</p></body></html>');
        server.close();
        activeOAuthServer = null;
        reject(new Error(`OAuth error: ${error}`));
        return;
      }

      if (code) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<html><body><h1>Authentication successful!</h1><p>You can close this window and return to Assignment Tracker.</p></body></html>');
        server.close();
        activeOAuthServer = null;
        resolve(code);
      }
    });

    activeOAuthServer = server;

    server.listen(port, '127.0.0.1', () => {
      shell.openExternal(authUrl);
    });

    server.on('error', (err) => {
      activeOAuthServer = null;
      reject(err);
    });

    // Timeout after 2 minutes
    setTimeout(() => {
      server.close();
      activeOAuthServer = null;
      reject(new Error('OAuth timeout'));
    }, 120_000);
  });
}
