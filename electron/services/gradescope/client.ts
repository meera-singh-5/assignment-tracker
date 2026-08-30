import { CookieJar } from 'tough-cookie';
import makeFetchCookie from 'fetch-cookie';

export const GRADESCOPE_BASE_URL = 'https://www.gradescope.com';

export function createSession() {
  const jar = new CookieJar();
  return {
    fetch: makeFetchCookie(fetch, jar),
    jar,
    csrfToken: null as string | null,
  };
}

// Inferred from createSession's own return, so `fetch` resolves to the
// concrete FetchCookieImpl<..., Response> instantiation (bound to the real
// global fetch) rather than the library's generic/unbound signature.
export type GradescopeSession = ReturnType<typeof createSession>;

// Mirrors gradescopeapi's check_page_auth: GET the endpoint and translate
// Gradescope's auth-failure responses into thrown errors.
export async function checkPageAuth(session: GradescopeSession, endpoint: string): Promise<Response> {
  const resp = await session.fetch(endpoint);

  if (resp.status === 401) {
    const body = await resp.json().catch(() => ({}));
    const errorMsg = Object.values(body as Record<string, unknown>)[0];
    throw new Error(typeof errorMsg === 'string' ? errorMsg : 'Not authorized');
  }
  if (resp.status === 404) {
    throw new Error('Page not found');
  }
  if (resp.status === 200) {
    return resp;
  }
  throw new Error(`Unexpected status ${resp.status}`);
}
