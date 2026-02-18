import { PlatformParser } from '../parser';

const IGNORE_PATTERNS = [
  /you have been added/i,
  /has been graded/i,
  /successfully submitted/i,
  /regrade request/i,
  /grade (?:published|released|updated)/i,
  /welcome to/i,
  /account (?:created|activated)/i,
  /roster|enrollment/i,
];

export const gradescopeParser: PlatformParser = {
  canParse(email) {
    return email.from.toLowerCase().includes('gradescope');
  },

  parse(email) {
    const { subject, body } = email;

    for (const pattern of IGNORE_PATTERNS) {
      if (pattern.test(subject) || pattern.test(body)) return null;
    }

    // Must mention due/reminder/assignment
    const isRelevant = /\b(due|reminder|upcoming due date)\b/i.test(subject)
      || /\b(due|reminder|upcoming due date)\b/i.test(body);
    if (!isRelevant) return null;

    // Format: "Course: MA-UY 2114..." or "Course    MA-UY 2114..."
    const tabularCourse = body.match(/Course\s*:\s*(.+)/i);
    const tabularAssignment = body.match(/Assignment\s*:\s*(.+)/i);
    const tabularDueDate = body.match(/Due Date\s*:\s*(.+)/i);

    if (tabularAssignment) {
      const course = tabularCourse?.[1]?.trim() || '';
      const title = tabularAssignment[1].trim();
      let dueDate = tabularDueDate ? parseFlexibleDate(tabularDueDate[1].trim()) : null;

      // Fallback: "This is a X-hour reminder" — calculate due from email send time
      if (!dueDate) {
        dueDate = dueDateFromReminder(body, email.date);
      }

      return {
        platform: 'Gradescope',
        course,
        title,
        due_date: dueDate,
        link: extractLink(body, 'gradescope'),
        needs_review: !dueDate,
      };
    }

    // Subject format: "Reminder: Assignment Name is due..."
    const titleMatch = subject.match(/^(?:Reminder:\s*)?(.+?)\s+(?:is\s+)?due/i)
      || body.match(/assignment\s+"([^"]+)"/i);
    const title = titleMatch?.[1]?.trim();
    if (!title) return null;

    const courseMatch = body.match(/(?:in|for)\s+course\s+"?([^"\n]+)"?/i)
      || body.match(/Course:\s*(.+)/i);
    const course = courseMatch?.[1]?.trim() || '';

    const dueDate = parseDateFromText(body) || parseDateFromText(subject);

    return {
      platform: 'Gradescope',
      course,
      title,
      due_date: dueDate,
      link: extractLink(body, 'gradescope'),
      needs_review: !dueDate,
    };
  },
};

function extractLink(text: string, domain: string): string {
  const match = text.match(new RegExp(`https?://[^\\s<>"]*${domain}[^\\s<>"]*`, 'i'));
  return match?.[0] || '';
}

function parseFlexibleDate(text: string): string | null {
  let cleaned = text.replace(/(\d+)(?:st|nd|rd|th)/gi, '$1');
  cleaned = cleaned.replace(/\s+(?:EST|EDT|CST|CDT|MST|MDT|PST|PDT|UTC|GMT)\s*$/i, '');
  cleaned = cleaned.replace(/^\w+,\s*/, '');
  cleaned = cleaned.replace(/\s+at\s+/i, ' ');

  const match = cleaned.match(/(\w+)\s+(\d{1,2}),?\s*(\d{4})?\s*(\d{1,2}:\d{2}\s*(?:am|pm))?/i);
  if (!match) return null;

  const month = match[1];
  const day = match[2];
  const year = match[3] || String(new Date().getFullYear());
  const time = match[4] || '11:59 PM';

  const dateStr = `${month} ${day}, ${year} ${time.toUpperCase()}`;
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch { /* ignore */ }
  return null;
}

function dueDateFromReminder(body: string, emailDate: string): string | null {
  // "This is a 6-hour reminder" — due date = email sent time + N hours
  const match = body.match(/(\d+)-?hour reminder/i);
  if (match && emailDate) {
    try {
      const hours = parseInt(match[1], 10);
      const sent = new Date(emailDate);
      if (!isNaN(sent.getTime())) {
        sent.setHours(sent.getHours() + hours);
        return sent.toISOString();
      }
    } catch { /* ignore */ }
  }
  return null;
}

function parseDateFromText(text: string): string | null {
  const dateMatch = text.match(
    /(\w+\s+\d{1,2},?\s+\d{4}(?:\s+(?:at\s+)?\d{1,2}:\d{2}\s*(?:AM|PM))?)/i
  );
  if (dateMatch) {
    try {
      const parsed = new Date(dateMatch[1].replace(' at ', ' '));
      if (!isNaN(parsed.getTime())) return parsed.toISOString();
    } catch { /* ignore */ }
  }

  const isoMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return new Date(isoMatch[1]).toISOString();

  return null;
}
