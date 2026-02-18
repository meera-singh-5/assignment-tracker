import { PlatformParser } from '../parser';

export const webassignParser: PlatformParser = {
  canParse(email) {
    return email.from.toLowerCase().includes('webassign')
      || email.body.toLowerCase().includes('webassign.com');
  },

  parse(email) {
    const { subject, body } = email;

    // Must mention due/reminder/assignment
    const isRelevant = /\b(due|reminder|upcoming due date)\b/i.test(subject)
      || /\b(due|reminder|upcoming due date)\b/i.test(body);
    if (!isRelevant) return null;

    // Format: "Course: MA-UY 2114...\nAssignment: Hw_5...\nDue Date: Wednesday..."
    const tabularCourse = body.match(/Course\s*:\s*(.+)/i);
    const tabularAssignment = body.match(/Assignment\s*:\s*(.+)/i);
    const tabularDueDate = body.match(/Due Date\s*:\s*(.+)/i);

    if (tabularAssignment) {
      const course = tabularCourse?.[1]?.trim() || '';
      const title = tabularAssignment[1].trim();
      let dueDate = tabularDueDate ? parseFlexibleDate(tabularDueDate[1].trim()) : null;

      // Fallback: "This is a X-hour reminder" — calculate from email send time
      if (!dueDate) {
        dueDate = dueDateFromReminder(body, email.date);
      }

      return {
        platform: 'WebAssign',
        course,
        title,
        due_date: dueDate,
        link: '',
        needs_review: !dueDate,
      };
    }

    // Fallback: subject-based parsing — strip common prefixes
    const cleanSubject = subject
      .replace(/^Due Date Reminder\s*-\s*/i, '')
      .replace(/^WebAssign[:\s]+(?:Reminder[:\s]+)?/i, '');
    const titleMatch = cleanSubject.match(/(.+?)(?:\s+is\s+|\s+due|\s*$)/i);
    const title = titleMatch?.[1]?.trim() || cleanSubject.trim();

    const courseMatch = body.match(/(?:Class|Section|Course)[:\s]+(.+)/i);
    const course = courseMatch?.[1]?.trim() || '';

    const dateMatch = body.match(/due[:\s]+(\w+\s+\d{1,2},?\s+\d{4}(?:\s+\d{1,2}:\d{2}\s*(?:AM|PM))?)/i);
    let dueDate: string | null = null;
    if (dateMatch) {
      try {
        const parsed = new Date(dateMatch[1]);
        if (!isNaN(parsed.getTime())) dueDate = parsed.toISOString();
      } catch { /* ignore */ }
    }

    return {
      platform: 'WebAssign',
      course,
      title,
      due_date: dueDate,
      link: '',
      needs_review: !title || !dueDate,
    };
  },
};

function dueDateFromReminder(body: string, emailDate: string): string | null {
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

function parseFlexibleDate(text: string): string | null {
  // Remove ordinal suffixes: "13th" -> "13"
  let cleaned = text.replace(/(\d+)(?:st|nd|rd|th)/gi, '$1');
  // Remove timezone abbreviations
  cleaned = cleaned.replace(/\s+(?:EST|EDT|CST|CDT|MST|MDT|PST|PDT|UTC|GMT)\s*$/i, '');
  // Remove day name prefix: "Wednesday, " or "Friday, "
  cleaned = cleaned.replace(/^\w+,\s*/, '');
  // Normalize "at" to space
  cleaned = cleaned.replace(/\s+at\s+/i, ' ');

  // Extract components: "February 11 11:59 pm" or "February 11, 2026 11:59 PM"
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
