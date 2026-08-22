interface Props {
  onCancel: () => void;
}

export function SigningInScreen({ onCancel }: Props) {
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-50 to-white">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full mx-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-black mb-2">Waiting for Google sign-in</h1>
        <p className="text-black mb-6">
          Finish signing in in the browser window that just opened. This screen will update automatically once you're done.
        </p>
        <button
          onClick={onCancel}
          className="w-full border border-black py-3 px-4 rounded-lg font-medium text-black hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
