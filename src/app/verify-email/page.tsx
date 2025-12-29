import Link from 'next/link';

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100">
          <svg
            className="h-10 w-10 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Verify your email
          </h2>
          <p className="text-gray-600 mb-2">
            We've sent a confirmation email to your inbox.
          </p>
          <p className="text-gray-600 mb-6">
            Please click the verification link in the email to activate your account.
          </p>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 text-left">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Didn't receive the email?</strong>
                <br />
                Check your spam folder or contact support if you need help.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/login"
            className="block w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-center font-medium"
          >
            Go to Login
          </Link>
          
          <Link
            href="/"
            className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-center font-medium"
          >
            Back to Home
          </Link>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Having trouble? Contact{' '}
            <a href="mailto:support@ecms.com" className="text-blue-600 hover:text-blue-500">
              support@ecms.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
