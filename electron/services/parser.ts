import { gradescopeParser } from './parsers/gradescope';
import { brightspaceParser } from './parsers/brightspace';
import { canvasParser } from './parsers/canvas';
import { blackboardParser } from './parsers/blackboard';
import { webassignParser } from './parsers/webassign';
import { pearsonParser } from './parsers/pearson';
import { googleClassroomParser } from './parsers/google-classroom';
import { genericParser } from './parsers/generic';

interface RawEmail {
  id: string;
  from: string;
  subject: string;
  body: string;
  date: string;
  snippet: string;
}

interface ParsedAssignment {
  platform: string;
  course: string;
  title: string;
  due_date: string | null;
  link: string;
  needs_review: boolean;
}

export interface PlatformParser {
  canParse(email: RawEmail): boolean;
  parse(email: RawEmail): ParsedAssignment | null;
}

const parsers: PlatformParser[] = [
  gradescopeParser,
  brightspaceParser,
  canvasParser,
  blackboardParser,
  webassignParser,
  pearsonParser,
  googleClassroomParser,
  genericParser, // Fallback — always last
];

export function parseEmail(email: RawEmail): ParsedAssignment | null {
  for (const parser of parsers) {
    if (parser.canParse(email)) {
      const result = parser.parse(email);
      if (result) return result;
    }
  }
  return null;
}
