import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  auth: {
    login: () => ipcRenderer.invoke('auth:login'),
    logout: (email: string) => ipcRenderer.invoke('auth:logout', email),
    getStatus: () => ipcRenderer.invoke('auth:getStatus'),
    toggleAccount: (email: string, enabled: boolean) =>
      ipcRenderer.invoke('auth:toggleAccount', email, enabled),
    cancelLogin: () => ipcRenderer.invoke('auth:cancelLogin'),
  },
  gmail: {
    scan: (startDate?: string) => ipcRenderer.invoke('gmail:scan', startDate),
    refresh: () => ipcRenderer.invoke('gmail:refresh'),
  },
  tasks: {
    scan: () => ipcRenderer.invoke('tasks:scan'),
    refresh: () => ipcRenderer.invoke('tasks:refresh'),
  },
  gradescope: {
    login: (email: string, password: string) =>
      ipcRenderer.invoke('gradescope:login', email, password),
    logout: () => ipcRenderer.invoke('gradescope:logout'),
  },
  db: {
    getAssignments: () => ipcRenderer.invoke('db:getAssignments'),
    upsertAssignment: (assignment: Record<string, unknown>) =>
      ipcRenderer.invoke('db:upsertAssignment', assignment),
    updateAssignment: (id: string, updates: Record<string, unknown>) =>
      ipcRenderer.invoke('db:updateAssignment', id, updates),
    deleteAssignment: (id: string) =>
      ipcRenderer.invoke('db:deleteAssignment', id),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (settings: Record<string, unknown>) =>
      ipcRenderer.invoke('settings:set', settings),
  },
});
