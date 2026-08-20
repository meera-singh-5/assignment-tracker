export interface Assignment {
  id: string;
  platform: string;
  course: string;
  title: string;
  due_date: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  course_color: string;
  priority_icon: string;
  notes: string;
  subtasks: Subtask[];
  link: string;
  reminder_dot: boolean;
  email_id: string;
  manually_created: boolean;
  needs_review: boolean;
  account_email: string;
  created_at: string;
  updated_at: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  color: string;
  icon: string;
  platform: string;
}

export interface ParsedEmail {
  gmail_message_id: string;
  from: string;
  subject: string;
  body: string;
  date: string;
  snippet: string;
}

export interface ParsedAssignment {
  platform: string;
  course: string;
  title: string;
  due_date: string | null;
  link: string;
  needs_review: boolean;
}

export interface AccountInfo {
  email: string;
  display_name: string;
  enabled: boolean;
}

export interface AuthStatus {
  accounts: AccountInfo[];
}

export interface UserSettings {
  scan_start_date: string;
  scan_frequency_minutes: number;
  theme: 'light' | 'dark';
  last_scan_at: string | null;
}

export interface IpcApi {
  auth: {
    login: () => Promise<AuthStatus>;
    logout: (email: string) => Promise<void>;
    getStatus: () => Promise<AuthStatus>;
    toggleAccount: (email: string, enabled: boolean) => Promise<void>;
  };
  gmail: {
    scan: (startDate?: string) => Promise<Assignment[]>;
    refresh: () => Promise<Assignment[]>;
  };
  tasks: {
    scan: () => Promise<Assignment[]>;
    refresh: () => Promise<Assignment[]>;
  };
  db: {
    getAssignments: () => Promise<Assignment[]>;
    upsertAssignment: (assignment: Partial<Assignment>) => Promise<Assignment>;
    updateAssignment: (id: string, updates: Partial<Assignment>) => Promise<Assignment>;
    deleteAssignment: (id: string) => Promise<void>;
  };
  settings: {
    get: () => Promise<Record<string, string>>;
    set: (settings: Record<string, string>) => Promise<void>;
  };
}

declare global {
  interface Window {
    api: IpcApi;
  }
}
