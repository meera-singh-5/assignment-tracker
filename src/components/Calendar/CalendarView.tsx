import { useState, useMemo } from 'react';
import { useAssignmentStore } from '../../stores/assignmentStore';
import type { Assignment } from '../../types/assignment';

const platformColors: Record<string, string> = {
  Gradescope: 'bg-teal-500',
  Brightspace: 'bg-orange-500',
  Canvas: 'bg-red-500',
  Blackboard: 'bg-gray-700',
  WebAssign: 'bg-blue-500',
  Pearson: 'bg-indigo-500',
  'Google Classroom': 'bg-green-500',
  Unknown: 'bg-gray-400',
};

const platformTextColors: Record<string, string> = {
  Gradescope: 'text-teal-700',
  Brightspace: 'text-orange-700',
  Canvas: 'text-red-700',
  Blackboard: 'text-gray-800',
  WebAssign: 'text-blue-700',
  Pearson: 'text-indigo-700',
  'Google Classroom': 'text-green-700',
  Unknown: 'text-gray-600',
};

const platformBgColors: Record<string, string> = {
  Gradescope: 'bg-teal-50',
  Brightspace: 'bg-orange-50',
  Canvas: 'bg-red-50',
  Blackboard: 'bg-gray-100',
  WebAssign: 'bg-blue-50',
  Pearson: 'bg-indigo-50',
  'Google Classroom': 'bg-green-50',
  Unknown: 'bg-gray-50',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function CalendarView() {
  const { assignments } = useAssignmentStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Group assignments by date (local date string)
  const assignmentsByDate = useMemo(() => {
    const map: Record<string, Assignment[]> = {};
    for (const a of assignments) {
      if (!a.due_date || a.deleted) continue;
      const d = new Date(a.due_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!map[key]) map[key] = [];
      map[key].push(a);
    }
    return map;
  }, [assignments]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Build calendar grid cells
  const cells: { day: number | null; dateStr: string }[] = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: null, dateStr: '' });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, dateStr });
  }

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(todayStr);
  };

  const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const selectedAssignments = selectedDate ? (assignmentsByDate[selectedDate] || []) : [];

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">{monthLabel}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-medium text-primary border border-primary/30 rounded-md hover:bg-primary/5 transition-colors"
          >
            Today
          </button>
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Calendar grid */}
        <div className="flex-1 flex flex-col">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Date cells */}
          <div className="grid grid-cols-7 flex-1 auto-rows-fr gap-px bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
            {cells.map((cell, i) => {
              if (cell.day === null) {
                return <div key={`empty-${i}`} className="bg-gray-50/50" />;
              }

              const dayAssignments = assignmentsByDate[cell.dateStr] || [];
              const isToday = cell.dateStr === todayStr;
              const isSelected = cell.dateStr === selectedDate;
              const hasAssignments = dayAssignments.length > 0;
              const hasOverdue = dayAssignments.some(a => a.status !== 'completed' && new Date(a.due_date!).getTime() < Date.now());

              return (
                <button
                  key={cell.dateStr}
                  onClick={() => setSelectedDate(isSelected ? null : cell.dateStr)}
                  className={`bg-white p-1.5 text-left flex flex-col transition-colors relative ${
                    isSelected ? 'ring-2 ring-primary ring-inset' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-xs font-medium leading-none inline-flex items-center justify-center w-6 h-6 rounded-full ${
                    isToday
                      ? 'bg-primary text-white'
                      : isSelected
                        ? 'text-primary'
                        : 'text-gray-700'
                  }`}>
                    {cell.day}
                  </span>

                  {/* Assignment dots */}
                  {hasAssignments && (
                    <div className="flex flex-wrap gap-0.5 mt-1">
                      {dayAssignments.slice(0, 3).map(a => (
                        <span
                          key={a.id}
                          className={`w-1.5 h-1.5 rounded-full ${
                            a.status === 'completed'
                              ? 'bg-green-400'
                              : hasOverdue
                                ? 'bg-red-400'
                                : platformColors[a.platform] || platformColors.Unknown
                          }`}
                          title={a.title}
                        />
                      ))}
                      {dayAssignments.length > 3 && (
                        <span className="text-[9px] text-gray-400 leading-none">+{dayAssignments.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail panel */}
        {selectedDate && (
          <div className="w-72 shrink-0 bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {selectedAssignments.length
                  ? `${selectedAssignments.length} assignment${selectedAssignments.length > 1 ? 's' : ''}`
                  : 'No assignments due'}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {selectedAssignments.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-xs text-gray-400">
                  Nothing due this day
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedAssignments.map(a => (
                    <AssignmentPill key={a.id} assignment={a} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AssignmentPill({ assignment }: { assignment: Assignment }) {
  const { updateAssignment } = useAssignmentStore();
  const isCompleted = assignment.status === 'completed';
  const isOverdue = assignment.due_date && new Date(assignment.due_date).getTime() < Date.now() && !isCompleted;
  const textColor = platformTextColors[assignment.platform] || platformTextColors.Unknown;
  const bgColor = platformBgColors[assignment.platform] || platformBgColors.Unknown;

  const toggleComplete = () => {
    updateAssignment(assignment.id, {
      status: isCompleted ? 'pending' : 'completed',
    });
  };

  const time = assignment.due_date
    ? new Date(assignment.due_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : '';

  return (
    <div className={`rounded-lg p-3 ${bgColor} ${isCompleted ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-2">
        <button
          onClick={toggleComplete}
          className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
            isCompleted
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-300 hover:border-primary'
          }`}
        >
          {isCompleted && (
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className={`text-xs font-semibold ${isCompleted ? 'line-through text-gray-400' : textColor}`}>
            {assignment.title}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {assignment.course && (
              <span className="text-[10px] text-gray-500 truncate">{assignment.course}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] font-medium ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
              {time}
              {isOverdue && ' (Overdue)'}
            </span>
            <span className={`text-[10px] font-medium ${textColor}`}>{assignment.platform}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
