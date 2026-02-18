import { google } from 'googleapis';
import { getAuthenticatedClient } from './auth';
import { getEnabledAccounts, isTaskCached, cacheTask, findDuplicate, upsertAssignment } from './database';

export async function scanTasks(): Promise<Record<string, unknown>[]> {
  const enabledAccounts = getEnabledAccounts();
  if (enabledAccounts.length === 0) throw new Error('No enabled accounts');

  const allResults: Record<string, unknown>[] = [];

  for (const account of enabledAccounts) {
    try {
      const results = await scanTasksForAccount(account.email);
      allResults.push(...results);
    } catch (err) {
      console.error(`Task scan failed for ${account.email}:`, err);
    }
  }

  return allResults;
}

async function scanTasksForAccount(accountEmail: string): Promise<Record<string, unknown>[]> {
  const auth = getAuthenticatedClient(accountEmail);
  if (!auth) throw new Error(`Not authenticated for ${accountEmail}`);

  const tasksApi = google.tasks({ version: 'v1', auth });
  const results: Record<string, unknown>[] = [];

  // Fetch all task lists
  const taskListsRes = await tasksApi.tasklists.list({ maxResults: 100 });
  const taskLists = taskListsRes.data.items || [];

  for (const taskList of taskLists) {
    if (!taskList.id || !taskList.title) continue;

    try {
      // Fetch tasks from this list
      let pageToken: string | undefined;
      do {
        const tasksRes = await tasksApi.tasks.list({
          tasklist: taskList.id,
          maxResults: 100,
          showCompleted: false,
          showHidden: false,
          pageToken,
        });

        const tasks = tasksRes.data.items || [];
        for (const task of tasks) {
          if (!task.id || !task.title) continue;

          // Skip already-imported tasks
          if (isTaskCached(task.id, accountEmail)) continue;

          // Check for duplicates
          const dueDate = task.due ? task.due.split('T')[0] : null;
          const existingDup = findDuplicate(taskList.title, task.title, dueDate);
          if (existingDup) {
            cacheTask(task.id, accountEmail);
            continue;
          }

          const assignment = upsertAssignment({
            platform: 'Google Tasks',
            course: taskList.title,
            title: task.title,
            due_date: dueDate,
            status: task.status === 'completed' ? 'completed' : 'pending',
            notes: task.notes || '',
            link: task.webViewLink || '',
            email_id: task.id,
            needs_review: false,
            account_email: accountEmail,
          });
          results.push(assignment);
          cacheTask(task.id, accountEmail);
        }

        pageToken = tasksRes.data.nextPageToken || undefined;
      } while (pageToken);
    } catch (err) {
      console.error(`Failed to fetch tasks from list "${taskList.title}":`, err);
    }
  }

  return results;
}

export async function refreshTasks(): Promise<Record<string, unknown>[]> {
  return scanTasks();
}
