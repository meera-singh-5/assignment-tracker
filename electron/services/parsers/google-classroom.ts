import { PlatformParser } from '../parser';

export const googleClassroomParser: PlatformParser = {
  canParse(email) {
    const from = email.from.toLowerCase();
    return (from.includes('classroom.google.com') || from.includes('no-reply@google.com'))
      && (email.subject.toLowerCase().includes('class') || email.body.toLowerCase().includes('classroom'));
  },

  parse(email) {
    const { subject, body } = email;

    // Subject: "New assignment: Title" or "Due soon: Title - Course"
    const subjectMatch = subject.match(/(?:New\s+assignment|Due\s+(?:soon|today|tomorrow))[:\s]+(.+?)(?:\s*-\s*(.+))?$/i);
    const title = subjectMatch?.[1]?.trim() || subject;
    const course = subjectMatch?.[2]?.trim() || '';

    // Body course: "Posted in: Course Name" or "Class: Course Name"
    const courseFromBody = body.match(/(?:Posted in|Class)[:\s]+(.+)/i);
    const finalCourse = course || courseFromBody?.[1]?.trim() || '';

    const dateMatch = body.match(/due[:\s]+(\w+\s+\d{1,2},?\s+\d{4}(?:\s+\d{1,2}:\d{2}\s*(?:AM|PM))?)/i)
      || body.match(/(\d{4}-\d{2}-\d{2})/);

    let dueDate: string | null = null;
    if (dateMatch) {
      try {
        const parsed = new Date(dateMatch[1]);
        if (!isNaN(parsed.getTime())) dueDate = parsed.toISOString();
      } catch { /* ignore */ }
    }

    const linkMatch = body.match(/https?:\/\/classroom\.google\.com\/[^\s<>"]+/i);

    return {
      platform: 'Google Classroom',
      course: finalCourse,
      title,
      due_date: dueDate,
      link: linkMatch?.[0] || '',
      needs_review: !title || !dueDate,
    };
  },
};
