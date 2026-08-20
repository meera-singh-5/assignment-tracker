import { useAssignmentStore } from '../../stores/assignmentStore';

export function Header() {
  const { scanning, lastScan, refreshEmails } = useAssignmentStore();

  const formatLastScan = () => {
    if (!lastScan) return 'Never';
    const d = new Date(lastScan);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-end px-6 shrink-0">
      <div className="flex items-center gap-4">
        <span className="text-xs text-gray-400">
          {scanning ? 'Scanning...' : `Last scan: ${formatLastScan()}`}
        </span>
        <button
          onClick={refreshEmails}
          disabled={scanning}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50"
        >
          <svg
            className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
    </header>
  );
}
