import { PlatformParser } from '../parser';

const IGNORE_PATTERNS = [
  /has been graded/i,
  /grade (?:published|released|updated)/i,
  /successfully submitted/i,
  /\bannouncement\b/i,
  /discussion (?:post|reply|topic)/i,
  /enrollment/i,
  /welcome to/i,
  /course invitation/i,
];

export const canvasParser: PlatformParser = {
  canParse(email) {
    return email.from.toLowerCase().includes('instructure')
      || email.from.toLowerCase().includes('canvas');
  },

  parse(email) {
    const { subject, body } = email;

    for (const pattern of IGNORE_PATTERNS) {
      if (pattern.test(subject) || pattern.test(body)) return null;
    }

    const isDueEmail = /\bdue\b/i.test(subject) || /\bdue\b/i.test(body);
    const isAssignmentEmail = /\b(assignment|quiz|exam|homework)\b/i.test(subject);
    if (!isDueEmail && !isAssignmentEmail) return null;

    // Subject: "Course Name - Assignment Created/Due: Title"
    const subjectMatch = subject.match(/^(.+?)\s*-\s*(?:Assignment\s+)?(?:Created|Due|Updated)[:\s]+(.+)/i);
    const course = subjectMatch?.[1]?.trim() || '';
    const title = subjectMatch?.[2]?.trim() || subject;

    // Due date: "Due: Jan 15 at 11:59pm" or "due Jan 15, 2026"
    const dateMatch = body.match(/due[:\s]+(\w+\s+\d{1,2}(?:,?\s+\d{4})?(?:\s+at\s+\d{1,2}:\d{2}\s*(?:am|pm))?)/i)
      || body.match(/(\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2})?)/);

    let dueDate: string | null = null;
    if (dateMatch) {
      try {
        let dateStr = dateMatch[1];
        // Add current year if not present
        if (!/\d{4}/.test(dateStr)) {
          dateStr += `, ${new Date().getFullYear()}`;
        }
        const parsed = new Date(dateStr.replace(' at ', ' '));
        if (!isNaN(parsed.getTime())) dueDate = parsed.toISOString();
      } catch { /* ignore */ }
    }

    const linkMatch = body.match(/https?:\/\/[^\s<>"]*(?:instructure|canvas)[^\s<>"]*/i);

    return {
      platform: 'Canvas',
      course,
      title,
      due_date: dueDate,
      link: linkMatch?.[0] || '',
      needs_review: !title || !dueDate,
    };
  },
};
