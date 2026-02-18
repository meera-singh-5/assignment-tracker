import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useAssignmentStore } from '../../stores/assignmentStore';

export function LoginScreen() {
  const { addAccount, loading } = useAuthStore();
  const { updateSettings } = useSettingsStore();
  const { scanEmails } = useAssignmentStore();
  const [startDate, setStartDate] = useState(() => {
    // Default to 30 days ago
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });

  const handleLogin = async () => {
    await addAccount();
    await updateSettings({ scan_start_date: startDate });
    // Trigger initial scan after login
    scanEmails(startDate);
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-50 to-white">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Assignment Tracker</h1>
          <p className="text-gray-500">
            Connect your Gmail to automatically find and track assignments from your courses.
          </p>
        </div>

        <div className="mb-6">
          <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
            Scan emails from
          </label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <p className="text-xs text-gray-400 mt-1">
            We'll look for assignment emails starting from this date.
          </p>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              Signing in...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
              </svg>
              Sign in with Google
            </>
          )}
        </button>
      </div>
    </div>
  );
}
