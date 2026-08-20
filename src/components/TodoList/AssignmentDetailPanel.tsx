import { useState, useEffect } from 'react';
import type { Assignment } from '../../types/assignment';
import { useAssignmentStore } from '../../stores/assignmentStore';

const PLATFORMS = ['WebAssign', 'Brightspace', 'Gradescope', 'Canvas', 'Blackboard', 'Pearson', 'Google Classroom', 'Other'];

interface Props {
  assignment: Assignment;
  onClose: () => void;
}

export function AssignmentDetailPanel({ assignment, onClose }: Props) {
  const { updateAssignment, deleteAssignment } = useAssignmentStore();

  const [title, setTitle] = useState(assignment.title);
  const [course, setCourse] = useState(assignment.course);
  const [platform, setPlatform] = useState(assignment.platform);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [notes, setNotes] = useState(assignment.notes);
  const [dirty, setDirty] = useState(false);

  // Reset form when assignment changes
  useEffect(() => {
    setTitle(assignment.title);
    setCourse(assignment.course);
    setPlatform(assignment.platform);
    setNotes(assignment.notes);
    setDirty(false);

    if (assignment.due_date) {
      const d = new Date(assignment.due_date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      setDueDate(`${year}-${month}-${day}`);
      setDueTime(`${hours}:${mins}`);
    } else {
      setDueDate('');
      setDueTime('');
    }
  }, [assignment]);

  const markDirty = () => { if (!dirty) setDirty(true); };

  const handleSave = async () => {
    let due_date: string | null = null;
    if (dueDate) {
      const dt = new Date(`${dueDate}T${dueTime || '23:59'}`);
      if (!isNaN(dt.getTime())) due_date = dt.toISOString();
    }

    await updateAssignment(assignment.id, {
      title: title.trim() || assignment.title,
      course: course.trim(),
      platform,
      due_date,
      notes: notes.trim(),
      needs_review: false,
    });

    setDirty(false);
  };

  const isCompleted = assignment.status === 'completed';

  const toggleComplete = () => {
    updateAssignment(assignment.id, {
      status: isCompleted ? 'pending' : 'completed',
    });
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${assignment.title}" forever? This cannot be undone.`)) return;
    await deleteAssignment(assignment.id);
    onClose();
  };

  return (
    <div className="w-80 shrink-0 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800">Assignment Details</h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 transition-colors"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Status toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleComplete}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              isCompleted
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {isCompleted ? 'Completed' : 'Mark complete'}
          </button>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={e => { setTitle(e.target.value); markDirty(); }}
            className="w-full text-sm text-gray-900 border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-primary"
          />
        </div>

        {/* Course */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Course</label>
          <input
            type="text"
            value={course}
            onChange={e => { setCourse(e.target.value); markDirty(); }}
            className="w-full text-sm text-gray-700 border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-primary"
          />
        </div>

        {/* Platform */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Platform</label>
          <select
            value={platform}
            onChange={e => { setPlatform(e.target.value); markDirty(); }}
            className="w-full text-sm text-gray-700 border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-primary bg-white"
          >
            {PLATFORMS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Due date & time */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => { setDueDate(e.target.value); markDirty(); }}
              className="w-full text-sm text-gray-700 border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Due time</label>
            <input
              type="time"
              value={dueTime}
              onChange={e => { setDueTime(e.target.value); markDirty(); }}
              className="w-full text-sm text-gray-700 border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={e => { setNotes(e.target.value); markDirty(); }}
            placeholder="Add notes..."
            rows={5}
            className="w-full text-sm text-gray-700 border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-primary resize-none"
          />
        </div>

        {/* Delete */}
        <button
          onClick={handleDelete}
          className="w-full px-3 py-2 text-xs font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
        >
          Delete assignment forever
        </button>

        {/* Link */}
        {assignment.link && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Link</label>
            <a
              href={assignment.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline break-all"
            >
              {assignment.link}
            </a>
          </div>
        )}
      </div>

      {/* Save button */}
      {dirty && (
        <div className="px-4 py-3 border-t border-gray-100">
          <button
            onClick={handleSave}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover transition-colors"
          >
            Save changes
          </button>
        </div>
      )}
    </div>
  );
}
