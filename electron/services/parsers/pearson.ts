import { PlatformParser } from '../parser';

export const pearsonParser: PlatformParser = {
  canParse(email) {
    return email.from.toLowerCase().includes('pearson')
      || email.from.toLowerCase().includes('mylab')
      || email.from.toLowerCase().includes('mastering');
  },

  parse(email) {
    const { subject, body } = email;

    // Subject: "Pearson: Assignment Name due..." or "MyLab: ..."
    const titleMatch = subject.match(/(?:Pearson|MyLab|Mastering)[:\s]+(.+?)(?:\s+due|\s+is\s+due|\s*$)/i);
    const title = titleMatch?.[1]?.trim() || subject.replace(/^(?:Pearson|MyLab|Mastering)[:\s]+/i, '').trim();

    const courseMatch = body.match(/(?:Course|Class)[:\s]+(.+)/i);
    const course = courseMatch?.[1]?.trim() || '';

    const dateMatch = body.match(/due[:\s]+(\w+\s+\d{1,2},?\s+\d{4}(?:\s+\d{1,2}:\d{2}\s*(?:AM|PM))?)/i)
      || body.match(/(\d{4}-\d{2}-\d{2})/);

    let dueDate: string | null = null;
    if (dateMatch) {
      try {
        const parsed = new Date(dateMatch[1]);
        if (!isNaN(parsed.getTime())) dueDate = parsed.toISOString();
      } catch { /* ignore */ }
    }

    const linkMatch = body.match(/https?:\/\/[^\s<>"]*(?:pearson|mylab|mastering)[^\s<>"]*/i);

    return {
      platform: 'Pearson',
      course,
      title,
      due_date: dueDate,
      link: linkMatch?.[0] || '',
      needs_review: !title || !dueDate,
    };
  },
};
