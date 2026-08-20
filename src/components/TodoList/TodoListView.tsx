import { useEffect, useState } from 'react';
import { useAssignmentStore } from '../../stores/assignmentStore';
import { AssignmentCard } from '../AssignmentCard/AssignmentCard';
import { NeedsReviewSection } from './NeedsReviewSection';
import { AddAssignmentForm } from './AddAssignmentForm';
import { AssignmentDetailPanel } from './AssignmentDetailPanel';

export function TodoListView() {
  const { assignments, loading, scanning, fetchAssignments } = useAssignmentStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<'todo' | 'deleted'>('todo');

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const activeAssignments = assignments.filter(a => !a.deleted && !a.needs_review && a.status !== 'completed');
  const completedAssignments = assignments.filter(a => !a.deleted && !a.needs_review && a.status === 'completed');
  const needsReview = assignments.filter(a => !a.deleted && a.needs_review);
  const deletedAssignments = assignments.filter(a => a.deleted);
  const selectedAssignment = selectedId ? assignments.find(a => a.id === selectedId) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (assignments.length === 0 && !scanning) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-4xl mb-4">📋</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-1">No assignments yet</h3>
        <p className="text-sm text-gray-400">
          Click Refresh to scan your emails for assignments.
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-0 h-full -m-6">
      {/* Assignment list */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl">
          {scanning && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-blue-50 rounded-lg text-sm text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
              Scanning emails for assignments...
            </div>
          )}

          {/* Sub-tabs */}
          <div className="flex items-center gap-1 mb-4 border-b border-gray-200">
            <TabButton label="To-Do" active={tab === 'todo'} onClick={() => setTab('todo')} />
            <TabButton
              label={`Recently Deleted${deletedAssignments.length > 0 ? ` (${deletedAssignments.length})` : ''}`}
              active={tab === 'deleted'}
              onClick={() => setTab('deleted')}
            />
          </div>

          {tab === 'todo' ? (
            <>
              {/* Add assignment */}
              <div className="mb-4">
                {showAddForm ? (
                  <AddAssignmentForm onClose={() => setShowAddForm(false)} />
                ) : (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors w-full"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add assignment
                  </button>
                )}
              </div>

              {/* Active assignments */}
              {activeAssignments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Active ({activeAssignments.length})
                  </h3>
                  <div className="space-y-2">
                    {activeAssignments.map((a) => (
                      <AssignmentCard
                        key={a.id}
                        assignment={a}
                        selected={a.id === selectedId}
                        onSelect={() => setSelectedId(a.id === selectedId ? null : a.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Needs review */}
              <NeedsReviewSection assignments={needsReview} />

              {/* Completed */}
              {completedAssignments.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">
                    Completed ({completedAssignments.length})
                  </h3>
                  <div className="space-y-2">
                    {completedAssignments.map((a) => (
                      <AssignmentCard
                        key={a.id}
                        assignment={a}
                        selected={a.id === selectedId}
                        onSelect={() => setSelectedId(a.id === selectedId ? null : a.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Recently deleted */
            <div>
              {deletedAssignments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <p className="text-sm text-gray-400">No recently deleted assignments.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {deletedAssignments.map((a) => (
                    <AssignmentCard
                      key={a.id}
                      assignment={a}
                      selected={a.id === selectedId}
                      onSelect={() => setSelectedId(a.id === selectedId ? null : a.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selectedAssignment && (
        <AssignmentDetailPanel
          assignment={selectedAssignment}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
    </button>
  );
}
