import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export function Sidebar() {
  const { accounts } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const enabledAccounts = accounts.filter(a => a.enabled);

  return (
    <aside className="w-64 bg-surface flex flex-col h-full">
      <div className="h-20 px-4 flex items-center border-b border-black shrink-0" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        <h1 className="text-2xl font-normal text-black whitespace-nowrap">Assignment Tracker</h1>
      </div>

      <div className="flex-1 flex flex-col bg-surface-dark border-r border-black">
        <nav className="flex-1 p-3 space-y-1">
          <NavItem label="To-Do" path="/" active={location.pathname === '/'} onClick={() => navigate('/')} />
          <NavItem label="Calendar" path="/calendar" active={location.pathname === '/calendar'} onClick={() => navigate('/calendar')} />
          <NavItem label="Settings" path="/settings" active={location.pathname === '/settings'} onClick={() => navigate('/settings')} />
        </nav>

        <div className="p-4 border-t border-black space-y-2">
          {enabledAccounts.map((account) => (
            <div key={account.email} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                {account.email[0]?.toUpperCase() || '?'}
              </div>
              <span className="text-sm text-black truncate">{account.email}</span>
            </div>
          ))}
          {enabledAccounts.length === 0 && (
            <span className="text-sm text-black">No accounts</span>
          )}
        </div>
      </div>
    </aside>
  );
}

function NavItem({ label, active, onClick }: { label: string; path: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-primary/10 text-primary'
          : 'text-black hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );
}
