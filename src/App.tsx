import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useAssignmentStore } from './stores/assignmentStore';
import { LoginScreen } from './components/Auth/LoginScreen';
import { AuthErrorScreen } from './components/Auth/AuthErrorScreen';
import { SigningInScreen } from './components/Auth/SigningInScreen';
import { AppLayout } from './components/Layout/AppLayout';
import { TodoListView } from './components/TodoList/TodoListView';
import { CalendarView } from './components/Calendar/CalendarView';
import { SettingsView } from './components/Settings/SettingsView';

export default function App() {
  const { accounts, loading, signingIn, error, checkStatus, clearError, cancelSignIn } = useAuthStore();
  const { fetchAssignments, scanEmails, scanTasks } = useAssignmentStore();

  const authenticated = accounts.length > 0;

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Auto-scan on startup when already authenticated
  useEffect(() => {
    if (authenticated && !loading) {
      fetchAssignments();
      // Use a broad scan on startup (last 60 days)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 60);
      scanEmails(startDate.toISOString().split('T')[0]);
      scanTasks();
    }
  }, [authenticated, loading, fetchAssignments, scanEmails, scanTasks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (signingIn) {
    return <SigningInScreen onCancel={cancelSignIn} />;
  }

  if (error) {
    return <AuthErrorScreen message={error} canGoBack={authenticated} onDismiss={clearError} />;
  }

  if (!authenticated) {
    return <LoginScreen />;
  }

  return (
    <HashRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<TodoListView />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/settings" element={<SettingsView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </HashRouter>
  );
}
