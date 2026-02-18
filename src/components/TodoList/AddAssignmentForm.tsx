import { useState } from 'react';
import { useAssignmentStore } from '../../stores/assignmentStore';

const PLATFORMS = ['WebAssign', 'Brightspace', 'Gradescope', 'Canvas', 'Blackboard', 'Pearson', 'Google Classroom', 'Other'];

export function AddAssignmentForm({ onClose }: { onClose: () => void }) {
  const { createAssignment } = useAssignmentStore();
  const [title, setTitle] = useState('');
  const [course, setCourse] = useState('');
  const [platform, setPlatform] = useState('Other');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('23:59');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);

    let due_date: string | null = null;
    if (dueDate) {
      const dt = new Date(`${dueDate}T${dueTime || '23:59'}`);
      if (!isNaN(dt.getTime())) due_date = dt.toISOString();
    }

    await createAssignment({
      title: title.trim(),
      course: course.trim(),
      platform,
      due_date,
      link: '',
      needs_review: false,
    });

    setSubmitting(false);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-primary/30 p-4 shadow-sm">
      {/* Title */}
      <input
        type="text"
        placeholder="Assignment title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        autoFocus
        className="w-full text-sm font-medium text-gray-900 placeholder-gray-400 border-0 border-b border-gray-200 pb-2 mb-3 focus:outline-none focus:border-primary"
      />

      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Course */}
        <input
          type="text"
          placeholder="Course name"
          value={course}
          onChange={e => setCourse(e.target.value)}
          className="text-xs text-gray-700 placeholder-gray-400 border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-primary"
        />

        {/* Platform */}
        <select
          value={platform}
          onChange={e => setPlatform(e.target.value)}
          className="text-xs text-gray-700 border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-primary bg-white"
        >
          {PLATFORMS.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Due date */}
        <input
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          className="text-xs text-gray-700 border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-primary"
        />

        {/* Due time */}
        <input
          type="time"
          value={dueTime}
          onChange={e => setDueTime(e.target.value)}
          className="text-xs text-gray-700 border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-primary"
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!title.trim() || submitting}
          className="px-4 py-1.5 text-xs font-medium text-white bg-primary rounded-md hover:bg-primary-hover disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Adding...' : 'Add'}
        </button>
      </div>
    </form>
  );
}
