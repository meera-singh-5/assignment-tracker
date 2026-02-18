import { useState, useEffect } from 'react';
import type { Assignment } from '../../types/assignment';
import { useAssignmentStore } from '../../stores/assignmentStore';

interface AssignmentCardProps {
  assignment: Assignment;
  selected?: boolean;
  onSelect?: () => void;
}

const platformColors: Record<string, string> = {
  Gradescope: 'bg-teal-100 text-teal-700',
  Brightspace: 'bg-orange-100 text-orange-700',
  Canvas: 'bg-red-100 text-red-700',
  Blackboard: 'bg-gray-800 text-white',
  WebAssign: 'bg-blue-100 text-blue-700',
  Pearson: 'bg-indigo-100 text-indigo-700',
  'Google Classroom': 'bg-green-100 text-green-700',
  Unknown: 'bg-gray-100 text-gray-600',
};

export function AssignmentCard({ assignment, selected, onSelect }: AssignmentCardProps) {
  const { updateAssignment } = useAssignmentStore();
  const [now, setNow] = useState(Date.now());

  const isCompleted = assignment.status === 'completed';
  const dueTime = assignment.due_date ? new Date(assignment.due_date).getTime() : null;
  const diff = dueTime ? dueTime - now : null;
  const isWithin24h = diff !== null && diff > 0 && diff <= 24 * 60 * 60 * 1000;
  const overdue = diff !== null && diff < 0 && !isCompleted;

  // Tick every minute for countdown (every second if under 1 hour)
  useEffect(() => {
    if (!isWithin24h && !overdue) return;
    const interval = setInterval(() => setNow(Date.now()), diff !== null && diff < 60 * 60 * 1000 ? 1000 : 60_000);
    return () => clearInterval(interval);
  }, [isWithin24h, overdue, diff]);

  const formatCountdown = () => {
    if (diff === null || diff <= 0) return null;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatDueInfo = () => {
    if (!assignment.due_date) return { date: 'No due date', time: '', label: '' };
    const d = new Date(assignment.due_date);

    if (isWithin24h) {
      return {
        date: formatCountdown() || '',
        time: '',
        label: 'remaining',
      };
    }

    const date = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    let label = '';
    if (!isCompleted && diff !== null) {
      if (diff < 0) label = 'Overdue';
      else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days >= 1 && days <= 3) label = `${days} day${days > 1 ? 's' : ''}`;
      }
    }

    return { date, time, label };
  };

  const toggleComplete = () => {
    updateAssignment(assignment.id, {
      status: isCompleted ? 'pending' : 'completed',
    });
  };

  const colorClass = platformColors[assignment.platform] || platformColors.Unknown;
  const due = formatDueInfo();

  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-lg border p-4 transition-all hover:shadow-md cursor-pointer ${
        selected ? 'ring-2 ring-primary border-primary/30' :
        isCompleted ? 'opacity-60 border-gray-200' : overdue ? 'border-red-300' : isWithin24h ? 'border-amber-300' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={e => { e.stopPropagation(); toggleComplete(); }}
          className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
            isCompleted
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-300 hover:border-primary'
          }`}
        >
          {isCompleted && (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              {assignment.course && (
                <span className="text-xs font-medium text-gray-500">{assignment.course}</span>
              )}
              <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${colorClass}`}>
                {assignment.platform}
              </span>
              {assignment.needs_review && (
                <span className="px-1.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded">
                  Review
                </span>
              )}
            </div>

            <div className="text-right shrink-0 ml-3">
              <div className={`text-xs font-medium ${
                isWithin24h ? 'text-amber-600' : overdue ? 'text-red-500' : 'text-gray-500'
              }`}>
                {due.date}
              </div>
              {due.time && (
                <div className={`text-xs ${overdue ? 'text-red-400' : 'text-gray-400'}`}>
                  {due.time}
                </div>
              )}
              {due.label && (
                <div className={`text-xs font-medium mt-0.5 ${
                  overdue ? 'text-red-500' : isWithin24h ? 'text-amber-600' : 'text-amber-500'
                }`}>
                  {due.label}
                </div>
              )}
            </div>
          </div>

          <h3 className={`font-medium text-sm ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
            {assignment.title}
          </h3>
        </div>

        {assignment.link && (
          <a
            href={assignment.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-gray-400 hover:text-primary shrink-0 mt-1"
            title="Open in browser"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}
