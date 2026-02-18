import { google } from 'googleapis';
import { getAuthenticatedClient } from './auth';
import { getEnabledAccounts, isEmailCached, cacheEmail, findDuplicate, findByEmailId, upsertAssignment } from './database';
import { parseEmail } from './parser';

// Each query is run separately against Gmail API, then results are merged
const PLATFORM_QUERIES = [
  'from:gradescope',
  'from:brightspace',
  'from:d2l',
  'from:noreply@mail.brightspace.nyu.edu',
  'from:instructure',
  'from:canvas',
  'from:blackboard',
  'from:webassign',
  'from:pearson',
  'from:mylab',
  'from:classroom.google.com',
  'subject:"due date for the assignment"',
  'subject:"upcoming due date"',
  'subject:"Due Date Reminder"',
];

interface RawEmail {
  id: string;
  from: string;
  subject: string;
  body: string;
  date: string;
  snippet: string;
}

export async function scanEmails(startDate?: string): Promise<Record<string, unknown>[]> {
  const enabledAccounts = getEnabledAccounts();
  if (enabledAccounts.length === 0) throw new Error('No enabled accounts');

  const allResults: Record<string, unknown>[] = [];

  for (const account of enabledAccounts) {
    try {
      const results = await scanEmailsForAccount(account.email, startDate);
      allResults.push(...results);
    } catch (err) {
      console.error(`Scan failed for ${account.email}:`, err);
    }
  }

  return allResults;
}

async function scanEmailsForAccount(accountEmail: string, startDate?: string): Promise<Record<string, unknown>[]> {
  const auth = getAuthenticatedClient(accountEmail);
  if (!auth) throw new Error(`Not authenticated for ${accountEmail}`);

  const gmail = google.gmail({ version: 'v1', auth });
  const dateFilter = startDate ? ` after:${startDate.replace(/-/g, '/')}` : '';

  // Run each query separately and deduplicate by message ID
  const seenIds = new Set<string>();
  const allMessages: { id: string }[] = [];

  for (const query of PLATFORM_QUERIES) {
    try {
      const fullQuery = query + dateFilter;
      const messages = await fetchMessages(gmail, fullQuery);
      for (const msg of messages) {
        if (!seenIds.has(msg.id)) {
          seenIds.add(msg.id);
          allMessages.push(msg);
        }
      }
    } catch (err) {
      console.error(`Query failed: ${query}`, err);
    }
  }

  return processMessages(gmail, allMessages, accountEmail);
}

export async function refreshEmails(): Promise<Record<string, unknown>[]> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return scanEmails(weekAgo.toISOString().split('T')[0]);
}

async function fetchMessages(
  gmail: ReturnType<typeof google.gmail>,
  query: string,
): Promise<{ id: string }[]> {
  const allMessages: { id: string }[] = [];
  let pageToken: string | undefined;

  do {
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 100,
      pageToken,
    });

    const messages = res.data.messages || [];
    allMessages.push(...messages.map(m => ({ id: m.id! })));
    pageToken = res.data.nextPageToken || undefined;
  } while (pageToken);

  return allMessages;
}

async function processMessages(
  gmail: ReturnType<typeof google.gmail>,
  messages: { id: string }[],
  accountEmail: string,
): Promise<Record<string, unknown>[]> {
  const results: Record<string, unknown>[] = [];

  for (const msg of messages) {
    // Skip already-processed emails (scoped by account)
    if (isEmailCached(msg.id, accountEmail)) continue;

    try {
      const rawEmail = await fetchEmailDetails(gmail, msg.id);
      const parsed = parseEmail(rawEmail);

      if (parsed) {
        // Check for duplicates
        const existingByEmail = findByEmailId(rawEmail.id);
        if (existingByEmail) {
          cacheEmail(msg.id, true, accountEmail);
          continue;
        }

        const existingDup = findDuplicate(parsed.course, parsed.title, parsed.due_date);
        if (existingDup) {
          cacheEmail(msg.id, true, accountEmail);
          continue;
        }

        const assignment = upsertAssignment({
          platform: parsed.platform,
          course: parsed.course,
          title: parsed.title,
          due_date: parsed.due_date,
          link: parsed.link,
          needs_review: parsed.needs_review,
          email_id: rawEmail.id,
          account_email: accountEmail,
        });
        results.push(assignment);
      }

      cacheEmail(msg.id, !!parsed, accountEmail);
    } catch (err) {
      console.error(`Error processing message ${msg.id}:`, err);
      cacheEmail(msg.id, false, accountEmail);
    }
  }

  return results;
}

async function fetchEmailDetails(
  gmail: ReturnType<typeof google.gmail>,
  messageId: string,
): Promise<RawEmail> {
  const res = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  });

  const headers = res.data.payload?.headers || [];
  const getHeader = (name: string) =>
    headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

  let body = '';
  const payload = res.data.payload;

  if (payload?.body?.data) {
    body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
  } else if (payload?.parts) {
    // Look for text/plain or text/html part
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        body = Buffer.from(part.body.data, 'base64').toString('utf-8');
        break;
      }
      if (part.mimeType === 'text/html' && part.body?.data) {
        body = Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
    }
  }

  return {
    id: messageId,
    from: getHeader('From'),
    subject: getHeader('Subject'),
    body: stripHtml(body),
    date: getHeader('Date'),
    snippet: res.data.snippet || '',
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|tr|li|h[1-6]|td|th|dt|dd)>/gi, '\n')
    .replace(/<(?:td|th)[^>]*>/gi, '    ')  // Add spacing for table cells
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

let refreshInterval: ReturnType<typeof setInterval> | null = null;

export function startAutoRefresh(intervalMinutes: number = 30): void {
  stopAutoRefresh();
  refreshInterval = setInterval(() => {
    refreshEmails().catch(err => console.error('Auto-refresh failed:', err));
  }, intervalMinutes * 60 * 1000);
}

export function stopAutoRefresh(): void {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}
