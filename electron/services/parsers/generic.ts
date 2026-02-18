import { PlatformParser } from '../parser';

export const genericParser: PlatformParser = {
  canParse() {
    // Fallback parser — always matches
    return true;
  },

  parse(email) {
    const { subject, body } = email;
    const combined = `${subject} ${body}`;

    // Skip non-assignment emails
    const ignorePatterns = /\b(has been graded|successfully submitted|you have been added|announcements?|welcome to|enrollment|roster|regrade|feedback available|discussion post|grade (?:published|released|updated))\b/i;
    if (ignorePatterns.test(combined)) return null;

    // Only parse if it looks assignment-related AND mentions a due date
    const assignmentKeywords = /\b(assignment|homework|due|deadline|quiz|exam|project|lab\s+report)\b/i;
    if (!assignmentKeywords.test(combined)) return null;
    if (!/\bdue\b/i.test(combined)) return null;

    const title = subject.trim() || 'Unknown Assignment';

    // Try to extract course from subject: "COURSE-101: ..." or "[COURSE 101] ..."
    const courseMatch = subject.match(/^\[?([A-Z]{2,6}[\s-]?\d{3,4}[A-Z]?)\]?[:\s-]+/i)
      || body.match(/(?:Course|Class|Section)[:\s]+(.+)/i);
    const course = courseMatch?.[1]?.trim() || '';

    // Extract any date
    const dueDate = extractAnyDate(combined);

    // Extract any URL
    const linkMatch = body.match(/https?:\/\/[^\s<>"]+/i);

    return {
      platform: 'Unknown',
      course,
      title,
      due_date: dueDate,
      link: linkMatch?.[0] || '',
      needs_review: true, // Always flag generic parses for review
    };
  },
};

function extractAnyDate(text: string): string | null {
  // "due January 15, 2026" or "due Jan 15, 2026 at 11:59 PM"
  const dueExplicit = text.match(/due[:\s]+(\w+\s+\d{1,2},?\s+\d{4}(?:\s+(?:at\s+)?\d{1,2}:\d{2}\s*(?:AM|PM))?)/i);
  if (dueExplicit) {
    const d = tryParse(dueExplicit[1]);
    if (d) return d;
  }

  // ISO: 2026-01-15
  const iso = text.match(/(\d{4}-\d{2}-\d{2})/);
  if (iso) {
    const d = tryParse(iso[1]);
    if (d) return d;
  }

  // MM/DD/YYYY
  const mdy = text.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
  if (mdy) {
    const d = tryParse(mdy[1]);
    if (d) return d;
  }

  // "Month Day, Year"
  const monthDay = text.match(/(\w+\s+\d{1,2},?\s+\d{4})/);
  if (monthDay) {
    const d = tryParse(monthDay[1]);
    if (d) return d;
  }

  return null;
}

function tryParse(s: string): string | null {
  try {
    const d = new Date(s.replace(' at ', ' '));
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
}
