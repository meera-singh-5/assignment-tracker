import { load } from 'cheerio';
import { GRADESCOPE_BASE_URL, GradescopeSession } from './client';

async function getAuthToken(session: GradescopeSession): Promise<string> {
  const resp = await session.fetch(GRADESCOPE_BASE_URL);
  const html = await resp.text();
  const $ = load(html);
  const token = $('form[action="/login"] input[name="authenticity_token"]').attr('value');
  if (!token) {
    throw new Error('Could not find login authenticity token');
  }
  return token;
}

export async function login(session: GradescopeSession, email: string, password: string): Promise<void> {
  const authToken = await getAuthToken(session);

  const loginUrl = `${GRADESCOPE_BASE_URL}/login`;
  const params = new URLSearchParams({
    utf8: '✓',
    'session[email]': email,
    'session[password]': password,
    'session[remember_me]': '0',
    commit: 'Log In',
    'session[remember_me_sso]': '0',
    authenticity_token: authToken,
  });
  const requestUrl = `${loginUrl}?${params.toString()}`;

  const resp = await session.fetch(requestUrl, { method: 'POST' });

  // A successful login redirects away from /login; a failed one re-renders
  // /login in place, so the final URL is still the request URL itself.
  if (resp.url === requestUrl) {
    throw new Error('Invalid credentials.');
  }

  const html = await resp.text();
  const $ = load(html);
  session.csrfToken = $('meta[name="csrf-token"]').attr('content') ?? null;
}

export async function logout(session: GradescopeSession): Promise<void> {
  try {
    await session.fetch(`${GRADESCOPE_BASE_URL}/logout`);
  } catch {
    // best-effort, matches gradescopeapi swallowing logout errors
  }
}
