import { PlatformParser } from '../parser';

export const blackboardParser: PlatformParser = {
  canParse(email) {
    return email.from.toLowerCase().includes('blackboard');
  },

  parse(email) {
    const { subject, body } = email;

    // Subject: "New Assignment: Title" or "Course Name: Assignment Title"
    const subjectMatch = subject.match(/^(.+?):\s*(?:New\s+)?(?:Assignment[:\s]+)?(.+)/i);
    const course = subjectMatch?.[1]?.trim() || '';
    const title = subjectMatch?.[2]?.trim() || subject;

    const dateMatch = body.match(/due[:\s]+(\w+\s+\d{1,2},?\s+\d{4}(?:\s+\d{1,2}:\d{2}\s*(?:AM|PM))?)/i)
      || body.match(/(\d{4}-\d{2}-\d{2})/);

    let dueDate: string | null = null;
    if (dateMatch) {
      try {
        const parsed = new Date(dateMatch[1]);
        if (!isNaN(parsed.getTime())) dueDate = parsed.toISOString();
      } catch { /* ignore */ }
    }

    const linkMatch = body.match(/https?:\/\/[^\s<>"]*blackboard[^\s<>"]*/i);

    return {
      platform: 'Blackboard',
      course,
      title,
      due_date: dueDate,
      link: linkMatch?.[0] || '',
      needs_review: !title || !dueDate,
    };
  },
};
