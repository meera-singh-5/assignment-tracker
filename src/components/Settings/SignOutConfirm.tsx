interface Props {
  onConfirm: () => void;
  onCancel: () => void;
}

export function SignOutConfirm({ onConfirm, onCancel }: Props) {
  return (
    <div>
      <p className="text-sm text-black mb-3">Are you sure you want to sign out?</p>
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          className="flex-1 px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
        >
          Yes, I want to sign out
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-3 py-2 text-sm font-medium text-black border border-black rounded-md hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
