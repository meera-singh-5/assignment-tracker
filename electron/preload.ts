import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  auth: {
    login: () => ipcRenderer.invoke('auth:login'),
    logout: (email: string) => ipcRenderer.invoke('auth:logout', email),
    getStatus: () => ipcRenderer.invoke('auth:getStatus'),
    toggleAccount: (email: string, enabled: boolean) =>
      ipcRenderer.invoke('auth:toggleAccount', email, enabled),
  },
  gmail: {
    scan: (startDate?: string) => ipcRenderer.invoke('gmail:scan', startDate),
    refresh: () => ipcRenderer.invoke('gmail:refresh'),
  },
  tasks: {
    scan: () => ipcRenderer.invoke('tasks:scan'),
    refresh: () => ipcRenderer.invoke('tasks:refresh'),
  },
  db: {
    getAssignments: () => ipcRenderer.invoke('db:getAssignments'),
    upsertAssignment: (assignment: Record<string, unknown>) =>
      ipcRenderer.invoke('db:upsertAssignment', assignment),
    updateAssignment: (id: string, updates: Record<string, unknown>) =>
      ipcRenderer.invoke('db:updateAssignment', id, updates),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (settings: Record<string, unknown>) =>
      ipcRenderer.invoke('settings:set', settings),
  },
});
