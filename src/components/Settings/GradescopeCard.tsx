import { useState } from 'react';
import { useGradescopeStore } from '../../stores/gradescopeStore';
import { SignOutConfirm } from './SignOutConfirm';

export function GradescopeCard() {
  const { email: loggedInEmail, loggedIn, loading, error, login, logout } = useGradescopeStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);

  if (loggedIn) {
    return (
      <div className="bg-white rounded-lg border border-black p-4">
        <h3 className="text-sm font-medium text-black mb-4">Gradescope</h3>

        <div className="py-2 px-3 rounded-lg bg-gray-50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-white text-sm font-medium">
              {loggedInEmail?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-black truncate">{loggedInEmail}</p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-black">
            {confirmingSignOut ? (
              <SignOutConfirm
                onConfirm={() => { logout(); setConfirmingSignOut(false); }}
                onCancel={() => setConfirmingSignOut(false)}
              />
            ) : (
              <div className="flex justify-end">
                <button
                  onClick={() => setConfirmingSignOut(true)}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-black p-4">
      <h3 className="text-sm font-medium text-black mb-4">Gradescope</h3>

      <div className="space-y-2">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full text-sm text-black border border-black rounded-md px-3 py-2 focus:outline-none focus:border-primary"
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full text-sm text-black border border-black rounded-md px-3 py-2 focus:outline-none focus:border-primary"
        />
        <button
          onClick={() => login(email, password)}
          disabled={loading || !email || !password}
          className="w-full px-3 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
