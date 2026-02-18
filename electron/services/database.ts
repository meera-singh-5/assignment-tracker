import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import crypto from 'crypto';

let db: Database.Database;

export function initDatabase(): void {
  const dbPath = path.join(app.getPath('userData'), 'assignment-tracker.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS assignments (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL DEFAULT '',
      course TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL,
      due_date TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      course_color TEXT NOT NULL DEFAULT '#4F46E5',
      priority_icon TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      subtasks TEXT NOT NULL DEFAULT '[]',
      link TEXT NOT NULL DEFAULT '',
      reminder_dot INTEGER NOT NULL DEFAULT 0,
      email_id TEXT NOT NULL DEFAULT '',
      manually_created INTEGER NOT NULL DEFAULT 0,
      needs_review INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL DEFAULT '',
      color TEXT NOT NULL DEFAULT '#4F46E5',
      icon TEXT NOT NULL DEFAULT '',
      platform TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS email_cache (
      id TEXT PRIMARY KEY,
      gmail_message_id TEXT UNIQUE NOT NULL,
      parsed INTEGER NOT NULL DEFAULT 0,
      parsed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS accounts (
      email TEXT PRIMARY KEY,
      display_name TEXT NOT NULL DEFAULT '',
      enabled INTEGER NOT NULL DEFAULT 1,
      added_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS task_cache (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      account_email TEXT NOT NULL,
      imported_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(task_id, account_email)
    );
  `);

  // Migration: add account_email to assignments if missing
  const assignmentCols = db.prepare("PRAGMA table_info(assignments)").all() as { name: string }[];
  if (!assignmentCols.some(c => c.name === 'account_email')) {
    db.exec("ALTER TABLE assignments ADD COLUMN account_email TEXT NOT NULL DEFAULT ''");
  }

  // Migration: add account_email to email_cache if missing
  const cacheCols = db.prepare("PRAGMA table_info(email_cache)").all() as { name: string }[];
  if (!cacheCols.some(c => c.name === 'account_email')) {
    db.exec("ALTER TABLE email_cache ADD COLUMN account_email TEXT NOT NULL DEFAULT ''");
  }
}

function generateId(): string {
  return crypto.randomUUID();
}

// Accounts
export function getAccounts(): { email: string; display_name: string; enabled: boolean; added_at: string }[] {
  const rows = db.prepare('SELECT * FROM accounts ORDER BY added_at ASC').all() as Record<string, unknown>[];
  return rows.map(row => ({
    email: row.email as string,
    display_name: row.display_name as string,
    enabled: Boolean(row.enabled),
    added_at: row.added_at as string,
  }));
}

export function getEnabledAccounts(): { email: string; display_name: string; enabled: boolean; added_at: string }[] {
  const rows = db.prepare('SELECT * FROM accounts WHERE enabled = 1 ORDER BY added_at ASC').all() as Record<string, unknown>[];
  return rows.map(row => ({
    email: row.email as string,
    display_name: row.display_name as string,
    enabled: Boolean(row.enabled),
    added_at: row.added_at as string,
  }));
}

export function addAccount(email: string, displayName: string): void {
  db.prepare(
    'INSERT OR REPLACE INTO accounts (email, display_name, enabled, added_at) VALUES (?, ?, 1, datetime(\'now\'))'
  ).run(email, displayName);
}

export function removeAccount(email: string): void {
  db.prepare('DELETE FROM accounts WHERE email = ?').run(email);
  db.prepare('DELETE FROM assignments WHERE account_email = ?').run(email);
  db.prepare('DELETE FROM email_cache WHERE account_email = ?').run(email);
}

export function setAccountEnabled(email: string, enabled: boolean): void {
  db.prepare('UPDATE accounts SET enabled = ? WHERE email = ?').run(enabled ? 1 : 0, email);
}

// Assignments
export function getAssignments(): Record<string, unknown>[] {
  // Only return assignments from enabled accounts, plus manually created ones
  const rows = db.prepare(`
    SELECT a.* FROM assignments a
    LEFT JOIN accounts acc ON a.account_email = acc.email
    WHERE a.manually_created = 1 OR acc.enabled = 1 OR a.account_email = ''
    ORDER BY a.due_date ASC, a.created_at DESC
  `).all() as Record<string, unknown>[];
  return rows.map(row => ({
    ...row,
    subtasks: JSON.parse(row.subtasks as string),
    reminder_dot: Boolean(row.reminder_dot),
    manually_created: Boolean(row.manually_created),
    needs_review: Boolean(row.needs_review),
  }));
}

export function upsertAssignment(data: Record<string, unknown>): Record<string, unknown> {
  const id = (data.id as string) || generateId();
  const now = new Date().toISOString();

  const existing = db.prepare('SELECT id FROM assignments WHERE id = ?').get(id);

  if (existing) {
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const [key, value] of Object.entries(data)) {
      if (key === 'id' || key === 'created_at') continue;
      fields.push(`${key} = ?`);
      values.push(key === 'subtasks' ? JSON.stringify(value) : value);
    }
    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);
    db.prepare(`UPDATE assignments SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  } else {
    db.prepare(`
      INSERT INTO assignments (id, platform, course, title, due_date, status, course_color, priority_icon, notes, subtasks, link, reminder_dot, email_id, manually_created, needs_review, account_email, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.platform || '',
      data.course || '',
      data.title || 'Untitled',
      data.due_date || null,
      data.status || 'pending',
      data.course_color || '#4F46E5',
      data.priority_icon || '',
      data.notes || '',
      JSON.stringify(data.subtasks || []),
      data.link || '',
      data.reminder_dot ? 1 : 0,
      data.email_id || '',
      data.manually_created ? 1 : 0,
      data.needs_review ? 1 : 0,
      data.account_email || '',
      now,
      now,
    );
  }

  return db.prepare('SELECT * FROM assignments WHERE id = ?').get(id) as Record<string, unknown>;
}

export function updateAssignment(id: string, updates: Record<string, unknown>): Record<string, unknown> {
  return upsertAssignment({ ...updates, id });
}

// Duplicate detection
export function findDuplicate(course: string, title: string, dueDate: string | null): Record<string, unknown> | undefined {
  return db.prepare(
    'SELECT * FROM assignments WHERE course = ? AND title = ? AND due_date IS ?'
  ).get(course, title, dueDate) as Record<string, unknown> | undefined;
}

export function findByEmailId(emailId: string): Record<string, unknown> | undefined {
  return db.prepare('SELECT * FROM assignments WHERE email_id = ?').get(emailId) as Record<string, unknown> | undefined;
}

// Email cache — scoped by account
export function isEmailCached(gmailMessageId: string, accountEmail: string): boolean {
  const row = db.prepare(
    'SELECT id FROM email_cache WHERE gmail_message_id = ? AND account_email = ?'
  ).get(gmailMessageId, accountEmail);
  return !!row;
}

export function cacheEmail(gmailMessageId: string, parsed: boolean, accountEmail: string): void {
  db.prepare(`
    INSERT OR REPLACE INTO email_cache (id, gmail_message_id, parsed, parsed_at, account_email)
    VALUES (?, ?, ?, ?, ?)
  `).run(generateId(), gmailMessageId, parsed ? 1 : 0, parsed ? new Date().toISOString() : null, accountEmail);
}

// Task cache — scoped by account
export function isTaskCached(taskId: string, accountEmail: string): boolean {
  const row = db.prepare(
    'SELECT id FROM task_cache WHERE task_id = ? AND account_email = ?'
  ).get(taskId, accountEmail);
  return !!row;
}

export function cacheTask(taskId: string, accountEmail: string): void {
  db.prepare(`
    INSERT OR IGNORE INTO task_cache (id, task_id, account_email, imported_at)
    VALUES (?, ?, ?, ?)
  `).run(generateId(), taskId, accountEmail, new Date().toISOString());
}

// Settings
export function getSetting(key: string): string | undefined {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value;
}

export function setSetting(key: string, value: string): void {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}

export function getAllSettings(): Record<string, string> {
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}
