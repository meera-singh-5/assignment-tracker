interface Props {
  message: string;
  canGoBack: boolean;
  onDismiss: () => void;
}

export function AuthErrorScreen({ message, canGoBack, onDismiss }: Props) {
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-50 to-white">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full mx-4 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-black mb-2">Sign-in failed</h1>
        <p className="text-black mb-6">{message}</p>
        <button
          onClick={onDismiss}
          className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-hover transition-colors"
        >
          {canGoBack ? 'Go back' : 'Back to sign-in'}
        </button>
      </div>
    </div>
  );
}
