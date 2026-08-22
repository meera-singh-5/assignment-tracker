import { useAuthStore } from '../../stores/authStore';
import { useAssignmentStore } from '../../stores/assignmentStore';

export function SettingsView() {
  const { accounts, addAccount, removeAccount, toggleAccount, loading } = useAuthStore();
  const { fetchAssignments } = useAssignmentStore();

  const handleRemove = async (email: string) => {
    await removeAccount(email);
    await fetchAssignments();
  };

  const handleToggle = async (email: string, enabled: boolean) => {
    await toggleAccount(email, enabled);
    await fetchAssignments();
  };

  return (
    <div className="max-w-lg">
      <h2 className="text-lg font-semibold text-black mb-6">Settings</h2>

      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-black p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-black">Accounts</h3>
            <button
              onClick={addAccount}
              disabled={loading}
              className="px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50"
            >
              + Add account
            </button>
          </div>

          {accounts.length === 0 ? (
            <p className="text-sm text-black">No accounts connected.</p>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.email}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-white text-sm font-medium">
                      {account.email[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-black truncate">{account.display_name}</p>
                      <p className="text-xs text-black truncate">{account.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <button
                      onClick={() => handleToggle(account.email, !account.enabled)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        account.enabled ? 'bg-primary' : 'bg-gray-300'
                      }`}
                      title={account.enabled ? 'Disable account' : 'Enable account'}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          account.enabled ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => handleRemove(account.email)}
                      className="p-1 text-black hover:text-red-500 transition-colors"
                      title="Remove account"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
