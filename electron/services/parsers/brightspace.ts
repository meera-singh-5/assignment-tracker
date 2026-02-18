import { PlatformParser } from '../parser';

const IGNORE_PATTERNS = [
  /announcements?:/i,
  /grade (?:published|released|updated)/i,
  /has been (?:graded|updated)/i,
  /updated grade/i,
  /course offering/i,
  /welcome to/i,
  /news item/i,
  /discussion (?:post|reply|topic)/i,
  /feedback/i,
  /submission receipt/i,
];

export const brightspaceParser: PlatformParser = {
  canParse(email) {
    return email.from.toLowerCase().includes('brightspace')
      || email.from.toLowerCase().includes('d2l')
      || /- Assignments?:/i.test(email.subject);
  },

  parse(email) {
    const { subject, body } = email;

    for (const pattern of IGNORE_PATTERNS) {
      if (pattern.test(subject)) return null;
    }

    // Must be about assignments/due dates
    const isRelevant = /\b(due|assignment|quiz|exam|homework|dropbox)\b/i.test(subject)
      || /\b(due date|assignment)\b/i.test(body);
    if (!isRelevant) return null;

    // Extract quoted assignment title: assignment "Hwk #2 pn Junctions and Diodes"
    const quotedTitle = body.match(/assignment\s+"([^"]+)"/i)
      || subject.match(/assignment\s+"([^"]+)"/i);

    // Course from subject: "ECE3114 Lecture A - Assignments: ..."
    // or "Science of Language - Assignments: ..."
    const courseMatch = subject.match(/^(.+?)\s*-\s*Assignments?:/i)
      || subject.match(/^\[([^\]]+)\]/i);
    const course = courseMatch?.[1]?.trim() || '';

    let title: string;
    if (quotedTitle) {
      title = quotedTitle[1].trim();
    } else {
      // Fallback: try to get title from subject after course prefix
      const titleFromSubject = subject.match(/-\s*Assignments?:\s*(.+)/i)
        || subject.match(/^\[?[^\]]*\]?\s*(.+?)(?:\s+due|\s*$)/i);
      title = titleFromSubject?.[1]?.trim() || subject;
    }

    // Date: "It is due Wednesday, February 4, 2026 11:59 PM EST"
    // or "due Wednesday, February 4, 2026 11:59 PM EST"
    const dateMatch = body.match(/(?:It is )?due\s+\w+,\s+(\w+\s+\d{1,2},?\s+\d{4}\s+\d{1,2}:\d{2}\s*(?:AM|PM))/i)
      || body.match(/due(?:\s+date)?[:\s]+(\w+\s+\d{1,2},?\s+\d{4}(?:\s+\d{1,2}:\d{2}\s*(?:AM|PM))?)/i)
      || body.match(/(\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2})?)/);

    let dueDate: string | null = null;
    if (dateMatch) {
      try {
        const parsed = new Date(dateMatch[1]);
        if (!isNaN(parsed.getTime())) dueDate = parsed.toISOString();
      } catch { /* ignore */ }
    }

    const linkMatch = body.match(/https?:\/\/[^\s<>"]*(?:brightspace|d2l)[^\s<>"]*/i);

    return {
      platform: 'Brightspace',
      course,
      title,
      due_date: dueDate,
      link: linkMatch?.[0] || '',
      needs_review: !dueDate,
    };
  },
};
