import type { Assignment } from '../../types/assignment';
import { AssignmentCard } from '../AssignmentCard/AssignmentCard';

interface NeedsReviewSectionProps {
  assignments: Assignment[];
}

export function NeedsReviewSection({ assignments }: NeedsReviewSectionProps) {
  if (assignments.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-yellow-400" />
        <h3 className="text-sm font-semibold text-gray-700">
          Needs Review ({assignments.length})
        </h3>
      </div>
      <p className="text-xs text-gray-400 mb-3">
        These assignments couldn't be fully parsed. Please verify the details.
      </p>
      <div className="space-y-2">
        {assignments.map((a) => (
          <AssignmentCard key={a.id} assignment={a} />
        ))}
      </div>
    </div>
  );
}
