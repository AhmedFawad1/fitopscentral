'use client';

import { useSearchParams, useRouter } from 'next/navigation';

export default function AuthErrorPage() {
  const params = useSearchParams();
  const router = useRouter();
  const code = params.get('code');

  const messages = {
    otp_expired: {
      title: "Link expired 🕰️",
      message: "That reset link has expired. Please request a new one."
    },
    access_denied: {
      title: "Access denied 🚫",
      message: "You don’t have permission to use this link."
    },
    unknown: {
      title: "Something went wrong 😕",
      message: "Please try again."
    }
  };

  const { title, message } =
    messages[code] || messages.unknown;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-gray-600">{message}</p>

        <button
          onClick={() => router.push('/forgot-password')}
          className="btn-primary"
        >
          Request new link
        </button>
      </div>
    </div>
  );
}
