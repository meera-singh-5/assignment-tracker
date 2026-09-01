import { useState, useMemo } from 'react';
import { useAssignmentStore } from '../../stores/assignmentStore';
import type { Assignment } from '../../types/assignment';
import { AssignmentDetailPanel } from '../TodoList/AssignmentDetailPanel';

const platformTextColors: Record<string, string> = {
  Gradescope: 'text-teal-700',
  Brightspace: 'text-orange-700',
  Canvas: 'text-red-700',
  Blackboard: 'text-black',
  WebAssign: 'text-blue-700',
  Pearson: 'text-indigo-700',
  'Google Classroom': 'text-green-700',
  Unknown: 'text-black',
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

// Neutral fallback for assignments with no chosen color, so previews stay visible
const DEFAULT_COURSE_COLOR = '#000000';

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
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);

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
    if (selectedDate === todayStr) {
      setSelectedDate(null);
      return;
    }
    setCurrentDate(new Date());
    setSelectedDate(todayStr);
  };

  const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const selectedAssignments = selectedDate ? (assignmentsByDate[selectedDate] || []) : [];
  const selectedAssignmentDetail = selectedAssignmentId
    ? assignments.find(a => a.id === selectedAssignmentId) ?? null
    : null;

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-black">{monthLabel}</h2>
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
            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div key={day} className="text-center text-xs font-medium text-black py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Date cells */}
          <div className="grid grid-cols-7 flex-1 auto-rows-fr gap-px bg-gray-100 rounded-lg overflow-hidden border border-black">
            {cells.map((cell, i) => {
              if (cell.day === null) {
                return <div key={`empty-${i}`} className="bg-gray-50/50" />;
              }

              const dayAssignments = assignmentsByDate[cell.dateStr] || [];
              const completedAssignments = dayAssignments.filter(a => a.status === 'completed');
              const activeAssignments = dayAssignments.filter(a => a.status !== 'completed');
              const isToday = cell.dateStr === todayStr;
              const isSelected = cell.dateStr === selectedDate;
              const hasOverdue = activeAssignments.some(a => new Date(a.due_date!).getTime() < Date.now());

              return (
                <button
                  key={cell.dateStr}
                  onClick={() => setSelectedDate(isSelected ? null : cell.dateStr)}
                  className={`bg-white p-1.5 text-left flex flex-col transition-colors relative ${
                    isSelected ? 'ring-2 ring-primary ring-inset' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-medium leading-none inline-flex items-center justify-center w-6 h-6 rounded-full shrink-0 ${
                      isToday
                        ? 'bg-primary text-white'
                        : isSelected
                          ? 'text-primary'
                          : 'text-black'
                    }`}>
                      {cell.day}
                    </span>

                    {/* Completed assignments collapse to a dot in their chosen color */}
                    {completedAssignments.length > 0 && (
                      <div className="flex items-center gap-0.5 flex-wrap">
                        {completedAssignments.map(a => (
                          <span
                            key={a.id}
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: a.course_color || DEFAULT_COURSE_COLOR }}
                            title={a.title}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Active assignment previews */}
                  {activeAssignments.length > 0 && (
                    <div className="space-y-0.5 mt-1 min-w-0">
                      {activeAssignments.slice(0, 3).map(a => {
                        const statusClass = hasOverdue ? 'bg-red-400' : '';
                        return (
                          <div
                            key={a.id}
                            className={`px-1 py-0.5 rounded text-[9px] leading-tight text-white truncate ${statusClass}`}
                            style={statusClass ? undefined : { backgroundColor: a.course_color || DEFAULT_COURSE_COLOR }}
                            title={a.title}
                          >
                            {a.title}
                          </div>
                        );
                      })}
                      {activeAssignments.length > 3 && (
                        <span className="text-[9px] text-black leading-none">+{activeAssignments.length - 3}</span>
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
          <div className="w-72 shrink-0 bg-white border border-black rounded-lg overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-black">
              <h3 className="text-sm font-semibold text-black">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </h3>
              <p className="text-xs text-black mt-0.5">
                {selectedAssignments.length
                  ? `${selectedAssignments.length} assignment${selectedAssignments.length > 1 ? 's' : ''}`
                  : 'No assignments due'}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {selectedAssignments.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-xs text-black">
                  Nothing due this day
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedAssignments.map(a => (
                    <AssignmentPill
                      key={a.id}
                      assignment={a}
                      onSelect={() => setSelectedAssignmentId(a.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Assignment detail panel */}
        {selectedAssignmentDetail && (
          <AssignmentDetailPanel
            assignment={selectedAssignmentDetail}
            onClose={() => setSelectedAssignmentId(null)}
          />
        )}
      </div>
    </div>
  );
}

function AssignmentPill({ assignment, onSelect }: { assignment: Assignment; onSelect: () => void }) {
  const { updateAssignment } = useAssignmentStore();
  const isCompleted = assignment.status === 'completed';
  const isOverdue = assignment.due_date && new Date(assignment.due_date).getTime() < Date.now() && !isCompleted;
  const textColor = platformTextColors[assignment.platform] || platformTextColors.Unknown;
  const bgColor = platformBgColors[assignment.platform] || platformBgColors.Unknown;

  const toggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateAssignment(assignment.id, {
      status: isCompleted ? 'pending' : 'completed',
    });
  };

  const time = assignment.due_date
    ? new Date(assignment.due_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : '';

  return (
    <div
      onClick={onSelect}
      className={`rounded-lg p-3 cursor-pointer transition-opacity ${bgColor} ${isCompleted ? 'opacity-60' : 'hover:opacity-80'}`}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={toggleComplete}
          className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
            isCompleted
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-black hover:border-primary'
          }`}
        >
          {isCompleted && (
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className={`text-xs font-semibold ${isCompleted ? 'line-through text-black' : textColor}`}>
            {assignment.title}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {assignment.course && (
              <span className="text-[10px] text-black truncate">{assignment.course}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] font-medium ${isOverdue ? 'text-red-500' : 'text-black'}`}>
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
